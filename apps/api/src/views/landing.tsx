import { Layout } from './layout.tsx';

export const renderPlatformLanding = () => (
  <Layout title="Jungdee — ระบบบริหารสมาคมเลี้ยงวัว">
    <main class="mx-auto max-w-5xl px-6 py-16">
      <header class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 text-white font-bold">
          J
        </div>
        <span class="text-xl font-semibold tracking-tight text-slate-900">Jungdee</span>
      </header>

      <section class="mt-16">
        <p class="text-sm font-medium uppercase tracking-wider text-accent-500">
          ระบบบริหารสมาคมเลี้ยงวัว
        </p>
        <h1 class="mt-3 text-5xl font-bold tracking-tight text-slate-900">
          จุงดี — ครบวงจรในที่เดียว
        </h1>
        <p class="mt-4 max-w-2xl text-lg text-slate-600">
          สมาชิก ทะเบียนโค ใบเพ็ดดีกรี ชำระเงิน ประกวด — เปิดให้สมาคมทั่วประเทศสมัครใช้งาน
        </p>
        <div class="mt-8 flex flex-wrap gap-3">
          <a
            href="/signup"
            class="inline-flex items-center rounded-lg bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
          >
            สมัครสมาคมใช้งาน
          </a>
          <a
            href="/login"
            class="inline-flex items-center rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-primary-500 hover:text-primary-600"
          >
            เข้าสู่ระบบ
          </a>
        </div>
      </section>

      <section class="mt-20 grid gap-4 sm:grid-cols-3">
        <Feature title="จัดการสมาชิก" desc="สมัคร ต่ออายุ บัตรสมาชิก QR ดิจิทัล" />
        <Feature title="ทะเบียนโค" desc="เบอร์หู สายพันธุ์ พ่อ-แม่พันธุ์ รูป DNA" />
        <Feature title="ใบเพ็ดดีกรี" desc="ออกใบรับรองสมาคม PDF พร้อม QR verify" />
      </section>

      <footer class="mt-24 border-t border-slate-200 pt-6 text-xs text-slate-500">
        v0.0.1 — MVP · Jungdee by growgenius
      </footer>
    </main>
  </Layout>
);

const Feature = ({ title, desc }: { title: string; desc: string }) => (
  <div class="rounded-xl border border-slate-200 bg-white p-6">
    <h3 class="text-base font-semibold text-slate-900">{title}</h3>
    <p class="mt-1 text-sm text-slate-600">{desc}</p>
  </div>
);
