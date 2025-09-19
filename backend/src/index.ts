import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { hashPassword, comparePassword, generateToken, JWTPayload } from './lib/auth'
import { optionalAuthMiddleware } from './lib/middleware'

// Definir la interfaz para las variables de entorno
export interface Env {
  DATABASE_URL: string
  JWT_SECRET: string
}

// Variables de contexto para Hono
interface Variables {
  user?: JWTPayload
}

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

app.get('/', (c) => {
  return c.text('One Hono To Rule Them All!')
})

// ============= ENDPOINTS DE AUTENTICACIÓN =============

// Endpoint para registro de usuarios
app.post('/auth/register', async (c) => {
  try {
    const adapter = new PrismaNeon({ connectionString: c.env.DATABASE_URL })
    const prisma = new PrismaClient({ adapter })
    
    const { email, password, name } = await c.req.json()
    
    if (!email || !password) {
      return c.json({ error: 'Email y contraseña son requeridos' }, 400)
    }
    
    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    
    if (existingUser) {
      return c.json({ error: 'El usuario ya existe' }, 409)
    }
    
    // Hash de la contraseña
    const hashedPassword = await hashPassword(password)
    
    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null
      }
    })
    
    // Generar token JWT
    const token = generateToken(
      { userId: user.user_id, email: user.email },
      c.env.JWT_SECRET
    )
    
    return c.json({
      success: true,
      message: 'Usuario registrado exitosamente',
      user: {
        id: user.user_id,
        email: user.email,
        name: user.name
      },
      token
    }, 201)
    
  } catch (error: any) {
    console.error('Error registrando usuario:', error)
    return c.json({ error: 'Error interno del servidor' }, 500)
  }
})

// Endpoint para login de usuarios
app.post('/auth/login', async (c) => {
  try {
    const adapter = new PrismaNeon({ connectionString: c.env.DATABASE_URL })
    const prisma = new PrismaClient({ adapter })
    
    const { email, password } = await c.req.json()
    
    if (!email || !password) {
      return c.json({ error: 'Email y contraseña son requeridos' }, 400)
    }
    
    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email }
    })
    
    if (!user) {
      return c.json({ error: 'Credenciales inválidas' }, 401)
    }
    
    // Verificar contraseña
    const isValidPassword = await comparePassword(password, user.password)
    
    if (!isValidPassword) {
      return c.json({ error: 'Credenciales inválidas' }, 401)
    }
    
    // Generar token JWT
    const token = generateToken(
      { userId: user.user_id, email: user.email },
      c.env.JWT_SECRET
    )
    
    return c.json({
      success: true,
      message: 'Login exitoso',
      user: {
        id: user.user_id,
        email: user.email,
        name: user.name
      },
      token
    })
    
  } catch (error: any) {
    console.error('Error en login:', error)
    return c.json({ error: 'Error interno del servidor' }, 500)
  }
})

// ============= ENDPOINTS DE DATOS IoT =============

// Endpoint para recibir datos del sensor (con autenticación opcional)
app.post('/data', optionalAuthMiddleware, async (c) => {
  try {
    // Crear el adapter de Neon y el cliente de Prisma con conexión directa
    const adapter = new PrismaNeon({ connectionString: c.env.DATABASE_URL })
    const prisma = new PrismaClient({ adapter })
    
    const data = await c.req.json();
    
    if (!data.temperature || !data.humidity) {
      return c.json({ error: 'Invalid data: temperature and humidity are required' }, 400);
    }

    // Obtener información del usuario si está autenticado
    const user = c.get('user')
    
    // Guardar en la base de datos
    const sensorData = await prisma.sensorData.create({
      data: {
        temperature: parseFloat(data.temperature),
        humidity: parseFloat(data.humidity),
        user_id: user?.userId || null  // Asociar con usuario si está autenticado
      }
    });

    return c.json({ 
      success: true, 
      data: sensorData,
      message: user ? 'Datos guardados para usuario autenticado' : 'Datos guardados como anónimo'
    }, 201);
    
  } catch (error: any) {
    console.error('Error saving sensor data:', error);
    return c.json({ error: 'Failed to save data: ' + error.message }, 500);
  }
});

// Endpoint para obtener los datos más recientes (con autenticación opcional)
app.get('/data', optionalAuthMiddleware, async (c) => {
  try {
    // Crear el adapter de Neon y el cliente de Prisma con conexión directa
    const adapter = new PrismaNeon({ connectionString: c.env.DATABASE_URL })
    const prisma = new PrismaClient({ adapter })
    
    const user = c.get('user')
    
    // Si el usuario está autenticado, mostrar solo sus datos, sino mostrar todos
    const whereClause = user ? { user_id: user.userId } : {}
    
    const recentData = await prisma.sensorData.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
      take: 10,
      include: user ? { user: { select: { email: true, name: true } } } : false
    });

    return c.json({ 
      data: recentData,
      message: user ? `Datos para usuario: ${user.email}` : 'Datos públicos'
    });
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    return c.json({ error: 'Failed to fetch data' }, 500);
  }
});

// Endpoint para obtener estadísticas (con autenticación opcional)
app.get('/stats', optionalAuthMiddleware, async (c) => {
  try {
    // Crear el adapter de Neon y el cliente de Prisma con conexión directa
    const adapter = new PrismaNeon({ connectionString: c.env.DATABASE_URL })
    const prisma = new PrismaClient({ adapter })
    
    const user = c.get('user')
    
    // Si el usuario está autenticado, estadísticas solo de sus datos
    const whereClause = user ? { user_id: user.userId } : {}
    
    const stats = await prisma.sensorData.aggregate({
      where: whereClause,
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

    return c.json({ 
      stats,
      message: user ? `Estadísticas para usuario: ${user.email}` : 'Estadísticas globales'
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});

export default app