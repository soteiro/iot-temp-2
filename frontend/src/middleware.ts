import { defineMiddleware } from 'astro/middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Lista de rutas protegidas
  const protectedRoutes = ['/dashboard', '/devices', '/settings', '/profile'];

  // Si la ruta es protegida
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    const token = context.cookies.get('sb-access-token');
    if (!token) {
      // Redirige a login si no hay cookie
      return context.redirect('/login');
    }
    // Aquí podrías validar el token si quieres mayor seguridad
  }

  return next();
});