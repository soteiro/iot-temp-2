import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { sign, verify } from 'hono/jwt';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma'; 
import { Env } from '@/types/types';   
import {
  RegisterSchema,
  LoginSchema,
  UserSchema,
  LoginResponseSchema,
  ErrorSchema,
  RefreshTokenSchema,
  TokenResponseSchema,
} from '../schemas/auth.schemas';

// We use OpenAPIHono for routes that will be documented
const auth = new OpenAPIHono<{ Bindings: Env }>();

// --- User Registration Route ---
const registerRoute = createRoute({
  method: 'post',
  path: '/register',
  summary: 'Register a new user',
  request: {
    body: {
      content: { 'application/json': { schema: RegisterSchema } },
    },
  },
  responses: {
    201: { description: 'User created successfully', content: { 'application/json': { schema: UserSchema } } },
    400: { description: 'Bad Request (e.g., user already exists)', content: { 'application/json': { schema: ErrorSchema } } },
    500: { description: 'Internal Server Error', content: { 'application/json': { schema: ErrorSchema } } },
  },
});

auth.openapi(registerRoute, async (c: any) => {
  try {
    const { email, password, name } = c.req.valid('json');

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return c.json({ error: 'User already exists' }, 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name }
    });

    const { password: _, ...userWithoutPassword } = user;
    return c.json(userWithoutPassword, 201);
  } catch (error: any) {
    console.error('Error registering user:', error);
    return c.json({ error: 'Failed to register user: ' + error.message }, 500);
  }
});


// --- User Login Route ---
const loginRoute = createRoute({
    method: 'post',
    path: '/login',
    summary: 'Log in a user',
    request: {
      body: { content: { 'application/json': { schema: LoginSchema } } },
    },
    responses: {
      200: { description: 'Login successful', content: { 'application/json': { schema: LoginResponseSchema } } },
      401: { description: 'Unauthorized (Invalid credentials)', content: { 'application/json': { schema: ErrorSchema } } },
    },
});


// TODO: IMPORTANTE: c:any ya que no consegui tipar correctamente, estudiar bien que es lo que espera de la request y corregir mas adelante por ahora funciona ( si funciona no se toca jajaja )

auth.openapi(loginRoute, async (c: any) => {
  try {
    const { email, password } = c.req.valid('json');

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    const expiredIn = 60 * 60; // 1 hour
    const now = Math.floor(Date.now() / 1000);

    const token = await sign({ sub: user.user_id, name: user.name, email: user.email, exp: now + expiredIn }, c.env.JWT_SECRET);
    const refreshToken = await sign({ sub: user.user_id, type: 'refresh', exp: now + (60 * 60 * 24 * 7) }, c.env.JWT_SECRET);

    const { password: _, ...userWithoutPassword } = user;
    return c.json({ token, refreshToken, user: userWithoutPassword });
  } catch (error: any) {
    console.error('Error logging in:', error);
    return c.json({ error: 'Failed to login: ' + error.message }, 500);
  }
});


// --- Refresh Token Route ---
const refreshRoute = createRoute({
    method: 'post',
    path: '/refresh',
    summary: 'Refresh an access token',
    request: {
      body: { content: { 'application/json': { schema: RefreshTokenSchema } } },
    },
    responses: {
      200: { description: 'Token refreshed successfully', content: { 'application/json': { schema: TokenResponseSchema } } },
      401: { description: 'Unauthorized (Invalid or expired refresh token)', content: { 'application/json': { schema: ErrorSchema } } },
    },
});

auth.openapi(refreshRoute, async (c: any) => {
    try {
        const { refreshToken } = c.req.valid('json');
        const payload = await verify(refreshToken, c.env.JWT_SECRET);

        if (payload.type !== 'refresh') {
            return c.json({ error: 'Invalid token type. Expected a refresh token.' }, 401);
        }

        const user = await prisma.user.findUnique({ where: { user_id: payload.sub as string } });
        if (!user) {
            return c.json({ error: 'User not found' }, 401);
        }

        const newAccessToken = await sign({ sub: user.user_id, name: user.name, email: user.email, exp: Math.floor(Date.now() / 1000) + (60 * 60) }, c.env.JWT_SECRET);
        return c.json({ token: newAccessToken });

    } catch (error: any) {
        if (error.name === 'JwtTokenExpired' || error.name === 'JwtTokenInvalid') {
            return c.json({ error: 'Invalid or expired refresh token' }, 401);
        }
        console.error('Error refreshing token:', error);
        return c.json({ error: 'Failed to refresh token: ' + error.message }, 500);
    }
});

export default auth;
