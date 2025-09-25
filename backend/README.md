# 🌡️ IoT Temperature Backend

Un backend moderno para recolección y gestión de datos de sensores IoT, construido con **Hono.js** y **Prisma** para **Cloudflare Workers**.

## 🚀 Características

- **🔐 Autenticación JWT** para usuarios y dispositivos IoT
- **📊 API RESTful** para gestión de datos de sensores
- **🛡️ Validación robusta** con Zod y OpenAPI
- **⚡ Alto rendimiento** optimizado para Cloudflare Workers
- **🧪 Tests unitarios** con alta cobertura
- **📝 Documentación automática** con OpenAPI/Swagger

## 🏗️ Arquitectura

``` bash
backend/
├── src/
│   ├── index.ts           # Punto de entrada principal
│   ├── lib/               # Utilidades y configuración
│   │   ├── auth.ts        # Middleware de autenticación
│   │   ├── math.ts        # Funciones matemáticas
│   │   └── prisma.ts      # Cliente de base de datos
│   ├── routes/            # Rutas de la API
│   │   ├── auth.routes.ts # Autenticación de usuarios
│   │   ├── data.routes.ts # Datos de sensores
│   │   └── devices.routes.ts # Gestión de dispositivos
│   ├── schemas/           # Validación con Zod
│   │   ├── auth.schemas.ts
│   │   ├── devices.schema.ts
│   │   └── sensorData.schema.ts
│   └── types/             # Tipos TypeScript
├── prisma/                # Base de datos
│   ├── schema.prisma
│   └── migrations/
└── tests/                 # Tests unitarios
```

## 📋 Prerequisitos

- **Node.js** >= 18
- **pnpm** (recomendado) o npm
- **Base de datos** compatible con Prisma (PostgreSQL, MySQL, SQLite)
- **Cloudflare Workers** (para producción)

## ⚙️ Instalación

1.**Clonar el repositorio:**

```bash
git clone <repo-url>
cd iot-temp-2/backend
```

2.**Instalar dependencias:**

```bash
pnpm install
```

3.**Configurar variables de entorno:**

```bash
cp .env.example .env
```

Edita `.env` con tus configuraciones:

```env
DATABASE_URL="your-database-url"
JWT_SECRET="your-jwt-secret"
```

4.**Configurar la base de datos:**

```bash
# Generar cliente Prisma
pnpm prisma generate

# Ejecutar migraciones
pnpm prisma migrate deploy
```

## 🚀 Uso

### Desarrollo Local

```bash
# Iniciar servidor de desarrollo
pnpm dev

# Servidor disponible en http://localhost:8787
```

### Tests

```bash
# Ejecutar todos los tests
pnpm test

# Tests con cobertura
pnpm test:coverage

# Tests en modo watch
pnpm test:watch
```

### Producción

```bash
# Build para producción
pnpm build

# Deploy a Cloudflare Workers
pnpm deploy
```

## 📡 API Endpoints

### 🔐 Autenticación

- `POST /auth/register` - Registrar nuevo usuario
- `POST /auth/login` - Iniciar sesión

### 🖥️ Dispositivos

- `POST /devices` - Crear nuevo dispositivo IoT
- `GET /devices` - Listar dispositivos del usuario
- `PUT /devices/:id` - Actualizar dispositivo
- `DELETE /devices/:id` - Eliminar dispositivo

### 📊 Datos de Sensores

- `POST /data` - Enviar datos de sensor (requiere autenticación de dispositivo)
- `GET /data/data` - Obtener datos históricos
- `GET /data/data/latest` - Obtener últimos datos
- `GET /data/stats` - Estadísticas de sensores

## 🔑 Autenticación

### Usuarios

Usa **JWT tokens** en el header `Authorization`:

```bash
curl -H "Authorization: Bearer <jwt-token>" \
  https://api.example.com/devices
```

### Dispositivos IoT

Usa **API Key/Secret** en headers personalizados:

```bash
curl -H "X-API-Key: <api-key>" \
     -H "X-API-Secret: <api-secret>" \
     -d '{"temperature": 23.5, "humidity": 45.2}' \
     https://api.example.com/data
```

## 📊 Modelo de Datos

### Usuario

```typescript
interface User {
  user_id: string;    // UUID
  username: string;   // Único
  email: string;      // Único
  password: string;   // Hash bcrypt
  created_at: Date;
  updated_at: Date;
}
```

### Dispositivo

```typescript
interface Device {
  device_id: string;  // UUID
  name: string;       // Nombre descriptivo
  user_id: string;    // FK -> User
  api_key: string;    // Para autenticación
  api_secret: string; // Hash bcrypt
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
```

### Datos del Sensor

```typescript
interface SensorData {
  id: number;         // Auto-increment
  device_id: string;  // FK -> Device
  temperature: number; // -50 a 50°C
  humidity: number;   // 0 a 100%
  timestamp: Date;    // Automático
}
```

## 🧪 Testing

El proyecto incluye tests unitarios completos:

- **Schemas**: Validación de datos con Zod
- **Routes**: Endpoints de API
- **Utils**: Funciones matemáticas y utilidades

```bash
# Ejecutar tests específicos
pnpm test auth.spec.ts
pnpm test data.spec.ts
pnpm test devices.spec.ts

# Tests de schemas
pnpm test schemas/
```

## 🔧 Scripts Disponibles

```bash
pnpm dev          # Servidor de desarrollo
pnpm build        # Build para producción
pnpm test         # Ejecutar tests
pnpm test:coverage # Tests con cobertura
pnpm prisma:generate # Generar cliente Prisma
pnpm prisma:migrate  # Ejecutar migraciones
pnpm prisma:studio   # Abrir Prisma Studio
```

## 🌟 Tecnologías

- **[Hono.js](https://hono.dev/)** - Framework web ultrarrápido
- **[Prisma](https://prisma.io/)** - ORM moderno para TypeScript
- **[Zod](https://zod.dev/)** - Validación de esquemas
- **[Vitest](https://vitest.dev/)** - Framework de testing
- **[TypeScript](https://typescriptlang.org/)** - Tipado estático
- **[Cloudflare Workers](https://workers.cloudflare.com/)** - Plataforma serverless

## 🚦 Estado del Proyecto

✅ **Completado:**

- Autenticación JWT y API Keys
- CRUD completo de dispositivos
- Recolección de datos de sensores
- Validación robusta con Zod
- Tests unitarios (alta cobertura)
- Documentación OpenAPI

🔄 **En Progreso:**

- Optimización del endpoint `/data/data`
- Configuración de CI/CD

📋 **Pendiente:**

- endoints para consumir datos agregados (promedios, máximos, mínimos)
- Monitoreo y alertas
- Dashboard administrativo
- Rate limiting
- Integración con servicios externos (p.ej., notificaciones, grafana, etc.)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Si tienes preguntas o necesitas ayuda:

- 🐛 Issues: [GitHub Issues](https://github.com/tu-usuario/iot-temp-2/issues)
- 📖 Documentación: [API Docs](https://tu-api.example.com/docs)

---
