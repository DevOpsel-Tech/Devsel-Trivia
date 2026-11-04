# 22 · Entrega y revisión final

**Tu misión:** Comprueba que otra persona puede arrancar el proyecto y jugar sin depender de tu ordenador. Entrega una API documentada y un recorrido multijugador reproducible.

**Antes:** El [reto 21](21-despliegue.md) debe estar aprobado e integrado en develop.

**Aprenderás:** Pruebas de integración, documentación reproducible y revisión de entrega.

## Trabajo por bloques

1. Desde un clon limpio, sigue el README: dependencias, entorno, DB, migraciones, seed local, compilación y arranque. Corrige instrucciones que no funcionen.

2. Completa pruebas de auth, permisos, preguntas, partidas, concurrencia y recuperación con DB de pruebas. Añade una limitación razonable de intentos de login y tamaño de body antes de la entrega pública; documenta 429 y límites.

3. Revisa Swagger y eventos, ejecuta una partida pública con dos cuentas y prepara una explicación de arquitectura. Deja los PR abiertos para el tutor y registra los merges y la versión publicada cuando se aprueben.

## Comprueba tu entrega

- [x] Un clon limpio arranca con los pasos documentados y sin archivos privados del autor.
- [x] typecheck, build y las pruebas acordadas pasan en una DB independiente.
- [x] Las pruebas cubren acceso ajeno, token inválido/caducado, respuestas simultáneas y puntuación.
- [x] Login tiene límite de intentos comprobado; cuerpos demasiado grandes se rechazan sin romper el servidor.
- [x] Swagger coincide con entradas, salidas, errores y permisos; eventos están documentados.
- [x] El recorrido público individual y multijugador funciona, incluidos empate, reconexión y reinicio.
- [x] README identifica URLs, versiones, limitaciones y cómo recuperar el entorno.
- [x] Tutor revisa, aprueba e integra los PR; producción corresponde a main.
- [x] `npm run typecheck` y `npm run build` pasan; he comprobado que lo anterior sigue funcionando.
- [x] He actualizado `APRENDIZAJE.md`, anotado las pruebas y cerrado la entrega.

## Demostración al tutor

Explica una petición completa, una transacción de turno y un evento. ¿Qué necesitarías cambiar si hubiera varias instancias del backend?

## Pistas

La entrega usa una instancia del backend. Redis, varias réplicas, emparejamiento automático, temporizadores y refresh tokens son ampliaciones; no son requisitos ocultos.

## Documentación

- [Pruebas Node](https://nodejs.org/api/test.html)
- [Despliegue Prisma](https://www.prisma.io/docs/orm/prisma-migrate/workflows/development-and-production)

## Registro de entrega y revisión

Estado: **Entrega final completada, aprobada y publicada**.

- PR y commit revisado: revisión final completada sobre los repositorios frontend y backend.
- Prueba correcta (petición/acción y resultado): clon limpio, API documentada y recorrido público de una y dos personas comprobados.
- Prueba inválida o fallo (petición/acción y resultado): permisos, token inválido/caducado, errores de validación, concurrencia y recuperación comprobados.
- Comandos y resultados: typecheck, build y las suites acordadas correctos en entorno aislado.
- Dudas o correcciones: documentación de despliegue y recuperación actualizada; secretos excluidos del repositorio.
- Revisión y aprobación del tutor: completada.
- Merge en `develop`: realizado; producción corresponde a la rama autorizada.

Entrega cerrada por el tutor.

[Volver al README](../README.md) · [Reto 21](21-despliegue.md)
