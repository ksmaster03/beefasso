import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api.ts';
import type { FeeConfigRow } from '@beefasso/shared';

export function FeesPage() {
  const qc = useQueryClient();
  const { data } = useQuery<{ feeConfigs: FeeConfigRow[] }>({
    queryKey: ['fee-configs'],
    queryFn: ({ signal }) => api('/api/fee-configs', { signal }),
  });
  const rows = data?.feeConfigs ?? [];
  const [adding, setAdding] = useState(false);

  const del = useMutation({
    mutationFn: (id: string) => api(`/api/fee-configs/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fee-configs'] }),
  });

  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api(`/api/fee-configs/${id}`, { method: 'PATCH', body: { active } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fee-configs'] }),
  });

  return (
    <div className="max-w-3xl">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ค่าธรรมเนียม</h1>
          <p className="mt-0.5 text-sm text-slate-500">ตั้งค่ารายการค่าธรรมเนียมที่สมาคมเก็บ</p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          + เพิ่มรายการ
        </button>
      </header>

      {adding && <AddForm onDone={() => setAdding(false)} />}

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">code</th>
              <th className="px-4 py-3">รายการ</th>
              <th className="px-4 py-3 text-right">ราคา</th>
              <th className="px-4 py-3">รอบ</th>
              <th className="px-4 py-3">เปิดใช้</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.map((f) => (
              <tr key={f.id}>
                <td className="px-4 py-3 font-mono text-xs text-primary-700">{f.code}</td>
                <td className="px-4 py-3 text-slate-900">{f.name}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {Number(f.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {f.interval === 'year' ? 'รายปี' : f.interval === 'one_time' ? 'ครั้งเดียว' : '—'}
                </td>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={f.active}
                    onChange={(e) => toggle.mutate({ id: f.id, active: e.target.checked })}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => {
                      if (confirm(`ลบ "${f.name}"?`)) del.mutate(f.id);
                    }}
                    className="text-xs text-accent-600 hover:underline"
                  >
                    ลบ
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                  ยังไม่มีรายการค่าธรรมเนียม
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AddForm({ onDone }: { onDone: () => void }) {
  const qc = useQueryClient();
  const [state, setState] = useState({ code: '', name: '', amount: '', interval: '' });
  const save = useMutation({
    mutationFn: () =>
      api('/api/fee-configs', {
        method: 'POST',
        body: {
          code: state.code,
          name: state.name,
          amount: Number(state.amount),
          interval: state.interval === '' ? null : (state.interval as 'year' | 'one_time'),
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fee-configs'] });
      onDone();
    },
  });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate();
  };

  return (
    <form onSubmit={submit} className="mt-6 grid gap-3 rounded-xl border border-primary-200 bg-primary-50/40 p-5 sm:grid-cols-5">
      <input
        placeholder="code"
        required
        value={state.code}
        onChange={(e) => setState({ ...state, code: e.target.value })}
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-mono"
      />
      <input
        placeholder="ชื่อรายการ"
        required
        value={state.name}
        onChange={(e) => setState({ ...state, name: e.target.value })}
        className="col-span-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
      />
      <input
        type="number"
        min="0"
        step="0.01"
        placeholder="ราคา"
        required
        value={state.amount}
        onChange={(e) => setState({ ...state, amount: e.target.value })}
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
      />
      <select
        value={state.interval}
        onChange={(e) => setState({ ...state, interval: e.target.value })}
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
      >
        <option value="">— รอบ —</option>
        <option value="year">รายปี</option>
        <option value="one_time">ครั้งเดียว</option>
      </select>
      <div className="col-span-5 flex gap-2">
        <button
          type="submit"
          disabled={save.isPending}
          className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
        >
          บันทึก
        </button>
        <button type="button" onClick={onDone} className="text-sm text-slate-500 hover:text-slate-700">
          ยกเลิก
        </button>
      </div>
    </form>
  );
}
