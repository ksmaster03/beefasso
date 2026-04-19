import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api.ts';
import type { TenantSettings } from '@beefasso/shared';

type Res = { tenant: { id: string; slug: string; nameTh: string; nameEn: string | null }; settings: TenantSettings };

export function SettingsPage() {
  const { data, isLoading } = useQuery<Res>({
    queryKey: ['settings'],
    queryFn: ({ signal }) => api('/api/settings', { signal }),
  });
  const [promptpayId, setPromptpayId] = useState('');
  const [holderName, setHolderName] = useState('');
  const qc = useQueryClient();

  useEffect(() => {
    if (data?.settings) {
      setPromptpayId(data.settings.promptpayId ?? '');
      setHolderName(data.settings.promptpayHolderName ?? '');
    }
  }, [data]);

  const save = useMutation({
    mutationFn: (body: TenantSettings) => api('/api/settings', { method: 'PATCH', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });

  if (isLoading) return <div className="text-sm text-slate-500">กำลังโหลด...</div>;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate({
      promptpayId: promptpayId.trim() || undefined,
      promptpayHolderName: holderName.trim() || undefined,
    });
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-slate-900">ตั้งค่าสมาคม</h1>
      <p className="mt-1 text-sm text-slate-500">
        {data?.tenant.nameTh} · <span className="font-mono">{data?.tenant.slug}</span>
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-primary-600">PromptPay</h2>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">PromptPay ID</span>
          <input
            value={promptpayId}
            onChange={(e) => setPromptpayId(e.target.value)}
            placeholder="เบอร์โทร 10 หลัก หรือเลขบัตรประชาชน 13 หลัก"
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <span className="mt-1 block text-xs text-slate-500">
            ใช้สำหรับออก QR รับชำระเงินค่าสมาชิก / ค่าทะเบียนโค
          </span>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">ชื่อเจ้าของบัญชี</span>
          <input
            value={holderName}
            onChange={(e) => setHolderName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </label>

        {save.error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            บันทึกไม่สำเร็จ: {(save.error as ApiError).message}
          </div>
        )}
        {save.isSuccess && (
          <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">บันทึกแล้ว</div>
        )}

        <button
          type="submit"
          disabled={save.isPending}
          className="rounded-lg bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
        >
          {save.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
        </button>
      </form>
    </div>
  );
}
