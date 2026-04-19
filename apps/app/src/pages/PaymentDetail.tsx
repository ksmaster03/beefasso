import { useParams, Link } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api.ts';
import { paymentStatusLabel } from '@beefasso/shared';
import type { ChangeEvent } from 'react';

type Detail = {
  payment: {
    id: string;
    memberId: string;
    feeCode: string;
    amount: string;
    refCode: string;
    slipUrl: string | null;
    status: 'pending' | 'verified' | 'rejected';
    verifiedAt: string | null;
    createdAt: string;
  };
  member: { memberNo: string; fullName: string } | null;
  fee: { name: string; interval: 'year' | 'one_time' | null } | null;
  promptpay: { id: string; holderName: string | null; payload: string; qrDataUrl: string } | null;
};

export function PaymentDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<Detail>({
    queryKey: ['payment', id],
    queryFn: ({ signal }) => api(`/api/payments/${id}`, { signal }),
    enabled: !!id,
  });

  const verify = useMutation({
    mutationFn: () => api(`/api/payments/${id}/verify`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payment', id] });
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['members-summary'] });
    },
  });
  const reject = useMutation({
    mutationFn: () => api(`/api/payments/${id}/reject`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payment', id] });
      qc.invalidateQueries({ queryKey: ['payments'] });
    },
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      const r = await fetch(`/api/payments/${id}/slip`, { method: 'POST', credentials: 'include', body: fd });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payment', id] }),
  });
  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) upload.mutate(f);
    e.target.value = '';
  };

  if (isLoading) return <div className="text-sm text-slate-500">กำลังโหลด...</div>;
  if (!data) return <div className="text-sm text-accent-600">ไม่พบข้อมูล</div>;

  const p = data.payment;
  return (
    <div className="max-w-3xl space-y-8">
      <header>
        <Link to=".." className="text-sm text-slate-500 hover:text-primary-600">← กลับรายการ</Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">ใบชำระเงิน {p.refCode}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {new Date(p.createdAt).toLocaleString('th-TH')} ·{' '}
          <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs">{paymentStatusLabel(p.status)}</span>
        </p>
      </header>

      <section className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-primary-600">รายละเอียด</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="สมาชิก" value={data.member ? `${data.member.memberNo} · ${data.member.fullName}` : '—'} />
            <Row label="รายการ" value={data.fee?.name ?? p.feeCode} />
            <Row
              label="ยอดชำระ"
              value={
                <span className="text-lg font-bold text-primary-700">
                  {Number(p.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
                </span>
              }
            />
            <Row label="ref" value={<span className="font-mono text-xs">{p.refCode}</span>} />
          </dl>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-primary-600">PromptPay QR</h2>
          {data.promptpay ? (
            <div className="mt-4">
              <img src={data.promptpay.qrDataUrl} alt="PromptPay QR" className="mx-auto h-64 w-64 rounded-lg border border-slate-200" />
              <div className="mt-3 text-sm">
                <div className="font-medium text-slate-900">{data.promptpay.holderName ?? 'PromptPay'}</div>
                <div className="font-mono text-xs text-slate-500">{data.promptpay.id}</div>
              </div>
            </div>
          ) : (
            <div className="mt-6 text-sm text-accent-600">
              ยังไม่ได้ตั้งค่า PromptPay —{' '}
              <Link to="/app/settings" className="underline">ไปตั้งค่า</Link>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-primary-600">สลิป</h2>
          <label className="cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium hover:border-primary-500 hover:text-primary-600">
            {upload.isPending ? 'กำลังอัปโหลด...' : p.slipUrl ? 'เปลี่ยนสลิป' : '+ แนบสลิป'}
            <input type="file" accept="image/*,application/pdf" className="hidden" onChange={onPick} disabled={upload.isPending} />
          </label>
        </div>
        {p.slipUrl ? (
          p.slipUrl.endsWith('.pdf') ? (
            <a href={`/api/payments/slip/${p.slipUrl}`} target="_blank" rel="noreferrer" className="mt-4 block text-sm text-primary-600 underline">
              เปิดไฟล์ PDF
            </a>
          ) : (
            <img src={`/api/payments/slip/${p.slipUrl}`} alt="" className="mt-4 max-w-md rounded-lg border border-slate-200" />
          )
        ) : (
          <p className="mt-4 text-sm text-slate-500">ยังไม่ได้แนบสลิป</p>
        )}
      </section>

      {p.status === 'pending' && (
        <section className="flex gap-3">
          <button
            onClick={() => verify.mutate()}
            disabled={verify.isPending}
            className="rounded-lg bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {verify.isPending ? 'กำลังยืนยัน...' : 'ยืนยันการชำระ'}
          </button>
          <button
            onClick={() => {
              if (confirm('ปฏิเสธการชำระนี้?')) reject.mutate();
            }}
            disabled={reject.isPending}
            className="rounded-lg border border-red-200 bg-white px-5 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            ปฏิเสธ
          </button>
        </section>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-xs uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="text-right text-slate-900">{value}</dd>
    </div>
  );
}
