import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api.ts';
import { PageHeader, Card, StatCard, inputCls, btnGhost } from '../ui.tsx';

type Summary = {
  period: { from: string; to: string };
  finance: { type: string; category: string; total: string }[];
  milk: { totalKg: number; sessions: number };
  activeHerd: number;
};

export function Reports() {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);

  const { data } = useQuery<Summary>({
    queryKey: ['cp-reports', from, to],
    queryFn: ({ signal }) => api(`/api/farm/reports/summary?from=${from}&to=${to}`, { signal }),
  });

  const income = (data?.finance ?? []).filter((f) => f.type === 'income').reduce((t, r) => t + Number(r.total), 0);
  const expense = (data?.finance ?? []).filter((f) => f.type === 'expense').reduce((t, r) => t + Number(r.total), 0);

  const exportCsv = () => {
    const lines: string[] = [];
    lines.push(`Report,${from},to,${to}`);
    lines.push('');
    lines.push('Metric,Value');
    lines.push(`Active herd,${data?.activeHerd ?? 0}`);
    lines.push(`Milk total (kg),${data?.milk.totalKg ?? 0}`);
    lines.push(`Milk sessions,${data?.milk.sessions ?? 0}`);
    lines.push(`Income,${income.toFixed(2)}`);
    lines.push(`Expense,${expense.toFixed(2)}`);
    lines.push(`Net,${(income - expense).toFixed(2)}`);
    lines.push('');
    lines.push('Type,Category,Total');
    for (const f of data?.finance ?? []) lines.push(`${f.type},${f.category},${f.total}`);
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cattle-pro-report-${from}-to-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader title="รายงาน" subtitle="สรุปผลการดำเนินงานระหว่างช่วงเวลาที่เลือก" right={
        <button onClick={exportCsv} className={btnGhost}>⬇ Export CSV</button>
      } />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="text-xs font-medium text-slate-700">จากวันที่</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls + ' w-44'} />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-700">ถึงวันที่</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls + ' w-44'} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="วัวในฝูง" value={data?.activeHerd ?? '—'} tone="info" />
        <StatCard label="น้ำนมรวม (kg)" value={(data?.milk.totalKg ?? 0).toLocaleString('th-TH')} tone="info" />
        <StatCard label="รายรับ" value={income.toLocaleString('th-TH', { minimumFractionDigits: 2 }) + ' ฿'} tone="ok" />
        <StatCard label={income - expense >= 0 ? 'กำไรสุทธิ' : 'ขาดทุนสุทธิ'} value={(income - expense).toLocaleString('th-TH', { minimumFractionDigits: 2 }) + ' ฿'} tone={income - expense >= 0 ? 'ok' : 'bad'} />
      </div>

      <Card className="mt-6">
        <h3 className="text-sm font-semibold text-slate-900">การเงินตามหมวดหมู่</h3>
        {data?.finance && data.finance.length > 0 ? (
          <table className="mt-3 min-w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-slate-500">
              <tr><th className="py-2">ประเภท</th><th className="py-2">หมวดหมู่</th><th className="py-2 text-right">รวม</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.finance.map((f, i) => (
                <tr key={i}>
                  <td className="py-2"><span className={`rounded-full px-2 py-0.5 text-xs ${f.type === 'income' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{f.type === 'income' ? 'รายรับ' : 'รายจ่าย'}</span></td>
                  <td className="py-2 text-sm">{f.category}</td>
                  <td className="py-2 text-right tabular-nums">{Number(f.total).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="mt-3 text-sm text-slate-500">ไม่มีข้อมูลการเงินในช่วงนี้</p>}
      </Card>

      <p className="mt-4 text-xs text-slate-400">* Export PDF ที่จัดเต็มพร้อมโลโก้ฟาร์ม จะเพิ่มใน phase ถัดไป — ตอนนี้ export เป็น CSV ได้</p>
    </div>
  );
}
