import { Context, Next } from 'hono';
import { verify } from 'hono/jwt';
import { prisma } from './prisma';
import { Env, Variables } from '@/types/types';

// Define types for Hono context
type HonoEnv = {
    Bindings: Env,
    Variables: Variables
}

// Función optimizada para hashear con SHA-256
async function hashApiSecret(secret: string, salt: string = 'iot-device-salt-2024'): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(secret + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Función optimizada para verificar API secret
async function verifyApiSecret(plainSecret: string, hashedSecret: string): Promise<boolean> {
    const hashedInput = await hashApiSecret(plainSecret);
    return hashedInput === hashedSecret;
}

// middleware auth devices ULTRA OPTIMIZADO
export const authenticateDevice = async (c: Context<HonoEnv>, next: Next) => {
    const startTime = Date.now();
    
    const apiKey = c.req.header("X-API-Key");
    const apiSecret = c.req.header("X-API-Secret");

    if (!apiKey || !apiSecret) {
        return c.json({ error: "Missing API credentials" }, 401);
    }

    // Buscar en KV primero
    const cacheKey = `device:${apiKey}`;
    const cachedDevice = await c.env.AUTH_KV.get(cacheKey, "json");

    if (cachedDevice && typeof cachedDevice === 'object' && 'api_secret' in cachedDevice && 'is_active' in cachedDevice) {
        // Verificación SHA-256 RÁPIDA (~1-2ms)
        const secretIsValid = await verifyApiSecret(apiSecret, (cachedDevice as { api_secret: string }).api_secret);
        
        if (secretIsValid && (cachedDevice as { is_active: boolean }).is_active) {
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
            
            const authTime = Date.now() - startTime;
            console.log(`⚡ Fast auth from cache: ${authTime}ms`);
            
            return await next();
        }
    }

    // Si no está en cache, buscar en DB
    const device = await prisma.device.findUnique({
        where: { api_key: apiKey },
        select: {
            device_id: true,
            name: true,
            user_id: true,
            api_key: true,
            api_secret: true,
            is_active: true,
            created_at: true,
            updated_at: true,
            last_seen: true
        }
    });

    if (!device) {
        return c.json({ error: "Invalid API credentials" }, 403);
    }

    // Verificación SHA-256 desde DB
    const secretIsValid = await verifyApiSecret(apiSecret, device.api_secret);

    if (!secretIsValid) {
        return c.json({ error: "Invalid API credentials" }, 403);
    }

    if (!device.is_active) {
        return c.json({ error: "Device is inactive" }, 403);
    }

    // Cache por más tiempo ya que la verificación es rápida
    await c.env.AUTH_KV.put(cacheKey, JSON.stringify(device), { expirationTtl: 7200 }); // 2 horas

    c.set("device", device);
    
    const authTime = Date.now() - startTime;
    console.log(`🔍 Full auth from DB: ${authTime}ms`);
    
    await next();
};

// middleware auth user (mantener bcrypt para usuarios, solo optimizar devices)
export const authenticateUser = async (c: Context<HonoEnv>, next: Next) => {
    const authHeader = c.req.header("Authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return c.json({ error: "Missing or invalid Authorization header" }, 401);
    }

    const token = authHeader.split(" ")[1];

    try {
        const payload = await verify(token, c.env.JWT_SECRET);

        if (payload.type === 'refresh') {
            return c.json({ error: 'Invalid token type. Cannot use refresh token for authentication.' }, 401);
        }
        
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

// Función helper para migrar devices existentes (ejecutar una sola vez)
export async function migrateDevicesToSHA256() {
    console.log('🔄 Migrando devices de bcrypt a SHA-256...');
    
    const devices = await prisma.device.findMany({
        where: {
            // Asumir que bcrypt hashes empiezan con $2b$
            api_secret: {
                startsWith: '$2b$'
            }
        }
    });
    
    for (const device of devices) {
        // Esto solo funcionará si tienes los secrets originales guardados
        // O si quieres regenerar todos los secrets
        console.log(`Migrating device ${device.device_id}...`);
        
        // Opción 1: Regenerar secret (más seguro)
        const newSecret = crypto.randomUUID();
        const hashedSecret = await hashApiSecret(newSecret);
        
        await prisma.device.update({
            where: { device_id: device.device_id },
            data: { 
                api_secret: hashedSecret,
                // Guardar el secret plano temporalmente para que puedas actualizar el dispositivo
                // secret_plain: newSecret  // Agregar este campo temporal a tu schema
            }
        });
    }
    
    console.log(`✅ Migrated ${devices.length} devices`);
}