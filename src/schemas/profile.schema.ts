import { z } from "zod";

// Único dato que el usuario autenticado puede modificar de su propio perfil.
export const updateMyProfileSchema = z
  .object({
    displayName: z
      .string()
      .trim() // El valor persistido nunca tendrá espacios exteriores.
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .max(30, "El nombre no puede superar los 30 caracteres"),
  })
  .strict(); // Rechaza id, role, email, score u otros campos no autorizados.
