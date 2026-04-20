import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api.ts';
import { PageHeader, Card, EmptyState, Field, StatCard, inputCls, btnPrimary } from '../ui.tsx';
import { breedingResultLabel } from '@beefasso/shared';

type Rec = {
  id: string; damId: string; sireId: string | null; sireExternalLabel: string | null;
  method: 'AI' | 'natural'; bredAt: string; dueAt: string | null; calvedAt: string | null;
  result: 'pending' | 'confirmed' | 'failed' | 'calved'; notes: string | null;
};
type Cattle = { id: string; earTag: string; name: string | null; sex: 'male' | 'female' };
type Stats = { summary: { pending: number; confirmed: number; failed: number; calved: number }; total: number; successRate: number };

export function Breeding() {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const { data: cats } = useQuery<{ cattle: Cattle[] }>({
    queryKey: ['cp-cattle-picker'],
    queryFn: ({ signal }) => api('/api/farm/cattle/_picker', { signal }),
  });
  const { data } = useQuery<{ records: Rec[] }>({
    queryKey: ['cp-breeding'],
    queryFn: ({ signal }) => api('/api/farm/breeding', { signal }),
  });
  const { data: stats } = useQuery<Stats>({
    queryKey: ['cp-breeding-stats'],
    queryFn: ({ signal }) => api('/api/farm/breeding/stats', { signal }),
  });
  const rows = data?.records ?? [];
  const cmap = Object.fromEntries((cats?.cattle ?? []).map((c) => [c.id, c.earTag + (c.name ? ' · ' + c.name : '')]));

  const setResult = useMutation({
    mutationFn: (p: { id: string; body: any }) => api(`/api/farm/breeding/${p.id}`, { method: 'PATCH', body: p.body }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cp-breeding'] }); qc.invalidateQueries({ queryKey: ['cp-breeding-stats'] }); qc.invalidateQueries({ queryKey: ['cp-dashboard'] }); },
  });

  return (
    <div>
      <PageHeader title="การผสมพันธุ์" subtitle={`${rows.length} รายการ`} right={
        <button className={btnPrimary} onClick={() => setAdding(v => !v)}>+ บันทึกการผสม</button>
      } />

      <div className="mb-4 grid gap-4 sm:grid-cols-4">
        <StatCard label="รอตรวจท้อง" value={stats?.summary.pending ?? '—'} tone="warn" />
        <StatCard label="ตั้งท้อง" value={stats?.summary.confirmed ?? '—'} tone="ok" />
        <StatCard label="ไม่ติด" value={stats?.summary.failed ?? '—'} tone="bad" />
        <StatCard label="อัตราผสมติด" value={(((stats?.successRate ?? 0) * 100).toFixed(0)) + '%'} tone="info" />
      </div>

      {adding && <AddForm cattle={cats?.cattle ?? []} onDone={() => setAdding(false)} />}

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {rows.length === 0 ? <EmptyState message="ยังไม่มีบันทึกการผสม" /> : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">วันผสม</th>
                <th className="px-4 py-3">แม่</th>
                <th className="px-4 py-3">พ่อ</th>
                <th className="px-4 py-3">วิธี</th>
                <th className="px-4 py-3">กำหนดคลอด</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 text-xs">{r.bredAt}</td>
                  <td className="px-4 py-3 text-xs">{cmap[r.damId] ?? r.damId.slice(0,8)}</td>
                  <td className="px-4 py-3 text-xs">{r.sireId ? (cmap[r.sireId] ?? r.sireId.slice(0,8)) : (r.sireExternalLabel ?? '—')}</td>
                  <td className="px-4 py-3 text-xs">{r.method}</td>
                  <td className="px-4 py-3 text-xs">{r.dueAt ?? '—'}</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{breedingResultLabel(r.result)}</span></td>
                  <td className="px-4 py-3 text-right">
                    {r.result === 'pending' && (
                      <div className="inline-flex gap-1">
                        <button onClick={() => setResult.mutate({ id: r.id, body: { result: 'confirmed', checkedAt: new Date().toISOString().slice(0,10) } })} className="rounded border border-green-200 bg-green-50 px-2 py-1 text-xs text-green-700">ติด</button>
                        <button onClick={() => setResult.mutate({ id: r.id, body: { result: 'failed', checkedAt: new Date().toISOString().slice(0,10) } })} className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700">ไม่ติด</button>
                      </div>
                    )}
                    {r.result === 'confirmed' && (
                      <button onClick={() => setResult.mutate({ id: r.id, body: { result: 'calved', calvedAt: new Date().toISOString().slice(0,10) } })} className="rounded border border-primary-200 bg-primary-50 px-2 py-1 text-xs text-primary-700">คลอดแล้ว</button>
                    )}
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

function AddForm({ cattle, onDone }: { cattle: Cattle[]; onDone: () => void }) {
  const qc = useQueryClient();
  const [s, setS] = useState({ damId: '', sireId: '', sireExternalLabel: '', method: 'AI' as 'AI' | 'natural', bredAt: new Date().toISOString().slice(0,10), notes: '' });
  const save = useMutation({
    mutationFn: () => api('/api/farm/breeding', { method: 'POST', body: {
      damId: s.damId,
      sireId: s.sireId || null,
      sireExternalLabel: s.sireExternalLabel || null,
      method: s.method,
      bredAt: s.bredAt,
      notes: s.notes || null,
    }}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cp-breeding'] }); qc.invalidateQueries({ queryKey: ['cp-breeding-stats'] }); onDone(); },
  });
  const dams = cattle.filter((c) => c.sex === 'female');
  const sires = cattle.filter((c) => c.sex === 'male');
  const on = (k: keyof typeof s) => (e: any) => setS({ ...s, [k]: e.target.value });
  return (
    <Card className="mt-4 border-accent-200 bg-accent-50/40">
      <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="grid gap-3 sm:grid-cols-3">
        <Field label="แม่พันธุ์" required>
          <select required value={s.damId} onChange={on('damId')} className={inputCls}>
            <option value="">— เลือก —</option>
            {dams.map((c) => <option key={c.id} value={c.id}>{c.earTag}{c.name ? ' · ' + c.name : ''}</option>)}
          </select>
        </Field>
        <Field label="พ่อพันธุ์ (ในฟาร์ม)">
          <select value={s.sireId} onChange={on('sireId')} className={inputCls}>
            <option value="">— ไม่ระบุ —</option>
            {sires.map((c) => <option key={c.id} value={c.id}>{c.earTag}{c.name ? ' · ' + c.name : ''}</option>)}
          </select>
        </Field>
        <Field label="พ่อพันธุ์ (ภายนอก)" hint="ใช้กรณี AI จากเซลล์นำเข้า">
          <input value={s.sireExternalLabel} onChange={on('sireExternalLabel')} className={inputCls} />
        </Field>
        <Field label="วิธี">
          <select value={s.method} onChange={on('method')} className={inputCls}>
            <option value="AI">ผสมเทียม (AI)</option><option value="natural">ผสมจริง</option>
          </select>
        </Field>
        <Field label="วันผสม" required><input required type="date" value={s.bredAt} onChange={on('bredAt')} className={inputCls} /></Field>
        <Field label="หมายเหตุ"><input value={s.notes} onChange={on('notes')} className={inputCls} /></Field>
        <div className="sm:col-span-3 flex gap-2">
          <button type="submit" disabled={save.isPending} className={btnPrimary}>บันทึก</button>
          <button type="button" onClick={onDone} className="text-sm text-slate-500">ยกเลิก</button>
        </div>
      </form>
    </Card>
  );
}
