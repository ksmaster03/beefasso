-- One-off fix for Thai mojibake in test data seeded via Windows Git Bash curl
SET client_encoding TO 'UTF8';

-- Tenant
UPDATE tenants SET name_th = 'สมาคมผู้เลี้ยงโคราชสายพันธุ์พื้นเมือง'
WHERE slug = 'korat';

-- Users (owner + super admin names stay intact in ASCII)
UPDATE users SET name = 'สมชาย ใจดี' WHERE email = 'somchai@korat.example';

-- Switch to korat tenant context so RLS permits updates.
SET LOCAL app.tenant_id = (SELECT id FROM tenants WHERE slug = 'korat' LIMIT 1);

-- Cattle
UPDATE cattle SET name = 'พ่อพันธุ์ทอง', color = 'แดง' WHERE reg_no = 'KR-S-001';
UPDATE cattle SET name = 'แม่พันธุ์ขาว', color = 'ขาว' WHERE reg_no = 'KR-D-001';
UPDATE cattle SET name = 'ลูกน้อย',       color = 'แดง' WHERE reg_no = 'KR-C-001';

-- Members
UPDATE members SET full_name = 'สมชาย ผู้ทดสอบ' WHERE member_no = 'M00001';

-- Drop existing certificate so it gets re-issued with corrected snapshot.
DELETE FROM certificates WHERE cert_no = 'KORAT-2026-00001';
