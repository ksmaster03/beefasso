/**
 * Cattle Pro — farm management SaaS.
 * Exposes /api/farm/* for all 8 modules. All routes (except signup) require
 * an active farm membership; queries run inside withFarm(...) so RLS scopes
 * every row to the caller's farm.
 */
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { and, asc, desc, eq, sql, sum, count, gte, lte, ilike, or } from 'drizzle-orm';
import {
  db, withFarm,
  farms, farmUsers,
  farmPens, farmCattle, healthRecords, feedItems, feedRecipes,
  milkRecords, breedingRecords, financeEntries,
} from '@beefasso/db';
import {
  farmSignupSchema,
  farmCattleCreateSchema, farmCattleUpdateSchema,
  penCreateSchema, penUpdateSchema,
  healthCreateSchema, feedItemCreateSchema, feedItemUpdateSchema,
  milkCreateSchema, breedingCreateSchema, breedingUpdateSchema,
  financeCreateSchema, financeUpdateSchema,
} from '@beefasso/shared';
import { requireFarmAuth, hashPassword } from '../lib/auth.ts';
import { users } from '@beefasso/db';

export const farmRoutes = new Hono();

// ---------- Public: signup ----------
farmRoutes.post('/signup', zValidator('json', farmSignupSchema), async (c) => {
  const input = c.req.valid('json');
  const slugHit = await db.select({ id: farms.id }).from(farms).where(eq(farms.slug, input.slug));
  if (slugHit.length > 0) return c.json({ error: 'slug_taken' }, 409);
  const emailHit = await db.select({ id: users.id }).from(users).where(eq(users.email, input.contactEmail));
  if (emailHit.length > 0) return c.json({ error: 'email_taken' }, 409);

  const pwHash = await hashPassword(input.password);
  const res = await db.transaction(async (tx) => {
    const [u] = await tx.insert(users).values({
      email: input.contactEmail, passwordHash: pwHash, name: input.contactName, platformRole: 'user',
    }).returning({ id: users.id });
    const [f] = await tx.insert(farms).values({
      slug: input.slug, nameTh: input.nameTh, nameEn: input.nameEn, ownerUserId: u!.id, status: 'active',
    }).returning({ id: farms.id, slug: farms.slug });
    await tx.insert(farmUsers).values({ farmId: f!.id, userId: u!.id, role: 'owner', active: true });
    return { userId: u!.id, farmId: f!.id, slug: f!.slug };
  });
  return c.json({ ok: true, ...res });
});

// All remaining routes require farm auth.
farmRoutes.use('*', requireFarmAuth);

// ---------- Dashboard summary (Module 1: ภาพรวม) ----------
farmRoutes.get('/dashboard', async (c) => {
  const farmId = c.get('farmId' as never) as string;
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 7) + '-01';

  const data = await withFarm(farmId, async (tx) => {
    // Counts
    const [herdActive] = await tx.select({ n: count() }).from(farmCattle).where(eq(farmCattle.status, 'active'));
    const [penCount] = await tx.select({ n: count() }).from(farmPens);

    // Health due today or overdue
    const dueHealth = await tx
      .select({ n: count() })
      .from(healthRecords)
      .where(and(sql`${healthRecords.nextDueAt} IS NOT NULL`, lte(healthRecords.nextDueAt, today)));

    // Milk this month total
    const milkMonth = await tx.execute(sql`
      SELECT COALESCE(SUM(kg::numeric),0)::text AS total
      FROM milk_records
      WHERE recorded_at >= ${monthStart}
    `);

    // Finance this month
    const finMonth = await tx.execute(sql`
      SELECT type, COALESCE(SUM(amount),0)::text AS total
      FROM finance_entries
      WHERE occurred_at >= ${monthStart}
      GROUP BY type
    `);

    // Low feed stock
    const lowFeed = await tx
      .select({ n: count() })
      .from(feedItems)
      .where(sql`${feedItems.stockQty} <= ${feedItems.reorderLevel}`);

    // Upcoming calvings
    const upcomingCalvings = await tx
      .select({ n: count() })
      .from(breedingRecords)
      .where(and(
        eq(breedingRecords.result, 'confirmed'),
        sql`${breedingRecords.dueAt} IS NOT NULL`,
        gte(breedingRecords.dueAt, today),
      ));

    return {
      herdActive: Number(herdActive?.n ?? 0),
      penCount: Number(penCount?.n ?? 0),
      healthDue: Number(dueHealth[0]?.n ?? 0),
      milkMonthKg: Number(((milkMonth as any)[0]?.total) ?? 0),
      lowFeedCount: Number(lowFeed[0]?.n ?? 0),
      upcomingCalvings: Number(upcomingCalvings[0]?.n ?? 0),
      finance: {
        income: Number(((finMonth as any).find?.((r: any) => r.type === 'income'))?.total ?? 0),
        expense: Number(((finMonth as any).find?.((r: any) => r.type === 'expense'))?.total ?? 0),
      },
    };
  });
  return c.json(data);
});

// Alerts (health due, low feed, calvings within 14 days)
farmRoutes.get('/alerts', async (c) => {
  const farmId = c.get('farmId' as never) as string;
  const today = new Date().toISOString().slice(0, 10);
  const in14 = new Date(Date.now() + 14 * 86400_000).toISOString().slice(0, 10);

  const data = await withFarm(farmId, async (tx) => {
    const dueHealth = await tx
      .select({
        id: healthRecords.id, cattleId: healthRecords.cattleId, title: healthRecords.title,
        type: healthRecords.type, nextDueAt: healthRecords.nextDueAt,
      })
      .from(healthRecords)
      .where(and(sql`${healthRecords.nextDueAt} IS NOT NULL`, lte(healthRecords.nextDueAt, today)))
      .orderBy(asc(healthRecords.nextDueAt))
      .limit(10);
    const lowFeed = await tx
      .select({ id: feedItems.id, name: feedItems.name, stockQty: feedItems.stockQty, unit: feedItems.unit, reorderLevel: feedItems.reorderLevel })
      .from(feedItems)
      .where(sql`${feedItems.stockQty} <= ${feedItems.reorderLevel}`)
      .limit(10);
    const calvings = await tx
      .select({ id: breedingRecords.id, damId: breedingRecords.damId, dueAt: breedingRecords.dueAt })
      .from(breedingRecords)
      .where(and(
        eq(breedingRecords.result, 'confirmed'),
        sql`${breedingRecords.dueAt} IS NOT NULL`,
        gte(breedingRecords.dueAt, today),
        lte(breedingRecords.dueAt, in14),
      ))
      .orderBy(asc(breedingRecords.dueAt));
    return { dueHealth, lowFeed, calvings };
  });
  return c.json(data);
});

// ---------- Module 2: จัดการฝูงวัว (pens + cattle) ----------
farmRoutes.get('/pens', async (c) => {
  const farmId = c.get('farmId' as never) as string;
  const rows = await withFarm(farmId, (tx) => tx.select().from(farmPens).orderBy(asc(farmPens.name)));
  return c.json({ pens: rows });
});
farmRoutes.post('/pens', zValidator('json', penCreateSchema), async (c) => {
  const farmId = c.get('farmId' as never) as string;
  const input = c.req.valid('json');
  const [row] = await withFarm(farmId, (tx) =>
    tx.insert(farmPens).values({ farmId, name: input.name, capacity: input.capacity, notes: input.notes ?? null }).returning(),
  );
  return c.json({ pen: row }, 201);
});
farmRoutes.patch('/pens/:id', zValidator('json', penUpdateSchema), async (c) => {
  const farmId = c.get('farmId' as never) as string;
  const id = c.req.param('id');
  const input = c.req.valid('json');
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.capacity !== undefined) patch.capacity = input.capacity;
  if (input.notes !== undefined) patch.notes = input.notes;
  const [row] = await withFarm(farmId, (tx) => tx.update(farmPens).set(patch).where(eq(farmPens.id, id)).returning());
  if (!row) return c.json({ error: 'not_found' }, 404);
  return c.json({ pen: row });
});
farmRoutes.delete('/pens/:id', async (c) => {
  const farmId = c.get('farmId' as never) as string;
  const id = c.req.param('id');
  const [row] = await withFarm(farmId, (tx) => tx.delete(farmPens).where(eq(farmPens.id, id)).returning({ id: farmPens.id }));
  if (!row) return c.json({ error: 'not_found' }, 404);
  return c.json({ ok: true });
});

farmRoutes.get('/cattle', async (c) => {
  const farmId = c.get('farmId' as never) as string;
  const q = c.req.query('q')?.trim();
  const penId = c.req.query('penId');
  const status = c.req.query('status');
  const rows = await withFarm(farmId, (tx) => {
    const conds: any[] = [];
    if (q) {
      const like = `%${q}%`;
      conds.push(or(ilike(farmCattle.earTag, like), ilike(farmCattle.name, like), ilike(farmCattle.breed, like)));
    }
    if (penId) conds.push(eq(farmCattle.penId, penId));
    if (status && ['active', 'sold', 'deceased'].includes(status)) conds.push(eq(farmCattle.status, status as any));
    return tx.select().from(farmCattle).where(conds.length ? and(...conds) : undefined).orderBy(desc(farmCattle.createdAt)).limit(200);
  });
  return c.json({ cattle: rows });
});
farmRoutes.post('/cattle', zValidator('json', farmCattleCreateSchema), async (c) => {
  const farmId = c.get('farmId' as never) as string;
  const input = c.req.valid('json');
  const [row] = await withFarm(farmId, (tx) =>
    tx.insert(farmCattle).values({
      farmId,
      earTag: input.earTag,
      regNo: input.regNo ?? null,
      name: input.name ?? null,
      breed: input.breed ?? null,
      sex: input.sex,
      dob: input.dob ?? null,
      color: input.color ?? null,
      penId: input.penId ?? null,
      status: input.status ?? 'active',
    }).returning(),
  );
  return c.json({ cattle: row }, 201);
});
farmRoutes.patch('/cattle/:id', zValidator('json', farmCattleUpdateSchema), async (c) => {
  const farmId = c.get('farmId' as never) as string;
  const id = c.req.param('id');
  const input = c.req.valid('json');
  const patch: Record<string, unknown> = {};
  for (const k of ['earTag', 'regNo', 'name', 'breed', 'sex', 'dob', 'color', 'penId', 'status'] as const) {
    if (input[k] !== undefined) patch[k] = input[k] ?? null;
  }
  const [row] = await withFarm(farmId, (tx) => tx.update(farmCattle).set(patch).where(eq(farmCattle.id, id)).returning());
  if (!row) return c.json({ error: 'not_found' }, 404);
  return c.json({ cattle: row });
});
farmRoutes.delete('/cattle/:id', async (c) => {
  const farmId = c.get('farmId' as never) as string;
  const id = c.req.param('id');
  const [row] = await withFarm(farmId, (tx) => tx.delete(farmCattle).where(eq(farmCattle.id, id)).returning({ id: farmCattle.id }));
  if (!row) return c.json({ error: 'not_found' }, 404);
  return c.json({ ok: true });
});

// ---------- Module 3: สุขภาพ & วัคซีน ----------
farmRoutes.get('/health', async (c) => {
  const farmId = c.get('farmId' as never) as string;
  const cattleId = c.req.query('cattleId');
  const rows = await withFarm(farmId, (tx) => {
    const conds: any[] = [];
    if (cattleId) conds.push(eq(healthRecords.cattleId, cattleId));
    return tx.select().from(healthRecords).where(conds.length ? and(...conds) : undefined).orderBy(desc(healthRecords.occurredAt)).limit(500);
  });
  return c.json({ records: rows });
});
farmRoutes.post('/health', zValidator('json', healthCreateSchema), async (c) => {
  const farmId = c.get('farmId' as never) as string;
  const i = c.req.valid('json');
  const [row] = await withFarm(farmId, (tx) =>
    tx.insert(healthRecords).values({
      farmId, cattleId: i.cattleId, type: i.type, title: i.title,
      notes: i.notes ?? null, occurredAt: i.occurredAt, nextDueAt: i.nextDueAt ?? null,
      vetName: i.vetName ?? null, cost: i.cost != null ? String(i.cost) : null,
    }).returning(),
  );
  return c.json({ record: row }, 201);
});
farmRoutes.delete('/health/:id', async (c) => {
  const farmId = c.get('farmId' as never) as string;
  const id = c.req.param('id');
  const [row] = await withFarm(farmId, (tx) => tx.delete(healthRecords).where(eq(healthRecords.id, id)).returning({ id: healthRecords.id }));
  if (!row) return c.json({ error: 'not_found' }, 404);
  return c.json({ ok: true });
});

// ---------- Module 4: อาหาร & โภชนาการ ----------
farmRoutes.get('/feed', async (c) => {
  const farmId = c.get('farmId' as never) as string;
  const rows = await withFarm(farmId, (tx) => tx.select().from(feedItems).orderBy(asc(feedItems.name)));
  return c.json({ items: rows });
});
farmRoutes.post('/feed', zValidator('json', feedItemCreateSchema), async (c) => {
  const farmId = c.get('farmId' as never) as string;
  const i = c.req.valid('json');
  const [row] = await withFarm(farmId, (tx) =>
    tx.insert(feedItems).values({
      farmId, name: i.name, unit: i.unit,
      stockQty: String(i.stockQty), costPerUnit: String(i.costPerUnit), reorderLevel: String(i.reorderLevel),
    }).returning(),
  );
  return c.json({ item: row }, 201);
});
farmRoutes.patch('/feed/:id', zValidator('json', feedItemUpdateSchema), async (c) => {
  const farmId = c.get('farmId' as never) as string;
  const id = c.req.param('id');
  const i = c.req.valid('json');
  const patch: Record<string, unknown> = {};
  if (i.name !== undefined) patch.name = i.name;
  if (i.unit !== undefined) patch.unit = i.unit;
  if (i.stockQty !== undefined) patch.stockQty = String(i.stockQty);
  if (i.costPerUnit !== undefined) patch.costPerUnit = String(i.costPerUnit);
  if (i.reorderLevel !== undefined) patch.reorderLevel = String(i.reorderLevel);
  const [row] = await withFarm(farmId, (tx) => tx.update(feedItems).set(patch).where(eq(feedItems.id, id)).returning());
  if (!row) return c.json({ error: 'not_found' }, 404);
  return c.json({ item: row });
});
farmRoutes.delete('/feed/:id', async (c) => {
  const farmId = c.get('farmId' as never) as string;
  const id = c.req.param('id');
  const [row] = await withFarm(farmId, (tx) => tx.delete(feedItems).where(eq(feedItems.id, id)).returning({ id: feedItems.id }));
  if (!row) return c.json({ error: 'not_found' }, 404);
  return c.json({ ok: true });
});

// ---------- Module 5: ผลผลิตนม ----------
farmRoutes.get('/milk', async (c) => {
  const farmId = c.get('farmId' as never) as string;
  const cattleId = c.req.query('cattleId');
  const rows = await withFarm(farmId, (tx) => {
    const conds: any[] = [];
    if (cattleId) conds.push(eq(milkRecords.cattleId, cattleId));
    return tx.select().from(milkRecords).where(conds.length ? and(...conds) : undefined).orderBy(desc(milkRecords.recordedAt)).limit(500);
  });
  return c.json({ records: rows });
});
farmRoutes.post('/milk', zValidator('json', milkCreateSchema), async (c) => {
  const farmId = c.get('farmId' as never) as string;
  const i = c.req.valid('json');
  const [row] = await withFarm(farmId, (tx) =>
    tx.insert(milkRecords).values({
      farmId, cattleId: i.cattleId, recordedAt: i.recordedAt, session: i.session,
      kg: String(i.kg), fatPct: i.fatPct != null ? String(i.fatPct) : null, notes: i.notes ?? null,
    }).returning(),
  );
  return c.json({ record: row }, 201);
});
farmRoutes.get('/milk/top', async (c) => {
  const farmId = c.get('farmId' as never) as string;
  const days = Math.min(Number(c.req.query('days') ?? 30), 365);
  const since = new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10);
  const rows = await withFarm(farmId, async (tx) => {
    const r: any = await tx.execute(sql`
      SELECT m.cattle_id::text, c.ear_tag, c.name,
             COALESCE(SUM(m.kg::numeric),0)::text AS total_kg,
             COALESCE(AVG(m.kg::numeric),0)::text AS avg_kg,
             COUNT(*)::int AS sessions
      FROM milk_records m
      LEFT JOIN farm_cattle c ON c.id = m.cattle_id
      WHERE m.recorded_at >= ${since}
      GROUP BY m.cattle_id, c.ear_tag, c.name
      ORDER BY total_kg DESC
      LIMIT 20
    `);
    return r;
  });
  return c.json({ top: rows, days });
});
farmRoutes.delete('/milk/:id', async (c) => {
  const farmId = c.get('farmId' as never) as string;
  const id = c.req.param('id');
  const [row] = await withFarm(farmId, (tx) => tx.delete(milkRecords).where(eq(milkRecords.id, id)).returning({ id: milkRecords.id }));
  if (!row) return c.json({ error: 'not_found' }, 404);
  return c.json({ ok: true });
});

// ---------- Module 6: การผสมพันธุ์ ----------
farmRoutes.get('/breeding', async (c) => {
  const farmId = c.get('farmId' as never) as string;
  const result = c.req.query('result');
  const rows = await withFarm(farmId, (tx) => {
    const conds: any[] = [];
    if (result && ['pending', 'confirmed', 'failed', 'calved'].includes(result)) conds.push(eq(breedingRecords.result, result as any));
    return tx.select().from(breedingRecords).where(conds.length ? and(...conds) : undefined).orderBy(desc(breedingRecords.bredAt)).limit(200);
  });
  return c.json({ records: rows });
});
farmRoutes.post('/breeding', zValidator('json', breedingCreateSchema), async (c) => {
  const farmId = c.get('farmId' as never) as string;
  const i = c.req.valid('json');
  // Default due date: bredAt + 283 days (typical cow gestation)
  let dueAt = i.dueAt ?? null;
  if (!dueAt) {
    const d = new Date(i.bredAt);
    d.setDate(d.getDate() + 283);
    dueAt = d.toISOString().slice(0, 10);
  }
  const [row] = await withFarm(farmId, (tx) =>
    tx.insert(breedingRecords).values({
      farmId,
      damId: i.damId,
      sireId: i.sireId ?? null,
      sireExternalLabel: i.sireExternalLabel ?? null,
      method: i.method,
      bredAt: i.bredAt,
      dueAt,
      notes: i.notes ?? null,
    }).returning(),
  );
  return c.json({ record: row }, 201);
});
farmRoutes.patch('/breeding/:id', zValidator('json', breedingUpdateSchema), async (c) => {
  const farmId = c.get('farmId' as never) as string;
  const id = c.req.param('id');
  const i = c.req.valid('json');
  const patch: Record<string, unknown> = {};
  if (i.result !== undefined) patch.result = i.result;
  if (i.checkedAt !== undefined) patch.checkedAt = i.checkedAt;
  if (i.dueAt !== undefined) patch.dueAt = i.dueAt;
  if (i.calvedAt !== undefined) patch.calvedAt = i.calvedAt;
  if (i.calfId !== undefined) patch.calfId = i.calfId;
  if (i.notes !== undefined) patch.notes = i.notes;
  const [row] = await withFarm(farmId, (tx) => tx.update(breedingRecords).set(patch).where(eq(breedingRecords.id, id)).returning());
  if (!row) return c.json({ error: 'not_found' }, 404);
  return c.json({ record: row });
});
farmRoutes.get('/breeding/stats', async (c) => {
  const farmId = c.get('farmId' as never) as string;
  const data = await withFarm(farmId, async (tx) => {
    const rows = await tx.select({ result: breedingRecords.result, n: count() }).from(breedingRecords).groupBy(breedingRecords.result);
    const summary: { pending: number; confirmed: number; failed: number; calved: number } = { pending: 0, confirmed: 0, failed: 0, calved: 0 };
    for (const r of rows) (summary as any)[r.result] = Number(r.n);
    const total = summary.pending + summary.confirmed + summary.failed + summary.calved;
    const decided = summary.confirmed + summary.calved + summary.failed;
    const successRate = decided > 0 ? (summary.confirmed + summary.calved) / decided : 0;
    return { summary, total, successRate };
  });
  return c.json(data);
});

// ---------- Module 7: การเงิน ----------
farmRoutes.get('/finance', async (c) => {
  const farmId = c.get('farmId' as never) as string;
  const from = c.req.query('from');
  const to = c.req.query('to');
  const type = c.req.query('type');
  const rows = await withFarm(farmId, (tx) => {
    const conds: any[] = [];
    if (from) conds.push(gte(financeEntries.occurredAt, from));
    if (to) conds.push(lte(financeEntries.occurredAt, to));
    if (type === 'income' || type === 'expense') conds.push(eq(financeEntries.type, type));
    return tx.select().from(financeEntries).where(conds.length ? and(...conds) : undefined).orderBy(desc(financeEntries.occurredAt)).limit(500);
  });
  return c.json({ entries: rows });
});
farmRoutes.post('/finance', zValidator('json', financeCreateSchema), async (c) => {
  const farmId = c.get('farmId' as never) as string;
  const i = c.req.valid('json');
  const [row] = await withFarm(farmId, (tx) =>
    tx.insert(financeEntries).values({
      farmId, occurredAt: i.occurredAt, type: i.type, category: i.category,
      amount: String(i.amount), notes: i.notes ?? null, ref: i.ref ?? null,
    }).returning(),
  );
  return c.json({ entry: row }, 201);
});
farmRoutes.delete('/finance/:id', async (c) => {
  const farmId = c.get('farmId' as never) as string;
  const id = c.req.param('id');
  const [row] = await withFarm(farmId, (tx) => tx.delete(financeEntries).where(eq(financeEntries.id, id)).returning({ id: financeEntries.id }));
  if (!row) return c.json({ error: 'not_found' }, 404);
  return c.json({ ok: true });
});

// ---------- Module 8: รายงาน (on-demand summaries; PDF/Excel export later) ----------
farmRoutes.get('/reports/summary', async (c) => {
  const farmId = c.get('farmId' as never) as string;
  const from = c.req.query('from') ?? new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
  const to = c.req.query('to') ?? new Date().toISOString().slice(0, 10);

  const data = await withFarm(farmId, async (tx) => {
    const fin: any = await tx.execute(sql`
      SELECT type, category, COALESCE(SUM(amount),0)::text AS total
      FROM finance_entries
      WHERE occurred_at BETWEEN ${from} AND ${to}
      GROUP BY type, category
      ORDER BY total DESC
    `);
    const milkTotal: any = await tx.execute(sql`
      SELECT COALESCE(SUM(kg::numeric),0)::text AS total, COUNT(*)::int AS sessions
      FROM milk_records WHERE recorded_at BETWEEN ${from} AND ${to}
    `);
    const herd = await tx.select({ n: count() }).from(farmCattle).where(eq(farmCattle.status, 'active'));
    return {
      period: { from, to },
      finance: fin,
      milk: { totalKg: Number((milkTotal as any)[0]?.total ?? 0), sessions: Number((milkTotal as any)[0]?.sessions ?? 0) },
      activeHerd: Number(herd[0]?.n ?? 0),
    };
  });
  return c.json(data);
});

// Handy: list of cattle for pickers (ear tag + name only)
farmRoutes.get('/cattle/_picker', async (c) => {
  const farmId = c.get('farmId' as never) as string;
  const sex = c.req.query('sex');
  const rows = await withFarm(farmId, (tx) => {
    const conds: any[] = [eq(farmCattle.status, 'active')];
    if (sex === 'male' || sex === 'female') conds.push(eq(farmCattle.sex, sex));
    return tx
      .select({ id: farmCattle.id, earTag: farmCattle.earTag, name: farmCattle.name, sex: farmCattle.sex })
      .from(farmCattle)
      .where(and(...conds))
      .orderBy(asc(farmCattle.earTag));
  });
  return c.json({ cattle: rows });
});
