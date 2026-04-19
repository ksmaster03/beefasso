import { z } from 'zod';

export const cattleSexSchema = z.enum(['male', 'female']);

export const cattleCreateSchema = z.object({
  regNo: z.string().min(1).max(64),
  earTag: z.string().min(1).max(32),
  name: z.string().max(200).optional().nullable(),
  breed: z.string().max(100).optional().nullable(),
  sex: cattleSexSchema,
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD').optional().nullable(),
  color: z.string().max(100).optional().nullable(),
  sireId: z.string().uuid().optional().nullable(),
  damId: z.string().uuid().optional().nullable(),
  currentOwnerId: z.string().uuid().optional().nullable(),
});

export const cattleUpdateSchema = cattleCreateSchema.partial();

export type CattleCreateInput = z.infer<typeof cattleCreateSchema>;

export type CattleRow = {
  id: string;
  regNo: string;
  earTag: string;
  name: string | null;
  breed: string | null;
  sex: 'male' | 'female';
  dob: string | null;
  color: string | null;
  sireId: string | null;
  damId: string | null;
  currentOwnerId: string | null;
  photoUrls: string[];
  createdAt: string;
};

export type PedigreeNode = {
  id: string;
  regNo: string;
  name: string | null;
  sex: 'male' | 'female';
  sireId: string | null;
  damId: string | null;
};

export const cattleSexLabel = (s: 'male' | 'female') => (s === 'male' ? 'เพศผู้' : 'เพศเมีย');
