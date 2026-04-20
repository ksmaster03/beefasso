import { Layout } from './layout.tsx';

type UserRow = {
  id: string;
  email: string;
  name: string;
  platformRole: 'super_admin' | 'user';
  googleId: string | null;
  avatarUrl: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  tenant: { slug: string; nameTh: string; role: string } | null;
  farm: { slug: string; nameTh: string; role: string } | null;
};

const roleLabel = (r: string) => (r === 'super_admin' ? 'Super Admin' : 'User');

export const renderAdminUsers = (rows: UserRow[], currentUserId: string) => {
  const superAdminCount = rows.filter((r) => r.platformRole === 'super_admin').length;
  const googleCount = rows.filter((r) => r.googleId).length;

  return (
    <Layout title="Users — Jungdee admin">
      <main class="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <header class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <a href="/admin" class="text-sm text-slate-500 hover:text-primary-600">← Dashboard</a>
            <h1 class="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">จัดการ Users</h1>
            <p class="mt-1 flex flex-wrap gap-3 text-sm text-slate-500">
              <span>ทั้งหมด <strong class="text-slate-700">{rows.length}</strong> คน</span>
              <span>Super Admin <strong class="text-slate-700">{superAdminCount}</strong></span>
              <span>Google Login <strong class="text-slate-700">{googleCount}</strong></span>
            </p>
          </div>
        </header>

        {/* Search + Filter */}
        <div class="mt-6 flex flex-wrap items-center gap-3">
          <input
            id="search"
            type="search"
            placeholder="ค้นหาชื่อ / อีเมล..."
            class="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <div id="tabs" class="flex gap-1 text-xs">
            <button data-filter="all" class="tab-btn rounded-full bg-slate-900 px-3 py-1 text-white">ทั้งหมด ({rows.length})</button>
            <button data-filter="super_admin" class="tab-btn rounded-full border border-slate-300 bg-white px-3 py-1 text-slate-700 hover:border-primary-400">Super Admin ({superAdminCount})</button>
            <button data-filter="user" class="tab-btn rounded-full border border-slate-300 bg-white px-3 py-1 text-slate-700 hover:border-primary-400">User ({rows.length - superAdminCount})</button>
          </div>
        </div>

        {/* Toast */}
        <div id="toast" class="pointer-events-none fixed right-4 top-4 z-50 hidden rounded-lg px-4 py-2 text-sm font-medium shadow-lg" />

        {/* Table */}
        <div class="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          {rows.length === 0 ? (
            <div class="p-10 text-center text-sm text-slate-500">ยังไม่มีผู้ใช้</div>
          ) : (
            <table class="min-w-full text-sm" id="tbl">
              <thead class="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th class="px-4 py-3">ชื่อ / อีเมล</th>
                  <th class="px-4 py-3">Role</th>
                  <th class="px-4 py-3">องค์กร (Jungdee)</th>
                  <th class="px-4 py-3">ฟาร์ม (Cattle Pro)</th>
                  <th class="px-4 py-3">Login ล่าสุด</th>
                  <th class="px-4 py-3">สมัครเมื่อ</th>
                  <th class="px-4 py-3 text-right">การดำเนินการ</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200">
                {rows.map((u) => (
                  <tr data-id={u.id} data-role={u.platformRole} data-search={`${u.name} ${u.email}`.toLowerCase()}>
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-2">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt="" class="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div class="font-medium text-slate-900">{u.name}</div>
                          <div class="text-xs text-slate-500">{u.email}</div>
                          {u.googleId && (
                            <span class="mt-0.5 inline-flex items-center gap-1 rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-600">
                              G Google
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td class="px-4 py-3">
                      <span
                        data-badge={u.id}
                        class={`rounded-full px-2 py-0.5 text-xs font-semibold ${u.platformRole === 'super_admin' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}
                      >
                        {roleLabel(u.platformRole)}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-xs">
                      {u.tenant ? (
                        <div>
                          <a href={`/t/${u.tenant.slug}`} target="_blank" class="font-mono text-primary-700 hover:underline">{u.tenant.slug}</a>
                          <div class="text-slate-500">{u.tenant.nameTh}</div>
                          <div class="text-slate-400">{u.tenant.role}</div>
                        </div>
                      ) : (
                        <span class="text-slate-300">—</span>
                      )}
                    </td>
                    <td class="px-4 py-3 text-xs">
                      {u.farm ? (
                        <div>
                          <span class="font-mono text-emerald-700">{u.farm.slug}</span>
                          <div class="text-slate-500">{u.farm.nameTh}</div>
                          <div class="text-slate-400">{u.farm.role}</div>
                        </div>
                      ) : (
                        <span class="text-slate-300">—</span>
                      )}
                    </td>
                    <td class="px-4 py-3 text-xs text-slate-500">
                      {u.lastLoginAt
                        ? new Date(u.lastLoginAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })
                        : <span class="text-slate-300">ยังไม่เคย</span>}
                    </td>
                    <td class="px-4 py-3 text-xs text-slate-500">
                      {new Date(u.createdAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td class="px-4 py-3 text-right">
                      <div class="flex items-center justify-end gap-2">
                        {u.id !== currentUserId && (
                          <button
                            data-toggle-role={u.id}
                            data-current-role={u.platformRole}
                            class="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 hover:border-amber-400 hover:text-amber-700"
                            title={u.platformRole === 'super_admin' ? 'ลด role เป็น User' : 'เลื่อน role เป็น Super Admin'}
                          >
                            {u.platformRole === 'super_admin' ? '↓ Demote' : '↑ Promote'}
                          </button>
                        )}
                        {!u.googleId && (
                          <button
                            data-reset={u.id}
                            class="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 hover:border-blue-400 hover:text-blue-700"
                            title="ส่งอีเมลตั้งรหัสผ่านใหม่"
                          >
                            Reset PW
                          </button>
                        )}
                        {u.id !== currentUserId && (
                          <button
                            data-delete={u.id}
                            data-name={u.name}
                            class="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-red-600 hover:border-red-400 hover:bg-red-50"
                            title="ลบผู้ใช้"
                          >
                            ลบ
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <script
          dangerouslySetInnerHTML={{
            __html: `
// --- search ---
const search = document.getElementById('search');
const rows = () => document.querySelectorAll('#tbl tbody tr');
search.addEventListener('input', applyFilters);

// --- role filter tabs ---
let activeFilter = 'all';
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    activeFilter = btn.dataset.filter;
    document.querySelectorAll('.tab-btn').forEach(b => {
      const on = b === btn;
      b.className = on
        ? 'tab-btn rounded-full bg-slate-900 px-3 py-1 text-white'
        : 'tab-btn rounded-full border border-slate-300 bg-white px-3 py-1 text-slate-700 hover:border-primary-400';
    });
    applyFilters();
  });
});

function applyFilters() {
  const q = search.value.toLowerCase();
  rows().forEach(tr => {
    const matchSearch = !q || tr.dataset.search.includes(q);
    const matchRole = activeFilter === 'all' || tr.dataset.role === activeFilter;
    tr.style.display = matchSearch && matchRole ? '' : 'none';
  });
}

// --- toast ---
function toast(msg, ok = true) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'pointer-events-none fixed right-4 top-4 z-50 rounded-lg px-4 py-2 text-sm font-medium shadow-lg ' + (ok ? 'bg-green-600 text-white' : 'bg-red-600 text-white');
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 2500);
}

// --- promote / demote role ---
document.querySelectorAll('[data-toggle-role]').forEach(btn => {
  btn.addEventListener('click', async () => {
    const id = btn.dataset.toggleRole;
    const current = btn.dataset.currentRole;
    const next = current === 'super_admin' ? 'user' : 'super_admin';
    if (!confirm('เปลี่ยน role เป็น ' + (next === 'super_admin' ? 'Super Admin' : 'User') + '?')) return;
    btn.disabled = true;
    const r = await fetch('/api/admin/users/' + id + '/role', {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ role: next }),
    });
    if (r.ok) {
      btn.dataset.currentRole = next;
      btn.textContent = next === 'super_admin' ? '↓ Demote' : '↑ Promote';
      const badge = document.querySelector('[data-badge="' + id + '"]');
      if (badge) {
        badge.textContent = next === 'super_admin' ? 'Super Admin' : 'User';
        badge.className = 'rounded-full px-2 py-0.5 text-xs font-semibold ' + (next === 'super_admin' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600');
      }
      const row = btn.closest('tr');
      if (row) row.dataset.role = next;
      applyFilters();
      toast('เปลี่ยน role เรียบร้อย');
    } else {
      toast('เกิดข้อผิดพลาด', false);
    }
    btn.disabled = false;
  });
});

// --- send password reset ---
document.querySelectorAll('[data-reset]').forEach(btn => {
  btn.addEventListener('click', async () => {
    const id = btn.dataset.reset;
    if (!confirm('ส่งอีเมลตั้งรหัสผ่านใหม่ให้ผู้ใช้นี้?')) return;
    btn.disabled = true;
    btn.textContent = 'กำลังส่ง...';
    const r = await fetch('/api/admin/users/' + id + '/reset', { method: 'POST' });
    if (r.ok) {
      toast('ส่งอีเมลแล้ว');
      btn.textContent = 'ส่งแล้ว ✓';
    } else {
      toast('ส่งไม่สำเร็จ', false);
      btn.disabled = false;
      btn.textContent = 'Reset PW';
    }
  });
});

// --- delete user ---
document.querySelectorAll('[data-delete]').forEach(btn => {
  btn.addEventListener('click', async () => {
    const id = btn.dataset.delete;
    const name = btn.dataset.name;
    if (!confirm('ลบผู้ใช้ "' + name + '" ออกจากระบบ? ไม่สามารถกู้คืนได้')) return;
    btn.disabled = true;
    const r = await fetch('/api/admin/users/' + id, { method: 'DELETE' });
    if (r.ok) {
      const row = btn.closest('tr');
      row.style.opacity = '0.4';
      setTimeout(() => row.remove(), 600);
      toast('ลบผู้ใช้แล้ว');
    } else {
      const body = await r.json().catch(() => ({}));
      if (body.error === 'cannot_delete_self') toast('ไม่สามารถลบตัวเองได้', false);
      else toast('ลบไม่สำเร็จ', false);
      btn.disabled = false;
    }
  });
});
`,
          }}
        />
      </main>
    </Layout>
  );
};
