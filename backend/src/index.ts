import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { sign, verify } from 'hono/jwt'
import { authenticateUser, authenticateDevice } from './lib/auth'
import bcrypt  from 'bcryptjs'
import crypto from 'crypto'

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
        name 
      }
    })

    const { password: _, ...userWithoutPassword } = user;
    
    return c.json({ user: userWithoutPassword }, 201);
  } catch (error: any) {
    console.error('Error registering user:', error);
    return c.json({ error: 'Failed to register user: ' + error.message }, 500);
  }
})

//login with email and password
app.post('/login', async (c)=>{
  try {
    const prisma = getPrisma(c.env.DIRECT_DATABASE_URL);
    const body = await c.req.json();
    const { email, password } = body;

    if(!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    const expiredIn = 60 * 60
    const now = Math.floor(Date.now() / 1000);

    const token = await sign({
      sub: user.user_id,
      name: user.name,
      email:user.email,
      exp: now + expiredIn
    },
      c.env.JWT_SECRET
    )

    const refreshToken = await sign({
      sub: user.user_id,
      type: 'refresh',
      exp: now + (60 * 60 * 24 * 7) // 7 days
    }, c.env.JWT_SECRET);

    const { password: _, ...userWithoutPassword } = user;
    return c.json({token, refreshToken, user: userWithoutPassword});

  } catch (error: any) {
    console.error('Error logging in:', error);
    return c.json({ error: 'Failed to login: ' + error.message }, 500);
  }
})

// create device with auth
app.post('/devices', authenticateUser, async (c) => {
  try {

    const prisma = getPrisma(c.env.DIRECT_DATABASE_URL);
    const body = await c.req.json();
    const { name, user_id } = body;

    if (!name || !user_id) {
      return c.json({ error: 'Name and user_id are required' }, 400);
    }
    

    // Generate API key and secret
    const apiKey = crypto.randomBytes(16).toString('hex');
    const apiSecret = crypto.randomBytes(32).toString('hex');
    const hashedApiSecret = await bcrypt.hash(apiSecret, 10);
    //create new device
    const device = await prisma.device.create({
      data:{
        name,
        user_id,
        api_key: apiKey,
        api_secret: hashedApiSecret,
        is_active: true,
      }
    });

    return c.json({
      device: {
        ...device,
        api_secret: apiSecret // return plain secret only on creation
      }
    }, 201)

  } catch (error: any) {
    console.error('Error creating device:', error);
    return c.json({ error: 'Failed to create device: ' + error.message }, 500);
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