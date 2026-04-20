BEGIN;

CREATE TYPE feedback_type AS ENUM ('complaint', 'compliment', 'bug', 'suggestion');
CREATE TYPE feedback_status AS ENUM ('new', 'reviewed', 'resolved', 'dismissed');

CREATE TABLE feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product text NOT NULL,
  type feedback_type NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  contact_name text,
  contact_email text,
  contact_phone text,
  page_url text,
  user_agent text,
  submitter_user_id uuid,
  tenant_id uuid,
  farm_id uuid,
  status feedback_status NOT NULL DEFAULT 'new',
  google_task_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX feedback_status_idx ON feedback(status);
CREATE INDEX feedback_created_idx ON feedback(created_at DESC);

CREATE TABLE platform_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMIT;
