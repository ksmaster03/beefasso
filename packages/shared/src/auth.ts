import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});

export type LoginInput = z.infer<typeof loginSchema>;

export type SessionUser = {
  userId: string;
  email: string;
  name: string;
  platformRole: 'super_admin' | 'user';
  tenantId?: string;
  tenantRole?: 'owner' | 'admin' | 'staff' | 'member';
  farmId?: string;
  farmRole?: 'owner' | 'admin' | 'staff';
  farmSlug?: string;
};
