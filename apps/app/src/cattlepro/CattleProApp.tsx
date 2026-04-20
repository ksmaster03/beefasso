import { Routes, Route, Link, NavLink } from 'react-router';
import { Overview } from './pages/Overview.tsx';
import { Herd } from './pages/Herd.tsx';
import { Health } from './pages/Health.tsx';
import { Feed } from './pages/Feed.tsx';
import { Milk } from './pages/Milk.tsx';
import { Breeding } from './pages/Breeding.tsx';
import { Finance } from './pages/Finance.tsx';
import { Reports } from './pages/Reports.tsx';
import { cn } from '@/lib/ui.ts';

export function CattleProApp({ farmSlug, farmName }: { farmSlug: string; farmName: string }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar farmSlug={farmSlug} farmName={farmName} />
      <main className="flex-1 overflow-hidden">
        <div className="mx-auto max-w-6xl px-8 py-8">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/herd" element={<Herd />} />
            <Route path="/health" element={<Health />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/milk" element={<Milk />} />
            <Route path="/breeding" element={<Breeding />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="*" element={<Overview />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

type NavItem = { to: string; label: string; group: string };
const NAV: NavItem[] = [
  { group: 'หลัก', to: '/', label: 'ภาพรวม' },
  { group: 'หลัก', to: '/herd', label: 'จัดการฝูงวัว' },
  { group: 'หลัก', to: '/health', label: 'สุขภาพ & วัคซีน' },
  { group: 'หลัก', to: '/feed', label: 'อาหาร & โภชนาการ' },
  { group: 'การผลิต', to: '/milk', label: 'ผลผลิตนม' },
  { group: 'การผลิต', to: '/breeding', label: 'การผสมพันธุ์' },
  { group: 'การเงิน', to: '/finance', label: 'การเงิน' },
  { group: 'การเงิน', to: '/reports', label: 'รายงาน' },
];

function Sidebar({ farmSlug, farmName }: { farmSlug: string; farmName: string }) {
  const groups = Array.from(new Set(NAV.map((n) => n.group)));
  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-5">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent-600 text-sm font-bold text-white">
            C
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight text-slate-900">
              Cattle <span className="text-accent-600">Pro</span>
            </div>
            <div className="text-xs text-slate-500">{farmName}</div>
            <div className="mt-0.5 font-mono text-[10px] text-slate-400">{farmSlug}</div>
          </div>
        </Link>
      </div>
      <nav className="p-3">
        {groups.map((g) => (
          <div key={g} className="mb-4">
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{g}</p>
            {NAV.filter((n) => n.group === g).map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'block rounded-md px-3 py-2 text-sm transition',
                    isActive
                      ? 'bg-accent-50 font-medium text-accent-700'
                      : 'text-slate-700 hover:bg-slate-50',
                  )
                }
              >
                {n.label}
              </NavLink>
            ))}
          </div>
        ))}
        <button
          type="button"
          onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
            location.href = '/';
          }}
          className="mt-4 w-full rounded-md border border-slate-200 px-3 py-2 text-left text-xs text-slate-500 hover:border-accent-300 hover:text-accent-600"
        >
          ออกจากระบบ
        </button>
      </nav>
    </aside>
  );
}
