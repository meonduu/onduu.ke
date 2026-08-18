# Changelog

CURRENT VERSION: v2.11.0 — 0801hrs:18th August2026

## v2.11.0 — 0801hrs:18th August2026

Governance files, approved by the owner after review.

- `CLAUDE.md` — permanent operating manual: purpose, the Onduu/Ujiajiri/
  HOSTAFRICA responsibility boundaries, content and claims rules, technical
  rules and the required work loop.
- `ROADMAP.md` — current state, the two 18 August decisions (reposition per
  the 16 Aug two-site strategy; migrate the stack to Astro), phases 0–6 with
  statuses and acceptance criteria, the gated list, and outstanding owner
  decisions.
- `REVIEW.md` — pre-merge/pre-deploy standard: outcome categories, seven
  checklist sections, twelve automatic MUST FIX blockers.
- No website code, dependencies, migrations, resources, DNS or deployment
  changes in this release.

## v2.10.2 — 0637hrs:18th August2026

Turnstile now works on localhost, using Cloudflare's published test keys.

The real widget key is registered for onduu.ke only, so every dev-server page
with a form threw error 110200 and the forms could never submit locally.

- `route-policy.ts` picks the site key by environment: under the Vite dev
  server (`import.meta.env.DEV`) it uses Cloudflare's official always-passing
  test key; production builds inline `DEV: false`, so onduu.ke keeps the real
  key. Verified in the built output — the conditional resolves to the real key.
- `.dev.vars` (new, gitignored) gives the local Worker the matching published
  test secret, so `/api/submit` verification passes locally. Neither value is
  a real credential — both are Cloudflare's documented test keys.
- Local D1 already had the migrations applied, so the whole path works in dev:
  widget issues its dummy token, the Worker verifies it against siteverify, and
  a submission stores and returns a reference (tested end-to-end, then the test
  row was deleted).

## v2.10.1 — 0629hrs:18th August2026

Three small CTA fixes from a site-wide action review.

- **/readiness no longer links to itself.** The final CTA band on every
  standard page pointed at `/readiness` — including on `/readiness`, where it
  reloaded the page the visitor was already on. On the readiness page it now
  anchors to `#request`, the form section. Every other page is unchanged.
- **/readiness has a hero CTA again.** The brief copy dropped the prototype's
  "Start my assessment" button, so visitors had to scroll five sections to find
  the form. Restored as "Start my assessment → #request".
- **/check surfaced on the homepage.** The email security check was only
  reachable from the footer. The six-part-score section now pairs "Score my
  website" with a text link "Run the free email security check → /check",
  matching the hero's button-plus-text-link pattern.

Verified on the dev server: both readiness CTAs resolve to the existing
`#request` anchor, and the homepage action row renders both links.

## v2.10.0 — 2226hrs:16th August2026

Dashboard moved to Cloudflare Access only, and a real hole closed on the way.

### The hole

Cloudflare Access protects a **hostname**, not a Worker. With the workers.dev
route live, `onduudotke.onduu.workers.dev/go` reached the same dashboard code
**without passing Access at all**. The access token was the only thing standing
in front of it there. Removing the token as first asked would have left
enquirers' names and email addresses reachable by anyone who guessed the
workers.dev subdomain.

### Closed

- workers.dev disabled — the site is served on onduu.ke only.
- `"workers_dev": false` pinned in `wrangler.jsonc`, so a future deploy cannot
  silently reopen it. Verified: the deploy after the change did not re-enable
  it.
- `/go` now requires proof it came through Access: the Worker checks the
  headers Access sets on every request it authenticates, and returns 403
  without them. If Access is ever removed or reconfigured, the dashboard
  refuses rather than quietly serving personal data.
- The signed-in identity from Access is shown on the page.

### Removed

The token gate and the `DASHBOARD_TOKEN` secret, as requested. Nothing to
remember, nothing to rotate, and no password on a page that lists enquirers.

Tests now assert 403 for any request without Access headers, that a cookie or
bearer header cannot fake it, and that supplying a token is no longer a way in.

## v2.9.0 — 2139hrs:16th August2026

Private dashboard at `/go`, and first-party page views.

### First-party page views

Recorded **server-side** on HTML responses, so nothing runs in the visitor's
browser, nothing is stored on their device, no consent is needed and no ad
blocker can suppress it. Written after the response via `waitUntil`, so it
never delays a page.

Stored: path, referring host, country and device class. **Not stored:** IP
address or any hash of one, the user-agent string (read to skip bots, then
discarded), and any session or visitor id. Two views cannot be linked to the
same person — which means this cannot report unique visitors, and does not
claim to. Bots, assets, error pages and the dashboard itself are skipped.

### The dashboard

Enquiry totals, which source and landing page produced enquiries, the last 100
enquiries, most-read pages, referring sites, and daily views.

Built to fail closed, because it displays personal data:

- **503 with no `DASHBOARD_TOKEN` configured** — no window where it sits open
  on a live site. Verified in production before the secret existed.
- Constant-time token comparison.
- The session cookie carries an HMAC and expiry, never the token, and is
  HttpOnly, Secure, SameSite=Strict, 12 hours.
- A forged cookie is refused; noindex, and disallowed in robots.

Seven tests cover the closed state, the sign-in gate, wrong tokens, cookie
hardening, forged sessions, and what is excluded from recording.

### Privacy notice

Updated in the same release to describe server-side page-view counting and
what it deliberately does not hold.

**To switch the dashboard on:**
`npx wrangler secret put DASHBOARD_TOKEN --name onduudotke`

## v2.8.0 — 2128hrs:16th August2026

Expire the analytics cookies left behind by the previous site.

v8.8 ran Google Analytics, Microsoft Clarity and an Encharge snippet. Those
cookies were still sitting in the browser of anyone who visited before August
2026. The privacy notice says this site does not track you, which was true of
what the site sets and hollow while someone else's tracking cookies remained
on the domain.

- If a request arrives carrying one, the response expires it: `_ga`, `_gid`,
  `_gat`, any `_ga_*` / `_gac_*` / `_gcl_*`, `_clck`, `_clsk`,
  `encheventsnippet`, `unique_session_id` and `wai_from_id`.
- Each is expired in all three forms — host-only, `Domain=onduu.ke` and
  `Domain=.onduu.ke` — because a cookie is only deleted when the domain and
  path match how it was set.
- **Cloudflare's own functional cookies are never touched.** Expiring
  `__cf_bm` or `cf_clearance` would break bot protection and Turnstile.
- Self-limiting: once cleared the browser stops sending them, so the headers
  stop being added. Visitors who never had them see no Set-Cookie at all, and
  static assets are never touched.

### Verified live

A request carrying `_ga`, `_ga_HFJ4SF94RP`, `_clck` and `__cf_bm` came back
with nine expiry headers for the three stale cookies and **none for
`__cf_bm`**. A clean request received zero Set-Cookie headers.

In a real browser holding seven stale cookies, **one page load cleared all
seven** — `document.cookie` went from seven names to empty.

Six new tests cover detection, the Cloudflare exclusion, the domain forms and
the asset exemption.

## v2.7.0 — 2120hrs:16th August2026

Google Analytics, Tag Manager and the consent banner removed.

With Cloudflare Web Analytics covering traffic and performance for every
visitor, and first-party attribution covering every enquiry, GA4 was buying
nothing that was not already covered — while costing a consent banner in front
of the site, a transfer of personal data to Google, and several paragraphs of
privacy notice to defend.

### Removed

- `app/consent.tsx`, the layout hook, the footer "Cookie choices" control and
  the banner styles.
- The Google Tag Manager container and everything it loaded.
- The Google processor entry and the consent-based lawful basis for
  measurement from the privacy notice.

### The notice now says what is true

No advertising tags, no third-party tracking scripts, no cookie banner because
nothing needs one. Cloudflare Web Analytics runs cookielessly on every visit;
attribution is held in session storage until a form is submitted. The note
about stale Google Analytics cookies from the previous site is kept, since
returning visitors may still carry them.

### Verified live in a browser

Banner gone, cookie control gone, no Tag Manager script, no dataLayer. The
only third-party host the page contacts is
`static.cloudflareinsights.com`. Attribution still records the visit source.

Tests now assert the **absence** of Tag Manager, Google Analytics, Clarity and
a Meta pixel on every page, so a tracker cannot return without the privacy
notice changing in the same release. The form's consent checkbox is untouched:
that is data-processing consent, not cookies.

## v2.6.0 — 2113hrs:16th August2026

First-party enquiry attribution, closing the one gap Cloudflare Analytics
cannot fill.

### What it does

The first page of a visit records the referring site, the landing path and any
UTM parameters. That travels with the form submission and is stored beside the
enquiry in D1, tied to its reference number — so "which article produced this
enquiry" is answerable from our own data.

- Held in **sessionStorage, not a cookie**: it dies with the tab and cannot
  follow anyone between visits or sites.
- **No consent gate needed** and no third party involved, so it covers 100% of
  enquiries rather than only those who accept measurement.
- Internal referrers are ignored, so moving around the site does not overwrite
  the original source.
- Server-side length caps on every field; a malformed referrer is dropped
  rather than failing the visitor's form.

Migration `0002_attribution.sql` adds the columns and an index on
(utm_source, created_at).

### Verified live

Arrived at an article with UTM parameters, navigated internally to
/readiness, submitted. Row `ON-260816-BH09` stored landing_path
`/insights/ai-in-kenya-is-about-workflow`, submitted_from `/readiness`,
utm_source `linkedin` — the original source survived the internal navigation.
Test row deleted.

### Privacy notice

Updated in the same release: arrival details are listed in what is collected,
legitimate interest is recorded as the basis, and the session-storage
mechanism is described. Three new tests cover the caps, the malformed-referrer
case and that attribution is never required.

## v2.5.1 — 2051hrs:16th August2026

**Correction: Cloudflare Web Analytics was already running, and the privacy
notice said the site had no analytics.**

Asked to add Cloudflare Web Analytics, the dashboard showed onduu.ke had been
set up 8 days ago with automatic setup, reporting 96 page views in 24 hours.
A real browser confirms `static.cloudflareinsights.com/beacon.min.js` loads on
every page.

It was missed because automatic setup injects the beacon at Cloudflare's edge
rather than in the code, so grepping the repository found nothing — and curl
does not receive the injection either. **Only a real browser shows it.** That
is the third claim in this project written from a code check and disproved by
a browser, after the menu links and the consent banner.

- The cookies section now describes both: Cloudflare Web Analytics running on
  every visit, cookieless and therefore not gated, and Google Analytics
  loading only on consent.
- Cloudflare's processor entry now mentions Web Analytics.
- Added a note that a browser which visited before August 2026 may still hold
  analytics cookies from the previous site, which this site does not set.
- Added a regression test asserting the notice describes Web Analytics as
  running, and that the "no analytics" and "intended to be added" wordings
  cannot return.

Nothing was installed for this release: the analytics was already live. The
change is that the privacy notice is now true.

## v2.5.0 — 2041hrs:16th August2026

Consent-gated Google Analytics via Tag Manager (GTM-MSMMVVZ7).

### Deny by default

Nothing measuring the visitor loads until they accept. Verified on the live
site with a cleared browser: **zero requests to Google, no GTM script and no
dataLayer** before a choice is made, and the same after declining. On accept,
GTM loads and six Google requests follow.

- The choice is stored in localStorage rather than a cookie, so declining
  leaves nothing on the device.
- Withdrawal is real: a "Cookie choices" control in the footer reopens the
  banner, and withdrawing after accepting reloads the page so measurement
  stops immediately.
- The banner ships in the HTML but is hidden by CSS and revealed by the
  client, so it still works if JavaScript is slow and never flashes at
  visitors who already answered.

### Privacy notice updated in the same release

The notice no longer claims the site runs no analytics. It now states what
loads on accept, that Google receives data outside Kenya, what declining does,
and where to change the decision. Google is listed as a processor, and consent
is recorded as the lawful basis for measurement.

### Fixed during testing

The banner would never hide: a standalone `.consent{display:none}` sat before
the main `.consent` rule, which re-declared `display:grid` and won on source
order. Class and aria-hidden were updating correctly, so only a real browser
showed it. Hiding now lives in the base rule, revealed by `.is-visible`.

Cloudflare Web Analytics is still not installed — it needs enabling on the
Cloudflare side first.

## v2.4.0 — 1909hrs:16th August2026

Owner answers applied to the legal pages and About.

### Answered

- **Controller identity.** The contracting entity is **Ujiajiri Enterprises
  Limited**, trading as Onduu. Named in the privacy notice and corrected on
  Commercial Relationships, which had described Onduu as Wycliffe's personal
  practice.
- **ODPC registration.** Not registered. No registration claim is published in
  either direction.
- **Referral benefit.** None. Commercial Relationships now states plainly that
  Onduu receives no commission, fee, revenue share or other benefit for any
  supplier choice, with a note that the page changes in the same release if
  that ever changes.
- **Retention.** No automatic deletion. The notice previously claimed data was
  "kept for two years and then deleted" — **that was false**: the code stores a
  retain_until date but nothing acts on it, and the only scheduled job was
  removed with v8.8. The section now states that data is kept until deleted by
  hand and that deletion is honoured on request.
- **Response time.** None published, per the brief.
- **Role.** Managing Director for Kenya at HOSTAFRICA, as already published in
  his own article. Statutory-director status remains unanswered and no claim
  is made either way.
- **Registrar named.** EACdirectory.co.ke, founded 2005, run for seventeen
  years, **acquired by HOSTAFRICA in 2022** — which materially strengthens the
  disclosure, since the employer is also the acquirer of the company he built.

TO CONFIRM markers reduced from 42 to 24, all now genuinely blocked on facts
or professional review.

### Not yet applied

Cloudflare Web Analytics and Google Analytics via Tag Manager are both wanted
but not installed. The privacy notice still states truthfully that the site
runs no analytics, and carries a note that it will be updated in the same
release that enables any.

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
