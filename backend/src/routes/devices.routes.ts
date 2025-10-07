import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { authenticateUser, hashApiSecret } from "@/lib/auth";
import { Env, Variables } from "@/types/types";
import { prisma } from "@/lib/prisma";
import {
  CreateDeviceSchema,
  CreateDeviceResponseSchema,
  ErrorResponseSchema,
  GetDevicesResponseSchema,
  DeleteDeviceResponseSchema,
  RenameDeviceSchema,
  UpdateDeviceStatusSchema,
} from "../schemas/devices.schema";

const deviceRoutes = new OpenAPIHono<{ Bindings: Env; Variables: Variables }>();

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

//create device
deviceRoutes.openapi(createDeviceRoute, async (c: any) => {
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

    const apiKey = Array.from(apiKeyBytes, (byte) =>
      byte.toString(16).padStart(2, "0")
    ).join("");
    const apiSecret = Array.from(apiSecretBytes, (byte) =>
      byte.toString(16).padStart(2, "0")
    ).join("");
    const hashedApiSecret = await hashApiSecret(apiSecret);

    const device = await prisma.device.create({
      data: {
        name,
        user_id: user.user_id,
        api_key: apiKey,
        api_secret: hashedApiSecret,
        is_active: true,
      },
    });

    return c.json(
      {
        device: {
          ...device,
          api_secret: apiSecret,
        },
      },
      201
    );
  } catch (error: any) {
    console.error("Error creating device:", error);
    return c.json({ error: "Failed to create device: " + error.message }, 500);
  }
});

const getDevicesRoute = createRoute({
  method: "get",
  path: "/",
  summary: "Obtener todos los dispositivos del usuario autenticado",
  responses: {
    200: {
      description: "Lista de dispositivos",
      content: {
        "application/json": {
          schema: GetDevicesResponseSchema,
        },
      },
    },
    401: {
      description: "No autenticado",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              error: {
                type: "string",
                example: "User not authenticated",
              },
            },
          },
        },
      },
    },
  },
});

// get all devices for authenticated user
deviceRoutes.openapi(getDevicesRoute, async (c: any) => {
  try {
    const user = c.get("user");

    if (!user) {
      return c.json({ error: "User not authenticated" }, 401);
    }

    const devices = await prisma.device.findMany({
      where: { user_id: user.user_id },
      select: {
        device_id: true,
        name: true,
        user_id: true,
        api_key: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
    });

    return c.json({ devices }, 200);
  } catch (error: any) {
    console.error("Error fetching devices:", error);
    return c.json({ error: "Failed to fetch devices: " + error.message }, 500);
  }
});

//delete device
const deleteDeviceRoute = createRoute({
  method: "delete",
  path: "/{deviceId}",
  summary: "Eliminar un dispositivo",
  responses: {
    200: {
      description: "Dispositivo eliminado exitosamente",
      content: {
        "application/json": {
          schema: DeleteDeviceResponseSchema,
        },
      },
    },
    401: {
      description: "No autenticado",
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

deviceRoutes.openapi(deleteDeviceRoute, async (c: any) => {
  try {
    const user = c.get("user");
    const { deviceId } = c.req.param();

    if (!user) {
      return c.json({ error: "User not authenticated" }, 401);
    }

    // Verificar que el dispositivo existe y pertenece al usuario
    const device = await prisma.device.findUnique({
      where: { device_id: deviceId },
      select: {
        device_id: true,
        user_id: true,
        api_key: true,
        name: true,
      },
    });

    if (!device) {
      return c.json({ error: "Device not found" }, 404);
    }

    if (device.user_id !== user.user_id) {
      return c.json({ error: "Not authorized to delete this device" }, 403);
    }

    // Eliminar del cache KV si existe
    const cacheKey = `device:${device.api_key}`;
    try {
      await c.env.AUTH_KV.delete(cacheKey);
    } catch (error) {
      console.warn("Failed to delete from cache:", error);
      // No es crítico, continuar con la eliminación
    }

    // Eliminar de la base de datos
    await prisma.device.delete({
      where: { device_id: deviceId },
    });

    return c.json(
      {
        message: "Device deleted successfully",
        device_id: deviceId,
        name: device.name,
      },
      200
    );
  } catch (error: any) {
    console.error("Error deleting device:", error);
    return c.json({ error: "Failed to delete device: " + error.message }, 500);
  }
});

// rename device
const renameDeviceRoute = createRoute({
  method: "patch",
  path: "/{deviceId}/rename",
  summary: "Renombrar un dispositivo",
  request: {
    body: {
      content: {
        "application/json": {
          schema: RenameDeviceSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Dispositivo renombrado exitosamente",
      content: {
        "application/json": {
          schema: RenameDeviceSchema,
        },
      },
    },
    401: {
      description: "No autenticado",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

deviceRoutes.openapi(renameDeviceRoute, async (c: any) => {
  try {
    const user = c.get("user");
    const { deviceId } = c.req.param();
    const { name } = c.req.valid("json");

    if (!user) {
      return c.json({ error: "User not authenticated" }, 401);
    }

    // Verificar que el dispositivo existe y pertenece al usuario
    const device = await prisma.device.findUnique({
      where: { device_id: deviceId },
      select: {
        device_id: true,
        user_id: true,
        name: true,
      },
    });

    if (!device) {
      return c.json({ error: "Device not found" }, 404);
    }

    if (device.user_id !== user.user_id) {
      return c.json({ error: "Not authorized to rename this device" }, 403);
    }

    // Actualizar el nombre del dispositivo
    const updatedDevice = await prisma.device.update({
      where: { device_id: deviceId },
      data: { name },
      select: {
        device_id: true,
        user_id: true,
        name: true,
        api_key: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
    });

    return c.json(
      {
        message: "Device renamed successfully",
        device: updatedDevice,
        name: updatedDevice.name,
      },
      200
    );
  } catch (error: any) {
    console.error("Error renaming device:", error);
    return c.json({ error: "Failed to rename device: " + error.message }, 500);
  }
});

//update device status (active/inactive)
const updateDeviceStatusRoute = createRoute({
  method: "patch",
  path: "/{deviceId}/status",
  summary: "Actualizar el estado (activo/inactivo) de un dispositivo",
  request: {
    body: {
      content: {
        "application/json": {
          schema: UpdateDeviceStatusSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Estado del dispositivo actualizado exitosamente",
      content: {
        "application/json": {
          schema: UpdateDeviceStatusSchema,
        },
      },
    },
    401: {
      description: "No autenticado",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

deviceRoutes.openapi(updateDeviceStatusRoute, async (c: any) => {
  try {
    const user = c.get("user");
    const { deviceId } = c.req.param();
    const { is_active } = c.req.valid("json");

    if (!user) {
      return c.json({ error: "User not authenticated" }, 401);
    }

    // Verificar que el dispositivo existe y pertenece al usuario
    const device = await prisma.device.findUnique({
      where: { device_id: deviceId },
      select: {
        device_id: true,
        user_id: true,
        is_active: true,
      },
    });

    if (!device) {
      return c.json({ error: "Device not found" }, 404);
    }

    if (device.user_id !== user.user_id) {
      return c.json({ error: "Not authorized to deactivate this device" }, 403);
    }

    // Actualizar el estado del dispositivo
    const updatedDevice = await prisma.device.update({
      where: { device_id: deviceId },
      data: { is_active },
      select: {
        device_id: true,
        user_id: true,
        is_active: true,
      },
    });

    return c.json(
      {
        message: "Device deactivated successfully",
        device: updatedDevice,
      },
      200
    );
  } catch (error: any) {
    console.error("Error deactivating device:", error);
    return c.json(
      { error: "Failed to deactivate device: " + error.message },
      500
    );
  }
});

const GetDeviceInfoRoute = createRoute({
  method: "get",
  path: "/{deviceId}",
  summary: "Obtener información de un dispositivo específico",
  responses: {
    200: {
      description: "Información del dispositivo",
      content: {
        "application/json": {
          schema: CreateDeviceResponseSchema,
        },
      },
      401: {
        description: "No autenticado",
        content: {
          "application/json": {
            schema: ErrorResponseSchema,
          },
        },
        404: {
          description: "Dispositivo no encontrado",
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
        },
      },
    },
  },
});

deviceRoutes.openapi(GetDeviceInfoRoute, async (c: any) => {
  try {
    const user = c.get("user");
    const { deviceId } = c.req.param();

    if (!user) {
      return c.json({ error: "User not authenticated" }, 401);
    }

    const device = await prisma.device.findUnique({
      where: { device_id: deviceId },
      select: {
        device_id: true,
        name: true,
        user_id: true,
        api_key: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!device) {
      return c.json({ error: "Device not found" }, 404);
    }

    if (device.user_id !== user.user_id) {
      return c.json({ error: "Not authorized to view this device" }, 403);
    }

    return c.json({ device }, 200);
  } catch (error: any) {
    console.error("Error fetching device info:", error);
    return c.json({ error: "Failed to fetch device info: " + error.message }, 500);
  }
});
export default deviceRoutes;
