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

### 🔐 Autenticación

#### `POST /auth/register`

Registrar un nuevo usuario

**Request Body:**

```json
{
  "email": "usuario@ejemplo.com",
  "password": "micontraseña123",
  "name": "Nombre Usuario" // opcional
}
```

**Response:**

```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "user": {
    "id": "uuid-del-usuario",
    "email": "usuario@ejemplo.com",
    "name": "Nombre Usuario"
  },
  "token": "jwt-token-aqui"
}
```

#### `POST /auth/login`

Iniciar sesión con credenciales

**Request Body:**

```json
{
  "email": "usuario@ejemplo.com",
  "password": "micontraseña123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login exitoso",
  "user": {
    "id": "uuid-del-usuario",
    "email": "usuario@ejemplo.com",
    "name": "Nombre Usuario"
  },
  "token": "jwt-token-aqui"
}
```

### 📡 Datos de Sensores (IoT)

#### `POST /data`

Enviar datos del sensor (autenticación opcional)

**Headers opcionales:**
```
Authorization: Bearer <jwt-token>
```

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
  "success": true,
  "message": "Datos guardados para usuario autenticado", // o "Datos guardados como anónimo"
  "data": {
    "id": 1,
    "temperature": 25.5,
    "humidity": 60.2,
    "timestamp": "2024-09-16T10:30:00.000Z",
    "user_id": "uuid-del-usuario" // null si es anónimo
  }
}
```

### `GET /data`

Obtener datos de sensores (autenticación opcional)

**Headers opcionales:**
```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**

- `limit` (opcional): Número de registros a obtener (por defecto: 10)

**Comportamiento:**
- **Sin autenticación**: Retorna todos los datos públicos
- **Con autenticación**: Retorna solo los datos del usuario autenticado

**Response:**

```json
{
  "message": "Datos para usuario: usuario@ejemplo.com", // o "Datos públicos"
  "data": [
    {
      "id": 1,
      "temperature": 25.5,
      "humidity": 60.2,
      "timestamp": "2024-09-16T10:30:00.000Z",
      "user_id": "uuid-del-usuario",
      "user": { // solo si está autenticado
        "email": "usuario@ejemplo.com",
        "name": "Nombre Usuario"
      }
    }
  ]
}
```

### `GET /stats`

Obtener estadísticas de sensores (autenticación opcional)

**Headers opcionales:**
```
Authorization: Bearer <jwt-token>
```

**Comportamiento:**
- **Sin autenticación**: Estadísticas globales de todos los datos
- **Con autenticación**: Estadísticas solo de los datos del usuario

**Response:**

```json
{
  "message": "Estadísticas para usuario: usuario@ejemplo.com", // o "Estadísticas globales"
  "stats": {
    "_avg": {
      "temperature": 24.8,
      "humidity": 58.5
    },
    "_min": {
      "temperature": 18.2,
      "humidity": 45.0
    },
    "_max": {
      "temperature": 32.1,
      "humidity": 75.3
    },
    "_count": 150
  }
}
```

## 🔐 Flujo de Autenticación

### 1. Registro de Usuario
```bash
curl -X POST http://localhost:8787/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@ejemplo.com",
    "password": "micontraseña123",
    "name": "Mi Nombre"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:8787/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@ejemplo.com",
    "password": "micontraseña123"
  }'
```

### 3. Usar Token en Requests
```bash
curl -X POST http://localhost:8787/data \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <tu-jwt-token>" \
  -d '{
    "temperature": 25.5,
    "humidity": 60.2
  }'
```

## 🗄️ Esquema de Base de Datos Actualizado

```prisma
model User {
  user_id    String   @id @default(uuid()) @unique
  email      String   @unique 
  password   String   // Hash bcrypt
  name       String?
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
  
  sensorData SensorData[]
  @@map("users")
}

model SensorData {
  id          Int      @id @default(autoincrement())
  user_id     String?  // Null para datos anónimos
  temperature Float
  humidity    Float
  timestamp   DateTime @default(now())
  
  user User? @relation(fields: [user_id], references: [user_id])
  @@map("sensor_data")
}
```

## 🔧 Configuración de Variables de Entorno

Actualiza tu archivo `.env` para incluir el secreto JWT:

```env
DATABASE_URL="postgresql://username:password@host/database"
JWT_SECRET="tu-secreto-jwt-muy-seguro-aqui-cambiar-en-produccion"
```

**⚠️ Importante**: En producción, usa un secreto JWT fuerte y único.

### Configuración de Hono con TypeScript

```typescript
export interface Env {
  DATABASE_URL: string
  JWT_SECRET: string
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

## 🛠️ Scripts Disponibles

```bash
# Desarrollo local
npm run dev

# Desplegar a producción
npm run deploy

# Generar tipos de Cloudflare Workers
npm run cf-typegen

# Comandos de Prisma
npx prisma generate    # Generar cliente
npx prisma migrate dev # Ejecutar migraciones
npx prisma studio      # Abrir Prisma Studio
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
