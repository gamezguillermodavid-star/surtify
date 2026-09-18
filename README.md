# Surtify — precios de gasolineras en comunidad

Aplicación de código abierto para encontrar y compartir precios reales de gasolineras, mantenidos por una comunidad de usuarios en tiempo real. Mapa con geolocalización, confirmación de precios estilo Waze, y un sistema de progreso por niveles que convierte reportar un precio en algo parecido a jugar.

## Qué hace

- Mapa con la ubicación del usuario y la gasolinera más barata cercana
- Buscador de gasolineras por nombre, marca o dirección
- Colorea el mapa (barato/medio/caro) por el combustible que elijas — diésel, gasolina 95, gasolina 98 o GLP — comparando cada gasolinera contra las que tiene cerca
- Precios reportados y confirmados por la comunidad, sin depender de fuentes oficiales con retraso, para diésel, gasolina 95/98, GLP, AdBlue, gasóleo premium/B y gasolina 95 premium
- Fichas de gasolinera con fotos, horario de apertura (real, importado del Ministerio), servicios (aseos, pago con tarjeta, tienda, aire y agua, lavado) y tiempo de espera, ambos reportados por la comunidad, y comentarios
- Sistema de niveles, rachas y misiones para incentivar los aportes
- Gasolineras favoritas con notificaciones push cuando alguien reporta un precio o una foto nueva
- Perfil con selector de tipo de conductor (particular / profesional)
- API pública de datos agregados (en desarrollo)

Documentación completa de la arquitectura técnica y del modelo de datos en [`ARQUITECTURA.md`](./ARQUITECTURA.md).

## Stack

Next.js · TypeScript · Tailwind CSS · Supabase (PostgreSQL + Auth) · Mapbox

## Estructura del proyecto

```
app/
  api/        → rutas de servidor (ej. envío de notificaciones push)
  auth/       → registro y verificación OTP
  map/        → pantalla principal del mapa
  station/    → ficha de gasolinera y reporte de precios
  profile/    → perfil, niveles e insignias
  missions/   → misiones semanales y ranking por zona
components/   → componentes de interfaz reutilizables
lib/          → utilidades y cliente de Supabase
public/
  sw.js       → service worker (notificaciones push)
supabase/
  migrations/ → esquema de la base de datos
docs/         → mockups y documentación adicional
```

## Empezar en local

```bash
git clone <url-del-repo>
cd surtify
npm install
cp .env.example .env.local   # rellena tus propias claves de Supabase y Mapbox
npm run dev
```

## Datos y privacidad

El código de este repositorio es público bajo licencia MIT. Los datos generados por la comunidad (precios, usuarios, fotos, comentarios) **no** se incluyen en el repositorio: viven en una instancia privada de Supabase y se gestionan mediante variables de entorno excluidas de `git` (ver `.env.example` y `.gitignore`).

## Desplegar en Vercel

1. Sube este repositorio a GitHub.
2. En Vercel, "Add New Project" → importa el repositorio. Vercel detecta Next.js automáticamente, no hace falta configuración adicional de build.
3. En **Project Settings → Environment Variables**, añade:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (privada, sin prefijo `NEXT_PUBLIC_` — la usa `app/api/notify-favorites` para leer favoritos y suscripciones)
   - `NEXT_PUBLIC_MAPBOX_TOKEN`
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (notificaciones push, generadas con `npx web-push generate-vapid-keys`)
4. Despliega. El proyecto arranca correctamente aunque estas variables no estén configuradas todavía (las pantallas de registro y mapa mostrarán errores solo al intentar usarlas, no al cargar).
5. Dominio propio: cuando compres `surtify.es`, añádelo en **Project Settings → Domains** y sigue las instrucciones de Vercel para apuntar el DNS.

## Pendiente antes de producción

Lista completa y con contexto en [`CLAUDE.md`](./CLAUDE.md#pendiente-en-el-orden-acordado). Resumen:

- Comparar el precio destacado de la ficha de gasolinera contra estaciones cercanas, no contra sí misma.
- Criterio real de desbloqueo de insignias.
- Ampliar la importación de datos a más provincias/comunidades autónomas.
- Mover la escritura de XP a una función de servidor en vez de un `update` directo desde el cliente.
- Decidir si se implementan zonas geográficas reales para "territorios".
- Manejo de errores: `loading.tsx` por sección, revisar errores ignorados en misiones/perfil, try/catch de red.
- El aviso de "espera reportada" no caduca: decidir un umbral para dejar de mostrarlo si nadie lo actualiza.

## Contribuir

Las pull requests son bienvenidas. Antes de proponer un cambio grande, abre un issue para comentarlo.

## Licencia

MIT — ver [`LICENSE`](./LICENSE).
