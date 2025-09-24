import { z } from '@hono/zod-openapi'

// Schema for the user object in responses (without password)
export const UserSchema = z.object({
  user_id: z.string().uuid().openapi({ example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' }),
  name: z.string().min(2).max(100).openapi({ example: 'Jane Doe' }),
  email: z.string().email().openapi({ example: 'jane.doe@example.com' }),
}).openapi('User');

// Schema for the registration request body
export const RegisterSchema = z.object({
  name: z
  .string()
  .min(2, { message: "Name must be at least 2 characters long" })
  .max(100, { message: "Name must be at most 100 characters long" }),
  email: z.string().email(),
  password: z.string().min(8, { message: "Password must be at least 8 characters long" }),
});

// Schema for the login request body
export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Schema for the successful login response
export const LoginResponseSchema = z.object({
  token: z.string().openapi({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }),
  refreshToken: z.string().openapi({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }),
  user: UserSchema,
}).openapi('LoginResponse');

// Schema for the refresh token request body
export const RefreshTokenSchema = z.object({
  refreshToken: z.string(),
});

// Schema for the new token response
export const TokenResponseSchema = z.object({
  token: z.string().openapi({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }),
}).openapi('TokenResponse');

// Generic error schema for documentation
export const ErrorSchema = z.object({
  error: z.string().openapi({ example: 'Error message content' }),
}).openapi('Error');
