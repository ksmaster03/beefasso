import { Layout } from './layout.tsx';

export const renderLogin = () => (
  <Layout title="เข้าสู่ระบบ — Jungdee">
    <main class="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <a href="/" class="text-sm text-slate-500 hover:text-primary-600">← กลับหน้าแรก</a>
      <h1 class="mt-6 text-3xl font-bold text-slate-900">เข้าสู่ระบบ</h1>
      <p class="mt-2 text-sm text-slate-600">สำหรับผู้ดูแลสมาคม และ super admin</p>

      <form id="f" class="mt-8 space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <label class="block">
          <span class="text-sm font-medium text-slate-700">อีเมล</span>
          <input
            name="email"
            type="email"
            required
            class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </label>
        <label class="block">
          <span class="text-sm font-medium text-slate-700">รหัสผ่าน</span>
          <input
            name="password"
            type="password"
            required
            class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </label>
        <div id="msg" class="text-sm" />
        <button
          type="submit"
          class="w-full rounded-lg bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
        >
          เข้าสู่ระบบ
        </button>
      </form>

      <script
        dangerouslySetInnerHTML={{
          __html: `
document.getElementById('f').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  const msg = document.getElementById('msg');
  msg.textContent = 'กำลังตรวจสอบ...';
  msg.className = 'text-sm text-slate-500';
  const r = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(data),
  });
  const j = await r.json();
  if (r.ok) {
    const u = j.user;
    const isCattlePro = location.hostname.startsWith('cattlepro.');
    if (isCattlePro) {
      if (u.farmId) { location.href = '/app'; return; }
      msg.textContent = 'บัญชีนี้ยังไม่มีฟาร์มในระบบ — กรุณาสมัครฟาร์มก่อน';
      msg.className = 'rounded-md bg-yellow-50 p-3 text-sm text-yellow-700';
      return;
    }
    if (u.platformRole === 'super_admin') location.href = '/admin';
    else if (u.tenantId) {
      location.href = '/';
    } else {
      msg.textContent = 'ยังไม่ได้รับอนุมัติเข้าสมาคมใด ๆ';
      msg.className = 'rounded-md bg-yellow-50 p-3 text-sm text-yellow-700';
    }
  } else {
    msg.textContent = j.error === 'invalid_credentials' ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' : 'ผิดพลาด';
    msg.className = 'rounded-md bg-red-50 p-3 text-sm text-red-700';
  }
});
`,
        }}
      />
    </main>
  </Layout>
);
