-- First-party page views.
--
-- Recorded server-side, so no script runs in the visitor's browser and no
-- cookie or identifier is involved. Deliberately cannot identify a person or
-- link two views together:
--
--   * no IP address, and no hash of one;
--   * no user-agent string — it is read to skip bots, then discarded;
--   * no session or visitor id, so "unique visitors" is not answerable here.
--
-- What it does answer: which pages and articles get read over time, and which
-- external sites send people. Cloudflare Web Analytics already reports visits
-- and performance; this exists so the history is yours and queryable.

CREATE TABLE IF NOT EXISTS page_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL,
  referrer_host TEXT,
  country TEXT,
  device TEXT,
  viewed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_page_views_time ON page_views (viewed_at);
CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views (path, viewed_at);
CREATE INDEX IF NOT EXISTS idx_page_views_referrer ON page_views (referrer_host, viewed_at);
