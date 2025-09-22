import { Context, Next } from 'hono';
import { verify } from 'hono/jwt';
import { PrismaClient, User, Device } from '@prisma/client/edge';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

// Define types for Hono context
type HonoEnv = {
    Bindings: {
        DATABASE_URL: string;
        JWT_SECRET: string;
    },
    Variables: {
        user: User,
        device: Device
    }
}

// middleware auth devices
export const authenticateDevice = async (c: Context<HonoEnv>, next: Next) => {
    const apiKey = c.req.header("X-API-Key");
    const apiSecret = c.req.header("X-API-Secret");

    if (!apiKey || !apiSecret) {
        return c.json({ error: "Missing API credentials" }, 401);
    }
    
    const device = await prisma.device.findUnique({
        where: {
            api_key: apiKey,
        }
    });

    if (!device) {
        return c.json({ error: "Invalid API credentials" }, 403);
    }

    const secretIsValid = await bcrypt.compare(apiSecret, device.api_secret);

    if (!secretIsValid) {
        return c.json({ error: "Invalid API credentials" }, 403);
    }
    
    if (!device.is_active){
        return c.json({ error: "Device is inactive" }, 403);
    }

    c.set("device", device);
    await next();
};

// middleware auth user
export const authenticateUser = async (c: Context<HonoEnv>, next: Next) => {
    const authHeader = c.req.header("Authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return c.json({ error: "Missing or invalid Authorization header" }, 401);
    }

    // remove Bearer
    const token = authHeader.split(" ")[1];

    try {
        const payload = await verify(token, c.env.JWT_SECRET);

        if (payload.type === 'refresh') {
            return c.json({ error: 'Invalid token type. Cannot use refresh token for authentication.' }, 401);
        }
        
        // Verificar que el usuario existe
        const user = await prisma.user.findUnique({
            where: { user_id: payload.sub as string }
        });
        
        if (!user) {
            return c.json({ error: 'User not found' }, 401);
        }
        
        c.set('user', user);
        await next();
    } catch (error) {
        return c.json({ error: 'Invalid token' }, 401);
    }
};