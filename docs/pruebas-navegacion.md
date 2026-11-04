# Pruebas de sesión y navegación

Fecha: YYYY-MM-DD
Entorno: localhost / URL pública
Resultado: pendiente / correcto

## Cambio de salas

1. Abrir `#/games/1` con una partida terminada y `turnVersion` alto.
2. Cambiar directamente a `#/games/2`, con `turnVersion` menor.
3. Esperado: aparece «Cargando sala…» y después solo el resultado de la sala 2.
4. No debe aparecer ninguna puntuación, título o resultado de la sala 1.

## Historial del navegador

1. Abrir una sala desde `#/games`.
2. Usar atrás: vuelve al listado.
3. Usar adelante: vuelve a la misma sala.
4. Recargar: conserva la ruta y recupera el estado desde API.

## Sesión

1. Iniciar sesión y recargar: vuelve a `#/games` o a la sala actual.
2. Cerrar sesión y recargar: no recupera rutas privadas.
3. Usar JWT caducado: la API devuelve 401, se borra sessionStorage y se abre login.