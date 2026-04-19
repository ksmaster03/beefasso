import type { Context } from 'hono';
import { Layout } from './layout.tsx';

// Placeholder — will query DB by cert_no once cert module lands.
export const renderVerify = async (c: Context) => {
  const certNo = c.req.param('certNo');
  return c.html(
    <Layout title={`ตรวจสอบใบเพ็ดดีกรี ${certNo}`}>
      <main class="mx-auto max-w-2xl px-6 py-16">
        <p class="text-sm font-medium uppercase tracking-wider text-primary-600">
          ตรวจสอบใบเพ็ดดีกรี
        </p>
        <h1 class="mt-2 text-3xl font-bold text-slate-900">เลขที่ {certNo}</h1>
        <div class="mt-6 rounded-lg border border-slate-200 bg-white p-6">
          <p class="text-slate-600">หน้าตรวจสอบสาธารณะ — ยังไม่ต่อกับฐานข้อมูล</p>
        </div>
      </main>
    </Layout>,
  );
};
