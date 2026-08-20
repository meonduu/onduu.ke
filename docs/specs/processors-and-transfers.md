# Processors and transfers — record of processing

**Status: DRAFT for professional review, 20 August 2026.** Prepared by
reading the running code and querying production, not from memory. Every
factual claim below is checkable by the command or file named beside it.
Items marked **OWNER** need a decision only Wycliffe can make; items marked
**LAWYER** need the professional review that `ROADMAP.md` Phase 3 awaits.
The public pages no longer use the phrase "TO CONFIRM" — visitor-facing
copy says "still to decide" instead (v4.60.0). This register keeps the
internal vocabulary, which is what it is for.

This is the internal register behind the public privacy notice
(`/legal/privacy`, sections 06 and 07). The notice is written for
visitors; this is written for the reviewer who has to assess lawfulness.
Where they disagree, the notice is wrong and must be corrected — the
notice is the promise, this is the evidence.

## 1. What is processed

| Data | Where it comes from | Where it is stored | Personal? |
| --- | --- | --- | --- |
| Enquiry submissions: name, business email, company, role, website, free-text answers | The two forms (`/readiness`, `/contact`) | D1 `submissions` | **Yes** |
| Consent record: text, version, timestamp, `retain_until` | Same submission | D1 `submissions` | Yes (attached to the above) |
| Attribution: referrer, landing path, campaign parameters | Session storage, sent with the submission | D1 `submissions` | Yes (attached) |
| Page views: path, referrer host, country, device class | Server-side, every HTML response | D1 `page_views` | No identifier stored |
| Engagement events: path, label, tab-scoped session id, engaged ms | Browser tracker (`/api/event`) | D1 `events` | No identifier that outlives a tab |
| Tool results: domain checked, observations, score | The four tools | D1 `scans`, `tool_checks` | About domains, not people |
| Abuse counters: short-lived SHA-256 client key | Derived from connection address, never stored with a result | D1 `*_throttle` | Pseudonymous, short-lived |
| Notification health: outcome, provider code, timestamp | Each notification attempt | D1 `notify_health` | No |

Verify: `migrations/*.sql`, `worker/submissions.ts`, `worker/events.ts`,
`worker/pageviews.ts`.

## 2. Processors

### Cloudflare (Cloudflare, Inc.)
- **Role**: hosting (Workers), database (D1 `onduu-leads`), spam check
  (Turnstile), public DNS resolution for the tools, and Access
  authentication for `/go`.
- **Receives**: everything the site stores, by definition of being the
  host and database.
- **Location**: the database runs in region **EEUR (Eastern Europe)**,
  single region, read replication **disabled**. Verify:
  `npx wrangler d1 info onduu-leads`. The Worker itself executes at the
  Cloudflare edge location nearest the visitor, worldwide.
- **Basis**: necessary for performance of the service.
- **LAWYER**: Cloudflare's data processing addendum and SCCs should be
  identified and referenced; Onduu has not recorded which version applies.

### ZeptoMail (Zoho Corporation)
- **Role**: sends the enquiry notification to the owner.
- **Receives**: the reference number, which form was used, and the
  `NOTIFY_EMAIL` address. **No submitted content, no enquirer name or
  email.** Verify: `notify()` in `worker/submissions.ts`.
- **Basis**: legitimate interest in knowing an enquiry has arrived.

### Slack (Salesforce, Inc.)
- **Role**: second notification channel, added 20 August 2026 (v4.52.0).
- **Receives**: the same minimal message — reference and form type only.
  Verify: `notifySlack()` in `worker/submissions.ts`.
- **Basis**: as above. Optional: absent `SLACK_WEBHOOK_URL`, nothing is
  sent.

### Contacted, but receiving nothing about visitors
Registries answering RDAP lookups, parent-zone and authoritative
nameservers questioned by `/dns`, and the public pages fetched by `/scan`.
Each sees a request from Onduu's infrastructure carrying only the domain
being checked — never anything about the visitor who asked.

### Explicitly not processors
No analytics company. No advertising network. No AI or language-model
provider receives submissions. Cloudflare Web Analytics was disabled on
20 August 2026 and its beacon no longer served — verify with
`npm run check:live`, which fails if any injected script returns.
`VBOUT_API_KEY` is parked for a future email-marketing integration and is
**not** wired to anything; using it would add a processor and require this
register and the notice to change in the same release.

## 3. Transfers outside Kenya

Personal data is stored in Cloudflare's EEUR region and served from a
global network, so it is processed outside Kenya. The site says so
plainly rather than implying local storage.

- **OWNER**: whether to pin storage to a specific region, accepting the
  latency and availability consequences, or to keep the current
  arrangement and rely on contractual safeguards.
- **LAWYER**: which transfer mechanism to record under the Data Protection
  Act 2019 (§48–50) — adequacy, appropriate safeguards, or the specific
  consent/necessity grounds — and what to publish about it.

## 4. Retention

No automatic deletion runs anywhere. Submissions, page views, events and
tool results persist until deleted by hand; deletion on request is
honoured. `retain_until` is stamped two years ahead on each submission but
**nothing enforces it** — it is an advisory marker only, recorded as such
in `ROADMAP.md` (owner decision, 19 August 2026).

- **OWNER**: whether to adopt a fixed retention period. The notice already
  states that indefinite retention is a weaker position under the Act.
- Pruning statements the owner can run are documented in
  `migrations/0007_analytics_events.sql` and `OPERATIONS.md`.

## 5. Rights and channels

Access, correction, deletion, objection, portability and consent
withdrawal all route through the contact form at `/contact` (the owner's
personal address was removed from the site on 20 August 2026, v4.51.0).
Submissions from that form reach Onduu only.

- **OWNER**: the ODPC contact details and complaint route to publish.
- **OWNER**: how assessment reports are delivered, stored and accessed,
  and whether anonymised findings may ever be used as examples.

## 6. Owner answers, 20 August 2026

Confirmed by Wycliffe and reflected in the pages:

- **Controller**: Ujiajiri Enterprises Limited, a limited liability company
  registered in Kenya. Onduu is a brand, not a registered company.
  Registration number and registered address still outstanding.
- **HOSTAFRICA**: he is a **statutory director** of the Kenyan company, not
  only MD by title. Published as such in v4.55.0, then **removed by the
  owner's own page copy in v4.56.0**, which says "Managing Director"; the
  owner confirmed that choice deliberately on 20 August 2026. The fact is
  kept here for the reviewer, who should know the relationship is a
  directorship with formal duties even though the site states the title
  only.
- **Employment boundary**: nothing Onduu offers is excluded; operating
  Onduu is permitted under his arrangement with HOSTAFRICA rather than
  merely tolerated. (The commercial background sits with the owner; the
  site states the permission, not the terms.)
- **Conflicts policy**: none exists as a separate document. The published
  principles are the whole of it, and the pages now say so instead of
  implying a withheld policy.
- **Complaints**: handled by Ujiajiri Enterprises Limited through the
  contact form, which gained a "complaint" option. The independent right
  to complain to the ODPC is retained in the notice — a regulator route
  cannot run through the controller's own form. ODPC contact details still
  outstanding.
- **Assessment reports**: emailed by Wycliffe; he is the only reader,
  because Onduu is one person. The report is the client's to act on and to
  share with whoever helps them act on it.

- **Publication of findings** (20 Aug 2026): aggregate-only without
  consent — a published figure covers at least ten assessments, no
  subdivision below five, identifying detail omitted regardless. Anything
  narrower needs written consent against the exact wording proposed. The
  reasoning: in a market this size an "anonymous" example is often
  recognisable, so re-identification risk is treated as the default rather
  than the exception, and consent is the control rather than Onduu's own
  judgement of identifiability.
- **Removed from the public pages at the owner's instruction**
  (20 Aug 2026): the company registration number and registered address,
  the ODPC's contact details, and any stated retention period for a sent
  report. The controller remains named and contactable; the independent
  right to complain to the regulator remains stated.

- **Intellectual property** (20 Aug 2026): the report and its findings are
  the client's, to act on and to share with anyone helping them act on it.
  The scoring method, the six dimensions, the evidence labels and any blank
  template remain Onduu's — usable by the client for their own business,
  not to be repackaged, resold or built into a competing assessment.

Still outstanding after these answers: the registration number and address,
nothing on the assessment terms. The privacy notice keeps two open
questions that are decisions rather than facts: whether to pin the storage
region and which transfer safeguard to record, and whether to adopt a fixed
retention period. Both are noted for the professional review.

## 7. What this register does not do

It states no legal conclusion. It records what the software does, where
the data sits and which decisions are outstanding, so that the
professional review can be an assessment rather than an investigation.
