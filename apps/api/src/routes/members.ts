import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { and, desc, eq, ilike, or, sql, count } from 'drizzle-orm';
import { withTenant, members } from '@beefasso/db';
import { memberCreateSchema, memberUpdateSchema } from '@beefasso/shared';
import { requireTenantAuth } from '../lib/auth.ts';

export const memberRoutes = new Hono();

memberRoutes.use('*', requireTenantAuth);

// List with optional search on memberNo / fullName / email / phone.
memberRoutes.get('/', async (c) => {
  const tenantId = c.get('tenantId' as never) as string;
  const q = c.req.query('q')?.trim();
  const status = c.req.query('status');
  const limit = Math.min(Number(c.req.query('limit') ?? 50), 200);

  const rows = await withTenant(tenantId, async (tx) => {
    const conds = [] as any[];
    if (q) {
      const like = `%${q}%`;
      conds.push(or(ilike(members.memberNo, like), ilike(members.fullName, like), ilike(members.email, like), ilike(members.phone, like)));
    }
    if (status && ['active', 'expired', 'suspended'].includes(status)) {
      conds.push(eq(members.status, status as any));
    }
    return tx
      .select()
      .from(members)
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(members.createdAt))
      .limit(limit);
  });

  return c.json({ members: rows });
});

// Single member.
memberRoutes.get('/:id', async (c) => {
  const tenantId = c.get('tenantId' as never) as string;
  const id = c.req.param('id');
  const rows = await withTenant(tenantId, (tx) => tx.select().from(members).where(eq(members.id, id)));
  if (rows.length === 0) return c.json({ error: 'not_found' }, 404);
  return c.json({ member: rows[0] });
});

// Create — auto-gen memberNo if omitted (M + 5-digit zero-padded sequence within tenant).
memberRoutes.post('/', zValidator('json', memberCreateSchema), async (c) => {
  const tenantId = c.get('tenantId' as never) as string;
  const input = c.req.valid('json');

  const inserted = await withTenant(tenantId, async (tx) => {
    let memberNo = input.memberNo;
    if (!memberNo) {
      const [row] = await tx.select({ n: count() }).from(members);
      memberNo = `M${String(Number(row?.n ?? 0) + 1).padStart(5, '0')}`;
    }
    const [row] = await tx
      .insert(members)
      .values({
        tenantId,
        memberNo,
        fullName: input.fullName,
        phone: input.phone ?? null,
        email: input.email ?? null,
        address: input.address ?? null,
        type: input.type,
        expiredAt: input.expiredAt ? new Date(input.expiredAt) : null,
      })
      .returning();
    return row;
  });

  return c.json({ member: inserted }, 201);
});

memberRoutes.patch('/:id', zValidator('json', memberUpdateSchema), async (c) => {
  const tenantId = c.get('tenantId' as never) as string;
  const id = c.req.param('id');
  const input = c.req.valid('json');

  const patch: Record<string, unknown> = {};
  if (input.memberNo !== undefined) patch.memberNo = input.memberNo;
  if (input.fullName !== undefined) patch.fullName = input.fullName;
  if (input.phone !== undefined) patch.phone = input.phone;
  if (input.email !== undefined) patch.email = input.email;
  if (input.address !== undefined) patch.address = input.address;
  if (input.type !== undefined) patch.type = input.type;
  if (input.status !== undefined) patch.status = input.status;
  if (input.expiredAt !== undefined) patch.expiredAt = input.expiredAt ? new Date(input.expiredAt) : null;

  if (Object.keys(patch).length === 0) return c.json({ error: 'empty_patch' }, 400);

  const updated = await withTenant(tenantId, async (tx) => {
    const [row] = await tx.update(members).set(patch).where(eq(members.id, id)).returning();
    return row;
  });

  if (!updated) return c.json({ error: 'not_found' }, 404);
  return c.json({ member: updated });
});

// Soft-delete → mark suspended.
memberRoutes.delete('/:id', async (c) => {
  const tenantId = c.get('tenantId' as never) as string;
  const id = c.req.param('id');
  const row = await withTenant(tenantId, async (tx) => {
    const [r] = await tx
      .update(members)
      .set({ status: 'suspended' })
      .where(eq(members.id, id))
      .returning({ id: members.id });
    return r;
  });
  if (!row) return c.json({ error: 'not_found' }, 404);
  return c.json({ ok: true });
});

// Summary counts for dashboard.
memberRoutes.get('/_stats/summary', async (c) => {
  const tenantId = c.get('tenantId' as never) as string;
  const rows = await withTenant(tenantId, async (tx) =>
    tx
      .select({ status: members.status, n: count() })
      .from(members)
      .groupBy(members.status),
  );
  const summary = { active: 0, expired: 0, suspended: 0, total: 0 };
  for (const r of rows) {
    summary[r.status] = Number(r.n);
    summary.total += Number(r.n);
  }
  return c.json(summary);
});
