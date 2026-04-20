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

-- ============================================================
-- Cattle Pro: farm-scoped tables (session var app.farm_id)
-- ============================================================

DO $$ BEGIN
  PERFORM 'farm_pens'::regclass;
  PERFORM 'farm_cattle'::regclass;
  PERFORM 'health_records'::regclass;
  PERFORM 'feed_items'::regclass;
  PERFORM 'feed_recipes'::regclass;
  PERFORM 'milk_records'::regclass;
  PERFORM 'breeding_records'::regclass;
  PERFORM 'finance_entries'::regclass;
EXCEPTION WHEN undefined_table THEN RETURN; END $$;

ALTER TABLE farm_pens         ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_cattle       ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_records    ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_recipes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE milk_records      ENABLE ROW LEVEL SECURITY;
ALTER TABLE breeding_records  ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_entries   ENABLE ROW LEVEL SECURITY;

ALTER TABLE farm_pens         FORCE ROW LEVEL SECURITY;
ALTER TABLE farm_cattle       FORCE ROW LEVEL SECURITY;
ALTER TABLE health_records    FORCE ROW LEVEL SECURITY;
ALTER TABLE feed_items        FORCE ROW LEVEL SECURITY;
ALTER TABLE feed_recipes      FORCE ROW LEVEL SECURITY;
ALTER TABLE milk_records      FORCE ROW LEVEL SECURITY;
ALTER TABLE breeding_records  FORCE ROW LEVEL SECURITY;
ALTER TABLE finance_entries   FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS farm_isolation ON farm_pens;
DROP POLICY IF EXISTS farm_isolation ON farm_cattle;
DROP POLICY IF EXISTS farm_isolation ON health_records;
DROP POLICY IF EXISTS farm_isolation ON feed_items;
DROP POLICY IF EXISTS farm_isolation ON feed_recipes;
DROP POLICY IF EXISTS farm_isolation ON milk_records;
DROP POLICY IF EXISTS farm_isolation ON breeding_records;
DROP POLICY IF EXISTS farm_isolation ON finance_entries;

CREATE POLICY farm_isolation ON farm_pens        USING (farm_id = current_setting('app.farm_id', true)::uuid) WITH CHECK (farm_id = current_setting('app.farm_id', true)::uuid);
CREATE POLICY farm_isolation ON farm_cattle      USING (farm_id = current_setting('app.farm_id', true)::uuid) WITH CHECK (farm_id = current_setting('app.farm_id', true)::uuid);
CREATE POLICY farm_isolation ON health_records   USING (farm_id = current_setting('app.farm_id', true)::uuid) WITH CHECK (farm_id = current_setting('app.farm_id', true)::uuid);
CREATE POLICY farm_isolation ON feed_items       USING (farm_id = current_setting('app.farm_id', true)::uuid) WITH CHECK (farm_id = current_setting('app.farm_id', true)::uuid);
CREATE POLICY farm_isolation ON feed_recipes     USING (farm_id = current_setting('app.farm_id', true)::uuid) WITH CHECK (farm_id = current_setting('app.farm_id', true)::uuid);
CREATE POLICY farm_isolation ON milk_records     USING (farm_id = current_setting('app.farm_id', true)::uuid) WITH CHECK (farm_id = current_setting('app.farm_id', true)::uuid);
CREATE POLICY farm_isolation ON breeding_records USING (farm_id = current_setting('app.farm_id', true)::uuid) WITH CHECK (farm_id = current_setting('app.farm_id', true)::uuid);
CREATE POLICY farm_isolation ON finance_entries  USING (farm_id = current_setting('app.farm_id', true)::uuid) WITH CHECK (farm_id = current_setting('app.farm_id', true)::uuid);
