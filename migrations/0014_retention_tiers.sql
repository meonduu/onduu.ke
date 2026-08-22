-- Retention for enquiries. Owner decision, 22 August 2026.
--
-- An enquiry is three things with very different useful lives, so it is
-- not deleted in one step:
--
--   The free text — what triggered this, what happens if nothing changes,
--   who manages the infrastructure. The most sensitive part and the
--   shortest-lived: someone writing "our backups have never been tested
--   and the developer stopped replying" has handed over commercially
--   damaging material about themselves, and once a reply or a report has
--   gone out the raw text is superseded. Cleared at 12 months.
--
--   Who they are — name, email, company, role, website. Useful while they
--   are a plausible lead or might return. Deleted at 24 months, which is
--   the period already stamped in retain_until since launch and never
--   enforced.
--
--   That they consented — text, version, timestamp. This is evidence, and
--   it is wanted for longer than the data it covers. It does not need to
--   identify anyone: a reference, a version and a timestamp is a complete
--   audit record with no person in it. Moved to consent_records when the
--   submission goes, and kept.
--
-- last_contact_at exists so the clock can run from the last exchange
-- rather than from the form. Nothing writes it today — there is no CRM
-- here — so in practice both tiers currently run from created_at, and the
-- cleanup COALESCEs accordingly. The column is here so that can change
-- without another table rebuild.

ALTER TABLE submissions ADD COLUMN last_contact_at TEXT;
ALTER TABLE submissions ADD COLUMN redacted_at TEXT;

-- The consent trail that outlives the person. No name, no email, no
-- company: a reference alone identifies nobody once the submission it
-- pointed at has been deleted.
CREATE TABLE IF NOT EXISTS consent_records (
  reference TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  consent_version TEXT NOT NULL,
  consent_text TEXT NOT NULL,
  consented_at TEXT NOT NULL,
  submission_deleted_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_submissions_retention
  ON submissions (created_at, last_contact_at);

-- Counts for the two new tiers, so /go can show them alongside the rest.
ALTER TABLE cleanup_runs ADD COLUMN redacted INTEGER NOT NULL DEFAULT 0;
ALTER TABLE cleanup_runs ADD COLUMN submissions_deleted INTEGER NOT NULL DEFAULT 0;
