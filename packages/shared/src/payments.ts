import { z } from 'zod';

export const feeConfigCreateSchema = z.object({
  code: z.string().min(1).max(32).regex(/^[a-z0-9_]+$/i, 'lowercase/digit/underscore only'),
  name: z.string().min(1).max(200),
  amount: z.number().nonnegative().max(1_000_000),
  interval: z.enum(['year', 'one_time']).nullable().optional(),
  active: z.boolean().optional(),
});
export const feeConfigUpdateSchema = feeConfigCreateSchema.partial();
export type FeeConfigInput = z.infer<typeof feeConfigCreateSchema>;

export type FeeConfigRow = {
  id: string;
  code: string;
  name: string;
  amount: string;
  interval: 'year' | 'one_time' | null;
  active: boolean;
  createdAt: string;
};

export const paymentCreateSchema = z.object({
  memberId: z.string().uuid(),
  feeCode: z.string().min(1).max(32),
});
export type PaymentCreateInput = z.infer<typeof paymentCreateSchema>;

export type PaymentRow = {
  id: string;
  memberId: string;
  feeCode: string;
  amount: string;
  refCode: string;
  slipUrl: string | null;
  status: 'pending' | 'verified' | 'rejected';
  verifyMethod: 'manual' | 'easyslip' | null;
  verifiedAt: string | null;
  createdAt: string;
};

export const paymentStatusLabel = (s: PaymentRow['status']) =>
  ({ pending: 'รอตรวจสอบ', verified: 'ยืนยันแล้ว', rejected: 'ปฏิเสธ' })[s];

/** Tenant settings shape (stored in tenants.settings jsonb). */
export const tenantSettingsSchema = z.object({
  promptpayId: z
    .string()
    .regex(/^[0-9]{10}$|^[0-9]{13}$/, 'PromptPay must be phone (10 digits) or national ID (13 digits)')
    .optional(),
  promptpayHolderName: z.string().max(200).optional(),
});
export type TenantSettings = z.infer<typeof tenantSettingsSchema>;
