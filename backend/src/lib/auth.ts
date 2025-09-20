import { Context, Next } from 'hono';
import { verify } from 'hono/jwt';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

function getPrisma(connectionString: string) {
    const adapter = new PrismaNeon({ connectionString });
    return new PrismaClient({ adapter });
}


// middleware auth devices
export const authenticateDevice = async (c: Context, next: Next) => {
    const apiKey = c.req.header("X-API-Key");
    const apiSecret = c.req.header("X-API-Secret");

    if (!apiKey || !apiSecret) {
        return c.json({ error: "Missing API credentials" }, 401);
    }

    const prisma = getPrisma(c.env.DIRECT_DATABASE_URL);
    // Usar findFirst porque api_key y api_secret no son clave compuesta
    const device = await prisma.device.findFirst({
        where: {
            api_key: apiKey,
            api_secret: apiSecret
        }
    });
    if (!device) {
        return c.json({ error: "Invalid API credentials" }, 403);
    }

    c.set("device", device);
    await next();
};

// middleware auth user
export const authenticateUser = async (c: Context, next: Next) => {
    const authHeader = c.req.header("Authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return c.json({ error: "Missing or invalid Authorization header" }, 401);
    }

    // remove Bearer
    const token = authHeader.split(" ")[1];

    try {
        const payload = await verify(token, c.env.JWT_SECRET);
        
        const prisma = getPrisma(c.env.DIRECT_DATABASE_URL);
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