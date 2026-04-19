import type { Context } from 'hono';
import { eq } from 'drizzle-orm';
import { db, certificates } from '@beefasso/db';
import type { CertificateSnapshot } from '@beefasso/shared';
import { Layout } from './layout.tsx';

export const renderVerify = async (c: Context) => {
  const certNo = c.req.param('certNo') ?? '';
  const [cert] = await db
    .select({ certNo: certificates.certNo, issuedAt: certificates.issuedAt, snapshot: certificates.snapshot })
    .from(certificates)
    .where(eq(certificates.certNo, certNo));

  if (!cert) {
    return c.html(
      <Layout title={`ตรวจสอบ ${certNo}`}>
        <main class="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-12 text-center">
          <div class="text-6xl font-bold text-accent-500">✕</div>
          <h1 class="mt-4 text-2xl font-bold text-slate-900">ไม่พบใบรับรอง</h1>
          <p class="mt-2 text-slate-600">
            หมายเลข <code class="rounded bg-slate-100 px-2 py-0.5 font-mono text-sm">{certNo}</code>
            {' '}
            ไม่มีในระบบ Jungdee
          </p>
        </main>
      </Layout>,
      404,
    );
  }

  const s = cert.snapshot as CertificateSnapshot;
  return c.html(
    <Layout title={`${s.cattle.name ?? s.cattle.regNo} · Verified — Jungdee`}>
      <main class="mx-auto max-w-3xl px-6 py-10">
        <div class="flex items-center gap-3 rounded-full bg-green-50 px-4 py-2 text-sm text-green-700">
          <span class="flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white">✓</span>
          <span>
            <strong>Verified</strong> · ใบเพ็ดดีกรีถูกต้อง บันทึกในระบบเมื่อ{' '}
            {new Date(cert.issuedAt).toLocaleDateString('th-TH')}
          </span>
        </div>

        <section class="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wider text-accent-500">ออกโดย</p>
              <h2 class="mt-1 text-xl font-bold text-slate-900">{s.tenant.nameTh}</h2>
              {s.tenant.nameEn && <p class="text-sm text-slate-500">{s.tenant.nameEn}</p>}
            </div>
            <div class="text-right">
              <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">Certificate No.</p>
              <p class="mt-1 font-mono text-lg text-primary-700">{cert.certNo}</p>
            </div>
          </div>

          <hr class="my-6 border-slate-200" />

          <h3 class="text-sm font-semibold uppercase tracking-wider text-primary-600">ข้อมูลโค</h3>
          <h1 class="mt-1 text-3xl font-bold text-slate-900">{s.cattle.name ?? s.cattle.earTag}</h1>
          <dl class="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            <Info label="Reg. No." value={s.cattle.regNo} mono />
            <Info label="Ear Tag" value={s.cattle.earTag} mono />
            <Info label="Breed" value={s.cattle.breed ?? '—'} />
            <Info label="Sex" value={s.cattle.sex === 'male' ? 'เพศผู้ ♂' : 'เพศเมีย ♀'} />
            <Info label="Date of Birth" value={s.cattle.dob ?? '—'} />
            <Info label="Color" value={s.cattle.color ?? '—'} />
          </dl>
          {s.owner && (
            <>
              <h3 class="mt-8 text-sm font-semibold uppercase tracking-wider text-primary-600">Owner</h3>
              <p class="mt-2 text-slate-900">
                {s.owner.fullName} · <span class="font-mono text-sm text-slate-500">#{s.owner.memberNo}</span>
              </p>
            </>
          )}
        </section>

        <section class="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h3 class="text-sm font-semibold uppercase tracking-wider text-primary-600">Pedigree — พันธุ์ประวัติ 3 ชั้น</h3>
          <div class="mt-6 grid grid-cols-3 gap-3">
            <PedigreeCol label="Generation 1" entries={[
              { pos: 'S', title: 'Sire · พ่อ' },
              { pos: 'D', title: 'Dam · แม่' },
            ]} ped={s.pedigree} />
            <PedigreeCol label="Generation 2" entries={[
              { pos: 'SS', title: 'ปู่ (S-side)' },
              { pos: 'SD', title: 'ย่า (S-side)' },
              { pos: 'DS', title: 'ตา (D-side)' },
              { pos: 'DD', title: 'ยาย (D-side)' },
            ]} ped={s.pedigree} />
            <PedigreeCol label="Generation 3" entries={[
              { pos: 'SSS', title: '' },
              { pos: 'SSD', title: '' },
              { pos: 'SDS', title: '' },
              { pos: 'SDD', title: '' },
              { pos: 'DSS', title: '' },
              { pos: 'DSD', title: '' },
              { pos: 'DDS', title: '' },
              { pos: 'DDD', title: '' },
            ]} ped={s.pedigree} compact />
          </div>
        </section>

        <section class="mt-6 flex flex-wrap gap-3">
          <a
            href={`/api/verify/${cert.certNo}/pdf`}
            target="_blank"
            rel="noreferrer"
            class="rounded-lg bg-primary-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
          >
            ดาวน์โหลด PDF
          </a>
          <a href="/" class="rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:border-primary-500 hover:text-primary-600">
            ไปหน้าแรก
          </a>
        </section>

        <footer class="mt-12 text-center text-xs text-slate-500">
          ยืนยันโดย Jungdee · jungdee.growgenius.co.th
        </footer>
      </main>
    </Layout>,
  );
};

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt class="text-xs uppercase tracking-wider text-slate-500">{label}</dt>
      <dd class={`mt-0.5 text-sm text-slate-900 ${mono ? 'font-mono' : ''}`}>{value}</dd>
    </div>
  );
}

function PedigreeCol({
  label,
  entries,
  ped,
  compact,
}: {
  label: string;
  entries: { pos: string; title: string }[];
  ped: CertificateSnapshot['pedigree'];
  compact?: boolean;
}) {
  return (
    <div>
      <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <div class="flex flex-col gap-2">
        {entries.map(({ pos, title }) => {
          const n = ped[pos];
          const male = pos.endsWith('S');
          const bar = male ? 'border-l-primary-500' : 'border-l-accent-500';
          if (!n || !n.regNo) {
            return (
              <div class={`rounded-md border border-dashed border-slate-300 bg-slate-50 border-l-4 ${bar} px-3 ${compact ? 'py-1' : 'py-2'}`}>
                <p class={`${compact ? 'text-[10px]' : 'text-xs'} text-slate-400`}>—</p>
              </div>
            );
          }
          return (
            <div class={`rounded-md border border-slate-200 bg-white border-l-4 ${bar} px-3 ${compact ? 'py-1' : 'py-2'}`}>
              {title && !compact && <p class="text-[10px] uppercase tracking-wider text-slate-400">{title}</p>}
              <p class={`font-mono ${compact ? 'text-[10px]' : 'text-xs'} text-primary-700`}>{n.regNo}</p>
              {n.name && <p class={`${compact ? 'text-xs' : 'text-sm'} font-medium text-slate-900`}>{n.name}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
