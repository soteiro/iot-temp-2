# Backend IoT API - Cloudflare Workers

API para Internet de las Cosas (IoT) construida con Cloudflare Workers, Hono.js y Neon PostgreSQL. Permite recolección de datos de sensores, autenticación de dispositivos y usuarios, gestión de dispositivos y usuarios, y estadísticas avanzadas.

## 🏗️ Arquitectura

```bash
Dispositivo IoT → API (Cloudflare Workers + Hono.js) → Prisma Adapter Neon → Neon PostgreSQL
Usuario → API (Cloudflare Workers) → Prisma Adapter Neon → Neon PostgreSQL
```

### Tecnologías utilizadas

- **Runtime:** Cloudflare Workers (Serverless Edge)
- **Framework:** Hono.js
- **Base de datos:** Neon PostgreSQL
- **ORM:** Prisma con adapter directo a Neon
- **Lenguaje:** TypeScript
- **Validación:** Zod
- **Autenticación:** JWT (usuarios) y API Key/Secret (dispositivos)

## 📁 Estructura del Proyecto

```bash
backend/
├── src/
│   ├── index.ts              # API principal con endpoints
│   └── lib/
│       └── prisma.ts         # Configuración de Prisma
├── prisma/
│   ├── schema.prisma         # Esquema de base de datos
│   └── migrations/           # Migraciones de DB
│       ├── migration_lock.toml
│       └── 20250916135318_init/
│           └── migration.sql
├── package.json              # Dependencias y scripts
├── pnpm-lock.yaml           # Lock file de pnpm
├── tsconfig.json            # Configuración TypeScript
├── wrangler.jsonc           # Configuración Cloudflare Workers
├── README.md                # Este archivo
└── DOCUMENTATION.md         # Documentación completa
```

## 🚀 Instalación y Configuración

### 1. Instalar dependencias

```bash
pnpm install
```

### 2. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
DIRECT_DATABASE_URL="postgresql://username:password@host/database"
JWT_SECRET="tu_secreto_super_seguro"
```

### 3. Configurar la base de datos

```bash
# Generar el cliente de Prisma
pnpm prisma generate

# Ejecutar migraciones
pnpm prisma migrate dev
```

## 🛠️ Scripts Disponibles

```bash
# Desarrollo local
pnpm dev

# Desplegar a producción
pnpm deploy

# Generar tipos de Cloudflare Workers
pnpm cf-typegen

# Comandos de Prisma
pnpm prisma generate    # Generar cliente
pnpm prisma migrate dev # Ejecutar migraciones
pnpm prisma studio      # Abrir Prisma Studio
pnpm prisma db push     # Sincronizar schema sin migración
```

## 📡 API Endpoints

### Autenticación de Usuarios

#### `POST /register`
Registrar usuario nuevo
**Body:** `{ email, password, name }`
**Response:** `{ user }`

#### `POST /login`
Login de usuario
**Body:** `{ email, password }`
**Response:** `{ token, user }`

### Autenticación de Dispositivos

Todos los endpoints de dispositivos requieren los headers:
`X-API-Key` y `X-API-Secret`

#### `POST /devices/register`
Registrar nuevo dispositivo
**Body:** `{ name, user_id? }`
**Response:** `{ api_key, api_secret }`

#### `GET /devices`
Listar dispositivos del usuario

#### `PUT /devices/:id`
Actualizar dispositivo

#### `DELETE /devices/:id`
Eliminar dispositivo

### Datos de Sensores

#### `POST /data`
Enviar datos del sensor (requiere autenticación de dispositivo)
**Body:**
```json
{
  "temperature": 25.5,
  "humidity": 60.2
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "temperature": 25.5,
    "humidity": 60.2,
    "device_id": "uuid",
    "timestamp": "2025-09-20T10:30:00.000Z"
  }
}
```

#### `GET /data`
Obtener datos de sensores
**Query:** `limit`, `device_id` (opcional)
**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "temperature": 25.5,
      "humidity": 60.2,
      "device_id": "uuid",
      "timestamp": "2025-09-20T10:30:00.000Z"
    }
  ]
}
```

#### `GET /data/my`
Obtener datos de todos los dispositivos del usuario autenticado

### Estadísticas

#### `GET /stats`
Obtener estadísticas globales
**Response:**
```json
{
  "stats": {
    "_count": 150,
    "_avg": { "temperature": 24.8, "humidity": 58.5 },
    "_max": { "temperature": 27.1, "humidity": 65.2 },
    "_min": { "temperature": 22.0, "humidity": 54.0 }
  }
}
```

#### `GET /stats?device_id=uuid`
Estadísticas de un dispositivo específico

#### `GET /stats/my`
Estadísticas de todos los dispositivos del usuario autenticado

## 🗄️ Esquema de Base de Datos

```prisma
model User {
  user_id    String   @id @default(uuid())
  email      String   @unique @db.VarChar(255)
  password   String   @db.VarChar(255)
  name       String?  @db.VarChar(100)
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
  devices    Device[]
  @@map("users")
}

model Device {
  device_id     String   @id @default(uuid())
  name          String   @db.VarChar(100)
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt
  api_key       String   @unique @db.VarChar(255)
  api_secret    String   @db.VarChar(255)
  is_active     Boolean  @default(true)
  last_seen     DateTime?
  user_id       String?
  user          User?    @relation(fields: [user_id], references: [user_id])
  sensorData    SensorData[]
  @@map("devices")
}

model SensorData {
  id          Int      @id @default(autoincrement())
  temperature Float
  humidity    Float
  timestamp   DateTime @default(now())
  device_id   String?
  device      Device?  @relation(fields: [device_id], references: [device_id])
  @@map("sensor_data")
}
```

## 🔧 Desarrollo

### Configuración de Hono con TypeScript

```typescript
export interface Env {
  DIRECT_DATABASE_URL: string;
  JWT_SECRET: string;
}

const app = new Hono<{ Bindings: Env }>()
```

### Conexión a la Base de Datos

El proyecto utiliza `@prisma/adapter-neon` para conexión directa a Neon PostgreSQL en el edge runtime:

```typescript
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from '@prisma/client/edge'

function getPrisma(connectionString: string) {
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}
```

### Ejemplo de Middleware de Autenticación de Dispositivo

```typescript
import { Context, Next } from 'hono';
import { PrismaClient } from '@prisma/client/edge';
import { PrismaNeon } from '@prisma/adapter-neon';

function getPrisma(connectionString: string) {
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}

export const authenticateDevice = async (c: Context, next: Next) => {
  const apiKey = c.req.header("X-API-Key");
  const apiSecret = c.req.header("X-API-Secret");

  if (!apiKey || !apiSecret) {
    return c.json({ error: "Missing API credentials" }, 401);
  }

  const prisma = getPrisma(c.env.DIRECT_DATABASE_URL);
  const device = await prisma.device.findFirst({
    where: {
      api_key: apiKey,
      api_secret: apiSecret
    }
  });
  if (!device) {
    return c.json({ error: "Invalid API credentials" }, 403);
  }

  c.set("device", device);
  await next();
};
```

### Ejemplo de Middleware de Autenticación de Usuario (JWT)

```typescript
import { verify } from 'hono/jwt';

export const authenticateUser = async (c: Context, next: Next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid Authorization header" }, 401);
  }
  const token = authHeader.split(" ")[1];
  try {
    const payload = await verify(token, c.env.JWT_SECRET);
    const prisma = getPrisma(c.env.DIRECT_DATABASE_URL);
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
```

## 🚀 Despliegue

```bash
# Desplegar a Cloudflare Workers
pnpm deploy
```

El despliegue se realiza automáticamente a través de Wrangler. Asegúrate de tener configuradas las variables de entorno (`DIRECT_DATABASE_URL`, `JWT_SECRET`) en el dashboard de Cloudflare Workers.
