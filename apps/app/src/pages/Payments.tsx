import { useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api.ts';
import { paymentStatusLabel } from '@beefasso/shared';
import { cn } from '@/lib/ui.ts';

type Row = {
  id: string;
  memberId: string;
  memberNo: string | null;
  memberName: string | null;
  feeCode: string;
  amount: string;
  refCode: string;
  slipUrl: string | null;
  status: 'pending' | 'verified' | 'rejected';
  verifiedAt: string | null;
  createdAt: string;
};

export function PaymentsPage() {
  const [status, setStatus] = useState<'' | 'pending' | 'verified' | 'rejected'>('');
  const { data, isLoading } = useQuery<{ payments: Row[] }>({
    queryKey: ['payments', status],
    queryFn: ({ signal }) => api(`/api/payments${status ? '?status=' + status : ''}`, { signal }),
  });
  const rows = data?.payments ?? [];

  return (
    <div>
      <header>
        <h1 className="text-2xl font-bold text-slate-900">การชำระเงิน</h1>
        <p className="mt-0.5 text-sm text-slate-500">{rows.length} รายการ</p>
      </header>

      <div className="mt-6 flex gap-2">
        {[
          { v: '', label: 'ทั้งหมด' },
          { v: 'pending', label: 'รอตรวจสอบ' },
          { v: 'verified', label: 'ยืนยันแล้ว' },
          { v: 'rejected', label: 'ปฏิเสธ' },
        ].map((o) => (
          <button
            key={o.v}
            onClick={() => setStatus(o.v as any)}
            className={cn(
              'rounded-full px-4 py-1 text-xs font-medium',
              status === o.v ? 'bg-primary-600 text-white' : 'border border-slate-300 bg-white text-slate-700',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {isLoading ? (
          <div className="p-10 text-center text-sm text-slate-500">กำลังโหลด...</div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">ไม่พบรายการ</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">วันที่</th>
                <th className="px-4 py-3">ref</th>
                <th className="px-4 py-3">สมาชิก</th>
                <th className="px-4 py-3">รายการ</th>
                <th className="px-4 py-3 text-right">ยอด</th>
                <th className="px-4 py-3">สลิป</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {new Date(p.createdAt).toLocaleString('th-TH')}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-primary-700">{p.refCode}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{p.memberName ?? '—'}</div>
                    <div className="font-mono text-xs text-slate-500">{p.memberNo}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{p.feeCode}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {Number(p.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
                  </td>
                  <td className="px-4 py-3">
                    {p.slipUrl ? <span className="text-xs text-primary-600">มี</span> : <span className="text-xs text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={p.id} className="text-xs font-medium text-primary-600 hover:underline">
                      เปิด
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Row['status'] }) {
  const cls = {
    pending: 'bg-yellow-50 text-yellow-700',
    verified: 'bg-green-50 text-green-700',
    rejected: 'bg-red-50 text-red-700',
  }[status];
  return <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', cls)}>{paymentStatusLabel(status)}</span>;
}
