import { Routes, Route, Link, NavLink } from 'react-router';
import { Overview } from './pages/Overview.tsx';
import { Herd } from './pages/Herd.tsx';
import { Health } from './pages/Health.tsx';
import { Feed } from './pages/Feed.tsx';
import { Milk } from './pages/Milk.tsx';
import { Breeding } from './pages/Breeding.tsx';
import { Finance } from './pages/Finance.tsx';
import { Reports } from './pages/Reports.tsx';
import { MobileShell } from '@/components/MobileShell.tsx';
import { cn } from '@/lib/ui.ts';

type NavEntry = { to: string; label: string; group: string };
const NAV: NavEntry[] = [
  { group: 'หลัก', to: '/', label: 'ภาพรวม' },
  { group: 'หลัก', to: '/herd', label: 'จัดการฝูงวัว' },
  { group: 'หลัก', to: '/health', label: 'สุขภาพ & วัคซีน' },
  { group: 'หลัก', to: '/feed', label: 'อาหาร & โภชนาการ' },
  { group: 'การผลิต', to: '/milk', label: 'ผลผลิตนม' },
  { group: 'การผลิต', to: '/breeding', label: 'การผสมพันธุ์' },
  { group: 'การเงิน', to: '/finance', label: 'การเงิน' },
  { group: 'การเงิน', to: '/reports', label: 'รายงาน' },
];

export function CattleProApp({ farmSlug, farmName }: { farmSlug: string; farmName: string }) {
  return (
    <div className="bg-slate-50">
      <MobileShell
        accent="accent"
        brand={<Brand farmName={farmName} />}
        sidebar={<Sidebar farmSlug={farmSlug} farmName={farmName} />}
      >
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
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
      </MobileShell>
    </div>
  );
}

function Brand({ farmName }: { farmName: string }) {
  return (
    <Link to="/" className="flex items-center gap-3">
      <img src="/logos/cattlepro.png" alt="Cattle Pro" className="h-7 w-auto" />
      <div className="min-w-0">
        <div className="truncate text-xs text-slate-500">{farmName}</div>
      </div>
    </Link>
  );
}

function Sidebar({ farmSlug, farmName }: { farmSlug: string; farmName: string }) {
  const groups = Array.from(new Set(NAV.map((n) => n.group)));
  return (
    <>
      <div className="border-b border-slate-200 p-5">
        <Brand farmName={farmName} />
        <div className="mt-1 font-mono text-[10px] text-slate-400">{farmSlug}</div>
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
                  cn('block rounded-md px-3 py-2 text-sm transition',
                    isActive ? 'bg-accent-50 font-medium text-accent-700' : 'text-slate-700 hover:bg-slate-50')
                }
              >
                {n.label}
              </NavLink>
            ))}
          </div>
        ))}
        <div className="mt-6 border-t border-slate-200 pt-4">
          <a
            href="https://jungdee.growgenius.co.th"
            className="flex items-center gap-2 rounded-md border border-primary-200 bg-primary-50 px-3 py-2 text-xs text-primary-700 hover:border-primary-500 hover:bg-primary-100"
          >
            <img src="/logos/jungdee.png" alt="" className="h-5 w-auto" />
            <span className="font-medium">ไปที่ Jungdee →</span>
          </a>
        </div>
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
    </>
  );
}
