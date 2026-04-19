import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api.ts';
import type { FeeConfigRow } from '@beefasso/shared';

export function CreatePaymentButton({ memberId }: { memberId: string }) {
  const [open, setOpen] = useState(false);
  const { data } = useQuery<{ feeConfigs: FeeConfigRow[] }>({
    queryKey: ['fee-configs'],
    queryFn: ({ signal }) => api('/api/fee-configs', { signal }),
    enabled: open,
  });
  const navigate = useNavigate();
  const create = useMutation({
    mutationFn: (feeCode: string) => api<{ payment: { id: string } }>('/api/payments', { method: 'POST', body: { memberId, feeCode } }),
    onSuccess: (r) => navigate(`/app/payments/${r.payment.id}`),
  });

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-primary-500 hover:text-primary-600"
      >
        ออกใบชำระเงิน
      </button>
    );
  }
  const fees = (data?.feeConfigs ?? []).filter((f) => f.active);
  return (
    <div className="rounded-xl border border-primary-200 bg-primary-50/40 p-4">
      <p className="text-sm font-medium text-slate-700">เลือกรายการที่จะชำระ</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {fees.map((f) => (
          <button
            key={f.id}
            type="button"
            disabled={create.isPending}
            onClick={() => create.mutate(f.code)}
            className="rounded-md border border-primary-200 bg-white px-3 py-1.5 text-xs font-medium text-primary-700 hover:border-primary-500 disabled:opacity-60"
          >
            {f.name} · {Number(f.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
          </button>
        ))}
      </div>
      {create.error && (
        <div className="mt-2 text-xs text-red-600">
          สร้างไม่สำเร็จ: {(create.error as ApiError).message}
        </div>
      )}
      <button onClick={() => setOpen(false)} className="mt-3 text-xs text-slate-500 hover:text-slate-700">
        ยกเลิก
      </button>
    </div>
  );
}
