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

export type TenantContext =
  | { kind: 'platform' }
  | { kind: 'tenant'; slug: string; basePath: string };

/**
 * Resolve tenant from URL pathname.
 * Pattern: /t/:slug[/...]
 * - /t/korat         -> { kind: 'tenant', slug: 'korat', basePath: '/t/korat' }
 * - /t/korat/app/x   -> { kind: 'tenant', slug: 'korat', basePath: '/t/korat' }
 * - /signup          -> { kind: 'platform' }
 */
export function resolveTenantFromPath(pathname: string): TenantContext {
  const m = pathname.match(/^\/t\/([a-z0-9][a-z0-9-]*[a-z0-9])(?:\/|$)/);
  if (m) return { kind: 'tenant', slug: m[1]!, basePath: `/t/${m[1]}` };
  return { kind: 'platform' };
}

/** Build a URL for a tenant page. */
export function tenantUrl(slug: string, subPath = '/'): string {
  const clean = subPath.startsWith('/') ? subPath : `/${subPath}`;
  return `/t/${slug}${clean === '/' ? '' : clean}`;
}
