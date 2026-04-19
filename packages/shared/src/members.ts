import { z } from 'zod';

export const memberTypeSchema = z.enum(['annual', 'lifetime', 'honorary']);
export const memberStatusSchema = z.enum(['active', 'expired', 'suspended']);

export const memberCreateSchema = z.object({
  memberNo: z.string().min(1).max(32).optional(), // auto-gen if missing
  fullName: z.string().min(1).max(200),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email().max(200).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  type: memberTypeSchema,
  expiredAt: z.string().datetime().optional().nullable(), // ISO string
});

export const memberUpdateSchema = memberCreateSchema.partial().extend({
  status: memberStatusSchema.optional(),
});

export type MemberCreateInput = z.infer<typeof memberCreateSchema>;
export type MemberUpdateInput = z.infer<typeof memberUpdateSchema>;

export type MemberRow = {
  id: string;
  memberNo: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  type: 'annual' | 'lifetime' | 'honorary';
  status: 'active' | 'expired' | 'suspended';
  joinedAt: string;
  expiredAt: string | null;
  createdAt: string;
};

export function memberTypeLabel(t: MemberRow['type']): string {
  return { annual: 'รายปี', lifetime: 'ตลอดชีพ', honorary: 'กิตติมศักดิ์' }[t];
}

export function memberStatusLabel(s: MemberRow['status']): string {
  return { active: 'ใช้งาน', expired: 'หมดอายุ', suspended: 'ระงับ' }[s];
}
