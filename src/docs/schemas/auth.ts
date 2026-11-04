import { maxLength } from "zod";

/* Esquemas OpenAPI de autenticación y usuario.
   Los nombres NO se cambian: los @openapi hacen $ref a ellos. */
export const authSchemas = {
  // Representa los datos para crear una cuenta.
  RegistroEntrada: {
    type: "object",
    additionalProperties: false,
    properties: {
      displayName: {
        type: "string",
        minLength: 2,
        maxLength: 30,
        description:
          "Nombre público. Se eliminan los espacios exteriores; no es único ni se usa para iniciar sesión.",
        example: "Ana",
      },
      email: {
        type: "string",
        format: "email",
        maxLength: 254,
        description:
          "Se normaliza: se le quitan los espacios de los extremos y se pasa a minúsculas.",
        example: "juan@email.com",
      },
      password: {
        type: "string",
        minLength: 8,
        maxLength: 128,
        description: "Mínimo 8 caracteres; se usa tal cual, sin recortar.",
        example: "secreta123",
      },
    },
    required: ["displayName", "email", "password"],
  },
  LoginEntrada: {
    type: "object",
    additionalProperties: false,
    properties: {
      email: {
        type: "string",
        format: "email",
        maxLength: 254,
        description: "Se normaliza quitando espacios exteriores y pasando a minúsculas.",
        example: "juan@email.com",
      },
      password: {
        type: "string",
        minLength: 8,
        maxLength: 128,
        description: "Se comprueba tal cual, sin recortar.",
        example: "secreta123",
      },
    },
    required: ["email", "password"],
  },
  // Cuerpo permitido al editar el perfil propio con PATCH /api/me.
  ActualizarPerfilEntrada: {
    type: "object",
    additionalProperties: false,
    properties: {
      displayName: {
        type: "string",
        minLength: 2,
        maxLength: 30,
        description:
          "Nombre público. Se eliminan los espacios exteriores; no permite cambiar email, rol ni identidad.",
        example: "Ana",
      },
    },
    required: ["displayName"],
  },
  // Representa los datos públicos que se devuelven al registrarse.
  UsuarioPublico: {
    type: "object",
    properties: {
      id: {
        type: "integer",
        example: 1,
      },
      email: {
        type: "string",
        example: "juan@email.com",
      },
      displayName: {
        type: "string",
        example: "Ana",
      },
    },
    required: ["id", "email", "displayName"],
  },

  // Datos que puede consultar el propio usuario autenticado.
  // Incluye el rol porque GET /api/me lo devuelve.
  UsuarioAutenticado: {
    type: "object",
    properties: {
      id: {
        type: "integer",
        example: 1,
      },
      email: {
        type: "string",
        example: "juan@email.com",
      },
      displayName: {
        type: "string",
        example: "Ana",
      },
      role: {
        type: "string",
        enum: ["USER", "ADMIN"],
        example: "USER",
      },
    },
    required: ["id", "email", "displayName", "role"],
  },
};
