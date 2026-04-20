/**
 * Google OAuth 2.0 with PKCE. Hand-rolled using fetch + jose so we don't pull
 * another library. Credentials come from GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET
 * env vars. Redirect URI is derived from the caller's host so we can support
 * both jungdee.* and cattlepro.* without separate clients (as long as both
 * URIs are whitelisted in the Google Console).
 */
import { createHash, randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db, users, tenantUsers, tenants, farms, farmUsers } from '@beefasso/db';
import type { SessionUser } from '@beefasso/shared';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? '';

export function googleEnabled(): boolean {
  return !!(CLIENT_ID && CLIENT_SECRET);
}

function redirectUriFor(host: string): string {
  const scheme = host.includes('localhost') ? 'http' : 'https';
  return `${scheme}://${host}/api/auth/google/callback`;
}

function base64Url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function buildGoogleAuthUrl(host: string, redirect: string): Promise<{ url: string; state: string; codeVerifier: string }> {
  if (!googleEnabled()) throw new Error('google_oauth_not_configured');
  const state = base64Url(randomBytes(24));
  const codeVerifier = base64Url(randomBytes(32));
  const codeChallenge = base64Url(createHash('sha256').update(codeVerifier).digest());

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: redirectUriFor(host),
    response_type: 'code',
    scope: 'openid email profile',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    access_type: 'online',
    prompt: 'select_account',
  });
  return { url: `https://accounts.google.com/o/oauth2/v2/auth?${params}`, state, codeVerifier };
}

export type GoogleProfile = { sub: string; email: string; name: string; picture?: string };

export async function exchangeGoogleCode(host: string, code: string, verifier: string): Promise<GoogleProfile> {
  if (!googleEnabled()) throw new Error('google_oauth_not_configured');
  const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: redirectUriFor(host),
      grant_type: 'authorization_code',
      code_verifier: verifier,
    }),
  });
  if (!tokenResp.ok) throw new Error(`google_token_${tokenResp.status}`);
  const tokenJson = (await tokenResp.json()) as { access_token?: string };
  if (!tokenJson.access_token) throw new Error('google_no_access_token');

  const userinfo = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { authorization: `Bearer ${tokenJson.access_token}` },
  });
  if (!userinfo.ok) throw new Error(`google_userinfo_${userinfo.status}`);
  const p = (await userinfo.json()) as GoogleProfile;
  if (!p.email || !p.sub) throw new Error('google_profile_incomplete');
  return p;
}

/**
 * Look up the user by google_id first, then by email (link accounts if an
 * email-based account already exists). Create a fresh user if neither matches.
 * Then hydrate the session with tenant + farm membership like the password
 * login flow.
 */
export async function loginOrCreateGoogleUser(profile: GoogleProfile): Promise<{ sessionUser: SessionUser }> {
  let [u] = await db.select().from(users).where(eq(users.googleId, profile.sub));
  if (!u) {
    [u] = await db.select().from(users).where(eq(users.email, profile.email));
    if (u) {
      // Link Google to existing email account.
      await db.update(users).set({ googleId: profile.sub, avatarUrl: profile.picture ?? null }).where(eq(users.id, u.id));
      u = { ...u, googleId: profile.sub, avatarUrl: profile.picture ?? null };
    } else {
      const [created] = await db
        .insert(users)
        .values({
          email: profile.email,
          passwordHash: null,
          name: profile.name,
          googleId: profile.sub,
          avatarUrl: profile.picture ?? null,
          platformRole: 'user',
        })
        .returning();
      u = created!;
    }
  }

  // Reuse the password-login attachment logic inline (can't import cleanly due to order).
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

  return {
    sessionUser: {
      userId: u.id,
      email: u.email,
      name: u.name,
      platformRole: u.platformRole,
      tenantId,
      tenantRole,
      farmId,
      farmRole,
      farmSlug,
    },
  };
}
