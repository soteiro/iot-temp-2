import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    sensorData: {
      create: vi.fn(),
      findMany: vi.fn()
    }
  }
}));

vi.mock('@/lib/auth', () => ({
  authenticateDevice: vi.fn().mockImplementation(async (c, next) => {
    c.set('device', { device_id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' });
    await next();
  }),
  authenticateUser: vi.fn().mockImplementation(async (c, next) => {
    c.set('user', { user_id: 'u1', email: 'test@example.com' });
    await next();
  })
}));

// Helper para crear requests
const createRequest = (body: object, method: string = 'POST', path: string = '/') => new Request(`http://localhost${path}`, {
  method,
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
  body: method === 'GET' ? undefined : JSON.stringify(body)
});

describe('POST /data', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('debería crear sensor data exitosamente con valores válidos', async () => {
    const mockSensorData = {
      id: 1,
      temperature: 22.5,
      humidity: 50,
      timestamp: new Date().toISOString(),
      device_id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef'
    };

    const prismaMod = await import('@/lib/prisma') as any;
    prismaMod.prisma.sensorData.create.mockResolvedValue(mockSensorData);

    const { default: dataRoutes } = await import('@/routes/data.routes');
    const res = await dataRoutes.fetch(createRequest({ temperature: 22.5, humidity: 50 }), { JWT_SECRET: 'test-secret' } as any);

    expect(res.status).toBe(201);
    expect(prismaMod.prisma.sensorData.create).toHaveBeenCalledWith({
      data: {
        temperature: 22.5,
        humidity: 50,
        device_id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef'
      }
    });

    const responseData = await res.json();
    expect(responseData).toEqual(mockSensorData);
  });

  it.each([
    { temperature: -50, humidity: 0, desc: 'valores límite mínimos' },
    { temperature: 50, humidity: 100, desc: 'valores límite máximos' }
  ])('debería aceptar $desc', async ({ temperature, humidity }) => {
    const prismaMod = await import('@/lib/prisma') as any;
    prismaMod.prisma.sensorData.create.mockResolvedValue({ id: 1, temperature, humidity, timestamp: new Date().toISOString(), device_id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' });

    const { default: dataRoutes } = await import('@/routes/data.routes');
    const res = await dataRoutes.fetch(createRequest({ temperature, humidity }), { JWT_SECRET: 'test-secret' } as any);

    expect(res.status).toBe(201);
  });

  it.each([
    { temperature: 55, humidity: 50, desc: 'temperatura fuera de rango' },
    { temperature: 25, humidity: 150, desc: 'humedad fuera de rango' },
    { temperature: 25, desc: 'campo humidity faltante' }
  ])('debería rechazar por $desc', async (body) => {
    const { default: dataRoutes } = await import('@/routes/data.routes');
    const res = await dataRoutes.fetch(createRequest(body), { JWT_SECRET: 'test-secret' } as any);

    expect(res.status).toBe(400);
  });

  it('debería manejar errores de base de datos', async () => {
    const prismaMod = await import('@/lib/prisma') as any;
    prismaMod.prisma.sensorData.create.mockRejectedValue(new Error('Database error'));

    const { default: dataRoutes } = await import('@/routes/data.routes');
    const res = await dataRoutes.fetch(createRequest({ temperature: 22.5, humidity: 50 }), { JWT_SECRET: 'test-secret' } as any);

    expect(res.status).toBe(400);
    const responseData = await res.json();
    expect(responseData).toEqual({ error: "Invalid request data" });
  });

  it('debería rechazar cuando no hay dispositivo autenticado', async () => {
    const authMod = await import('@/lib/auth') as any;
    authMod.authenticateDevice.mockImplementationOnce(async (c: any, next: any) => {
      await next();
    });

    const { default: dataRoutes } = await import('@/routes/data.routes');
    const res = await dataRoutes.fetch(createRequest({ temperature: 22.5, humidity: 50 }), { JWT_SECRET: 'test-secret' } as any);

    expect(res.status).toBe(401);
    const responseData = await res.json();
    expect(responseData).toEqual({ error: "Unauthorized" });
  });
});

describe('GET /data/{deviceId}', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('debería obtener datos del sensor exitosamente', async () => {
    const mockSensorData = [
      {
        id: 1,
        temperature: 22.5,
        humidity: 50,
        timestamp: new Date().toISOString(),
        device_id: 'device-123'
      },
      {
        id: 2,
        temperature: 23.0,
        humidity: 55,
        timestamp: new Date().toISOString(),
        device_id: 'device-123'
      }
    ];

    const prismaMod = await import('@/lib/prisma') as any;
    prismaMod.prisma.sensorData.findMany.mockResolvedValue(mockSensorData);

    const { default: dataRoutes } = await import('@/routes/data.routes');
    const res = await dataRoutes.fetch(createRequest({}, 'GET', '/device-123'), { JWT_SECRET: 'test-secret' } as any);

    expect(res.status).toBe(200);
    expect(prismaMod.prisma.sensorData.findMany).toHaveBeenCalledWith({
      where: {
        device_id: 'device-123',
        timestamp: {
          gte: expect.any(Date)
        }
      }
    });

    const responseData = await res.json();
    expect(responseData).toEqual(mockSensorData);
  });

  it.each([
    { time: '6', hours: 6, desc: '6 horas' },
    { time: '12', hours: 12, desc: '12 horas' },
    { time: '24', hours: 24, desc: '24 horas (default)' }
  ])('debería filtrar datos de las últimas $desc', async ({ time, hours }) => {
    const prismaMod = await import('@/lib/prisma') as any;
    prismaMod.prisma.sensorData.findMany.mockResolvedValue([]);

    const { default: dataRoutes } = await import('@/routes/data.routes');
    const path = time === '24' ? '/device-123' : `/device-123?time=${time}`;
    
    await dataRoutes.fetch(createRequest({}, 'GET', path), { JWT_SECRET: 'test-secret' } as any);

    const callArgs = prismaMod.prisma.sensorData.findMany.mock.calls[0][0];
    const expectedDate = new Date(Date.now() - hours * 3600000);
    const actualDate = callArgs.where.timestamp.gte;
    
    // Verificar que la fecha esté dentro de un margen de 1 segundo
    expect(Math.abs(actualDate.getTime() - expectedDate.getTime())).toBeLessThan(1000);
  });

  it('debería devolver array vacío cuando no hay datos', async () => {
    const prismaMod = await import('@/lib/prisma') as any;
    prismaMod.prisma.sensorData.findMany.mockResolvedValue([]);

    const { default: dataRoutes } = await import('@/routes/data.routes');
    const res = await dataRoutes.fetch(createRequest({}, 'GET', '/device-123'), { JWT_SECRET: 'test-secret' } as any);

    expect(res.status).toBe(200);
    const responseData = await res.json();
    expect(responseData).toEqual([]);
  });
});
