-- Stored results for the two lookup tools (owner decision, 18 Aug 2026:
-- option 2 — store the searched domain and result, with the privacy notice
-- and tool page copy changed in the same release and the change disclosed).
--
-- What is stored: the tool used, the domain or name searched, a short
-- human-readable outcome, and the machine-readable detail behind it.
-- What is NOT stored: any visitor identity — no address, no hash of one, no
-- account, no session. A row says "this domain was checked at this time",
-- never "this person checked it". Rate limiting continues to use the
-- separate short-lived hashed counter and is not joined to these rows.

CREATE TABLE IF NOT EXISTS tool_checks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tool TEXT NOT NULL,          -- 'email-security' | 'kedomains'
  query TEXT NOT NULL,         -- the domain or name entered, normalised
  summary TEXT,                -- short outcome, shown in the dashboard list
  detail TEXT,                 -- JSON: the findings behind the summary
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tool_checks_tool_created
  ON tool_checks (tool, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tool_checks_query
  ON tool_checks (query);
