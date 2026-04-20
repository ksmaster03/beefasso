import { Layout } from './layout.tsx';

type PendingTenant = {
  id: string;
  slug: string;
  nameTh: string;
  nameEn: string | null;
  createdAt: string;
};

export const renderAdmin = (userName: string, pending: PendingTenant[]) => (
  <Layout title="Platform Admin — Jungdee">
    <main class="mx-auto max-w-5xl px-6 py-10">
      <header class="flex items-center justify-between">
        <div>
          <p class="text-sm text-slate-500">Platform Admin</p>
          <h1 class="text-2xl font-bold text-slate-900">สมาคมที่รออนุมัติ</h1>
        </div>
        <div class="text-right text-sm">
          <div class="text-slate-700">{userName}</div>
          <button
            id="logout"
            class="mt-1 text-xs text-slate-500 hover:text-accent-600 underline"
          >
            ออกจากระบบ
          </button>
        </div>
      </header>

      <nav class="mt-6 flex flex-wrap gap-2 text-xs">
        <a href="/admin" class="rounded-full bg-slate-900 px-3 py-1 text-white">สมาคมรออนุมัติ</a>
        <a href="/admin/feedback" class="rounded-full border border-slate-300 bg-white px-3 py-1 text-slate-700 hover:border-primary-500 hover:text-primary-600">Feedback inbox</a>
        <a href="/admin/integrations" class="rounded-full border border-slate-300 bg-white px-3 py-1 text-slate-700 hover:border-primary-500 hover:text-primary-600">Integrations (Google Tasks)</a>
      </nav>

      <section class="mt-8">
        {pending.length === 0 ? (
          <div class="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            ไม่มีสมาคมรออนุมัติ
          </div>
        ) : (
          <div class="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table class="min-w-full text-sm">
              <thead class="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th class="px-4 py-3">slug</th>
                  <th class="px-4 py-3">ชื่อสมาคม</th>
                  <th class="px-4 py-3">สมัครเมื่อ</th>
                  <th class="px-4 py-3 text-right">การดำเนินการ</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200">
                {pending.map((t) => (
                  <tr data-id={t.id}>
                    <td class="px-4 py-3 font-mono text-xs text-primary-700">{t.slug}</td>
                    <td class="px-4 py-3">
                      <div class="font-medium text-slate-900">{t.nameTh}</div>
                      {t.nameEn && <div class="text-xs text-slate-500">{t.nameEn}</div>}
                    </td>
                    <td class="px-4 py-3 text-slate-600">
                      {new Date(t.createdAt).toLocaleString('th-TH')}
                    </td>
                    <td class="px-4 py-3 text-right">
                      <button
                        data-approve={t.id}
                        class="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700"
                      >
                        อนุมัติ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <script
        dangerouslySetInnerHTML={{
          __html: `
document.querySelectorAll('[data-approve]').forEach(btn => {
  btn.addEventListener('click', async () => {
    const id = btn.dataset.approve;
    btn.disabled = true;
    btn.textContent = 'กำลังอนุมัติ...';
    const r = await fetch('/api/tenants/' + id + '/approve', { method: 'POST' });
    if (r.ok) {
      const row = btn.closest('tr');
      row.style.opacity = '0.5';
      btn.textContent = 'อนุมัติแล้ว';
      setTimeout(() => location.reload(), 800);
    } else {
      btn.disabled = false;
      btn.textContent = 'ลองใหม่';
      alert('อนุมัติไม่สำเร็จ');
    }
  });
});
document.getElementById('logout').addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  location.href = '/';
});
`,
        }}
      />
    </main>
  </Layout>
);
