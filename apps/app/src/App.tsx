import { Routes, Route, Link } from 'react-router';
import { MembersPage } from '@/pages/Members.tsx';
import { CattlePage } from '@/pages/Cattle.tsx';
import { DashboardPage } from '@/pages/Dashboard.tsx';

export function App({ tenantSlug }: { tenantSlug: string }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar tenantSlug={tenantSlug} />
      <main className="flex-1 p-8">
        <Routes>
          <Route path="/app" element={<DashboardPage />} />
          <Route path="/app/members" element={<MembersPage />} />
          <Route path="/app/cattle" element={<CattlePage />} />
          <Route path="*" element={<DashboardPage />} />
        </Routes>
      </main>
    </div>
  );
}

function Sidebar({ tenantSlug }: { tenantSlug: string }) {
  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white p-6">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-600 text-sm font-bold text-white">
          J
        </div>
        <div>
          <div className="text-sm font-semibold leading-tight text-slate-900">Jungdee</div>
          <div className="text-xs text-slate-500">{tenantSlug}</div>
        </div>
      </div>
      <nav className="mt-8 flex flex-col gap-1 text-sm">
        <NavItem to="/app" label="ภาพรวม" />
        <NavItem to="/app/members" label="สมาชิก" />
        <NavItem to="/app/cattle" label="ทะเบียนโค" />
      </nav>
    </aside>
  );
}

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="rounded-md px-3 py-2 text-slate-700 transition hover:bg-primary-50 hover:text-primary-700"
    >
      {label}
    </Link>
  );
}
