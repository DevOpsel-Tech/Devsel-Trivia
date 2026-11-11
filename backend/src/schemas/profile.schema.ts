import { z } from "zod";
import { displayNameSchema } from "./display-name.schema.js";

// Único dato que el usuario autenticado puede modificar de su propio perfil.
export const updateMyProfileSchema = z
  .object({
    // Reutiliza la misma normalización y límites que el registro.
    displayName: displayNameSchema,
  })
  .strict(); // Rechaza id, role, email, score u otros campos no autorizados.
