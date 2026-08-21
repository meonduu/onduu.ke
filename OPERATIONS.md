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
   test enquiry on https://onduu.ke/digital-fitness ("TEST — please ignore" in
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
   Check the **type** column, not only the names: a token added as a
   plain-text Variable rather than an encrypted Secret is stored unencrypted
   and readable by anyone with dashboard access. `ZEPTOMAIL_UJIAJIRI_TOKEN`
   arrived that way on 20 Aug 2026. `wrangler secret list` does not show
   plain-text vars at all, so it cannot be used to audit this on its own.
   Good: exactly the secrets the code references — `TURNSTILE_SECRET`,
   `ZEPTOMAIL_TOKEN` (Onduu_ke agent, sends as onduu.ke),
   `ZEPTOMAIL_UJIAJIRI_TOKEN` (ujiajiriKE agent, sends as ujiajiri.ke —
   preferred by the code when present), `NOTIFY_EMAIL` (the ZeptoMail
   sender, which **must belong to the same agent as the token in use**:
   ZeptoMail authenticates per Mail Agent and each may send only from its
   own associated domain), `NOTIFY_TO` (optional destination; defaults to
   the sender),
   `SLACK_WEBHOOK_URL` (second notification channel, wired v4.52.0),
   `SCAN_ENABLED`, `DNS_CHECK_ENABLED` — and nothing unexplained. `VBOUT_API_KEY` is
   **parked, not orphaned** (owner, 20 Aug 2026): it is for a future email
   marketing consent integration. Nothing may wire it in without a
   deliberate change that also updates the privacy notice — marketing is a
   separate consent basis from the enquiry forms, and the notice currently
   (and truthfully) promises that no marketing use is made of anything
   collected. Unknown names are either
   dead weight or a sign someone else has been here.

7. **Access still guards /go.** Open https://onduu.ke/go in a private
   browser window. Good: the Cloudflare Access login, never the dashboard.

## Open incident

None. The 20 August notification failure was closed at 04:37 UTC on
21 August 2026: the light reads `sent`, verified end to end with a live
submission delivered to info@ujiajiri.ke. Root cause was a malformed
`NOTIFY_TO` value — see L10 below, which exists so the diagnosis is never
re-run from theories again. All test rows were deleted; `submissions` is
empty, as before testing began.

## What keeps this register honest

`tests/lessons-register.test.mjs` runs with every release. If the current
`CHANGELOG.md` entry describes a fault — "regression", "outage",
"incident", "was wrong", "my mistake" — it must either cite a lesson
(new or existing) or carry a line beginning **`No lesson:`** saying why
none is needed. Both are acceptable answers; silence is not.

It deliberately does **not** demand a lesson per release. Forcing one every
time would fill this file with filler and devalue the entries that matter,
so what it forces is a decision. The trigger words were tuned against the
real changelog rather than guessed: "broke" and "silently" were tried and
rejected because they appear most often describing a guard working
correctly. Backtested over sixteen releases it flags two, both genuine
misses — L11 and L12 exist because of them.

It also checks that a cited lesson actually exists, and that no number is
used twice.

## Lessons register

Newest first. Format: what happened → root cause → the guard now standing.
Add an entry whenever a defect recurs or a check above fails; an entry may
be closed only by pointing at its guard.

**L8 — 20 Aug 2026 · A processor added without telling the notice.** The
Slack notification channel (v4.52.0) added a company that receives data
about enquiries, and the privacy notice was not updated in the same
change — for three hours the notice named two processors while the code
used three. REVIEW.md already required processors to match the notice;
nothing enforced it. Guard: a test now pins every processor named in the
code against the notice (`tests/seo-and-gates.test.mjs`), and the register
at `docs/specs/processors-and-transfers.md` lists what each one receives,
so the next addition has an obvious place to be recorded (v4.54.0).

**L14 — 21 Aug 2026 · A true sentence went false while nobody was
looking.** The privacy notice said "No artificial-intelligence or
language-model provider receives your form submissions". That was
accurate when written and became false when assessment agents were
introduced, and it stayed published in that state. A sweep for the same
claim in other words found a second copy on `/digital-fitness` —
assessment answers "seen only inside Ujiajiri Enterprises Limited" — so
the correction had to land in two files and two vocabularies at once.

This is **L8 for the second time**: a processor added without telling the
notice. L8's guard pins every processor *named in the code* against the
notice, and it could not see this one, because agents are an operational
arrangement rather than a binding in `wrangler.jsonc` — no import, no
secret, no fetch to a new hostname. A processor can now arrive without
touching the repository at all, and the existing check is blind to
exactly that case.

The deeper pattern is not "we forgot to update a page". Both this and the
21 August "no commission" correction were sentences that were true on the
day they were written; nothing re-examines a claim when the world it
describes changes. Guard: `tests/agent-disclosure.test.mjs` pins the
disclosure and its de-identification claim, so the assurance and the
pipeline must change together. Standing rule: **a change to how the
business operates is a documentation change**, and the first question on
any new processing arrangement is which published sentence it just
falsified.

**L13 — 22 Aug 2026 · A chained command shipped a red suite.** v4.79.0
was committed, merged and deployed while `npm test` reported `fail 1`.
The tests ran, printed the failure, and the deploy proceeded — because
they were all one `&&`-free shell chain, so a non-zero result from a
grepped test run never gated anything. Nothing broke in production (the
failure was this register's own check, not a code defect), which is
precisely why it is worth recording: the same habit with a real defect
ships it. `REVIEW.md` says the suite passes before shipping, and for a
whole session the mechanism could not enforce that because the two steps
lived in one command. Rule: run the checks, **read the result**, then
ship as a separate action. A build-and-deploy chain must never contain
its own test step, because a chain reports the last command's status, not
the worst one.

**L12 — 20 Aug 2026 · A rename that the database refused.** Backfilled
21 Aug 2026, when the lesson check below found this release had described
a production outage without recording anything. v4.64.0 renamed the form
kind from `readiness` to `fitness` and left migration 0001's
`CHECK (kind IN ('readiness','contact'))` untouched, so every assessment
insert violated the constraint and returned 500. The conversion path was
down about forty minutes. Nothing was lost — the table was empty and the
visitor saw an error rather than a false success — but the whole suite
passed throughout, because `validate()` was tested directly and nothing
ever exercised the insert. Rule: a rename that reaches storage is not a
copy change. Grep `migrations/` for the old value before renaming it;
a CHECK or enum there must learn the new word first, and a migration that
widens a constraint ships to production in the same release as the code
relying on it, never merged and left pending. Guard:
`tests/kind-schema.test.mjs` parses the constraint out of the migrations
and asserts everything the form accepts is storable (v4.64.3).

**L11 — 21 Aug 2026 · Ask the vendor's own front end before probing its
API.** v4.70.0 concluded HOSTAFRICA's checkout could not receive the
searched domain, after testing `domain`, `query`, `search` and `sld`/`tld`
one at a time against a nonsense-parameter control. The control was sound
and the conclusion still wrong: the checkout needs **two** parameters
together — `ident=keha&domain=…` — and ignores `domain` silently without
`ident`, so every single-parameter probe looked identical to the control.
Guessing one variable at a time cannot find a pair. What settled it in one
command was reading HOSTAFRICA's own public search form at
`www.hostafrica.ke/domains/` and seeing exactly what it submits. The
result copy meanwhile told visitors to retype a name the site could have
carried for them. Rule: when integrating with a third party, read the
request their own client makes — view-source on their form, or their
network tab — before hand-probing parameters, and treat "the vendor does
not support this" as a claim needing that evidence rather than the
absence of a working guess. Guard: `tests/domains.test.mjs` pins the
carried name **and** its companion `ident`, because losing `ident` alone
returns the site to making people retype with no other symptom
(v4.72.0).

**L10 — 21 Aug 2026 · One error code hid four causes; instrument before
theorising.** ZeptoMail's `401 TM_4001` covers a mismatched agent/sender
pairing, a bad token (SERR_157), an unapproved account (SM_128) and a
malformed address (SM_113) — and the HTTP 401 makes all of them read as
auth failures. Seven hours and five releases went into eliminating causes
one theory at a time (including a needless token regeneration), when the
actual fault was a malformed `NOTIFY_TO` that shape-validation would have
named in one step. The correct order is: make the failing system report
its own state first — capture the provider's sub_code, validate config
shape at the boundary, put the verdict on the light — and only then
theorise about what remains. Guard: `notify()` now trims and
shape-checks both addresses before any send and names the guilty binding
on the `/go` light; failures carry the provider's sub_code
(`worker/submissions.ts`, v4.65.1–v4.65.5). Corollary: dashboard-pasted
bindings are hostile input — trim and validate every one at the point of
use.

**L9 — 20 Aug 2026 · Editorial bookkeeping leaking into published copy.**
"(owner, 20 August 2026)" reached the live assessment terms, and two gate
banners spoke of "owner-approved" and "owner-confirmed" copy — internal
vocabulary a visitor cannot interpret. v4.28.1 had already removed one
such note from the HOSTAFRICA disclosure, so this was the second
occurrence. Guard: a test sweeps the public legal and form pages for
provenance markers and owner-vocabulary (v4.59.0). Dated decisions belong
in `CHANGELOG.md`, this register and code comments — never in what a
visitor reads.

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
