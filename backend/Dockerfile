FROM node:24-bookworm-slim AS build

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./

# URL ficticia utilizada exclusivamente durante la compilación.
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build npm ci

COPY . .

RUN DATABASE_URL=postgresql://build:build@localhost:5432/build \
    npm run db:generate

RUN npm run build
RUN npm prune --omit=dev

# Imagen final de producción.
FROM node:24-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build --chown=node:node /app/package*.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/prisma.config.ts ./

# Ejecutamos la aplicación sin permisos de root.
USER node

EXPOSE 3000

CMD ["node", "dist/server.js"]
