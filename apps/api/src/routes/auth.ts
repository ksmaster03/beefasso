import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { createHash, randomBytes } from 'node:crypto';
import { db, users, tenantUsers, tenants, farms, farmUsers, passwordResetTokens } from '@beefasso/db';
import { loginSchema, type SessionUser } from '@beefasso/shared';
import {
  hashPassword,
  verifyPassword,
  signSession,
  setSessionCookie,
  clearSessionCookie,
  getSession,
  hashToken,
} from '../lib/auth.ts';
import { sendMail } from '../lib/mail.ts';
import { buildGoogleAuthUrl, exchangeGoogleCode, loginOrCreateGoogleUser } from '../lib/google-oauth.ts';
import { recordLogin } from '../lib/login-log.ts';

export const authRoutes = new Hono();

authRoutes.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');
  const rows = await db.select().from(users).where(eq(users.email, email));
  const u = rows[0];
  if (!u || !(await verifyPassword(password, u.passwordHash))) {
    await recordLogin({ c, userId: u?.id ?? null, email, method: 'password', success: false, failReason: !u ? 'user_not_found' : 'wrong_password' });
    return c.json({ error: 'invalid_credentials' }, 401);
  }

  // Find tenant + farm memberships so the session carries both products.
  let tenantId: SessionUser['tenantId'];
  let tenantRole: SessionUser['tenantRole'];
  if (u.platformRole !== 'super_admin') {
    const [link] = await db
      .select({ tenantId: tenantUsers.tenantId, role: tenantUsers.role, active: tenantUsers.active, status: tenants.status })
      .from(tenantUsers)
      .innerJoin(tenants, eq(tenantUsers.tenantId, tenants.id))
      .where(eq(tenantUsers.userId, u.id));
    if (link?.active && link.status === 'active') {
      tenantId = link.tenantId;
      tenantRole = link.role;
    }
  }

  let farmId: SessionUser['farmId'];
  let farmRole: SessionUser['farmRole'];
  let farmSlug: SessionUser['farmSlug'];
  const [flink] = await db
    .select({ farmId: farmUsers.farmId, role: farmUsers.role, active: farmUsers.active, status: farms.status, slug: farms.slug })
    .from(farmUsers)
    .innerJoin(farms, eq(farmUsers.farmId, farms.id))
    .where(eq(farmUsers.userId, u.id));
  if (flink?.active && flink.status === 'active') {
    farmId = flink.farmId;
    farmRole = flink.role;
    farmSlug = flink.slug;
  }

  const sess: SessionUser = {
    userId: u.id,
    email: u.email,
    name: u.name,
    platformRole: u.platformRole,
    tenantId,
    tenantRole,
    farmId,
    farmRole,
    farmSlug,
  };
  await recordLogin({ c, userId: u.id, email, method: 'password', success: true });
  const token = await signSession(sess);
  setSessionCookie(c, token);
  return c.json({ ok: true, user: sess });
});

authRoutes.post('/logout', async (c) => {
  clearSessionCookie(c);
  return c.json({ ok: true });
});

authRoutes.get('/me', async (c) => {
  const user = await getSession(c);
  if (!user) return c.json({ error: 'unauthorized' }, 401);
  return c.json({ user });
});

// ---- Forgot / Reset password ----
const forgotSchema = z.object({ email: z.string().email() });

authRoutes.post('/forgot-password', zValidator('json', forgotSchema), async (c) => {
  const { email } = c.req.valid('json');
  const [u] = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.email, email));

  // Always respond ok so the endpoint doesn't reveal whether an email exists.
  if (u) {
    const rawToken = randomBytes(32).toString('base64url');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min
    await db.insert(passwordResetTokens).values({ userId: u.id, tokenHash, expiresAt });

    const origin = c.req.header('origin') ?? `https://${c.req.header('host')}`;
    const link = `${origin}/reset-password?token=${rawToken}`;
    await sendMail({
      to: email,
      subject: 'รีเซ็ตรหัสผ่าน Jungdee / Cattle Pro',
      html: `<p>สวัสดีคุณ ${u.name},</p><p>กดลิงก์นี้เพื่อตั้งรหัสผ่านใหม่ (หมดอายุใน 30 นาที):</p><p><a href="${link}">${link}</a></p><p>ถ้าไม่ได้ร้องขอ สามารถเพิกเฉยต่ออีเมลนี้ได้</p>`,
      text: `รีเซ็ตรหัสผ่าน: ${link} (หมดอายุใน 30 นาที)`,
    });
  }
  return c.json({ ok: true, message: 'หากอีเมลนี้อยู่ในระบบ เราส่งลิงก์รีเซ็ตให้แล้ว' });
});

const resetSchema = z.object({
  token: z.string().min(10).max(200),
  password: z.string().min(8).max(128),
});

authRoutes.post('/reset-password', zValidator('json', resetSchema), async (c) => {
  const { token, password } = c.req.valid('json');
  const tokenHash = hashToken(token);
  const [row] = await db
    .select()
    .from(passwordResetTokens)
    .where(and(eq(passwordResetTokens.tokenHash, tokenHash), isNull(passwordResetTokens.usedAt), gt(passwordResetTokens.expiresAt, new Date())));
  if (!row) return c.json({ error: 'invalid_or_expired_token' }, 400);

  const newHash = await hashPassword(password);
  await db.transaction(async (tx) => {
    await tx.update(users).set({ passwordHash: newHash }).where(eq(users.id, row.userId));
    await tx.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, row.id));
  });
  return c.json({ ok: true });
});

// ---- Google OAuth ----
authRoutes.get('/google', async (c) => {
  const redirect = c.req.query('redirect') ?? '/';
  const { url, state, codeVerifier } = await buildGoogleAuthUrl(c.req.header('host') ?? '', redirect);
  // Store PKCE verifier + state in short-lived cookies.
  const secure = process.env.NODE_ENV === 'production';
  const common = `Path=/; Max-Age=600; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`;
  c.header('Set-Cookie', `bf_oauth_state=${state}; ${common}`, { append: true });
  c.header('Set-Cookie', `bf_oauth_verifier=${codeVerifier}; ${common}`, { append: true });
  c.header('Set-Cookie', `bf_oauth_redirect=${encodeURIComponent(redirect)}; ${common}`, { append: true });
  return c.redirect(url);
});

authRoutes.get('/google/callback', async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');
  const cookieHeader = c.req.header('cookie') ?? '';
  const pick = (n: string) => {
    const m = cookieHeader.match(new RegExp(`(?:^|;\\s*)${n}=([^;]+)`));
    return m ? m[1] : undefined;
  };
  const storedState = pick('bf_oauth_state');
  const verifier = pick('bf_oauth_verifier');
  const redirect = decodeURIComponent(pick('bf_oauth_redirect') ?? '/');
  if (!code || !state || !storedState || state !== storedState || !verifier) {
    return c.html('<p>เข้าสู่ระบบล้มเหลว (state mismatch) <a href="/login">กลับสู่หน้า login</a></p>', 400);
  }

  try {
    const host = c.req.header('host') ?? '';
    const profile = await exchangeGoogleCode(host, code, verifier);
    const { sessionUser } = await loginOrCreateGoogleUser(profile);
    await recordLogin({ c, userId: sessionUser.userId, email: sessionUser.email, method: 'google', success: true });
    const token = await signSession(sessionUser);
    setSessionCookie(c, token);
    return c.redirect(redirect);
  } catch (err: any) {
    console.error('google callback error', err);
    await recordLogin({ c, userId: null, email: 'unknown', method: 'google', success: false, failReason: err.message }).catch(() => {});
    return c.html(`<p>เข้าสู่ระบบด้วย Google ไม่สำเร็จ: ${err.message} <a href="/login">ลองใหม่</a></p>`, 500);
  }
});
