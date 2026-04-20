import { z } from 'zod';

export const farmSlugSchema = z
  .string()
  .min(3)
  .max(32)
  .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'slug must be lowercase a-z 0-9 and hyphens');

export const farmSignupSchema = z.object({
  slug: farmSlugSchema,
  nameTh: z.string().min(2).max(200),
  nameEn: z.string().max(200).optional(),
  contactName: z.string().min(2).max(200),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(9).max(20),
  password: z.string().min(8).max(128),
});
export type FarmSignupInput = z.infer<typeof farmSignupSchema>;

// ---- Herd / Cattle ----
export const farmCattleCreateSchema = z.object({
  earTag: z.string().min(1).max(32),
  regNo: z.string().max(64).optional().nullable(),
  name: z.string().max(200).optional().nullable(),
  breed: z.string().max(100).optional().nullable(),
  sex: z.enum(['male', 'female']),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  color: z.string().max(100).optional().nullable(),
  penId: z.string().uuid().optional().nullable(),
  status: z.enum(['active', 'sold', 'deceased']).optional(),
});
export const farmCattleUpdateSchema = farmCattleCreateSchema.partial();

export const penCreateSchema = z.object({
  name: z.string().min(1).max(100),
  capacity: z.number().int().min(0).max(10_000).default(0),
  notes: z.string().max(500).optional().nullable(),
});
export const penUpdateSchema = penCreateSchema.partial();

// ---- Health ----
export const healthCreateSchema = z.object({
  cattleId: z.string().uuid(),
  type: z.enum(['illness', 'vaccine', 'treatment', 'checkup']),
  title: z.string().min(1).max(200),
  notes: z.string().max(2000).optional().nullable(),
  occurredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  nextDueAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  vetName: z.string().max(200).optional().nullable(),
  cost: z.number().nonnegative().optional().nullable(),
});

// ---- Feed ----
export const feedItemCreateSchema = z.object({
  name: z.string().min(1).max(200),
  unit: z.string().min(1).max(20).default('kg'),
  stockQty: z.number().min(0).default(0),
  costPerUnit: z.number().min(0).default(0),
  reorderLevel: z.number().min(0).default(0),
});
export const feedItemUpdateSchema = feedItemCreateSchema.partial();

// ---- Milk ----
export const milkCreateSchema = z.object({
  cattleId: z.string().uuid(),
  recordedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  session: z.enum(['morning', 'afternoon', 'evening']).default('morning'),
  kg: z.number().nonnegative().max(100),
  fatPct: z.number().min(0).max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

// ---- Breeding ----
export const breedingCreateSchema = z.object({
  damId: z.string().uuid(),
  sireId: z.string().uuid().optional().nullable(),
  sireExternalLabel: z.string().max(200).optional().nullable(),
  method: z.enum(['AI', 'natural']),
  bredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dueAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});
export const breedingUpdateSchema = z.object({
  result: z.enum(['pending', 'confirmed', 'failed', 'calved']).optional(),
  checkedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  dueAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  calvedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  calfId: z.string().uuid().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

// ---- Finance ----
export const financeCreateSchema = z.object({
  occurredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(['income', 'expense']),
  category: z.string().min(1).max(100),
  amount: z.number().positive().max(100_000_000),
  notes: z.string().max(500).optional().nullable(),
  ref: z.string().max(100).optional().nullable(),
});
export const financeUpdateSchema = financeCreateSchema.partial();

// ---- Labels ----
export const healthTypeLabel = (t: 'illness' | 'vaccine' | 'treatment' | 'checkup') =>
  ({ illness: 'เจ็บป่วย', vaccine: 'วัคซีน', treatment: 'รักษา', checkup: 'ตรวจสุขภาพ' }[t]);
export const breedingResultLabel = (r: 'pending' | 'confirmed' | 'failed' | 'calved') =>
  ({ pending: 'รอตรวจ', confirmed: 'ตั้งท้อง', failed: 'ไม่ติด', calved: 'คลอดแล้ว' }[r]);
export const financeTypeLabel = (t: 'income' | 'expense') => (t === 'income' ? 'รายรับ' : 'รายจ่าย');
export const farmCattleStatusLabel = (s: 'active' | 'sold' | 'deceased') =>
  ({ active: 'อยู่ในฟาร์ม', sold: 'ขายแล้ว', deceased: 'ตาย' }[s]);
