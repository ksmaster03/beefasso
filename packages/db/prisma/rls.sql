-- Row-Level Security policies for tenant isolation
-- Apply AFTER `prisma db push` or `prisma migrate deploy`.
-- Uses `current_setting('app.tenant_id', true)` set via withTenant() helper.

-- Enable RLS
ALTER TABLE fee_configs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE members       ENABLE ROW LEVEL SECURITY;
ALTER TABLE cattle        ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates  ENABLE ROW LEVEL SECURITY;

-- Drop old policies if re-running
DROP POLICY IF EXISTS tenant_isolation ON fee_configs;
DROP POLICY IF EXISTS tenant_isolation ON members;
DROP POLICY IF EXISTS tenant_isolation ON cattle;
DROP POLICY IF EXISTS tenant_isolation ON payments;
DROP POLICY IF EXISTS tenant_isolation ON certificates;

-- Create policies
CREATE POLICY tenant_isolation ON fee_configs
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON members
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON cattle
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON payments
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON certificates
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Note: Prisma connects as DB owner by default, which BYPASSES RLS.
-- For RLS to be enforced, either:
--   (a) create a non-superuser role and connect Prisma as that role, OR
--   (b) FORCE row level security on each table:
ALTER TABLE fee_configs   FORCE ROW LEVEL SECURITY;
ALTER TABLE members       FORCE ROW LEVEL SECURITY;
ALTER TABLE cattle        FORCE ROW LEVEL SECURITY;
ALTER TABLE payments      FORCE ROW LEVEL SECURITY;
ALTER TABLE certificates  FORCE ROW LEVEL SECURITY;
