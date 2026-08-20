# ROADMAP.md — onduu.ke priorities and delivery status

**Last updated:** 20 August 2026

Statuses: `not started` · `in progress` · `blocked` · `ready for review` · `done`.
No deadlines are listed anywhere in this file because none have been agreed.

## Current website state

- Live at https://onduu.ke on Cloudflare Worker `onduudotke`, built on
  Astro 5 + `@astrojs/cloudflare` since the Phase 0.5 migration (v3.0.0).
  **`CHANGELOG.md` is the only record of the current version — do not pin one
  here**; this line has gone stale twice already. Deploys automatically from
  `main` via Workers Builds; PRs get preview URLs.
- Working today: the repositioned architecture (Fitness · How It Works ·
  Paths · Guides · About); assessment and contact forms end-to-end
  (validation, Turnstile, rate limiting, D1 `onduu-leads`); **four free
  tools** — `/email-security`, `/kedomains`, `/scan` (secret-gated on
  `SCAN_ENABLED`) and `/dns` (secret-gated on `DNS_CHECK_ENABLED`; spec
  `docs/specs/dns-check.md`); `/go` dashboard behind Cloudflare Access with
  per-tool usage sections; stored lookup results with the deletion route
  and do-not-scan list; first-party page views and routed-click counting;
  the Dial + Letterhead identity with adaptive favicon and OG cards;
  legal pages published as marked drafts; a first-party engagement tracker
  (v4.46.0, storing nothing until migration 0007 is applied) and the
  `/go/analytics` section built on it; the test count lives in `CHANGELOG.md`
  rather than here, for the same reason as the version.
- Google Analytics, Tag Manager and the consent banner were removed (v2.7.0);
  the previous site's analytics cookies are actively expired (v2.8.0).

## Current strategic decision

Two decisions, made by the owner on 18 August 2026:

1. **Reposition Onduu** per the 16 August 2026 two-site strategy: Onduu is
   education, Digital Fitness and demand-routing; implementation goes to
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

## Phase 0 — Establish the baseline — `done`

Marked done 19 August 2026 with owner approval: every item complete and the
acceptance criteria met (baseline snapshots in the repo, rollback documented,
clean status). The two deferred findings below are tracked in their target
phases: the homepage/`/check` canonical + Open Graph gaps and the 404 title
were fixed in v3.0.1; `security.checkOrigin` was enabled in v4.40.0.

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

- ~~The homepage and `/check` ship **no canonical URL and no Open Graph
  tags** (the standard pages have both).~~ Preserved for parity through the
  migration; fixed in v3.0.1.
- ~~The 404 page serves the homepage title.~~ Preserved for parity; fixed in
  v3.0.1 with its own title and description.
- ~~The pinned wrangler CLI (4.92.0) cannot read local dev state written by
  the Astro adapter's newer workerd.~~ Upgraded to 4.123.0 (with
  workers-types 5.x) in v3.0.1; verified against the dev state and the full
  test suite.
- ~~Astro's cross-origin POST protection (`security.checkOrigin`) is
  disabled for behaviour parity.~~ Enabled in v4.40.0 (owner-approved
  19 Aug 2026); cross-origin form POSTs now get 403 before any handler.

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
  primary CTA everywhere is **Check Your Digital Fitness**.
- New architecture: nav Fitness · How It Works · Paths · Guides · About;
  `/paths/*` (Ujiajiri partners, HOSTAFRICA infrastructure with disclosure);
  `/guides/*` (Website Revenue System demoted to a framework guide, Kenyan
  VPS, Agents on a VPS).
- `/solutions/*` and `/infrastructure/*` removed with 301s; Managed Website
  Operations, Results and the managed-service terms regated (noindex).
- `/how-it-works` reframed to Assess → Prioritise → Choose a path → Verify;
  `/digital-fitness` gained the result-routing consent block; `/about` the
  relationship paragraph; `/contact` the three-destination split; footer
  carries the responsibility disclosure.
- Tests updated to pin the new architecture, redirects, gates, disclosure
  and the absence of direct-delivery promises (106 passing).

**Notes:** HOSTAFRICA outbound destination link still gated pending owner
approval (the path page says so); Ujiajiri partner directory described as
"being established" — no link to the current ujiajiri.ke clone; the youth
section carries no external link for the same reason.

## Phase 2 — Separate routes and responsibilities — `done`

Closed 19 August 2026: the owner reviewed every decision point's destination,
disclosure and consent wording (captured verbatim from the live site in the
Phase 2 sign-off review) and approved all six — the Ujiajiri introduction
path, the HOSTAFRICA path page, the domain-search routing, the contact
three-destination split, the fitness after-score block and the sitewide
footer disclosure — with two owner-approved fixes applied in v4.38.0: the
contact hero drops the superseded "system, programme, pilot" echo, and the
fitness introduction CTA gains the one-sentence referral-fee disclosure.

Former blockers resolved 18 August 2026: the strategy documents are filed
under `docs/strategy/`, and the HOSTAFRICA destination is decided
(panel.hostafrica.com, UTM attribution only — v4.1.0). Partially delivered
already: `/paths/*` pages with disclosures (v4.0.0), the contact
three-destination split (v4.0.0), and the domain search routing to the
approved destination (v4.x). **19 August 2026 (v4.17.0/v4.19.2): the
Ujiajiri route shipped as private curated introductions** per the 19 Aug
developer brief — every implementation CTA is "Request an Implementation
Introduction" to `ujiajiri.ke/request-an-introduction/`, with the consent
step and referral-fee existence disclosed at the decision point and the
public-directory model retired. Remaining below.

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

- [x] Replace remaining identity/contact placeholders with owner-approved
  facts; remove draft markings only with owner sign-off. **Completed 20 Aug 2026**
  (v4.55.0–v4.58.0). Answered: controller identity, statutory
  directorship, employment boundary, conflicts policy, complaints
  handling, report delivery and readership, publication of findings
  (aggregate-only, thresholds on the page) and intellectual property
  (findings the client's, method Onduu's). Removed at the owner's
  instruction: registration number and address, ODPC contact details,
  report retention period. The assessment terms now carry no owner
  questions at all; the privacy notice keeps two that are decisions
  rather than facts (pin the storage region? adopt a fixed retention
  period?), both flagged for the reviewer. **Draft markings stay until
  the professional review** — that is now the only thing between these
  pages and being final.
- [x] Re-align Privacy, Commercial Relationships and tool-limitation pages
  with actual behaviour (v4.21.0, 19 Aug 2026): `/dns` documented in both
  the privacy notice and tool limitations; a false Cloudflare Web Analytics
  claim removed (no beacon is served and the CSP would refuse one); the
  Ujiajiri referral fee disclosed, with the shared-entity point stated and
  no amount published; the retired provider-directory language replaced by
  the introduction model; what Onduu contracts for corrected to match the
  live positioning. Tests now pin all of it. **Still drafts** — the pages
  remain marked for professional review and the TO CONFIRM items stand.
- [x] Assessment Terms: re-read against current behaviour and corrected to
  draft 0.2 (v4.39.0, 19 Aug 2026): the false two-year retention claim now
  matches the privacy notice (no automatic deletion schedule); scope
  narrowed to the human-reviewed assessment with the free tools pointed at
  the tool limitations page; DKIM wording matches the code. Still a draft;
  TO CONFIRM items stand for professional review.
- [x] Retention and deletion decided by the owner 19 August 2026
  (v4.39.1): **the formal policy is deletion on request** — submissions and
  stored tool results are kept until deleted, and deletion requests are
  honoured — which is what the privacy notice, the Assessment Terms 0.2 and
  the code already do. The `retain_until` column (stamped two years from
  submission in `worker/submissions.ts`) is an **advisory marker only**,
  kept so a fixed-period policy could be adopted later; it must not be
  described as a promise anywhere, and adopting it for real means changing
  both legal pages and building enforcement together.
- [x] Document processors and transfer behaviour (v4.54.0, 20 Aug 2026):
  `docs/specs/processors-and-transfers.md` records every processor, what
  each receives, where data actually sits (Cloudflare EEUR, single copy,
  no replicas — verified with `wrangler d1 info`), retention, rights
  channels, and each outstanding decision tagged OWNER or LAWYER. Written
  from the running code and the live database so the professional review
  is an assessment, not an investigation. Two corrections fell out of it:
  Slack was missing from the notice's processor list, and the storage
  location was vague where it can now be exact.
- [x] Accessibility pass over the important flows (v4.42.0, 19 Aug 2026):
  tool results now take focus and are announced on all four tools; copper
  text and buttons meet WCAG AA contrast (`--copper` darkened, with a light
  tint for labels on dark grounds); select error wiring completed. Already
  solid: skip link, `:focus-visible`, reduced-motion, labelled fields, the
  submission form's error summary.
- [x] Mobile navigation (found in the 19 Aug accessibility pass, owner
  chose to build it): a no-JS `<details>` disclosure menu below 1000px
  carries the five nav links (v4.43.0). Content pages stay JS-free.

**Acceptance:** every legal statement matches observed behaviour; no draft
labels on production claims without owner sign-off; passes `REVIEW.md`.

## Phase 4 — Digital Fitness product — `in progress` (gated)

Done so far: human-reviewed assessment route live (fitness form → D1 →
review); `/email-security` checker live (renamed from `/check`, v4.7.0);
`/scan` instant fitness scan live; `/kedomains` domain search live;
`/dns` DNS health check live.

Remaining:

- [ ] Preserve the human-reviewed assessment route through all changes.
- [x] Write and approve the Instant Public Fitness Scan specification
  (`docs/specs/instant-scan.md`, spec + psr-v1 rubric approved 18 Aug 2026).
- [x] Separate Public Signal Score, Evidence Coverage and Verified Digital
  Fitness Score in product, copy and results (built into the scan
  response and its statement text).
- [x] Complete SSRF, abuse and scoring-replay tests
  (`tests/scan-{ssrf,scoring,abuse}.test.mjs`, 31 tests).
- [x] Copy review (the `/scan` page copy, v3.2.0) and privacy review
  (notice §04 rewritten to cover stored scan results, v3.2.0). Owner
  decisions recorded: results kept until deleted; domain-owner opt-out via
  email deletes the result and adds the domain to the do-not-scan list.
- [x] **LAUNCHED 18 Aug 2026** on the owner's instruction: migrations
  0004/0005 applied to production D1, `SCAN_ENABLED` set as a Worker
  secret (survives deploys; deleting it is the kill switch), `/scan`
  linked from the footer and sitemap (v4.2.0). Verified live with real
  Turnstile and real scans. Known limit: self-scanning onduu.ke from its
  own Worker under-observes (zone recursion protection) — third-party
  domains observe fully.
- [x] **DNS Health Check shipped and launched 18 Aug 2026**: spec approved
  with the owner setting the URL to `/dns` (v4.15.4), built reusing the
  scan's networking layer with registry-vs-live delegation via RDAP
  (v4.16.0), `DNS_CHECK_ENABLED` production secret set, verified live,
  `/go/dns` dashboard section added (v4.16.1).
- [x] "Three free checks" article: owner decided 19 August 2026 on a dated
  postscript rather than a follow-up article — shipped in v4.41.0 with a
  single /dns link; the historical prose is untouched.
- [ ] Shareable DNS result IDs (spec `docs/specs/dns-check.md` §5) —
  deferred to v2 behind an owner gate.

**Acceptance:** every tool reports only public observations; missing
private evidence is never scored as pass or fail; threat-model tests pass;
owner approves each launch (scan and DNS check: granted 18 Aug 2026).

## Phase 5 — Guides, tools and content system — `in progress`

Status corrected 19 August 2026: this said `not started` while five guides
were already written, live and in the sitemap. Found in the same pass that
caught the navigation defect below.

- [x] Trigger-based guides: domains (`/guides/domains-and-dns`), DNS (same
  guide plus the `/dns` tool), email trust (`/guides/email-and-trust`),
  websites (`/guides/website-revenue-system`), Kenyan infrastructure
  (`/guides/kenyan-vps`), supervised agents (`/guides/agents-on-vps`).

**Buzz — a conditional content area, currently with no page.** An
educational guide was published at `/guides/buzz-workspaces` (v4.45.0,
19 Aug 2026, from the brief's approved wording with the service framing
removed) and **removed on the owner's instruction the next day**
(v4.49.1, 20 Aug 2026; the route 301s to `/guides/agents-on-vps`). Its
protocol claims had not been verified against the deployed Buzz build.
The full text survives in git history (v4.45.0) if it is ever wanted
again. The conditions below still govern anything further. The Current
Version
strategy permits Buzz only as a **content area "presented responsibly"**,
and its "Buzz Fit Lab" belongs to the programmes that "should be
educational methods, controlled demonstrations or approved labs — not
unsupported service promises". Phase 1 deliberately retired the
service-shaped treatment: `/infrastructure/buzz-agent-collaboration`
("Assess a Buzz pilot", with a Fit / Pilot / Not yet verdict) was removed
in v4.0.0 and 301s to `/guides/agents-on-vps`. `CLAUDE.md` also names Buzz
among the things the site must not lead with, and the site's own "claims we
will not make" includes "Every client needs Buzz or a new website".

Any further Buzz content must keep the educational or approved-lab form
the strategy describes; a pilot-assessment offer must not be rebuilt
without separate approval. Two open points on the published guide, for the
owner: its protocol section states general Nostr behaviour (key-pair
identity, relay storage, deletion as a request) that has **not** been
verified against the deployed Buzz build, and the brief's instruction to
"mark infrastructure, Buzz deployment and managed-agent commercial copy as
draft or hide those CTAs from production" was read as covering commercial
copy only — the guide carries no Buzz CTA, so it ships ungated. Say if you
want it gated instead.
- [x] One relevant next path per article — every guide carries the standard
  closing CTA through `StandardPage`.
- [x] Guides reachable by clicking (v4.44.0, 19 Aug 2026): the index printed
  each guide's URL as plain `<small>` text instead of linking it, so four of
  the five guides had no clickable route anywhere on the site and the fifth
  only through the footer. Cards now link from their headings.
- Sustainable LinkedIn/YouTube repurposing workflow; no low-value generic
  duplication.
- (Deferred from Phase 0.5) Convert Insights block model to MDX content
  collections.

**Acceptance:** each guide has an approved source, one CTA, and passes
`REVIEW.md`; repurposing workflow documented and running.

## Phase 6 — Evidence and optimisation — `in progress`

Status corrected 20 August 2026: this said `not started` while the
measurement half was substantially built. Recording it accurately matters —
an understated roadmap is how five guides sat unclickable for weeks.

- [ ] Publish only approved case evidence with transparent methods. **Not
  started, and blocked on the owner**: no customer has consented to a
  published result, and nothing may be published without that.
- [~] Measure: assessment starts, qualified partner clicks, approved
  HOSTAFRICA-path clicks, guide engagement, completed enquiries.
  - Server-side page views, referrers, countries and devices: recording
    since v2.x, unblockable, exact.
  - Routed-click counting to the HOSTAFRICA and Ujiajiri destinations:
    live, visible at `/go/routing`.
  - First-party engagement tracker (`/api/event`): shipped v4.46.0.
    **Storing nothing in production until migration 0007 is applied.**
  - `/go/analytics`: date ranges, previous-period comparison, coverage
    panel, CSV export and a stated basis on every metric (v4.48.0).
  - Still to build: clicks by page and element, engagement per page, entry
    and estimated exit pages, conversions — specified as the second slice
    of analytics Phase 2, and best built once there is data to build
    against.
- [ ] Improve from evidence; do not add offers to fill navigation.

**Acceptance:** every published number traces to first-party data; metrics
reviewed against the routing goals; passes `REVIEW.md`.

## Not now / gated

Not built, linked or promised until operating requirements are met and the
owner approves:

- Public youth enrolment; HOSTAFRICA-branded training; certifications.
- Unmanaged partner submissions; unapproved commissions; client matching.
- Managed Website Operations and any direct agent services.
- HOSTAFRICA brand assets, programme claims, tracking routes and
  endorsements.
- Buzz pilot-assessment offers ("Assess a Buzz pilot" and the Fit / Pilot /
  Not yet verdict retired in v4.0.0). Buzz as an educational or
  approved-lab content area is permitted — see Phase 5.

## Owner decisions and external approvals needed

| Decision | Needed for | Status |
| --- | --- | --- |
| Supply 16 Aug two-site strategy document | Phases 1–2 | **supplied 18 Aug 2026** — filed under `docs/strategy/` (with the 18 Aug Current Version consolidating it) |
| Supply 15 Aug brief PDF (secondary source) | Phases 1–3 | **supplied 18 Aug 2026** — `docs/strategy/onduu-website-brief-2026-08-15.pdf` |
| Approve governance files (this commit) | everything | **approved 19 Aug 2026** — explicit owner sign-off of `CLAUDE.md`, `ROADMAP.md` and `REVIEW.md` recorded during the full-repo audit session (v4.39.1) |
| Approve Astro migration merge after preview | Phase 0.5 | **approved and merged 18 Aug 2026** (PR #1, v3.0.0, live) |
| Approved HOSTAFRICA destination + wording | Phase 2 | **decided 18 Aug 2026**: panel.hostafrica.com with UTM attribution only, no affiliate parameter, no commission (v4.1.0) |
| Identity/contact facts; lift draft markings | Phase 3 | outstanding |
| Retention policy: deletion on request, no fixed period | Phase 3 | **decided 19 Aug 2026** — `retain_until` stays advisory only (v4.39.1) |
| Instant-scan specification approval | Phase 4 | **approved 18 Aug 2026** (spec + psr-v1 rubric) |
| Scanner public launch approval | Phase 4 | **approved and launched 18 Aug 2026** (v4.2.0, `SCAN_ENABLED` set) |
| DNS Health Check spec, URL and launch | Phase 4 | **decided 18 Aug 2026**: spec approved, owner set the URL to `/dns`, launched (v4.15.4–v4.16.1) |
| "Three free checks" article: acknowledge the fourth tool | Phase 4/5 | **decided 19 Aug 2026** — dated postscript, shipped v4.41.0 |
| Shareable DNS result IDs (dns-check spec §5) | Phase 4 | outstanding — deferred to v2 |
