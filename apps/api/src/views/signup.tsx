import { Layout } from './layout.tsx';

export const renderSignup = () => (
  <Layout title="สมัครสมาคม — Jungdee">
    <main class="mx-auto max-w-2xl px-6 py-12">
      <a href="/" class="text-sm text-slate-500 hover:text-primary-600">← กลับหน้าแรก</a>
      <h1 class="mt-4 text-3xl font-bold text-slate-900">สมัครสมาคมใช้งาน Jungdee</h1>
      <p class="mt-2 text-slate-600">
        กรอกข้อมูลสมาคมและข้อมูลผู้ดูแล ทีมงานจะตรวจสอบและอนุมัติภายใน 1-2 วันทำการ
      </p>

      <form id="f" class="mt-8 space-y-5 rounded-xl border border-slate-200 bg-white p-6">
        <Field name="nameTh" label="ชื่อสมาคม (ภาษาไทย)" required />
        <Field name="nameEn" label="ชื่อสมาคม (English)" />
        <Field
          name="slug"
          label="URL slug (อังกฤษ ตัวเล็ก)"
          hint="ใช้ทำ URL: jungdee.growgenius.co.th/t/{slug}"
          required
          pattern="[a-z0-9][a-z0-9-]*[a-z0-9]"
          minlength="3"
          maxlength="32"
        />
        <hr class="border-slate-200" />
        <Field name="contactName" label="ชื่อผู้ติดต่อ/ผู้ดูแล" required />
        <Field name="contactEmail" label="อีเมล" type="email" required />
        <Field name="contactPhone" label="เบอร์โทรศัพท์" required />
        <Field
          name="password"
          label="รหัสผ่าน"
          type="password"
          hint="อย่างน้อย 8 ตัวอักษร"
          minlength="8"
          required
        />

        <div id="msg" class="text-sm" />
        <button
          type="submit"
          class="w-full rounded-lg bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
        >
          ส่งใบสมัคร
        </button>
      </form>

      <script
        dangerouslySetInnerHTML={{
          __html: `
document.getElementById('f').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const data = Object.fromEntries(fd.entries());
  if (!data.nameEn) delete data.nameEn;
  const msg = document.getElementById('msg');
  msg.textContent = 'กำลังส่ง...';
  msg.className = 'text-sm text-slate-500';
  try {
    const r = await fetch('/api/tenants/signup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data),
    });
    const j = await r.json();
    if (r.ok) {
      msg.textContent = j.message || 'ส่งสำเร็จ';
      msg.className = 'rounded-md bg-green-50 p-3 text-sm text-green-700';
      e.target.querySelector('button').disabled = true;
    } else {
      const errMap = {
        slug_taken: 'slug นี้ถูกใช้แล้ว กรุณาเปลี่ยน',
        email_taken: 'อีเมลนี้ถูกใช้แล้ว',
      };
      msg.textContent = errMap[j.error] || ('ผิดพลาด: ' + (j.error || 'ลองใหม่'));
      msg.className = 'rounded-md bg-red-50 p-3 text-sm text-red-700';
    }
  } catch (err) {
    msg.textContent = 'เครือข่ายผิดพลาด';
    msg.className = 'rounded-md bg-red-50 p-3 text-sm text-red-700';
  }
});
`,
        }}
      />
    </main>
  </Layout>
);

type FieldProps = {
  name: string;
  label: string;
  type?: string;
  hint?: string;
  required?: boolean;
  pattern?: string;
  minlength?: number | string;
  maxlength?: number | string;
};

function Field({ name, label, type = 'text', hint, required, pattern, minlength, maxlength }: FieldProps) {
  return (
    <label class="block">
      <span class="text-sm font-medium text-slate-700">
        {label} {required && <span class="text-accent-500">*</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        pattern={pattern}
        minlength={minlength as any}
        maxlength={maxlength as any}
        class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      />
      {hint && <span class="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}
