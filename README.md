# Surtify: precios de gasolineras en comunidad

Aplicación para encontrar y compartir precios reales de gasolineras, mantenidos por una comunidad de usuarios en tiempo real. Mapa con geolocalización, confirmación de precios estilo Waze, y un sistema de progreso por niveles que convierte reportar un precio en algo parecido a jugar.

## Qué hace

- Mapa con cobertura nacional (España entera), la ubicación del usuario y la gasolinera más barata cercana; carga las gasolineras por la zona que estás viendo, no todas de golpe
- Buscador de gasolineras por nombre, marca o dirección, con alcance nacional
- Colorea el mapa (barato/medio/caro) por el combustible que elijas: diésel, gasolina 95, gasolina 98 o GLP; comparando cada gasolinera contra las que tiene cerca
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

## Empezar en local (solo autor y personas autorizadas)

```bash
git clone <url-del-repo>
cd surtify
npm install
cp .env.example .env.local   # rellena tus propias claves de Supabase y Mapbox
npm run dev
```

## Datos y privacidad

Los datos generados por la comunidad (precios,
