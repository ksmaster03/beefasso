import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, and, desc, sql } from 'drizzle-orm';
import { db, tenants, users, tenantUsers, feeConfigs } from '@beefasso/db';
import { tenantSignupSchema } from '@beefasso/shared';
import { hashPassword } from '../lib/auth.ts';
import { requireSuperAdmin } from '../lib/auth.ts';

export const tenantRoutes = new Hono();

// Public: an association signs up to use the platform. Creates a pending tenant + owner user.
tenantRoutes.post('/signup', zValidator('json', tenantSignupSchema), async (c) => {
  const input = c.req.valid('json');

  // Uniqueness checks
  const slugHit = await db.select({ id: tenants.id }).from(tenants).where(eq(tenants.slug, input.slug));
  if (slugHit.length > 0) return c.json({ error: 'slug_taken' }, 409);
  const emailHit = await db.select({ id: users.id }).from(users).where(eq(users.email, input.contactEmail));
  if (emailHit.length > 0) return c.json({ error: 'email_taken' }, 409);

  const pwHash = await hashPassword(input.password);
  const createdAt = new Date();

  await db.transaction(async (tx) => {
    const [t] = await tx
      .insert(tenants)
      .values({
        slug: input.slug,
        nameTh: input.nameTh,
        nameEn: input.nameEn,
        orgType: input.orgType,
        status: 'pending',
      })
      .returning({ id: tenants.id });
    const [u] = await tx
      .insert(users)
      .values({
        email: input.contactEmail,
        passwordHash: pwHash,
        name: input.contactName,
        platformRole: 'user',
      })
      .returning({ id: users.id });
    await tx.insert(tenantUsers).values({ tenantId: t!.id, userId: u!.id, role: 'owner', active: true });

    // fee_configs has RLS policy keyed on app.tenant_id; scope this tx to the new tenant.
    await tx.execute(sql.raw(`SET LOCAL app.tenant_id = '${t!.id}'`));
    await tx.insert(feeConfigs).values([
      { tenantId: t!.id, code: 'annual', name: 'ค่าสมาชิกรายปี', amount: '500.00', interval: 'year' },
      { tenantId: t!.id, code: 'lifetime', name: 'ค่าสมาชิกตลอดชีพ', amount: '10000.00', interval: null },
      { tenantId: t!.id, code: 'cattle_reg', name: 'ค่าขึ้นทะเบียนโค/ตัว', amount: '200.00', interval: null },
    ]);
  });

  return c.json({ ok: true, status: 'pending', message: 'ส่งข้อมูลแล้ว รอการอนุมัติจากผู้ดูแลระบบ' });
});

// Super admin: list pending tenants
tenantRoutes.get('/pending', requireSuperAdmin, async (c) => {
  const rows = await db
    .select({
      id: tenants.id,
      slug: tenants.slug,
      nameTh: tenants.nameTh,
      nameEn: tenants.nameEn,
      orgType: tenants.orgType,
      createdAt: tenants.createdAt,
    })
    .from(tenants)
    .where(eq(tenants.status, 'pending'))
    .orderBy(desc(tenants.createdAt));
  return c.json({ tenants: rows });
});

// Super admin: approve a tenant
tenantRoutes.post('/:id/approve', requireSuperAdmin, async (c) => {
  const id = c.req.param('id');
  const [t] = await db
    .update(tenants)
    .set({ status: 'active', approvedAt: new Date() })
    .where(and(eq(tenants.id, id), eq(tenants.status, 'pending')))
    .returning({ id: tenants.id, slug: tenants.slug });
  if (!t) return c.json({ error: 'not_found_or_not_pending' }, 404);
  return c.json({ ok: true, tenant: t });
});

// Public: resolve tenant by slug (for /t/:slug landing)
tenantRoutes.get('/by-slug/:slug', async (c) => {
  const slug = c.req.param('slug');
  const [t] = await db
    .select({ id: tenants.id, slug: tenants.slug, nameTh: tenants.nameTh, nameEn: tenants.nameEn, orgType: tenants.orgType, status: tenants.status })
    .from(tenants)
    .where(eq(tenants.slug, slug));
  if (!t) return c.json({ error: 'not_found' }, 404);
  return c.json({ tenant: t });
});
