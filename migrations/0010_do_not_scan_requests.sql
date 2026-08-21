-- Domain-owner opt-out requests, each waiting for proof of control.
--
-- Until 21 Aug 2026 the only way onto scan_blocklist was a hand-run SQL
-- command (docs/runbooks/scan-launch.md), and the only way to ask was the
-- sales contact form — which required a company name and the business
-- result a website should produce in order to be left alone. Nothing
-- checked that the person asking controlled the domain, so the list was a
-- denial-of-service tool against any competitor's domain. Shadowserver,
-- the closest published precedent, requires proof of ownership; this table
-- is that proof. A request is recorded here, a one-time link is emailed to
-- an address AT the domain, and only the click moves the domain onto the
-- blocklist and deletes what was stored.
--
-- token_hash, never the token: a read of this table must not yield a
-- usable link. confirmed_at NULL = still waiting; the row is kept after
-- confirmation as the audit record of who asked and when.
CREATE TABLE IF NOT EXISTS do_not_scan_requests (
  reference TEXT PRIMARY KEY,
  domain TEXT NOT NULL,
  email TEXT NOT NULL,
  note TEXT,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  confirmed_at TEXT
);

-- The per-domain cooldown (one confirmation email per domain per hour)
-- and the confirm lookup both read by these columns.
CREATE INDEX IF NOT EXISTS do_not_scan_requests_domain ON do_not_scan_requests (domain, created_at);
