# Spec — Migrate onduu.ke from vinext to Astro

Owner-approved 18 August 2026 (`ROADMAP.md` Phase 0.5). Branch:
`astro-migration`. Content is **frozen** for the whole migration: no copy
changes, so the parity diff stays meaningful. Content problems found along
the way are logged in `ROADMAP.md`, not fixed here.

## Why

The site is ~95% static content (3 client components, 17 hook calls in
5,240 lines) running on vinext 1.0.0-beta.2, a beta framework that has
twice broken production (v1.3.1 nav links dead in production only; v1.1.0
stale-cache build shipped without /check). Astro renders this shape of site
as prerendered HTML with islands, on a stable, widely supported framework
with a first-class Cloudflare adapter.

## Target architecture

- Astro 5 + `@astrojs/cloudflare` (server output; static routes prerendered
  per page) + `@astrojs/react` for the three islands.
- Same Worker (`onduudotke`), same D1 binding (`onduu_leads`), same
  compatibility date, `workers_dev: false`, empty crons, observability on.
- Worker modules (`worker/*.ts`, `worker/email-check.js`) reused
  **unmodified**; only the wiring moves:
  - `/api/submit`, `/api/check`, `/go`, `/sitemap.xml`, `/rss.xml`,
    `/robots.txt` → Astro server endpoints.
  - `/email-security` redirects, stale-cookie expiry, page-view recording
    (`ctx.waitUntil` via `locals.runtime`) → Astro middleware.
- `/_vinext/image` and the `IMAGES` binding are dropped if `public/` audit
  confirms nothing needs runtime optimisation; otherwise Astro's image
  service takes over.
- Content sources unchanged byte-for-byte: `app/site-data.ts`,
  `app/pages-brief.ts`, `app/site-pages.ts`, `app/insights-data.ts`,
  `app/route-policy.ts` (moved, not edited; import paths only).
- Insights keep the typed block model; MDX conversion is deferred to
  Phase 5.
- Islands: `forms.tsx` and `check-form.tsx` (`client:load`),
  `attribution.tsx` (`client:idle`). Turnstile key switch stays on
  `import.meta.env.DEV`; public env var renamed to Astro's
  `PUBLIC_TURNSTILE_SITE_KEY` convention.

## Order of work

1. Scaffold: deps, `astro.config.mjs`, `src/` skeleton, wrangler config
   carried over. Build + dev server must run before porting starts.
2. Layout, CSS (ported as-is), navigation, shared components; static routes
   via `[...slug].astro` + `getStaticPaths`; bespoke homepage; 404.
3. Insights index + article renderers from the block model.
4. The three islands.
5. Endpoints + middleware; delete vinext-specific wiring.
6. Tests: port all 7 suites to boot the Astro-built Worker; keep every
   assertion; then the parity diff (below).
7. Full journey verification, JS-weight report, `REVIEW.md` self-review.
8. Remove vinext deps/config; changelog v3.0.0; PR for owner preview.

## Acceptance (gates the merge)

- Parity against `docs/specs/parity-baseline.json` (captured from the
  v2.11.1 production build, 37 routes): every route present with the same
  status; titles, descriptions, canonicals, og:* identical; article prose
  word-for-word (guaranteed by unchanged `insights-data.ts` + renderer
  tests, spot-checked against baseline text hashes); redirects 301 to the
  same targets; feeds equivalent.
- Known baseline quirks preserved as-is: the 404 page serves the homepage
  title with status 404.
- Forms tested end-to-end into local D1 with Turnstile test keys; `/check`
  and `/go` verified; build, lint, full tests pass from a clean build.
- Client JS weight per page reported before/after.
- Owner approves the PR preview on desktop and mobile; owner approves the
  merge. Rollback: revert the merge commit (Workers Builds redeploys) or
  `wrangler rollback`.

## Recorded deviations (all verified, none content-visible)

- **Metadata position improved:** vinext emitted title/meta inside a hidden
  div at the end of `<body>` (React hoistable metadata never hoisted
  server-side); the Astro build puts them in `<head>`. Values are identical;
  the parity diff compares values, not position.
- **Entity encoding:** Astro escapes apostrophes in `<title>` as `&#39;`;
  rendering is identical.
- **`security.checkOrigin` disabled** for behaviour parity (bare cross-origin
  POSTs reach handlers, as under vinext). Candidate hardening change later.
- **Sessions disabled** (`session: false`) so the adapter does not declare a
  SESSION KV binding that deploy would auto-provision.
- **`/_vinext/image` and the IMAGES binding dropped:** `public/` holds four
  SVGs, which never used the optimizer.
- **Attribution is no longer a React island** — same logic, loaded as a
  plain script, so content pages ship ~0.9KB JS instead of ~187KB.
- **Test harness runs over HTTP against workerd** (`tests/helpers/server.mjs`)
  instead of importing the built worker into Node; assertions unchanged; the
  dashboard test's injected env became a `--var` on the spawned server.
- **Dev-mode workerd quirks pinned in `astro.config.mjs`**: the
  `react-dom/server` → `.edge` alias and two `ssr.optimizeDeps.include`
  entries; each carries a comment explaining the crash it prevents.

## Out of scope

Any copy change, the MDX conversion, the scanner (`worker/scan/`), and
every `ROADMAP.md` phase other than 0.5.
