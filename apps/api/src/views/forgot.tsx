import { Layout } from './layout.tsx';

export const renderForgotPassword = () => (
  <Layout title="ลืมรหัสผ่าน — Jungdee / Cattle Pro">
    <main class="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <a href="/login" class="text-sm text-slate-500 hover:text-primary-600">← กลับเข้าสู่ระบบ</a>
      <h1 class="mt-6 text-2xl font-bold text-slate-900 sm:text-3xl">ลืมรหัสผ่าน</h1>
      <p class="mt-2 text-sm text-slate-600">กรอกอีเมลที่ใช้สมัคร เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ให้</p>

      <form id="f" class="mt-8 space-y-4 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <label class="block">
          <span class="text-sm font-medium text-slate-700">อีเมล</span>
          <input name="email" type="email" required
            class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
        </label>
        <div id="msg" class="text-sm" />
        <button type="submit"
          class="w-full rounded-lg bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700">
          ส่งลิงก์รีเซ็ต
        </button>
      </form>

      <script
        dangerouslySetInnerHTML={{
          __html: `
document.getElementById('f').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = new FormData(e.target).get('email');
  const msg = document.getElementById('msg');
  msg.textContent = 'กำลังส่ง...';
  const r = await fetch('/api/auth/forgot-password', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email }),
  });
  const j = await r.json();
  msg.textContent = j.message || (r.ok ? 'ส่งแล้ว' : 'ผิดพลาด');
  msg.className = 'rounded-md bg-green-50 p-3 text-sm text-green-700';
});
`,
        }}
      />
    </main>
  </Layout>
);
