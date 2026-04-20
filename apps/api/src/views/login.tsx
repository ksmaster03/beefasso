import { Layout } from './layout.tsx';

type Opts = { googleEnabled: boolean; product: 'jungdee' | 'cattlepro' };

export const renderLogin = (opts: Opts = { googleEnabled: false, product: 'jungdee' }) => {
  const isCP = opts.product === 'cattlepro';
  const accentCls = isCP
    ? 'bg-accent-600 hover:bg-accent-700 focus:border-accent-500 focus:ring-accent-500'
    : 'bg-primary-600 hover:bg-primary-700 focus:border-primary-500 focus:ring-primary-500';
  return (
    <Layout title="เข้าสู่ระบบ — Jungdee / Cattle Pro">
      <main class="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12 sm:px-6">
        <a href="/" class={`text-sm text-slate-500 hover:${isCP ? 'text-accent-600' : 'text-primary-600'}`}>← กลับหน้าแรก</a>
        <h1 class="mt-6 text-2xl font-bold text-slate-900 sm:text-3xl">เข้าสู่ระบบ</h1>
        <p class="mt-2 text-sm text-slate-600">
          {isCP ? 'สำหรับเจ้าของฟาร์ม Cattle Pro' : 'สำหรับผู้ดูแลสมาคม และ super admin'}
        </p>

        {opts.googleEnabled && (
          <>
            <a
              href="/api/auth/google"
              class="mt-6 flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <GoogleIcon />
              เข้าสู่ระบบด้วย Google
            </a>
            <div class="my-5 flex items-center gap-3 text-xs text-slate-400">
              <div class="h-px flex-1 bg-slate-200" /> หรือ <div class="h-px flex-1 bg-slate-200" />
            </div>
          </>
        )}

        <form id="f" class="space-y-4 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <label class="block">
            <span class="text-sm font-medium text-slate-700">อีเมล</span>
            <input name="email" type="email" required autocomplete="email"
              class={`mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${isCP ? 'focus:border-accent-500 focus:ring-accent-500' : 'focus:border-primary-500 focus:ring-primary-500'}`} />
          </label>
          <label class="block">
            <span class="flex items-center justify-between text-sm font-medium text-slate-700">
              <span>รหัสผ่าน</span>
              <a href="/forgot-password" class={`text-xs font-normal text-slate-500 hover:${isCP ? 'text-accent-600' : 'text-primary-600'}`}>ลืมรหัสผ่าน?</a>
            </span>
            <input name="password" type="password" required autocomplete="current-password"
              class={`mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${isCP ? 'focus:border-accent-500 focus:ring-accent-500' : 'focus:border-primary-500 focus:ring-primary-500'}`} />
          </label>
          <div id="msg" class="text-sm" />
          <button type="submit" class={`w-full rounded-lg px-6 py-3 text-sm font-semibold text-white shadow-sm transition ${accentCls}`}>
            เข้าสู่ระบบ
          </button>
        </form>

        <p class="mt-6 text-center text-sm text-slate-500">
          ยังไม่มีบัญชี?{' '}
          <a href="/signup" class={`font-medium ${isCP ? 'text-accent-600' : 'text-primary-600'} hover:underline`}>
            {isCP ? 'สมัครฟาร์ม' : 'สมัครสมาคม'}
          </a>
        </p>

        <script
          dangerouslySetInnerHTML={{
            __html: `
document.getElementById('f').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type=submit]');
  const data = Object.fromEntries(new FormData(e.target).entries());
  const msg = document.getElementById('msg');
  btn.disabled = true; btn.textContent = 'กำลังตรวจสอบ...';
  msg.textContent = ''; msg.className = 'text-sm';
  const r = await fetch('/api/auth/login', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data),
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
    else if (u.tenantId) location.href = '/';
    else {
      msg.textContent = 'ยังไม่ได้รับอนุมัติเข้าสมาคมใด ๆ';
      msg.className = 'rounded-md bg-yellow-50 p-3 text-sm text-yellow-700';
    }
  } else {
    const errMap = { invalid_credentials: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง', too_many_requests: 'ลองใหม่อีกสักครู่ (ลองบ่อยเกินไป)' };
    msg.textContent = errMap[j.error] || 'เกิดข้อผิดพลาด กรุณาลองใหม่';
    msg.className = 'rounded-md bg-red-50 p-3 text-sm text-red-700';
    btn.disabled = false; btn.textContent = 'เข้าสู่ระบบ';
  }
});
`,
          }}
        />
      </main>
    </Layout>
  );
};

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.8-8.7 20-19.7 0-1.3-.1-2.5-.4-3.8z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 18.9 13 24 13c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.5 2.3-7.2 2.3-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.5 39.5 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.6l6.2 5.2c-.4.4 6.5-4.7 6.5-14.8 0-1.3-.1-2.5-.4-3.5z" />
  </svg>
);
