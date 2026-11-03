
-- Añadimos primero una columna opcional: las cuentas anteriores aún no tienen nombre.
ALTER TABLE "user" ADD COLUMN "displayName" TEXT;

-- Conservamos cada cuenta existente asignándole un nombre inicial editable.
UPDATE "user"
SET "displayName" = 'Jugador ' || "id"
WHERE "displayName" IS NULL;

-- Solo después la hacemos obligatoria.
ALTER TABLE "user"
ALTER COLUMN "displayName" SET NOT NULL;