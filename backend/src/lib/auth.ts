import * as bcrypt from 'bcryptjs'
import * as jwt from 'jsonwebtoken'

export interface JWTPayload {
  userId: string
  email: string
  iat?: number
  exp?: number
}

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash)
}

export const generateToken = (payload: { userId: string; email: string }, secret: string): string => {
  return jwt.sign(payload, secret, { expiresIn: '7d' })
}

export const verifyToken = (token: string, secret: string): JWTPayload => {
  return jwt.verify(token, secret) as JWTPayload
}