#!/usr/bin/env node
// scripts/import-gas-stations.mjs
//
// Importa gasolineras reales desde la API pública y gratuita del
// Ministerio para la Transición Ecológica (no hace falta API key) y las
// guarda (upsert) en Supabase junto con sus precios oficiales actuales.
//
// Uso:
//   node scripts/import-gas-stations.mjs 08
//   node scripts/import-gas-stations.mjs 08,17,25,43   (Cataluña entera)
//
// Códigos de provincia (IDProvincia) más habituales para ir escalando:
//   Cataluña: 08 Barcelona, 17 Girona, 25 Lleida, 43 Tarragona
// Para el resto de códigos, la propia API los lista en:
//   https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/Listados/Provincias/
//
// Se puede volver a ejecutar sin miedo a duplicar gasolineras: cada una
// se identifica por su IDEESS oficial (columna `ideess`), así que un
// segundo pase actualiza nombre/dirección/coordenadas en vez de repetirlas.
// Los precios sí se guardan como una fila nueva en cada ejecución (igual
// que un reporte de un usuario), para llevar un histórico.
//
// Requiere en .env.local:
//   NEXT_PUBLIC_SUPABASE_URL=...
//   SUPABASE_SERVICE_ROLE_KEY=...  (Project Settings > API > service_role,
//                                   hace falta porque esta escritura salta la RLS)

import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const API_BASE =
  'https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/FiltroProvincia';

const FUEL_FIELD_MAP = {
  diesel: 'Precio Gasoleo A',
  gasolina_95: 'Precio Gasolina 95 E5',
  gasolina_98: 'Precio Gasolina 98 E5',
  glp: 'Precio Gases licuados del petróleo',
};

const CHUNK_SIZE = 500;

function loadEnvLocal() {
  const path = new URL('../.env.local', import.meta.url);
  let content;
  try {
    content = readFileSync(path, 'utf8');
  } catch {
    console.error('No encuentro .env.local en la raíz del proyecto.');
    process.exit(1);
  }
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function parseSpanishNumber(value) {
  if (!value) return null;
  const normalized = String(value).replace(',', '.').trim();
  if (normalized === '') return null;
  const num = Number(normalized);
  return Number.isFinite(num) ? num : null;
}

function titleCase(text) {
  if (!text) return text;
  const lower = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'y']);
  return text
    .toLowerCase()
    .split(' ')
    .map((word, i) =>
      i > 0 && lower.has(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(' ');
}

function buildAddress(raw) {
  const parts = [raw['Dirección']?.trim()].filter(Boolean);
  const cpMunicipio = [raw['C.P.'], raw['Municipio']].filter(Boolean).join(' ');
  if (cpMunicipio) parts.push(cpMunicipio);
  if (raw['Provincia']) parts.push(titleCase(raw['Provincia']));
  return parts.join(', ');
}

async function fetchProvince(idProvincia) {
  const res = await fetch(`${API_BASE}/${idProvincia}`);
  if (!res.ok) {
    throw new Error(`Fallo al pedir la provincia ${idProvincia}: HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.ListaEESSPrecio ?? [];
}

async function main() {
  loadEnvLocal();

  const provinceArg = process.argv[2];
  if (!provinceArg) {
    console.error('Uso: node scripts/import-gas-stations.mjs <codigo_provincia[,codigo,...]>');
    console.error('Ejemplo (Cataluña entera): node scripts/import-gas-stations.mjs 08,17,25,43');
    process.exit(1);
  }
  const provinceCodes = provinceArg.split(',').map((c) => c.trim());

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local');
    process.exit(1);
  }
  const supabase = createClient(supabaseUrl, serviceKey);

  let allStations = [];
  for (const code of provinceCodes) {
    console.log(`Descargando gasolineras de la provincia ${code}...`);
    const stations = await fetchProvince(code);
    console.log(`  -> ${stations.length} gasolineras`);
    allStations = allStations.concat(stations);
  }
  console.log(`Total a importar: ${allStations.length}`);

  const rows = allStations
    .map((raw) => ({
      ideess: raw['IDEESS'],
      name: raw['Rótulo']?.trim() || 'Gasolinera',
      brand: raw['Rótulo']?.trim() || null,
      address: buildAddress(raw),
      latitude: parseSpanishNumber(raw['Latitud']),
      longitude: parseSpanishNumber(raw['Longitud (WGS84)']),
    }))
    .filter((r) => r.ideess && r.latitude != null && r.longitude != null);

  console.log('Guardando gasolineras en Supabase (upsert por ideess)...');
  const stationIdByIdeess = new Map();

  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    const { data, error } = await supabase
      .from('gas_stations')
      .upsert(chunk, { onConflict: 'ideess' })
      .select('id, ideess');
    if (error) {
      console.error('Error guardando gasolineras:', error.message);
      process.exit(1);
    }
    for (const row of data) {
      stationIdByIdeess.set(row.ideess, row.id);
    }
    console.log(`  guardadas ${Math.min(i + CHUNK_SIZE, rows.length)}/${rows.length}`);
  }

  console.log('Guardando precios oficiales actuales...');
  const priceRows = [];
  for (const raw of allStations) {
    const stationId = stationIdByIdeess.get(raw['IDEESS']);
    if (!stationId) continue;
    for (const [fuelType, field] of Object.entries(FUEL_FIELD_MAP)) {
      const price = parseSpanishNumber(raw[field]);
      if (price == null) continue;
      priceRows.push({ station_id: stationId, fuel_type: fuelType, price });
    }
  }

  for (let i = 0; i < priceRows.length; i += CHUNK_SIZE) {
    const chunk = priceRows.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase.from('fuel_prices').insert(chunk);
    if (error) {
      console.error('Error guardando precios:', error.message);
      process.exit(1);
    }
    console.log(`  precios guardados ${Math.min(i + CHUNK_SIZE, priceRows.length)}/${priceRows.length}`);
  }

  console.log('Listo.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
