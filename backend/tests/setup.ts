// Setup file for Vitest
// Configure environment variables and global mocks used in tests

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
// Use a local sqlite file by default for integration tests (if used)
process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./.test.db';

// Example: global mock placeholders can be added here if desired.
// vi.mock('../src/lib/prisma', () => ({ prisma: { sensorData: { create: vi.fn() } } }));
