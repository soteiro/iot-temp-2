import { OpenAPIHono } from '@hono/zod-openapi';
import { Env, Variables } from './types/types';
import authRoutes from '@/routes/auth.routes'
import deviceRoutes from '@/routes/devices.routes'
import dataRoutes from '@/routes/data.routes'

const app = new OpenAPIHono<{ Bindings: Env, Variables: Variables }>()

app.get('/', (c: any) => {
  return c.text('One Hono To Rule Them All!')
})

app.route('/auth', authRoutes)
app.route('/devices', deviceRoutes)
app.route('/data', dataRoutes)

app.doc('/docs', {
  openapi: '3.0.0',
  info: { title: 'IoT Temperature API', version: '1.0.0' }
})

export default app