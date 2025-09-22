import { Hono } from 'hono'
import { sign, verify } from 'hono/jwt'
import { authenticateUser, authenticateDevice } from './lib/auth'
import { prisma } from './lib/prisma'
import bcrypt  from 'bcryptjs'
import { User, Device } from '@prisma/client/edge'
import authRoutes from './routes/auth'
import deviceRoutes from './routes/devices'

// Definir la interfaz para las variables de entorno
export interface Env {
  DATABASE_URL: string;
  JWT_SECRET: string;
}

type Variables = {
  user: User;
  device: Device;
}

const app = new Hono<{ Bindings: Env, Variables: Variables }>()

app.get('/', (c) => {
  return c.text('One Hono To Rule Them All!')
})

app.route('/auth', authRoutes)

// create device with auth
app.route('/devices', deviceRoutes)


// Endpoint para recibir datos del sensor
// cloudflare workers limita el tiempo de ejecucion a 10 ms, actualmente este endpoint demora 75-85 ms, hay que optimizarlo, ver otra opcion de despliegue, podria cambiar a mqtt para recibir datos.
app.post('/data', authenticateDevice, async (c) => {
  try {
    const data = await c.req.json();
    const device = c.get('device');
    if (!data.temperature || !data.humidity) {
      return c.json({ error: 'Invalid data: temperature and humidity are required' }, 400);
    }

    // Guardar en la base de datos
    const sensorData = await prisma.sensorData.create({
      data: {
        temperature: parseFloat(data.temperature),
        humidity: parseFloat(data.humidity),
        device_id: device.device_id
        // timestamp se genera automáticamente
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