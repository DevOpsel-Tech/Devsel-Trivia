# Resumen de entrega final

## Estado general

Los retos 20, 20B, 21 y 22 están completados, comprobados y aprobados por el tutor. Los cambios de frontend y backend quedaron integrados y la aplicación está publicada con backend en Render, PostgreSQL persistente y frontend en Vercel.

## Últimas actualizaciones realizadas

- Se completó el registro del reto 20: registro, inicio de sesión, perfil, listado e historial de partidas, creación y entrada por código, sala, turnos, respuestas, reconexión y pantalla final.
- Se completó el reto 20B: nombres públicos, perfil editable, migración de `displayName`, historial paginado, estados de sala, confirmación de jugadores, borrado de salas, evento `game:deleted`, turnos y resultado de ganar, perder o empate.
- Se completó el reto 21: backend publicado en Render, PostgreSQL configurado como servicio independiente, frontend publicado en Vercel y conexión administrativa comprobada desde pgAdmin 4 en un PC externo mediante un servidor registrado aparte.
- Se creó `docs/despliegue.md` con el procedimiento de instalación, compilación, migración de Prisma, arranque, variables de entorno y comprobaciones de publicación.
- Se cerró el reto 22 como entrega final: documentación, pruebas, despliegue, recorrido público y revisión del tutor completados.
- Se actualizaron `APRENDIZAJE.md`, `README.md` y los registros de entrega de los retos 20, 20B, 21 y 22.

## Comprobaciones técnicas

- `npm run typecheck` correcto.
- `npm run build` correcto.
- `git diff --check` correcto, sin errores de espacios o formato.
- Los checks de los retos 20, 20B, 21 y 22 están marcados como completados.

## Seguridad del repositorio

No se han subido archivos comprometidos ni secretos al repositorio.

- `.env` y `tests/.env.test` están ignorados por `.gitignore`.
- No hay claves privadas, certificados, credenciales, cadenas reales de conexión PostgreSQL ni valores reales de `JWT_SECRET` versionados.
- Las apariciones de contraseñas, secretos y URLs de base de datos que existen en el código corresponden a variables vacías de ejemplo, documentación o datos simulados para pruebas.
- Las credenciales de Render, Vercel, PostgreSQL y pgAdmin 4 se mantienen fuera de Git y no se incluyen en las variables públicas `VITE_*` del frontend.

## Documentos relacionados

- [Aprendizaje](../APRENDIZAJE.md)
- [Guía de despliegue](despliegue.md)
- [Reto 20](../retos/20-frontend.md)
- [Reto 20B](../retos/20b-jugabilidad.md)
- [Reto 21](../retos/21-despliegue.md)
- [Reto 22](../retos/22-entrega-final.md)
