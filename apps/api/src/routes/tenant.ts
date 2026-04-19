import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { tenantSignupSchema } from '@beefasso/shared';

export const tenantRoutes = new Hono();

// Public: an association signs up to use the platform.
// Creates tenant in `pending` state; super admin must approve.
tenantRoutes.post('/signup', zValidator('json', tenantSignupSchema), async (c) => {
  // TODO: create Tenant + owner User + TenantUser(owner) — all pending
  return c.json({ error: 'not_implemented' }, 501);
});

// Super admin only.
tenantRoutes.post('/:id/approve', async (c) => {
  // TODO: check super_admin, set status=active, approvedAt=now
  return c.json({ error: 'not_implemented' }, 501);
});
