import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';

// Versión simplificada sin singleton (pero aún optimizada)
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
}).$extends(withAccelerate());

// Opcional: Configurar el cliente para mejor performance
if (process.env.NODE_ENV === 'production') {
  
}