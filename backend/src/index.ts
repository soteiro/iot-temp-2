import { OpenAPIHono } from '@hono/zod-openapi';
import { Env, Variables } from './types/types';
import authRoutes from '@/routes/auth.routes'
import deviceRoutes from '@/routes/devices.routes'
import dataRoutes from '@/routes/data.routes'
import { cors } from 'hono/cors'
import { rateLimit, RateLimitKeyFunc } from '@elithrar/workers-hono-rate-limit'
import { Context, Next } from 'hono';

const app = new OpenAPIHono<{ Bindings: Env, Variables: Variables }>()

const getKey: RateLimitKeyFunc = (c: Context): string => {
  return c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'anonymous'
}; 

const rateLimiter = async (c: Context, next: Next) => {
  return await rateLimit(c.env.RATE_LIMITER, getKey)(c, next)
}

app.use('*', rateLimiter)

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