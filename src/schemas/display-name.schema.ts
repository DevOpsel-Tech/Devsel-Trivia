import { z } from "zod";
/* Regla única para el nombre público del jugador.
   Se reutiliza al registrarse y al editar el perfil para que ambas
   rutas normalicen y validen exactamente igual. */
export const displayNameSchema = z
  .string()
  .trim() // Guarda el nombre sin espacios al inicio ni al final.
  .min(2, "El nombre debe tener al menos 2 caracteres")
  .max(30, "El nombre no puede superar los 30 caracteres");
