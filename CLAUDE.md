# CLAUDE.md — operating manual for onduu.ke

Permanent rules for working in this repository. Temporary work belongs in
`ROADMAP.md` or a spec under `docs/specs/`. Every change ships only after
passing `REVIEW.md`. Recurring verification and the lessons register live
in `OPERATIONS.md` — read its register before starting work, and add an
entry whenever a defect happens twice.

## Purpose

onduu.ke exists to help established Kenyan businesses and decision-makers
understand and improve their digital readiness — websites, conversion,
ownership, trust, resilience and infrastructure decisions.

- **Primary audience:** established Kenyan businesses and their
  decision-makers.
- **Primary conversion:** complete or request the Digital Readiness
  assessment.
- **Secondary routes:** independent implementation partners via ujiajiri.ke,
  and the approved HOSTAFRICA product path.

## Product and responsibility boundaries

Who does what:

- **Onduu educates and routes.** It is the education, Digital Readiness,
  tools, guidance and demand-routing platform. It does not currently act as
  prime contractor, collect partner project payments, manage independent
  implementation or guarantee partner delivery.
- **Independent partners implement.** Website-design and digital-marketing
  work routes to independent partners listed through Ujiajiri. The client
  chooses, contracts and pays the partner directly. Ujiajiri is the skills,
  youth/apprenticeship and independent-partner pathway — not a duplicate of
  Onduu.
- **HOSTAFRICA supplies infrastructure.** HOSTAFRICA provides, bills,
  provisions, renews and supports its domains, hosting, email and VPS
  products through an approved official route.

Disclosure and claims:

- Wycliffe is Managing Director of HOSTAFRICA Kenya. Relevant commercial
  relationships and any material benefit must be disclosed clearly, at the
  decision point where they matter — not only on a legal page.
- HOSTAFRICA brand assets, programme claims, tracking routes, product
  training and endorsements remain **gated until approved**.
- The Digital Readiness Score is Onduu's signature entry product. An instant
  domain scan may report only public observations, a Public Signal Score and
  Evidence Coverage. A **Verified** Digital Readiness Score requires customer
  evidence, review and separately authorised tests. A scan must never treat
  missing private evidence as a pass or a failure.
- Direct-delivery language — "Onduu finds and fixes", Managed Website
  Operations, direct Website Revenue System implementation, broad Agent
  Workflow Pilot promises — must not survive unless separately approved,
  staffed and contracted. (Some of this copy is still live; replacing it is
  `ROADMAP.md` Phase 1.)
- Never invent partner identities, testimonials, case studies, results,
  prices, response times, certifications or approvals.
- Never promise guaranteed security, compliance, rankings, leads, revenue,
  uptime, recovery or agent accuracy.

## Content and brand rules

- The customer is the hero; Onduu is the guide. Lead with the business
  problem and the next step — not Wycliffe, Buzz, VPS, AI or a list of tools.
- Voice: practical, calm, commercially literate, evidence-aware, transparent
  about limits. No generic agency language, no unsupported superlatives.
- One primary CTA per page. Preserve the agreed cross-site routing between
  onduu.ke, ujiajiri.ke and the approved HOSTAFRICA destination.
- Do not duplicate full content between onduu.ke and ujiajiri.ke.
- Every factual claim needs an approved source or a clear draft/unverified
  label. Article prose in `src/data/insights-data.ts` is published content —
  regenerate, never hand-edit.

## Technical working rules

**Stack (current):** Astro 5 + `@astrojs/cloudflare` on Cloudflare Workers,
with React 19 islands only on the form pages. Live since 18 August 2026
(Phase 0.5 migration, PR #1, v3.0.0), decided by the owner because the site
is ~95% static content and the previous beta framework (vinext) twice broke
production (v1.3.1 dead nav links, v1.1.0 stale-cache build missing /check).
Preserve the Astro/Cloudflare architecture unless an approved plan changes
it.

Hard-won operational rules — keep these:

- `wrangler.jsonc` must name the Worker **`onduudotke`**. Any other name makes
  `wrangler deploy` silently create a second Worker while production stays
  stale.
- **`workers_dev` stays `false`.** Cloudflare Access protects `/go` by
  hostname; a live workers.dev route exposes the dashboard with no Access at
  all.
- Pushes to `main` auto-deploy via Workers Builds. Therefore: **work in a
  feature branch or worktree, never directly on `main`.** PRs get preview
  URLs.
- Turnstile: real site key is registered for onduu.ke only; dev uses
  Cloudflare's published test keys (`src/data/route-policy.ts` + `.dev.vars`,
  gitignored). Secrets (`TURNSTILE_SECRET`, `ZEPTOMAIL_TOKEN`, `NOTIFY_EMAIL`,
  `SCAN_ENABLED`, `DNS_CHECK_ENABLED`) live only as Worker bindings —
  never in the repo. `OPERATIONS.md` item 6 is the standing inventory.
- Stale build caches produce silently wrong builds. For release checks, build
  clean.

Working discipline:

- Inspect the actual stack and neighbouring code before editing; read
  path-local instruction files where present.
- Keep changes small and task-scoped. No new dependencies or services without
  stated justification, and owner approval where required.
- Never expose secrets, personal data or customer submissions — in code,
  logs, analytics or commits.
- Do not create production resources, modify DNS, change Cloudflare
  dashboard settings or deploy without explicit owner approval.
- Record every change in `CHANGELOG.md` with a version and timestamp in the
  repo's format (`CURRENT VERSION: vX.Y.Z — HHMMhrs:DDth MonthYYYY`).

## Required work loop

1. Read `CLAUDE.md`, `ROADMAP.md`, `REVIEW.md`, the lessons register in
   `OPERATIONS.md`, and the relevant spec.
2. Inspect current code and live behaviour.
3. State the smallest implementation plan: files, risks, verification.
4. Implement one focused change.
5. Run the full relevant checks: `npm run build`, `npm run lint`, `npm test`.
6. Preview (`npm run dev`, port 3000) and test the real user journey on
   desktop and mobile viewports.
7. Self-review against `REVIEW.md`.
8. Report evidence, limitations and unresolved owner decisions.

## Source-of-truth order

When sources conflict: (1) the owner's current explicit instructions;
(2) this file and current repo architecture docs; (3) **the Onduu Strategy —
Current Version, 18 August 2026**
(`docs/strategy/onduu-strategy-current-2026-08-18.pdf`), which consolidates
and supersedes conflicting parts of the earlier documents; (4) the 16 August
two-site decision (`docs/strategy/onduu-ujiajiri-two-site-decision-2026-08-16.md`,
carries the exact approved copy) and the 15 August brief
(`docs/strategy/onduu-website-brief-2026-08-15.pdf`) where they do not
conflict with (3); (5) generic workflow guides, as advice only.
