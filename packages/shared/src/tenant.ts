import { z } from 'zod';

export const tenantSlugSchema = z
  .string()
  .min(3)
  .max(32)
  .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'slug must be lowercase a-z 0-9 and hyphens');

export const orgTypeSchema = z.enum(['association', 'cooperative', 'enterprise', 'group', 'other']);
export type OrgType = z.infer<typeof orgTypeSchema>;

export const tenantSignupSchema = z.object({
  slug: tenantSlugSchema,
  nameTh: z.string().min(2).max(200),
  nameEn: z.string().max(200).optional(),
  orgType: orgTypeSchema.default('association'),
  contactName: z.string().min(2).max(200),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(9).max(20),
  password: z.string().min(8).max(128),
});

export type TenantSignupInput = z.infer<typeof tenantSignupSchema>;

/** Short label for the organization type (e.g. "สมาคม", "วิสาหกิจ"). */
export function orgTypeLabel(t: OrgType): string {
  return (
    {
      association: 'สมาคม',
      cooperative: 'สหกรณ์',
      enterprise: 'วิสาหกิจชุมชน',
      group: 'กลุ่มเลี้ยงวัว',
      other: 'องค์กร',
    } as const
  )[t];
}

/** Short verb: สมัคร<type> / เป็นสมาชิก<type>. Used in copy. */
export function orgTypeShort(t: OrgType): string {
  return (
    {
      association: 'สมาคม',
      cooperative: 'สหกรณ์',
      enterprise: 'วิสาหกิจ',
      group: 'กลุ่ม',
      other: 'องค์กร',
    } as const
  )[t];
}

export const ORG_TYPE_OPTIONS: { value: OrgType; label: string; hint: string }[] = [
  { value: 'association', label: 'สมาคม', hint: 'สมาคมผู้เลี้ยงโค (มีใบจดทะเบียนสมาคม)' },
  { value: 'cooperative', label: 'สหกรณ์', hint: 'สหกรณ์ผู้เลี้ยงโค/สหกรณ์โคนม' },
  { value: 'enterprise', label: 'วิสาหกิจชุมชน', hint: 'วิสาหกิจชุมชนที่จดทะเบียนกับกรมฯ' },
  { value: 'group', label: 'กลุ่มเลี้ยงวัว', hint: 'กลุ่มเกษตรกรผู้เลี้ยงโคที่ยังไม่ได้จดทะเบียน' },
  { value: 'other', label: 'องค์กรอื่น', hint: 'ไม่ตรงกับรายการข้างบน' },
];

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
