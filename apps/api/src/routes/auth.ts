import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { db, users, tenantUsers, tenants } from '@beefasso/db';
import { loginSchema, type SessionUser } from '@beefasso/shared';
import {
  verifyPassword,
  signSession,
  setSessionCookie,
  clearSessionCookie,
  getSession,
} from '../lib/auth.ts';

export const authRoutes = new Hono();

authRoutes.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');
  const rows = await db.select().from(users).where(eq(users.email, email));
  const u = rows[0];
  if (!u || !(await verifyPassword(password, u.passwordHash))) {
    return c.json({ error: 'invalid_credentials' }, 401);
  }

  // If not platform admin, find the (first) active tenant membership
  let tenantId: string | undefined;
  let tenantRole: SessionUser['tenantRole'];
  if (u.platformRole !== 'super_admin') {
    const [link] = await db
      .select({ tenantId: tenantUsers.tenantId, role: tenantUsers.role, active: tenantUsers.active, status: tenants.status })
      .from(tenantUsers)
      .innerJoin(tenants, eq(tenantUsers.tenantId, tenants.id))
      .where(eq(tenantUsers.userId, u.id));
    if (link?.active && link.status === 'active') {
      tenantId = link.tenantId;
      tenantRole = link.role;
    }
  }

  const sess: SessionUser = {
    userId: u.id,
    email: u.email,
    name: u.name,
    platformRole: u.platformRole,
    tenantId,
    tenantRole,
  };
  const token = await signSession(sess);
  setSessionCookie(c, token);
  return c.json({ ok: true, user: sess });
});

authRoutes.post('/logout', async (c) => {
  clearSessionCookie(c);
  return c.json({ ok: true });
});

authRoutes.get('/me', async (c) => {
  const user = await getSession(c);
  if (!user) return c.json({ error: 'unauthorized' }, 401);
  return c.json({ user });
});
