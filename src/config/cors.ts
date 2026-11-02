const rawFrontendOrigins = process.env.FRONTEND_ORIGIN;

if (!rawFrontendOrigins) {
  throw new Error(
    "Falta FRONTEND_ORIGIN en las variables de entorno. Configúrala en el archivo .env.",
  );
}

export const allowedFrontendOrigins = rawFrontendOrigins
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean)
  .map((origin) => {
    const url = new URL(origin);

    if (
      (url.protocol !== "http:" && url.protocol !== "https:") ||
      url.origin !== origin
    ) {
      throw new Error(
        "Cada FRONTEND_ORIGIN debe incluir protocolo y puerto, sin rutas ni barra final.",
      );
    }

    return origin;
  });

if (allowedFrontendOrigins.length === 0) {
  throw new Error("FRONTEND_ORIGIN debe incluir al menos un origen válido.");
}

export function isAllowedFrontendOrigin(origin: string | undefined) {
  return origin === undefined || allowedFrontendOrigins.includes(origin);
}
