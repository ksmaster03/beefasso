import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api.ts';

type MembersSummary = { active: number; expired: number; suspended: number; total: number };

export function DashboardPage() {
  const { data } = useQuery<MembersSummary>({
    queryKey: ['members-summary'],
    queryFn: ({ signal }) => api('/api/members/_stats/summary', { signal }),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">ภาพรวม</h1>
      <p className="mt-1 text-slate-600">สรุปสถานะสมาคม</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <Card label="สมาชิกทั้งหมด" value={data?.total ?? '—'} />
        <Card label="ใช้งาน" value={data?.active ?? '—'} tone="ok" />
        <Card label="หมดอายุ" value={data?.expired ?? '—'} tone="warn" />
        <Card label="ระงับ" value={data?.suspended ?? '—'} tone="mute" />
      </div>
    </div>
  );
}

function Card({ label, value, tone }: { label: string; value: number | string; tone?: 'ok' | 'warn' | 'mute' }) {
  const bar = tone === 'ok' ? 'bg-green-500' : tone === 'warn' ? 'bg-yellow-500' : tone === 'mute' ? 'bg-slate-400' : 'bg-primary-600';
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
      <div className={`absolute inset-x-0 bottom-0 h-1 ${bar}`} />
    </div>
  );
}
