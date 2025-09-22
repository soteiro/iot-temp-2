import { Hono } from "hono";
import { Env } from "../types/types";
import { prisma } from "../lib/prisma";
import { Variables } from "../types/types";
const statsRoutes = new Hono<{ Bindings: Env, Variables: Variables }>();

statsRoutes.get('/stats', async (c) => {
  try {
    const stats = await prisma.sensorData.aggregate({
      _avg: {
        temperature: true,
        humidity: true
      },
      _min: {
        temperature: true,
        humidity: true
      },
      _max: {
        temperature: true,
        humidity: true
      },
      _count: true
    });

    return c.json({ stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});

export default statsRoutes;