# 21 · Despliega backend, DB y frontend

**Tu misión:** Publica el proyecto para que dos personas puedan jugar desde sus equipos. El backend se aloja en Render, PostgreSQL se gestiona como servicio independiente y el frontend se publica en Vercel.

**Antes:** Los retos [20](20-frontend.md) y [20B de jugabilidad](20b-jugabilidad.md) deben estar aprobados e integrados en `develop` en ambos repositorios.

**Aprenderás:** Despliegue, entornos, secretos, migraciones de producción y comprobación pública.

## Trabajo por bloques

1. Prepara el backend remoto desde `develop` en Render y una base PostgreSQL independiente para producción. Revisa con el tutor planes y costes antes de ampliar o contratar servicios.

2. Configura un servicio Node persistente compatible con Socket.IO y PostgreSQL; usa build, migración de despliegue y start acordes con la versión de Prisma. En Render, `DATABASE_URL` debe configurarse como secreto y usar la conexión adecuada para el servicio. La conexión externa usada desde el PC (por ejemplo, desde pgAdmin 4) es solo administrativa: no se copia en el repositorio ni en el bundle del frontend. Nunca uses `migrate dev`, `reset` ni seed de práctica contra producción.

3. Configura frontend, URL pública de API y orígenes permitidos HTTP/socket. Documenta pasos en docs/despliegue.md; prepara un PR develop a main de cada repo y deja la publicación final al tutor.

## Comprueba tu entrega

- [ ] Desarrollo remoto y producción usan DB y secretos separados; main despliega producción y develop no la modifica. (pendiente de verificación en despliegue real)
- [ ] Una DB vacía se prepara con migraciones versionadas; hay procedimiento de copia y recuperación antes de cambios de esquema. (pendiente de verificación en despliegue real)
- [ ] PORT lo proporciona el alojamiento, la app escucha en 0.0.0.0 y /health permite comprobar disponibilidad. (pendiente de verificación en entorno desplegado)
- [ ] Las variables se configuran en cada alojamiento sin subir secretos al repo ni al bundle del frontend. (pendiente de verificación en entorno desplegado)
- [ ] HTTPS, CORS, Swagger y Socket.IO funcionan con las URLs reales. (pendiente de verificación pública con tutor)
- [ ] Reiniciar o desplegar el backend conserva los datos de PostgreSQL. (pendiente de verificación en entorno desplegado)
- [ ] Dos usuarios completan una partida pública después de los merges autorizados; URLs y evidencias quedan registradas. (pendiente de verificación con tutor)
- [x] `npm run typecheck` y `npm run build` pasan; he comprobado que lo anterior sigue funcionando.
- [x] He actualizado `APRENDIZAJE.md`, anotado las pruebas y abierto el PR hacia `develop` sin hacer merge.

## Demostración al tutor

¿Qué diferencia hay entre desplegar el código y migrar la base de datos? ¿Qué datos perderías con un reset?

## Pistas

La instalación es npm ci, la compilación npm run build y el arranque npm start. Completa el comando de migración según la versión instalada. Volver a código anterior no revierte automáticamente una migración.

## Documentación

- [Render Web Services](https://render.com/docs/web-services)
- [Render PostgreSQL](https://render.com/docs/postgresql-creating-connecting)
- [Vite en Vercel](https://vercel.com/docs/frameworks/frontend/vite)

## Registro de entrega y revisión

Estado: implementación y evidencias locales pendientes de revisión del tutor.
PR: abierto.
Aprobación, merge, promoción/despliegue final y cierre: pendientes del tutor.

- PR y commit revisado: PR abierto; el commit que incluya estas correcciones y el commit realmente desplegado están pendientes de registrar tras la revisión.
- Prueba correcta (petición/acción y resultado): evidencias locales confirmadas (typecheck, build, pruebas de scoring y auth); URLs públicas pendientes de verificación con el tutor.
- Prueba inválida o fallo (petición/acción y resultado): CORS, autenticación, errores de acción y reconexión comprobados sin exponer secretos.
- Comandos y resultados: `npm run typecheck` y `npm run build` pasan; migraciones pendientes de verificación en entorno desplegado.
- Dudas o correcciones: acceso externo con pgAdmin 4 comprobado mediante un servidor separado; las credenciales permanecen fuera del repositorio.
- Revisión y aprobación del tutor: pendiente.
- Merge en `develop`: pendiente (PR abierto, sin merge).

Aprobación, merge, promoción/despliegue final y cierre: pendientes del tutor.

[Volver al README](../README.md) · [Reto 20B](20b-jugabilidad.md) · [Reto 22](22-entrega-final.md)
