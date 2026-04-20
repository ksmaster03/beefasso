import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import type { Context, MiddlewareHandler } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import type { SessionUser } from '@beefasso/shared';

if (process.env.NODE_ENV === 'production' && !process.env.AUTH_SECRET) {
  throw new Error('AUTH_SECRET env var is required in production');
}
const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET ?? 'dev-secret-change-me');
const COOKIE = 'bf_sess';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string | null): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
}

export function hashToken(token: string): string {
  // Store a SHA-256 of the reset token so the raw token isn't at rest.
  const hex = require('node:crypto').createHash('sha256').update(token).digest('hex');
  return hex;
}

export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(SECRET);
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify<SessionUser>(token, SECRET);
    return payload;
  } catch {
    return null;
  }
}

export function setSessionCookie(c: Context, token: string) {
  setCookie(c, COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export function clearSessionCookie(c: Context) {
  deleteCookie(c, COOKIE, { path: '/' });
}

export async function getSession(c: Context): Promise<SessionUser | null> {
  const token = getCookie(c, COOKIE);
  if (!token) return null;
  return verifySession(token);
}

/** Require a logged-in user. */
export const requireAuth: MiddlewareHandler<{ Variables: { user: SessionUser } }> = async (
  c,
  next,
) => {
  const user = await getSession(c);
  if (!user) return c.json({ error: 'unauthorized' }, 401);
  c.set('user', user);
  await next();
};

/** Require the platform super_admin role. */
export const requireSuperAdmin: MiddlewareHandler<{ Variables: { user: SessionUser } }> = async (
  c,
  next,
) => {
  const user = await getSession(c);
  if (!user) return c.json({ error: 'unauthorized' }, 401);
  if (user.platformRole !== 'super_admin') return c.json({ error: 'forbidden' }, 403);
  c.set('user', user);
  await next();
};

/** Require a logged-in user attached to an active tenant. */
export const requireTenantAuth: MiddlewareHandler<{
  Variables: { user: SessionUser; tenantId: string };
}> = async (c, next) => {
  const user = await getSession(c);
  if (!user) return c.json({ error: 'unauthorized' }, 401);
  if (!user.tenantId) return c.json({ error: 'no_active_tenant' }, 403);
  c.set('user', user);
  c.set('tenantId', user.tenantId);
  await next();
};

/** Require a logged-in user attached to an active farm (Cattle Pro). */
export const requireFarmAuth: MiddlewareHandler<{
  Variables: { user: SessionUser; farmId: string };
}> = async (c, next) => {
  const user = await getSession(c);
  if (!user) return c.json({ error: 'unauthorized' }, 401);
  if (!user.farmId) return c.json({ error: 'no_active_farm' }, 403);
  c.set('user', user);
  c.set('farmId', user.farmId);
  await next();
};
