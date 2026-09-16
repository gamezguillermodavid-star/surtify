# Surtify — Arquitectura del proyecto

Surtify es una aplicación de código abierto para encontrar y compartir precios reales de gasolineras en España, construida por una comunidad de usuarios en tiempo real, sin depender únicamente de fuentes oficiales.

Este documento describe la arquitectura técnica y de producto del proyecto. Es un documento vivo: se actualizará a medida que el proyecto avance.

## 1. Visión

Las aplicaciones de precios de carburante existentes dependen de datos oficiales que se actualizan con retraso o de forma incompleta. Surtify propone un modelo distinto: una comunidad activa, con incentivos claros, que mantiene los precios actualizados casi en tiempo real, además de aportar contexto que ningún dato oficial ofrece (fotos del cartel de precios, servicios disponibles, estado real de la gasolinera).

El proyecto es de código abierto porque queremos que cualquier desarrollador pueda auditar cómo se calculan los precios de confianza, proponer mejoras, y porque creemos que la transparencia es parte del valor que ofrecemos al usuario final.

## 2. Alcance por fases

**Fase 1 — MVP**
- Registro por email con confirmación OTP
- Mapa con geolocalización del usuario y de gasolineras
- Reporte manual de precio por gasolinera y tipo de combustible
- Ficha de gasolinera con precio actual, distancia y servicios básicos
- Sistema de puntos y niveles (gamificación básica)

**Fase 2 — Comunidad avanzada**
- Confirmación de precios por otros usuarios (voto arriba/abajo)
- Peso de voto según reputación del usuario
- Fotos del cartel de precios y de las instalaciones
- Comentarios por gasolinera
- Rachas, misiones semanales y "territorios" por zona
- API pública de datos agregados (open data)

**Fase 3 — Alianzas y recompensas reales**
- Acuerdos con gasolineras o marcas para canjear puntos por descuentos
- Programa de fidelización basado en el historial de aportes de cada usuario

## 3. Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Next.js (App Router) + TypeScript |
| Estilos | Tailwind CSS + shadcn/ui |
| Backend / base de datos | Supabase (PostgreSQL + Row Level Security) |
| Autenticación | Supabase Auth (OTP por email) |
| Mapas | Mapbox GL JS o Google Maps API (a decidir según coste a escala) |
| Pagos (fase 3) | Stripe |
| Hosting | Vercel |
| CI/CD | GitHub Actions |

Se descarta Docker para mantener el despliegue simple mientras el proyecto está en fases tempranas.

## 4. Modelo de datos (resumen)

Tablas principales en PostgreSQL:

- `users` — perfil del usuario, nivel, XP total, racha actual (por aportes, no por días), reputación, tipo de perfil (particular o conductor profesional)
- `gas_stations` — ubicación, marca, servicios disponibles
- `fuel_prices` — precio actual por gasolinera y tipo de combustible, con marca de tiempo del último reporte
- `price_confirmations` — votos arriba o abajo sobre un precio reportado, con el peso calculado según la reputación de quien vota
- `station_photos` — fotos subidas por usuarios, asociadas a una gasolinera
- `comments` — comentarios de usuarios sobre una gasolinera
- `xp_events` — histórico de eventos que otorgan puntos (para calcular niveles y rachas sin tener que reconstruirlos cada vez)
- `missions` — misiones activas y su definición, con periodo (semanal o mensual) y perfil al que van dirigidas
- `user_missions` — progreso de cada usuario en las misiones activas
- `territories` — zona geográfica y usuario con más aportes recientes en ella
- `favorites` — gasolineras que un usuario marca como favoritas
- `push_subscriptions` — suscripciones de notificaciones push (Web Push) por usuario y dispositivo

No se almacena histórico de precios de cara al usuario (solo el precio vigente), aunque internamente sí se guarda el registro de eventos por trazabilidad y para el cálculo de reputación.

## 5. Autenticación

El registro se hace exclusivamente por email, sin contraseña: el usuario recibe un código OTP de un solo uso que confirma su identidad. Esto reduce fricción en el alta y evita la gestión de contraseñas, apoyándose en Supabase Auth. Tras la verificación inicial, la sesión queda guardada en el dispositivo (token de sesión de Supabase Auth) y el usuario entra directamente en aperturas posteriores, sin repetir el OTP salvo que cierre sesión, caduque el token o entre desde un dispositivo nuevo.

## 6. Sistema de gamificación

El objetivo del sistema de puntos es que aportar datos se sienta como jugar, no como rellenar un formulario. El diseño parte de una premisa importante: **un particular no repostea todas las semanas** (la media ronda una vez cada una o dos semanas), mientras que colectivos como taxistas, VTC, transportistas o repartidores repostan con mucha más frecuencia. El sistema no puede penalizar al uso esporádico ni premiar solo la constancia diaria, o dejará fuera a la mayoría de usuarios reales.

- **XP y niveles**: cada acción (reportar un precio, subir una foto, confirmar el precio de otro usuario) otorga puntos de experiencia. Acumular XP hace subir de nivel (Novato, Explorador, Guardián de precios, Leyenda de la carretera), y cada nivel desbloquea elementos visuales en el perfil y en el mapa.
- **Rachas por aportes, no por días**: la racha cuenta aportes consecutivos (reportar o confirmar un precio), sin importar cuánto tiempo pase entre uno y otro. Un particular con 6 aportes en tres meses tiene una racha de 6, igual de válida que la de alguien que la consigue en una semana.
- **Misiones semanales y mensuales**: las semanales encajan con quien repostea a menudo; se añaden misiones mensuales pensadas para el particular ocasional ("reporta 1 precio este mes"), para que también tenga un objetivo alcanzable.
- **Perfil de conductor profesional (opcional)**: el usuario puede marcarse como taxista, VTC, transportista o repartidor en el registro. Este perfil tiene sus propias misiones e insignias ("Kilómetros de confianza") y sirve además como segmentación real de cara a futuros acuerdos con gasolineras, ya que es el colectivo con mayor volumen de repostaje.
- **Notificaciones por contexto, no por frecuencia**: para el particular, avisar cuando baja el precio en su gasolinera favorita o en su ruta habitual es más efectivo que pedirle que abra la app a diario. *(Implementado parcialmente: notificación push al marcar una gasolinera como favorita y recibir un reporte de precio o foto nuevo. Falta la parte de "ruta habitual"; ver `CLAUDE.md` para el estado real.)*
- **Territorios**: el usuario con más aportes recientes en una zona se convierte en su referente temporal, generando competencia sana entre usuarios de la misma zona.

## 7. Reputación y calidad de datos

Cada voto de confirmación de precio no vale lo mismo: el peso del voto de un usuario crece con su reputación acumulada. Esto hace que sea difícil para una sola cuenta nueva alterar un precio ya confirmado por varios usuarios con historial, sin necesidad de moderación manual constante.

## 8. API pública

Como parte del compromiso de datos abiertos, se expondrá una API REST de solo lectura con los precios agregados y verificados por la comunidad, disponible gratuitamente para otros desarrolladores. Es, además, la pieza que más visibilidad técnica puede aportar al proyecto: cualquier desarrollador que la use en su propia aplicación referencia el proyecto original.

## 9. Moderación

Además del sistema de reputación, se contempla un panel básico de moderación para retirar contenido inapropiado (fotos o comentarios), y un sistema de reporte por parte de otros usuarios.

## 10. Interfaz

Tema **claro por defecto**, con opción de cambiar a tema oscuro desde el perfil o los ajustes. El uso principal de la app es al aire libre y a plena luz (repostando, comprobando el precio antes de entrar a una gasolinera), donde un fondo claro se lee mejor que uno oscuro. El tema oscuro queda disponible como preferencia para quien lo prefiera, respetando también la preferencia del sistema operativo del usuario (`prefers-color-scheme`) en el primer arranque.

## 11. Despliegue y distribución

**Formato**: PWA (Progressive Web App), no app nativa de tienda para el MVP. Se instala desde el navegador ("Añadir a pantalla de inicio"), sin pasar por revisión de Apple o Google, y si el proyecto gana tracción se puede envolver con Capacitor para publicarla en las tiendas sin reescribir el código base.

**Dominio propio**: recomendado desde el inicio del proyecto, aunque el nombre de la app aún esté por definir. Da más credibilidad al manifest de la PWA y a los correos de verificación OTP, y evita depender de un subdominio de la plataforma de hosting.

**Hosting**: VPS propio con Coolify mientras el proyecto no tenga tráfico relevante, siguiendo el mismo criterio aplicado al resto de proyectos personales (NitidoHome, Convitia, app de finanzas). Coolify despliega la aplicación empaquetándola en un contenedor Docker: Next.js se ejecuta dentro de ese contenedor, sin diferencia de código respecto a un despliegue en Vercel. Si el proyecto crece de forma significativa, se traslada a Vercel sin cambios en la aplicación.

## 12. Licencia y contribución

El repositorio es público bajo licencia **MIT**. Cualquier persona puede revisar el código, copiarlo, modificarlo y usarlo libremente (incluso con fines comerciales), siempre que mantenga el aviso de copyright original. El objetivo es maximizar la visibilidad técnica del proyecto y atraer colaboradores.

**Separación entre código abierto y datos privados.** El código y los datos generados por la comunidad son dos cosas distintas:

- El **código fuente** (frontend, backend, esquema de la base de datos, lógica de gamificación) es público desde el primer commit.
- Los **datos reales** (precios reportados, usuarios registrados, fotos, comentarios) viven en una instancia privada de Supabase, nunca en el repositorio. Las credenciales de conexión se gestionan mediante variables de entorno (`.env`), excluidas del repositorio mediante `.gitignore`.

Esta separación permite que el proyecto sea abierto y genere reputación técnica, sin renunciar a que los datos acumulados por la comunidad —el activo real de cara a futuras licencias de datos o acuerdos con gasolineras, siguiendo el modelo de Waze— permanezcan bajo control exclusivo del proyecto.
