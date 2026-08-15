# Changelog

CURRENT VERSION: v1.2.0 — 2348hrs:15th August2026

## v1.2.0 — 2348hrs:15th August2026

Implements the outstanding items from the definitive brief
(ONDUU_DEFINITIVE_WEBSITE_CONTENT_AND_LLM_BUILD_BRIEF_2026_08_15.pdf).

### Added

- Working assessment and contact forms, replacing the non-submitting
  prototypes. Field lists and copy are taken from brief sections 10 and 24;
  confirmation and error wording from section 8.
- `POST /api/submit` with server-side schema validation, allowlists, field
  length limits, server-side Turnstile Siteverify, hourly per-client rate
  limiting, prepared D1 statements and a generic success response carrying a
  reference ID. **Fails closed** (503) when Turnstile is unconfigured.
- `onduu-leads` D1 database and migration `0001_leads.sql`. Consent is stored
  as text plus version and timestamp, not a bare boolean, with a
  `retain_until` column so retention can be enforced.
- `sitemap.xml`, `rss.xml` and `robots.txt` (brief section 26, and the
  minimum viable release). Canonical URLs and Open Graph tags on every page.
- 16 further tests covering validation, allowlists, references, feeds and the
  publication gates. 46 total.

### Changed

- Publication gates now **hide** rather than label: Managed Website
  Operations, Agent Workflow Pilot, Infrastructure and its two children, and
  Results are noindex, disallowed in robots, absent from the sitemap and
  removed from navigation and the homepage. Legal routes stay public as
  marked drafts because the forms must link to a privacy notice.
- Removed the orphaned 02:23 cron trigger. The Worker exports no scheduled
  handler, so every nightly run would have failed.

### Notes

- **The forms cannot accept submissions until a Turnstile widget exists.**
  Create one for onduu.ke, then set `TURNSTILE_SECRET` as a Worker secret and
  `NEXT_PUBLIC_TURNSTILE_SITE_KEY` at build time. Until then the form shows a
  notice and the endpoint returns 503 rather than accepting unprotected data.
- Email notification reuses the existing `ZEPTOMAIL_TOKEN` and needs
  `NOTIFY_EMAIL`. The notification carries only the reference and form type —
  no personal data.
- The brief states the site must not be publicly deployed until the approval
  gates are resolved. It is deployed, at the owner's direction.

## v1.1.0 — 2303hrs:15th August2026

Restored `/check`, the free email security checker, and corrected the deploy
configuration.

### Added

- `/check` — reads a domain's published SPF, DKIM, DMARC and MX records over
  DNS-over-HTTPS and grades them in plain language, with prioritised fixes.
  Public DNS only: no credentials, no mailbox access, nothing stored.
- `GET /api/check` handled in the Worker ahead of the app router; other methods
  return 405. Needs no bindings and no state.
- 21 offline tests over the analysers (`tests/email-check.test.mjs`) covering
  the SPF 10-lookup budget, recursive include expansion, include loops, dead
  includes, partial-pct DMARC and the provider-selector DKIM gap. 30 tests
  total across the suite.

### Changed

- `wrangler.jsonc` now names **`onduudotke`**, the Worker that actually serves
  onduu.ke. It previously named `onduu-ke`, so `wrangler deploy` created a
  second Worker on workers.dev and production never received the deploy.
  Workers Builds was unaffected — it deploys to the Worker it is bound to.

### Removed

- The stray `onduu-ke` Worker, created by the misnamed config. It held only
  three deployments from today and served no custom domain.

### Notes

- Workers Builds is **disconnected** — deleting and recreating the GitHub repo
  broke the link — so pushing to `main` no longer deploys. Until it is
  reconnected, releases are manual:
  `rm -rf dist .vinext && npm run build && npx wrangler deploy -c dist/server/wrangler.json`.
  The clean step matters: a stale `.vinext` cache silently produced a build
  with `/check` missing entirely.
- `/glossary`, `/tools` and `/domain-search` remain 404 by decision. They are
  not being rebuilt.

## v1.0.0 — 2140hrs:15th August2026

First release of the new codebase, versioned from scratch. It replaces the
previous Astro site: the 15 August 2026 website brief prototype becomes the
working site, and the only content carried over from the old build is the
Insights archive.

### Added

- Migrated all 11 live articles from `https://onduu.ke/insights/` into
  `app/insights-data.ts`. Prose was verified word for word against the source
  HTML; nothing was rewritten or summarised.
- `app/article.tsx` — article and insights-index renderers. Prose is stored as a
  block model (paragraph, h2/h3, ordered/unordered list, embed) and rendered as
  React elements, so no `dangerouslySetInnerHTML` is used anywhere.
- External article links now carry `rel="noopener noreferrer"`, `target="_blank"`
  and a screen-reader "opens in a new tab" note.
- `wrangler.jsonc` — single source of truth for Worker name, compatibility date
  and bindings, shared by `vite dev` and `wrangler deploy`.
- `IMAGES` binding, required by the `/_vinext/image` endpoint in
  `worker/index.ts`, which was previously undeclared.
- Real test suite in `tests/rendered-html.test.mjs`: renders through the built
  Worker and covers the homepage, insights index, article prose and metadata,
  the video embed, external-link safety and 404s.

### Changed

- Project moved from `onduu.ke/onduu-site/` to the repository root.
- `/insights` now lists the 11 real articles instead of the editorial-pillar
  shell.
- `vite.config.ts` reads bindings from `wrangler.jsonc` rather than an inline
  object, so dev and production cannot drift apart.

### Removed

- The three placeholder article shells (`developer-disappeared`,
  `contact-form-lead-leak`, `email-authentication-evidence`) from
  `app/site-data.ts`, superseded by the migrated articles.
- Unused starter scaffolding: `db/`, `drizzle/`, `.openai/`, `drizzle.config.ts`,
  `next.config.ts`, `app/chatgpt-auth.ts`, and the `drizzle-orm`, `drizzle-kit`
  and `@openai/sites-vite-plugin` dependencies. Nothing imported them.
- The starter's `_sites-preview` skeleton tests, which asserted against files
  deleted before this build and were already failing.
