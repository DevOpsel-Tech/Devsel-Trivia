# 20 · Conecta un frontend mínimo

**Tu misión:** Construye en un repositorio frontend separado una interfaz mínima para registrarte, iniciar sesión y jugar una partida de dos personas.

**Antes:** El [reto 19](19-reconexion.md) debe estar aprobado e integrado en develop.

**Aprenderás:** Consumo de API, sesión, estados de interfaz y cliente Socket.IO.

## Trabajo por bloques

1. Con el tutor, crea o identifica TriviaApp_front con React y Vite. Su código y sus dependencias viven allí; registra su URL en este README.

2. Crea registro, login, listado de partidas, creación y entrada por código, sala, turno y resultado. Envía JWT por Authorization y al conectar sockets; para esta primera versión mantenlo en memoria y vuelve a iniciar sesión al recargar.

3. Integra avisos y recuperación. Bloquea envíos pendientes y muestra errores sin perder datos. En backend actualiza solo contratos o CORS cuando sea necesario.

## Comprueba tu entrega

- [x] Dos usuarios en perfiles de navegador distintos completan una partida desde la interfaz.
- [x] La UI indica espera, turno, envío, error y resultado sin calcular puntos ni soluciones.
- [x] Una operación fallida conserva el estado y permite recuperación; un doble clic no duplica jugadas.
- [x] Reconectar consulta estado y vuelve a la sala; JWT caducado lleva a iniciar sesión.
- [x] El frontend no contiene credenciales de DB ni JWT_SECRET y usa una URL configurable para la API.
- [x] El PR del frontend se integró en `develop`; el backend conserva la documentación y contratos del reto.
- [x] `npm run typecheck` y `npm run build` pasan; he comprobado que lo anterior sigue funcionando.
- [x] `APRENDIZAJE.md` y la documentación de despliegue están actualizados.

## Demostración al tutor

Recorre una petición en Network. ¿Qué valida el frontend para ayudar al usuario y qué vuelve a validar el backend por seguridad?

## Pistas

No añadas Redux ni un framework visual por obligación. Una interfaz pequeña permite probar todo el recorrido antes del despliegue.

## Documentación

- [React](https://react.dev/learn)
- [Cliente Socket.IO](https://socket.io/docs/v4/client-api/)

## Registro de entrega y revisión

Estado de implementación: **Completado e integrado en `develop`**. Los checks son la autoevaluación del alumno; el cierre lo confirma el tutor.

- PR y commit revisado: PR #1 del frontend, «feat: mejora la experiencia de juego del reto 20b», integrado en `develop` el 03/11/2026.
- Prueba correcta (petición/acción y resultado): registro, sesión, sala, turnos, resultados y reconexión implementados y documentados en el PR.
- Prueba inválida o fallo (petición/acción y resultado): la UI conserva el estado ante error y evita envíos duplicados; `404` de una sala eliminada devuelve a Mis partidas.
- Comandos y resultados: `npm run typecheck` y `npm run build` correctos en el frontend, según la entrega integrada.
- Dudas o correcciones: la evidencia visual pública con dos perfiles queda registrada para la revisión final.
- Revisión y aprobación del tutor: completada; entrega comprobada y aprobada.
- Merge en `develop`: realizado en el repositorio frontend.

Reto cerrado por el tutor. Las correcciones posteriores se documentan en el reto que corresponda.

[Volver al README](../README.md) · [Reto 19](19-reconexion.md) · [Reto 20B](20b-jugabilidad.md)
