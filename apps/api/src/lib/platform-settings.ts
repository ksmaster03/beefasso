/**
 * Thin wrapper over the platform_settings key/value table so routes can
 * read/write structured settings without re-implementing the
 * upsert-with-default dance each time.
 */
import { eq } from 'drizzle-orm';
import { db, platformSettings } from '@beefasso/db';
import type { OrgType } from '@beefasso/shared';

export type AutoApproveSetting = Record<OrgType, boolean>;

const DEFAULT_AUTO_APPROVE: AutoApproveSetting = {
  association: false,
  cooperative: false,
  enterprise: false,
  group: false,
  other: false,
};

const KEY = 'auto_approve_tenants';

export async function getAutoApprove(): Promise<AutoApproveSetting> {
  const [row] = await db.select().from(platformSettings).where(eq(platformSettings.key, KEY));
  if (!row) return { ...DEFAULT_AUTO_APPROVE };
  const v = (row.value ?? {}) as Partial<AutoApproveSetting>;
  return { ...DEFAULT_AUTO_APPROVE, ...v };
}

export async function setAutoApprove(next: AutoApproveSetting): Promise<void> {
  await db
    .insert(platformSettings)
    .values({ key: KEY, value: next })
    .onConflictDoUpdate({ target: platformSettings.key, set: { value: next, updatedAt: new Date() } });
}
