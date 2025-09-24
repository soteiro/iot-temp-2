import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { authenticateUser } from "@/lib/auth";
import { Env, Variables } from "@/types/types";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { CreateDeviceSchema, CreateDeviceResponseSchema, ErrorResponseSchema } from "../schemas/devices.schema";

const deviceRoutes = new OpenAPIHono<{ Bindings: Env, Variables: Variables }>();

const createDeviceRoute = createRoute({
  method: "post",
  path: "/",
  summary: "Crear un nuevo dispositivo",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateDeviceSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Dispositivo creado exitosamente",
      content: {
        "application/json": {
          schema: CreateDeviceResponseSchema,
        },
      },
    },
    400: {
      description: "Solicitud inválida",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    500: {
      description: "Error interno del servidor",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

// Aplicar middleware de autenticación
deviceRoutes.use("/*", authenticateUser);

deviceRoutes.openapi(createDeviceRoute, async (c : any) => {
  try {
    const user = c.get("user");
    const { name } = c.req.valid("json");

    if (!user) {
      return c.json({ error: "User not authenticated" }, 401);
    }

    // Generar claves
    const apiKeyBytes = new Uint8Array(16);
    const apiSecretBytes = new Uint8Array(32);
    crypto.getRandomValues(apiKeyBytes);
    crypto.getRandomValues(apiSecretBytes);

    const apiKey = Array.from(apiKeyBytes, byte => byte.toString(16).padStart(2, "0")).join("");
    const apiSecret = Array.from(apiSecretBytes, byte => byte.toString(16).padStart(2, "0")).join("");
    const hashedApiSecret = await bcrypt.hash(apiSecret, 10);

    const device = await prisma.device.create({
      data:{
        name,
        user_id: user.user_id,
        api_key: apiKey,
        api_secret: hashedApiSecret,
        is_active: true,
      },
    });

    return c.json({
      device: {
        ...device,
        api_secret: apiSecret,
      },
    }, 201);

  } catch (error: any) {
    console.error("Error creating device:", error);
    return c.json({ error: "Failed to create device: " + error.message }, 500);
  }
});

export default deviceRoutes;