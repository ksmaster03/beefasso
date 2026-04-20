import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api.ts';
import { PageHeader, Card, EmptyState, Field, inputCls, btnPrimary, btnDanger } from '../ui.tsx';

type Item = {
  id: string; name: string; unit: string;
  stockQty: string; costPerUnit: string; reorderLevel: string;
};

export function Feed() {
  const qc = useQueryClient();
  const { data } = useQuery<{ items: Item[] }>({
    queryKey: ['cp-feed'],
    queryFn: ({ signal }) => api('/api/farm/feed', { signal }),
  });
  const rows = data?.items ?? [];
  const [adding, setAdding] = useState(false);

  const del = useMutation({
    mutationFn: (id: string) => api(`/api/farm/feed/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cp-feed'] }),
  });

  const totalValue = rows.reduce((t, r) => t + Number(r.stockQty) * Number(r.costPerUnit), 0);

  return (
    <div>
      <PageHeader title="อาหาร & โภชนาการ" subtitle={`${rows.length} รายการ · มูลค่าคลัง ${totalValue.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿`} right={
        <button className={btnPrimary} onClick={() => setAdding(v => !v)}>+ เพิ่มรายการ</button>
      } />
      {adding && <AddForm onDone={() => setAdding(false)} />}

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        {rows.length === 0 ? <EmptyState message="ยังไม่มีรายการอาหาร" /> : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">ชื่อ</th>
                <th className="px-4 py-3 text-right">สต็อก</th>
                <th className="px-4 py-3">หน่วย</th>
                <th className="px-4 py-3 text-right">ต้นทุน/หน่วย</th>
                <th className="px-4 py-3 text-right">เตือนเมื่อเหลือ</th>
                <th className="px-4 py-3 text-right">มูลค่า</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map((r) => {
                const low = Number(r.stockQty) <= Number(r.reorderLevel);
                return (
                  <tr key={r.id} className={low ? 'bg-red-50/50' : ''}>
                    <td className="px-4 py-3 font-medium text-slate-900">{r.name} {low && <span className="ml-2 text-xs text-red-600">● ต่ำ</span>}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{Number(r.stockQty).toLocaleString('th-TH')}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{r.unit}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-xs">{Number(r.costPerUnit).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-xs text-slate-500">{Number(r.reorderLevel).toLocaleString('th-TH')}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{(Number(r.stockQty) * Number(r.costPerUnit)).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-right"><button onClick={() => confirm(`ลบ ${r.name}?`) && del.mutate(r.id)} className={btnDanger}>ลบ</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function AddForm({ onDone }: { onDone: () => void }) {
  const qc = useQueryClient();
  const [s, setS] = useState({ name: '', unit: 'kg', stockQty: '', costPerUnit: '', reorderLevel: '' });
  const save = useMutation({
    mutationFn: () =>
      api('/api/farm/feed', { method: 'POST', body: {
        name: s.name, unit: s.unit,
        stockQty: Number(s.stockQty) || 0,
        costPerUnit: Number(s.costPerUnit) || 0,
        reorderLevel: Number(s.reorderLevel) || 0,
      } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cp-feed'] }); onDone(); },
  });
  const on = (k: keyof typeof s) => (e: any) => setS({ ...s, [k]: e.target.value });
  return (
    <Card className="mt-4 border-accent-200 bg-accent-50/40">
      <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="grid gap-3 sm:grid-cols-5">
        <Field label="ชื่อ" required><input required value={s.name} onChange={on('name')} className={inputCls} /></Field>
        <Field label="หน่วย"><input value={s.unit} onChange={on('unit')} className={inputCls} /></Field>
        <Field label="สต็อก"><input type="number" step="0.01" value={s.stockQty} onChange={on('stockQty')} className={inputCls} /></Field>
        <Field label="ต้นทุน/หน่วย"><input type="number" step="0.01" value={s.costPerUnit} onChange={on('costPerUnit')} className={inputCls} /></Field>
        <Field label="เตือนเมื่อเหลือ"><input type="number" step="0.01" value={s.reorderLevel} onChange={on('reorderLevel')} className={inputCls} /></Field>
        <div className="sm:col-span-5 flex gap-2">
          <button type="submit" disabled={save.isPending} className={btnPrimary}>บันทึก</button>
          <button type="button" onClick={onDone} className="text-sm text-slate-500">ยกเลิก</button>
        </div>
      </form>
    </Card>
  );
}
