import { useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api.ts';
import { cattleSexLabel, type CattleRow } from '@beefasso/shared';

export function CattlePage() {
  const [q, setQ] = useState('');
  const [sex, setSex] = useState<'' | 'male' | 'female'>('');

  const { data, isLoading, error } = useQuery<{ cattle: CattleRow[] }>({
    queryKey: ['cattle', q, sex],
    queryFn: ({ signal }) => {
      const p = new URLSearchParams();
      if (q) p.set('q', q);
      if (sex) p.set('sex', sex);
      return api(`/api/cattle${p.toString() ? '?' + p : ''}`, { signal });
    },
  });
  const rows = data?.cattle ?? [];

  return (
    <div>
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ทะเบียนโค</h1>
          <p className="mt-0.5 text-sm text-slate-500">{rows.length} รายการ</p>
        </div>
        <Link
          to="new"
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          + ขึ้นทะเบียนโค
        </Link>
      </header>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ค้นหา: เลขทะเบียน, เบอร์หู, ชื่อ"
          className="min-w-72 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        <select
          value={sex}
          onChange={(e) => setSex(e.target.value as any)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">ทุกเพศ</option>
          <option value="male">เพศผู้</option>
          <option value="female">เพศเมีย</option>
        </select>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {isLoading ? (
          <div className="p-10 text-center text-sm text-slate-500">กำลังโหลด...</div>
        ) : error ? (
          <div className="p-10 text-center text-sm text-accent-600">โหลดข้อมูลไม่ได้</div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">ยังไม่มีโคขึ้นทะเบียน</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">เลขทะเบียน</th>
                <th className="px-4 py-3">เบอร์หู</th>
                <th className="px-4 py-3">ชื่อ / สายพันธุ์</th>
                <th className="px-4 py-3">เพศ</th>
                <th className="px-4 py-3">วันเกิด</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-mono text-xs text-primary-700">{c.regNo}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">{c.earTag}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{c.name ?? '—'}</div>
                    {c.breed && <div className="text-xs text-slate-500">{c.breed}</div>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{cattleSexLabel(c.sex)}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {c.dob ? new Date(c.dob).toLocaleDateString('th-TH') : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={c.id} className="text-xs font-medium text-primary-600 hover:underline">
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
