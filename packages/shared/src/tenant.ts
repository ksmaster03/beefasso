import { z } from 'zod';

export const tenantSlugSchema = z
  .string()
  .min(3)
  .max(32)
  .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'slug must be lowercase a-z 0-9 and hyphens');

export const tenantSignupSchema = z.object({
  slug: tenantSlugSchema,
  nameTh: z.string().min(2).max(200),
  nameEn: z.string().max(200).optional(),
  contactName: z.string().min(2).max(200),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(9).max(20),
  password: z.string().min(8).max(128),
});

export type TenantSignupInput = z.infer<typeof tenantSignupSchema>;

const ROOT = (typeof process !== 'undefined' && process.env.ROOT_DOMAIN) || 'jungdee.growgenius.co.th';

export type TenantContext =
  | { kind: 'platform' }
  | { kind: 'tenant'; slug: string };

export function resolveTenantFromHost(host: string | null | undefined, root = ROOT): TenantContext {
  if (!host) return { kind: 'platform' };
  const h = host.toLowerCase().split(':')[0]!;
  if (h === root) return { kind: 'platform' };
  if (h.endsWith(`.${root}`)) {
    const slug = h.slice(0, -(root.length + 1));
    if (slug && slug !== 'www') return { kind: 'tenant', slug };
  }
  if (h.endsWith('.localhost')) {
    const slug = h.slice(0, -'.localhost'.length);
    if (slug && slug !== 'www') return { kind: 'tenant', slug };
  }
  return { kind: 'platform' };
}
