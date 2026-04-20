import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api.ts';
import { PageHeader, Card, EmptyState, Field, inputCls, btnPrimary, btnGhost, btnDanger } from '../ui.tsx';
import { healthTypeLabel } from '@beefasso/shared';

type Record = {
  id: string; cattleId: string; type: 'illness' | 'vaccine' | 'treatment' | 'checkup';
  title: string; notes: string | null; occurredAt: string; nextDueAt: string | null;
  vetName: string | null; cost: string | null;
};
type Cattle = { id: string; earTag: string; name: string | null };

export function Health() {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const { data: cats } = useQuery<{ cattle: Cattle[] }>({
    queryKey: ['cp-cattle-picker'],
    queryFn: ({ signal }) => api('/api/farm/cattle/_picker', { signal }),
  });
  const { data } = useQuery<{ records: Record[] }>({
    queryKey: ['cp-health'],
    queryFn: ({ signal }) => api('/api/farm/health', { signal }),
  });
  const rows = data?.records ?? [];
  const cmap = Object.fromEntries((cats?.cattle ?? []).map((c) => [c.id, `${c.earTag}${c.name ? ' · ' + c.name : ''}`]));
  const del = useMutation({
    mutationFn: (id: string) => api(`/api/farm/health/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cp-health'] }),
  });

  return (
    <div>
      <PageHeader title="สุขภาพ & วัคซีน" subtitle={`${rows.length} รายการ`} right={
        <button className={btnPrimary} onClick={() => setAdding(v => !v)}>+ เพิ่มบันทึก</button>
      } />
      {adding && <AddForm cattle={cats?.cattle ?? []} onDone={() => setAdding(false)} />}

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {rows.length === 0 ? (
          <EmptyState message="ยังไม่มีบันทึกสุขภาพ" />
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">วันที่</th>
                <th className="px-4 py-3">วัว</th>
                <th className="px-4 py-3">ประเภท</th>
                <th className="px-4 py-3">หัวข้อ</th>
                <th className="px-4 py-3">ครั้งถัดไป</th>
                <th className="px-4 py-3">สัตวแพทย์</th>
                <th className="px-4 py-3 text-right">ค่าใช้จ่าย</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 text-xs text-slate-500">{r.occurredAt}</td>
                  <td className="px-4 py-3 text-xs">{cmap[r.cattleId] ?? r.cattleId.slice(0, 8)}</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{healthTypeLabel(r.type)}</span></td>
                  <td className="px-4 py-3 font-medium text-slate-900">{r.title}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{r.nextDueAt ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{r.vetName ?? '—'}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-xs">{r.cost ? Number(r.cost).toLocaleString('th-TH') + ' ฿' : '—'}</td>
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

function AddForm({ cattle, onDone }: { cattle: Cattle[]; onDone: () => void }) {
  const qc = useQueryClient();
  const [s, setS] = useState({
    cattleId: '', type: 'vaccine' as Record['type'], title: '',
    occurredAt: new Date().toISOString().slice(0, 10),
    nextDueAt: '', vetName: '', cost: '', notes: '',
  });
  const save = useMutation({
    mutationFn: () =>
      api('/api/farm/health', {
        method: 'POST',
        body: {
          cattleId: s.cattleId, type: s.type, title: s.title,
          occurredAt: s.occurredAt, nextDueAt: s.nextDueAt || null,
          vetName: s.vetName || null, cost: s.cost ? Number(s.cost) : null,
          notes: s.notes || null,
        },
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cp-health'] }); qc.invalidateQueries({ queryKey: ['cp-dashboard'] }); onDone(); },
  });
  const on = (k: keyof typeof s) => (e: any) => setS({ ...s, [k]: e.target.value });
  return (
    <Card className="mt-4 border-accent-200 bg-accent-50/40">
      <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="grid gap-3 sm:grid-cols-3">
        <Field label="วัว" required>
          <select required value={s.cattleId} onChange={on('cattleId')} className={inputCls}>
            <option value="">— เลือก —</option>
            {cattle.map((c) => <option key={c.id} value={c.id}>{c.earTag}{c.name ? ' · ' + c.name : ''}</option>)}
          </select>
        </Field>
        <Field label="ประเภท">
          <select value={s.type} onChange={on('type')} className={inputCls}>
            <option value="vaccine">วัคซีน</option><option value="illness">เจ็บป่วย</option>
            <option value="treatment">รักษา</option><option value="checkup">ตรวจสุขภาพ</option>
          </select>
        </Field>
        <Field label="หัวข้อ" required><input required value={s.title} onChange={on('title')} className={inputCls} /></Field>
        <Field label="วันที่" required><input required type="date" value={s.occurredAt} onChange={on('occurredAt')} className={inputCls} /></Field>
        <Field label="ครั้งถัดไป (เตือน)"><input type="date" value={s.nextDueAt} onChange={on('nextDueAt')} className={inputCls} /></Field>
        <Field label="สัตวแพทย์"><input value={s.vetName} onChange={on('vetName')} className={inputCls} /></Field>
        <Field label="ค่าใช้จ่าย (บาท)"><input type="number" step="0.01" value={s.cost} onChange={on('cost')} className={inputCls} /></Field>
        <Field label="หมายเหตุ"><input value={s.notes} onChange={on('notes')} className={inputCls} /></Field>
        <div className="sm:col-span-3 flex gap-2">
          <button type="submit" disabled={save.isPending} className={btnPrimary}>{save.isPending ? 'บันทึก...' : 'บันทึก'}</button>
          <button type="button" onClick={onDone} className="text-sm text-slate-500">ยกเลิก</button>
        </div>
      </form>
    </Card>
  );
}
