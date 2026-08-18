-- Domain opt-out log for the Instant Public Readiness Scan
-- (docs/specs/instant-scan.md §6; owner policy 18 Aug 2026).
--
-- When a domain owner asks not to be scanned, the domain is recorded here and
-- any stored result for it is deleted. The scan checks this table before any
-- network request and refuses a match (the domain or any parent suffix). This
-- is the runtime, per-request opt-out; the code-level DO_NOT_SCAN set remains
-- for permanent, version-controlled exclusions.

CREATE TABLE IF NOT EXISTS scan_blocklist (
  domain TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  note TEXT
);
