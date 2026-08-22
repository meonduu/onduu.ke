# onduu.ke

The Onduu website: an Astro 5 application (React islands for the forms and
tools) deployed to Cloudflare Workers. Positioning follows the 18 August
2026 strategy (education, Digital Fitness and demand-routing — see
`docs/strategy/`). Repository governance lives in `CLAUDE.md` (permanent
rules), `ROADMAP.md` (state), `REVIEW.md` (the shipping standard) and
`OPERATIONS.md` (recurring checks and the lessons register) — read those
first.

## What is included

- The repositioned architecture: home, `/digital-fitness` (the assessment,
  primary CTA everywhere), `/how-it-works`, `/paths/*` (Ujiajiri
  introductions; HOSTAFRICA infrastructure, each with its disclosure),
  `/guides/*` (six guides), `/about`, `/contact`, Insights, and the legal
  pages (published as marked drafts pending professional review).
- **Four free tools**: `/email-security` (SPF/DKIM/DMARC/MX), `/dns`
  (delegation and DNS health), `/domains` (Kenyan domain search),
  `/scan` (Instant Public Fitness Scan; Public Signal Score only, never
  a verdict). The scan and DNS check are gated on the `SCAN_ENABLED` and
  `DNS_CHECK_ENABLED` Worker secrets.
- The 12 Insights articles, rendered from a typed block model
  (`src/data/insights-data.ts` — regenerate rather than hand-edit).
- Working assessment and contact forms: server-side validation, Turnstile
  Siteverify, rate limiting, D1 storage, and a notification email carrying
  only the reference (delivery failures log a structured, PII-free line).
- First-party measurement only: server-side page views (unblockable ground
  truth), routed-click counting, and a browser engagement tracker
  (`/api/event`) that honours GPC/DNT, stores no identifier that outlives
  a tab, and never runs on `/go`.
- `/go`, the private dashboard (enquiries, per-tool usage, analytics with
  date ranges and CSV export), protected by Cloudflare Access bound to the
  onduu.ke hostname (`workers_dev` stays disabled for exactly this
  reason) and carrying its own `script-src 'none'` security policy.
- sitemap.xml, rss.xml, robots.txt, canonical URLs and per-page metadata.

## Architecture

- `src/pages/` — routes: `index.astro`, the tool pages, `404.astro`, the
  shared `[...slug].astro` renderer, `go.ts` + `go/[section].ts`, and the
  API endpoints (`api/submit`, `api/check`, `api/event`, feeds).
- `src/middleware.ts` — legacy redirects, stale-cookie expiry, page views.
- `src/components/` — React components, server-rendered to static HTML.
  The islands are `forms.tsx`, `check-form.tsx`, `dns-form.tsx`,
  `domains-form.tsx` and `scan-form.tsx`; `attribution.ts` and
  `analytics.ts` run as plain scripts from the layout.
- `src/data/` — all page content and route policy. Content changes happen
  here, not in components.
- `worker/` — framework-agnostic endpoint logic: submissions, the four
  tools, events, feeds, dashboard, page views, security headers, stale
  cookies, and the scanner under `worker/scan/`.
- `migrations/` — D1 schema, applied to production only by the owner.
- Every HTML page renders on demand in the Worker so the middleware sees
  each request (page views, cookie expiry). Do not prerender routes
  without moving that logic first.

## Run locally

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

The dev server (port 3000) uses Cloudflare's published always-passing
Turnstile test keys (`src/data/route-policy.ts` + `.dev.vars`, gitignored),
so forms submit locally against local D1.

For release checks:

```bash
npm run build
npm run lint
npm test
npm run check:live
```

Tests boot the built Worker in real workerd via `wrangler dev` (see
`tests/helpers/server.mjs`). `check:live` inspects production as a browser
and fails on edge-injected scripts or weakened security headers — things
no local test can see.

## Deployment

Hosted on Cloudflare Workers as **`onduudotke`** — the Worker that owns
onduu.ke. A different name in wrangler config makes deploys silently create
a second Worker.

Pushes to `main` deploy automatically through Cloudflare Workers Builds;
pull requests get preview URLs. Manual deploy, only with owner approval:

```bash
rm -rf dist && npm run build && npx wrangler deploy -c dist/server/wrangler.json
```

Secrets (`TURNSTILE_SECRET`, `ZEPTOMAIL_TOKEN`, `NOTIFY_EMAIL`,
`SCAN_ENABLED`, `DNS_CHECK_ENABLED`) live only as Worker secrets. D1
migrations live in `migrations/`.

## Before shipping anything

Work in a feature branch (pushes to `main` deploy), keep content changes
inside the current `ROADMAP.md` phase, self-review against `REVIEW.md`,
and read the lessons register in `OPERATIONS.md`. Never imply that a
public scan proves security, Kenyan hosting creates compliance, a
configured backup restores, or an agent replaces accountable people.
