-- Assessment requests and contact enquiries.
--
-- Brief section 28: D1 for leads, consent and assessment requests; prepared
-- queries; no raw scan dumps or sensitive form bodies; retention documented
-- before production.
--
-- Consent is stored as an explicit record (text, version and timestamp), not a
-- bare boolean, so it can be shown later exactly as the person agreed to it.

CREATE TABLE IF NOT EXISTS submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL CHECK (kind IN ('readiness', 'contact')),

  full_name TEXT NOT NULL,
  business_email TEXT NOT NULL,
  company TEXT NOT NULL,
  role TEXT,
  website_url TEXT,

  primary_concern TEXT,
  trigger_now TEXT,
  business_result TEXT,
  current_manager TEXT,
  consequence_six_months TEXT,
  enquiry_type TEXT,

  consent_given INTEGER NOT NULL CHECK (consent_given IN (0, 1)),
  consent_text TEXT NOT NULL,
  consent_version TEXT NOT NULL,

  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  -- Retention: reviewed and deleted per the published privacy notice. Kept as
  -- a column so a retention job can act without re-deriving it.
  retain_until TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_submissions_created ON submissions (created_at);
CREATE INDEX IF NOT EXISTS idx_submissions_kind ON submissions (kind, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_submissions_reference ON submissions (reference);

-- Rate limiting by coarse client key. Holds no message content and no PII
-- beyond a hashed key, so it can be pruned aggressively.
CREATE TABLE IF NOT EXISTS submission_throttle (
  client_key TEXT PRIMARY KEY,
  window_start TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1
);
