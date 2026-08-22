-- Durable rate limiting for the domain search (/domains).
--
-- Until 22 Aug 2026 the search was limited by a Map held in the Worker
-- isolate. Two problems, both invisible in testing: an isolate is recycled
-- whenever Cloudflare feels like it, taking every count with it, and many
-- isolates serve one site at once — so the real ceiling was 30 per hour
-- per isolate, not 30 per hour. The busiest public tool had the weakest
-- limit of the four.
--
-- Same shape as scan_throttle (migration 0004) and submission_throttle,
-- and a separate table on purpose: running 30 domain searches should not
-- spend the budget for a scan.
--
-- client_key is the SHA-256-derived key from clientKeyOf(), never the IP.
-- The in-memory bucket now hashes too; it previously kept raw addresses in
-- Worker memory, which the rest of this codebase is careful never to do.
CREATE TABLE IF NOT EXISTS search_throttle (
  client_key TEXT PRIMARY KEY,
  window_start TEXT NOT NULL,
  count INTEGER NOT NULL
);
