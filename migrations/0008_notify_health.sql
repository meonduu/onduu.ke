-- The state of the enquiry notification path, one row, updated on every
-- attempt (spec: OPERATIONS.md lesson L6). The path was silently broken
-- from launch until 20 Aug 2026; v4.48.2 made failures log, and this makes
-- the latest outcome VISIBLE on the /go overview — a light, not a log.
-- No personal data: outcome, provider code, timestamp, nothing else.
CREATE TABLE IF NOT EXISTS notify_health (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  last_outcome TEXT NOT NULL,   -- sent | failed | skipped
  last_code TEXT,               -- HTTP status or provider code on failure
  changed_at TEXT NOT NULL DEFAULT (datetime('now'))
);
