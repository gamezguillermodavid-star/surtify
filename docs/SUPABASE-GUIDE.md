# Guía de configuración de Supabase

Pasos a seguir directamente en el panel de Supabase (supabase.com), antes o en paralelo al trabajo en Cursor.

## 1. Crear el proyecto

- Crea un proyecto nuevo en Supabase (plan free para empezar, según lo que ya tienes decidido).
- Elige una región cercana a España (Frankfurt, `eu-central-1`, suele ser la más rápida).
- Guarda la contraseña de la base de datos en un gestor de contraseñas, no en el repositorio.

## 2. Autenticación por OTP (sin contraseña)

- En **Authentication → Providers**, activa **Email**.
- Desactiva "Confirm email" con enlace y activa el envío de **código OTP** en su lugar (Supabase permite elegir entre magic link y código de un solo uso en la plantilla de email).
- En **Authentication → Email Templates**, personaliza la plantilla "Magic Link / OTP" con el texto que verá el usuario al recibir el código.
- En **Authentication → Rate Limits**, revisa el límite de envíos de OTP por hora para evitar abuso (por ejemplo, alguien pidiendo códigos en bucle).

## 3. Base de datos

- Ejecuta las migraciones SQL que genere Cursor (paso 4 de `CURSOR-PROMPTS.md`) desde **SQL Editor** o mediante la CLI de Supabase (`supabase db push`).
- Verifica en **Table Editor** que se han creado todas las tablas: `users`, `gas_stations`, `fuel_prices`, `price_confirmations`, `station_photos`, `comments`, `xp_events`, `missions`, `user_missions`, `territories`.
- Activa **Row Level Security (RLS)** en todas las tablas que contienen datos de usuario (está desactivado por defecto en tablas nuevas).

## 4. Storage para fotos

- Crea un bucket llamado `station-photos` en **Storage**.
- Configúralo como público en lectura (para que las fotos se vean en la app), pero con política de escritura restringida a usuarios autenticados.
- Limita el tamaño máximo por archivo (por ejemplo, 5 MB) para controlar el coste de almacenamiento.

## 5. Funciones para la gamificación

- En **Database → Functions**, crea la función (o usa una Edge Function) que Cursor genere en el paso 9 de `CURSOR-PROMPTS.md`, encargada de actualizar XP, nivel y racha cuando se inserta un evento en `xp_events`.
- Prueba la función manualmente insertando un registro de ejemplo en `xp_events` y comprobando que el usuario correspondiente actualiza su XP en la tabla `users`.

## 6. Variables de entorno

- En **Project Settings → API**, copia:
  - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
  - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `service_role key` → `SUPABASE_SERVICE_ROLE_KEY` (solo para uso en servidor, nunca en el frontend)
- Pega estos valores en tu `.env.local` (nunca en `.env.example`, que debe quedarse vacío).

## 7. Backups y límites del plan free

- El plan free no incluye backups automáticos a largo plazo; revisa la política de retención vigente en el panel de Supabase.
- Si el proyecto empieza a recibir tráfico real y no quieres perder datos de la comunidad, este es el primer límite a vigilar antes que el de cómputo o ancho de banda.

## 8. Antes de pasar a producción

- Revisa que las políticas de RLS impiden que un usuario pueda leer o modificar datos de otro usuario que no le correspondan (perfil, fotos, comentarios).
- Comprueba que el `service_role key` no aparece en ningún archivo del repositorio.
