# Guía de prompts para Cursor

Órdenes pensadas para pegar en el chat de Cursor (modo Agent), en este orden. Antes de empezar, sube `ARQUITECTURA.md` y `mockup.html` al repositorio para que Cursor pueda referenciarlos como contexto en cada prompt.

## 1. Inicializar el proyecto

```
Inicializa un proyecto Next.js 14 con App Router, TypeScript y Tailwind CSS
en la carpeta actual. Configura ESLint y Prettier con reglas estándar.
No sobrescribas el README.md, LICENSE ni .gitignore que ya existen.
```

## 2. Instalar dependencias base

```
Instala las dependencias: @supabase/supabase-js, @supabase/ssr, mapbox-gl,
react-map-gl, zod, react-hook-form. Añádelas al package.json.
```

## 3. Cliente de Supabase

```
Crea en /lib/supabase el cliente de Supabase para el navegador y el cliente
para el servidor (server components), usando las variables de entorno
NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY definidas en
.env.example. Sigue el patrón recomendado por @supabase/ssr para Next.js
App Router.
```

## 4. Esquema de base de datos

```
Lee ARQUITECTURA.md, sección 4 (modelo de datos). Genera los archivos SQL
de migración en /supabase/migrations para las tablas: users, gas_stations,
fuel_prices, price_confirmations, station_photos, comments, xp_events,
missions, user_missions y territories. Incluye claves foráneas, índices en
las columnas de ubicación y de fecha, y políticas de Row Level Security
básicas (cada usuario solo puede editar sus propios registros).
```

## 5. Pantalla de bienvenida y autenticación

```
Usa docs/mockup.html como referencia visual (pantalla 00 y 01). Crea la
ruta /app/auth con: pantalla de bienvenida, formulario de email, y
verificación de código OTP usando signInWithOtp de Supabase Auth. Al
verificar el código, redirige a /map.
```

## 6. Mapa principal

```
Usa docs/mockup.html como referencia visual (pantalla 02). Crea la ruta
/app/map con Mapbox GL (react-map-gl), mostrando la ubicación del usuario
y marcadores de gasolineras con colores según el precio (verde barato,
ámbar medio, rojo caro). Añade la tarjeta flotante inferior con la
gasolinera más barata y su distancia.
```

## 7. Ficha de gasolinera

```
Usa docs/mockup.html como referencia visual (pantalla 03). Crea la ruta
/app/station/[id] mostrando precios por tipo de combustible, servicios,
fotos, comentarios, y los botones de confirmación de precio (arriba/abajo).
```

## 8. Reporte rápido de precio

```
Usa docs/mockup.html como referencia visual (pantalla 04). Crea un
componente de hoja inferior (bottom sheet) para reportar un precio nuevo:
selector de tipo de combustible, input numérico de precio, y subida
opcional de foto a Supabase Storage.
```

## 9. Sistema de gamificación

```
Lee ARQUITECTURA.md, sección 6. Crea una función de Supabase (Edge
Function o trigger SQL) que, al insertarse un evento en xp_events, actualice
el total de XP, el nivel y la racha del usuario correspondiente en la tabla
users.
```

## 10. Perfil

```
Usa docs/mockup.html como referencia visual (pantalla 05). Crea la ruta
/app/profile mostrando el nivel actual como un gauge (indicador circular),
la racha, el número de reportes y las insignias desbloqueadas.
```

## 11. Misiones y ranking

```
Usa docs/mockup.html como referencia visual (pantalla 06). Crea la ruta
/app/missions con las misiones activas del usuario (con barra de progreso)
y el ranking de usuarios por zona geográfica.
```

## 12. Navegación

```
Añade una barra de navegación inferior fija (Mapa / Misiones / Perfil)
visible en las rutas /map, /missions y /profile, tal como se ve en
docs/mockup.html.
```

## 13. Tema claro/oscuro

```
Implementa un sistema de tema claro y oscuro con Tailwind CSS (modo
"class"). El tema claro es el predeterminado; respeta la preferencia del
sistema del usuario (prefers-color-scheme) solo en el primer arranque, y
guarda la elección manual del usuario si cambia de tema desde el perfil.
Aplica el toggle a todas las rutas ya creadas (/map, /station, /profile,
/missions).
```

## 14. Convertir en PWA

```
Configura el proyecto como PWA instalable: manifest.json con nombre,
iconos y colores del tema, y un service worker básico con caché de los
recursos estáticos. Usa next-pwa o la configuración nativa de Next.js
para App Router.
```

## 15. Revisión final antes de desplegar

```
Revisa que ninguna clave de Supabase ni de Mapbox esté hardcodeada en el
código, que .env.local esté en .gitignore, y que las políticas de Row
Level Security cubran todas las tablas con datos de usuario.
```

---

Recomendación general: pide a Cursor un paso a la vez y revisa el resultado antes de pasar al siguiente prompt. Si un paso genera algo que no encaja, corrígelo antes de avanzar; encadenar pasos sobre una base con errores multiplica el trabajo de arreglarlo después.
