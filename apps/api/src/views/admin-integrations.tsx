import { Layout } from './layout.tsx';

type Cfg = { connected: boolean; email?: string; taskListId?: string | null; taskListTitle?: string | null };

export const renderAdminIntegrations = (cfg: Cfg, lists: { id: string; title: string }[], justConnected: boolean) => (
  <Layout title="Integrations — Jungdee / Cattle Pro admin">
    <main class="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <a href="/admin" class="text-sm text-slate-500 hover:text-primary-600">← Dashboard</a>
      <h1 class="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Integrations</h1>

      {justConnected && (
        <div class="mt-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
          ● เชื่อม Google Tasks สำเร็จ — เลือก task list ด้านล่างเพื่อให้ feedback ใหม่ถูกสร้างเป็น task อัตโนมัติ
        </div>
      )}

      <section class="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <header class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold text-slate-900">Google Tasks</h2>
            <p class="mt-1 text-sm text-slate-500">
              เมื่อมี feedback ใหม่ ระบบจะสร้าง task บน Google Tasks ของคุณอัตโนมัติ
            </p>
          </div>
          <div>
            {cfg.connected ? (
              <span class="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">● เชื่อมแล้ว</span>
            ) : (
              <span class="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">ยังไม่เชื่อม</span>
            )}
          </div>
        </header>

        {cfg.connected ? (
          <>
            <dl class="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt class="text-xs uppercase tracking-wider text-slate-500">Google Account</dt>
                <dd class="mt-0.5 text-slate-900">{cfg.email ?? '—'}</dd>
              </div>
              <div>
                <dt class="text-xs uppercase tracking-wider text-slate-500">Task list ปัจจุบัน</dt>
                <dd class="mt-0.5 text-slate-900">{cfg.taskListTitle ?? <span class="text-accent-600">ยังไม่เลือก — กรุณาเลือกด้านล่าง</span>}</dd>
              </div>
            </dl>

            <form id="select-list" class="mt-6 flex items-end gap-3">
              <label class="block flex-1">
                <span class="text-sm font-medium text-slate-700">เลือก Task list</span>
                <select id="tasklist" class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                  {lists.map((l) => (
                    <option value={l.id} data-title={l.title} selected={l.id === cfg.taskListId}>{l.title}</option>
                  ))}
                </select>
              </label>
              <button type="submit" class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
                บันทึก
              </button>
              <button type="button" id="disconnect" class="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                ถอนการเชื่อมต่อ
              </button>
            </form>
          </>
        ) : (
          <a href="/api/admin/integrations/google-tasks/connect" class="mt-6 inline-flex items-center rounded-lg bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-700">
            เชื่อม Google Tasks
          </a>
        )}
      </section>

      <section class="mt-6 text-xs text-slate-500">
        Feedback ทุกรายการจะ:
        <ul class="mt-2 list-disc pl-5">
          <li>บันทึกในระบบ และดูได้ที่ <a href="/admin/feedback" class="text-primary-600 hover:underline">/admin/feedback</a></li>
          <li>ส่งอีเมลแจ้งเตือนไปที่ toptierdigitalth@gmail.com</li>
          <li>สร้าง task อัตโนมัติบน Google Tasks (ถ้าเชื่อมต่อและเลือก list แล้ว)</li>
        </ul>
      </section>

      <script
        dangerouslySetInnerHTML={{
          __html: `
const form = document.getElementById('select-list');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const sel = document.getElementById('tasklist');
    const opt = sel.options[sel.selectedIndex];
    const r = await fetch('/api/admin/integrations/google-tasks/select-list', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ taskListId: sel.value, taskListTitle: opt.dataset.title }),
    });
    if (r.ok) location.href = '/admin/integrations?tasks=saved';
    else alert('บันทึกไม่สำเร็จ');
  });
}
const d = document.getElementById('disconnect');
if (d) {
  d.addEventListener('click', async () => {
    if (!confirm('ถอนการเชื่อมต่อ Google Tasks?')) return;
    await fetch('/api/admin/integrations/google-tasks', { method: 'DELETE' });
    location.href = '/admin/integrations';
  });
}
`,
        }}
      />
    </main>
  </Layout>
);
