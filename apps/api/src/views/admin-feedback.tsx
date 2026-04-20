import { Layout } from './layout.tsx';
import { feedbackTypeLabel, feedbackTypeEmoji, feedbackStatusLabel, type FeedbackRow } from '@beefasso/shared';

export const renderAdminFeedback = (rows: FeedbackRow[], tasksStatus: { connected: boolean; email?: string; taskListTitle?: string | null }) => (
  <Layout title="Feedback — Jungdee / Cattle Pro admin">
    <main class="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <a href="/admin" class="text-sm text-slate-500 hover:text-primary-600">← Dashboard</a>
          <h1 class="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Feedback inbox</h1>
          <p class="mt-0.5 text-sm text-slate-500">{rows.length} รายการ</p>
        </div>
        <div>
          {tasksStatus.connected ? (
            <a href="/admin/integrations" class="inline-flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700 hover:bg-green-100">
              ● Google Tasks: {tasksStatus.email} {tasksStatus.taskListTitle && <span>→ {tasksStatus.taskListTitle}</span>}
            </a>
          ) : (
            <a href="/admin/integrations" class="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 hover:border-primary-500 hover:text-primary-600">
              เชื่อม Google Tasks →
            </a>
          )}
        </div>
      </header>

      <div class="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        {rows.length === 0 ? (
          <div class="p-10 text-center text-sm text-slate-500">ยังไม่มีข้อความ</div>
        ) : (
          <table class="min-w-full text-sm">
            <thead class="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th class="px-4 py-3">วันที่</th>
                <th class="px-4 py-3">ประเภท</th>
                <th class="px-4 py-3">ระบบ</th>
                <th class="px-4 py-3">หัวข้อ / ติดต่อ</th>
                <th class="px-4 py-3">สถานะ</th>
                <th class="px-4 py-3">Google Task</th>
                <th class="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              {rows.map((r) => (
                <tr data-id={r.id}>
                  <td class="px-4 py-3 text-xs text-slate-500">{new Date(r.createdAt).toLocaleString('th-TH')}</td>
                  <td class="px-4 py-3 text-sm">{feedbackTypeEmoji(r.type)} {feedbackTypeLabel(r.type)}</td>
                  <td class="px-4 py-3 text-xs">{r.product === 'cattlepro' ? 'Cattle Pro' : 'Jungdee'}</td>
                  <td class="px-4 py-3">
                    <div class="font-medium text-slate-900">{r.subject}</div>
                    <div class="mt-1 max-w-md text-xs text-slate-500">{r.message.length > 160 ? r.message.slice(0, 160) + '...' : r.message}</div>
                    {(r.contactName || r.contactEmail || r.contactPhone) && (
                      <div class="mt-1 text-xs text-slate-400">
                        {[r.contactName, r.contactEmail, r.contactPhone].filter(Boolean).join(' · ')}
                      </div>
                    )}
                  </td>
                  <td class="px-4 py-3">
                    <select data-status={r.id} class="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs">
                      <option value="new" selected={r.status === 'new'}>ใหม่</option>
                      <option value="reviewed" selected={r.status === 'reviewed'}>ตรวจแล้ว</option>
                      <option value="resolved" selected={r.status === 'resolved'}>จัดการเสร็จ</option>
                      <option value="dismissed" selected={r.status === 'dismissed'}>ไม่ดำเนินการ</option>
                    </select>
                  </td>
                  <td class="px-4 py-3 text-xs">
                    {r.googleTaskId ? <span class="text-green-700">●</span> : <span class="text-slate-300">—</span>}
                  </td>
                  <td class="px-4 py-3 text-right">
                    <a href={`https://tasks.google.com`} target="_blank" rel="noreferrer" class="text-xs text-slate-500 hover:text-primary-600">tasks →</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div id="toast" class="pointer-events-none fixed right-4 top-4 z-50 hidden rounded-lg px-4 py-2 text-sm font-medium shadow-lg" />

      <script
        dangerouslySetInnerHTML={{
          __html: `
function toast(msg, ok = true) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'pointer-events-none fixed right-4 top-4 z-50 rounded-lg px-4 py-2 text-sm font-medium shadow-lg ' + (ok ? 'bg-green-600 text-white' : 'bg-red-600 text-white');
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 3500);
}
document.querySelectorAll('[data-status]').forEach(el => {
  el.addEventListener('change', async (e) => {
    const id = e.target.dataset.status;
    const status = e.target.value;
    const r = await fetch('/api/feedback/admin/' + id, {
      method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status }),
    });
    if (r.ok) toast('อัปเดตสถานะแล้ว');
    else toast('อัปเดตไม่สำเร็จ', false);
  });
});
`,
        }}
      />
    </main>
  </Layout>
);
