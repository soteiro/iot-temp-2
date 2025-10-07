import { z } from '@hono/zod-openapi'

//el helper .uuid() esta deprecado, asique se usara regex para validar UUIDs y fechas ISO, confiare en la AI para el regex

// Expresion regular para validar UUID v1-v5
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

//expresion regular para validar fechas ISO 8601
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;


// input para crear un device
export const CreateDeviceSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters"}).max(50, { message: "Name must be at most 50 characters"}),
});


//representacion de un device en las respuestas
export const DeviceSchema = z.object({
    device_id: z.string().regex(UUID_REGEX, { message: 'Invalid UUID' }).openapi({ example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' }),
    name: z.string().openapi({ example: 'Living Room Sensor' }),
    user_id: z.string().regex(UUID_REGEX, { message: 'Invalid UUID' }).openapi({ example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' }),
    api_key: z.string().openapi({ example: '1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p' }),
    is_active: z.boolean().openapi({ example: true }),
    created_at: z.string().regex(ISO_DATE_REGEX, { message: 'Invalid ISO date string' }).openapi({ example: '2023-10-01T12:34:56Z' }),
    updated_at: z.string().regex(ISO_DATE_REGEX, { message: 'Invalid ISO date string' }).openapi({ example: '2023-10-01T12:34:56Z' }),
}).openapi('Device');


export const CreateDeviceResponseSchema = z.object({
    device: DeviceSchema.extend({
        api_secret: z.string().openapi({ example: '3f4e5d6c7b8a9e0f1d2c3b4a5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x' }),
    })
}).openapi('CreateDeviceResponse');

export const ErrorResponseSchema = z.object({
    error: z.string().openapi({ example: 'Error message' }),
}).openapi('ErrorResponse');

export const GetDevicesResponseSchema = z.object({
    devices: z.array(DeviceSchema)
}).openapi('GetDevicesResponse');

export const DeleteDeviceResponseSchema = z.object({
    message: z.string().openapi({ example: 'Device deleted successfully' }),
}).openapi('DeleteDeviceResponse');

export const RenameDeviceSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters"}).max(50, { message: "Name must be at most 50 characters"}),
}).openapi('RenameDeviceRequest');

export const UpdateDeviceStatusSchema = z.object({
    is_active: z.boolean().openapi({ example: false }),
}).openapi('UpdateDeviceStatusRequest');

export type CreateDeviceInput = z.infer<typeof CreateDeviceSchema>;
export type Device = z.infer<typeof DeviceSchema>;
export type CreateDeviceResponse = z.infer<typeof CreateDeviceResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type GetDevicesResponse = z.infer<typeof GetDevicesResponseSchema>;
export type DeleteDeviceResponse = z.infer<typeof DeleteDeviceResponseSchema>;
export type RenameDeviceInput = z.infer<typeof RenameDeviceSchema>;
export type UpdateDeviceStatusInput = z.infer<typeof UpdateDeviceStatusSchema>;
