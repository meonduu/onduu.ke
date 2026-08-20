# Spec — First-party analytics dashboard (`/go/analytics`)

**Status: DRAFT — planning only, not yet approved for build.** Owner
decisions recorded 19 August 2026:

- "New vs returning visitors" is **dropped** (would require a persistent
  identifier, contradicting the site's no-persistent-identifier design).
- Storage is **D1** (`onduu_leads`), not Workers Analytics Engine. AE
  remains the documented escape hatch if event volume ever justifies it.
- **No browser/OS dimension is stored.** The user-agent continues to be
  read and discarded, as `worker/pageviews.ts` already does.
- ~~The owner will **enable Cloudflare Web Analytics** for onduu.ke.~~
  **Reversed 20 August 2026: Web Analytics is disabled.** The beacon was
  refused by the CSP on every public page and ran only on the then-unprotected
  `/go`. The Core Web Vitals / RUM panels are dropped with Phase 4, not
  deferred.

Origin: an external "Cloudflare analytics dashboard" prompt, refined
against this repo on 19 August 2026. The original assumed a greenfield
project, a separate Worker, a new `analytics.` hostname, a new Cloudflare
Access app, and Workers Analytics Engine — all wrong for this repo and
corrected below.

---

## Build prompt (refined for onduu.ke)

You are working inside the onduu.ke repository. Read `CLAUDE.md`,
`ROADMAP.md`, `REVIEW.md` and this spec before writing code. Follow the
required work loop: smallest plan first, one focused change at a time,
`npm run build`, `npm run lint`, `npm test` before claiming completion,
CHANGELOG entry with version and timestamp in the repo's format. Work in
a feature branch; never deploy, create production resources, or change
Cloudflare dashboard settings — those are owner actions.

### Context: what this repo already has — reuse it, never rebuild it

- Astro (version per `package.json`) + `@astrojs/cloudflare` on a single
  Worker named `onduudotke`. `workers_dev` is `false` and must stay so.
  React islands exist only on form pages. Package manager: npm.
- Server-side page-view recording (`worker/pageviews.ts`): every HTML 200
  is written to D1 `page_views` (path, referrer_host, country, device)
  with bot filtering. No script, no cookie, no IP, no UA stored, no
  visitor/session ID — unblockable ground truth for page views.
- A private, server-rendered dashboard at `/go` (`worker/dashboard.ts`)
  behind the existing Cloudflare Access app, with a section pattern
  (`src/pages/go/[section].ts`) that fails closed. Extend it with an
  `analytics` section. Do not create a new hostname, Worker, or Access
  application.
- Outbound-click logging (`/outbound/*` → `src/pages/api/out.ts`) and
  enquiry attribution (`src/components/attribution.ts`: sessionStorage
  only, UTM + referrer + landing path, stored beside submissions in D1).
- D1 `onduu_leads` with `page_views`, `submissions`, `scans`, consent
  records; SQL migrations under `migrations/`; tests via
  `node --test tests/*.test.mjs`.
- The site is multi-page; there is no client-side routing. SPA
  view-tracking is out of scope unless Astro view transitions are adopted
  later — leave a code comment at the page-view dedupe point noting this.

### Scope: metrics

Already collected (build dashboard views only):
page views · views over time · top pages · referrer hosts · countries ·
device classes · outbound clicks · form submissions and scans as
conversions.

New collection (client tracker + D1 events table):
tracked clicks (total, by page, by named element) · engaged time (per
page and total) · conversions from CTA clicks and downloads ·
approximate visits, session duration, pages per session and entry pages
via a per-tab session ID · exit pages as estimates · coverage and health
(events received vs server-side ground truth, rejected events, most
recent event time).

Conditional (Cloudflare GraphQL Analytics API, dormant until configured):
page-load performance · Core Web Vitals (LCP, INP, CLS) · a bot-traffic
comparison (raw `httpRequestsAdaptiveGroups` vs recorded views; label it
an estimate — `botScore` requires Bot Management, which this zone does
not have).

Dropped by owner decision: new vs returning · browser/OS breakdown ·
purchases/sign-ups (the site has none).

### Client tracker

A small first-party script (no dependency, no bundler additions) that:

- sends only allowlisted events: `page_view`, `page_exit`, `engagement`,
  `click`, `conversion`, `download`, `outbound_link`;
- records clicks only on elements carrying explicit
  `data-analytics-event` / `data-analytics-label` attributes — never
  DOM text, input values, form contents, or anything typed;
- measures engaged time, not elapsed time: count only while the page is
  visible and focused; pause on `visibilitychange`, `pagehide`, `blur`
  and inactivity; resume on activity; flush the final beacon with
  `navigator.sendBeacon()` and fall back to
  `fetch(..., { keepalive: true })`; send periodic heartbeats so a lost
  exit beacon does not lose the visit; deduplicate page views;
- uses a random per-tab session ID in sessionStorage (the
  `attribution.ts` pattern: dies with the tab, links nothing across
  visits, no rotation needed because nothing persists);
- respects Global Privacy Control and Do Not Track by not sending at
  all; never loads on `/go`; is disclosed in the privacy notice in the
  same release that ships it;
- strips query strings and fragments from every recorded URL; sends
  path and label only.

Session duration and pages-per-session are estimates — label them so in
the UI and in the data-definitions panel.

### Event endpoint (`/api/event`)

Match the conventions of the existing `src/pages/api/*` routes and the
abuse-hardening patterns in `tests/scan-abuse.test.mjs`:

POST only · `application/json` only · small body limit · strict schema ·
allowlisted event and property names · clamped numerics (engaged time
capped per heartbeat interval) · origin check against onduu.ke · paths
and labels sanitised and length-capped · country and bot signal taken
from Cloudflare request metadata, never from the client · the existing
`BOT` regex heuristic applied server-side · light rate limiting in the
Worker (no WAF/dashboard rules) · correct 2xx/4xx status codes ·
rejected events counted (for the coverage panel) without storing their
payloads · writes via `ctx.waitUntil` so tracking never delays a
response · a failure to record must never affect the visitor.

### D1 schema

One new migration under `migrations/`. An `events` table:
`event_name`, `path`, `label`, `session_id`, `referrer_host`, `country`,
`device`, `engaged_ms`, `received_at` — indexed to serve the dashboard
queries; no free-form JSON column. A small `event_health` counter table
(or equivalent) for received/rejected totals. Document retention and add
a pruning statement the owner can run; do not schedule a cron.

### Dashboard (`/go/analytics`)

Server-rendered HTML in the existing `worker/dashboard.ts` style — no
client framework, no chart library dependency without stated
justification (inline SVG sparklines are acceptable). Contents:

- date presets (today, yesterday, 7/30 days, custom) with
  previous-period comparison, computed in Africa/Nairobi;
- summary cards; views/visits time series; top pages; referrers;
  countries; devices; clicks by page and by named element;
  engagement-by-page; entry pages and estimated exit pages; conversions
  (submissions, scans, CTA clicks, downloads);
- Core Web Vitals and performance panels that render a clear
  "not configured" state until the GraphQL prerequisites exist;
- a coverage panel: client events received vs server-side page views
  (ground truth), rejected-event count, time of most recent event, and
  a notice that blockers and disabled JavaScript suppress client events;
- CSV export; a data-definitions panel; every metric visibly labelled
  exact, estimated, sampled, or unavailable. Never fake data — empty
  states must say why they are empty.

### GraphQL layer (phase-gated)

Server-side only, against `https://api.cloudflare.com/client/v4/graphql`,
token from a Worker secret (`CLOUDFLARE_API_TOKEN`; account and zone IDs
likewise bound server-side — no credentials reach the browser). Use
schema discovery and the settings node to confirm each dataset
(`rumPageloadEventsAdaptiveGroups`, `rumPerformanceEventsAdaptiveGroups`,
`rumWebVitalsEventsAdaptiveGroups`, `httpRequestsAdaptiveGroups`) is
enabled, its fields, page size, and retention window before querying.
Disable or label any widget whose source is unavailable; never
substitute data. Static, parameterised query documents only — user input
selects from allowlists, it is never interpolated into query text. Cache
responses briefly; surface data-freshness metadata; handle partial
results; log errors without secrets.

### Testing

Extend the existing `node --test` suite: request validation, origin
checks, URL/label sanitisation and query-string stripping, numeric
clamping, rate limiting, duplicate page-view prevention, engagement
timer pause/resume, session-ID behaviour, date-range and timezone
maths, metric and comparison calculations, CSV output, GraphQL error
and unavailable-dataset handling, dashboard section auth (fails closed,
as `tests/dashboard.test.mjs` does today).

### Phases

1. Migration + `/api/event` + tracker (page_view, click, engagement) +
   tests.
2. `/go/analytics` core panels from D1 (existing data first, then event
   data) + coverage panel + CSV + definitions panel.
3. Conversions wiring (CTA attributes on approved CTAs, downloads,
   outbound) + entry/exit estimates.
4. ~~GraphQL RUM/CWV panels — only after the owner confirms Web Analytics
   is enabled and has added the API token secret; add the beacon snippet
   to `src/layouts/Layout.astro` in this phase.~~ **Dropped 20 August 2026.**
   The owner turned Cloudflare Web Analytics off rather than on. Its
   auto-injected beacon was refused by the content-security policy on every
   public page — so it measured nothing there while logging a console error
   on every visit — and ran only on `/go`, which had no policy at the time
   (fixed in v4.47.0). With first-party measurement in place there is no
   reason to reintroduce a third-party beacon, a CSP exception for it, or an
   API token to read it back. Do not rebuild this phase without a fresh
   owner decision; Core Web Vitals, if ever wanted, should be measured from
   the site's own tracker.

Each phase is a separate reviewed change with its own CHANGELOG entry,
REVIEW.md self-check, and desktop + mobile verification of the real
journey, ending with a verification procedure proving events reach the
dashboard.

### Owner actions (outside the repo)

Apply the D1 migration to production · approve each phase before it
deploys.

~~Enable Web Analytics for onduu.ke · create a least-privilege
analytics-read API token · add `CLOUDFLARE_API_TOKEN` (and account/zone
IDs if not already bound) as Worker secrets~~ — all three dropped 20 August
2026 with Phase 4; Web Analytics is deliberately off and no Cloudflare API
token is needed. Verify with `npm run check:live`, which fails if any
Cloudflare-injected script reappears on the live site.
