import { Hono } from "hono";
import { Env } from "../types/types";
import { prisma } from "../lib/prisma";
import { authenticateDevice } from "../lib/auth";
import { Variables } from "../types/types";


const dataRoutes = new Hono<{ Bindings: Env, Variables: Variables }>();
dataRoutes.post('/data', authenticateDevice, async (c) => {
  try {
    const data = await c.req.json();
    const device = c.get('device');
    if (!data.temperature || !data.humidity) {
      return c.json({ error: 'Invalid data: temperature and humidity are required' }, 400);
    }

    // Guardar en la base de datos
    const sensorData = await prisma.sensorData.create({
      data: {
        temperature: parseFloat(data.temperature),
        humidity: parseFloat(data.humidity),
        device_id: device.device_id
        // timestamp se genera automáticamente
      }
    });

    return c.json({ 
      success: true, 
      data: sensorData 
    }, 201);
    
  } catch (error: any) {
    console.error('Error saving sensor data:', error);
    return c.json({ error: 'Failed to save data: ' + error.message }, 500);
  }
});


// Endpoint para obtener los datos más recientes
dataRoutes.get('/data', async (c) => {
  try {
    const recentData = await prisma.sensorData.findMany({
      orderBy: { timestamp: 'desc' },
      take: 10
    });

    return c.json({ data: recentData });
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    return c.json({ error: 'Failed to fetch data' }, 500);
  }
});

export default dataRoutes;