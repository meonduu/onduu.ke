# onduu.ke

The Onduu website: an Astro application (React islands for the three
interactive components) deployed to Cloudflare Workers. Content follows the
15 August 2026 brief; the Insights archive is migrated from the earlier
site. Repository governance lives in `CLAUDE.md`, `ROADMAP.md` and
`REVIEW.md` — read those first.

## What is included

- Editorial Precision visual system using the approved colour tokens.
- The homepage, Readiness Score, How It Works, Solutions, Revenue and Risk
  Review, Website Revenue System, Managed Operations, Agent Pilot,
  Infrastructure, Labs, Results, Insights, About, Contact and legal routes.
  (Several of these carry superseded direct-delivery positioning — see
  `ROADMAP.md` Phase 1 before editing their copy.)
- The 11 migrated Insights articles, rendered from a typed block model
  (`src/data/insights-data.ts` — regenerate, never hand-edit).
- Working assessment and contact forms: server-side validation, Turnstile
  Siteverify, rate limiting, D1 storage, email notification carrying only
  the reference.
- `/check`, the free email security checker (public DNS only).
- `/go`, the private dashboard, protected by Cloudflare Access bound to the
  onduu.ke hostname (`workers_dev` stays disabled for exactly this reason).
- First-party page-view recording and first-party enquiry attribution.
- sitemap.xml, rss.xml, robots.txt, canonical URLs, per-page metadata.

## Architecture

- `src/pages/` — routes: `index.astro`, `check.astro`, `404.astro`, the
  shared `[...slug].astro` renderer, and server endpoints (`api/submit`,
  `api/check`, `go`, feeds).
- `src/middleware.ts` — legacy redirects, stale-cookie expiry, page views.
- `src/components/` — React components, server-rendered to static HTML.
  Only `forms.tsx` and `check-form.tsx` hydrate (as islands);
  `attribution.ts` runs as a plain script from the layout.
- `src/data/` — all page content and route policy. Content changes happen
  here, not in components.
- `worker/` — framework-agnostic endpoint logic (submissions, email check,
  feeds, dashboard, page views, stale cookies) plus the gated scanner WIP
  under `worker/scan/`.
- Every HTML page renders on demand in the Worker so the middleware sees
  each request (page views, cookie expiry). Do not prerender routes without
  moving that logic first.

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
```

Tests boot the built Worker in real workerd via `wrangler dev` (see
`tests/helpers/server.mjs`).

## Deployment

Hosted on Cloudflare Workers as **`onduudotke`** — the Worker that owns
onduu.ke. A different name in wrangler config makes deploys silently create
a second Worker.

Pushes to `main` deploy automatically through Cloudflare Workers Builds;
pull requests get preview URLs. Manual deploy, only with owner approval:

```bash
rm -rf dist && npm run build && npx wrangler deploy -c dist/server/wrangler.json
```

Secrets (`TURNSTILE_SECRET`, `ZEPTOMAIL_TOKEN`, `NOTIFY_EMAIL`) live only as
Worker secrets. D1 migrations live in `migrations/`.

## Before shipping anything

Work in a feature branch (pushes to `main` deploy), keep content changes
inside the current `ROADMAP.md` phase, and self-review against `REVIEW.md`.
Never imply that a public scan proves security, Kenyan hosting creates
compliance, a configured backup restores, or an agent replaces accountable
people.
