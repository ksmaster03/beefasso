import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api.ts';
import { PageHeader, Card, EmptyState, Field, inputCls, btnPrimary, btnDanger, StatCard } from '../ui.tsx';
import { financeTypeLabel } from '@beefasso/shared';

type Entry = { id: string; occurredAt: string; type: 'income' | 'expense'; category: string; amount: string; notes: string | null; ref: string | null };

export function Finance() {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [type, setType] = useState<'' | 'income' | 'expense'>('');

  const { data } = useQuery<{ entries: Entry[] }>({
    queryKey: ['cp-finance', type],
    queryFn: ({ signal }) => api(`/api/farm/finance${type ? '?type=' + type : ''}`, { signal }),
  });
  const rows = data?.entries ?? [];
  const income = rows.filter((r) => r.type === 'income').reduce((t, r) => t + Number(r.amount), 0);
  const expense = rows.filter((r) => r.type === 'expense').reduce((t, r) => t + Number(r.amount), 0);

  const del = useMutation({
    mutationFn: (id: string) => api(`/api/farm/finance/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cp-finance'] }); qc.invalidateQueries({ queryKey: ['cp-dashboard'] }); },
  });

  return (
    <div>
      <PageHeader title="การเงิน" subtitle={`${rows.length} รายการ`} right={
        <button className={btnPrimary} onClick={() => setAdding(v => !v)}>+ เพิ่มรายการ</button>
      } />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="รายรับรวม" value={income.toLocaleString('th-TH', { minimumFractionDigits: 2 }) + ' ฿'} tone="ok" />
        <StatCard label="รายจ่ายรวม" value={expense.toLocaleString('th-TH', { minimumFractionDigits: 2 }) + ' ฿'} tone="bad" />
        <StatCard label={income - expense >= 0 ? 'กำไรสุทธิ' : 'ขาดทุนสุทธิ'} value={(income - expense).toLocaleString('th-TH', { minimumFractionDigits: 2 }) + ' ฿'} tone={income - expense >= 0 ? 'ok' : 'bad'} />
      </div>

      {adding && <AddForm onDone={() => setAdding(false)} />}

      <div className="mt-4 mb-3 flex gap-2">
        {[{ v: '', l: 'ทั้งหมด' }, { v: 'income', l: 'รายรับ' }, { v: 'expense', l: 'รายจ่าย' }].map((o) => (
          <button key={o.v} onClick={() => setType(o.v as any)} className={`rounded-full px-4 py-1 text-xs ${type === o.v ? 'bg-accent-600 text-white' : 'border border-slate-300 bg-white text-slate-700'}`}>{o.l}</button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        {rows.length === 0 ? <EmptyState message="ยังไม่มีรายการการเงิน" /> : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">วันที่</th>
                <th className="px-4 py-3">ประเภท</th>
                <th className="px-4 py-3">หมวดหมู่</th>
                <th className="px-4 py-3">อ้างอิง</th>
                <th className="px-4 py-3 text-right">จำนวน</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 text-xs">{r.occurredAt}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs ${r.type === 'income' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{financeTypeLabel(r.type)}</span></td>
                  <td className="px-4 py-3 text-sm">{r.category}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{r.ref ?? '—'}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">{Number(r.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 text-right"><button onClick={() => confirm('ลบ?') && del.mutate(r.id)} className={btnDanger}>ลบ</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function AddForm({ onDone }: { onDone: () => void }) {
  const qc = useQueryClient();
  const [s, setS] = useState({
    occurredAt: new Date().toISOString().slice(0, 10),
    type: 'expense' as 'income' | 'expense',
    category: '', amount: '', notes: '', ref: '',
  });
  const save = useMutation({
    mutationFn: () =>
      api('/api/farm/finance', { method: 'POST', body: {
        occurredAt: s.occurredAt, type: s.type, category: s.category,
        amount: Number(s.amount) || 0, notes: s.notes || null, ref: s.ref || null,
      }}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cp-finance'] }); qc.invalidateQueries({ queryKey: ['cp-dashboard'] }); onDone(); },
  });
  const on = (k: keyof typeof s) => (e: any) => setS({ ...s, [k]: e.target.value });
  return (
    <Card className="mt-4 border-accent-200 bg-accent-50/40">
      <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="grid gap-3 sm:grid-cols-4">
        <Field label="วันที่" required><input required type="date" value={s.occurredAt} onChange={on('occurredAt')} className={inputCls} /></Field>
        <Field label="ประเภท">
          <select value={s.type} onChange={on('type')} className={inputCls}>
            <option value="expense">รายจ่าย</option><option value="income">รายรับ</option>
          </select>
        </Field>
        <Field label="หมวดหมู่" required><input required placeholder="เช่น ค่าอาหาร, ค่ารักษา, ขายนม" value={s.category} onChange={on('category')} className={inputCls} /></Field>
        <Field label="จำนวน (บาท)" required><input required type="number" step="0.01" value={s.amount} onChange={on('amount')} className={inputCls} /></Field>
        <Field label="อ้างอิง"><input value={s.ref} onChange={on('ref')} className={inputCls} /></Field>
        <Field label="หมายเหตุ"><input value={s.notes} onChange={on('notes')} className={inputCls} /></Field>
        <div className="sm:col-span-4 flex gap-2">
          <button type="submit" disabled={save.isPending} className={btnPrimary}>บันทึก</button>
          <button type="button" onClick={onDone} className="text-sm text-slate-500">ยกเลิก</button>
        </div>
      </form>
    </Card>
  );
}
