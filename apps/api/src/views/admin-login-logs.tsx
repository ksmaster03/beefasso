import { Layout } from './layout.tsx';

type LogRow = {
  id: string;
  userId: string | null;
  email: string;
  method: 'password' | 'google';
  success: boolean;
  ip: string | null;
  userAgent: string | null;
  failReason: string | null;
  createdAt: string;
};

const methodBadge = (m: string) =>
  m === 'google'
    ? <span class="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">G Google</span>
    : <span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">Password</span>;

export const renderAdminLoginLogs = (rows: LogRow[]) => {
  const failCount = rows.filter((r) => !r.success).length;
  const uniqueIps = new Set(rows.map((r) => r.ip).filter(Boolean)).size;

  return (
    <Layout title="Login Logs — Jungdee admin">
      <main class="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <header class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <a href="/admin" class="text-sm text-slate-500 hover:text-primary-600">← Dashboard</a>
            <h1 class="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Login Logs</h1>
            <p class="mt-1 flex flex-wrap gap-3 text-sm text-slate-500">
              <span>ทั้งหมด <strong class="text-slate-700">{rows.length}</strong> รายการ (200 ล่าสุด)</span>
              <span class="text-red-600">ล้มเหลว <strong>{failCount}</strong></span>
              <span>IP ที่ต่างกัน <strong class="text-slate-700">{uniqueIps}</strong></span>
            </p>
          </div>
          <div class="flex gap-2 text-xs">
            <a href="/admin/users" class="rounded-full border border-slate-300 bg-white px-3 py-1 text-slate-700 hover:border-primary-500">← จัดการ Users</a>
          </div>
        </header>

        {/* Filter */}
        <div class="mt-5 flex flex-wrap items-center gap-3">
          <input
            id="search"
            type="search"
            placeholder="ค้นหา email / IP..."
            class="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <div id="tabs" class="flex gap-1 text-xs">
            <button data-filter="all" class="tab-btn rounded-full bg-slate-900 px-3 py-1 text-white">ทั้งหมด</button>
            <button data-filter="fail" class="tab-btn rounded-full border border-slate-300 bg-white px-3 py-1 text-slate-700 hover:border-red-400">ล้มเหลวเท่านั้น</button>
          </div>
        </div>

        <div class="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          {rows.length === 0 ? (
            <div class="p-10 text-center text-sm text-slate-500">ยังไม่มี log</div>
          ) : (
            <table class="min-w-full text-sm" id="tbl">
              <thead class="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th class="px-4 py-3">เวลา</th>
                  <th class="px-4 py-3">อีเมล</th>
                  <th class="px-4 py-3">วิธี</th>
                  <th class="px-4 py-3">สถานะ</th>
                  <th class="px-4 py-3">เหตุผล</th>
                  <th class="px-4 py-3">IP</th>
                  <th class="px-4 py-3">Browser / App</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200">
                {rows.map((r) => (
                  <tr
                    data-success={r.success ? 'true' : 'false'}
                    data-search={`${r.email} ${r.ip ?? ''}`.toLowerCase()}
                    class={r.success ? '' : 'bg-red-50'}
                  >
                    <td class="whitespace-nowrap px-4 py-2.5 text-xs text-slate-500">
                      {new Date(r.createdAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'medium' })}
                    </td>
                    <td class="px-4 py-2.5 text-xs font-medium text-slate-800">{r.email}</td>
                    <td class="px-4 py-2.5">{methodBadge(r.method)}</td>
                    <td class="px-4 py-2.5">
                      {r.success ? (
                        <span class="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">สำเร็จ</span>
                      ) : (
                        <span class="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">ล้มเหลว</span>
                      )}
                    </td>
                    <td class="px-4 py-2.5 text-xs text-slate-500">{r.failReason ?? '—'}</td>
                    <td class="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-slate-600">{r.ip ?? '—'}</td>
                    <td class="max-w-xs truncate px-4 py-2.5 text-xs text-slate-400" title={r.userAgent ?? ''}>{r.userAgent ? r.userAgent.slice(0, 60) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <script
          dangerouslySetInnerHTML={{
            __html: `
const search = document.getElementById('search');
let activeFilter = 'all';

search.addEventListener('input', applyFilters);

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    activeFilter = btn.dataset.filter;
    document.querySelectorAll('.tab-btn').forEach(b => {
      const on = b === btn;
      b.className = on
        ? 'tab-btn rounded-full bg-slate-900 px-3 py-1 text-white'
        : 'tab-btn rounded-full border border-slate-300 bg-white px-3 py-1 text-slate-700 hover:border-red-400';
    });
    applyFilters();
  });
});

function applyFilters() {
  const q = search.value.toLowerCase();
  document.querySelectorAll('#tbl tbody tr').forEach(tr => {
    const matchSearch = !q || tr.dataset.search.includes(q);
    const matchFilter = activeFilter === 'all' || (activeFilter === 'fail' && tr.dataset.success === 'false');
    tr.style.display = matchSearch && matchFilter ? '' : 'none';
  });
}
`,
          }}
        />
      </main>
    </Layout>
  );
};
