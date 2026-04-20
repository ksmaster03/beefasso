import { Layout } from './layout.tsx';

const SLIDES = [
  '/photos/hero-black.webp',
  '/photos/gallery-1.webp',
  '/photos/pedigree.jpg',
  '/photos/gallery-5.jpg',
  '/photos/hero.jpg',
];

export const renderCattleProLanding = () => (
  <Layout title="Cattle Pro — ระบบบริหารจัดการฟาร์มวัวครบวงจร">
    <Nav />
    <Hero />
    <Modules />
    <Benefits />
    <CTA />
    <Footer />
  </Layout>
);

const Nav = () => (
  <header class="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
    <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
      <a href="/" class="flex items-center gap-2">
        <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-600 font-bold text-white">C</div>
        <span class="text-lg font-semibold tracking-tight text-slate-900">
          Cattle <span class="text-accent-600">Pro</span>
        </span>
      </a>
      <nav class="hidden items-center gap-6 text-sm sm:flex">
        <a href="#modules" class="text-slate-600 hover:text-accent-600">โมดูล</a>
        <a href="#benefits" class="text-slate-600 hover:text-accent-600">ทำไมต้องใช้</a>
        <a
          href="/login"
          class="rounded-md border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:border-accent-500 hover:text-accent-600"
        >
          เข้าสู่ระบบ
        </a>
        <a
          href="/signup"
          class="rounded-md bg-accent-600 px-4 py-1.5 font-semibold text-white hover:bg-accent-700"
        >
          เริ่มใช้งานฟรี
        </a>
      </nav>
    </div>
  </header>
);

const Hero = () => (
  <section class="relative overflow-hidden">
    <style
      dangerouslySetInnerHTML={{
        __html: `
@keyframes cp-hero-fade {
  0%, 14% { opacity: 1; transform: scale(1.02); }
  17%, 97% { opacity: 0; }
  100% { opacity: 0; transform: scale(1.05); }
}
.cp-hero-slide { animation: cp-hero-fade ${SLIDES.length * 9}s ease-in-out infinite; opacity: 0; }
${SLIDES.map((_, i) => `.cp-hero-slide:nth-child(${i + 1}) { animation-delay: ${i * 9}s; }`).join('\n')}
`,
      }}
    />
    <div class="absolute inset-0">
      {SLIDES.map((src) => (
        <img src={src} alt="" loading="lazy" class="cp-hero-slide absolute inset-0 h-full w-full object-cover object-center" />
      ))}
      <div class="absolute inset-0 bg-gradient-to-r from-white/95 via-white/75 to-white/30" />
    </div>
    <div class="relative mx-auto grid max-w-6xl gap-10 px-6 py-20 sm:py-28">
      <div class="max-w-2xl">
        <p class="inline-flex items-center gap-2 rounded-full bg-accent-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent-600">
          <span class="h-1.5 w-1.5 rounded-full bg-accent-500" />
          ระบบบริหารจัดการฟาร์มวัวครบวงจร
        </p>
        <h1 class="mt-6 text-5xl font-bold leading-tight tracking-tight text-slate-900 sm:text-6xl">
          Cattle <span class="text-accent-600">Pro</span>
          <span class="block text-primary-700">ฟาร์มวัวของคุณ</span>
          <span class="block">ในมือเดียว</span>
        </h1>
        <p class="mt-5 max-w-xl text-lg text-slate-700">
          ทะเบียนฝูง สุขภาพ วัคซีน อาหาร ผลผลิตนม การผสมพันธุ์ การเงิน และรายงาน —
          ครอบคลุมทุกงานที่ฟาร์มต้องทำในทุกวัน
        </p>
        <div class="mt-8 flex flex-wrap gap-3">
          <a
            href="/signup"
            class="inline-flex items-center rounded-lg bg-accent-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent-600/20 transition hover:bg-accent-700"
          >
            เริ่มใช้งานฟาร์มฟรี
          </a>
          <a
            href="#modules"
            class="inline-flex items-center rounded-lg border border-slate-300 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-700 hover:border-accent-500 hover:text-accent-600"
          >
            ดู 8 โมดูล →
          </a>
        </div>
      </div>
    </div>
  </section>
);

const MODULES = [
  { group: 'หลัก', key: 'dashboard',  title: 'ภาพรวม', desc: 'Dashboard สรุปข้อมูลสำคัญ + การแจ้งเตือนเร่งด่วน' },
  { group: 'หลัก', key: 'herd',       title: 'จัดการฝูงวัว', desc: 'ทะเบียนวัวทุกตัว แยกตามคอก สายพันธุ์ สถานะ' },
  { group: 'หลัก', key: 'health',     title: 'สุขภาพ & วัคซีน', desc: 'ติดตามการรักษา กำหนดวัคซีน ประวัติโรค' },
  { group: 'หลัก', key: 'feed',       title: 'อาหาร & โภชนาการ', desc: 'สต็อกอาหาร สูตรอาหาร ต้นทุน' },
  { group: 'การผลิต', key: 'milk',     title: 'ผลผลิตนม', desc: 'บันทึก วิเคราะห์ จัดอันดับวัวที่ให้นมสูงสุด' },
  { group: 'การผลิต', key: 'breeding', title: 'การผสมพันธุ์', desc: 'ติดตามการตั้งท้อง กำหนดคลอด อัตราผสมติด' },
  { group: 'การเงิน', key: 'finance', title: 'การเงิน', desc: 'รายได้ ค่าใช้จ่าย กำไรสุทธิ' },
  { group: 'การเงิน', key: 'reports', title: 'รายงาน', desc: 'Export PDF/Excel และวิเคราะห์ข้อมูลเชิงลึก' },
];

const Modules = () => (
  <section id="modules" class="bg-slate-50 py-20">
    <div class="mx-auto max-w-6xl px-6">
      <div class="max-w-2xl">
        <p class="text-sm font-semibold uppercase tracking-wider text-accent-600">8 โมดูลหลัก</p>
        <h2 class="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">ครอบคลุมทุกงานของฟาร์ม</h2>
        <p class="mt-3 text-slate-600">
          เริ่มต้นใช้งานจากภาพรวม แล้วคลิกเมนูด้านซ้ายสำรวจแต่ละส่วนได้เลย
        </p>
      </div>
      <div class="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {MODULES.map((m, i) => (
          <div class="rounded-2xl border border-slate-200 bg-white p-6 transition hover:shadow-md">
            <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-50 text-sm font-bold text-accent-600">
              {i + 1}
            </div>
            <p class="mt-3 text-xs font-semibold uppercase tracking-wider text-primary-600">{m.group}</p>
            <h3 class="mt-1 text-base font-semibold text-slate-900">{m.title}</h3>
            <p class="mt-1 text-sm text-slate-600">{m.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const Benefits = () => (
  <section id="benefits" class="py-20">
    <div class="mx-auto max-w-6xl px-6">
      <div class="grid gap-10 lg:grid-cols-3">
        <Benefit
          title="เริ่มใช้ได้ใน 5 นาที"
          desc="สมัครฟรี ได้ URL เฉพาะฟาร์ม ไม่ต้องติดตั้ง ไม่ต้องดูแลเซิร์ฟเวอร์"
        />
        <Benefit
          title="เชื่อมสมาคมได้"
          desc="โคในฟาร์มของคุณขึ้นทะเบียนต่อที่สมาคม (Jungdee) ได้ทันที ไม่ต้องกรอกใหม่"
        />
        <Benefit
          title="ตัดสินใจจากข้อมูลจริง"
          desc="รายงานรายวัน/รายเดือน/รายปี พร้อม export PDF + Excel ให้นักบัญชี"
        />
      </div>
    </div>
  </section>
);

const Benefit = ({ title, desc }: { title: string; desc: string }) => (
  <div>
    <div class="h-1 w-10 rounded bg-accent-500" />
    <h3 class="mt-3 text-xl font-bold text-slate-900">{title}</h3>
    <p class="mt-2 text-slate-600">{desc}</p>
  </div>
);

const CTA = () => (
  <section class="relative overflow-hidden bg-accent-700 py-16">
    <div class="absolute inset-0 opacity-20">
      <img src="/photos/hero-black.webp" alt="" class="h-full w-full object-cover" />
    </div>
    <div class="relative mx-auto max-w-4xl px-6 text-center">
      <h2 class="text-3xl font-bold text-white sm:text-4xl">พร้อมเริ่มต้นฟาร์มของคุณ</h2>
      <p class="mt-3 text-lg text-accent-50">สมัครฟรี · ไม่ต้องใช้บัตรเครดิต</p>
      <div class="mt-8 flex flex-wrap justify-center gap-3">
        <a
          href="/signup"
          class="inline-flex items-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-accent-700 shadow hover:bg-accent-50"
        >
          สมัครฟาร์ม
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
    <div class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 text-xs text-slate-500 sm:flex-row">
      <div>Cattle Pro v0.0.1 — MVP · by growgenius</div>
      <a href="https://jungdee.growgenius.co.th" class="hover:text-accent-600">
        → สำหรับสมาคม: Jungdee
      </a>
    </div>
  </footer>
);
