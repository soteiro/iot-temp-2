import { OpenAPIHono } from '@hono/zod-openapi';
import { Env, Variables } from './types/types';
import authRoutes from '@/routes/auth.routes'
import deviceRoutes from '@/routes/devices.routes'
import dataRoutes from '@/routes/data.routes'
import { cors } from 'hono/cors'
import { rateLimiter } from 'hono-rate-limiter'

const app = new OpenAPIHono<{ Bindings: Env, Variables: Variables }>()

app.use('*', cors({
  origin: (origin, c) => {
    if (
      origin === 'http://localhost:4321' ||
      origin === 'https://name.netlify.app'
    ) return origin;
    return null;
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-API-Secret'],
}))

app.use(
  rateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minute
    limit: 5, // Limit each IP to 5 requests per `window` (here, per 1 minute).
    standardHeaders: "draft-6", // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    keyGenerator: (c) => "<unique_key>", // Method to generate custom identifiers for clients.
    // store: ... , // Redis, MemoryStore, etc. See below.
  })
);

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