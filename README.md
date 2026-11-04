# Trivia App — Frontend

Interfaz React para el reto 20: registro, inicio de sesión y una partida de trivia de dos personas.

## Tecnologías

- React + Vite + TypeScript
- Socket.IO Client para actualizaciones en tiempo real
- API HTTP con JWT en la cabecera `Authorization`

## Arranque local

1. Copia `.env.example` como `.env.local`.
2. Ajusta `VITE_API_URL` y `VITE_SOCKET_URL` a la URL del backend.
3. Instala y arranca el proyecto:

   ```bash
   npm install
   npm run dev
   ```

Comprobaciones requeridas:

```bash
npm run typecheck
npm run build
```

## Estructura actual

- `src/api/`: cliente HTTP y errores de API.
- `src/config/`: configuración pública procedente de variables Vite.
- `src/components/`: formularios, lobby, sala, marcador, resultado y conexión Socket.IO.

No se guardan credenciales de base de datos ni `JWT_SECRET` en este repositorio. El token de sesión se conserva en `sessionStorage` solo mientras la pestaña siga abierta. Las rutas con hash conservan «Mis partidas» o una sala concreta al recargar y con atrás/adelante; el estado se recupera desde la API, no desde historial, puntuaciones ni preguntas locales. Al cerrar sesión, expirar el JWT o cerrar la pestaña, se elimina.

## Contratos y despliegue comprobados

- Registro: `POST /api/auth/register` recibe `{ email, password, displayName }`.
- Login: `POST /api/auth/login` recibe `{ email, password }` y responde `{ token, expiresIn, user }`.
- Respuesta individual: `POST /api/games/:id/answers` devuelve
  `{ isCorrect, score, finished }`.
- En multijugador, el cliente no usa el resultado inmediato para revelar un
  acierto: recupera el estado público persistido con `GET /api/games/:id`.
- Los errores usan `{ error: { code, message } }`.
- Socket.IO autentica con `auth: { token }`. Tras `joined:game` o
  `game:updated`, el cliente recupera el estado con `GET /api/games/:id`.

## URLs y evidencia de la entrega

- Frontend público: [trivia-app-frontend-self.vercel.app](https://trivia-app-frontend-self.vercel.app/).
- API pública: [trivia-app-backend-l90r.onrender.com](https://trivia-app-backend-l90r.onrender.com).
- Swagger público: [trivia-app-backend-l90r.onrender.com/docs](https://trivia-app-backend-l90r.onrender.com/docs).
- Commit/versionado desplegado del frontend: pendiente de confirmar desde el despliegue.
- Comprobación del 04/11/2026: la API entregó 20 preguntas y se completó una
  partida con el catálogo desplegado.
- `npm.cmd run typecheck`: correcto.
- `npm.cmd run build`: correcto.
- Backend: la prueba reproducible de puntuación confirmó y corrigió una mezcla
  entre índices base cero y posiciones 1–4 al copiar la solución de una
  pregunta. Pasaron la integración de scoring, las integraciones
  multijugador y los 11 tests del límite de intentos de login.

No se documentan `DATABASE_URL`, contraseñas, JWT ni otros secretos. Las URLs
públicas se configuran mediante `VITE_API_URL` y `VITE_SOCKET_URL`; no se
codifican en los componentes.

## Estado de revisión

La implementación de jugabilidad anterior se integró mediante el PR
[#1](https://github.com/josepracticas123/trivia-app-frontend/pull/1).
La actualización de documentación está en el PR
[#3](https://github.com/josepracticas123/trivia-app-frontend/pull/3), relacionada
con el backend [#29](https://github.com/josepracticas123/trivia-app-backend/pull/29).

La revisión, aprobación y cierre de los retos 21 y 22 siguen pendientes del
tutor. La partida #7 de producción no se ha inspeccionado directamente; el
defecto corregido es compatible con el síntoma observado, pero no se modificó
esa partida histórica.
