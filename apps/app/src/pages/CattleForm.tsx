import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api.ts';
import { CattleAutocomplete } from '@/components/CattleAutocomplete.tsx';
import type { CattleRow } from '@beefasso/shared';

type Form = {
  regNo: string;
  earTag: string;
  name: string;
  breed: string;
  sex: 'male' | 'female';
  dob: string;
  color: string;
  sireId: string | null;
  damId: string | null;
};

export function CattleCreatePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [s, setS] = useState<Form>({
    regNo: '',
    earTag: '',
    name: '',
    breed: '',
    sex: 'male',
    dob: '',
    color: '',
    sireId: null,
    damId: null,
  });

  const save = useMutation({
    mutationFn: async (f: Form) => {
      const body = {
        regNo: f.regNo,
        earTag: f.earTag,
        name: f.name || null,
        breed: f.breed || null,
        sex: f.sex,
        dob: f.dob || null,
        color: f.color || null,
        sireId: f.sireId || null,
        damId: f.damId || null,
      };
      return api<{ cattle: CattleRow }>('/api/cattle', { method: 'POST', body });
    },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['cattle'] });
      navigate(`../${r.cattle.id}`);
    },
  });

  const on = (k: keyof Form) => (e: any) => setS((v) => ({ ...v, [k]: e.target.value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate(s);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900">ขึ้นทะเบียนโค</h1>

      <form onSubmit={submit} className="mt-6 space-y-5 rounded-xl border border-slate-200 bg-white p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="เลขทะเบียน" required>
            <input value={s.regNo} onChange={on('regNo')} required className={inputCls} />
          </Field>
          <Field label="เบอร์หู (ear tag)" required>
            <input value={s.earTag} onChange={on('earTag')} required className={inputCls} />
          </Field>
        </div>
        <Field label="ชื่อโค">
          <input value={s.name} onChange={on('name')} className={inputCls} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="สายพันธุ์">
            <input value={s.breed} onChange={on('breed')} placeholder="เช่น Brahman, Wagyu" className={inputCls} />
          </Field>
          <Field label="เพศ" required>
            <select value={s.sex} onChange={on('sex')} className={inputCls}>
              <option value="male">เพศผู้</option>
              <option value="female">เพศเมีย</option>
            </select>
          </Field>
          <Field label="วันเกิด">
            <input type="date" value={s.dob} onChange={on('dob')} className={inputCls} />
          </Field>
        </div>
        <Field label="สี">
          <input value={s.color} onChange={on('color')} placeholder="เช่น แดง, ดำ" className={inputCls} />
        </Field>

        <hr className="border-slate-200" />
        <p className="text-sm font-semibold text-slate-700">ข้อมูลพ่อแม่พันธุ์</p>
        <Field label="พ่อพันธุ์ (sire)">
          <CattleAutocomplete
            value={s.sireId}
            onChange={(id) => setS((v) => ({ ...v, sireId: id }))}
            sex="male"
          />
        </Field>
        <Field label="แม่พันธุ์ (dam)">
          <CattleAutocomplete
            value={s.damId}
            onChange={(id) => setS((v) => ({ ...v, damId: id }))}
            sex="female"
          />
        </Field>

        {save.error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            บันทึกไม่สำเร็จ: {(save.error as ApiError).message}
          </div>
        )}

        <div className="flex gap-3 border-t border-slate-200 pt-4">
          <button
            type="submit"
            disabled={save.isPending}
            className="rounded-lg bg-primary-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60 hover:bg-primary-700"
          >
            {save.isPending ? 'กำลังบันทึก...' : 'บันทึกและขึ้นทะเบียน'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:border-primary-500 hover:text-primary-600"
          >
            ยกเลิก
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls =
  'mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500';

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">
        {label} {required && <span className="text-accent-500">*</span>}
      </span>
      {children}
    </label>
  );
}
