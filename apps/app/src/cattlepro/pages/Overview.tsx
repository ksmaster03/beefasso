import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api.ts';
import { PageHeader, StatCard, Card, EmptyState } from '../ui.tsx';
import { Link } from 'react-router';

type Dashboard = {
  herdActive: number;
  penCount: number;
  healthDue: number;
  milkMonthKg: number;
  lowFeedCount: number;
  upcomingCalvings: number;
  finance: { income: number; expense: number };
};

type Alerts = {
  dueHealth: { id: string; cattleId: string; title: string; type: string; nextDueAt: string }[];
  lowFeed: { id: string; name: string; stockQty: string; unit: string; reorderLevel: string }[];
  calvings: { id: string; damId: string; dueAt: string }[];
};

export function Overview() {
  const { data: d } = useQuery<Dashboard>({
    queryKey: ['cp-dashboard'],
    queryFn: ({ signal }) => api('/api/farm/dashboard', { signal }),
  });
  const { data: a } = useQuery<Alerts>({
    queryKey: ['cp-alerts'],
    queryFn: ({ signal }) => api('/api/farm/alerts', { signal }),
  });

  const net = (d?.finance.income ?? 0) - (d?.finance.expense ?? 0);
  return (
    <div>
      <PageHeader title="ภาพรวม" subtitle="สรุปข้อมูลสำคัญของฟาร์ม" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="วัวในฝูง" value={d?.herdActive ?? '—'} tone="info" />
        <StatCard label="คอก" value={d?.penCount ?? '—'} tone="info" />
        <StatCard label="ต้องฉีดวัคซีน/รักษา" value={d?.healthDue ?? '—'} tone="warn" />
        <StatCard label="คลอดเร็ว ๆ นี้" value={d?.upcomingCalvings ?? '—'} tone="ok" />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="นมเดือนนี้ (kg)" value={(d?.milkMonthKg ?? 0).toLocaleString('th-TH')} tone="info" />
        <StatCard label="อาหารใกล้หมด" value={d?.lowFeedCount ?? '—'} tone="bad" />
        <StatCard label="รายรับเดือนนี้" value={(d?.finance.income ?? 0).toLocaleString('th-TH') + ' ฿'} tone="ok" />
        <StatCard label={net >= 0 ? 'กำไรสุทธิ' : 'ขาดทุนสุทธิ'} value={net.toLocaleString('th-TH') + ' ฿'} tone={net >= 0 ? 'ok' : 'bad'} />
      </div>

      <h2 className="mt-10 text-sm font-semibold uppercase tracking-wider text-accent-600">การแจ้งเตือนเร่งด่วน</h2>
      <div className="mt-3 grid gap-4 md:grid-cols-3">
        <AlertBlock title="ต้องฉีด/รักษา" empty="ไม่มีรายการค้าง">
          {a?.dueHealth.map((h) => (
            <div key={h.id} className="flex items-center justify-between border-b border-slate-100 py-2 last:border-0">
              <div>
                <div className="text-sm text-slate-900">{h.title}</div>
                <div className="text-xs text-slate-500">{h.nextDueAt}</div>
              </div>
              <Link to="/health" className="text-xs font-medium text-accent-600 hover:underline">ดู</Link>
            </div>
          ))}
        </AlertBlock>
        <AlertBlock title="อาหารสต็อกต่ำ" empty="สต็อกอาหารปกติ">
          {a?.lowFeed.map((f) => (
            <div key={f.id} className="flex items-center justify-between border-b border-slate-100 py-2 last:border-0">
              <div>
                <div className="text-sm text-slate-900">{f.name}</div>
                <div className="text-xs text-slate-500">
                  เหลือ {Number(f.stockQty).toLocaleString('th-TH')} {f.unit} · เตือนที่ {Number(f.reorderLevel).toLocaleString('th-TH')}
                </div>
              </div>
              <Link to="/feed" className="text-xs font-medium text-accent-600 hover:underline">ดู</Link>
            </div>
          ))}
        </AlertBlock>
        <AlertBlock title="กำหนดคลอด 14 วัน" empty="ไม่มีคลอดช่วงนี้">
          {a?.calvings.map((c) => (
            <div key={c.id} className="flex items-center justify-between border-b border-slate-100 py-2 last:border-0">
              <div>
                <div className="text-sm text-slate-900">กำหนดคลอด</div>
                <div className="text-xs text-slate-500">{c.dueAt}</div>
              </div>
              <Link to="/breeding" className="text-xs font-medium text-accent-600 hover:underline">ดู</Link>
            </div>
          ))}
        </AlertBlock>
      </div>
    </div>
  );
}

function AlertBlock({ title, empty, children }: { title: string; empty: string; children?: React.ReactNode }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : !!children;
  return (
    <Card>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {hasChildren ? <div className="mt-2">{children}</div> : <p className="mt-3 text-xs text-slate-500">{empty}</p>}
    </Card>
  );
}
