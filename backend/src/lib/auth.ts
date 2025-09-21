import { Context, Next } from 'hono';
import { verify } from 'hono/jwt';
import { PrismaClient, User, Device } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import bcrypt from 'bcryptjs';

// Define types for Hono context
type HonoEnv = {
    Bindings: {
        DIRECT_DATABASE_URL: string;
        JWT_SECRET: string;
    },
    Variables: {
        user: User,
        device: Device
    }
}

function getPrisma(connectionString: string) {
    const adapter = new PrismaNeon({ connectionString });
    return new PrismaClient({ adapter });
}


// middleware auth devices
export const authenticateDevice = async (c: Context<HonoEnv>, next: Next) => {
    const apiKey = c.req.header("X-API-Key");
    const apiSecret = c.req.header("X-API-Secret");

    if (!apiKey || !apiSecret) {
        return c.json({ error: "Missing API credentials" }, 401);
    }

    const prisma = getPrisma(c.env.DIRECT_DATABASE_URL);
    
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