# Temply - Solución Full-Stack para Monitoreo de Temperatura y Humedad (En Desarrollo)

Este repositorio contiene el código fuente completo para **Temply**, un sistema de monitoreo de temperatura y humedad en tiempo real. El proyecto está diseñado como una solución full-stack, abarcando desde el firmware del dispositivo físico hasta la interfaz web para el usuario final.

## Arquitectura del Sistema

El proyecto se divide en tres componentes principales que trabajan en conjunto:

1.  **Firmware (Dispositivo IoT):**
    *   Basado en un microcontrolador **ESP32**, este componente se encarga de la recolección de datos.
    *   Utiliza un sensor **DHT22** para medir la temperatura y la humedad ambiental.
    *   Se conecta a una red WiFi y envía periódicamente los datos recolectados (temperatura, humedad e intensidad de la señal WiFi RSSI) al backend mediante una solicitud HTTP POST.
    *   La comunicación con el backend está securizada mediante un sistema de `API Key` y `API Secret`.

2.  **Backend (API Serverless):**
    *   Construido como una API sin servidor utilizando **Cloudflare Workers** y el framework **Hono**, lo que garantiza un rendimiento rápido y escalable.
    *   Recibe y valida los datos enviados por los dispositivos IoT.
    *   Gestiona la autenticación de dispositivos y usuarios (mediante JWT).
    *   Utiliza **Prisma ORM** para interactuar con una base de datos **PostgreSQL**, donde almacena la información de usuarios, dispositivos y las lecturas de los sensores.
    *   Expone una API RESTful para que el frontend pueda consumir los datos.

3.  **Frontend (Panel de Control Web):**
    *   Una aplicación web moderna construida con **Astro** y componentes interactivos de **React**.
    *   Permite a los usuarios registrarse, iniciar sesión y gestionar sus dispositivos de monitoreo.
    *   Ofrece una visualización de los datos históricos y en tiempo real a través de gráficos interactivos.
    *   Se comunica con el backend para obtener toda la información y presentarla en un dashboard intuitivo y responsivo.

## Stack Tecnológico

| Componente | Tecnología | Propósito |
| :--- | :--- | :--- |
| **Firmware** | PlatformIO (C++/Arduino) | Entorno de desarrollo para el ESP32 |
| | ArduinoJson | Creación de payloads JSON |
| | DHT Sensor Library | Interfaz con el sensor de temperatura/humedad |
| **Backend** | Hono | Framework web para Cloudflare Workers |
| | Prisma | ORM para la gestión de la base de datos |
| | PostgreSQL (Neon) | Base de datos relacional |
| | Zod | Validación de esquemas y datos |
| | Vitest | Pruebas unitarias y de integración |
| | Cloudflare Workers | Plataforma de despliegue serverless |
| **Frontend** | Astro | Framework web para sitios de contenido |
| | React | Librería para componentes de UI interactivos |
| | Tailwind CSS | Framework de diseño CSS |
| | Zustand | Manejo de estado global |
| | Chart.js | Creación de gráficos y visualizaciones |
| | TypeScript | Lenguaje de programación principal |

## Características Principales

- **Monitoreo en Tiempo Real:** Visualiza las lecturas de los sensores a medida que llegan.
- **Gestión de Múltiples Dispositivos:** Registra y administra varios dispositivos IoT desde una sola cuenta.
- **Autenticación Segura:** Sistema de autenticación basado en JWT para usuarios y API Keys para dispositivos.
- **Dashboard Analítico:** Gráficos detallados para analizar las tendencias de temperatura y humedad a lo largo del tiempo.
- **Arquitectura Escalable:** Basado en tecnologías serverless para soportar un crecimiento eficiente.
- **Proyecto Full-Stack:** Código disponible y modularizado para las tres capas de la aplicación (dispositivo, servidor, cliente).

## Puesta en Marcha

Para ejecutar el proyecto completo, sigue los pasos para cada componente:

### 1. Backend

```bash
# Navega al directorio del backend
cd backend

# Instala dependencias
pnpm install

# Configura tus variables de entorno en un archivo .env
# (usa .env.example como plantilla)

# Ejecuta las migraciones de la base de datos
pnpm prisma migrate dev

# Inicia el servidor de desarrollo
pnpm dev
```

### 2. Firmware

1.  Abre el directorio `firmware/` con Visual Studio Code y la extensión PlatformIO.
2.  Modifica el archivo `include/config.h` con las credenciales de tu red WiFi y, lo más importante, la URL de tu backend (obtenida en el paso anterior) y las credenciales del dispositivo.
3.  Conecta tu placa ESP32 y usa los comandos de PlatformIO para construir y subir el firmware.
4.  Abre el monitor serie para verificar que el dispositivo se conecta y envía los datos correctamente.

### 3. Frontend

```bash
# Navega al directorio del frontend
cd frontend

# Instala dependencias
pnpm install

# Inicia el servidor de desarrollo
pnpm dev
```
La aplicación web estará disponible en `http://localhost:4321`.

## Visualización del Proyecto

<!-- 
  Añade aquí capturas de pantalla de la aplicación para hacer el README más atractivo.
  Ejemplos:
  - Captura del Dashboard principal.
  - Gráficos de análisis de temperatura.
  - Página de gestión de dispositivos.
-->

![Dashboard](https://via.placeholder.com/800x400.png?text=Captura+de+Pantalla+del+Dashboard)
