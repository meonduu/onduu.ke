# onduu.ke

The Onduu website: a vinext (Next.js App Router on Vite) application deployed to
Cloudflare Workers. It builds on the 15 August 2026 website brief, and carries
the Insights archive migrated from the previous Astro site.

Most non-Insights routes remain design prototypes pending the approval gates
below. The Insights articles are real, published content.

## What is included

- Editorial Precision visual system using the approved colour tokens.
- Responsive homepage with a clearly labelled illustrative 62/100 scorecard.
- Layouts for the Readiness Score, How It Works, Solutions, Revenue and Risk Review, Website Revenue System, Managed Operations, Agent Pilot, Infrastructure, Labs, Results, Insights, About, Contact and legal routes.
- The 11 migrated Insights articles, rendered from a structured block model.
- Readiness and contact form designs, including consent and concern fields.
- Visible preview gates on employment, HOSTAFRICA, agents, biography, proof and legal content.
- Accessible 404 page, semantic headings, responsive layouts and reduced-motion support.

## Run locally

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

For release checks:

```bash
npm run build
npm run lint
npm test
```

## Deployment

Hosted on Cloudflare Workers. `wrangler.jsonc` holds the Worker name,
compatibility date and bindings for both local dev and deploys.

```bash
npx wrangler deploy
```

Pushes to `main` deploy automatically through Cloudflare Workers Builds; pull
requests get preview URLs.

## Content architecture

- `app/page.tsx` - bespoke homepage.
- `app/site-data.ts` - content for the standard routes.
- `app/insights-data.ts` - migrated Insights articles as typed content blocks.
  Generated from the live site; regenerate rather than hand-edit.
- `app/article.tsx` - Insights index and article renderers.
- `app/[...slug]/page.tsx` - shared route renderer and route metadata.
- `app/components.tsx` - navigation, content sections, forms and calls to action.
- `app/globals.css` and `app/site.css` - visual tokens, layouts and responsive rules.

## Production work still required

The forms are intentionally non-submitting. Before production, implement server-side schema validation, Turnstile Siteverify, rate limiting, prepared D1 queries, consent records, accessible error handling, safe reference IDs and redacted observability. Do not place personal data in logs or analytics.

Add approved self-hosted Newsreader and Manrope WOFF2 files, final metadata and social cards, canonical URLs, sitemap, robots policy, RSS, eligible structured data, analytics events, automated accessibility checks, representative mobile performance tests and deployment/rollback instructions.

## Approval gates

Do not publish until the owner approves:

1. Employment, commercial and HOSTAFRICA relationship boundaries.
2. Infrastructure referral destination and consent wording.
3. Managed Website Operations and Digital Performance Steward.
4. Paid Agent Workflow Pilot.
5. Biography facts and relationship disclosure.
6. Legal drafts, assessment rubric and retention policy.
7. Response commitment, contact destination and pilot capacity.
8. Every case study, testimonial, logo, statistic and performance claim.

Never imply that a public scan proves security, Kenyan hosting creates compliance, a configured backup restores, or an agent replaces accountable people.

## Route inventory

The package covers `/`, `/readiness`, `/how-it-works`, `/solutions`, both core solution pages, `/managed-website-operations`, the agent pilot, infrastructure hub and children, `/labs`, `/results`, `/insights` and its 11 articles, `/about`, `/contact`, four legal routes and a 404 state.

The original PDF remains the source of truth for exact production wording and detailed technical requirements.
