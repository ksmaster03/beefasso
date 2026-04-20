import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { requireSuperAdmin } from '../lib/auth.ts';
import { getAutoApprove, setAutoApprove } from '../lib/platform-settings.ts';
import { orgTypeSchema } from '@beefasso/shared';

export const adminSettingsRoutes = new Hono();

adminSettingsRoutes.get('/auto-approve', requireSuperAdmin, async (c) => {
  const cfg = await getAutoApprove();
  return c.json({ autoApprove: cfg });
});

adminSettingsRoutes.put(
  '/auto-approve',
  requireSuperAdmin,
  zValidator(
    'json',
    z.object({
      autoApprove: z.record(orgTypeSchema, z.boolean()),
    }),
  ),
  async (c) => {
    const { autoApprove } = c.req.valid('json');
    await setAutoApprove({
      association: !!autoApprove.association,
      cooperative: !!autoApprove.cooperative,
      enterprise: !!autoApprove.enterprise,
      group: !!autoApprove.group,
      other: !!autoApprove.other,
    });
    return c.json({ ok: true });
  },
);
