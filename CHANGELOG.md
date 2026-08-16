# Changelog

CURRENT VERSION: v2.3.0 — 1832hrs:16th August2026

## v2.3.0 — 1832hrs:16th August2026

About page biography written, replacing the placeholder guide statement.

### Sourcing

Brief section 2 forbids publishing an unverified biography, and section 23
requires approved facts. **Every biographical claim on the page is taken from
Wycliffe's own published articles on this site**, already public under his
name. Nothing is inferred, rounded or embellished:

- ".ke domain registrar in 2005, ran it for seventeen years, acquired in 2022"
  — /insights/17-years-running-infrastructure
- "Managing Director for Kenya at HOSTAFRICA" — his own disclosure line in
  /insights/freelancers-guide-to-ethical-domain-management-in-kenya
- "in hosting since 2005" — repeated across three articles

An apparent contradiction was checked and resolved: "seventeen years" refers
to the registrar he ran from 2005 to 2022, and "since 2005" to the whole
period. Both are his wording and they agree. The page says "two decades" and
avoids computing a precise current figure, which would be a new claim.

Deliberately absent: the registrar's name, who acquired it, any
certification, award, client name or performance figure. None appear in the
source articles, so none are published.

### Changed

- The placeholder "Replace this with verified biography details" text is gone.
- The internal approval-gate notes are gone from the public page.
- The HOSTAFRICA disclosure is now stated directly rather than deferred, and
  points to the Commercial Relationships page for the full position.

## v2.2.0 — 0718hrs:16th August2026

The remaining three legal drafts written, completing brief section 25.

### Commercial Relationships (8 sections)

States the HOSTAFRICA relationship as a disclosure a client should have, and
separates what is contracted with Onduu from what is supplied by the
infrastructure provider. Confirms from the code that **this site forwards no
enquiry to any supplier** — there is no routing, integration or lead-sharing
mechanism, matching the routing rule in brief section 24.

Makes **no statement in either direction about commission or referral fees**,
because that is unresolved. Wycliffe's exact title and director status are
marked TO CONFIRM rather than asserted.

### Assessment Terms (11 sections)

Describes what an assessment observes (public DNS and pages, plus what you
declare) and what it explicitly never does: no penetration testing, no
vulnerability scanning, no login attempts, no production-form submission
without permission, no restore outside an agreed environment, no
certification. Carries the four evidence labels and states plainly that a
clean result does not prove a domain, mailbox or business is secure.

### Managed Service Terms (12 sections)

Opens by stating the service **is not yet contracted or priced** and that the
page creates no obligation. Support hours, response targets, pricing, incident
notification and offboarding terms are placeholders. The agent section records
the hard limits: no publishing, no customer contact, no DNS or production
changes, no irreversible action, and a defined way to stop it.

### Checks

No pricing appears on any page. No compliance, security or availability
guarantee is claimed. All four legal routes stay marked as drafts.
**Together the four pages carry 42 TO CONFIRM markers.**

## v2.1.0 — 0710hrs:16th August2026

Privacy notice draft written.

Fourteen sections covering everything brief section 25 requires: controller
identity, information collected, purpose and lawful basis, cookies and
analytics, the checker, processors, data locations and transfers, retention,
security, rights, consent withdrawal, complaints, and version.

**Every factual claim was checked against the code that runs the site**, not
assumed:

- the exact form fields, from worker/submissions.ts;
- 730-day retention, from the retain_until calculation;
- that logs carry only an event name, form type and reference;
- that the abuse counter stores a one-way hash of the connection address;
- that the endpoint refuses submissions when its spam check is unconfigured;
- that /check writes nothing to any database;
- that the site runs no analytics, no ad tags and no tracking cookies;
- that the ZeptoMail notification contains no personal data.

It states plainly that data may be processed outside Kenya, since the site
runs on a global network, and it makes no claim of compliance, security or
guarantee — all forbidden by section 2 of the brief.

**21 TO CONFIRM markers** flag what only the owner can supply: legal entity
details, ODPC registration, retention preference, response-time commitment
and the ODPC complaint route. The page remains marked as a draft.

## v2.0.0 — 0654hrs:16th August2026

**Publication gates lifted.** The owner reviewed and approved the previously
gated pages, so the whole site is now public.

### Published

- `/managed-website-operations`
- `/solutions/agent-workflow-pilot`
- `/infrastructure` and both child pages
- `/results`

For each: the internal "PREVIEW / APPROVAL GATE" banner removed, noindex
removed, robots disallow removed, added to the sitemap, and linked from
navigation. `GATED_ROUTES` is now empty.

### Changed

- Primary navigation restored to brief section 7, including Managed
  Operations.
- Footer expanded to the full brief structure: Managed Operations and Agent
  Workflow Pilot under Solutions; Kenyan Infrastructure, Buzz and Agent
  Collaboration and Results under Explore; all four legal routes under
  Company.
- `/legal/assessment-terms` and `/legal/managed-service-terms` are no longer
  orphans — they were in the sitemap but linked from nowhere.
- Homepage: the Managed Operations and Agent Workflow Pilot solution cards
  restored, and the evidence section links to /results again.

### Unchanged

- The four legal pages remain clearly marked as **drafts** awaiting
  professional review. Publication of the commercial pages does not change
  their status.
- Homepage section 07 stays removed, as requested separately.
- The About biography is still the generic guide statement; brief section 23
  requires approved facts before it is replaced.

Sitemap now lists 32 URLs. A crawl from the homepage reaches 33 pages, all
200 — every page on the site is now reachable by following links.

## v1.4.0 — 0648hrs:16th August2026

Removed the public "PREVIEW ONLY" badge from the homepage.

The badge marked homepage section 07, which described Managed Website
Operations — a gated offer. The brief allows unapproved commercial copy to be
either labelled as draft or hidden, so deleting the badge alone would have
left unmarked managed-agent copy in public, which is the one combination not
permitted. The whole section was removed instead, consistent with hiding the
Managed Operations route.

- Homepage section 07 (After launch / Managed Website Operations) removed.
- Remaining sections renumbered: Evidence 08 to 07, Your next step 09 to 08.
- No "PREVIEW ONLY" text, no gate-inline element and no managed-agent copy
  remain on the homepage. Verified on onduu.ke.

To restore it later, the section needs approved public-facing copy rather than
an internal review note. The Managed Website Operations page itself is
unchanged and still reachable for review at /managed-website-operations.

## v1.3.3 — 0614hrs:16th August2026

Collapsed the empty Turnstile gap on both forms.

Turnstile injects a wrapper with an explicit ~72px height even when it solves
invisibly and draws no iframe, leaving a blank band between the consent
checkbox and the submit button.

- `.turnstile-slot:not(:has(iframe)){display:none}` hides the slot only while
  there is nothing to show. If Turnstile ever draws a real challenge the
  iframe appears, the selector stops matching and the widget is displayed —
  a challenge can never be hidden from a visitor.
- The hidden token input still submits; `display:none` does not exclude a
  field from FormData.

Verified on onduu.ke: slot height 72px to 0, spacing now the ordinary 22px
grid gap, and a live submission through the hidden slot still succeeded
(reference ON-260816-QN3R, row confirmed then deleted).

## v1.3.2 — 0610hrs:16th August2026

Fixed form field alignment.

The required-field asterisk was rendered as a separate flex child of the
label, so it wrapped onto its own line and pushed that field's input down.
Because only some fields are required, inputs stopped lining up across the
two-column grid — Company sat lower than Role, and so on.

- Label text and the asterisk are now a single element, so the marker reads
  inline: "FULL NAME *".
- Controls are bottom-aligned within each label, so inputs line up across a
  row whatever the label length. Long labels that wrap to two or three lines
  no longer knock their row out of alignment.
- The consent checkbox aligns to the first line of its text rather than
  centring against the wrapped paragraph.

Verified on the production build and then on onduu.ke: full_name/business_email
and company/role each share an identical top edge. The checker form on /check
was checked too — input and button share a row at matching height.

## v1.3.1 — 0546hrs:16th August2026

Fixed: clicking any menu item did nothing.

### The fault

vinext's `<Link>` is broken in the **production build**. Clicking one threw
`TypeError: e is not a function` from inside its startTransition handler and
the navigation never happened. Every link in the header, footer, homepage and
article pages was inert for real visitors.

Direct URLs always worked, which is why the earlier link crawl passed — curl
tests server responses, not clicks. The dev server also worked, which is why
local testing missed it. **The bug only appears in the built output.**

Upgrading vinext 1.0.0-beta.2 → 1.0.0-beta.6 (with @vitejs/plugin-rsc 0.5.34)
did **not** fix it; the error simply moved. That upgrade was reverted.

### The fix

- `app/nav-link.tsx` — a plain `<a>` replaces `next/link` everywhere. Every
  click is now an ordinary page load, which cannot fail to navigate. The
  `link-*` chunk is gone from the build entirely.
- This also matches the brief's "minimal client JavaScript" requirement
  (section 28). If vinext fixes client navigation, reverting is one file.

### Verified

- Clicked through the live site, not just curl: How it works, Solutions,
  Insights and an article all load correctly on onduu.ke.
- Production build tested locally via `npm start` before deploying — the step
  that was missing when this bug shipped.
- Forms, checker, feeds and all 26 internal links still fine.

## v1.3.0 — 0006hrs:16th August2026

Page content built out against the brief, and the site-wide link audit.

### Added

- `app/pages-brief.ts` — exact approved copy from brief sections 10, 11, 12,
  13 and 25, merged over the prototype copy by `app/site-pages.ts`.
  `/readiness` and `/how-it-works` had no sections at all; they now carry the
  evidence labels, output list, process, stages, deliverables and boundaries
  the brief specifies.
- Legal routes now carry the coverage list from section 25, clearly marked as
  drafts awaiting professional review, with a direct route for data questions.
  No legal conclusions are invented.
- 301 redirects for `/email-security` and `/email-security/glossary`, the v8.8
  URLs still linked from two migrated articles and indexed by search engines.
  `/email-security` was the checker, so `/check` is its successor.

### Verified

- **Contact form end to end in production**: submitted, Turnstile passed,
  row written with all contact-specific fields, confirmation rendered,
  test row deleted. Both forms are now proven, not just the assessment one.
- **Every internal link on the site resolves** — 26 pages crawled, no
  non-200s. The only external non-200 is LinkedIn returning 999, which is
  its standard bot response, not a broken link.
- Gated routes remain reachable by direct URL for review but are noindex,
  robots-disallowed and unlinked.

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
