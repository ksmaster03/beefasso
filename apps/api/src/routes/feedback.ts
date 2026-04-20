import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, feedback } from '@beefasso/db';
import { feedbackCreateSchema, feedbackStatusSchema, feedbackTypeLabel, feedbackTypeEmoji } from '@beefasso/shared';
import { sendMail } from '../lib/mail.ts';
import { getSession, requireSuperAdmin } from '../lib/auth.ts';
import { createTask, getTasksConfig } from '../lib/google-tasks.ts';

export const feedbackRoutes = new Hono();

feedbackRoutes.post('/', zValidator('json', feedbackCreateSchema), async (c) => {
  const input = c.req.valid('json');
  const host = (c.req.header('host') ?? '').toLowerCase();
  const product = host.startsWith('cattlepro.') ? 'cattlepro' : 'jungdee';
  const user = await getSession(c);
  const userAgent = c.req.header('user-agent') ?? null;

  const [row] = await db
    .insert(feedback)
    .values({
      product,
      type: input.type,
      subject: input.subject,
      message: input.message,
      contactName: input.contactName ?? null,
      contactEmail: input.contactEmail ?? user?.email ?? null,
      contactPhone: input.contactPhone ?? null,
      pageUrl: input.pageUrl ?? null,
      userAgent,
      submitterUserId: user?.userId ?? null,
      tenantId: user?.tenantId ?? null,
      farmId: user?.farmId ?? null,
    })
    .returning();

  // Fan out to email + Google Tasks in the background; don't block response.
  void notifyFeedback(row);

  return c.json({ ok: true, id: row!.id }, 201);
});

async function notifyFeedback(row: any) {
  const typeLabel = feedbackTypeLabel(row.type);
  const emoji = feedbackTypeEmoji(row.type);
  const productLabel = row.product === 'cattlepro' ? 'Cattle Pro' : 'Jungdee';
  const title = `${emoji} [${productLabel}/${typeLabel}] ${row.subject}`;
  const body = [
    `ประเภท: ${typeLabel}`,
    `ระบบ: ${productLabel}`,
    `หัวข้อ: ${row.subject}`,
    '',
    'เนื้อหา:',
    row.message,
    '',
    row.contactName ? `ผู้ติดต่อ: ${row.contactName}` : '',
    row.contactEmail ? `อีเมล: ${row.contactEmail}` : '',
    row.contactPhone ? `เบอร์: ${row.contactPhone}` : '',
    row.pageUrl ? `หน้า: ${row.pageUrl}` : '',
    '',
    `Feedback ID: ${row.id}`,
    `เวลา: ${new Date(row.createdAt).toLocaleString('th-TH')}`,
  ]
    .filter(Boolean)
    .join('\n');

  // Email notification (non-fatal)
  try {
    await sendMail({
      to: 'toptierdigitalth@gmail.com',
      subject: title,
      text: body,
      html: `<p><strong>${title}</strong></p><pre style="white-space:pre-wrap;font-family:ui-sans-serif,system-ui">${escapeHtml(body)}</pre>`,
    });
  } catch (e) {
    console.error('[feedback] email notify failed', e);
  }

  // Google Tasks (if connected)
  try {
    const cfg = await getTasksConfig();
    if (cfg?.refreshToken && cfg.taskListId) {
      const task = await createTask({
        refreshToken: cfg.refreshToken,
        taskListId: cfg.taskListId,
        title,
        notes: body,
      });
      await db.update(feedback).set({ googleTaskId: task.id }).where(eq(feedback.id, row.id));
      console.log(`[feedback] google task created id=${task.id}`);
    }
  } catch (e) {
    console.error('[feedback] google tasks create failed', e);
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

// ---- Super admin ----
feedbackRoutes.get('/admin', requireSuperAdmin, async (c) => {
  const status = c.req.query('status');
  const rows = await db
    .select()
    .from(feedback)
    .where(status ? eq(feedback.status, status as any) : undefined)
    .orderBy(desc(feedback.createdAt))
    .limit(200);
  return c.json({ feedback: rows });
});

feedbackRoutes.patch(
  '/admin/:id',
  requireSuperAdmin,
  zValidator('json', z.object({ status: feedbackStatusSchema })),
  async (c) => {
    const id = c.req.param('id');
    const { status } = c.req.valid('json');
    const [row] = await db.update(feedback).set({ status }).where(eq(feedback.id, id)).returning();
    if (!row) return c.json({ error: 'not_found' }, 404);
    return c.json({ feedback: row });
  },
);
