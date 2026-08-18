# Runbook — launching the Instant Public Readiness Scan

Operational steps to take the scan from built-and-dark to publicly live, and
to reverse it. The spec is `docs/specs/instant-scan.md`; this is the how-to.

**State before launch:** the scan engine, endpoint, `/scan` page and the
`scan_blocklist` table all ship on `main`, but `POST /api/scan` returns 404
because the production Worker has no `SCAN_ENABLED` variable, and `/scan` is
not linked from navigation. Deploying the code changes nothing user-visible.

**Owner-only.** Every step here is a production action — do not automate them
into a deploy. Steps 2 and 3 are the irreversible/outward-facing ones.

## Prerequisite

These commands talk to production, so authenticate locally first. If
`npx wrangler whoami` does not show the account, run:

```
npx wrangler login
```

## Order matters

Apply the migrations (step 2) **before** setting the flag (step 3). If the
flag were on with the tables missing, the first scan would error.

## Step 1 — Land the code (safe; stays dark)

Merge the scan launch PR to `main` and let Workers Builds deploy it. The
`/scan` page and blocklist code go live, but the page is unlinked and the
endpoint still 404s without the flag. Migrations `0004` and `0005` are now on
`main` for the next step.

## Step 2 — Apply the migrations to production D1

From the repo root on `main`. See what is pending:

```
npx wrangler d1 migrations list onduu_leads --remote
```

Apply (lists `0004_scans.sql` and `0005_scan_blocklist.sql`, asks to confirm):

```
npx wrangler d1 migrations apply onduu_leads --remote
```

This only **creates** the `scans`, `scan_throttle` and `scan_blocklist`
tables. It touches no existing data — the `submissions` table is untouched —
and the site behaves identically afterwards; the new tables sit empty.

## Step 3 — Turn on the flag

Cloudflare dashboard: **Workers & Pages → onduudotke → Settings → Variables
and Secrets → Add** a plaintext variable `SCAN_ENABLED` = `true`, then
**Deploy**. `POST /api/scan` goes live on deploy. `/scan` is now functional
but still unlinked, which is the verification window for step 4.

The flag is deliberately not committed to `wrangler.jsonc`, so the repo's
default stays "off" (the abuse test asserts the flag-off 404).

## Step 4 — Verify on production before linking it

```
curl -s -X POST https://onduu.ke/api/scan -H "Content-Type: application/json" -d '{"domain":"onduu.ke"}'
```

Expected: `403` with "Please complete the check." — **correct**: it proves
Turnstile is enforced (a raw curl carries no token). For a real end-to-end
check, open `https://onduu.ke/scan` in a browser and scan a domain; the widget
solves and a score returns. That confirms migrations + flag + Turnstile + D1
all line up in production.

## Step 5 — Link `/scan` from navigation (the public go-live)

Add `/scan` to the header and footer navigation in
`src/components/components.tsx`, via a small PR. Merging it is the last step —
that is when the scan becomes publicly discoverable.

## Domain-owner opt-out

When an owner emails me@onduu.ke asking to be left alone, record the block and
delete every stored record of the domain — scan results and lookup-tool
results — in one command:

```
npx wrangler d1 execute onduu_leads --remote --command "INSERT INTO scan_blocklist (domain, created_at, note) VALUES ('example.co.ke', datetime('now'), 'owner request'); DELETE FROM scans WHERE domain='example.co.ke' OR domain LIKE '%.example.co.ke'; DELETE FROM tool_checks WHERE query='example.co.ke' OR query LIKE '%.example.co.ke' OR detail LIKE '%\"example.co.ke\"%';"
```

A block covers the domain and all its subdomains. It is checked before any
scan request, and before any lookup result is recorded — so after opting out,
the email checker and domain search still work for that domain (they read only
public records) but nothing about it is kept.

## Rollback (instant)

Set `SCAN_ENABLED` to `false` (or delete the variable) in the dashboard and
Deploy — the endpoint goes dark immediately. If the nav-link PR was merged,
revert it to remove the link. No data cleanup is needed.

## Before going fully public — housekeeping

The scan reports real findings on onduu.ke itself: at time of writing, no
http→https redirect and no HSTS. Those are accurate. Consider enabling
Cloudflare's **Always Use HTTPS** for onduu.ke first, so the tool's own home
does not read poorly against the checks it runs. Unrelated to the scan code.
