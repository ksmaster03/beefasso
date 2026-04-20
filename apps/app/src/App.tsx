import { Routes, Route, Link, useLocation } from 'react-router';
import { MembersPage } from '@/pages/Members.tsx';
import { MemberCreatePage, MemberEditPage } from '@/pages/MemberForm.tsx';
import { CattlePage } from '@/pages/Cattle.tsx';
import { CattleCreatePage } from '@/pages/CattleForm.tsx';
import { CattleDetailPage } from '@/pages/CattleDetail.tsx';
import { DashboardPage } from '@/pages/Dashboard.tsx';
import { FeesPage } from '@/pages/Fees.tsx';
import { PaymentsPage } from '@/pages/Payments.tsx';
import { PaymentDetailPage } from '@/pages/PaymentDetail.tsx';
import { SettingsPage } from '@/pages/Settings.tsx';
import { MobileShell } from '@/components/MobileShell.tsx';

export function App({ tenantSlug, tenantName }: { tenantSlug: string; tenantName: string }) {
  return (
    <MobileShell
      accent="primary"
      brand={<BrandCompact tenantName={tenantName} />}
      sidebar={<Sidebar tenantSlug={tenantSlug} tenantName={tenantName} />}
    >
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <Routes>
          <Route path="/" element={<TenantHome slug={tenantSlug} name={tenantName} />} />
          <Route path="/app" element={<DashboardPage />} />
          <Route path="/app/members" element={<MembersPage />} />
          <Route path="/app/members/new" element={<MemberCreatePage />} />
          <Route path="/app/members/:id" element={<MemberEditPage />} />
          <Route path="/app/cattle" element={<CattlePage />} />
          <Route path="/app/cattle/new" element={<CattleCreatePage />} />
          <Route path="/app/cattle/:id" element={<CattleDetailPage />} />
          <Route path="/app/fees" element={<FeesPage />} />
          <Route path="/app/payments" element={<PaymentsPage />} />
          <Route path="/app/payments/:id" element={<PaymentDetailPage />} />
          <Route path="/app/settings" element={<SettingsPage />} />
          <Route path="*" element={<TenantHome slug={tenantSlug} name={tenantName} />} />
        </Routes>
      </div>
    </MobileShell>
  );
}

function BrandCompact({ tenantName }: { tenantName: string }) {
  return (
    <Link to="/" className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-600 text-sm font-bold text-white">J</div>
      <div>
        <div className="text-sm font-semibold leading-tight text-slate-900">Jungdee</div>
        <div className="truncate text-xs text-slate-500">{tenantName}</div>
      </div>
    </Link>
  );
}

function TenantHome({ slug, name }: { slug: string; name: string }) {
  return (
    <div>
      <p className="text-sm font-medium uppercase tracking-wider text-primary-600">สมาคม</p>
      <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">{name}</h1>
      <p className="mt-1 font-mono text-sm text-slate-500">/{slug}</p>
      <p className="mt-4 text-slate-600">หน้าแรกของสมาคม — เข้าสู่ระบบเพื่อจัดการ</p>
      <div className="mt-4 h-1 w-16 rounded bg-accent-500" />
      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/app" className="inline-flex items-center rounded-lg bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-700">
          ไปที่ dashboard
        </Link>
        <a href="/login" className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:border-primary-500 hover:text-primary-600">
          เข้าสู่ระบบ
        </a>
      </div>
    </div>
  );
}

function Sidebar({ tenantSlug, tenantName }: { tenantSlug: string; tenantName: string }) {
  const { pathname } = useLocation();
  const isAppSection = pathname.startsWith('/app');
  if (!isAppSection) return (
    <div className="p-6">
      <BrandCompact tenantName={tenantName} />
      <p className="mt-6 text-xs text-slate-500">เข้าระบบเพื่อใช้เมนู</p>
    </div>
  );
  return (
    <div className="p-6">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-600 text-sm font-bold text-white">J</div>
        <div>
          <div className="text-sm font-semibold leading-tight text-slate-900">{tenantName}</div>
          <div className="font-mono text-xs text-slate-500">{tenantSlug}</div>
        </div>
      </div>
      <nav className="mt-8 flex flex-col gap-1 text-sm">
        <NavItem to="/app" label="ภาพรวม" />
        <NavItem to="/app/members" label="สมาชิก" />
        <NavItem to="/app/cattle" label="ทะเบียนโค" />
        <NavItem to="/app/payments" label="การชำระเงิน" />
        <NavItem to="/app/fees" label="ค่าธรรมเนียม" />
        <NavItem to="/app/settings" label="ตั้งค่า" />
      </nav>
    </div>
  );
}

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="rounded-md px-3 py-2 text-slate-700 transition hover:bg-primary-50 hover:text-primary-700">
      {label}
    </Link>
  );
}
