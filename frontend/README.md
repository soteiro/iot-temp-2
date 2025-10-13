# Proyecto IoT-Temp-2 Frontend

Este es el frontend para el proyecto IoT-Temp-2, una aplicación web para monitorear en tiempo real la temperatura y humedad de dispositivos IoT.

## ✨ Características

- **Visualización en Tiempo Real:** Gráficos que muestran los datos de temperatura y humedad en tiempo real.
- **Gestión de Dispositivos:** Añade, elimina y gestiona tus dispositivos IoT.
- **Autenticación de Usuarios:** Sistema de registro e inicio de sesión para usuarios.
- **Dashboard Intuitivo:** Una página principal con un resumen de todos tus dispositivos.
- **Análisis de Datos:** Página de análisis con gráficos detallados.
- **Alertas:** Sistema de alertas para notificar sobre lecturas anómalas.
- **Configuración:** Página para configurar las preferencias del usuario.
- **Diseño Responsivo:** Adaptable a diferentes tamaños de pantalla.

## 🚀 Tecnologías Utilizadas

- [Astro](https://astro.build/) - El framework web para construir sitios rápidos.
- [React](https://react.dev/) - Para componentes de interfaz de usuario interactivos.
- [Tailwind CSS](https://tailwindcss.com/) - Para el diseño y los estilos.
- [Zustand](https://zustand-demo.pmnd.rs/) - Para el manejo del estado global de la aplicación.
- [Chart.js](https://www.chartjs.org/) - Para la creación de gráficos.
- [TypeScript](https://www.typescriptlang.org/) - Para un código más robusto y mantenible.

## 📦 Instalación

1. **Clona el repositorio:**

    ```bash
    git clone https://github.com/tu-usuario/iot-temp-2-frontend.git
    cd iot-temp-2-frontend
    ```

2. **Instala las dependencias:**

    Se recomienda usar `pnpm` como gestor de paquetes.

    ```bash
    pnpm install
    ```

## 🏃‍♀️ Ejecutar el Proyecto

Una vez instaladas las dependencias, puedes iniciar el servidor de desarrollo:

```bash
pnpm dev
```

Esto iniciará la aplicación en `http://localhost:4321`.

## 📁 Estructura del Proyecto

```bash
/
├── public/
│   └── favicon.svg
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── devices/
│   │   ├── AnalyticsChart.tsx
│   │   ├── Aside.astro
│   │   └── ...
│   ├── layouts/
│   │   ├── AppLayout.astro
│   │   └── Layout.astro
│   ├── lib/
│   ├── middleware.ts
│   ├── pages/
│   │   ├── dashboard.astro
│   │   ├── devices.astro
│   │   └── ...
│   ├── stores/
│   │   └── useDeviceStore.ts
│   └── styles/
│       └── global.css
└── package.json
```

- **`src/pages`**: Contiene las rutas de la aplicación. Cada archivo `.astro` es una página.
- **`src/components`**: Contiene los componentes reutilizables de la aplicación, tanto en formato `.astro` como `.tsx` (React).
- **`src/layouts`**: Contiene las plantillas de página.
- **`src/stores`**: Contiene el estado global de la aplicación manejado con Zustand.
- **`src/lib`**: Contiene funciones de utilidad.
- **`public`**: Contiene los archivos estáticos, como imágenes y fuentes.
