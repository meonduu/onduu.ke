-- Client-side engagement events (spec: docs/specs/analytics-dashboard.md,
-- owner-approved decisions recorded 19 Aug 2026).
--
-- Complements server-side page_views (0003): that table is the unblockable
-- ground truth for what was served; this one records what a browser chose to
-- report — clicks on explicitly tagged elements, engaged time, and page
-- views for coverage comparison. Blockers and disabled JavaScript make this
-- table an undercount by design.
--
-- What is deliberately NOT stored: any IP address or hash of one, the
-- user-agent string (read server-side for bot filtering and device class,
-- then discarded), form contents, typed text, query strings, fragments, and
-- any identifier that outlives the browser tab. session_id is a random
-- value from sessionStorage: it dies with the tab and cannot link two
-- visits, so "session" here always means "one tab, one sitting".

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_name TEXT NOT NULL,    -- allowlisted in worker/events.ts
  path TEXT NOT NULL,          -- pathname only, query and fragment stripped
  label TEXT,                  -- data-analytics-label, allowlisted charset
  session_id TEXT,             -- random per-tab id, no cross-visit meaning
  referrer_host TEXT,          -- external host only, as in page_views
  country TEXT,                -- from Cloudflare request metadata
  device TEXT,                 -- coarse class: mobile | tablet | desktop
  engaged_ms INTEGER NOT NULL DEFAULT 0,
  received_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_events_name_time ON events (event_name, received_at);
CREATE INDEX IF NOT EXISTS idx_events_path_time ON events (path, received_at);
CREATE INDEX IF NOT EXISTS idx_events_session ON events (session_id);

-- Sliding-window rate limit, same shape as submission_throttle and
-- scan_throttle: a short-lived SHA-256-derived client key, never joined to
-- the events themselves.
CREATE TABLE IF NOT EXISTS event_throttle (
  client_key TEXT PRIMARY KEY,
  window_start TEXT NOT NULL,
  count INTEGER NOT NULL
);

-- Coverage counters for the dashboard's health panel. Rejected events are
-- counted, never stored.
CREATE TABLE IF NOT EXISTS event_health (
  day TEXT PRIMARY KEY,        -- YYYY-MM-DD (UTC)
  received INTEGER NOT NULL DEFAULT 0,
  rejected INTEGER NOT NULL DEFAULT 0
);

-- Retention: no cron is scheduled. The owner can prune with:
--   DELETE FROM events WHERE received_at < datetime('now', '-13 months');
