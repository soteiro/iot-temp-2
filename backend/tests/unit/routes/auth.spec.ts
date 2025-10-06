import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocks antes de cargar la app para que sean usadas durante la importación
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

vi.mock('hono/jwt', () => ({
  sign: vi.fn(),
  verify: vi.fn(),
}));

describe('Auth routes (unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('POST /register - crea usuario y responde 201', async () => {
    const prismaMod = await import('@/lib/prisma') as any;
    const bcrypt = await import('bcryptjs') as any;

    prismaMod.prisma.user.findUnique.mockResolvedValue(null);
    bcrypt.default.hash.mockResolvedValue('hashed-password');
    prismaMod.prisma.user.create.mockResolvedValue({
      user_id: 'a1b2c3-d4e5-f678-9012-34567890abcd',
      email: 'reg@example.com',
      name: 'Reg User',
      password: 'hashed-password',
    });

    const { default: app } = await import('@/routes/auth.routes');

    const req = new Request('http://localhost/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'reg@example.com', password: 'password123', name: 'Reg User' }),
    });

    const res = await app.fetch(req, { JWT_SECRET: 'test-secret' } as any);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json).toHaveProperty('user_id', 'a1b2c3-d4e5-f678-9012-34567890abcd');
    expect(json).toHaveProperty('email', 'reg@example.com');
    expect(json).toHaveProperty('name', 'Reg User');
    expect(json).not.toHaveProperty('password');
    expect(prismaMod.prisma.user.create).toHaveBeenCalled();
    const callArg = prismaMod.prisma.user.create.mock.calls[0][0];
    expect(callArg.data.password).toBe('hashed-password');
  });

  it('POST /register - usuario ya existe responde 400', async () => {
    const prismaMod = await import('@/lib/prisma') as any;
    prismaMod.prisma.user.findUnique.mockResolvedValue({ user_id: 'u1', email: 'exists@example.com' });

    const { default: app } = await import('@/routes/auth.routes');

    const req = new Request('http://localhost/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'exists@example.com', password: 'password123', name: 'X' }),
    });

    const res = await app.fetch(req, { JWT_SECRET: 'test-secret' } as any);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json).toHaveProperty('error');
  });

  it('POST /login - éxito devuelve tokens y user', async () => {
    const prismaMod = await import('@/lib/prisma') as any;
    const bcrypt = await import('bcryptjs') as any;
    const jwt = await import('hono/jwt') as any;

    prismaMod.prisma.user.findUnique.mockResolvedValue({
      user_id: 'u2',
      email: 'login@example.com',
      name: 'Login',
      password: 'stored-hash',
    });
    bcrypt.default.compare.mockResolvedValue(true);
    jwt.sign.mockImplementationOnce(async () => 'access-token-mock');
    jwt.sign.mockImplementationOnce(async () => 'refresh-token-mock');

    const { default: app } = await import('@/routes/auth.routes');

    const req = new Request('http://localhost/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'login@example.com', password: 'password123' }),
    });

    const res = await app.fetch(req, { JWT_SECRET: 'test-secret' } as any);
    expect(res.status).toBe(200);
    const json = await res.json() as any;
    expect(json).toHaveProperty('token', 'access-token-mock');
    expect(json).toHaveProperty('refreshToken', 'refresh-token-mock');
    expect(json.user).not.toHaveProperty('password');
  });

  it('POST /login - email inválido responde 401', async () => {
    const prismaMod = await import('@/lib/prisma') as any;
    prismaMod.prisma.user.findUnique.mockResolvedValue(null);

    const { default: app } = await import('@/routes/auth.routes');

    const req = new Request('http://localhost/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nope@example.com', password: 'password123' }),
    });

    const res = await app.fetch(req, { JWT_SECRET: 'test-secret' } as any);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json).toHaveProperty('error');
  });

  it('POST /login - contraseña inválida responde 401', async () => {
    const prismaMod = await import('@/lib/prisma') as any;
    const bcrypt = await import('bcryptjs') as any;

    prismaMod.prisma.user.findUnique.mockResolvedValue({
      user_id: 'u3',
      email: 'user3@example.com',
      name: 'User3',
      password: 'stored-hash',
    });
    bcrypt.default.compare.mockResolvedValue(false);

    const { default: app } = await import('@/routes/auth.routes');

    const req = new Request('http://localhost/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user3@example.com', password: 'wrongpass123' }),
    });

    const res = await app.fetch(req, { JWT_SECRET: 'test-secret' } as any);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json).toHaveProperty('error');
  });

  it('POST /refresh - éxito devuelve nuevo token', async () => {
    const prismaMod = await import('@/lib/prisma') as any;
    const jwt = await import('hono/jwt') as any;

    jwt.verify.mockResolvedValue({ sub: 'u4', type: 'refresh' });
    prismaMod.prisma.user.findUnique.mockResolvedValue({
      user_id: 'u4',
      email: 'r@example.com',
      name: 'R',
      password: 'h',
    });
    jwt.sign.mockResolvedValue('new-access-token');

    const { default: app } = await import('@/routes/auth.routes');

    const req = new Request('http://localhost/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: 'refresh-token' }),
    });

    const res = await app.fetch(req, { JWT_SECRET: 'test-secret' } as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('accessToken', 'new-access-token');
  });

  it('POST /refresh - token con tipo incorrecto responde 401', async () => {
    const jwt = await import('hono/jwt') as any;
    jwt.verify.mockResolvedValue({ sub: 'u5', type: 'access' });

    const { default: app } = await import('@/routes/auth.routes');

    const req = new Request('http://localhost/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: 'bad-type' }),
    });

    const res = await app.fetch(req, { JWT_SECRET: 'test-secret' } as any);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json).toHaveProperty('error');
  });

  it('POST /refresh - token expirado o inválido responde 401', async () => {
    const jwt = await import('hono/jwt') as any;
    const err: any = new Error('expired');
    err.name = 'JwtTokenExpired';
    jwt.verify.mockRejectedValue(err);

    const { default: app } = await import('@/routes/auth.routes');

    const req = new Request('http://localhost/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: 'expired' }),
    });

    const res = await app.fetch(req, { JWT_SECRET: 'test-secret' } as any);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json).toHaveProperty('error');
  });

  // Tests adicionales para casos edge y errores del servidor
  it('POST /register - error del server responde 500', async () => {
    const prismaMod = await import('@/lib/prisma') as any;
    prismaMod.prisma.user.findUnique.mockResolvedValue(null);
    prismaMod.prisma.user.create.mockRejectedValue(new Error('Database error'));

    const { default: app } = await import('@/routes/auth.routes');

    const req = new Request('http://localhost/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'error@example.com', password: 'password123', name: 'Error User' }),
    });

    const res = await app.fetch(req, { JWT_SECRET: 'test-secret' } as any);
    expect(res.status).toBe(500);
    const json = await res.json() as any;
    expect(json).toHaveProperty('error');
    expect(json.error).toContain('Failed to register user');
  });

  it('POST /login - error del server responde 500', async () => {
    const prismaMod = await import('@/lib/prisma') as any;
    prismaMod.prisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'));

    const { default: app } = await import('@/routes/auth.routes');

    const req = new Request('http://localhost/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'error@example.com', password: 'password123' }),
    });

    const res = await app.fetch(req, { JWT_SECRET: 'test-secret' } as any);
    expect(res.status).toBe(500);
    const json = await res.json() as any;
    expect(json).toHaveProperty('error');
    expect(json.error).toContain('Failed to login');
  });

  it('POST /refresh - usuario no encontrado responde 401', async () => {
    const prismaMod = await import('@/lib/prisma') as any;
    const jwt = await import('hono/jwt') as any;

    jwt.verify.mockResolvedValue({ sub: 'non-existent-user', type: 'refresh' });
    prismaMod.prisma.user.findUnique.mockResolvedValue(null);

    const { default: app } = await import('@/routes/auth.routes');

    const req = new Request('http://localhost/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: 'valid-but-user-deleted' }),
    });

    const res = await app.fetch(req, { JWT_SECRET: 'test-secret' } as any);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json).toHaveProperty('error', 'User not found');
  });

  it('POST /refresh - error del server responde 500', async () => {
    const prismaMod = await import('@/lib/prisma') as any;
    const jwt = await import('hono/jwt') as any;

    jwt.verify.mockResolvedValue({ sub: 'u1', type: 'refresh' });
    prismaMod.prisma.user.findUnique.mockRejectedValue(new Error('Database error'));

    const { default: app } = await import('@/routes/auth.routes');

    const req = new Request('http://localhost/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: 'refresh-token' }),
    });

    const res = await app.fetch(req, { JWT_SECRET: 'test-secret' } as any);
    expect(res.status).toBe(500);
    const json = await res.json() as any;
    expect(json).toHaveProperty('error');
    expect(json.error).toContain('Failed to refresh token');
  });
});
