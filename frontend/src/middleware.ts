import { defineMiddleware } from 'astro/middleware';

const siteUrl = import.meta.env.PUBLIC_API_URL;

const url = `${siteUrl}/api`; //<--- producción (con proxy en astro.config.mjs) 
const [ SECOND, MIN, HOUR, DAYS ] = [ 1, 60, 3600, 86400 ];

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  const protectedRoutes = [
    '/dashboard',
    '/devices',
    '/settings',
    '/profile'
  ];
  
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    let token = context.cookies.get('sb-access-token')?.value;

    // Si NO hay access token, intenta refresh
    if (!token) {
      const refreshtoken = context.cookies.get('sb-refresh-token')?.value;
      if (!refreshtoken) {
        return context.redirect('/login');
      }

      const refreshRes = await fetch(`${siteUrl}/auth/refresh`, {
        method: 'post',
        headers: { 
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ refreshToken: refreshtoken })
      });

      if (!refreshRes.ok) {
        return context.redirect('/login');
      }

      const refreshData = await refreshRes.json();

      if (!refreshData.accessToken) {
        return context.redirect('/login');
      }

      context.cookies.set('sb-access-token', refreshData.accessToken, {
        path: '/',
        httpOnly: true,
        sameSite: 'none',
        secure: true,
        maxAge: 5 * MIN   
      });

      // Actualiza el token para la siguiente validación
      token = refreshData.accessToken;
    }

    // Validar token de acceso (ya sea el original o el refrescado)
    const res = await fetch(`${siteUrl}/auth/validate`, {
      method: 'get',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include' 
    });

    if (!res.ok) {
      return context.redirect('/login');
    } 

    const data = await res.json();
    if (!data.valid) {
      // Si el token sigue sin ser válido, intenta refresh una vez más
      const refreshtoken = context.cookies.get('sb-refresh-token')?.value;
      if (!refreshtoken) {
        return context.redirect('/login');
      }

      const refreshRes = await fetch(`${siteUrl}/auth/refresh`, {
        method: 'post',
        headers: { 
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ refreshToken: refreshtoken }) // <-- Aquí va el token
      });

      if (!refreshRes.ok) {
        return context.redirect('/login');
      }

      const refreshData = await refreshRes.json();

      if (!refreshData.accessToken) {
        return context.redirect('/login');
      }

      context.cookies.set('sb-access-token', refreshData.accessToken, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        maxAge: 5 * MIN   
      });
      // Continúa el flujo
      return next();
    }
  }

  return next();
});