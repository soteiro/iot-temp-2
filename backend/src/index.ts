import { Hono } from 'hono'
import { sign, verify } from 'hono/jwt'
import { authenticateUser, authenticateDevice } from './lib/auth'
import { prisma } from './lib/prisma'
import bcrypt  from 'bcryptjs'
import { User, Device } from '@prisma/client/edge'
import authRoutes from './routes/auth'
import deviceRoutes from './routes/devices'
import dataRoutes from './routes/data'
import statsRoutes from './routes/stats'

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

app.route('/devices', deviceRoutes)

app.route('/data', dataRoutes);

app.route('/stats', statsRoutes);



export default app