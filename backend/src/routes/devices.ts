import { Hono } from "hono";
import { authenticateUser } from "../lib/auth";
import { Env } from "../types/types";
import { User, Device } from "@prisma/client/edge";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

export interface Variables {
  user: User;
  device: Device;
}

const deviceRoutes = new Hono<{ Bindings: Env, Variables: Variables }>()
deviceRoutes.post('/', authenticateUser, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { name } = body;

    if (!name) {
      return c.json({ error: 'Name is required' }, 400);
    }
    
    // Generate API key and secret using Web Crypto API
    const apiKeyBytes = new Uint8Array(16);
    const apiSecretBytes = new Uint8Array(32);
    crypto.getRandomValues(apiKeyBytes);
    crypto.getRandomValues(apiSecretBytes);
    
    const apiKey = Array.from(apiKeyBytes, byte => byte.toString(16).padStart(2, '0')).join('');
    const apiSecret = Array.from(apiSecretBytes, byte => byte.toString(16).padStart(2, '0')).join('');
    const hashedApiSecret = await bcrypt.hash(apiSecret, 10);
    //create new device
    const device = await prisma.device.create({
      data:{
        name,
        user_id: user.user_id,
        api_key: apiKey,
        api_secret: hashedApiSecret,
        is_active: true,
      }
    });

    return c.json({
      device: {
        ...device,
        api_secret: apiSecret // return plain secret only on creation
      }
    }, 201)

  } catch (error: any) {
    console.error('Error creating device:', error);
    return c.json({ error: 'Failed to create device: ' + error.message }, 500);
  }
})

export default deviceRoutes;
