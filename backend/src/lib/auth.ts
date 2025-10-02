import { Context, Next } from 'hono';
import { verify } from 'hono/jwt';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { Env, Variables } from '@/types/types';

// Define types for Hono context
type HonoEnv = {
    Bindings: Env,
    Variables: Variables
}

// middleware auth devices con cache en KV
export const authenticateDevice = async (c: Context<HonoEnv>, next: Next) => {
    const apiKey = c.req.header("X-API-Key");
    const apiSecret = c.req.header("X-API-Secret");

    if (!apiKey || !apiSecret) {
        return c.json({ error: "Missing API credentials" }, 401);
    }

    // Buscar en KV primero
    const cacheKey = `device:${apiKey}`;
    const cachedDevice = await c.env.AUTH_KV.get(cacheKey, "json");

    if (cachedDevice && typeof cachedDevice === 'object' && 'api_secret' in cachedDevice && 'is_active' in cachedDevice) {
        // Validar el secreto con bcrypt
        const secretIsValid = await bcrypt.compare(apiSecret, (cachedDevice as { api_secret: string }).api_secret);
        if (secretIsValid && (cachedDevice as { is_active: boolean }).is_active) {
            // Ensure cachedDevice matches Device type
            const deviceFromCache = {
                device_id: (cachedDevice as any).device_id,
                name: (cachedDevice as any).name,
                user_id: (cachedDevice as any).user_id,
                api_key: (cachedDevice as any).api_key,
                api_secret: (cachedDevice as any).api_secret,
                is_active: (cachedDevice as any).is_active,
                created_at: (cachedDevice as any).created_at,
                updated_at: (cachedDevice as any).updated_at,
                last_seen: (cachedDevice as any).last_seen ?? null
            };
            c.set("device", deviceFromCache);
            return await next();
        }
        // Si el secreto no es válido, continuar con la validación normal
    }

    // Si no está en cache o el secreto no es válido, buscar en DB
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

    // Guardar en KV por 1 hora (TTL 3600 segundos)
    await c.env.AUTH_KV.put(cacheKey, JSON.stringify(device), { expirationTtl: 3600 });

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