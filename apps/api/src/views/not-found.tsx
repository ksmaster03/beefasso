import { Layout } from './layout.tsx';

export const renderTenantNotFound = (slug: string) => (
  <Layout title={`ไม่พบสมาคม ${slug} — Jungdee`}>
    <main class="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12 text-center">
      <div class="text-6xl font-bold text-accent-500">404</div>
      <h1 class="mt-4 text-2xl font-bold text-slate-900">ไม่พบสมาคม</h1>
      <p class="mt-2 text-slate-600">
        สมาคม <code class="rounded bg-slate-100 px-2 py-0.5 font-mono text-sm">{slug}</code> ไม่มีอยู่
        หรือยังไม่ได้รับอนุมัติ
      </p>
      <a
        href="/"
        class="mt-8 inline-flex items-center justify-center rounded-lg bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-700 self-center"
      >
        กลับหน้าแรก
      </a>
    </main>
  </Layout>
);
