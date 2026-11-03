# 20B · Dale claridad a la experiencia de juego

**Tu misión:** Mejora el frontend y los contratos del backend para que dos personas sepan con quién juegan, qué ocurre en su sala y cómo terminó la partida. No basta con que las peticiones funcionen: la interfaz debe explicar el recorrido.

**Antes:** El [reto 20](20-frontend.md) debe estar revisado e integrado en `develop` en ambos repositorios. Los ajustes de CORS para localhost y túneles también deben estar revisados e integrados. Este reto va antes del despliegue (21) y de la entrega final (22).

**Aprenderás:** Evolución de contratos, migraciones con datos existentes, estados de interfaz, identidad pública y pruebas de juego de principio a fin.

## Trabajo por bloques

### 1. Un nombre para cada jugador

Añade un nombre visible (`displayName`) al usuario. Para mantenerlo sencillo, el login seguirá usando email y contraseña; este nombre no es una credencial ni tiene que ser único.

- En el registro, solicita un nombre de entre 2 y 30 caracteres después de quitar espacios exteriores. Valídalo en frontend para ayudar y en backend para garantizar la regla.
- Permite consultar y cambiar únicamente el nombre propio desde el perfil autenticado. Si hace falta una ruta nueva, usa un contrato sencillo, como `PATCH /api/me` con `{ displayName }`, sin aceptar cambios de rol, ID o puntuación.
- Usa una migración versionada que conserve usuarios, contraseñas, participantes, respuestas y partidas. Para los usuarios anteriores, asigna un nombre inicial neutro, por ejemplo `Jugador 12`, y permite cambiarlo. No borres ni reinicies la base.
- Devuelve el nombre en los datos públicos de sesión, perfil y participantes que necesite el frontend. Mantén el ID como identidad interna: dos personas pueden tener el mismo nombre. El nombre mostrado será el actual del perfil; no es necesario guardar nombres históricos.
- En la sala y el resultado, identifica al usuario como «Tú» junto a su nombre y muestra el nombre del rival. No uses emails como nombres públicos ni añadas credenciales a esas respuestas.

### 2. Salas que se entiendan

Organiza «Tus partidas» para distinguir salas en espera, partidas en curso y finalizadas. Puedes usar secciones, pestañas o filtros sencillos; no hace falta una librería de estado nueva.

- Cada tarjeta muestra un identificador legible de la partida, estado en español, fecha y la información de participantes que corresponda. Muestra carga, lista vacía, error y opción de reintentar.
- En una sala en espera se ve el código de invitación, se puede copiar y se sabe quién falta por entrar o confirmar. El creador puede recuperar el código al volver a la sala: no dependas solo de la respuesta de creación guardada en memoria.
- Indica los dos participantes y sus confirmaciones. Usa textos como «Prepararme», «Esperando a tu rival» y «Ambos preparados» en lugar de presentar el primer clic como si la partida ya estuviera activa.
- La acción de eliminar solo se ofrece al creador y únicamente mientras la sala esté en espera. El backend mantiene esa autorización y el borrado atómico aunque alguien fabrique una petición.
- Si el creador elimina una sala que el rival tiene abierta, el rival puede volver al listado con un mensaje claro. Un 404 posterior no debe dejar una pantalla bloqueada ni provocar reintentos infinitos. Puede resolverse con el contrato de eventos existente o uno pequeño documentado.
- No pierdas de vista las partidas antiguas por mostrar solo la primera página: añade navegación de páginas y conserva filtros/sección al actualizar cuando sea posible.

### 3. Turnos y respuestas con información útil

- Muestra de quién es el turno, el progreso («Pregunta 2 de 5») y si se está conectando, recuperando estado o enviando una respuesta.
- Deshabilita acciones mientras su petición está pendiente y evita dobles envíos. Si falla, muestra el motivo y permite recuperar el estado antes de reintentar; conserva los datos que sigan siendo válidos.
- No reveles si acertó el primero ni actualices un marcador que lo delate hasta que ambos respondan. Usa las puntuaciones públicas del backend, también en el listado.
- Mantén la recuperación al reconectar: autenticación, suscripción autorizada y GET. Descarta respuestas de estado antiguas según `turnVersion`. Si caduca la sesión, vuelve al login con una explicación.

### 4. Un resultado que cierre la partida

La pantalla final debe mostrar «Ganaste», «Perdiste» o «Empate» desde la perspectiva de quien inició sesión, con los nombres y los puntos finales de ambos jugadores.

- El backend sigue decidiendo los puntos, `winnerUserId` e `isDraw`. El frontend solo traduce esos datos a texto y presentación; no calcula el ganador sumando respuestas.
- Alinea los tipos del frontend con el contrato real: ahora `GameDetails` no declara el ganador ni el empate, aunque el backend ya los devuelve.
- Permite volver al listado y abrir de nuevo una partida finalizada para ver el mismo resultado, incluso después de reconectar o volver a iniciar sesión.
- Distingue en el historial los puntos propios del resultado frente al rival; evita un «score» que sume a ambos. Para individual, muestra el resultado propio sin inventar un rival.
- Como acción posterior basta con «Volver a mis partidas» y «Crear otra sala». Una revancha automática queda fuera de este reto.

### 5. Contratos y prueba conjunta

Escribe primero qué campos hacen falta en registro, sesión, perfil, historial y detalle. Selecciona campos públicos explícitos y evita una consulta adicional por jugador o tarjeta si puedes recuperar sus nombres en la consulta de Prisma.

Actualiza Swagger, los tipos del frontend, los eventos que cambien y los README que expliquen el arranque. Configura los orígenes permitidos HTTP y Socket.IO con las mismas reglas: protocolo, host y puerto exactos, sin rutas ni comodines. Las URLs de túnel son configuración temporal, no constantes en el código ni permisos para cualquier origen.

Prueba con dos cuentas en perfiles de navegador diferentes. Si se usan túneles, registra sus orígenes de frontend y API sin credenciales ni tokens; documenta que cambiar el túnel exige actualizar la configuración. No hace falta contratar servicios ni publicar producción para completar este reto.

## Comprueba tu entrega

- [x] Un usuario nuevo se registra con nombre válido; nombres vacíos, fuera de longitud o entradas de tipo incorrecto dan 400 en la API. Dos nombres iguales no mezclan identidades.
- [x] Los usuarios anteriores siguen pudiendo iniciar sesión y conservan sus partidas, respuestas y puntos después de la migración. El nombre inicial se puede cambiar.
- [x] Cambiar el nombre solo modifica el perfil autenticado; enviar `role`, un ID ajeno u otros campos no permite modificar privilegios ni otra cuenta.
- [ ] Sala y resultado muestran nombres y «Tú» sin publicar emails del rival, contraseñas ni hashes.
- [ ] Las tarjetas distinguen espera, juego y finalización; carga, vacío, error y paginación tienen una presentación útil.
- [ ] Al volver a una sala en espera se recupera su código y se puede copiar. Se ve quién entró y quién confirmó; no se inicia hasta que ambos confirman.
- [ ] Solo el creador puede borrar una sala en espera. La eliminación y un inicio simultáneo no borran una partida activa; el rival puede salir de una sala eliminada sin quedar bloqueado.
- [ ] La interfaz muestra turno y progreso, bloquea envíos pendientes y permite recuperar un error sin duplicar una jugada ni perder la partida.
- [ ] Antes de cerrar una ronda ninguna pantalla, incluido el historial, revela el acierto pendiente del primer jugador.
- [ ] Dos cuentas completan una partida: una ve «Ganaste», la otra «Perdiste», con los mismos nombres y puntos. Otra partida termina en empate y ambas lo muestran.
- [ ] Volver al historial, reconectar y reabrir la partida conserva el resultado correcto; sesión caducada conduce al login y un estado retrasado no hace retroceder la pantalla.
- [ ] Login, registro y acciones autenticadas funcionan desde los orígenes locales y de túnel configurados, incluido preflight de Authorization. Un origen ajeno no obtiene autorización CORS; JWT y permisos siguen siendo obligatorios.
- [ ] Swagger y tipos reflejan entradas, campos nuevos y errores. La migración y las pruebas de DB se ensayan en una base separada con su protección y limpieza por IDs.
- [ ] Hay pruebas relevantes de nombres/perfil, puntuación pública y permisos, además de evidencias del recorrido visual. `typecheck` y `build` pasan en ambos repos y la suite habitual del backend pasa.
- [ ] `APRENDIZAJE.md` y el registro de este reto describen pruebas reales y limitaciones. Hay un PR hacia `develop` en cada repo, enlazados entre sí y abiertos para revisión.

## Cómo trabajar las dos ramas

Cuando el reto 20 esté integrado, actualiza `develop` en ambos repos y crea una rama nueva para este reto en cada uno, por ejemplo `reto/20b-jugabilidad`. Implementa por bloques pequeños y acuerda los contratos antes de consumirlos en el frontend. No continúes sobre una rama de un PR ya cerrado.

Deja ambos PR abiertos para el tutor, con capturas o evidencia breve de sala y resultado y las peticiones/estados comprobados. Las correcciones van a esos mismos PR. No empieces el reto 21 hasta la revisión y el merge de ambos; `main` sigue reservada a producción.

## Demostración al tutor

Enseña dos cuentas con nombres distintos: crear sala, copiar código, entrar, confirmar, jugar, ganar/perder y volver al resultado desde el historial. Repite con empate y muestra recuperación después de desconectar. Explica por qué ocultar una solución no basta si el marcador revela un acierto pendiente.

## Registro de entrega y revisión

Estado: **Pendiente**. Los checks son autoevaluación; el tutor confirma el cierre.

- PR y commits de backend/frontend: backend en la rama `reto/20b-jugabilidad`, con el commit `666ed97` («feat: add public player names and game room contracts»). Quedan por crear/enlazar el PR hacia `develop` y el PR del frontend.
- Migración ensayada y datos conservados: ensayo completado en `trivia_test_legacy_20b`, una base local aislada creada con el esquema anterior. Se insertaron usuario con hash Argon2, partida, participante, respuesta y puntuación; Prisma aplicó `20261102103820_add_user_display_name`. Se comprobó login, nombre inicial `Jugador 1`, cambio de nombre y conservación de IDs, relaciones, respuesta y puntuación.
- Pruebas automatizadas y comandos por repo: backend comprobado el 03/11/2026 con `npm.cmd run typecheck`, `npm.cmd test` (119 superadas, 1 omitida), `npm.cmd run build` y `npm.cmd run test:integration` (30/30 superadas). Pendiente ejecutar y registrar los comandos equivalentes del frontend.
- Mejora opcional aplicada: `displayNameSchema` compartido por registro y perfil, sin cambiar las reglas ni los mensajes de validación.
- Prueba con dos cuentas (ganador/perdedor y empate): pendiente de realizar desde el frontend.
- Prueba de fallo, reconexión y sala eliminada: la recuperación y permisos están cubiertos por integración del backend; falta la prueba visual conjunta de error, reconexión y sala eliminada.
- Orígenes locales/túneles utilizados y resultados CORS: pruebas locales con `FRONTEND_ORIGIN=http://localhost:5173` en el entorno aislado. Pendiente comprobar el frontend y, si se usa, documentar el origen de un túnel.
- Dudas o limitaciones conocidas: en este equipo `npm run seed` falla dentro de `tsx` por un error temporal de memoria de Windows; tras compilar, `node dist/lib/seed.js` cargó correctamente el catálogo en `trivia_test`. No afecta a las suites ya aprobadas.
- Revisión, aprobación y merges del tutor: pendiente.

[Volver al README](../README.md) · [Reto 20](20-frontend.md) · [Reto 21](21-despliegue.md)
