import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { trimTrailingSlash } from 'hono/trailing-slash';
import { resolveTenantFromHost, type TenantContext } from '@beefasso/shared';
import { renderPlatformLanding } from './views/landing.tsx';
import { renderTenantEntry } from './views/tenant-entry.tsx';
import { renderVerify } from './views/verify.tsx';
import { authRoutes } from './routes/auth.ts';
import { tenantRoutes } from './routes/tenant.ts';
import { verifyRoutes } from './routes/verify.ts';

type Env = { Variables: { tenant: TenantContext } };

const app = new Hono<Env>();

app.use('*', logger());
app.use('*', secureHeaders());
app.use('*', trimTrailingSlash());

// Resolve tenant from Host header on every request.
app.use('*', async (c, next) => {
  const host = c.req.header('host');
  const tenant = resolveTenantFromHost(host);
  c.set('tenant', tenant);
  await next();
});

// ----- API (JSON) -----
app.get('/api/health', (c) =>
  c.json({ ok: true, tenant: c.get('tenant'), ts: Date.now() }),
);

app.route('/api/auth', authRoutes);
app.route('/api/tenants', tenantRoutes);
app.route('/api/verify', verifyRoutes);

// ----- Public SSR pages -----
app.get('/verify/:certNo', renderVerify);

// ----- SPA + landing -----
// Platform root → landing page (SSR)
// Tenant subdomain → entry page that loads SPA
app.get('/', (c) => {
  const t = c.get('tenant');
  if (t.kind === 'platform') return c.html(renderPlatformLanding());
  return c.html(renderTenantEntry(t.slug));
});

// SPA fallback — serve index.html for /app/* (Vite build output).
// In dev, Vite runs at :5173 and handles its own routes.
app.get('/app/*', (c) => {
  const t = c.get('tenant');
  if (t.kind !== 'tenant') return c.redirect('/');
  return c.html(renderTenantEntry(t.slug));
});

// 404
app.notFound((c) => c.json({ error: 'not_found' }, 404));

// Error
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'internal_error', message: err.message }, 500);
});

const port = Number(process.env.PORT ?? 3000);
export default { port, fetch: app.fetch };

console.log(`[jungdee/api] listening on :${port}`);
