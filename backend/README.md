# Backend IoT API - Cloudflare Workers

API para Internet de las Cosas (IoT) construida con Cloudflare Workers, Hono.js y Neon PostgreSQL para recolección de datos de sensores de temperatura y humedad.

## 🏗️ Arquitectura

```bash
Dispositivo IoT → API (Cloudflare Workers) → Adapter Neon → Neon PostgreSQL
```

### Tecnologías utilizadas

- **Runtime:** Cloudflare Workers (Serverless Edge)
- **Framework:** Hono.js
- **Base de datos:** Neon PostgreSQL
- **ORM:** Prisma con adapter directo a Neon
- **Lenguaje:** TypeScript

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
DATABASE_URL="postgresql://username:password@host/database"
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
```

## 📡 API Endpoints

### `POST /data`

Enviar datos del sensor

**Request Body:**

```json
{
  "temperature": 25.5,
  "humidity": 60.2
}
```

**Response:**

```json
{
  "message": "Data saved successfully",
  "data": {
    "id": 1,
    "temperature": 25.5,
    "humidity": 60.2,
    "timestamp": "2024-09-16T10:30:00.000Z"
  }
}
```

### `GET /data`

Obtener todos los datos de sensores

**Query Parameters:**

- `limit` (opcional): Número de registros a obtener (por defecto: 100)

**Response:**

```json
{
  "data": [
    {
      "id": 1,
      "temperature": 25.5,
      "humidity": 60.2,
      "timestamp": "2024-09-16T10:30:00.000Z"
    }
  ]
}
```

### `GET /stats`

Obtener estadísticas básicas

**Response:**

```json
{
  "total": 150,
  "avgTemperature": 24.8,
  "avgHumidity": 58.5,
  "latest": {
    "temperature": 25.5,
    "humidity": 60.2,
    "timestamp": "2024-09-16T10:30:00.000Z"
  }
}
```

## 🗄️ Esquema de Base de Datos

```prisma
model SensorData {
  id          Int      @id @default(autoincrement())
  temperature Float
  humidity    Float
  timestamp   DateTime @default(now())

  @@map("sensor_data")
}
```

## 🔧 Desarrollo

### Configuración de Hono con TypeScript

```typescript
export interface Env {
  DATABASE_URL: string
}

const app = new Hono<{ Bindings: Env }>()
```

### Conexión a la Base de Datos

El proyecto utiliza `@prisma/adapter-neon` para conexión directa a Neon PostgreSQL en el edge runtime:

```typescript
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from '@prisma/client'

const adapter = new PrismaNeon({ connectionString: c.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })
```

## 📚 Documentación Adicional

Para información detallada sobre errores comunes, soluciones y proceso de desarrollo completo, consulta [`DOCUMENTATION.md`](./DOCUMENTATION.md).

## 🚀 Despliegue

```bash
# Desplegar a Cloudflare Workers
pnpm deploy
```

El despliegue se realiza automáticamente a través de Wrangler. Asegúrate de tener configuradas las variables de entorno en el dashboard de Cloudflare Workers.

## 🐛 Solución de Problemas

Si encuentras problemas comunes como:

- Tablas no visibles en la consola de Neon
- Errores de runtime en Edge
- Problemas de compatibilidad con Prisma

Consulta la [documentación completa](./DOCUMENTATION.md) que incluye todos los errores encontrados durante el desarrollo y sus soluciones.
