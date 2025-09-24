import { z } from "@hono/zod-openapi";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const CreateSensorDataSchema = z.object({
    temperature: z
      .number()
      .min(-50, { message: "Temperature must be between -50 and 50" })
      .max(50, { message: "Temperature must be between -50 and 50" })
      .openapi({ example: 23.51 }),
    humidity: z
      .number()
      .min(0, { message: "Humidity must be between 0 and 100" })
      .max(100, { message: "Humidity must be between 0 and 100" })
      .openapi({ example: 45.23 }),
})

export const SensorDataSchema = z.object({
    id: z.number().openapi({ example: 1 }),
    temperature: z.number().openapi({ example: 23.51 }),
    humidity: z.number().openapi({ example: 45.23 }),
    timestamp: z.string().openapi({ example: "2023-10-01T12:34:56Z" }),
    device_id: z.string().regex(UUID_REGEX, { message: 'Invalid UUID' }).openapi({ example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' }),
});

export type CreateSensorData = z.infer<typeof CreateSensorDataSchema>;
export type SensorData = z.infer<typeof SensorDataSchema>;