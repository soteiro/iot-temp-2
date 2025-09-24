import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mocks antes de cargar la app para que sean usadas durante la importación
vi.mock('@/lib/prisma', () => ({
    prisma: {
        device: {
            findUnique: vi.fn(),
            create: vi.fn(),
            findMany: vi.fn(),
            delete: vi.fn(),
            update: vi.fn(),
        }
    }
}));

vi.mock('bcryptjs', () => {
    const mockHash = vi.fn();
    const mockCompare = vi.fn();
    return {
        default: {
            hash: mockHash,
            compare: mockCompare,
        },
        hash: mockHash,
        compare: mockCompare,
    };
});

vi.mock('hono/jwt', () => ({
    sign: vi.fn(),
    verify: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
    authenticateUser: vi.fn().mockImplementation(async (c, next) => {
        c.set('user', {
            user_id: 'a1b2c3d4-e5f6-1890-a234-567890abcdef',
            username: 'testuser',
            email: 'test@example.com'
        });
        await next();
    })
}));

// Mock crypto.getRandomValues
const mockCrypto = {
    getRandomValues: vi.fn((arr) => {
        for (let i = 0; i < arr.length; i++) {
            arr[i] = i % 256;
        }
        return arr;
    })
};

Object.defineProperty(globalThis, 'crypto', {
    value: mockCrypto,
    writable: true
});

describe('Device routes (unit)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetModules();
    });

    it('POST /devices - creates a new device successfully', async () => {
        const prismaMod = await import('@/lib/prisma') as any;
        const bcrypt = await import('bcryptjs') as any;

        // Setup mocks
        bcrypt.hash.mockResolvedValue('hashed-api-secret');
        prismaMod.prisma.device.create.mockResolvedValue({
            device_id: 'a1b2c3d4-e5f6-1890-a234-567890abcdef',
            name: 'Test Device',
            user_id: 'a1b2c3d4-e5f6-1890-a234-567890abcdef',
            api_key: '000102030405060708090a0b0c0d0e0f',
            api_secret: 'hashed-api-secret',
            is_active: true,
            created_at: '2023-10-01T12:34:56Z',
            updated_at: '2023-10-01T12:34:56Z'
        });

        const { default: deviceRoutes } = await import('@/routes/devices.routes');

        const req = new Request('http://localhost/', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer valid-token'
            },
            body: JSON.stringify({ name: 'Test Device' }),
        });

        const res = await deviceRoutes.fetch(req, { JWT_SECRET: 'test-secret' } as any);

        expect(res.status).toBe(201);
        
        const responseBody = await res.json() as any;
        expect(responseBody).toHaveProperty('device');
        expect(responseBody.device).toHaveProperty('device_id');
        expect(responseBody.device).toHaveProperty('name', 'Test Device');
        expect(responseBody.device).toHaveProperty('api_key');
        expect(responseBody.device).toHaveProperty('api_secret');

        // Verify prisma.device.create was called
        expect(prismaMod.prisma.device.create).toHaveBeenCalledWith({
            data: {
                name: 'Test Device',
                user_id: 'a1b2c3d4-e5f6-1890-a234-567890abcdef',
                api_key: '000102030405060708090a0b0c0d0e0f',
                api_secret: 'hashed-api-secret',
                is_active: true,
            }
        });

        // Verify bcrypt.hash was called
        expect(bcrypt.hash).toHaveBeenCalledWith(
            expect.any(String),
            10
        );
    });

    it('POST /devices - returns 400 for invalid request body', async () => {
        const { default: deviceRoutes } = await import('@/routes/devices.routes');

        const req = new Request('http://localhost/', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer valid-token'
            },
            body: JSON.stringify({ name: 'A' }), // Too short
        });

        const res = await deviceRoutes.fetch(req, { JWT_SECRET: 'test-secret' } as any);

        expect(res.status).toBe(400);
    });

    it('POST /devices - returns 400 for missing name', async () => {
        const { default: deviceRoutes } = await import('@/routes/devices.routes');

        const req = new Request('http://localhost/', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer valid-token'
            },
            body: JSON.stringify({}), // Missing name
        });

        const res = await deviceRoutes.fetch(req, { JWT_SECRET: 'test-secret' } as any);

        expect(res.status).toBe(400);
    });

    it('POST /devices - returns 500 when database operation fails', async () => {
        const prismaMod = await import('@/lib/prisma') as any;
        const bcrypt = await import('bcryptjs') as any;

        // Setup mocks
        bcrypt.hash.mockResolvedValue('hashed-api-secret');
        const mockError = new Error('Database connection failed');
        prismaMod.prisma.device.create.mockRejectedValueOnce(mockError);

        const { default: deviceRoutes } = await import('@/routes/devices.routes');

        const req = new Request('http://localhost/', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer valid-token'
            },
            body: JSON.stringify({ name: 'Test Device' }),
        });

        const res = await deviceRoutes.fetch(req, { JWT_SECRET: 'test-secret' } as any);

        expect(res.status).toBe(500);
        
        const responseBody = await res.json() as any;
        expect(responseBody).toHaveProperty('error');
        expect(responseBody.error).toContain('Failed to create device');
    });

    it('POST /devices - generates unique API key and secret', async () => {
        const prismaMod = await import('@/lib/prisma') as any;
        const bcrypt = await import('bcryptjs') as any;

        // Setup mocks
        bcrypt.hash.mockResolvedValue('hashed-api-secret');
        prismaMod.prisma.device.create.mockResolvedValue({
            device_id: 'a1b2c3d4-e5f6-1890-a234-567890abcdef',
            name: 'Test Device',
            user_id: 'a1b2c3d4-e5f6-1890-a234-567890abcdef',
            api_key: '000102030405060708090a0b0c0d0e0f',
            api_secret: 'hashed-api-secret',
            is_active: true,
            created_at: '2023-10-01T12:34:56Z',
            updated_at: '2023-10-01T12:34:56Z'
        });

        const { default: deviceRoutes } = await import('@/routes/devices.routes');

        const req = new Request('http://localhost/', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer valid-token'
            },
            body: JSON.stringify({ name: 'Test Device' }),
        });

        const res = await deviceRoutes.fetch(req, { JWT_SECRET: 'test-secret' } as any);

        expect(res.status).toBe(201);
        
        // Verify crypto.getRandomValues was called twice (for API key and secret)
        expect(mockCrypto.getRandomValues).toHaveBeenCalledTimes(2);
        
        // Verify it was called with Uint8Array of correct sizes
        const calls = mockCrypto.getRandomValues.mock.calls;
        expect(calls[0][0]).toBeInstanceOf(Uint8Array);
        expect(calls[0][0].length).toBe(16); // API key
        expect(calls[1][0]).toBeInstanceOf(Uint8Array);
        expect(calls[1][0].length).toBe(32); // API secret
    });
});