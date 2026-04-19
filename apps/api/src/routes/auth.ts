import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { loginSchema } from '@beefasso/shared';

export const authRoutes = new Hono();

authRoutes.post('/login', zValidator('json', loginSchema), async (c) => {
  // TODO: implement: find user, verify bcrypt, issue JWT
  return c.json({ error: 'not_implemented' }, 501);
});

authRoutes.post('/logout', async (c) => {
  // TODO: clear cookie / revoke session
  return c.json({ ok: true });
});

authRoutes.get('/me', async (c) => {
  // TODO: read JWT from cookie, return SessionUser
  return c.json({ error: 'not_implemented' }, 501);
});
