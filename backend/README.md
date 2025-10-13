# API de Temperatura IoT

Backend para un sistema de monitoreo de temperatura IoT. Esta API permite gestionar usuarios, dispositivos y los datos de los sensores.

## Tecnologías Utilizadas

- **Framework**: [Hono](https://hono.dev/) - Un framework web pequeño, simple y ultrarrápido para el Edge.
- **ORM**: [Prisma](https://www.prisma.io/) - Un ORM de nueva generación para Node.js y TypeScript.
- **Base de Datos**: PostgreSQL (con Neon)
- **Autenticación**: JWT (JSON Web Tokens) y API Keys para dispositivos.
- **Validación**: [Zod](https://zod.dev/)
- **Testing**: [Vitest](https://vitest.dev/)
- **Despliegue**: [Cloudflare Workers](https://workers.cloudflare.com/)

## Cómo Empezar

### Prerrequisitos

- [Node.js](https://nodejs.org/en/) (v18 o superior)
- [pnpm](https://pnpm.io/)

### Instalación

1.  Clona el repositorio:
    ```bash
    git clone <url-del-repositorio>
    ```
2.  Instala las dependencias:
    ```bash
    pnpm install
    ```
3.  Crea un archivo `.env` basándote en el archivo `.env.example` y completa las variables de entorno requeridas.
4.  Ejecuta las migraciones de la base de datos:
    ```bash
    pnpm prisma migrate dev
    ```

### Ejecutando la Aplicación

Para iniciar el servidor de desarrollo, ejecuta:

```bash
pnpm dev
```

## Endpoints de la API

La documentación de la API se genera automáticamente con `hono-openapi` y se puede consultar en la ruta `/docs` una vez que la aplicación está en ejecución.

### Rutas Principales

- `/users`: Gestión de usuarios.
- `/auth`: Autenticación de usuarios.
- `/devices`: Gestión de dispositivos.
- `/data`: Gestión de los datos de los sensores.

## Esquema de la Base de Datos

El esquema de la base de datos está definido en el archivo `prisma/schema.prisma`.

### Modelos

- **User**: Representa a un usuario de la aplicación.
- **Device**: Representa un dispositivo IoT.
- **SensorData**: Representa una lectura de datos de un sensor de un dispositivo.

## Testing

El proyecto utiliza [Vitest](https://vitest.dev/) para las pruebas. Los tests se encuentran en el directorio `tests/`.

### Comandos para Pruebas

- Ejecutar todos los tests:

    ```bash
    pnpm test
    ```

- Ejecutar los tests en modo "watch":

    ```bash
    pnpm test:watch
    ```

- Calcular la cobertura de los tests:

    ```bash
    pnpm test:coverage
    ```

- Ejecutar los tests de integración:

    ```bash
    pnpm test:integration
    ```
