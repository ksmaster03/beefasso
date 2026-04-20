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

// ---- Cattle Pro enums ----
export const farmStatus = pgEnum('farm_status', ['active', 'suspended']);
export const farmRole = pgEnum('farm_role', ['owner', 'admin', 'staff']);
export const farmCattleStatus = pgEnum('farm_cattle_status', ['active', 'sold', 'deceased']);
export const healthType = pgEnum('health_type', ['illness', 'vaccine', 'treatment', 'checkup']);
export const breedingMethod = pgEnum('breeding_method', ['AI', 'natural']);
export const breedingResult = pgEnum('breeding_result', ['pending', 'confirmed', 'failed', 'calved']);
export const financeType = pgEnum('finance_type', ['income', 'expense']);

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

// ============================================================
// Cattle Pro — farm management SaaS (separate tenancy from Jungdee)
// ============================================================

export const farms = pgTable('farms', {
  id: uuid().primaryKey().defaultRandom(),
  slug: text().notNull().unique(),
  nameTh: text().notNull(),
  nameEn: text(),
  ownerUserId: uuid().notNull().references(() => users.id, { onDelete: 'restrict' }),
  tenantId: uuid().references(() => tenants.id, { onDelete: 'set null' }), // optional link to Jungdee association
  status: farmStatus().notNull().default('active'),
  plan: text().notNull().default('free'),
  settings: jsonb().notNull().default({}),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const farmUsers = pgTable(
  'farm_users',
  {
    farmId: uuid().notNull().references(() => farms.id, { onDelete: 'cascade' }),
    userId: uuid().notNull().references(() => users.id, { onDelete: 'cascade' }),
    role: farmRole().notNull(),
    active: boolean().notNull().default(true),
  },
  (t) => [uniqueIndex('farm_users_pk').on(t.farmId, t.userId), index('farm_users_user').on(t.userId)],
);

export const farmPens = pgTable(
  'farm_pens',
  {
    id: uuid().primaryKey().defaultRandom(),
    farmId: uuid().notNull().references(() => farms.id, { onDelete: 'cascade' }),
    name: text().notNull(),
    capacity: integer().notNull().default(0),
    notes: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('farm_pens_name').on(t.farmId, t.name)],
);

export const farmCattle = pgTable(
  'farm_cattle',
  {
    id: uuid().primaryKey().defaultRandom(),
    farmId: uuid().notNull().references(() => farms.id, { onDelete: 'cascade' }),
    earTag: text().notNull(),
    regNo: text(),
    name: text(),
    breed: text(),
    sex: cattleSex().notNull(),
    dob: date(),
    color: text(),
    status: farmCattleStatus().notNull().default('active'),
    penId: uuid(),
    // Optional link to the tenant-registry cattle if owner registered it with a Jungdee association.
    registryCattleId: uuid(),
    photoUrls: text().array().notNull().default(sql`'{}'::text[]`),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('farm_cattle_tag').on(t.farmId, t.earTag),
    index('farm_cattle_pen').on(t.farmId, t.penId),
    index('farm_cattle_status').on(t.farmId, t.status),
  ],
);

export const healthRecords = pgTable(
  'health_records',
  {
    id: uuid().primaryKey().defaultRandom(),
    farmId: uuid().notNull().references(() => farms.id, { onDelete: 'cascade' }),
    cattleId: uuid().notNull(),
    type: healthType().notNull(),
    title: text().notNull(),
    notes: text(),
    occurredAt: date().notNull(),
    nextDueAt: date(),
    vetName: text(),
    cost: numeric({ precision: 12, scale: 2 }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('health_records_farm_cattle').on(t.farmId, t.cattleId), index('health_records_due').on(t.farmId, t.nextDueAt)],
);

export const feedItems = pgTable(
  'feed_items',
  {
    id: uuid().primaryKey().defaultRandom(),
    farmId: uuid().notNull().references(() => farms.id, { onDelete: 'cascade' }),
    name: text().notNull(),
    unit: text().notNull().default('kg'),
    stockQty: numeric({ precision: 12, scale: 2 }).notNull().default('0'),
    costPerUnit: numeric({ precision: 12, scale: 2 }).notNull().default('0'),
    reorderLevel: numeric({ precision: 12, scale: 2 }).notNull().default('0'),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('feed_items_name').on(t.farmId, t.name)],
);

export const feedRecipes = pgTable(
  'feed_recipes',
  {
    id: uuid().primaryKey().defaultRandom(),
    farmId: uuid().notNull().references(() => farms.id, { onDelete: 'cascade' }),
    name: text().notNull(),
    // items: [{ feedItemId, quantity, unit }]
    items: jsonb().notNull().default([]),
    notes: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
);

export const milkRecords = pgTable(
  'milk_records',
  {
    id: uuid().primaryKey().defaultRandom(),
    farmId: uuid().notNull().references(() => farms.id, { onDelete: 'cascade' }),
    cattleId: uuid().notNull(),
    recordedAt: date().notNull(),
    // morning, afternoon, evening
    session: text().notNull().default('morning'),
    kg: numeric({ precision: 8, scale: 2 }).notNull(),
    fatPct: numeric({ precision: 5, scale: 2 }),
    notes: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('milk_records_farm_cattle_date').on(t.farmId, t.cattleId, t.recordedAt)],
);

export const breedingRecords = pgTable(
  'breeding_records',
  {
    id: uuid().primaryKey().defaultRandom(),
    farmId: uuid().notNull().references(() => farms.id, { onDelete: 'cascade' }),
    damId: uuid().notNull(),
    sireId: uuid(),
    sireExternalLabel: text(), // when sire isn't in the farm's herd
    method: breedingMethod().notNull(),
    bredAt: date().notNull(),
    result: breedingResult().notNull().default('pending'),
    checkedAt: date(),
    dueAt: date(),
    calvedAt: date(),
    calfId: uuid(),
    notes: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('breeding_records_farm_dam').on(t.farmId, t.damId)],
);

export const financeEntries = pgTable(
  'finance_entries',
  {
    id: uuid().primaryKey().defaultRandom(),
    farmId: uuid().notNull().references(() => farms.id, { onDelete: 'cascade' }),
    occurredAt: date().notNull(),
    type: financeType().notNull(),
    category: text().notNull(),
    amount: numeric({ precision: 14, scale: 2 }).notNull(),
    notes: text(),
    ref: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('finance_entries_farm_date').on(t.farmId, t.occurredAt)],
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
