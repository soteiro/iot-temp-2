import { Hono } from 'hono'
import { sign, verify } from 'hono/jwt'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'
import { Bindings } from 'hono/types';
import { Env } from '../types/types';


// Registro de usuario
const auth = new Hono<{ Bindings: Env }>()

auth.post('/register', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return c.json({ error: 'Email, password, and name are required' }, 400);
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return c.json({ error: 'User already exists' }, 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name }
    });

    const { password: _, ...userWithoutPassword } = user;
    return c.json({ user: userWithoutPassword }, 201);
  } catch (error: any) {
    console.error('Error registering user:', error);
    return c.json({ error: 'Failed to register user: ' + error.message }, 500);
  }
});

// Login de usuario
auth.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    const expiredIn = 60 * 60;
    const now = Math.floor(Date.now() / 1000);

    const token = await sign({
      sub: user.user_id,
      name: user.name,
      email: user.email,
      exp: now + expiredIn
    }, c.env.JWT_SECRET);

    const refreshToken = await sign({
      sub: user.user_id,
      type: 'refresh',
      exp: now + (60 * 60 * 24 * 7)
    }, c.env.JWT_SECRET);

    const { password: _, ...userWithoutPassword } = user;
    return c.json({ token, refreshToken, user: userWithoutPassword });
  } catch (error: any) {
    console.error('Error logging in:', error);
    return c.json({ error: 'Failed to login: ' + error.message }, 500);
  }
});

// Refresh token
auth.post('/refresh', async (c) => {
  try {
    const body = await c.req.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return c.json({ error: 'Refresh token is required' }, 400);
    }

    const payload = await verify(refreshToken, c.env.JWT_SECRET);

    if (payload.type !== 'refresh') {
      return c.json({ error: 'Invalid token type. Expected a refresh token.' }, 401);
    }

    const user = await prisma.user.findUnique({
      where: { user_id: payload.sub as string }
    });

    if (!user) {
      return c.json({ error: 'User not found' }, 401);
    }

    const newAccessToken = await sign({
      sub: user.user_id,
      name: user.name,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + (60 * 60)
    }, c.env.JWT_SECRET);

    return c.json({ token: newAccessToken });
  } catch (error: any) {
    if (error.name === 'JwtTokenExpired' || error.name === 'JwtTokenInvalid') {
      return c.json({ error: 'Invalid or expired refresh token' }, 401);
    }
    console.error('Error refreshing token:', error);
    return c.json({ error: 'Failed to refresh token: ' + error.message }, 500);
  }
});

export default auth