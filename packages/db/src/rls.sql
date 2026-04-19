-- Row-Level Security policies for tenant isolation.
-- Applied by `bun run db:rls` after `drizzle-kit push`.

ALTER TABLE fee_configs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE members      ENABLE ROW LEVEL SECURITY;
ALTER TABLE cattle       ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

ALTER TABLE fee_configs  FORCE ROW LEVEL SECURITY;
ALTER TABLE members      FORCE ROW LEVEL SECURITY;
ALTER TABLE cattle       FORCE ROW LEVEL SECURITY;
ALTER TABLE payments     FORCE ROW LEVEL SECURITY;
ALTER TABLE certificates FORCE ROW LEVEL SECURITY;

-- Drop old combined policies first (idempotent re-run).
DROP POLICY IF EXISTS tenant_isolation ON fee_configs;
DROP POLICY IF EXISTS tenant_isolation ON members;
DROP POLICY IF EXISTS tenant_isolation ON cattle;
DROP POLICY IF EXISTS tenant_isolation ON payments;
DROP POLICY IF EXISTS tenant_isolation ON certificates;

DROP POLICY IF EXISTS cert_public_select ON certificates;
DROP POLICY IF EXISTS cert_tenant_write  ON certificates;
DROP POLICY IF EXISTS cert_tenant_update ON certificates;
DROP POLICY IF EXISTS cert_tenant_delete ON certificates;

-- Standard tenant-scoped policies (USING + WITH CHECK).
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

-- Certificates: reads are public (verify pages), writes are tenant-scoped.
CREATE POLICY cert_public_select ON certificates FOR SELECT USING (true);
CREATE POLICY cert_tenant_write ON certificates FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY cert_tenant_update ON certificates FOR UPDATE
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY cert_tenant_delete ON certificates FOR DELETE
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
