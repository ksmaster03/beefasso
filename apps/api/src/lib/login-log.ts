import { eq } from 'drizzle-orm';
import { db, loginLogs, users } from '@beefasso/db';
import type { Context } from 'hono';

function getClientIp(c: Context): string {
  return (
    c.req.header('cf-connecting-ip') ??
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
    c.req.header('x-real-ip') ??
    'unknown'
  );
}

export async function recordLogin(opts: {
  c: Context;
  userId: string | null;
  email: string;
  method: 'password' | 'google';
  success: boolean;
  failReason?: string;
}): Promise<void> {
  const ip = getClientIp(opts.c);
  const userAgent = opts.c.req.header('user-agent') ?? null;

  await db.insert(loginLogs).values({
    userId: opts.userId,
    email: opts.email,
    method: opts.method,
    success: opts.success,
    ip,
    userAgent,
    failReason: opts.failReason ?? null,
  });

  if (opts.success && opts.userId) {
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, opts.userId));
  }
}
