const ROOT = process.env.ROOT_DOMAIN ?? 'jungdee.growgenius.co.th';

export type TenantContext =
  | { kind: 'platform' }
  | { kind: 'tenant'; slug: string };

export function resolveTenantFromHost(host: string | null | undefined): TenantContext {
  if (!host) return { kind: 'platform' };
  const h = host.toLowerCase().split(':')[0];

  if (h === ROOT) return { kind: 'platform' };

  if (h.endsWith(`.${ROOT}`)) {
    const slug = h.slice(0, -(ROOT.length + 1));
    if (slug && slug !== 'www') return { kind: 'tenant', slug };
  }

  // Local dev: <slug>.localhost
  if (h.endsWith('.localhost')) {
    const slug = h.slice(0, -'.localhost'.length);
    if (slug && slug !== 'www') return { kind: 'tenant', slug };
  }

  return { kind: 'platform' };
}
