import { Context, Next } from 'hono'
import { verifyToken, JWTPayload } from './auth'

export const authMiddleware = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Token de autorización requerido' }, 401)
    }

    const token = authHeader.substring(7) // Remover "Bearer "
    
    // Verificar el token
    const decoded = verifyToken(token, c.env.JWT_SECRET)
    
    // Agregar información del usuario al contexto
    c.set('user', decoded)
    
    await next()
  } catch (error) {
    return c.json({ error: 'Token inválido' }, 401)
  }
}

// Middleware opcional - permite requests con y sin autenticación
export const optionalAuthMiddleware = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header('Authorization')
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const decoded = verifyToken(token, c.env.JWT_SECRET)
      c.set('user', decoded)
    }
    
    await next()
  } catch (error) {
    // Si el token es inválido, continúa sin usuario
    await next()
  }
}