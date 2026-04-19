import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { and, eq } from 'drizzle-orm';
import { withTenant, feeConfigs } from '@beefasso/db';
import { feeConfigCreateSchema, feeConfigUpdateSchema } from '@beefasso/shared';
import { requireTenantAuth } from '../lib/auth.ts';

export const feeConfigRoutes = new Hono();
feeConfigRoutes.use('*', requireTenantAuth);

feeConfigRoutes.get('/', async (c) => {
  const tenantId = c.get('tenantId' as never) as string;
  const rows = await withTenant(tenantId, (tx) => tx.select().from(feeConfigs));
  return c.json({ feeConfigs: rows });
});

feeConfigRoutes.post('/', zValidator('json', feeConfigCreateSchema), async (c) => {
  const tenantId = c.get('tenantId' as never) as string;
  const input = c.req.valid('json');

  const inserted = await withTenant(tenantId, async (tx) => {
    const [r] = await tx
      .insert(feeConfigs)
      .values({
        tenantId,
        code: input.code,
        name: input.name,
        amount: input.amount.toFixed(2),
        interval: input.interval ?? null,
        active: input.active ?? true,
      })
      .returning();
    return r;
  });
  return c.json({ feeConfig: inserted }, 201);
});

feeConfigRoutes.patch('/:id', zValidator('json', feeConfigUpdateSchema), async (c) => {
  const tenantId = c.get('tenantId' as never) as string;
  const id = c.req.param('id');
  const input = c.req.valid('json');

  const patch: Record<string, unknown> = {};
  if (input.code !== undefined) patch.code = input.code;
  if (input.name !== undefined) patch.name = input.name;
  if (input.amount !== undefined) patch.amount = input.amount.toFixed(2);
  if (input.interval !== undefined) patch.interval = input.interval;
  if (input.active !== undefined) patch.active = input.active;
  if (Object.keys(patch).length === 0) return c.json({ error: 'empty_patch' }, 400);

  const updated = await withTenant(tenantId, async (tx) => {
    const [r] = await tx.update(feeConfigs).set(patch).where(eq(feeConfigs.id, id)).returning();
    return r;
  });
  if (!updated) return c.json({ error: 'not_found' }, 404);
  return c.json({ feeConfig: updated });
});

feeConfigRoutes.delete('/:id', async (c) => {
  const tenantId = c.get('tenantId' as never) as string;
  const id = c.req.param('id');
  const deleted = await withTenant(tenantId, async (tx) => {
    const [r] = await tx.delete(feeConfigs).where(eq(feeConfigs.id, id)).returning({ id: feeConfigs.id });
    return r;
  });
  if (!deleted) return c.json({ error: 'not_found' }, 404);
  return c.json({ ok: true });
});
