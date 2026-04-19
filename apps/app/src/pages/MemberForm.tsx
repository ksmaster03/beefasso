import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api.ts';
import type { MemberRow } from '@beefasso/shared';
import { CreatePaymentButton } from '@/components/CreatePaymentButton.tsx';

type FormState = {
  memberNo: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  type: 'annual' | 'lifetime' | 'honorary';
  status: 'active' | 'expired' | 'suspended';
  expiredAt: string; // yyyy-mm-dd
};

function toFormState(m?: MemberRow | null): FormState {
  return {
    memberNo: m?.memberNo ?? '',
    fullName: m?.fullName ?? '',
    phone: m?.phone ?? '',
    email: m?.email ?? '',
    address: m?.address ?? '',
    type: m?.type ?? 'annual',
    status: m?.status ?? 'active',
    expiredAt: m?.expiredAt ? m.expiredAt.slice(0, 10) : '',
  };
}

export function MemberCreatePage() {
  return <MemberFormInner mode="create" />;
}

export function MemberEditPage() {
  const { id } = useParams();
  const { data, isLoading } = useQuery<{ member: MemberRow }>({
    queryKey: ['member', id],
    queryFn: ({ signal }) => api(`/api/members/${id}`, { signal }),
    enabled: !!id,
  });
  if (isLoading) return <div className="text-sm text-slate-500">กำลังโหลด...</div>;
  if (!data) return <div className="text-sm text-accent-600">ไม่พบสมาชิก</div>;
  return <MemberFormInner mode="edit" member={data.member} />;
}

function MemberFormInner({ mode, member }: { mode: 'create' | 'edit'; member?: MemberRow }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [state, setState] = useState<FormState>(toFormState(member));

  const save = useMutation({
    mutationFn: async (s: FormState) => {
      const body = {
        ...(s.memberNo ? { memberNo: s.memberNo } : {}),
        fullName: s.fullName,
        phone: s.phone || null,
        email: s.email || null,
        address: s.address || null,
        type: s.type,
        expiredAt: s.expiredAt ? new Date(s.expiredAt).toISOString() : null,
        ...(mode === 'edit' ? { status: s.status } : {}),
      };
      if (mode === 'create') return api<{ member: MemberRow }>('/api/members', { method: 'POST', body });
      return api<{ member: MemberRow }>(`/api/members/${member!.id}`, { method: 'PATCH', body });
    },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['members'] });
      qc.invalidateQueries({ queryKey: ['member', r.member.id] });
      qc.invalidateQueries({ queryKey: ['members-summary'] });
      navigate('..');
    },
  });

  const remove = useMutation({
    mutationFn: () => api(`/api/members/${member!.id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] });
      qc.invalidateQueries({ queryKey: ['members-summary'] });
      navigate('..');
    },
  });

  const on = (k: keyof FormState) => (e: any) => setState((s) => ({ ...s, [k]: e.target.value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate(state);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900">
        {mode === 'create' ? 'เพิ่มสมาชิกใหม่' : state.fullName || 'แก้ไขสมาชิก'}
      </h1>

      {mode === 'edit' && member && (
        <div className="mt-4">
          <CreatePaymentButton memberId={member.id} />
        </div>
      )}

      <form onSubmit={submit} className="mt-6 space-y-5 rounded-xl border border-slate-200 bg-white p-6">
        <Field label="เลขสมาชิก" hint="เว้นว่างให้ระบบ gen ให้อัตโนมัติ">
          <input value={state.memberNo} onChange={on('memberNo')} className={inputCls} />
        </Field>
        <Field label="ชื่อ-นามสกุล" required>
          <input value={state.fullName} onChange={on('fullName')} required className={inputCls} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="เบอร์โทร">
            <input value={state.phone} onChange={on('phone')} className={inputCls} />
          </Field>
          <Field label="อีเมล">
            <input type="email" value={state.email} onChange={on('email')} className={inputCls} />
          </Field>
        </div>
        <Field label="ที่อยู่">
          <textarea value={state.address} onChange={on('address')} rows={2} className={inputCls} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="ประเภทสมาชิก" required>
            <select value={state.type} onChange={on('type')} className={inputCls}>
              <option value="annual">รายปี</option>
              <option value="lifetime">ตลอดชีพ</option>
              <option value="honorary">กิตติมศักดิ์</option>
            </select>
          </Field>
          <Field label="วันหมดอายุ" hint="ไม่ระบุสำหรับตลอดชีพ">
            <input type="date" value={state.expiredAt} onChange={on('expiredAt')} className={inputCls} />
          </Field>
          {mode === 'edit' && (
            <Field label="สถานะ">
              <select value={state.status} onChange={on('status')} className={inputCls}>
                <option value="active">ใช้งาน</option>
                <option value="expired">หมดอายุ</option>
                <option value="suspended">ระงับ</option>
              </select>
            </Field>
          )}
        </div>

        {save.error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            บันทึกไม่สำเร็จ: {(save.error as ApiError).message}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-200 pt-4">
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={save.isPending}
              className="rounded-lg bg-primary-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60 hover:bg-primary-700"
            >
              {save.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:border-primary-500 hover:text-primary-600"
            >
              ยกเลิก
            </button>
          </div>
          {mode === 'edit' && (
            <button
              type="button"
              onClick={() => {
                if (confirm('ระงับสมาชิกรายนี้?')) remove.mutate();
              }}
              disabled={remove.isPending}
              className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              ระงับสมาชิก
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

const inputCls =
  'mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500';

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">
        {label} {required && <span className="text-accent-500">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}
