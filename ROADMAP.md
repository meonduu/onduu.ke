# ROADMAP.md — onduu.ke priorities and delivery status

**Last updated:** 18 August 2026

Statuses: `not started` · `in progress` · `blocked` · `ready for review` · `done`.
No deadlines are listed anywhere in this file because none have been agreed.

## Current website state

- Live at https://onduu.ke on Cloudflare Worker `onduudotke` (v2.10.2), built
  on vinext 1.0.0-beta.2. Deploys automatically from `main` via Workers
  Builds; PRs get preview URLs.
- Working today: all routes public; assessment and contact forms submit
  end-to-end (server-side validation, Turnstile Siteverify, rate limiting,
  D1 `onduu-leads`, email notification carrying reference only); `/check`
  email security checker; `/go` private dashboard behind Cloudflare Access;
  first-party page-view analytics; sitemap/RSS/robots; canonical URLs;
  legal pages published as marked drafts; 7 test suites (46+ tests).
- Google Analytics, Tag Manager and the consent banner were removed (v2.7.0);
  the previous site's analytics cookies are actively expired (v2.8.0).
- Untracked work in progress: `worker/scan/` (instant-scan networking layer).
  Not wired in, not deployed. Gated — see "Not now / gated".

## Current strategic decision

Two decisions, made by the owner on 18 August 2026:

1. **Reposition Onduu** per the 16 August 2026 two-site strategy: Onduu is
   education, Digital Readiness and demand-routing; implementation goes to
   independent Ujiajiri partners; infrastructure goes to the approved
   HOSTAFRICA route. Direct-delivery promises currently on the live site are
   superseded and must be replaced.
2. **Migrate the stack to Astro** (Phase 0.5) before the content
   repositioning, because repositioning is blocked on missing strategy
   documents and the migration is not. Content is frozen during migration so
   parity can be proven.

**Superseded content on the live site** (approved 16 Aug under the older
brief, superseded by the newer strategy the same day): Managed Website
Operations, Agent Workflow Pilot, Website Revenue System implementation
framing, "Onduu finds and fixes" language, Infrastructure hub positioning,
Results. These remain live until Phase 1 replaces them — do not extend or
link to them in new work.

## Phase 0 — Establish the baseline — `in progress`

- [x] Audit repository, routes, deployment, forms, analytics (recorded in
  `CHANGELOG.md` v1.0.0–v2.10.2 and README).
- [x] Confirm production ownership: Worker `onduudotke`, `workers_dev`
  disabled, `/go` behind Cloudflare Access bound to the hostname.
- [x] Rollback understood: revert commit on `main` (Workers Builds redeploys)
  or `wrangler rollback` for immediate restore.
- [x] Commit `worker/scan/` work-in-progress so nothing is lost (v2.11.1).
- [x] Capture parity baseline for the migration: per-route HTML, title,
  description, canonical, Open Graph (`docs/specs/parity-baseline.json`,
  37 routes, captured from the v2.11.1 production build).
- [x] Record superseded-content inventory page by page
  (`docs/specs/superseded-content.md` — provisional dispositions pending the
  strategy document).
- [x] Correct the stale README (done on the `astro-migration` branch).

**Found during the baseline/migration, deferred to their phases:**

- The homepage and `/check` ship **no canonical URL and no Open Graph tags**
  (the standard pages have both). Preserved for parity; fix in Phase 1.
- The 404 page serves the homepage title. Preserved for parity; fix in
  Phase 1.
- ~~The pinned wrangler CLI (4.92.0) cannot read local dev state written by
  the Astro adapter's newer workerd.~~ Upgraded to 4.123.0 (with
  workers-types 5.x) in v3.0.1; verified against the dev state and the full
  test suite.
- Astro's cross-origin POST protection (`security.checkOrigin`) is disabled
  for behaviour parity; consider enabling it as a hardening change later.

**Acceptance:** baseline snapshots exist in the repo or scratch archive;
`git status` clean; rollback steps written down.

## Phase 0.5 — Migrate to Astro — `done`

Merged to `main` (PR #1) and live on onduu.ke since 18 August 2026
(v3.0.0). Parity diff green across all 37 baseline routes, re-verified
against production after deploy; 67/67 tests; forms verified end-to-end;
client JavaScript on content pages fell from 187KB (58.6KB gz) to 0.9KB
(0.5KB gz), with React loading only on the two form pages and /check.
Rollback: revert merge commit 00b8d27, or `wrangler rollback`.

Approved by the owner 18 August 2026. Detailed steps live in
`docs/specs/astro-migration.md` (created as the migration's first commit).
Summary: branch `astro-migration`; Astro 5 + `@astrojs/cloudflare` +
`@astrojs/react`; same Worker name, D1 binding and Cloudflare settings;
static routes prerendered; Insights keep the typed block model (MDX
conversion deferred); the three client components (forms, /check form,
attribution) become React islands; Worker modules reused unmodified behind
Astro endpoints and middleware; `/_vinext/image` replaced by Astro image
handling; all test suites ported.

**Content freeze:** no copy changes during this phase.

**Acceptance:**
- Parity diff against the Phase 0 baseline: every route present; titles,
  descriptions, canonicals, OG tags identical; article prose word-for-word;
  redirects and feeds equivalent.
- Forms tested end-to-end into local D1 with Turnstile test keys; `/check`
  and `/go` verified; build, lint and full test suite pass.
- Client JavaScript weight reported before/after.
- PR preview approved by the owner on desktop and mobile; owner approves the
  merge; post-deploy production checks pass; changelog v3.0.0.

## Phase 1 — Correct Onduu's public proposition — `done`

Shipped in v4.0.0 (18 Aug 2026) once the strategy documents were located and
filed under `docs/strategy/`. Applied per the Current Version strategy:

- Homepage rewritten with the approved copy; "Onduu finds and fixes" gone;
  primary CTA everywhere is **Check Your Digital Readiness**.
- New architecture: nav Readiness · How It Works · Paths · Guides · About;
  `/paths/*` (Ujiajiri partners, HOSTAFRICA infrastructure with disclosure);
  `/guides/*` (Website Revenue System demoted to a framework guide, Kenyan
  VPS, Agents on a VPS).
- `/solutions/*` and `/infrastructure/*` removed with 301s; Managed Website
  Operations, Results and the managed-service terms regated (noindex).
- `/how-it-works` reframed to Assess → Prioritise → Choose a path → Verify;
  `/readiness` gained the result-routing consent block; `/about` the
  relationship paragraph; `/contact` the three-destination split; footer
  carries the responsibility disclosure.
- Tests updated to pin the new architecture, redirects, gates, disclosure
  and the absence of direct-delivery promises (106 passing).

**Notes:** HOSTAFRICA outbound destination link still gated pending owner
approval (the path page says so); Ujiajiri partner directory described as
"being established" — no link to the current ujiajiri.ke clone; the youth
section carries no external link for the same reason.

## Phase 2 — Separate routes and responsibilities — `blocked`

Blocked on: the same strategy document, plus the approved HOSTAFRICA
destination and wording.

- Route website/digital-marketing implementation to Ujiajiri partners.
- Route HOSTAFRICA products/support to the approved official destination.
- Split contact paths so information is not silently shared between
  organisations.
- Add accurate relationship and independence disclosures at decision points.

**Acceptance:** each route's destination, disclosure and consent wording
approved by the owner; no cross-organisation data flow without declared
basis; passes `REVIEW.md`.

## Phase 3 — Trust, legal and data foundations — `in progress`

Done so far: privacy notice and three further legal drafts written
(v2.1.0–v2.2.0), owner corrections applied (v2.4.0), About biography from
published sources only (v2.3.0), consent stored with version and timestamp
plus `retain_until` column, canonical/sitemap/robots live, GA removed.

Remaining:

- [ ] Replace remaining identity/contact placeholders with owner-approved
  facts; remove draft markings only with owner sign-off.
- [ ] Re-align Privacy, Commercial Relationships, Terms and tool-limitation
  pages with actual behaviour **after** Phases 1–2 change that behaviour.
- [ ] Define and document retention, deletion, consent, processors and
  transfer behaviour; enforce `retain_until`.
- [ ] Accessibility pass over the important flows (keyboard, screen reader).

**Acceptance:** every legal statement matches observed behaviour; no draft
labels on production claims without owner sign-off; passes `REVIEW.md`.

## Phase 4 — Digital Readiness product — `in progress` (gated)

Done so far: human-reviewed assessment route live (readiness form → D1 →
review); `/check` email security checker live; `worker/scan/` networking
layer in progress (untracked).

Remaining:

- [ ] Preserve the human-reviewed assessment route through all changes.
- [x] Write and approve the Instant Public Readiness Scan specification
  (`docs/specs/instant-scan.md`, spec + psr-v1 rubric approved 18 Aug 2026).
- [x] Separate Public Signal Score, Evidence Coverage and Verified Digital
  Readiness Score in product, copy and results (built into the scan
  response and its statement text).
- [x] Complete SSRF, abuse and scoring-replay tests
  (`tests/scan-{ssrf,scoring,abuse}.test.mjs`, 31 tests).
- [x] Copy review (the `/scan` page copy, v3.2.0) and privacy review
  (notice §04 rewritten to cover stored scan results, v3.2.0). Owner
  decisions recorded: results kept until deleted; domain-owner opt-out via
  email deletes the result and adds the domain to the do-not-scan list.
- [ ] **Launch (owner):** review the privacy wording, apply migration
  `0004` to production, set `SCAN_ENABLED=true`, link `/scan` from
  navigation, approve. Everything else is built and dark (v3.1.0 engine,
  v3.2.0 page).

**Acceptance:** scan reports only public observations; missing private
evidence is never scored as pass or fail; threat-model tests pass; owner
approves launch. Until then the scanner stays out of production.

## Phase 5 — Guides, tools and content system — `not started`

- Trigger-based guides: domains, DNS, email trust, websites, Kenyan
  infrastructure, Buzz, supervised agents.
- One relevant next path per article.
- Sustainable LinkedIn/YouTube repurposing workflow; no low-value generic
  duplication.
- (Deferred from Phase 0.5) Convert Insights block model to MDX content
  collections.

**Acceptance:** each guide has an approved source, one CTA, and passes
`REVIEW.md`; repurposing workflow documented and running.

## Phase 6 — Evidence and optimisation — `not started`

- Publish only approved case evidence with transparent methods.
- Measure: readiness starts, qualified partner clicks, approved
  HOSTAFRICA-path clicks, guide engagement, completed enquiries.
- Improve from evidence; do not add offers to fill navigation.

**Acceptance:** every published number traces to first-party data; metrics
reviewed against the routing goals; passes `REVIEW.md`.

## Not now / gated

Not built, linked or promised until operating requirements are met and the
owner approves:

- Public youth enrolment; HOSTAFRICA-branded training; certifications.
- Unmanaged partner submissions; unapproved commissions; client matching.
- Managed Website Operations and any direct agent services.
- Production deployment of the instant scanner (Phase 4 gates).
- HOSTAFRICA brand assets, programme claims, tracking routes and
  endorsements.

## Owner decisions and external approvals needed

| Decision | Needed for | Status |
| --- | --- | --- |
| Supply 16 Aug two-site strategy document | Phases 1–2 | outstanding |
| Supply 15 Aug brief PDF (secondary source) | Phases 1–3 | outstanding |
| Approve governance files (this commit) | everything | outstanding |
| Approve Astro migration merge after preview | Phase 0.5 | outstanding |
| Approved HOSTAFRICA destination + wording | Phase 2 | **decided 18 Aug 2026**: panel.hostafrica.com with UTM attribution only, no affiliate parameter, no commission (v4.1.0) |
| Identity/contact facts; lift draft markings | Phase 3 | outstanding |
| Instant-scan specification approval | Phase 4 | outstanding |
| Scanner public launch approval | Phase 4 | outstanding |
