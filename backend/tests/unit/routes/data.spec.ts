import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    sensorData: {
      create: vi.fn(async ({ data }) => ({ id: 1, ...data, created_at: new Date().toISOString() }))
    }
  }
}));

vi.mock('@/lib/auth', () => ({
  // Mock middleware: setea device en contexto y continúa
  authenticateDevice: async (c: any, next: any) => {
    c.set('device', { device_id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' });
    return next();
  },
  // Algunas rutas usan authenticateUser; también lo mockeamos
  authenticateUser: async (c: any, next: any) => {
    c.set('user', { user_id: 'u1', email: 'test@example.com' });
    return next();
  }
}));

describe('POST /data (mocked)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('crea sensor data y responde 201', async () => {
    const body = JSON.stringify({ temperature: 22.5, humidity: 50 });
    const req = new Request('http://localhost/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body
    });

    // Import app after mocks so mocked modules are used during app setup
    const { default: app } = await import('@/index');

    const res = await app.fetch(req);

    expect(res.status).toBe(201);
    const json = await res.json() as { id: number; device_id: string; [key: string]: any };
    expect(json).toHaveProperty('id');
    expect(json.device_id).toBe('a1b2c3d4-e5f6-7890-1234-567890abcdef');

    const { prisma } = await import('@/lib/prisma');
    expect(prisma.sensorData.create).toHaveBeenCalled();
  });
});
