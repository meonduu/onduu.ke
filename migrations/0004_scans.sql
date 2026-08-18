-- Instant Public Readiness Scan results (docs/specs/instant-scan.md §3, §6).
-- observations/signals are the replay evidence: recomputing the score from
-- them must reproduce it exactly. No visitor identity is stored with a
-- result; scan_throttle holds only the hashed client key used for rate
-- limiting, same pattern as submission_throttle.

CREATE TABLE IF NOT EXISTS scans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT NOT NULL UNIQUE,
  domain TEXT NOT NULL,
  rubric_version TEXT NOT NULL,
  observations TEXT NOT NULL,
  signals TEXT NOT NULL,
  score INTEGER NOT NULL,
  coverage INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_scans_domain_created
  ON scans (domain, created_at DESC);

CREATE TABLE IF NOT EXISTS scan_throttle (
  client_key TEXT PRIMARY KEY,
  window_start TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1
);
