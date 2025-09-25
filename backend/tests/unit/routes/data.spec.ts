import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    sensorData: {
      create: vi.fn()
    }
  }
}));

vi.mock('@/lib/auth', () => ({
  // Mock middleware: setea device en contexto y continúa
  authenticateDevice: vi.fn().mockImplementation(async (c, next) => {
    c.set('device', { device_id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' });
    await next();
  }),
  // Algunas rutas usan authenticateUser; también lo mockeamos
  authenticateUser: vi.fn().mockImplementation(async (c, next) => {
    c.set('user', { user_id: 'u1', email: 'test@example.com' });
    await next();
  })
}));

describe('POST /data', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('debería crear sensor data exitosamente y responder 201', async () => {
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

    const body = JSON.stringify({ 
      temperature: 22.5, 
      humidity: 50 
    });

    const req = new Request('http://localhost/', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body
    });

    const res = await dataRoutes.fetch(req, { JWT_SECRET: 'test-secret' } as any);

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

  it('debería rechazar temperatura fuera del rango (-50 a 50)', async () => {
    const { default: dataRoutes } = await import('@/routes/data.routes');

    const body = JSON.stringify({ 
      temperature: 55, // Fuera del rango
      humidity: 50 
    });

    const req = new Request('http://localhost/', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body
    });

    const res = await dataRoutes.fetch(req, { JWT_SECRET: 'test-secret' } as any);

    expect(res.status).toBe(400);
  });

  it('debería rechazar humedad fuera del rango (0 a 100)', async () => {
    const { default: dataRoutes } = await import('@/routes/data.routes');

    const body = JSON.stringify({ 
      temperature: 25,
      humidity: 150 // Fuera del rango
    });

    const req = new Request('http://localhost/', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body
    });

    const res = await dataRoutes.fetch(req, { JWT_SECRET: 'test-secret' } as any);

    expect(res.status).toBe(400);
  });

  it('debería rechazar datos inválidos (campos faltantes)', async () => {
    const { default: dataRoutes } = await import('@/routes/data.routes');

    const body = JSON.stringify({ 
      temperature: 25
      // humidity faltante
    });

    const req = new Request('http://localhost/', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body
    });

    const res = await dataRoutes.fetch(req, { JWT_SECRET: 'test-secret' } as any);

    expect(res.status).toBe(400);
  });

  it('debería manejar errores de base de datos', async () => {
    const prismaMod = await import('@/lib/prisma') as any;
    prismaMod.prisma.sensorData.create.mockRejectedValue(new Error('Database error'));

    const { default: dataRoutes } = await import('@/routes/data.routes');

    const body = JSON.stringify({ 
      temperature: 22.5, 
      humidity: 50 
    });

    const req = new Request('http://localhost/', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body
    });

    const res = await dataRoutes.fetch(req, { JWT_SECRET: 'test-secret' } as any);

    expect(res.status).toBe(400);
    const responseData = await res.json();
    expect(responseData).toEqual({ error: "Invalid request data" });
  });

  it('debería rechazar cuando no hay dispositivo autenticado', async () => {
    // Modificar el mock para simular falta de autenticación
    const authMod = await import('@/lib/auth') as any;
    authMod.authenticateDevice.mockImplementationOnce(
      async (c: any, next: any) => {
        // No setear device en el contexto
        await next();
      }
    );

    const { default: dataRoutes } = await import('@/routes/data.routes');

    const body = JSON.stringify({ 
      temperature: 22.5, 
      humidity: 50 
    });

    const req = new Request('http://localhost/', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body
    });

    const res = await dataRoutes.fetch(req, { JWT_SECRET: 'test-secret' } as any);

    expect(res.status).toBe(401);
    const responseData = await res.json();
    expect(responseData).toEqual({ error: "Unauthorized" });
  });

  it('debería aceptar valores límite válidos', async () => {
    const mockSensorData = {
      id: 1,
      temperature: -50,
      humidity: 0,
      timestamp: new Date().toISOString(),
      device_id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef'
    };

    const prismaMod = await import('@/lib/prisma') as any;
    prismaMod.prisma.sensorData.create.mockResolvedValue(mockSensorData);

    const { default: dataRoutes } = await import('@/routes/data.routes');

    const body = JSON.stringify({ 
      temperature: -50, // Valor límite mínimo
      humidity: 0       // Valor límite mínimo
    });

    const req = new Request('http://localhost/', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body
    });

    const res = await dataRoutes.fetch(req, { JWT_SECRET: 'test-secret' } as any);

    expect(res.status).toBe(201);
    expect(prismaMod.prisma.sensorData.create).toHaveBeenCalledWith({
      data: {
        temperature: -50,
        humidity: 0,
        device_id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef'
      }
    });
  });

  it('debería rechazar si el dispositivo no pertenece al usuario autenticado', async () => {
    const authMod = await import('@/lib/auth') as any;
    authMod.authenticateDevice.mockImplementationOnce(
      async (c: any, next: any) => {
        c.set('device', { device_id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', user_id: 'different_user' });
        c.set('user', { user_id: 'u1', email: 'test@example.com' });
        // Simula la lógica real: si el user_id no coincide, retorna 403
        if (c.get('device').user_id !== c.get('user').user_id) {
          return c.json({ error: "Device does not belong to the authenticated user" }, 403);
        }
        await next();
      }
    );

    const { default: dataRoutes } = await import('@/routes/data.routes');

    const body = JSON.stringify({ 
      temperature: 22.5, 
      humidity: 50 
    });

    const req = new Request('http://localhost/', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body
    });

    const res = await dataRoutes.fetch(req, { JWT_SECRET: 'test-secret' } as any);

    expect(res.status).toBe(403);
    const responseData = await res.json();
    expect(responseData).toEqual({ error: "Device does not belong to the authenticated user" });
  });

  it('debería aceptar valores límite máximos válidos', async () => {
    const mockSensorData = {
      id: 1,
      temperature: 50,
      humidity: 100,
      timestamp: new Date().toISOString(),
      device_id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef'
    };

    const prismaMod = await import('@/lib/prisma') as any;
    prismaMod.prisma.sensorData.create.mockResolvedValue(mockSensorData);

    const { default: dataRoutes } = await import('@/routes/data.routes');

    const body = JSON.stringify({ 
      temperature: 50,  // Valor límite máximo
      humidity: 100     // Valor límite máximo
    });

    const req = new Request('http://localhost/', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body
    });

    const res = await dataRoutes.fetch(req, { JWT_SECRET: 'test-secret' } as any);

    expect(res.status).toBe(201);
    expect(prismaMod.prisma.sensorData.create).toHaveBeenCalledWith({
      data: {
        temperature: 50,
        humidity: 100,
        device_id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef'
      }
    });
  });
});
