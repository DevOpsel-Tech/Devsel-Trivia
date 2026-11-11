# Devsel Trivia

Aplicación web de preguntas y respuestas con registro e inicio de sesión,
partidas individuales y partidas multijugador en tiempo real.

## Estructura

- [`backend/`](./backend/): API HTTP, autenticación, persistencia con PostgreSQL
  y comunicación en tiempo real con Socket.IO.
- [`frontend/`](./frontend/): aplicación web en React para jugar y consultar las
  partidas.

Cada carpeta es un proyecto independiente y tiene su propio `package.json` y
README con instrucciones detalladas.

## Tecnologías

- **Backend:** Node.js 24, TypeScript, Express, Prisma, PostgreSQL y Socket.IO.
- **Frontend:** React, TypeScript, Vite y Socket.IO Client.

## Requisitos

- Node.js 24.x y npm.
- PostgreSQL para ejecutar el backend.

## Ejecutar en local

Abre dos terminales, una para cada proyecto.

### Backend

```powershell
cd backend
npm ci
Copy-Item .env.example .env
```

Configura `DATABASE_URL` con la URL de PostgreSQL y `JWT_SECRET` con un secreto
aleatorio en `backend/.env`. No compartas ni subas ese archivo. Después:

```powershell
npm run db:generate
npm run db:migrate:dev
npm run dev
```

El backend estará disponible en <http://localhost:3000>. Para preparar la base
de datos o ejecutar pruebas de integración, consulta
[`backend/README.md`](./backend/README.md).

### Frontend

```powershell
cd frontend
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Por defecto, `.env.example` apunta a `http://localhost:3000`. Si la API está en
otra dirección, actualiza `VITE_API_URL` y, si corresponde,
`VITE_SOCKET_URL` en `frontend/.env.local`. Vite mostrará la dirección local
de la aplicación al arrancar. Consulta [`frontend/README.md`](./frontend/README.md)
para más detalles.

## Comprobaciones

Ejecuta estos comandos desde la carpeta de cada proyecto:

```bash
npm run typecheck
npm run build
```

El backend también incluye pruebas unitarias con `npm test`. Las pruebas de
integración requieren configurar su base de datos de pruebas; sigue las
instrucciones de [`backend/tests/README.md`](./backend/tests/README.md).

## Seguridad

No subas archivos `.env`, contraseñas, tokens ni claves. Usa los archivos
`.env.example` como referencia y configura los secretos en el entorno local o
en el proveedor de despliegue.
