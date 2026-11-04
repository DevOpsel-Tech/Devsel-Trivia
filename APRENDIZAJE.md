# 20B · Dale claridad a la experiencia de juego

- Lo que he construido: registro con nombre público, login con `displayName`, edición del perfil propio, historial paginado y filtrable, creación individual y de salas por código, preparación de ambos jugadores, eliminación de salas en espera por su creador, sala con Socket.IO y resultado final. El historial y la sala muestran «Tú», el rival y únicamente las puntuaciones públicas que entrega el backend. La interfaz separa participantes, marcador y resultado en componentes pequeños para facilitar la revisión de estados.
- Conceptos y explicación propia: el frontend mejora la experiencia, pero el backend sigue siendo la fuente de verdad para permisos, turnos, puntos y ganador. Socket.IO avisa de cambios y el cliente recupera el estado persistido con `GET /api/games/:id`; `turnVersion` evita aplicar snapshots atrasados. El JWT solo vive en memoria y, si caduca, se vuelve al login.
- Pruebas y resultados: se probó el recorrido con dos cuentas en perfiles de navegador distintos: crear sala, copiar código desde la tarjeta, entrar, confirmar ambos jugadores, jugar, mostrar ganador/perdedor, mostrar empate, volver al historial, reabrir el resultado y recuperar el estado al reconectar. Se comprobó que el rival recibe `game:deleted` y vuelve al historial al eliminarse la sala, y que `io server disconnect` por caducidad del JWT conduce al login en lugar de simular una reconexión. También se creó, completó y reabrió una partida individual; su resultado muestra únicamente la puntuación propia. El 03/11/2026 pasan `npm.cmd run typecheck` y `npm.cmd run build` en el frontend.
- Decisión de interfaz: el código de invitación se muestra y se copia desde la tarjeta de una sala en espera; se comparte por un canal externo. Las invitaciones internas a usuarios conectados quedan fuera de este reto.
- Error y solución: PowerShell bloqueaba `npm.ps1` por la política de ejecución; los comandos se ejecutan como `npm.cmd run ...`.
- Limitaciones conocidas: los filtros del historial se aplican a las partidas de la página cargada. Una invitación interna requeriría nuevos endpoints y eventos Socket.IO en el backend.
- PR y correcciones: la implementación anterior de jugabilidad fue integrada
  mediante el [PR frontend #1](https://github.com/josepracticas123/trivia-app-frontend/pull/1).
  La actualización de documentación está en el
  [PR frontend #3](https://github.com/josepracticas123/trivia-app-frontend/pull/3)
  y se coordina con el
  [PR backend #29](https://github.com/josepracticas123/trivia-app-backend/pull/29).
  Su revisión, aprobación y merge no se dan por realizados hasta la confirmación del tutor.

## Notas anteriores del reto 20

## Punto de reanudación — 29/10/2026

- Base creada: React, Vite, TypeScript, Tailwind CSS y Socket.IO Client.
- Interfaz actual: portada responsive, registro y login locales.
- Login: validación local; todavía no consume la API.
- Componente extraído: `src/components/PasswordField.tsx`, reutilizado en ambos formularios para mostrar u ocultar la contraseña.
- Se revisaron los contratos del backend actualizado en `develop`: registro acepta solo email y contraseña; errores en `{ error: { code, message } }`.
- `RegisterForm.tsx` se extrajo de `App.tsx` y registra con `POST /api/auth/register`; bloquea envíos duplicados mientras espera, muestra errores de API/red y lleva al login al completar el registro.
- El campo nombre se quitó porque el backend rechaza propiedades adicionales y no guarda ese dato.
- El siguiente paso es conectar el formulario de login a `POST /api/auth/login` y mantener el JWT en memoria.
## Error 500 al registrar usuario

- **Síntoma:** `POST /api/auth/register` devolvía `500 (Internal Server Error)`.
- **Causa real:** `TypeError: Cannot read properties of undefined (reading 'create')` en `registerUser` (`src/services/auth.services.ts`).
- **Motivo:** el cliente de Prisma no estaba generado, por lo que `prisma.user` era `undefined`.
- **Solución:** ejecutar `npm run db:generate` y reiniciar el backend.
- **Otros bloqueos resueltos:** falta de `.env.local` en el frontend, dependencias faltantes (`jsonwebtoken`), variables de entorno del backend (`JWT_SECRET`, `FRONTEND_ORIGIN`, `PORT`), proceso viejo en el puerto 3000.

## Catálogo, puntuación y despliegue — 04/11/2026

- La API pública devolvió 20 preguntas y se completó una partida usando el catálogo desplegado. El catálogo base se organiza como `Category` → `Question` → `Option`.
- `GameQuestion`, `GameChoice` y `Answer` son copias y respuestas propias de una partida. Corregir una opción del catálogo no modifica automáticamente las partidas ya creadas.
- La prueba reproducible de backend identificó el defecto: al copiar preguntas se mezclaban índices base cero con posiciones de opción 1–4. `GameQuestion.solution` podía guardar, por ejemplo, `1` aunque la opción correcta copiada tuviera posición `2`; la comparación marcaba un acierto como incorrecto. Se corrigieron los flujos individual, confirmación de sala y arranque multijugador para guardar la posición real de la única opción correcta.
- La integración de scoring verificó una pregunta temporal cuya respuesta correcta tenía posición `2`: la copia conservó solución `2` y la respuesta devolvió `isCorrect: true`, `score: 1` y `finished: true`. El caso incorrecto devolvió `false`, `0` puntos y finalizó; las filas de prueba se limpiaron. También pasaron typecheck, build, las integraciones multijugador y los 11 tests del límite de login.
- La partida #7 observada en producción (`gameQuestionId: 30`, `choiceId: 119`) no se pudo inspeccionar directamente con acceso controlado de solo lectura. El defecto corregido es compatible con su síntoma, pero no se afirma que sus filas concretas hayan sido verificadas ni se modificó esa partida histórica.
- El frontend presenta exclusivamente puntos, estado y resultado proporcionados por la API; no calcula aciertos ni corrige el marcador en React.
- El límite de intentos de login del reto 22 fue implementado y pasó sus 11 tests en backend. Su aprobación, merge y cierre siguen pendientes del tutor.
- URLs públicas: [frontend](https://trivia-app-frontend-self.vercel.app/), [API](https://trivia-app-backend-l90r.onrender.com) y [Swagger](https://trivia-app-backend-l90r.onrender.com/docs). El commit desplegado sigue pendiente de confirmar desde el proveedor. No se documentan `DATABASE_URL`, contraseñas ni `JWT_SECRET`.

