import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { Env } from "@/types/types";
import { prisma } from "@/lib/prisma";
import { UserSchema, ErrorSchema } from "@/schemas/auth.schemas";
import { verify } from 'hono/jwt';
import { getCookie } from 'hono/cookie';

// TODO: añadir test

const userRoutes = new OpenAPIHono<{ Bindings: Env }>();

const profileRoute = createRoute({
    method: 'get',
    path: '/profile',
    summary: 'Get user profile',
    responses: {
      200: {
        description: 'User profile retrieved successfully',
        content: { 'application/json': { schema: UserSchema } },
      },
      401: {
        description: 'Unauthorized (e.g., missing or invalid token)',
        content: { 'application/json': { schema: ErrorSchema } },
      },
      500: {
        description: 'Internal Server Error',
        content: { 'application/json': { schema: ErrorSchema } },
      },
    },
})

userRoutes.openapi(profileRoute, async (c: any) => {
    try {
        // Debug: verificar cookies y headers
        const cookieToken = getCookie(c, 'sb-access-token');
        const authHeader = c.req.header('Authorization');
        
        console.log('Cookie token:', cookieToken ? 'exists' : 'missing');
        console.log('Auth header:', authHeader ? authHeader.substring(0, 20) + '...' : 'missing');
        
        const token = cookieToken || authHeader?.replace('Bearer ', '');

        if (!token) {
            console.log('No token found in cookies or Authorization header');
            return c.json({ error: 'Missing or invalid Authorization header' }, 401);
        }

        console.log('Token found, attempting to verify...');
        const decoded = await verify(token, c.env.JWT_SECRET);
        
        if (!decoded || typeof decoded === 'string' || !decoded.sub) {
            console.log('Token verification failed');
            return c.json({ error: 'Invalid token' }, 401);
        }

        const userId = typeof decoded.sub === 'string' ? decoded.sub : '';
        console.log('User ID from token:', userId);
        
        const user = await prisma.user.findUnique({
            where: { user_id: userId },
            select: { user_id: true, email: true, name: true }
        });

        if (!user) {
            console.log('User not found in database');
            return c.json({ error: 'User not found' }, 404);
        }

        return c.json(user, 200);
    } catch (error: any) {
        console.error('Error fetching user profile:', error);
        return c.json({ error: 'Failed to fetch user profile: ' + error.message }, 500);
    }
});

export default userRoutes;
