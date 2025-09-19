// filepath: /home/diego/Escritorio/proyectos/iot-temp-2/backend/src/lib/prisma.ts
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'

// Crear el cliente de Prisma con la extensión Accelerate para edge runtime
export const prisma = new PrismaClient().$extends(withAccelerate())