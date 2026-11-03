import { z } from "zod";
import { displayNameSchema } from "./display-name.schema.js";

// Validamos los datos que llegan al POST api/auth/register.
export const registerSchema = z
  /* El email se normaliza, quitamos los espacios de los extremos y lo pasamos a minúsculas*/
  .object({
    // Misma regla que usa el perfil al cambiar el nombre.
    displayName: displayNameSchema,
    email: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, "El email no puede estar vacío")
      .max(254, "El email es demasiado largo")
      .pipe(z.email("El formato del email no es válido")), // Valida el formato de email después de normalizar
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres") // L a contraseña se usa tal cual
      .max(128, "La contraseña es demasiado larga"),
  })
  .strict();
