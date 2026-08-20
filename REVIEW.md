# REVIEW.md — the standard every change must pass before it ships

Applies to every merge into `main` and every deployment. The reviewer (human
or Claude self-review, step 7 of the work loop) assigns one outcome:

- **`MUST FIX`** — blocks merge or deployment.
- **`SHOULD FIX`** — important; may ship only if the owner explicitly accepts
  it, recorded in the PR or changelog.
- **`OKAY TO SHIP`** — no material issue found.

## Strategy and scope

- Does the change support the current `ROADMAP.md` phase and one clear user
  need?
- Does it preserve the Onduu / Ujiajiri / HOSTAFRICA boundary (who educates,
  who implements, who supplies infrastructure)?
- Does it accidentally restore a superseded direct-delivery promise
  (see the superseded-content inventory in `ROADMAP.md`)?
- Is the page's primary CTA the correct destination?

## Content and claims

- Is the customer the hero, with the next step clear within the first screen?
- Are claims specific, supported and responsibly limited?
- Are names, biography, registrations, testimonials, results, dates and
  partner statuses verified against an approved source?
- Are drafts and placeholders prevented from appearing as final claims?
- Are HOSTAFRICA relationships and material benefits disclosed at the
  relevant decision point?

## User experience

- Does the core journey work on mobile and desktop?
- Are navigation, forms, errors, loading, empty and success states clear?
- Can a keyboard and a screen reader complete the important flow?
- Is there one clear primary CTA rather than competing actions?

## Forms, privacy and routing

- Is only necessary information collected?
- Is consent wording accurate, and is consent stored with version and
  timestamp?
- Are submissions sent only to the disclosed destination?
- Are no passwords, credentials or sensitive customer records requested?
- Do retention, logs, analytics and processors match the privacy notice?
- Has end-to-end delivery been tested without exposing real personal data
  (test rows deleted afterwards)? **In production, when the behaviour
  depends on production** — secrets, real Turnstile, email sending,
  Cloudflare settings. A local pass does not discharge this: the enquiry
  notification was dead from launch until 20 August 2026 while every local
  test passed.

## Security and technical quality

- No secrets, debug code or unsafe logging; nothing personal in logs or
  analytics.
- Input validation and server-side Turnstile Siteverify where applicable;
  submission endpoints fail closed.
- Safe headers, dependencies and error handling.
- Scanner changes satisfy the separate SSRF and resource-limit threat model
  (Phase 4 spec).
- No silent failure on a path the business depends on: a catch or an
  unchecked response on enquiry delivery, payment-adjacent routing or
  data recording must log a structured, PII-free line. A critical path
  that fails without a symptom is treated as broken (the notification
  send swallowed a 401 for weeks).
- Full relevant tests, build, type checking and linting pass — run clean
  (stale build caches have shipped wrong builds before).
- For releases and after any Cloudflare dashboard change:
  `npm run check:live` passes against production — it catches
  edge-injected scripts and weakened headers that no local test can see.
- No unexplained console or network errors on the previewed pages.
- Performance and accessibility checked for regressions.

## SEO and site separation

- Unique title, description and canonical URL on every changed page.
- Correct structured data, sitemap and robots behaviour.
- No accidental content duplication between onduu.ke and ujiajiri.ke.
- Redirects preserve intended routes without loops.

## Operations and deployment

- The recurring critical-function checklist lives in `OPERATIONS.md`;
  releases and Cloudflare changes are among its triggers.

- Rollback for this change is understood and stated.
- Migrations and configuration changes are documented in `CHANGELOG.md`.
- Production deployment, DNS, Cloudflare settings, permissions and
  customer-data decisions have explicit owner approval.
- The exact tested commit and working-tree state are recorded before
  claiming readiness (`git status` clean, commit hash named).

## Automatic `MUST FIX` blockers

Any one of these blocks the change outright:

1. Onduu presented as delivering or guaranteeing independent partner work.
2. HOSTAFRICA product responsibility attributed to Onduu or Ujiajiri.
3. Unsupported performance, security, compliance, revenue or certification
   claims — or any guarantee of security, compliance, rankings, leads,
   revenue, uptime, recovery or agent accuracy.
4. Customer information routed to another organisation without the declared
   basis or consent.
5. A scanner that treats missing private evidence as a pass or a failure.
6. Broken forms or unverified enquiry delivery.
7. Secrets or sensitive data exposed in code, logs, analytics or commits.
8. Failing tests or build.
9. Material mobile or accessibility failure in a core journey.
10. Deployment, DNS or production-resource change without explicit owner
    approval.
11. Invented partner identities, testimonials, case studies, results,
    prices, response times, certifications or approvals.
12. `wrangler.jsonc` naming any Worker other than `onduudotke`, or
    `workers_dev` enabled.
