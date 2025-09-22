
import { User, Device } from "@prisma/client/edge";
export interface Env {
  DATABASE_URL: string;
  JWT_SECRET: string;
}

export type Variables = {
  user: User;
  device: Device;
}
 