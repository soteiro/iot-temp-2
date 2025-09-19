# 🔐 Flujo de Autenticación JWT - Explicación Completa

## ¿Qué es el Flujo de Autenticación?

El flujo de autenticación es el proceso mediante el cual un usuario se identifica en tu API y obtiene permisos para acceder a recursos protegidos. En este proyecto IoT, implementamos **JWT (JSON Web Tokens)** para manejar la autenticación.

## 🔄 Diagrama del Flujo de Datos

```
1. REGISTRO
   Usuario → POST /auth/register → Validar datos → Hash contraseña → Guardar en DB → Generar JWT → Retornar token

2. LOGIN  
   Usuario → POST /auth/login → Validar credenciales → Comparar contraseña → Generar JWT → Retornar token

3. REQUESTS AUTENTICADOS
   Cliente → Header: Authorization: Bearer <token> → Validar JWT → Extraer info usuario → Procesar request

4. DATOS IoT
   Sensor → POST /data + token → Asociar datos con usuario → Guardar en DB
   Cliente → GET /data + token → Filtrar por usuario → Retornar datos personalizados
```

## 📋 Pasos Detallados del Flujo

### 1. Registro de Usuario (`POST /auth/register`)

**¿Qué sucede internamente?**

1. **Recibir datos**: Email, contraseña, nombre (opcional)
2. **Validar entrada**: Verificar que email y contraseña existan
3. **Verificar duplicados**: Buscar si el email ya está registrado
4. **Hash contraseña**: Usar bcrypt para crear un hash seguro
5. **Crear usuario**: Guardar en la base de datos con UUID único
6. **Generar JWT**: Crear token con ID y email del usuario
7. **Retornar respuesta**: Usuario creado + token JWT

**Código simplificado:**
```typescript
// Validar entrada
if (!email || !password) {
  return error('Email y contraseña requeridos')
}

// Verificar si existe
const existingUser = await prisma.user.findUnique({ where: { email } })
if (existingUser) {
  return error('Usuario ya existe')
}

// Hash contraseña
const hashedPassword = await bcrypt.hash(password, 10)

// Crear usuario
const user = await prisma.user.create({
  data: { email, password: hashedPassword, name }
})

// Generar token
const token = jwt.sign(
  { userId: user.user_id, email: user.email },
  JWT_SECRET,
  { expiresIn: '7d' }
)

// Retornar
return { user, token }
```

### 2. Login de Usuario (`POST /auth/login`)

**¿Qué sucede internamente?**

1. **Recibir credenciales**: Email y contraseña
2. **Buscar usuario**: Verificar que el email exista en la DB
3. **Validar contraseña**: Comparar usando bcrypt
4. **Generar JWT**: Crear nuevo token de sesión
5. **Retornar respuesta**: Datos del usuario + token JWT

**Código simplificado:**
```typescript
// Buscar usuario
const user = await prisma.user.findUnique({ where: { email } })
if (!user) {
  return error('Credenciales inválidas')
}

// Verificar contraseña
const isValid = await bcrypt.compare(password, user.password)
if (!isValid) {
  return error('Credenciales inválidas')
}

// Generar token
const token = jwt.sign(
  { userId: user.user_id, email: user.email },
  JWT_SECRET,
  { expiresIn: '7d' }
)

return { user, token }
```

### 3. Middleware de Autenticación

**¿Qué hace el middleware?**

1. **Extraer token**: Leer el header `Authorization: Bearer <token>`
2. **Verificar token**: Usar la clave secreta para validar JWT
3. **Decodificar payload**: Extraer información del usuario
4. **Agregar al contexto**: Hacer disponible `user` en el request

**Código del middleware:**
```typescript
const authHeader = c.req.header('Authorization')
if (!authHeader || !authHeader.startsWith('Bearer ')) {
  return error('Token requerido')
}

const token = authHeader.substring(7) // Quitar "Bearer "
const decoded = jwt.verify(token, JWT_SECRET)
c.set('user', decoded) // Agregar al contexto
```

### 4. Endpoints Protegidos

**¿Cómo funcionan los endpoints con autenticación opcional?**

Los endpoints IoT (`/data`, `/stats`) usan **autenticación opcional**:

- **Sin token**: Funciona con datos públicos/anónimos
- **Con token**: Filtra datos por usuario autenticado

```typescript
// Obtener usuario del contexto (puede ser undefined)
const user = c.get('user')

// Aplicar filtro condicional
const whereClause = user ? { user_id: user.userId } : {}

// Buscar datos
const data = await prisma.sensorData.findMany({
  where: whereClause,  // Filtro dinámico
  orderBy: { timestamp: 'desc' }
})
```

## 🔧 Configuración Técnica

### Variables de Entorno Requeridas

```env
# Base de datos
DATABASE_URL="postgresql://user:pass@host/db"

# Secreto JWT (¡IMPORTANTE: cambiar en producción!)
JWT_SECRET="tu-secreto-muy-seguro-aqui"
```

### Estructura de JWT

El token JWT contiene esta información:
```json
{
  "userId": "uuid-del-usuario",
  "email": "usuario@ejemplo.com",
  "iat": 1234567890,  // Timestamp creación
  "exp": 1234567890   // Timestamp expiración (7 días)
}
```

## 📱 Ejemplos de Uso

### 1. Registrar Usuario
```bash
curl -X POST http://localhost:8787/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@ejemplo.com",
    "password": "micontraseña123",
    "name": "Juan Pérez"
  }'
```

### 2. Hacer Login
```bash
curl -X POST http://localhost:8787/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@ejemplo.com",
    "password": "micontraseña123"
  }'
```

### 3. Enviar Datos Autenticados
```bash
curl -X POST http://localhost:8787/data \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <tu-token-jwt>" \
  -d '{
    "temperature": 25.5,
    "humidity": 60.2
  }'
```

## 🛡️ Seguridad Implementada

1. **Hash de contraseñas**: bcrypt con salt de 10 rounds
2. **Tokens JWT**: Firmados con secreto fuerte
3. **Expiración**: Tokens expiran en 7 días
4. **Validación de entrada**: Verificación de datos requeridos
5. **Manejo de errores**: Mensajes seguros sin información sensible

## 🔄 Retrocompatibilidad

**¡Importante!** Todos los endpoints existentes siguen funcionando sin autenticación:

- `POST /data` funciona sin token (datos anónimos)
- `GET /data` funciona sin token (datos públicos)
- `GET /stats` funciona sin token (estadísticas globales)

Los sensores IoT existentes **no necesitan modificación** y seguirán enviando datos normalmente.

## 🎯 Beneficios de esta Implementación

1. **Seguridad**: Autenticación robusta con JWT
2. **Flexibilidad**: Autenticación opcional, no obligatoria
3. **Escalabilidad**: Tokens stateless (sin estado en servidor)
4. **Retrocompatibilidad**: No rompe funcionalidad existente
5. **Personalización**: Datos específicos por usuario
6. **Facilidad de uso**: API REST estándar