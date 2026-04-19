/**
 * Jungdee / Beefasso — Drizzle schema
 * Multi-tenant: every business table carries `tenant_id`, enforced by Postgres RLS.
 * See `rls.sql` for policies applied after migrations.
 */
import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  numeric,
  integer,
  jsonb,
  pgEnum,
  uniqueIndex,
  index,
  date,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ============ enums ============

export const tenantStatus = pgEnum('tenant_status', ['pending', 'active', 'suspended']);
export const platformRole = pgEnum('platform_role', ['super_admin', 'user']);
export const tenantRole = pgEnum('tenant_role', ['owner', 'admin', 'staff', 'member']);
export const memberType = pgEnum('member_type', ['annual', 'lifetime', 'honorary']);
export const memberStatus = pgEnum('member_status', ['active', 'expired', 'suspended']);
export const cattleSex = pgEnum('cattle_sex', ['male', 'female']);
export const paymentStatus = pgEnum('payment_status', ['pending', 'verified', 'rejected']);
export const verifyMethod = pgEnum('verify_method', ['manual', 'easyslip']);

// ============ platform ============

export const tenants = pgTable('tenants', {
  id: uuid().primaryKey().defaultRandom(),
  slug: text().notNull().unique(),
  nameTh: text().notNull(),
  nameEn: text(),
  logoUrl: text(),
  status: tenantStatus().notNull().default('pending'),
  plan: text().notNull().default('free'),
  settings: jsonb().notNull().default({}),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  approvedAt: timestamp({ withTimezone: true }),
});

export const users = pgTable('users', {
  id: uuid().primaryKey().defaultRandom(),
  email: text().notNull().unique(),
  passwordHash: text().notNull(),
  name: text().notNull(),
  platformRole: platformRole().notNull().default('user'),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const tenantUsers = pgTable(
  'tenant_users',
  {
    tenantId: uuid().notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    userId: uuid().notNull().references(() => users.id, { onDelete: 'cascade' }),
    role: tenantRole().notNull(),
    active: boolean().notNull().default(true),
    memberId: uuid(),
  },
  (t) => [
    uniqueIndex('tenant_users_pk').on(t.tenantId, t.userId),
    index('tenant_users_user_idx').on(t.userId),
  ],
);

// ============ tenant-scoped business tables (RLS enforced) ============

export const feeConfigs = pgTable(
  'fee_configs',
  {
    id: uuid().primaryKey().defaultRandom(),
    tenantId: uuid().notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    code: text().notNull(),
    name: text().notNull(),
    amount: numeric({ precision: 12, scale: 2 }).notNull(),
    interval: text(), // 'year' | 'one_time' | null
    active: boolean().notNull().default(true),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('fee_configs_tenant_code').on(t.tenantId, t.code)],
);

export const members = pgTable(
  'members',
  {
    id: uuid().primaryKey().defaultRandom(),
    tenantId: uuid().notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    memberNo: text().notNull(),
    fullName: text().notNull(),
    phone: text(),
    email: text(),
    address: text(),
    type: memberType().notNull(),
    status: memberStatus().notNull().default('active'),
    joinedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    expiredAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('members_tenant_no').on(t.tenantId, t.memberNo),
    index('members_tenant_status').on(t.tenantId, t.status),
  ],
);

export const cattle = pgTable(
  'cattle',
  {
    id: uuid().primaryKey().defaultRandom(),
    tenantId: uuid().notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    regNo: text().notNull(),
    earTag: text().notNull(),
    name: text(),
    breed: text(),
    sex: cattleSex().notNull(),
    dob: date(),
    color: text(),
    sireId: uuid(),
    damId: uuid(),
    currentOwnerId: uuid(),
    photoUrls: text().array().notNull().default(sql`'{}'::text[]`),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('cattle_tenant_regno').on(t.tenantId, t.regNo),
    uniqueIndex('cattle_tenant_eartag').on(t.tenantId, t.earTag),
    index('cattle_tenant_sire').on(t.tenantId, t.sireId),
    index('cattle_tenant_dam').on(t.tenantId, t.damId),
  ],
);

export const payments = pgTable(
  'payments',
  {
    id: uuid().primaryKey().defaultRandom(),
    tenantId: uuid().notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    memberId: uuid().notNull(),
    feeCode: text().notNull(),
    amount: numeric({ precision: 12, scale: 2 }).notNull(),
    refCode: text().notNull(),
    slipUrl: text(),
    status: paymentStatus().notNull().default('pending'),
    verifyMethod: verifyMethod(),
    verifiedBy: uuid(),
    verifiedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('payments_tenant_ref').on(t.tenantId, t.refCode),
    index('payments_tenant_status').on(t.tenantId, t.status),
  ],
);

export const certificates = pgTable(
  'certificates',
  {
    id: uuid().primaryKey().defaultRandom(),
    tenantId: uuid().notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    cattleId: uuid().notNull(),
    certNo: text().notNull(),
    issuedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    pdfS3Key: text().notNull(),
    verifyHash: text().notNull().unique(),
    // Snapshot of cattle, pedigree, owner, tenant at issue time - used for
    // public verify pages and ensures the record stays immutable even if the
    // underlying data changes.
    snapshot: jsonb().notNull().default({}),
  },
  (t) => [uniqueIndex('certificates_tenant_no').on(t.tenantId, t.certNo)],
);
