import { db, auditLogs } from '@beefasso/db';
import type { Context } from 'hono';
import { getUser } from './ctx.ts';

export async function recordAudit(opts: {
  c: Context;
  action: string;
  targetId?: string;
  targetType?: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  try {
    const actor = getUser(opts.c);
    const ip =
      opts.c.req.header('cf-connecting-ip') ??
      opts.c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
      'unknown';
    await db.insert(auditLogs).values({
      actorId: actor.userId,
      action: opts.action,
      targetId: opts.targetId ?? null,
      targetType: opts.targetType ?? null,
      meta: opts.meta ?? {},
      ip,
    });
  } catch (e) {
    console.error('[audit-log] failed to record', e);
  }
}
