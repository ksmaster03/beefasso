import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';
import { db, users, tenantUsers, tenants, farmUsers, farms, passwordResetTokens, loginLogs } from '@beefasso/db';
import { requireSuperAdmin, hashToken } from '../lib/auth.ts';
import { sendMail } from '../lib/mail.ts';
import { getSession } from '../lib/auth.ts';

export const adminUsersRoutes = new Hono();

adminUsersRoutes.get('/', requireSuperAdmin, async (c) => {
  const allUsers = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      platformRole: users.platformRole,
      googleId: users.googleId,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  const tenantLinks = await db
    .select({
      userId: tenantUsers.userId,
      role: tenantUsers.role,
      slug: tenants.slug,
      nameTh: tenants.nameTh,
    })
    .from(tenantUsers)
    .innerJoin(tenants, eq(tenantUsers.tenantId, tenants.id));

  const farmLinks = await db
    .select({
      userId: farmUsers.userId,
      role: farmUsers.role,
      slug: farms.slug,
      nameTh: farms.nameTh,
    })
    .from(farmUsers)
    .innerJoin(farms, eq(farmUsers.farmId, farms.id));

  const tenantByUser = new Map(tenantLinks.map((l) => [l.userId, l]));
  const farmByUser = new Map(farmLinks.map((l) => [l.userId, l]));

  const data = allUsers.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
    tenant: tenantByUser.get(u.id) ?? null,
    farm: farmByUser.get(u.id) ?? null,
  }));

  return c.json({ users: data });
});

adminUsersRoutes.patch(
  '/:id/role',
  requireSuperAdmin,
  zValidator('json', z.object({ role: z.enum(['super_admin', 'user']) })),
  async (c) => {
    const id = c.req.param('id');
    const { role } = c.req.valid('json');
    const [updated] = await db
      .update(users)
      .set({ platformRole: role })
      .where(eq(users.id, id))
      .returning({ id: users.id });
    if (!updated) return c.json({ error: 'not_found' }, 404);
    return c.json({ ok: true });
  },
);

adminUsersRoutes.post('/:id/reset', requireSuperAdmin, async (c) => {
  const id = c.req.param('id');
  const [u] = await db
    .select({ id: users.id, email: users.email, name: users.name })
    .from(users)
    .where(eq(users.id, id));
  if (!u) return c.json({ error: 'not_found' }, 404);

  const rawToken = randomBytes(32).toString('base64url');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await db.insert(passwordResetTokens).values({ userId: u.id, tokenHash, expiresAt });

  const host = c.req.header('host') ?? 'jungdee.growgenius.co.th';
  const origin = process.env.NODE_ENV === 'production' ? `https://${host}` : `http://${host}`;
  const link = `${origin}/reset-password?token=${rawToken}`;
  await sendMail({
    to: u.email,
    subject: 'ตั้งรหัสผ่านใหม่ — Jungdee / Cattle Pro',
    html: `<p>สวัสดีคุณ ${u.name},</p><p>ผู้ดูแลระบบขอให้คุณตั้งรหัสผ่านใหม่ กดลิงก์นี้เพื่อดำเนินการ (หมดอายุใน 24 ชั่วโมง):</p><p><a href="${link}">${link}</a></p><p>ถ้าไม่ได้ร้องขอ กรุณาติดต่อผู้ดูแลระบบทันที</p>`,
    text: `ตั้งรหัสผ่านใหม่: ${link} (หมดอายุใน 24 ชั่วโมง)`,
  });
  return c.json({ ok: true });
});

adminUsersRoutes.get('/:id/logs', requireSuperAdmin, async (c) => {
  const id = c.req.param('id');
  const rows = await db
    .select()
    .from(loginLogs)
    .where(eq(loginLogs.userId, id))
    .orderBy(desc(loginLogs.createdAt))
    .limit(50);
  return c.json({ logs: rows });
});

adminUsersRoutes.delete('/:id', requireSuperAdmin, async (c) => {
  const id = c.req.param('id');
  const me = await getSession(c);
  if (me?.userId === id) return c.json({ error: 'cannot_delete_self' }, 400);
  const [deleted] = await db.delete(users).where(eq(users.id, id)).returning({ id: users.id });
  if (!deleted) return c.json({ error: 'not_found' }, 404);
  return c.json({ ok: true });
});
