import { Layout } from './layout.tsx';

export const renderPlatformLanding = () => (
  <Layout title="Jungdee — ระบบบริหารสมาคมเลี้ยงวัว">
    <Nav />
    <Hero />
    <Features />
    <Gallery />
    <CTA />
    <Footer />
  </Layout>
);

const Nav = () => (
  <header class="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
    <div class="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
      <a href="/" class="flex items-center">
        <img src="/logos/jungdee.png" alt="JungDee" class="h-20 w-auto sm:h-24" />
      </a>
      <nav class="flex items-center gap-2 text-sm sm:gap-5">
        <a href="#features" class="hidden text-slate-600 hover:text-primary-600 sm:inline">ฟีเจอร์</a>
        <a href="https://cattlepro.growgenius.co.th" class="hidden items-center gap-1.5 rounded-md border border-accent-200 bg-accent-50 px-3 py-1.5 text-xs font-semibold text-accent-700 hover:border-accent-500 sm:inline-flex">
          <span class="h-1.5 w-1.5 rounded-full bg-accent-500" /> สำหรับเจ้าของฟาร์ม: Cattle Pro →
        </a>
        <a href="/login" class="rounded-md border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:border-primary-500 hover:text-primary-600">
          เข้าสู่ระบบ
        </a>
        <a href="/signup" class="hidden rounded-md bg-primary-600 px-4 py-1.5 font-semibold text-white hover:bg-primary-700 sm:inline-block">
          สมัครใช้งาน
        </a>
      </nav>
    </div>
  </header>
);

const HERO_SLIDES = [
  '/photos/hero-black.webp',
  '/photos/hero.jpg',
  '/photos/hero-2.jpg',
  '/photos/pedigree.jpg',
  '/photos/gallery-5.jpg',
  '/photos/contest.jpg',
];

const Hero = () => (
  <section class="relative overflow-hidden">
    <style
      dangerouslySetInnerHTML={{
        __html: `
@keyframes jd-hero-fade {
  0%, 14%   { opacity: 1; transform: scale(1.02); }
  17%, 97%  { opacity: 0; }
  100%      { opacity: 0; transform: scale(1.05); }
}
.jd-hero-slide {
  animation: jd-hero-fade ${HERO_SLIDES.length * 9}s ease-in-out infinite;
  opacity: 0;
}
${HERO_SLIDES.map(
  (_, i) => `.jd-hero-slide:nth-child(${i + 1}) { animation-delay: ${i * 9}s; }`,
).join('\n')}
.jd-dot.active { background: #1d4ed8; width: 24px; }
`,
      }}
    />

    <div class="absolute inset-0">
      {HERO_SLIDES.map((src) => (
        <img
          src={src}
          alt=""
          loading="lazy"
          class="jd-hero-slide absolute inset-0 h-full w-full object-cover object-center"
        />
      ))}
      <div class="absolute inset-0 bg-gradient-to-r from-white/95 via-white/70 to-white/30" />
    </div>

    <div class="absolute bottom-4 right-4 z-10 flex gap-1.5">
      {HERO_SLIDES.map((_, i) => (
        <button
          type="button"
          data-hero-dot={i}
          aria-label={`สไลด์ ${i + 1}`}
          class="jd-dot h-1.5 w-1.5 rounded-full bg-slate-300 transition-all duration-300"
        />
      ))}
    </div>

    <script
      dangerouslySetInnerHTML={{
        __html: `
(function(){
  const TOTAL = ${HERO_SLIDES.length};
  const SEG = 9000;
  const dots = document.querySelectorAll('[data-hero-dot]');
  const tick = () => {
    const idx = Math.floor((Date.now() / SEG) % TOTAL);
    dots.forEach((d, i) => d.classList.toggle('active', i === idx));
  };
  tick();
  setInterval(tick, 500);
})();
`,
      }}
    />

    <div class="relative mx-auto grid max-w-6xl gap-10 px-6 py-20 sm:py-28">
      <div class="max-w-2xl">
        <p class="inline-flex items-center gap-2 rounded-full bg-accent-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent-600">
          <span class="h-1.5 w-1.5 rounded-full bg-accent-500" />
          ระบบบริหารสมาคมเลี้ยงวัวครบวงจร
        </p>
        <h1 class="mt-6 text-5xl font-bold leading-tight tracking-tight text-slate-900 sm:text-6xl">
          จุงดี — สมาคมโคของท่าน
          <span class="block text-primary-600">จัดการง่ายในที่เดียว</span>
        </h1>
        <p class="mt-5 max-w-xl text-lg text-slate-700">
          ระบบทะเบียนสมาชิก ใบประวัติโค พ่อแม่พันธุ์ ใบเพ็ดดีกรีออนไลน์ ชำระเงิน PromptPay
          และการประกวด — เปิดให้สมาคมทั่วประเทศสมัครเข้าใช้งาน
        </p>
        <div class="mt-8 flex flex-wrap gap-3">
          <a
            href="/signup"
            class="inline-flex items-center rounded-lg bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-600/20 transition hover:bg-primary-700"
          >
            สมัครสมาคมใช้งาน
          </a>
          <a
            href="#features"
            class="inline-flex items-center rounded-lg border border-slate-300 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-700 hover:border-primary-500 hover:text-primary-600"
          >
            ดูฟีเจอร์ →
          </a>
        </div>
        <dl class="mt-12 grid grid-cols-3 gap-6 border-t border-slate-200 pt-6 text-sm">
          <Stat value="10K+" label="สมาชิก/องค์กร" />
          <Stat value="4 generations" label="สายพันธุ์ประวัติ" />
          <Stat value="QR Verify" label="ใบเพ็ดดีกรี" />
        </dl>
      </div>
    </div>
  </section>
);

const Stat = ({ value, label }: { value: string; label: string }) => (
  <div>
    <dt class="text-xs uppercase tracking-wider text-slate-500">{label}</dt>
    <dd class="mt-1 text-xl font-bold text-slate-900">{value}</dd>
  </div>
);

const Features = () => (
  <section id="features" class="bg-slate-50 py-20">
    <div class="mx-auto max-w-6xl px-6">
      <div class="max-w-2xl">
        <p class="text-sm font-semibold uppercase tracking-wider text-primary-600">ฟีเจอร์หลัก</p>
        <h2 class="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
          ครอบคลุมทุกงานของสมาคม
        </h2>
        <p class="mt-3 text-slate-600">
          ออกแบบสำหรับสมาคมโคไทยโดยเฉพาะ — รองรับทะเบียนพันธุ์ประวัติเต็มรูปแบบ
        </p>
      </div>
      <div class="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Feature
          photo="/photos/registry.jpg"
          title="ทะเบียนสมาชิก"
          desc="สมัคร ต่ออายุ บัตรสมาชิก QR ดิจิทัล ประเภทรายปี ตลอดชีพ กิตติมศักดิ์"
        />
        <Feature
          photo="/photos/hero-2.jpg"
          title="ทะเบียนโค"
          desc="เบอร์หู สายพันธุ์ พ่อแม่พันธุ์ น้ำหนัก DNA รูปหลายมุม ประวัติเจ้าของ"
        />
        <Feature
          photo="/photos/pedigree.jpg"
          title="ใบเพ็ดดีกรี"
          desc="ออกใบรับรองสมาคม PDF พร้อม QR verify สาธารณะ 4 generations"
        />
        <Feature
          photo="/photos/certificate.webp"
          title="ชำระเงิน PromptPay"
          desc="สร้าง QR อัตโนมัติ อัปโหลดสลิป ตรวจสอบและออกใบเสร็จ"
        />
        <Feature
          photo="/photos/contest.jpg"
          title="ประกวดโค"
          desc="สร้างการประกวด จัด class สมัครประกวด บันทึกคะแนน ประกาศผล"
        />
        <Feature
          photo="/photos/gallery-1.webp"
          title="Multi-tenant SaaS"
          desc="แต่ละสมาคมมี URL เฉพาะของตัวเอง แบ่งข้อมูลแยกขาดด้วย Row-Level Security"
        />
      </div>
    </div>
  </section>
);

const Feature = ({ photo, title, desc }: { photo: string; title: string; desc: string }) => (
  <div class="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:shadow-md">
    <div class="aspect-[4/3] overflow-hidden">
      <img
        src={photo}
        alt=""
        class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
      />
    </div>
    <div class="p-5">
      <h3 class="text-base font-semibold text-slate-900">{title}</h3>
      <p class="mt-1 text-sm text-slate-600">{desc}</p>
    </div>
  </div>
);

const Gallery = () => (
  <section id="gallery" class="py-20">
    <div class="mx-auto max-w-6xl px-6">
      <div class="mb-10 flex items-end justify-between">
        <div>
          <p class="text-sm font-semibold uppercase tracking-wider text-primary-600">แกลเลอรี</p>
          <h2 class="mt-2 text-3xl font-bold text-slate-900">โคพันธุ์คุณภาพจากสมาคมเครือข่าย</h2>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {['gallery-1.webp', 'gallery-2.webp', 'gallery-3.jpg', 'gallery-4.jpg', 'gallery-5.jpg', 'gallery-6.jpg'].map(
          (f) => (
            <div class="aspect-square overflow-hidden rounded-xl">
              <img
                src={`/photos/${f}`}
                alt=""
                class="h-full w-full object-cover transition duration-500 hover:scale-110"
              />
            </div>
          ),
        )}
      </div>
    </div>
  </section>
);

const CTA = () => (
  <section class="relative overflow-hidden bg-primary-700 py-16">
    <div class="absolute inset-0 opacity-20">
      <img src="/photos/hero-2.jpg" alt="" class="h-full w-full object-cover" />
    </div>
    <div class="relative mx-auto max-w-4xl px-6 text-center">
      <h2 class="text-3xl font-bold text-white sm:text-4xl">พร้อมให้องค์กรของท่านเริ่มใช้งาน</h2>
      <p class="mt-3 text-lg text-primary-100">
        สมัครภายใน 5 นาที ได้ URL เฉพาะองค์กร อนุมัติโดยทีมงาน 1-2 วันทำการ
      </p>
      <div class="mt-8 flex flex-wrap justify-center gap-3">
        <a
          href="/signup"
          class="inline-flex items-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-primary-700 shadow hover:bg-primary-50"
        >
          สมัครใช้งาน
        </a>
        <a
          href="/login"
          class="inline-flex items-center rounded-lg border border-white/30 bg-transparent px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
        >
          เข้าสู่ระบบ
        </a>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer class="border-t border-slate-200 bg-white py-8">
    <div class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 text-xs text-slate-500 sm:flex-row">
      <div class="flex items-center gap-3">
        <img src="/logos/jungdee.png" alt="JungDee" class="h-16 w-auto opacity-80" />
        <span>v0.0.1 · by growgenius</span>
      </div>
      <div class="flex flex-wrap items-center gap-4">
        <a href="https://cattlepro.growgenius.co.th" class="font-medium text-accent-600 hover:text-accent-700">Cattle Pro →</a>
        <a href="/feedback" class="hover:text-primary-600">ส่งความคิดเห็น</a>
        <span>© 2026 Jungdee</span>
      </div>
    </div>
  </footer>
);
