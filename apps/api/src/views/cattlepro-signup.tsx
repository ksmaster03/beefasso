import { Layout } from './layout.tsx';

export const renderCattleProSignup = () => (
  <Layout title="สมัครใช้ Cattle Pro — Jungdee Platform">
    <main class="mx-auto max-w-2xl px-6 py-12">
      <a href="/" class="text-sm text-slate-500 hover:text-accent-600">← กลับหน้าแรก</a>
      <h1 class="mt-4 text-3xl font-bold text-slate-900">สมัครใช้ Cattle Pro</h1>
      <p class="mt-2 text-slate-600">
        กรอกข้อมูลฟาร์มและผู้ดูแล — ได้ URL ฟาร์มทันที ไม่ต้องรออนุมัติ
      </p>

      <form id="f" class="mt-8 space-y-5 rounded-xl border border-slate-200 bg-white p-6">
        <Field name="nameTh" label="ชื่อฟาร์ม (ภาษาไทย)" required />
        <Field name="nameEn" label="ชื่อฟาร์ม (English)" />
        <Field
          name="slug"
          label="URL slug (อังกฤษ ตัวเล็ก)"
          hint="ใช้ระบุฟาร์มของคุณในระบบ"
          required
          pattern="[a-z0-9][a-z0-9-]*[a-z0-9]"
          minlength="3"
          maxlength="32"
        />
        <hr class="border-slate-200" />
        <Field name="contactName" label="ชื่อผู้ดูแล" required />
        <Field name="contactEmail" label="อีเมล" type="email" required />
        <Field name="contactPhone" label="เบอร์โทรศัพท์" required />
        <Field name="password" label="รหัสผ่าน" type="password" minlength="8" required />

        <div id="msg" class="text-sm" />
        <button
          type="submit"
          class="w-full rounded-lg bg-accent-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-700"
        >
          สมัครและเข้าใช้งาน
        </button>
      </form>

      <script
        dangerouslySetInnerHTML={{
          __html: `
document.getElementById('f').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  if (!data.nameEn) delete data.nameEn;
  const msg = document.getElementById('msg');
  msg.textContent = 'กำลังสมัคร...';
  const r = await fetch('/api/farm/signup', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data),
  });
  const j = await r.json();
  if (r.ok) {
    // Auto-login with same creds
    const r2 = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: data.contactEmail, password: data.password }),
    });
    if (r2.ok) location.href = '/app';
    else location.href = '/login';
  } else {
    const map = { slug_taken: 'slug นี้ถูกใช้แล้ว', email_taken: 'อีเมลนี้ถูกใช้แล้ว' };
    msg.textContent = map[j.error] || ('ผิดพลาด: ' + (j.error || 'ลองใหม่'));
    msg.className = 'rounded-md bg-red-50 p-3 text-sm text-red-700';
  }
});
`,
        }}
      />
    </main>
  </Layout>
);

type FieldProps = { name: string; label: string; type?: string; hint?: string; required?: boolean; pattern?: string; minlength?: number | string; maxlength?: number | string };
function Field({ name, label, type = 'text', hint, required, pattern, minlength, maxlength }: FieldProps) {
  return (
    <label class="block">
      <span class="text-sm font-medium text-slate-700">{label} {required && <span class="text-accent-500">*</span>}</span>
      <input
        name={name}
        type={type}
        required={required}
        pattern={pattern}
        minlength={minlength as any}
        maxlength={maxlength as any}
        class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
      />
      {hint && <span class="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}
