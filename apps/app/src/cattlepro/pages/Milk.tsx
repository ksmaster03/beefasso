import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api.ts';
import { PageHeader, Card, EmptyState, Field, inputCls, btnPrimary, btnDanger } from '../ui.tsx';

type Rec = { id: string; cattleId: string; recordedAt: string; session: string; kg: string; fatPct: string | null };
type Cattle = { id: string; earTag: string; name: string | null };
type Top = { cattle_id: string; ear_tag: string; name: string | null; total_kg: string; avg_kg: string; sessions: number };

export function Milk() {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);

  const { data: cats } = useQuery<{ cattle: Cattle[] }>({
    queryKey: ['cp-cattle-picker'],
    queryFn: ({ signal }) => api('/api/farm/cattle/_picker?sex=female', { signal }),
  });
  const { data: recs } = useQuery<{ records: Rec[] }>({
    queryKey: ['cp-milk'],
    queryFn: ({ signal }) => api('/api/farm/milk', { signal }),
  });
  const { data: top } = useQuery<{ top: Top[]; days: number }>({
    queryKey: ['cp-milk-top'],
    queryFn: ({ signal }) => api('/api/farm/milk/top?days=30', { signal }),
  });

  const rows = recs?.records ?? [];
  const del = useMutation({
    mutationFn: (id: string) => api(`/api/farm/milk/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cp-milk'] }); qc.invalidateQueries({ queryKey: ['cp-milk-top'] }); },
  });

  return (
    <div>
      <PageHeader title="ผลผลิตนม" subtitle={`${rows.length} บันทึก`} right={
        <button className={btnPrimary} onClick={() => setAdding(v => !v)}>+ บันทึกรีดนม</button>
      } />
      {adding && <AddForm cattle={cats?.cattle ?? []} onDone={() => setAdding(false)} />}

      {top?.top && top.top.length > 0 && (
        <section className="mt-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-accent-600">อันดับวัวให้นมสูงสุด 30 วัน</h3>
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr><th className="px-4 py-2">#</th><th className="px-4 py-2">วัว</th><th className="px-4 py-2 text-right">รวม (kg)</th><th className="px-4 py-2 text-right">เฉลี่ย/ครั้ง</th><th className="px-4 py-2 text-right">ครั้ง</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {top.top.map((t, i) => (
                  <tr key={t.cattle_id}>
                    <td className="px-4 py-2 text-xs text-slate-500">{i + 1}</td>
                    <td className="px-4 py-2"><span className="font-mono text-xs text-accent-700">{t.ear_tag}</span>{t.name && <span className="ml-2 text-sm">{t.name}</span>}</td>
                    <td className="px-4 py-2 text-right tabular-nums font-semibold">{Number(t.total_kg).toLocaleString('th-TH', { minimumFractionDigits: 1 })}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-xs text-slate-500">{Number(t.avg_kg).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-2 text-right text-xs text-slate-500">{t.sessions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="mt-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">บันทึกรีดนมล่าสุด</h3>
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {rows.length === 0 ? <EmptyState message="ยังไม่มีบันทึก" /> : (
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr><th className="px-4 py-2">วันที่</th><th className="px-4 py-2">รอบ</th><th className="px-4 py-2">วัว</th><th className="px-4 py-2 text-right">kg</th><th className="px-4 py-2 text-right">ไขมัน %</th><th className="px-4 py-2"></th></tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {rows.map((r) => {
                  const c = (cats?.cattle ?? []).find((x) => x.id === r.cattleId);
                  return (
                    <tr key={r.id}>
                      <td className="px-4 py-2 text-xs">{r.recordedAt}</td>
                      <td className="px-4 py-2 text-xs">{r.session}</td>
                      <td className="px-4 py-2 text-xs">{c ? c.earTag + (c.name ? ' · ' + c.name : '') : r.cattleId.slice(0,8)}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{Number(r.kg).toLocaleString('th-TH', { minimumFractionDigits: 1 })}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-xs">{r.fatPct ? Number(r.fatPct).toFixed(2) : '—'}</td>
                      <td className="px-4 py-2 text-right"><button onClick={() => confirm('ลบ?') && del.mutate(r.id)} className={btnDanger}>ลบ</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}

function AddForm({ cattle, onDone }: { cattle: Cattle[]; onDone: () => void }) {
  const qc = useQueryClient();
  const [s, setS] = useState({ cattleId: '', recordedAt: new Date().toISOString().slice(0, 10), session: 'morning', kg: '', fatPct: '' });
  const save = useMutation({
    mutationFn: () =>
      api('/api/farm/milk', { method: 'POST', body: {
        cattleId: s.cattleId, recordedAt: s.recordedAt, session: s.session,
        kg: Number(s.kg) || 0, fatPct: s.fatPct ? Number(s.fatPct) : null,
      }}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cp-milk'] }); qc.invalidateQueries({ queryKey: ['cp-milk-top'] }); qc.invalidateQueries({ queryKey: ['cp-dashboard'] }); onDone(); },
  });
  const on = (k: keyof typeof s) => (e: any) => setS({ ...s, [k]: e.target.value });
  return (
    <Card className="mt-4 border-accent-200 bg-accent-50/40">
      <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="grid gap-3 sm:grid-cols-5">
        <Field label="วัว" required>
          <select required value={s.cattleId} onChange={on('cattleId')} className={inputCls}>
            <option value="">— เลือก —</option>
            {cattle.map((c) => <option key={c.id} value={c.id}>{c.earTag}{c.name ? ' · ' + c.name : ''}</option>)}
          </select>
        </Field>
        <Field label="วันที่"><input type="date" value={s.recordedAt} onChange={on('recordedAt')} className={inputCls} /></Field>
        <Field label="รอบ">
          <select value={s.session} onChange={on('session')} className={inputCls}>
            <option value="morning">เช้า</option><option value="afternoon">กลางวัน</option><option value="evening">เย็น</option>
          </select>
        </Field>
        <Field label="kg" required><input required type="number" step="0.1" value={s.kg} onChange={on('kg')} className={inputCls} /></Field>
        <Field label="ไขมัน %"><input type="number" step="0.01" value={s.fatPct} onChange={on('fatPct')} className={inputCls} /></Field>
        <div className="sm:col-span-5 flex gap-2">
          <button type="submit" disabled={save.isPending} className={btnPrimary}>บันทึก</button>
          <button type="button" onClick={onDone} className="text-sm text-slate-500">ยกเลิก</button>
        </div>
      </form>
    </Card>
  );
}
