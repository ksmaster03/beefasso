import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api.ts';
import { PageHeader, Card, EmptyState, inputCls, btnPrimary, btnGhost, btnDanger, Field } from '../ui.tsx';
import { farmCattleStatusLabel } from '@beefasso/shared';

type Pen = { id: string; name: string; capacity: number; notes: string | null };
type Cattle = {
  id: string; earTag: string; regNo: string | null; name: string | null; breed: string | null;
  sex: 'male' | 'female'; dob: string | null; color: string | null;
  status: 'active' | 'sold' | 'deceased'; penId: string | null; createdAt: string;
};

export function Herd() {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [penId, setPenId] = useState('');
  const [status, setStatus] = useState<'' | 'active' | 'sold' | 'deceased'>('');
  const [adding, setAdding] = useState(false);
  const [editingPens, setEditingPens] = useState(false);

  const { data: pensData } = useQuery<{ pens: Pen[] }>({
    queryKey: ['cp-pens'],
    queryFn: ({ signal }) => api('/api/farm/pens', { signal }),
  });
  const pens = pensData?.pens ?? [];

  const { data, isLoading } = useQuery<{ cattle: Cattle[] }>({
    queryKey: ['cp-cattle', q, penId, status],
    queryFn: ({ signal }) => {
      const p = new URLSearchParams();
      if (q) p.set('q', q);
      if (penId) p.set('penId', penId);
      if (status) p.set('status', status);
      return api(`/api/farm/cattle${p.toString() ? '?' + p : ''}`, { signal });
    },
  });
  const rows = data?.cattle ?? [];
  const penById = Object.fromEntries(pens.map((p) => [p.id, p.name]));

  const del = useMutation({
    mutationFn: (id: string) => api(`/api/farm/cattle/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cp-cattle'] }),
  });

  return (
    <div>
      <PageHeader
        title="จัดการฝูงวัว"
        subtitle={`${rows.length} ตัว · ${pens.length} คอก`}
        right={
          <div className="flex gap-2">
            <button className={btnGhost} onClick={() => setEditingPens((v) => !v)}>
              จัดการคอก
            </button>
            <button className={btnPrimary} onClick={() => setAdding((v) => !v)}>
              + เพิ่มวัว
            </button>
          </div>
        }
      />

      {editingPens && <PenManager pens={pens} />}
      {adding && <AddCattleForm pens={pens} onDone={() => setAdding(false)} />}

      <div className="mt-6 flex flex-wrap gap-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหา: เบอร์หู, ชื่อ, สายพันธุ์" className={inputCls + ' min-w-64 flex-1'} />
        <select value={penId} onChange={(e) => setPenId(e.target.value)} className={inputCls + ' w-auto'}>
          <option value="">ทุกคอก</option>
          {pens.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as any)} className={inputCls + ' w-auto'}>
          <option value="">ทุกสถานะ</option>
          <option value="active">อยู่ในฟาร์ม</option>
          <option value="sold">ขายแล้ว</option>
          <option value="deceased">ตาย</option>
        </select>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {isLoading ? (
          <div className="p-10 text-center text-sm text-slate-500">กำลังโหลด...</div>
        ) : rows.length === 0 ? (
          <EmptyState message="ยังไม่มีวัวในฝูง" hint="กดปุ่ม + เพิ่มวัว ด้านบน" />
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">เบอร์หู</th>
                <th className="px-4 py-3">ชื่อ / สายพันธุ์</th>
                <th className="px-4 py-3">เพศ</th>
                <th className="px-4 py-3">คอก</th>
                <th className="px-4 py-3">วันเกิด</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-mono text-xs text-accent-700">{c.earTag}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{c.name ?? '—'}</div>
                    {c.breed && <div className="text-xs text-slate-500">{c.breed}</div>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c.sex === 'male' ? '♂' : '♀'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{c.penId ? penById[c.penId] ?? '—' : '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{c.dob ? new Date(c.dob).toLocaleDateString('th-TH') : '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{farmCattleStatusLabel(c.status)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => confirm(`ลบ ${c.earTag}?`) && del.mutate(c.id)} className={btnDanger}>
                      ลบ
                    </button>
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

function AddCattleForm({ pens, onDone }: { pens: Pen[]; onDone: () => void }) {
  const qc = useQueryClient();
  const [s, setS] = useState({ earTag: '', name: '', breed: '', sex: 'female' as 'male' | 'female', dob: '', color: '', penId: '' });
  const save = useMutation({
    mutationFn: () =>
      api('/api/farm/cattle', {
        method: 'POST',
        body: {
          earTag: s.earTag,
          name: s.name || null,
          breed: s.breed || null,
          sex: s.sex,
          dob: s.dob || null,
          color: s.color || null,
          penId: s.penId || null,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cp-cattle'] });
      onDone();
    },
  });
  const on = (k: keyof typeof s) => (e: any) => setS({ ...s, [k]: e.target.value });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate();
  };
  return (
    <Card className="mt-4 border-accent-200 bg-accent-50/40">
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-3">
        <Field label="เบอร์หู" required><input required value={s.earTag} onChange={on('earTag')} className={inputCls} /></Field>
        <Field label="ชื่อ"><input value={s.name} onChange={on('name')} className={inputCls} /></Field>
        <Field label="สายพันธุ์"><input value={s.breed} onChange={on('breed')} className={inputCls} /></Field>
        <Field label="เพศ"><select value={s.sex} onChange={on('sex')} className={inputCls}><option value="female">เพศเมีย</option><option value="male">เพศผู้</option></select></Field>
        <Field label="วันเกิด"><input type="date" value={s.dob} onChange={on('dob')} className={inputCls} /></Field>
        <Field label="คอก">
          <select value={s.penId} onChange={on('penId')} className={inputCls}>
            <option value="">— ไม่ระบุ —</option>
            {pens.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
        <div className="sm:col-span-3 flex gap-2">
          <button type="submit" disabled={save.isPending} className={btnPrimary}>{save.isPending ? 'กำลังบันทึก...' : 'บันทึก'}</button>
          <button type="button" onClick={onDone} className="text-sm text-slate-500 hover:text-slate-700">ยกเลิก</button>
        </div>
      </form>
    </Card>
  );
}

function PenManager({ pens }: { pens: Pen[] }) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('');
  const add = useMutation({
    mutationFn: () => api('/api/farm/pens', { method: 'POST', body: { name, capacity: Number(capacity) || 0 } }),
    onSuccess: () => {
      setName(''); setCapacity('');
      qc.invalidateQueries({ queryKey: ['cp-pens'] });
    },
  });
  const del = useMutation({
    mutationFn: (id: string) => api(`/api/farm/pens/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cp-pens'] }),
  });
  return (
    <Card className="mt-4 border-primary-200 bg-primary-50/40">
      <h3 className="text-sm font-semibold text-slate-900">คอก</h3>
      <div className="mt-3 flex gap-2">
        <input placeholder="ชื่อคอก" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        <input placeholder="ความจุ" type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} className={inputCls + ' w-28'} />
        <button type="button" onClick={() => name && add.mutate()} className={btnPrimary}>+ เพิ่มคอก</button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {pens.map((p) => (
          <span key={p.id} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs">
            {p.name} <span className="text-slate-400">· {p.capacity} ตัว</span>
            <button onClick={() => confirm(`ลบคอก ${p.name}?`) && del.mutate(p.id)} className="text-red-500 hover:text-red-700">×</button>
          </span>
        ))}
      </div>
    </Card>
  );
}
