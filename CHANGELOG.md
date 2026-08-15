# Changelog

CURRENT VERSION: v1.0.0 — 2140hrs:15th August2026

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
