-- Additive migration: add organization_type enum + tenants.org_type column.
-- Existing rows default to 'association'.
DO $$ BEGIN
  CREATE TYPE organization_type AS ENUM ('association', 'cooperative', 'enterprise', 'group', 'other');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS org_type organization_type NOT NULL DEFAULT 'association';
