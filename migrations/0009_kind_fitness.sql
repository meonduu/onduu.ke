-- The Digital Fitness rename (v4.64.0) changed the stored form kind from
-- 'readiness' to 'fitness', but left this CHECK constraint naming the old
-- vocabulary:
--
--   kind TEXT NOT NULL CHECK (kind IN ('readiness', 'contact'))
--
-- Every assessment submission after that deploy therefore failed the insert
-- and returned 500. The visitor saw an error rather than losing the enquiry
-- silently, and the table happened to be empty, so nothing was lost — but
-- the conversion path was down for roughly forty minutes on 20 Aug 2026.
--
-- SQLite cannot alter a CHECK constraint in place, so the table is rebuilt.
-- 'readiness' stays in the allowed set: historical rows may carry it, and
-- normaliseKind() in worker/submissions.ts still accepts it from a browser
-- tab that predates the rename. The constraint widens; it never narrows.

PRAGMA foreign_keys = OFF;

CREATE TABLE submissions_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL CHECK (kind IN ('fitness', 'contact', 'readiness')),

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
  retain_until TEXT NOT NULL,

  referrer TEXT,
  landing_path TEXT,
  submitted_from TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT
);

INSERT INTO submissions_new (
  id, reference, kind, full_name, business_email, company, role, website_url,
  primary_concern, trigger_now, business_result, current_manager,
  consequence_six_months, enquiry_type,
  consent_given, consent_text, consent_version, created_at, retain_until,
  referrer, landing_path, submitted_from,
  utm_source, utm_medium, utm_campaign, utm_term, utm_content
)
SELECT
  id, reference, kind, full_name, business_email, company, role, website_url,
  primary_concern, trigger_now, business_result, current_manager,
  consequence_six_months, enquiry_type,
  consent_given, consent_text, consent_version, created_at, retain_until,
  referrer, landing_path, submitted_from,
  utm_source, utm_medium, utm_campaign, utm_term, utm_content
FROM submissions;

DROP TABLE submissions;
ALTER TABLE submissions_new RENAME TO submissions;

CREATE INDEX IF NOT EXISTS idx_submissions_created ON submissions (created_at);
CREATE INDEX IF NOT EXISTS idx_submissions_kind ON submissions (kind, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_submissions_reference ON submissions (reference);
CREATE INDEX IF NOT EXISTS idx_submissions_source ON submissions (utm_source, created_at);

PRAGMA foreign_keys = ON;
