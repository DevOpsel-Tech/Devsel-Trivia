FROM node:24-bookworm-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# URLs públicas incorporadas durante la compilación.
ARG VITE_API_URL
ARG VITE_SOCKET_URL

ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_SOCKET_URL=${VITE_SOCKET_URL}

RUN test -n "$VITE_API_URL" && test -n "$VITE_SOCKET_URL"

RUN npm run build

# Servidor de archivos estáticos.
FROM nginx:stable-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
