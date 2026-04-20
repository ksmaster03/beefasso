/**
 * Google Tasks API integration.
 *
 * Flow:
 *  1. Super admin visits /admin/integrations/google-tasks/connect
 *  2. Google OAuth with access_type=offline + prompt=consent + tasks scope
 *  3. Callback exchanges code -> refresh_token, stored in platform_settings
 *     under the key 'google_tasks' with { refreshToken, email, taskListId }
 *  4. Admin picks a task list; from that point, every new feedback
 *     submission creates a Google Task automatically.
 */
import { eq } from 'drizzle-orm';
import { db, platformSettings } from '@beefasso/db';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? '';
const TASKS_SCOPE = 'https://www.googleapis.com/auth/tasks';

export function tasksOauthEnabled(): boolean {
  return !!(CLIENT_ID && CLIENT_SECRET);
}

function redirectUriFor(host: string): string {
  const scheme = host.includes('localhost') ? 'http' : 'https';
  return `${scheme}://${host}/api/admin/integrations/google-tasks/callback`;
}

export function buildTasksAuthUrl(host: string, state: string): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: redirectUriFor(host),
    response_type: 'code',
    scope: `openid email ${TASKS_SCOPE}`,
    access_type: 'offline',
    prompt: 'consent',
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeTasksCode(host: string, code: string): Promise<{ refreshToken: string; accessToken: string; email: string }> {
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: redirectUriFor(host),
      grant_type: 'authorization_code',
    }),
  });
  if (!r.ok) throw new Error(`tasks_code_exchange_${r.status}`);
  const j = (await r.json()) as { access_token?: string; refresh_token?: string };
  if (!j.access_token || !j.refresh_token) throw new Error('tasks_missing_tokens');
  const userinfo = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { authorization: `Bearer ${j.access_token}` },
  });
  const u = (await userinfo.json()) as { email?: string };
  return { refreshToken: j.refresh_token, accessToken: j.access_token, email: u.email ?? '' };
}

async function refreshAccessToken(refreshToken: string): Promise<string> {
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  if (!r.ok) throw new Error(`tasks_refresh_${r.status}`);
  const j = (await r.json()) as { access_token?: string };
  if (!j.access_token) throw new Error('tasks_refresh_no_access_token');
  return j.access_token;
}

export type TaskListsResult = { id: string; title: string }[];

export async function listTaskLists(refreshToken: string): Promise<TaskListsResult> {
  const access = await refreshAccessToken(refreshToken);
  const r = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
    headers: { authorization: `Bearer ${access}` },
  });
  if (!r.ok) throw new Error(`tasks_lists_${r.status}`);
  const j = (await r.json()) as { items?: { id: string; title: string }[] };
  return j.items ?? [];
}

export async function createTask(opts: {
  refreshToken: string;
  taskListId: string;
  title: string;
  notes: string;
}): Promise<{ id: string; selfLink: string }> {
  const access = await refreshAccessToken(opts.refreshToken);
  const r = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(opts.taskListId)}/tasks`, {
    method: 'POST',
    headers: { authorization: `Bearer ${access}`, 'content-type': 'application/json' },
    body: JSON.stringify({ title: opts.title, notes: opts.notes }),
  });
  if (!r.ok) throw new Error(`tasks_create_${r.status}: ${await r.text()}`);
  const j = (await r.json()) as { id: string; selfLink: string };
  return j;
}

// ---- Settings persistence ----
type TasksConfig = { refreshToken: string; email: string; taskListId?: string; taskListTitle?: string; connectedAt: string };

const KEY = 'google_tasks';

export async function getTasksConfig(): Promise<TasksConfig | null> {
  const [row] = await db.select().from(platformSettings).where(eq(platformSettings.key, KEY));
  if (!row) return null;
  return row.value as TasksConfig;
}

export async function setTasksConfig(cfg: TasksConfig): Promise<void> {
  await db
    .insert(platformSettings)
    .values({ key: KEY, value: cfg })
    .onConflictDoUpdate({ target: platformSettings.key, set: { value: cfg, updatedAt: new Date() } });
}

export async function clearTasksConfig(): Promise<void> {
  await db.delete(platformSettings).where(eq(platformSettings.key, KEY));
}
