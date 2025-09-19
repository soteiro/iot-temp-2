import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

// Definir la interfaz para las variables de entorno
export interface Env {
  DATABASE_URL: string
}

const app = new Hono<{ Bindings: Env }>()

app.get('/', (c) => {
  return c.text('One Hono To Rule Them All!')
})

// Endpoint para recibir datos del sensor
app.post('/data', async (c) => {
  try {
    // Crear el adapter de Neon y el cliente de Prisma con conexión directa
    const adapter = new PrismaNeon({ connectionString: c.env.DATABASE_URL })
    const prisma = new PrismaClient({ adapter })
    
    const data = await c.req.json();
    
    if (!data.temperature || !data.humidity) {
      return c.json({ error: 'Invalid data: temperature and humidity are required' }, 400);
    }

    // Guardar en la base de datos
    const sensorData = await prisma.sensorData.create({
      data: {
        temperature: parseFloat(data.temperature),
        humidity: parseFloat(data.humidity)
      }
    });

    return c.json({ 
      success: true, 
      data: sensorData 
    }, 201);
    
  } catch (error: any) {
    console.error('Error saving sensor data:', error);
    return c.json({ error: 'Failed to save data: ' + error.message }, 500);
  }
});

// Endpoint para obtener los datos más recientes
app.get('/data', async (c) => {
  try {
    // Crear el adapter de Neon y el cliente de Prisma con conexión directa
    const adapter = new PrismaNeon({ connectionString: c.env.DATABASE_URL })
    const prisma = new PrismaClient({ adapter })
    
    const recentData = await prisma.sensorData.findMany({
      orderBy: { timestamp: 'desc' },
      take: 10
    });

    return c.json({ data: recentData });
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    return c.json({ error: 'Failed to fetch data' }, 500);
  }
});

// Endpoint para obtener estadísticas
app.get('/stats', async (c) => {
  try {
    // Crear el adapter de Neon y el cliente de Prisma con conexión directa
    const adapter = new PrismaNeon({ connectionString: c.env.DATABASE_URL })
    const prisma = new PrismaClient({ adapter })
    
    const stats = await prisma.sensorData.aggregate({
      _avg: {
        temperature: true,
        humidity: true
      },
      _min: {
        temperature: true,
        humidity: true
      },
      _max: {
        temperature: true,
        humidity: true
      },
      _count: true
    });

    return c.json({ stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});

export default app