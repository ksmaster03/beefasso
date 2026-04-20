import { Layout } from './layout.tsx';

export const renderResetPassword = (token: string) => (
  <Layout title="ตั้งรหัสผ่านใหม่ — Jungdee / Cattle Pro">
    <main class="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <h1 class="text-2xl font-bold text-slate-900 sm:text-3xl">ตั้งรหัสผ่านใหม่</h1>
      <p class="mt-2 text-sm text-slate-600">กรอกรหัสผ่านใหม่ที่ต้องการใช้</p>

      <form id="f" class="mt-8 space-y-4 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <input type="hidden" name="token" value={token} />
        <label class="block">
          <span class="text-sm font-medium text-slate-700">รหัสผ่านใหม่</span>
          <input name="password" type="password" minlength={8} required
            class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
          <span class="mt-1 block text-xs text-slate-500">อย่างน้อย 8 ตัวอักษร</span>
        </label>
        <label class="block">
          <span class="text-sm font-medium text-slate-700">ยืนยันรหัสผ่านใหม่</span>
          <input name="confirm" type="password" minlength={8} required
            class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
        </label>
        <div id="msg" class="text-sm" />
        <button type="submit"
          class="w-full rounded-lg bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700">
          บันทึกรหัสผ่านใหม่
        </button>
      </form>

      <script
        dangerouslySetInnerHTML={{
          __html: `
document.getElementById('f').addEventListener('submit', async (e) => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target).entries());
  const msg = document.getElementById('msg');
  if (d.password !== d.confirm) {
    msg.textContent = 'รหัสผ่านไม่ตรงกัน';
    msg.className = 'rounded-md bg-red-50 p-3 text-sm text-red-700';
    return;
  }
  msg.textContent = 'กำลังบันทึก...';
  const r = await fetch('/api/auth/reset-password', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token: d.token, password: d.password }),
  });
  const j = await r.json();
  if (r.ok) {
    msg.textContent = 'ตั้งรหัสผ่านใหม่เรียบร้อย — กำลังไปหน้า login';
    msg.className = 'rounded-md bg-green-50 p-3 text-sm text-green-700';
    setTimeout(() => location.href = '/login', 1200);
  } else {
    msg.textContent = j.error === 'invalid_or_expired_token' ? 'ลิงก์ไม่ถูกต้องหรือหมดอายุ' : 'ผิดพลาด: ' + j.error;
    msg.className = 'rounded-md bg-red-50 p-3 text-sm text-red-700';
  }
});
`,
        }}
      />
    </main>
  </Layout>
);
