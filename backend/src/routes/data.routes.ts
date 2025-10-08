import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { authenticateDevice, authenticateUser } from "../lib/auth";
import { Env, Variables } from "@/types/types";
import { prisma } from "@/lib/prisma";
import { SensorDataSchema, CreateSensorDataSchema, CreateSensorData } from "../schemas/sensorData.schema";
import { ErrorResponseSchema } from "@/schemas/devices.schema"; 

//TODO: validar datos tem: -50 a 50, hum: 0 a 100 

const dataRoutes = new OpenAPIHono<{ Bindings: Env, Variables: Variables }>();

dataRoutes.use("/", authenticateDevice);
dataRoutes.use("/{deviceId}", authenticateUser);

dataRoutes.openapi(
    createRoute({
        method: "post",
        path: "/",
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: CreateSensorDataSchema
                    }
                }
            }
        },
        responses: {
            201: {
                content: {
                    "application/json": {
                        schema: SensorDataSchema
                    }
                },
                description: "Sensor data created successfully"
            },
            400: {
                content: {
                    "application/json": {
                        schema: ErrorResponseSchema
                    }
                },
                description: "Bad request"
            },
            401: {
                content: {
                    "application/json": {
                        schema: ErrorResponseSchema
                    }
                },
                description: "Unauthorized"
            }
        }
    }),
    async (c: any) => { 
        // TODO, ver bien los tipos. no tengo tiempo ahora.
        try {
            const data = await c.req.json();
            
            // El dispositivo ya está autenticado por el middleware
            const device = c.get("device");
            
            if (!device) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            const sensorData = await prisma.sensorData.create({
                data: {
                    ...data,
                    device_id: device.device_id
                }
            });

            return c.json(sensorData, 201);
        } catch (error) {
            return c.json({ error: "Invalid request data" }, 400);
        }
    }
);


// TODO:  add test
const GetDataByDeviceIdRoute= createRoute({
    method: "get",
    path: "/{deviceId}",
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: SensorDataSchema
                }
            },
            description: "Sensor data retrieved successfully"
        },
        404: {
            content: {
                "application/json": {
                    schema: ErrorResponseSchema
                }
            },
            description: "Sensor data not found"
        },
        401: {
            content: {
                "application/json": {
                    schema: ErrorResponseSchema
                }
            },
            description: "Unauthorized"
        }
    }
})

dataRoutes.openapi(
    GetDataByDeviceIdRoute,
    async (c : any) => {
        const deviceId = c.req.param("deviceId");  
        const time = c.req.query("time") || "24"; // default to 24 hours if not provided
        const hours = Number(time)
        const now = new Date();
        const fromDate = new Date(now.getTime() - (hours * 60 * 60 * 1000)); // Calculate the date 'hours' ago

        const sensorData = await prisma.sensorData.findMany({
            where: {
                device_id: deviceId,
                timestamp: {
                    gte: fromDate
                }
            }
        });

        if (!sensorData) {
            return c.json({ error: "Sensor data not found" }, 404);
        }

        return c.json(sensorData, 200);
    }
);

export default dataRoutes;
