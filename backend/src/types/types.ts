
export interface Env {
  DATABASE_URL: string;
  JWT_SECRET: string;
}

// Definimos los tipos manualmente basándose en el schema de Prisma
export interface User {
  user_id: string;
  email: string;
  password: string;
  name: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Device {
  device_id: string;
  name: string;
  user_id: string;
  api_key: string;
  api_secret: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  last_seen: Date | null;
}

export type Variables = {
  user: User;
  device: Device;
}
 