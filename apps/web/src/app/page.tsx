import { headers } from 'next/headers';

export default async function Page() {
  const h = await headers();
  const kind = h.get('x-tenant-kind') ?? 'platform';
  const slug = h.get('x-tenant-slug');

  if (kind === 'tenant' && slug) {
    return <TenantHome slug={slug} />;
  }

  return <PlatformLanding />;
}

function PlatformLanding() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 text-white font-bold">
          J
        </div>
        <span className="text-xl font-semibold tracking-tight text-slate-900">Jungdee</span>
      </header>

      <section className="mt-16">
        <p className="text-sm font-medium uppercase tracking-wider text-accent-500">
          ระบบบริหารสมาคมเลี้ยงวัว
        </p>
        <h1 className="mt-3 text-5xl font-bold tracking-tight text-slate-900">
          จุงดี — ครบวงจรในที่เดียว
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600">
          สมาชิก ทะเบียนโค ใบเพ็ดดีกรี ชำระเงิน ประกวด — เปิดให้สมาคมทั่วประเทศสมัครใช้งาน
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="/signup"
            className="inline-flex items-center rounded-lg bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
          >
            สมัครสมาคมใช้งาน
          </a>
          <a
            href="/login"
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-primary-500 hover:text-primary-600"
          >
            เข้าสู่ระบบ
          </a>
        </div>
      </section>

      <section className="mt-20 grid gap-4 sm:grid-cols-3">
        {[
          { title: 'จัดการสมาชิก', desc: 'สมัคร ต่ออายุ บัตรสมาชิก QR ดิจิทัล' },
          { title: 'ทะเบียนโค', desc: 'เบอร์หู สายพันธุ์ พ่อ-แม่พันธุ์ รูป DNA' },
          { title: 'ใบเพ็ดดีกรี', desc: 'ออกใบรับรองสมาคม PDF พร้อม QR verify' },
        ].map((f) => (
          <div key={f.title} className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="text-base font-semibold text-slate-900">{f.title}</h3>
            <p className="mt-1 text-sm text-slate-600">{f.desc}</p>
          </div>
        ))}
      </section>

      <footer className="mt-24 border-t border-slate-200 pt-6 text-xs text-slate-500">
        v0.0.1 — MVP · Jungdee by growgenius
      </footer>
    </main>
  );
}

function TenantHome({ slug }: { slug: string }) {
  return (
    <main className="mx-auto max-w-4xl px-6 py-20">
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wider text-primary-600">สมาคม</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">{slug}</h1>
        <p className="mt-2 text-slate-600">หน้าแรกของสมาคม {slug} (placeholder) — ระบบกำลังพัฒนา</p>
        <div className="mt-6 h-1 w-16 rounded bg-accent-500" />
      </div>
    </main>
  );
}
