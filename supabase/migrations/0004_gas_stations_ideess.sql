-- Añade una columna para vincular cada gasolinera con su ID oficial en el
-- listado de EESS del Ministerio para la Transición Ecológica (IDEESS).
-- Sirve como clave de upsert para el importador (scripts/import-gas-stations.mjs),
-- así una gasolinera no se duplica si se vuelve a importar la misma provincia.
-- Las gasolineras añadidas a mano por la comunidad se quedan con ideess = null,
-- lo cual está permitido (unique no bloquea múltiples nulos).

alter table public.gas_stations
  add column if not exists ideess text;

alter table public.gas_stations
  add constraint gas_stations_ideess_key unique (ideess);
