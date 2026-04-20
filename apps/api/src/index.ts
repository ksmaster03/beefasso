import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { trimTrailingSlash } from 'hono/trailing-slash';
import { serveStatic } from 'hono/bun';
import { eq, desc } from 'drizzle-orm';
import { resolveTenantFromPath, resolveProductFromHost, type TenantContext, type Product } from '@beefasso/shared';
import { db, tenants, farms, users, tenantUsers, farmUsers } from '@beefasso/db';
import { renderPlatformLanding } from './views/landing.tsx';
import { renderTenantEntry } from './views/tenant-entry.tsx';
import { renderVerify } from './views/verify.tsx';
import { renderSignup } from './views/signup.tsx';
import { renderLogin } from './views/login.tsx';
import { renderAdmin } from './views/admin.tsx';
import { renderTenantNotFound } from './views/not-found.tsx';
import { renderCattleProLanding } from './views/cattlepro-landing.tsx';
import { renderCattleProSignup } from './views/cattlepro-signup.tsx';
import { renderCattleProAppEntry } from './views/cattlepro-app-entry.tsx';
import { renderForgotPassword } from './views/forgot.tsx';
import { renderResetPassword } from './views/reset.tsx';
import { googleEnabled } from './lib/google-oauth.ts';
import { authRoutes } from './routes/auth.ts';
import { tenantRoutes } from './routes/tenant.ts';
import { verifyRoutes } from './routes/verify.ts';
import { memberRoutes } from './routes/members.ts';
import { cattleRoutes } from './routes/cattle.ts';
import { feeConfigRoutes } from './routes/fee-configs.ts';
import { paymentRoutes } from './routes/payments.ts';
import { settingsRoutes } from './routes/settings.ts';
import { certificateRoutes } from './routes/certificates.ts';
import { farmRoutes } from './routes/farm.ts';
import { feedbackRoutes } from './routes/feedback.ts';
import { adminIntegrationRoutes } from './routes/admin-integrations.ts';
import { adminSettingsRoutes } from './routes/admin-settings.ts';
import { adminUsersRoutes } from './routes/admin-users.ts';
import { renderFeedback } from './views/feedback.tsx';
import { renderAdminFeedback } from './views/admin-feedback.tsx';
import { renderAdminIntegrations } from './views/admin-integrations.tsx';
import { renderAdminSettings } from './views/admin-settings.tsx';
import { renderAdminUsers } from './views/admin-users.tsx';
import { getTasksConfig, listTaskLists } from './lib/google-tasks.ts';
import { getAutoApprove } from './lib/platform-settings.ts';
import { feedback } from '@beefasso/db';
import { getSession } from './lib/auth.ts';
type Env = { Variables: { tenant: TenantContext; product: Product } };

const app = new Hono<Env>();

app.use('*', logger());
app.use('*', secureHeaders());
app.use('*', trimTrailingSlash());

// Serve built SPA assets + static photos + logos from apps/api/public.
app.use('/assets/*', serveStatic({ root: './public' }));
app.use('/photos/*', serveStatic({ root: './public' }));
app.use('/logos/*', serveStatic({ root: './public' }));

// Resolve tenant from URL path (Jungdee) and product from Host header.
app.use('*', async (c, next) => {
  const tenant = resolveTenantFromPath(new URL(c.req.url).pathname);
  const product = resolveProductFromHost(c.req.header('host'));
  c.set('tenant', tenant);
  c.set('product', product);
  await next();
});

// ----- API (JSON) -----
app.get('/api/health', (c) =>
  c.json({ ok: true, tenant: c.get('tenant'), ts: Date.now() }),
);

app.route('/api/auth', authRoutes);
app.route('/api/tenants', tenantRoutes);
app.route('/api/verify', verifyRoutes);
app.route('/api/members', memberRoutes);
app.route('/api/cattle', cattleRoutes);
app.route('/api/fee-configs', feeConfigRoutes);
app.route('/api/payments', paymentRoutes);
app.route('/api/settings', settingsRoutes);
app.route('/api/certificates', certificateRoutes);
app.route('/api/farm', farmRoutes);
app.route('/api/feedback', feedbackRoutes);
app.route('/api/admin/integrations', adminIntegrationRoutes);
app.route('/api/admin/settings', adminSettingsRoutes);
app.route('/api/admin/users', adminUsersRoutes);

// ----- Public SSR pages (product-aware) -----
app.get('/', (c) => {
  const product = c.get('product');
  if (product === 'cattlepro') return c.html(renderCattleProLanding());
  return c.html(renderPlatformLanding());
});
app.get('/signup', (c) => {
  const product = c.get('product');
  if (product === 'cattlepro') return c.html(renderCattleProSignup());
  return c.html(renderSignup());
});
app.get('/login', (c) => c.html(renderLogin({ googleEnabled: googleEnabled(), product: c.get('product') })));
app.get('/forgot-password', (c) => c.html(renderForgotPassword()));
app.get('/reset-password', (c) => {
  const token = c.req.query('token') ?? '';
  return c.html(renderResetPassword(token));
});
app.get('/verify/:certNo', renderVerify);

// Public feedback form
app.get('/feedback', (c) => c.html(renderFeedback(c.get('product'))));

// Super admin: feedback inbox + integrations
app.get('/admin/feedback', async (c) => {
  const user = await getSession(c);
  if (!user) return c.redirect('/login');
  if (user.platformRole !== 'super_admin') return c.html('<p>Forbidden</p>', 403);
  const rows = await db.select().from(feedback).orderBy(desc(feedback.createdAt)).limit(200);
  const cfg = await getTasksConfig();
  const normalized = rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  })) as unknown as Parameters<typeof renderAdminFeedback>[0];
  return c.html(renderAdminFeedback(normalized, { connected: !!cfg, email: cfg?.email, taskListTitle: cfg?.taskListTitle ?? null }));
});

app.get('/admin/settings', async (c) => {
  const user = await getSession(c);
  if (!user) return c.redirect('/login');
  if (user.platformRole !== 'super_admin') return c.html('<p>Forbidden</p>', 403);
  const cfg = await getAutoApprove();
  return c.html(renderAdminSettings(cfg));
});

app.get('/admin/users', async (c) => {
  const user = await getSession(c);
  if (!user) return c.redirect('/login');
  if (user.platformRole !== 'super_admin') return c.html('<p>Forbidden</p>', 403);
  const allUsers = await db
    .select({ id: users.id, email: users.email, name: users.name, platformRole: users.platformRole, googleId: users.googleId, avatarUrl: users.avatarUrl, createdAt: users.createdAt })
    .from(users)
    .orderBy(desc(users.createdAt));
  const tenantLinks = await db.select({ userId: tenantUsers.userId, role: tenantUsers.role, slug: tenants.slug, nameTh: tenants.nameTh }).from(tenantUsers).innerJoin(tenants, eq(tenantUsers.tenantId, tenants.id));
  const farmLinks = await db.select({ userId: farmUsers.userId, role: farmUsers.role, slug: farms.slug, nameTh: farms.nameTh }).from(farmUsers).innerJoin(farms, eq(farmUsers.farmId, farms.id));
  const tenantByUser = new Map(tenantLinks.map((l) => [l.userId, l]));
  const farmByUser = new Map(farmLinks.map((l) => [l.userId, l]));
  const rows = allUsers.map((u) => ({ ...u, createdAt: u.createdAt.toISOString(), tenant: tenantByUser.get(u.id) ?? null, farm: farmByUser.get(u.id) ?? null }));
  return c.html(renderAdminUsers(rows as any, user.userId));
});

app.get('/admin/integrations', async (c) => {
  const user = await getSession(c);
  if (!user) return c.redirect('/login');
  if (user.platformRole !== 'super_admin') return c.html('<p>Forbidden</p>', 403);
  const cfg = await getTasksConfig();
  let lists: { id: string; title: string }[] = [];
  if (cfg) {
    try { lists = await listTaskLists(cfg.refreshToken); } catch {}
  }
  const justConnected = c.req.query('tasks') === 'connected';
  return c.html(
    renderAdminIntegrations(
      { connected: !!cfg, email: cfg?.email, taskListId: cfg?.taskListId ?? null, taskListTitle: cfg?.taskListTitle ?? null },
      lists,
      justConnected,
    ),
  );
});

// ----- Cattle Pro in-app routes -----
app.get('/app', async (c) => {
  if (c.get('product') !== 'cattlepro') return c.redirect('/');
  const user = await getSession(c);
  if (!user || !user.farmId) return c.redirect('/login');
  const [f] = await db.select({ slug: farms.slug, nameTh: farms.nameTh }).from(farms).where(eq(farms.id, user.farmId));
  if (!f) return c.redirect('/login');
  return c.html(renderCattleProAppEntry(f.slug, f.nameTh));
});
app.get('/app/*', async (c) => {
  if (c.get('product') !== 'cattlepro') return c.redirect('/');
  const user = await getSession(c);
  if (!user || !user.farmId) return c.redirect('/login');
  const [f] = await db.select({ slug: farms.slug, nameTh: farms.nameTh }).from(farms).where(eq(farms.id, user.farmId));
  if (!f) return c.redirect('/login');
  return c.html(renderCattleProAppEntry(f.slug, f.nameTh));
});

// Super admin dashboard
app.get('/admin', async (c) => {
  const user = await getSession(c);
  if (!user) return c.redirect('/login');
  if (user.platformRole !== 'super_admin') return c.html('<p>Forbidden</p>', 403);
  const rows = await db
    .select({ id: tenants.id, slug: tenants.slug, nameTh: tenants.nameTh, nameEn: tenants.nameEn, orgType: tenants.orgType, createdAt: tenants.createdAt })
    .from(tenants)
    .where(eq(tenants.status, 'pending'));
  const pending = rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
  return c.html(renderAdmin(user.name, pending));
});

// Tenant SPA entry — validated against DB
app.get('/t/:slug', async (c) => {
  const slug = c.req.param('slug');
  const [t] = await db.select().from(tenants).where(eq(tenants.slug, slug));
  if (!t || t.status !== 'active') return c.html(renderTenantNotFound(slug), 404);
  return c.html(renderTenantEntry(t.slug, t.nameTh, t.orgType));
});
app.get('/t/:slug/app/*', async (c) => {
  const slug = c.req.param('slug');
  const [t] = await db.select().from(tenants).where(eq(tenants.slug, slug));
  if (!t || t.status !== 'active') return c.html(renderTenantNotFound(slug), 404);
  return c.html(renderTenantEntry(t.slug, t.nameTh, t.orgType));
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
