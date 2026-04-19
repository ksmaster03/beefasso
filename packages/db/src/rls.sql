-- Row-Level Security policies for tenant isolation.
-- Applied by `bun run db:rls` after `drizzle-kit push`.

ALTER TABLE fee_configs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE members      ENABLE ROW LEVEL SECURITY;
ALTER TABLE cattle       ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- FORCE so even table owner (app DB user) is subject to RLS.
ALTER TABLE fee_configs  FORCE ROW LEVEL SECURITY;
ALTER TABLE members      FORCE ROW LEVEL SECURITY;
ALTER TABLE cattle       FORCE ROW LEVEL SECURITY;
ALTER TABLE payments     FORCE ROW LEVEL SECURITY;
ALTER TABLE certificates FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON fee_configs;
DROP POLICY IF EXISTS tenant_isolation ON members;
DROP POLICY IF EXISTS tenant_isolation ON cattle;
DROP POLICY IF EXISTS tenant_isolation ON payments;
DROP POLICY IF EXISTS tenant_isolation ON certificates;

-- Policies use current_setting('app.tenant_id', true) which is NULL when unset.
-- When NULL, the comparison fails and no rows are visible — safe default.
CREATE POLICY tenant_isolation ON fee_configs
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON members
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON cattle
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON payments
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON certificates
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);
