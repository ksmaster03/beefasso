import { Layout } from './layout.tsx';
import { ORG_TYPE_OPTIONS, type OrgType } from '@beefasso/shared';

export const renderAdminSettings = (autoApprove: Record<OrgType, boolean>) => (
  <Layout title="Platform Settings — Jungdee admin">
    <main class="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <a href="/admin" class="text-sm text-slate-500 hover:text-primary-600">← Dashboard</a>
      <h1 class="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Platform Settings</h1>

      <section class="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <header>
          <h2 class="text-lg font-semibold text-slate-900">การอนุมัติอัตโนมัติตามประเภทองค์กร</h2>
          <p class="mt-1 text-sm text-slate-500">
            เมื่อเปิดใช้งาน ผู้สมัครประเภทที่เลือกจะผ่านไปเป็น <strong>active</strong> ทันที
            ไม่ต้องรอ super admin อนุมัติ — เหมาะสำหรับประเภทที่ตรวจสอบเองยาก เช่น กลุ่มเกษตรกร
          </p>
        </header>

        <form id="f" class="mt-6 space-y-3">
          {ORG_TYPE_OPTIONS.map((o) => (
            <label class="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 transition hover:border-primary-500">
              <div>
                <div class="text-sm font-medium text-slate-900">{o.label}</div>
                <div class="mt-0.5 text-xs text-slate-500">{o.hint}</div>
              </div>
              <div class="flex items-center">
                <input
                  type="checkbox"
                  name={o.value}
                  checked={autoApprove[o.value]}
                  class="h-5 w-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
              </div>
            </label>
          ))}

          <div id="msg" class="text-sm" />
          <div class="flex items-center gap-3 pt-2">
            <button
              type="submit"
              class="rounded-lg bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-700"
            >
              บันทึก
            </button>
            <span class="text-xs text-slate-500">
              ตัวเลือกนี้มีผลเฉพาะ <strong>การสมัครใหม่</strong> เท่านั้น
            </span>
          </div>
        </form>
      </section>

      <script
        dangerouslySetInnerHTML={{
          __html: `
document.getElementById('f').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const body = { autoApprove: {
    association: fd.get('association') === 'on',
    cooperative: fd.get('cooperative') === 'on',
    enterprise:  fd.get('enterprise')  === 'on',
    group:       fd.get('group')       === 'on',
    other:       fd.get('other')       === 'on',
  }};
  const msg = document.getElementById('msg');
  msg.textContent = 'กำลังบันทึก...';
  const r = await fetch('/api/admin/settings/auto-approve', {
    method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
  if (r.ok) {
    msg.textContent = 'บันทึกแล้ว';
    msg.className = 'rounded-md bg-green-50 p-3 text-sm text-green-700';
  } else {
    msg.textContent = 'ผิดพลาด';
    msg.className = 'rounded-md bg-red-50 p-3 text-sm text-red-700';
  }
});
`,
        }}
      />
    </main>
  </Layout>
);
