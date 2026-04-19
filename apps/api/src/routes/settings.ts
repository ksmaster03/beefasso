import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { db, tenants } from '@beefasso/db';
import { tenantSettingsSchema } from '@beefasso/shared';
import { requireTenantAuth } from '../lib/auth.ts';

export const settingsRoutes = new Hono();
settingsRoutes.use('*', requireTenantAuth);

settingsRoutes.get('/', async (c) => {
  const tenantId = c.get('tenantId' as never) as string;
  const [t] = await db
    .select({ id: tenants.id, slug: tenants.slug, nameTh: tenants.nameTh, nameEn: tenants.nameEn, settings: tenants.settings })
    .from(tenants)
    .where(eq(tenants.id, tenantId));
  if (!t) return c.json({ error: 'not_found' }, 404);
  const parsed = tenantSettingsSchema.safeParse(t.settings ?? {});
  return c.json({
    tenant: { id: t.id, slug: t.slug, nameTh: t.nameTh, nameEn: t.nameEn },
    settings: parsed.success ? parsed.data : {},
  });
});

settingsRoutes.patch('/', zValidator('json', tenantSettingsSchema), async (c) => {
  const tenantId = c.get('tenantId' as never) as string;
  const user = c.get('user' as never) as { tenantRole?: string };
  if (!user.tenantRole || !['owner', 'admin'].includes(user.tenantRole)) {
    return c.json({ error: 'forbidden' }, 403);
  }
  const input = c.req.valid('json');

  const [t] = await db
    .update(tenants)
    .set({ settings: input })
    .where(eq(tenants.id, tenantId))
    .returning({ settings: tenants.settings });
  return c.json({ settings: t?.settings ?? {} });
});
