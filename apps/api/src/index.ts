import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { trimTrailingSlash } from 'hono/trailing-slash';
import { resolveTenantFromPath, type TenantContext } from '@beefasso/shared';
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

// Resolve tenant from URL path (/t/:slug/...).
app.use('*', async (c, next) => {
  const tenant = resolveTenantFromPath(new URL(c.req.url).pathname);
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

// ----- Platform landing -----
app.get('/', (c) => c.html(renderPlatformLanding()));

// ----- Tenant SPA entry -----
// /t/:slug and /t/:slug/app/* both load the SPA (React Router handles the rest)
app.get('/t/:slug', (c) => {
  const slug = c.req.param('slug');
  return c.html(renderTenantEntry(slug));
});
app.get('/t/:slug/app/*', (c) => {
  const slug = c.req.param('slug');
  return c.html(renderTenantEntry(slug));
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
