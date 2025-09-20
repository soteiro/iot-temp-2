import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { argon2d } from 'argon2'
import { MiddlewareHandler } from 'hono'
import { authenticateUser } from './lib/auth'
import bcrypt from 'bcryptjs'

// Definir la interfaz para las variables de entorno
export interface Env {
  DIRECT_DATABASE_URL: string; // Usar conexión directa temporalmente
  JWT_SECRET: string;
}

function getPrisma(connectionString: string) {
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}

const app = new Hono<{ Bindings: Env }>()

app.get('/', (c) => {
  return c.text('One Hono To Rule Them All!')
})


app.post('/register', async (c)=> {
  // TODO: agregar validacion con zod, rate limit, sanitizar inputs, front apiKey, cors.
  try {
    const prisma = getPrisma(c.env.DIRECT_DATABASE_URL);
    const body = await c.req.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return c.json({ error: 'Email, password, and name are required' }, 400);
    }

    // check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    if (existingUser){
      return c.json({ error: 'User already exists' }, 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    //creare new user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name // TODO: Hashear la contraseña
      }
    })

    const { password: _, ...userWithoutPassword } = user;
    
    return c.json({ user: userWithoutPassword }, 201);
  } catch (error: any) {
    console.error('Error registering user:', error);
    return c.json({ error: 'Failed to register user: ' + error.message }, 500);
  }
})

// Endpoint para recibir datos del sensor
app.post('/data', async (c) => {
  try {
    const prisma = getPrisma(c.env.DIRECT_DATABASE_URL);
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
    const prisma = getPrisma(c.env.DIRECT_DATABASE_URL);
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
    const prisma = getPrisma(c.env.DIRECT_DATABASE_URL);
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