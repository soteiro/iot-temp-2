import { OpenAPIHono } from '@hono/zod-openapi';
import { Env, Variables } from './types/types';
import authRoutes from '@/routes/auth.routes'
import deviceRoutes from '@/routes/devices.routes'
import dataRoutes from '@/routes/data.routes'
import userRoutes from '@/routes/users.routes';
import { cors } from 'hono/cors'
import { rateLimit, RateLimitKeyFunc } from '@elithrar/workers-hono-rate-limit'
import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { Toucan } from 'toucan-js';
import { SENTRY_CONFIG } from '../instrument.mjs';

const app = new OpenAPIHono<{ Bindings: Env, Variables: Variables }>()

app.onError((err, c) => {
  // Initialize Toucan for this request
  const sentry = new Toucan({
    ...SENTRY_CONFIG,
    request: c.req.raw,
    context: c.executionCtx,
  });
  
  // Report all unhandled errors to Sentry
  sentry.captureException(err);
  
  if (err instanceof HTTPException) {
    return err.getResponse();
  }
  
  return c.json({ error: "Internal server error" }, 500);
});

app.use((c, next) => {
    // Initialize Toucan for context setting
    const sentry = new Toucan({
      ...SENTRY_CONFIG,
      request: c.req.raw,
      context: c.executionCtx,
    });
    
    // Type assertion to inform TypeScript that session exists on c
    const ctx = c as Context & {
      session?: {
        user?: { email?: string };
        projectId?: string | number | null;
      }
    };

    // Only set user context if session exists and has user data
    if (ctx.session?.user?.email) {
      sentry.setUser({
        email: ctx.session.user.email,
      });
    }

    // Only set project tag if session has project data
    if (ctx.session?.projectId !== undefined && ctx.session?.projectId !== null) {
      sentry.setTag("project_id", ctx.session.projectId.toString());
    }

    return next();
  })

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
  credentials: true,
}))


app.get('/', (c: any) => {
  return c.text('One Hono To Rule Them All!')
})

app.route('/users', userRoutes)
app.route('/auth', authRoutes)
app.route('/devices', deviceRoutes)
app.route('/data', dataRoutes)

app.doc('/docs', {
  openapi: '3.0.0',
  info: { title: 'IoT Temperature API', version: '1.0.0' }
})

app.get("/debug-sentry", () => {
  throw new Error("My first Sentry error!");
});

export default app