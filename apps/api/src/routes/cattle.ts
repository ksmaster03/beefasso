import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { and, desc, eq, ilike, or, sql, count, inArray } from 'drizzle-orm';
import { withTenant, cattle, members } from '@beefasso/db';
import { cattleCreateSchema, cattleUpdateSchema, type PedigreeNode } from '@beefasso/shared';
import { requireTenantAuth } from '../lib/auth.ts';
import { putObject, deleteObject, getObjectStream, cattlePhotoKey, S3_BUCKET } from '../lib/s3.ts';

export const cattleRoutes = new Hono();

cattleRoutes.use('*', requireTenantAuth);

// List with search on regNo/earTag/name.
cattleRoutes.get('/', async (c) => {
  const tenantId = c.get('tenantId' as never) as string;
  const q = c.req.query('q')?.trim();
  const sex = c.req.query('sex');
  const limit = Math.min(Number(c.req.query('limit') ?? 50), 200);

  const rows = await withTenant(tenantId, async (tx) => {
    const conds: any[] = [];
    if (q) {
      const like = `%${q}%`;
      conds.push(or(ilike(cattle.regNo, like), ilike(cattle.earTag, like), ilike(cattle.name, like)));
    }
    if (sex === 'male' || sex === 'female') conds.push(eq(cattle.sex, sex));
    return tx
      .select()
      .from(cattle)
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(cattle.createdAt))
      .limit(limit);
  });

  return c.json({ cattle: rows });
});

// Lightweight autocomplete for sire/dam picker (returns {id, regNo, name, sex}).
cattleRoutes.get('/_autocomplete', async (c) => {
  const tenantId = c.get('tenantId' as never) as string;
  const q = c.req.query('q')?.trim();
  const sex = c.req.query('sex');
  if (!q || q.length < 2) return c.json({ matches: [] });

  const rows = await withTenant(tenantId, async (tx) => {
    const like = `%${q}%`;
    const conds = [or(ilike(cattle.regNo, like), ilike(cattle.earTag, like), ilike(cattle.name, like))];
    if (sex === 'male' || sex === 'female') conds.push(eq(cattle.sex, sex));
    return tx
      .select({ id: cattle.id, regNo: cattle.regNo, name: cattle.name, earTag: cattle.earTag, sex: cattle.sex })
      .from(cattle)
      .where(and(...conds))
      .limit(20);
  });

  return c.json({ matches: rows });
});

cattleRoutes.get('/:id', async (c) => {
  const tenantId = c.get('tenantId' as never) as string;
  const id = c.req.param('id');
  const data = await withTenant(tenantId, async (tx) => {
    const rows = await tx.select().from(cattle).where(eq(cattle.id, id));
    if (rows.length === 0) return null;
    const target = rows[0]!;

    const parentIds = [target.sireId, target.damId].filter(Boolean) as string[];
    const parents = parentIds.length
      ? await tx
          .select({ id: cattle.id, regNo: cattle.regNo, name: cattle.name, sex: cattle.sex })
          .from(cattle)
          .where(inArray(cattle.id, parentIds))
      : [];

    let owner: { id: string; memberNo: string; fullName: string } | null = null;
    if (target.currentOwnerId) {
      const [m] = await tx
        .select({ id: members.id, memberNo: members.memberNo, fullName: members.fullName })
        .from(members)
        .where(eq(members.id, target.currentOwnerId));
      owner = m ?? null;
    }
    return { cattle: target, parents, owner };
  });
  if (!data) return c.json({ error: 'not_found' }, 404);
  return c.json(data);
});

cattleRoutes.post('/', zValidator('json', cattleCreateSchema), async (c) => {
  const tenantId = c.get('tenantId' as never) as string;
  const input = c.req.valid('json');

  const inserted = await withTenant(tenantId, async (tx) => {
    const [row] = await tx
      .insert(cattle)
      .values({
        tenantId,
        regNo: input.regNo,
        earTag: input.earTag,
        name: input.name ?? null,
        breed: input.breed ?? null,
        sex: input.sex,
        dob: input.dob ?? null,
        color: input.color ?? null,
        sireId: input.sireId ?? null,
        damId: input.damId ?? null,
        currentOwnerId: input.currentOwnerId ?? null,
      })
      .returning();
    return row;
  });
  return c.json({ cattle: inserted }, 201);
});

cattleRoutes.patch('/:id', zValidator('json', cattleUpdateSchema), async (c) => {
  const tenantId = c.get('tenantId' as never) as string;
  const id = c.req.param('id');
  const input = c.req.valid('json');
  const patch: Record<string, unknown> = {};
  for (const k of ['regNo', 'earTag', 'name', 'breed', 'sex', 'dob', 'color', 'sireId', 'damId', 'currentOwnerId'] as const) {
    if (input[k] !== undefined) patch[k] = input[k] ?? null;
  }
  if (Object.keys(patch).length === 0) return c.json({ error: 'empty_patch' }, 400);

  const updated = await withTenant(tenantId, async (tx) => {
    const [r] = await tx.update(cattle).set(patch).where(eq(cattle.id, id)).returning();
    return r;
  });
  if (!updated) return c.json({ error: 'not_found' }, 404);
  return c.json({ cattle: updated });
});

// ---- Pedigree: fetch up to 4 generations of ancestors via recursive CTE ----
cattleRoutes.get('/:id/pedigree', async (c) => {
  const tenantId = c.get('tenantId' as never) as string;
  const id = c.req.param('id');
  const rows = await withTenant(tenantId, async (tx) => {
    const r = await tx.execute(sql`
      WITH RECURSIVE ancestors AS (
        SELECT id, reg_no, name, sex, sire_id, dam_id, 0 AS depth
        FROM cattle WHERE id = ${id}
        UNION ALL
        SELECT c.id, c.reg_no, c.name, c.sex, c.sire_id, c.dam_id, a.depth + 1
        FROM cattle c
        JOIN ancestors a ON (c.id = a.sire_id OR c.id = a.dam_id)
        WHERE a.depth < 3
      )
      SELECT DISTINCT id::text, reg_no, name, sex, sire_id::text, dam_id::text, depth FROM ancestors
    `);
    return r as unknown as any[];
  });

  if (rows.length === 0) return c.json({ error: 'not_found' }, 404);

  const nodes: Record<string, PedigreeNode> = {};
  for (const r of rows) {
    nodes[r.id] = {
      id: r.id,
      regNo: r.reg_no,
      name: r.name,
      sex: r.sex,
      sireId: r.sire_id,
      damId: r.dam_id,
    };
  }
  return c.json({ rootId: id, nodes });
});

// ---- Photos ----
cattleRoutes.post('/:id/photos', async (c) => {
  const tenantId = c.get('tenantId' as never) as string;
  const id = c.req.param('id');
  const form = await c.req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return c.json({ error: 'file_required' }, 400);
  if (file.size > 10 * 1024 * 1024) return c.json({ error: 'file_too_large' }, 413);

  const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase();
  if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return c.json({ error: 'bad_type' }, 415);
  const key = cattlePhotoKey(tenantId, id, ext);
  const buf = Buffer.from(await file.arrayBuffer());
  await putObject(key, buf, file.type || `image/${ext === 'jpg' ? 'jpeg' : ext}`);

  const updated = await withTenant(tenantId, async (tx) => {
    const [r] = await tx
      .update(cattle)
      .set({ photoUrls: sql`array_append(${cattle.photoUrls}, ${key})` })
      .where(eq(cattle.id, id))
      .returning({ photoUrls: cattle.photoUrls });
    return r;
  });

  if (!updated) {
    // Cattle not found — clean up orphan S3 object.
    await deleteObject(key).catch(() => {});
    return c.json({ error: 'not_found' }, 404);
  }
  return c.json({ key, photoUrls: updated.photoUrls }, 201);
});

cattleRoutes.delete('/:id/photos', async (c) => {
  const tenantId = c.get('tenantId' as never) as string;
  const id = c.req.param('id');
  const { key } = await c.req.json<{ key: string }>();
  if (!key || !key.startsWith(`${tenantId}/cattle/${id}/`)) return c.json({ error: 'bad_key' }, 400);

  const updated = await withTenant(tenantId, async (tx) => {
    const [r] = await tx
      .update(cattle)
      .set({ photoUrls: sql`array_remove(${cattle.photoUrls}, ${key})` })
      .where(eq(cattle.id, id))
      .returning({ photoUrls: cattle.photoUrls });
    return r;
  });
  await deleteObject(key).catch(() => {});
  return c.json({ photoUrls: updated?.photoUrls ?? [] });
});

// Proxy fetch S3 object — auth required, and key must belong to caller's tenant.
cattleRoutes.get('/photos/*', async (c) => {
  const tenantId = c.get('tenantId' as never) as string;
  const full = c.req.path;
  const key = full.replace(/^.*\/api\/cattle\/photos\//, '');
  if (!key.startsWith(`${tenantId}/cattle/`)) return c.json({ error: 'forbidden' }, 403);

  try {
    const { body, contentType } = await getObjectStream(key);
    const webStream = body as unknown as ReadableStream;
    return new Response(webStream, {
      headers: {
        'content-type': contentType ?? 'application/octet-stream',
        'cache-control': 'private, max-age=3600',
      },
    });
  } catch (e: any) {
    if (e?.$metadata?.httpStatusCode === 404 || e?.Code === 'NoSuchKey') return c.notFound();
    throw e;
  }
});
