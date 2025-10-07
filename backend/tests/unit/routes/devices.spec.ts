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

vi.mock('@/lib/auth', async () => {
    const actual = await vi.importActual('@/lib/auth') as any;
    return {
        ...actual,
        authenticateUser: vi.fn().mockImplementation(async (c, next) => {
            c.set('user', {
                user_id: 'a1b2c3d4-e5f6-1890-a234-567890abcdef',
                username: 'testuser',
                email: 'test@example.com'
            });
            await next();
        }),
        hashApiSecret: vi.fn().mockResolvedValue('hashed-api-secret-sha256')
    };
});

vi.mock('hono/jwt', () => ({
    sign: vi.fn(),
    verify: vi.fn(),
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

    // ========== POST /devices ========== 
    describe('POST /devices', () => {
        it('creates a new device successfully', async () => {
            const prismaMod = await import('@/lib/prisma') as any;
            const authMod = await import('@/lib/auth') as any;

            authMod.hashApiSecret.mockResolvedValue('hashed-api-secret-sha256');
            prismaMod.prisma.device.create.mockResolvedValue({
                device_id: 'a1b2c3d4-e5f6-1890-a234-567890abcdef',
                name: 'Test Device',
                user_id: 'a1b2c3d4-e5f6-1890-a234-567890abcdef',
                api_key: '000102030405060708090a0b0c0d0e0f',
                api_secret: 'hashed-api-secret-sha256',
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

            // Verify crypto.getRandomValues was called twice (for API key and secret)
            expect(mockCrypto.getRandomValues).toHaveBeenCalledTimes(2);
            expect(authMod.hashApiSecret).toHaveBeenCalledWith(expect.any(String));
        });

        it('returns 400 for validation errors', async () => {
            const { default: deviceRoutes } = await import('@/routes/devices.routes');

            // Test too short name
            const req1 = new Request('http://localhost/', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer valid-token'
                },
                body: JSON.stringify({ name: 'A' }),
            });

            const res1 = await deviceRoutes.fetch(req1, { JWT_SECRET: 'test-secret' } as any);
            expect(res1.status).toBe(400);

            // Test missing name
            const req2 = new Request('http://localhost/', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer valid-token'
                },
                body: JSON.stringify({}),
            });

            const res2 = await deviceRoutes.fetch(req2, { JWT_SECRET: 'test-secret' } as any);
            expect(res2.status).toBe(400);
        });

        it('returns 500 when database operation fails', async () => {
            const prismaMod = await import('@/lib/prisma') as any;
            const authMod = await import('@/lib/auth') as any;

            authMod.hashApiSecret.mockResolvedValue('hashed-api-secret-sha256');
            prismaMod.prisma.device.create.mockRejectedValueOnce(new Error('Database error'));

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
            expect(responseBody.error).toContain('Failed to create device');
        });
    });

    // ========== GET /devices ========== 
    describe('GET /devices', () => {
        it('returns all devices for authenticated user', async () => {
            const prismaMod = await import('@/lib/prisma') as any;

            prismaMod.prisma.device.findMany.mockResolvedValue([
                {
                    device_id: 'device-1',
                    name: 'Device 1',
                    user_id: 'a1b2c3d4-e5f6-1890-a234-567890abcdef',
                    api_key: 'key-1',
                    is_active: true,
                    created_at: '2023-10-01T12:34:56Z',
                    updated_at: '2023-10-01T12:34:56Z'
                },
                {
                    device_id: 'device-2',
                    name: 'Device 2',
                    user_id: 'a1b2c3d4-e5f6-1890-a234-567890abcdef',
                    api_key: 'key-2',
                    is_active: false,
                    created_at: '2023-10-02T12:34:56Z',
                    updated_at: '2023-10-02T12:34:56Z'
                }
            ]);

            const { default: deviceRoutes } = await import('@/routes/devices.routes');

            const req = new Request('http://localhost/', {
                method: 'GET',
                headers: { 
                    'Authorization': 'Bearer valid-token'
                },
            });

            const res = await deviceRoutes.fetch(req, { JWT_SECRET: 'test-secret' } as any);

            expect(res.status).toBe(200);
            
            const responseBody = await res.json() as any;
            expect(responseBody).toHaveProperty('devices');
            expect(responseBody.devices).toHaveLength(2);
            expect(responseBody.devices[0].name).toBe('Device 1');
            expect(responseBody.devices[1].name).toBe('Device 2');

            expect(prismaMod.prisma.device.findMany).toHaveBeenCalledWith({
                where: { user_id: 'a1b2c3d4-e5f6-1890-a234-567890abcdef' },
                select: {
                    device_id: true,
                    name: true,
                    user_id: true,
                    api_key: true,
                    is_active: true,
                    created_at: true,
                    updated_at: true,
                }
            });
        });

        it('returns 500 when database operation fails', async () => {
            const prismaMod = await import('@/lib/prisma') as any;

            prismaMod.prisma.device.findMany.mockRejectedValueOnce(new Error('Database error'));

            const { default: deviceRoutes } = await import('@/routes/devices.routes');

            const req = new Request('http://localhost/', {
                method: 'GET',
                headers: { 
                    'Authorization': 'Bearer valid-token'
                },
            });

            const res = await deviceRoutes.fetch(req, { JWT_SECRET: 'test-secret' } as any);

            expect(res.status).toBe(500);
            const responseBody = await res.json() as any;
            expect(responseBody.error).toContain('Failed to fetch devices');
        });
    });

    // ========== DELETE /devices/{deviceId} ========== 
    describe('DELETE /devices/{deviceId}', () => {
        it('deletes device successfully', async () => {
            const prismaMod = await import('@/lib/prisma') as any;

            prismaMod.prisma.device.findUnique.mockResolvedValue({
                device_id: 'device-123',
                name: 'Test Device',
                user_id: 'a1b2c3d4-e5f6-1890-a234-567890abcdef',
                api_key: 'test-key',
            });

            prismaMod.prisma.device.delete.mockResolvedValue({});

            const { default: deviceRoutes } = await import('@/routes/devices.routes');

            const req = new Request('http://localhost/device-123', {
                method: 'DELETE',
                headers: { 
                    'Authorization': 'Bearer valid-token'
                },
            });

            const mockEnv = {
                JWT_SECRET: 'test-secret',
                AUTH_KV: {
                    delete: vi.fn().mockResolvedValue(undefined)
                }
            };

            const res = await deviceRoutes.fetch(req, mockEnv as any);

            expect(res.status).toBe(200);
            
            const responseBody = await res.json() as any;
            expect(responseBody.message).toBe('Device deleted successfully');
            expect(responseBody.device_id).toBe('device-123');
            expect(responseBody.name).toBe('Test Device');

            expect(prismaMod.prisma.device.delete).toHaveBeenCalledWith({
                where: { device_id: 'device-123' }
            });
        });

        it('returns 404 when device not found', async () => {
            const prismaMod = await import('@/lib/prisma') as any;

            prismaMod.prisma.device.findUnique.mockResolvedValue(null);

            const { default: deviceRoutes } = await import('@/routes/devices.routes');

            const req = new Request('http://localhost/device-999', {
                method: 'DELETE',
                headers: { 
                    'Authorization': 'Bearer valid-token'
                },
            });

            const res = await deviceRoutes.fetch(req, { JWT_SECRET: 'test-secret' } as any);

            expect(res.status).toBe(404);
            const responseBody = await res.json() as any;
            expect(responseBody.error).toBe('Device not found');
        });

        it('returns 403 when user does not own device', async () => {
            const prismaMod = await import('@/lib/prisma') as any;

            prismaMod.prisma.device.findUnique.mockResolvedValue({
                device_id: 'device-123',
                name: 'Test Device',
                user_id: 'different-user-id',
                api_key: 'test-key',
            });

            const { default: deviceRoutes } = await import('@/routes/devices.routes');

            const req = new Request('http://localhost/device-123', {
                method: 'DELETE',
                headers: { 
                    'Authorization': 'Bearer valid-token'
                },
            });

            const res = await deviceRoutes.fetch(req, { JWT_SECRET: 'test-secret' } as any);

            expect(res.status).toBe(403);
            const responseBody = await res.json() as any;
            expect(responseBody.error).toBe('Not authorized to delete this device');
        });
    });

    // ========== PATCH /devices/{deviceId}/rename ========== 
    describe('PATCH /devices/{deviceId}/rename', () => {
        it('renames device successfully', async () => {
            const prismaMod = await import('@/lib/prisma') as any;

            prismaMod.prisma.device.findUnique.mockResolvedValue({
                device_id: 'device-123',
                name: 'Old Name',
                user_id: 'a1b2c3d4-e5f6-1890-a234-567890abcdef',
            });

            prismaMod.prisma.device.update.mockResolvedValue({
                device_id: 'device-123',
                name: 'New Name',
                user_id: 'a1b2c3d4-e5f6-1890-a234-567890abcdef',
                api_key: 'test-key',
                is_active: true,
                created_at: '2023-10-01T12:34:56Z',
                updated_at: '2023-10-01T12:34:56Z'
            });

            const { default: deviceRoutes } = await import('@/routes/devices.routes');

            const req = new Request('http://localhost/device-123/rename', {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer valid-token'
                },
                body: JSON.stringify({ name: 'New Name' }),
            });

            const res = await deviceRoutes.fetch(req, { JWT_SECRET: 'test-secret' } as any);

            expect(res.status).toBe(200);
            
            const responseBody = await res.json() as any;
            expect(responseBody.message).toBe('Device renamed successfully');
            expect(responseBody.device.name).toBe('New Name');

            expect(prismaMod.prisma.device.update).toHaveBeenCalledWith({
                where: { device_id: 'device-123' },
                data: { name: 'New Name' },
                select: {
                    device_id: true,
                    user_id: true,
                    name: true,
                    api_key: true,
                    is_active: true,
                    created_at: true,
                    updated_at: true,
                }
            });
        });

        it('returns 404 when device not found', async () => {
            const prismaMod = await import('@/lib/prisma') as any;

            prismaMod.prisma.device.findUnique.mockResolvedValue(null);

            const { default: deviceRoutes } = await import('@/routes/devices.routes');

            const req = new Request('http://localhost/device-999/rename', {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer valid-token'
                },
                body: JSON.stringify({ name: 'New Name' }),
            });

            const res = await deviceRoutes.fetch(req, { JWT_SECRET: 'test-secret' } as any);

            expect(res.status).toBe(404);
            const responseBody = await res.json() as any;
            expect(responseBody.error).toBe('Device not found');
        });

        it('returns 400 for invalid name', async () => {
            const { default: deviceRoutes } = await import('@/routes/devices.routes');

            const req = new Request('http://localhost/device-123/rename', {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer valid-token'
                },
                body: JSON.stringify({ name: 'A' }), // Too short
            });

            const res = await deviceRoutes.fetch(req, { JWT_SECRET: 'test-secret' } as any);

            expect(res.status).toBe(400);
        });
    });

    // ========== PATCH /devices/{deviceId}/status ========== 
    describe('PATCH /devices/{deviceId}/status', () => {
        it('updates device status successfully', async () => {
            const prismaMod = await import('@/lib/prisma') as any;

            prismaMod.prisma.device.findUnique.mockResolvedValue({
                device_id: 'device-123',
                user_id: 'a1b2c3d4-e5f6-1890-a234-567890abcdef',
                is_active: true,
            });

            prismaMod.prisma.device.update.mockResolvedValue({
                device_id: 'device-123',
                user_id: 'a1b2c3d4-e5f6-1890-a234-567890abcdef',
                is_active: false,
            });

            const { default: deviceRoutes } = await import('@/routes/devices.routes');

            const req = new Request('http://localhost/device-123/status', {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer valid-token'
                },
                body: JSON.stringify({ is_active: false }),
            });

            const res = await deviceRoutes.fetch(req, { JWT_SECRET: 'test-secret' } as any);

            expect(res.status).toBe(200);
            
            const responseBody = await res.json() as any;
            expect(responseBody.message).toBe('Device deactivated successfully');
            expect(responseBody.device.is_active).toBe(false);

            expect(prismaMod.prisma.device.update).toHaveBeenCalledWith({
                where: { device_id: 'device-123' },
                data: { is_active: false },
                select: {
                    device_id: true,
                    user_id: true,
                    is_active: true,
                }
            });
        });

        it('returns 404 when device not found', async () => {
            const prismaMod = await import('@/lib/prisma') as any;

            prismaMod.prisma.device.findUnique.mockResolvedValue(null);

            const { default: deviceRoutes } = await import('@/routes/devices.routes');

            const req = new Request('http://localhost/device-999/status', {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer valid-token'
                },
                body: JSON.stringify({ is_active: false }),
            });

            const res = await deviceRoutes.fetch(req, { JWT_SECRET: 'test-secret' } as any);

            expect(res.status).toBe(404);
            const responseBody = await res.json() as any;
            expect(responseBody.error).toBe('Device not found');
        });

        it('returns 400 for invalid status value', async () => {
            const { default: deviceRoutes } = await import('@/routes/devices.routes');

            const req = new Request('http://localhost/device-123/status', {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer valid-token'
                },
                body: JSON.stringify({ is_active: 'invalid' }), // Should be boolean
            });

            const res = await deviceRoutes.fetch(req, { JWT_SECRET: 'test-secret' } as any);

            expect(res.status).toBe(400);
        });
    });
});