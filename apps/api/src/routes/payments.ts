import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { and, desc, eq, sql } from 'drizzle-orm';
import { db, withTenant, payments, members, feeConfigs, tenants } from '@beefasso/db';
import { paymentCreateSchema, tenantSettingsSchema } from '@beefasso/shared';
import { validateFileMagicBytes } from '../lib/validate-file.ts';
import { requireTenantAuth } from '../lib/auth.ts';
import { putObject, deleteObject, getObjectStream } from '../lib/s3.ts';
import { promptPayQr, newRefCode } from '../lib/promptpay.ts';

export const paymentRoutes = new Hono();
paymentRoutes.use('*', requireTenantAuth);

// List — filter by status, memberId optional.
paymentRoutes.get('/', async (c) => {
  const tenantId = c.get('tenantId' as never) as string;
  const status = c.req.query('status');
  const memberId = c.req.query('memberId');

  const rows = await withTenant(tenantId, async (tx) => {
    const conds: any[] = [];
    if (status && ['pending', 'verified', 'rejected'].includes(status)) conds.push(eq(payments.status, status as any));
    if (memberId) conds.push(eq(payments.memberId, memberId));
    return tx
      .select({
        id: payments.id,
        memberId: payments.memberId,
        memberNo: members.memberNo,
        memberName: members.fullName,
        feeCode: payments.feeCode,
        amount: payments.amount,
        refCode: payments.refCode,
        slipUrl: payments.slipUrl,
        status: payments.status,
        verifiedAt: payments.verifiedAt,
        createdAt: payments.createdAt,
      })
      .from(payments)
      .leftJoin(members, eq(payments.memberId, members.id))
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(payments.createdAt))
      .limit(200);
  });
  return c.json({ payments: rows });
});

// Create payment: look up fee by code + member, gen refCode + PromptPay QR payload.
paymentRoutes.post('/', zValidator('json', paymentCreateSchema), async (c) => {
  const tenantId = c.get('tenantId' as never) as string;
  const { memberId, feeCode } = c.req.valid('json');

  // tenants table has no RLS — read settings directly.
  const [t] = await db.select({ settings: tenants.settings }).from(tenants).where(eq(tenants.id, tenantId));
  const settings = tenantSettingsSchema.safeParse(t?.settings ?? {});
  if (!settings.success || !settings.data.promptpayId) {
    return c.json({ error: 'promptpay_not_configured' }, 400);
  }

  const result = await withTenant(tenantId, async (tx) => {
    const [fee] = await tx
      .select()
      .from(feeConfigs)
      .where(and(eq(feeConfigs.code, feeCode), eq(feeConfigs.active, true)));
    if (!fee) return { error: 'fee_not_found' as const };

    const [m] = await tx.select({ id: members.id }).from(members).where(eq(members.id, memberId));
    if (!m) return { error: 'member_not_found' as const };

    const refCode = newRefCode();
    const [p] = await tx
      .insert(payments)
      .values({ tenantId, memberId, feeCode: fee.code, amount: fee.amount, refCode })
      .returning();
    return { payment: p!, fee };
  });

  if ('error' in result) return c.json({ error: result.error }, 404);

  const qr = await promptPayQr(settings.data.promptpayId, Number(result.payment.amount));
  return c.json(
    {
      payment: result.payment,
      fee: { code: result.fee.code, name: result.fee.name, interval: result.fee.interval },
      promptpay: {
        id: settings.data.promptpayId,
        holderName: settings.data.promptpayHolderName ?? null,
        payload: qr.payload,
        qrDataUrl: qr.qrDataUrl,
      },
    },
    201,
  );
});

// Single payment — returns current QR too (regenerates, same amount/payload deterministic per amount+id).
paymentRoutes.get('/:id', async (c) => {
  const tenantId = c.get('tenantId' as never) as string;
  const id = c.req.param('id');

  const data = await withTenant(tenantId, async (tx) => {
    const [p] = await tx.select().from(payments).where(eq(payments.id, id));
    if (!p) return null;
    const [m] = await tx.select({ memberNo: members.memberNo, fullName: members.fullName }).from(members).where(eq(members.id, p.memberId));
    const [f] = await tx.select({ name: feeConfigs.name, interval: feeConfigs.interval }).from(feeConfigs).where(eq(feeConfigs.code, p.feeCode));
    return { payment: p, member: m ?? null, fee: f ?? null };
  });
  if (!data) return c.json({ error: 'not_found' }, 404);

  const [t] = await db.select({ settings: tenants.settings }).from(tenants).where(eq(tenants.id, tenantId));
  const settings = tenantSettingsSchema.safeParse(t?.settings ?? {});
  let promptpay: { id: string; holderName: string | null; payload: string; qrDataUrl: string } | null = null;
  if (settings.success && settings.data.promptpayId) {
    const qr = await promptPayQr(settings.data.promptpayId, Number(data.payment.amount));
    promptpay = {
      id: settings.data.promptpayId,
      holderName: settings.data.promptpayHolderName ?? null,
      payload: qr.payload,
      qrDataUrl: qr.qrDataUrl,
    };
  }
  return c.json({ ...data, promptpay });
});

// Upload slip image to S3.
paymentRoutes.post('/:id/slip', async (c) => {
  const tenantId = c.get('tenantId' as never) as string;
  const id = c.req.param('id');
  const form = await c.req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return c.json({ error: 'file_required' }, 400);
  if (file.size > 5 * 1024 * 1024) return c.json({ error: 'file_too_large' }, 413);

  const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase();
  if (!['jpg', 'jpeg', 'png', 'webp', 'pdf'].includes(ext)) return c.json({ error: 'bad_type' }, 415);
  const buf = Buffer.from(await file.arrayBuffer());
  if (!validateFileMagicBytes(buf, ext)) return c.json({ error: 'bad_type' }, 415);
  const key = `${tenantId}/slips/${id}/${crypto.randomUUID()}.${ext}`;
  await putObject(key, buf, file.type || (ext === 'pdf' ? 'application/pdf' : `image/${ext === 'jpg' ? 'jpeg' : ext}`));

  const updated = await withTenant(tenantId, async (tx) => {
    const [p] = await tx.select({ slipUrl: payments.slipUrl }).from(payments).where(eq(payments.id, id));
    if (!p) return null;
    // Delete previous slip if present.
    if (p.slipUrl) await deleteObject(p.slipUrl).catch(() => {});
    const [r] = await tx.update(payments).set({ slipUrl: key }).where(eq(payments.id, id)).returning();
    return r;
  });

  if (!updated) {
    await deleteObject(key).catch(() => {});
    return c.json({ error: 'not_found' }, 404);
  }
  return c.json({ payment: updated });
});

// Admin approves. Extends member expiry according to the fee interval.
paymentRoutes.post('/:id/verify', async (c) => {
  const tenantId = c.get('tenantId' as never) as string;
  const user = c.get('user' as never) as { userId: string; tenantRole?: string };
  if (!user.tenantRole || !['owner', 'admin'].includes(user.tenantRole)) {
    return c.json({ error: 'forbidden' }, 403);
  }
  const id = c.req.param('id');

  const verified = await withTenant(tenantId, async (tx) => {
    const [p] = await tx.select().from(payments).where(eq(payments.id, id));
    if (!p) return null;
    if (p.status !== 'pending') return { error: 'already_decided' as const, payment: p };

    const [fee] = await tx.select().from(feeConfigs).where(eq(feeConfigs.code, p.feeCode));

    const [updated] = await tx
      .update(payments)
      .set({
        status: 'verified',
        verifyMethod: 'manual',
        verifiedBy: user.userId,
        verifiedAt: new Date(),
      })
      .where(eq(payments.id, id))
      .returning();

    // Extend member expiry if the fee has an interval (annual).
    if (fee?.interval === 'year') {
      // current expiry or now, +1 year
      const [m] = await tx.select({ expiredAt: members.expiredAt }).from(members).where(eq(members.id, p.memberId));
      const base = m?.expiredAt && new Date(m.expiredAt) > new Date() ? new Date(m.expiredAt) : new Date();
      const next = new Date(base);
      next.setFullYear(next.getFullYear() + 1);
      await tx.update(members).set({ expiredAt: next, status: 'active' }).where(eq(members.id, p.memberId));
    } else if (fee?.interval === null && fee?.code === 'lifetime') {
      await tx.update(members).set({ expiredAt: null, status: 'active', type: 'lifetime' }).where(eq(members.id, p.memberId));
    }

    return { payment: updated };
  });

  if (!verified) return c.json({ error: 'not_found' }, 404);
  if ('error' in verified) return c.json({ error: verified.error, payment: verified.payment }, 409);
  return c.json({ payment: verified.payment });
});

paymentRoutes.post('/:id/reject', async (c) => {
  const tenantId = c.get('tenantId' as never) as string;
  const user = c.get('user' as never) as { userId: string; tenantRole?: string };
  if (!user.tenantRole || !['owner', 'admin'].includes(user.tenantRole)) {
    return c.json({ error: 'forbidden' }, 403);
  }
  const id = c.req.param('id');

  const updated = await withTenant(tenantId, async (tx) => {
    const [r] = await tx
      .update(payments)
      .set({ status: 'rejected', verifyMethod: 'manual', verifiedBy: user.userId, verifiedAt: new Date() })
      .where(and(eq(payments.id, id), eq(payments.status, 'pending')))
      .returning();
    return r;
  });
  if (!updated) return c.json({ error: 'not_found_or_not_pending' }, 404);
  return c.json({ payment: updated });
});

// Slip proxy — tenant-scoped, returns the S3 object.
paymentRoutes.get('/slip/*', async (c) => {
  const tenantId = c.get('tenantId' as never) as string;
  const key = c.req.path.replace(/^.*\/api\/payments\/slip\//, '');
  if (!key.startsWith(`${tenantId}/slips/`)) return c.json({ error: 'forbidden' }, 403);
  try {
    const { body, contentType } = await getObjectStream(key);
    return new Response(body as unknown as ReadableStream, {
      headers: {
        'content-type': contentType ?? 'application/octet-stream',
        'cache-control': 'private, max-age=3600',
      },
    });
  } catch (e: any) {
    if (e?.$metadata?.httpStatusCode === 404) return c.notFound();
    throw e;
  }
});
