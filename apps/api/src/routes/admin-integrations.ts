import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { randomBytes } from 'node:crypto';
import { requireSuperAdmin } from '../lib/auth.ts';
import {
  buildTasksAuthUrl,
  exchangeTasksCode,
  listTaskLists,
  getTasksConfig,
  setTasksConfig,
  clearTasksConfig,
} from '../lib/google-tasks.ts';

export const adminIntegrationRoutes = new Hono();

adminIntegrationRoutes.get('/google-tasks', requireSuperAdmin, async (c) => {
  const cfg = await getTasksConfig();
  if (!cfg) return c.json({ connected: false });
  return c.json({
    connected: true,
    email: cfg.email,
    taskListId: cfg.taskListId ?? null,
    taskListTitle: cfg.taskListTitle ?? null,
    connectedAt: cfg.connectedAt,
  });
});

adminIntegrationRoutes.get('/google-tasks/connect', requireSuperAdmin, async (c) => {
  const state = randomBytes(24).toString('base64url');
  const secure = process.env.NODE_ENV === 'production';
  c.header(
    'Set-Cookie',
    `bf_tasks_state=${state}; Path=/; Max-Age=600; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`,
  );
  const url = buildTasksAuthUrl(c.req.header('host') ?? '', state);
  return c.redirect(url);
});

adminIntegrationRoutes.get('/google-tasks/callback', requireSuperAdmin, async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');
  const cookie = c.req.header('cookie') ?? '';
  const m = cookie.match(/bf_tasks_state=([^;]+)/);
  if (!code || !state || !m || state !== m[1]) {
    return c.html('<p>state mismatch <a href="/admin">กลับ</a></p>', 400);
  }
  try {
    const host = c.req.header('host') ?? '';
    const tokens = await exchangeTasksCode(host, code);
    await setTasksConfig({
      refreshToken: tokens.refreshToken,
      email: tokens.email,
      connectedAt: new Date().toISOString(),
    });
    return c.redirect('/admin/integrations?tasks=connected');
  } catch (err: any) {
    return c.html(`<p>เชื่อม Google Tasks ไม่สำเร็จ: ${err.message} <a href="/admin/integrations">กลับ</a></p>`, 500);
  }
});

adminIntegrationRoutes.get('/google-tasks/lists', requireSuperAdmin, async (c) => {
  const cfg = await getTasksConfig();
  if (!cfg) return c.json({ error: 'not_connected' }, 400);
  try {
    const lists = await listTaskLists(cfg.refreshToken);
    return c.json({ lists });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

adminIntegrationRoutes.post(
  '/google-tasks/select-list',
  requireSuperAdmin,
  zValidator('json', z.object({ taskListId: z.string().min(1), taskListTitle: z.string().min(1) })),
  async (c) => {
    const { taskListId, taskListTitle } = c.req.valid('json');
    const cfg = await getTasksConfig();
    if (!cfg) return c.json({ error: 'not_connected' }, 400);
    await setTasksConfig({ ...cfg, taskListId, taskListTitle });
    return c.json({ ok: true });
  },
);

adminIntegrationRoutes.delete('/google-tasks', requireSuperAdmin, async (c) => {
  await clearTasksConfig();
  return c.json({ ok: true });
});
