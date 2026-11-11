# 02 · Devuelve preguntas

**Tu misión:** Crea una pequeña colección de preguntas y permite consultarlas por HTTP. Todavía estarán en memoria: se perderán los cambios al reiniciar.

**Antes:** El [reto 01](01-primer-servidor.md) debe estar aprobado e integrado en develop.

**Aprenderás:** Interfaces, arrays tipados, parámetros de ruta y estados 200, 400 y 404.

## Trabajo por bloques

1. Define Pregunta en src/types/ y prepara al menos cinco preguntas en src/data/. Usa id entero, enunciado, cuatro opciones y respuestaCorrecta como índice de 0 a 3.

2. Implementa GET /api/questions y GET /api/questions/:id. Puedes empezar en app.ts; en el reto 08 organizarás las responsabilidades.

3. Devuelve solo id, enunciado y opciones en estas consultas. Reserva respuestaCorrecta para el servidor y practica convertir y comprobar el ID.

## Comprueba tu entrega

- [ ] Hay al menos cinco preguntas con IDs únicos y datos tipados sin any.
- [ ] El listado y el detalle devuelven 200 y nunca incluyen respuestaCorrecta.
- [ ] Un ID de formato incorrecto devuelve 400 y uno válido que no existe devuelve 404.
- [ ] Consultar el detalle no modifica la colección y puedo explicar la diferencia entre un número y el texto recibido en params.
- [ ] `npm run typecheck` y `npm run build` pasan; he comprobado que lo anterior sigue funcionando.
- [ ] He actualizado `APRENDIZAJE.md`, anotado las pruebas y abierto el PR hacia `develop` sin hacer merge.

## Demostración al tutor

¿Qué error detecta TypeScript en una Pregunta? ¿Comprueba también los datos que llegan por HTTP?

## Pistas

find busca un elemento; map permite preparar la respuesta sin enviar campos internos. No uses una conversión que acepte 12abc como ID 12.

## Documentación

- [Rutas de Express](https://expressjs.com/en/guide/routing.html)

## Registro de entrega y revisión

Estado inicial: **Pendiente**. Los checks son la autoevaluación del alumno; el cierre lo confirma el tutor.

- PR y commit revisado: pendiente.
- Prueba correcta (petición/acción y resultado): pendiente.
- Prueba inválida o fallo (petición/acción y resultado): pendiente.
- Comandos y resultados: pendiente.
- Dudas o correcciones: pendiente.
- Revisión y aprobación del tutor: pendiente.
- Merge en `develop`: pendiente.

No empieces el siguiente reto hasta que este PR esté aprobado e integrado. Las correcciones van en la misma rama y el mismo PR.

[Volver al README](../README.md) · [Reto 01](01-primer-servidor.md) · [Reto 03](03-crud-memoria.md)
