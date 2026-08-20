# OPERATIONS.md — recurring checks and the lessons register

Two things live here and nowhere else: the **critical-function checklist**
(run it on the cadence below; it exists because the site's most important
function was silently broken from launch to 20 August 2026 and nothing
routine would ever have noticed), and the **lessons register** (every
defect that happens *twice* gets an entry naming the guard now in place —
a repeat means the guard was missing or ignored, so fix the guard, not
just the instance).

Governing principle, proven the hard way: **a lesson is not learned until
it is a check that runs.** Prefer an executable guard (a test, a script, a
log line) over prose. Prose in this file exists to index the guards and to
hold the few checks only a human can do. `CLAUDE.md` requires every
session to read the register; `REVIEW.md` is where a lesson graduates
into the shipping standard.

## Critical-function checklist

Run **monthly**, and after any Cloudflare dashboard change, secret change,
or email/DNS provider change. Total time: about ten minutes. Every item
says how to check and what "good" looks like — if an item cannot be
checked as written, that is itself a finding.

0. **Glance at the lights.** The /go overview shows the notification
   path's state (green: delivering; red: failing, with the provider code).
   GitHub Actions runs lint, the full suite and `check:live` every Monday
   (`.github/workflows/weekly-checks.yml`) and emails the owner on failure
   — if Monday's run is red, that email IS this checklist calling.

1. **Enquiry path, end to end, in production.** Submit a clearly-marked
   test enquiry on https://onduu.ke/readiness ("TEST — please ignore" in
   name and company). Good: confirmation with a reference on screen, the
   notification email in the NOTIFY_EMAIL inbox within minutes, the row
   visible at /go/enquiries. Then delete the row:
   `npx wrangler d1 execute onduu-leads --remote --command "DELETE FROM submissions WHERE reference = '<REF>'"`
   Local tests do NOT satisfy this item — that is Lesson 1.

2. **Edge integrity.** `npm run check:live` — good: "OK" over all pages
   plus /go. Catches Cloudflare-injected scripts and weakened security
   headers that no local test can see.

3. **Measurement is recording.** /go/analytics → coverage panel. Good:
   "Most recent event" within the last day, rejected events not a large
   share of received. "not recording" or a stale timestamp means the
   tracker's writes are failing silently again.

4. **Deploy is current.** Cloudflare dashboard → Workers & Pages →
   `onduudotke`. Good: the latest deployment message matches the top of
   `CHANGELOG.md`. A mismatch means a push did not deploy — the failure
   mode `workers_dev`/naming rules in CLAUDE.md exist to prevent.

5. **Tools answer.** Run one query on each: /email-security, /dns,
   /kedomains, /scan. Good: a rendered result (not an error card) on all
   four, and the Turnstile on /scan solving without a visible challenge.

6. **Secrets inventory.** Dashboard → onduudotke → Settings → Variables.
   Good: exactly the secrets the code references — `TURNSTILE_SECRET`,
   `ZEPTOMAIL_TOKEN`, `NOTIFY_EMAIL`, `SCAN_ENABLED`, `DNS_CHECK_ENABLED`
   — and nothing unexplained. Unknown names are either dead weight or a
   sign someone else has been here.

7. **Access still guards /go.** Open https://onduu.ke/go in a private
   browser window. Good: the Cloudflare Access login, never the dashboard.

## Lessons register

Newest first. Format: what happened → root cause → the guard now standing.
Add an entry whenever a defect recurs or a check above fails; an entry may
be closed only by pointing at its guard.

**L7 — 20 Aug 2026 · One assertion from one data point.** The Cloudflare
beacon was declared gone after checking a single page; five pages said
otherwise. Earlier, Web Analytics was declared "collecting nothing" while
it collected from /go. Guard: verify across several pages/sources before
asserting; `scripts/check-live.mjs` checks ten pages precisely so no one has to
trust a single probe. For Cloudflare state: open the dashboard and look
(the logged-in Browser pane exists for this) — never theorise from outside.

**L6 — 20 Aug 2026 · Silent failure on the critical path.** Every enquiry
notification since launch died against ZeptoMail (401 TM_4001: bare token,
prefix required) inside a `catch {}` that reported nothing. Guard:
`notify()` logs every non-2xx with status and provider code (v4.48.2); the
header accepts both token forms (v4.48.3); REVIEW.md forbids silent
failure on business-critical paths; checklist item 1 re-proves the path
monthly; and since v4.49.0 every attempt records its outcome to
`notify_health` (migration 0008), which the /go overview renders as a
status light — the failure mode is now a red light on the owner's own
dashboard, not a log line nobody reads.

**L5 — 20 Aug 2026 · "Fixed" flaky test returned.** The miniflare fixture
flaked three times in one day despite the v4.29.2 fix — that fix cured the
startup races, not the mid-run failures. A flaky suite trains re-run-on-red
until a real failure gets dismissed. Guard: the harness retries transport
noise loudly and respawns a dead child (v4.48.4); a retry that appears in
test output is a signal, not an annoyance — if retries become routine, the
fixture is broken again.

**L4 — 19–20 Aug 2026 · Documentation understating reality, repeatedly.**
CLAUDE.md described the retired stack a day after migration; ROADMAP had
Phase 5 "not started" with five guides live (four of them unclickable —
found only because the status was checked); Phase 6 "not started" with
measurement shipped; the pinned version line went stale twice in two days.
Guard: volatile facts (version, test count) live only in CHANGELOG.md and
are not pinned elsewhere (v4.48.1); a stale status is treated as a defect
because it hides real ones. Recurred a fifth time 20 Aug (README described
the pre-Phase-1 site; CLAUDE.md carried two dead vinext-era paths), so the guard is
now executable: `tests/docs-consistency.test.mjs` fails the suite when a
living document names a missing file, describes a retired route, or drops
a governance cross-reference (v4.48.7).

**L3 — 20 Aug 2026 · Local pass mistaken for production works.** The
enquiry path "passed" for its entire life against test keys and a local
database while production was broken. Guard: REVIEW.md now says end-to-end
means production when behaviour depends on production (v4.48.5); checklist
item 1 is the standing enforcement.

**L2 — 19 Aug 2026 · Absence rendered as zero.** A missing table made the
dashboard show "0 page views" — reading as "no traffic" when the truth was
"no data source". The same class: a dead notification looked identical to
"no enquiries". Guard: dashboard sections render "unavailable — not a
zero" and survive missing tables, pinned by tests (v4.48.0–v4.48.1); empty
states must say why they are empty (REVIEW.md).

**L1 — 19 Aug 2026 · Two sessions, one checkout.** A concurrent session's
branch switch mid-task plus a `git add -A` swept its uncommitted work into
the wrong commit. Guard: check for live sessions before starting; take a
worktree when one exists; stage with explicit paths, never `-A` in a
shared tree (also recorded in session memory).
