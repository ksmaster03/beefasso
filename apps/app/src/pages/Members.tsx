import { useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api.ts';
import { memberTypeLabel, memberStatusLabel, type MemberRow } from '@beefasso/shared';
import { cn } from '@/lib/ui.ts';

export function MembersPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'' | 'active' | 'expired' | 'suspended'>('');

  const { data, isLoading, error } = useQuery<{ members: MemberRow[] }>({
    queryKey: ['members', q, status],
    queryFn: ({ signal }) => {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (status) params.set('status', status);
      return api(`/api/members${params.toString() ? '?' + params.toString() : ''}`, { signal });
    },
  });

  const rows = data?.members ?? [];

  return (
    <div>
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">สมาชิก</h1>
          <p className="mt-0.5 text-sm text-slate-500">{rows.length} รายการ</p>
        </div>
        <Link
          to="new"
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          + เพิ่มสมาชิก
        </Link>
      </header>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ค้นหา: เลขสมาชิก, ชื่อ, อีเมล, เบอร์"
          className="min-w-72 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">ทั้งหมด</option>
          <option value="active">ใช้งาน</option>
          <option value="expired">หมดอายุ</option>
          <option value="suspended">ระงับ</option>
        </select>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        {isLoading ? (
          <div className="p-10 text-center text-sm text-slate-500">กำลังโหลด...</div>
        ) : error ? (
          <div className="p-10 text-center text-sm text-accent-600">โหลดข้อมูลไม่ได้</div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">ยังไม่มีสมาชิก</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">เลขสมาชิก</th>
                <th className="px-4 py-3">ชื่อ</th>
                <th className="px-4 py-3">ประเภท</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3">ติดต่อ</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-3 font-mono text-xs text-primary-700">{m.memberNo}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{m.fullName}</td>
                  <td className="px-4 py-3 text-slate-600">{memberTypeLabel(m.type)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={m.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {m.phone && <div>{m.phone}</div>}
                    {m.email && <div>{m.email}</div>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={m.id} className="text-xs font-medium text-primary-600 hover:underline">
                      ดู / แก้ไข
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

function StatusBadge({ status }: { status: MemberRow['status'] }) {
  const cls = {
    active: 'bg-green-50 text-green-700',
    expired: 'bg-yellow-50 text-yellow-700',
    suspended: 'bg-slate-100 text-slate-500',
  }[status];
  return (
    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', cls)}>
      {memberStatusLabel(status)}
    </span>
  );
}
