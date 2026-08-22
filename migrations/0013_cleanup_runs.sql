-- A record of what the cleanup deleted, so it can be seen working.
--
-- The security review's retention recommendation ends "monitor cleanup
-- results and alert when stale records remain", and it is right to: a
-- deletion job nobody can observe is indistinguishable from one that
-- stopped running, and the second is only discovered when someone asks
-- why a table is enormous.
--
-- Owner decision, 22 Aug 2026: the narrow half only. This job deletes
-- machinery — spent throttle counters and opt-out links that expired
-- unconfirmed — and nothing that anyone chose to send. Enquiries, page
-- views, engagement events, scan and tool results, the do-not-scan
-- blocklist and confirmed opt-out requests are all out of scope, because
-- how long to keep those is a policy question and not a mechanical one.
CREATE TABLE IF NOT EXISTS cleanup_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ran_at TEXT NOT NULL,
  throttle_deleted INTEGER NOT NULL DEFAULT 0,
  optout_deleted INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_cleanup_runs_time ON cleanup_runs (ran_at DESC);
