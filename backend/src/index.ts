import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.post('/data', async (c) => {
  try {
    const data = await c.req.json();
    if (!data.temperature || !data.humidity) {
      return c.json({ error: 'Invalid data' }, 400);
    }
    return c.json({ received: data }, 200);
  } catch (error) {
    return c.json({ error: 'Invalid JSON' }, 400);
}});



export default app
