# Processors and transfers — record of processing

**Status: DRAFT for professional review, 20 August 2026.** Prepared by
reading the running code and querying production, not from memory. Every
factual claim below is checkable by the command or file named beside it.
Items marked **OWNER** need a decision only Wycliffe can make; items marked
**LAWYER** need the professional review that `ROADMAP.md` Phase 3 awaits.
Note (22 Aug 2026): the privacy notice and assessment terms were published
as v1.0 on the owner's decision without waiting for that review. Publishing
them did not answer any question below — every **LAWYER** item here is still
open, and a published notice that turns out to be wrong is now wrong in
public rather than in draft.
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
| Enquiry submissions: name, business email, company, role, website, free-text answers | The two forms (`/digital-fitness`, `/contact`) | D1 `submissions` | **Yes** |
| Consent record: text, version, timestamp, `retain_until` | Same submission | D1 `submissions` | Yes (attached to the above) |
| Attribution: referrer, landing path, campaign parameters | Session storage, sent with the submission | D1 `submissions` | Yes (attached) |
| Page views: path, referrer host, country, device class | Server-side, every HTML response | D1 `page_views` | No identifier stored |
| Engagement events: path, label, tab-scoped session id, engaged ms | Browser tracker (`/api/event`) | D1 `events` | No identifier that outlives a tab |
| Tool results: domain checked, observations, score | The four tools | D1 `scans`, `tool_checks` | About domains, not people |
| Abuse counters: HMAC-SHA-256 client key, per purpose, daily bucket | Derived from connection address with `CLIENT_KEY_SECRET`, never stored with a result | D1 `*_throttle` | Pseudonymous — genuinely so since 22 Aug 2026 |
| Notification health: outcome, provider code, timestamp | Each notification attempt | D1 `notify_health` | No |

Verify: `migrations/*.sql`, `worker/submissions.ts`, `worker/events.ts`,
`worker/pageviews.ts`.

> **Correction, 22 August 2026.** Until this date the counter key was an
> unkeyed SHA-256 of the address truncated to 64 bits. IPv4 is a 2^32
> space, so anyone holding the database could walk it and recover every
> address exactly — which made "pseudonymous" in the row above untrue as
> written, not merely optimistic. It is now HMAC-SHA-256 under a Worker
> secret, with a per-purpose prefix so the four tables cannot be joined on
> one visitor, and a daily bucket so identifiers stop matching by
> construction. Found by an external security review (OWASP A04). If
> `CLIENT_KEY_SECRET` is unset the old behaviour returns, so `/go` shows a
> red light while that is the case.

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
- **Role**: sends the enquiry notification to the owner; since 21 August
  2026 (v4.84.0) also delivers the do-not-scan confirmation link to a
  domain owner.
- **Receives**: for notifications, the reference number, which form was
  used, and the `NOTIFY_EMAIL` address. **No submitted content, no
  enquirer name or email.** Verify: `notify()` in `worker/submissions.ts`.
  For a do-not-scan confirmation, the requester's email address (at the
  domain in question) and the domain, in one message. Verify:
  `sendConfirmation()` in `worker/do-not-scan.ts`. The notice's ZeptoMail
  card states this exception.
- **Basis**: legitimate interest in knowing an enquiry has arrived; for
  the confirmation, performing the opt-out the requester asked for, with
  the requester's agreement to that one email given on the form.

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

### HOSTAFRICA (assessment agents)
- **Role**: provides the servers Onduu's assessment agents — **Hermes** and
  **Buzz** — run on. The agents perform the first-pass analysis of an
  assessment across the six dimensions; a person reviews every finding,
  score and recommendation before a report is issued. Agents live since
  21 August 2026; HOSTAFRICA named here 22 August 2026 (owner).
- **Receives**: the substance of the assessment — declared answers, the
  domain and the public evidence — **with the name, email address and
  company name removed before anything is sent.** No identifying data
  leaves Onduu.
- **Scope**: the Digital Fitness Assessment only. `/scan`, `/dns`,
  `/email-security` and `/domains` are deterministic checks and involve no
  agent.
- **Basis**: performance of the assessment the customer requested.
- **Relationship**: Onduu's operator is Managing Director of HOSTAFRICA
  Kenya. This is not an arm's-length processor, and the privacy notice
  says so at the point it names HOSTAFRICA. The commercial mechanics stay
  on `/legal/commercial-relationships` (CLAUDE.md, one page only).
- **Answered 22 Aug 2026 (owner):** the agents do call external model APIs.
  See the section below. The question was left open rather than assumed on
  21 August, and the answer changed the disclosure — which is the argument
  for leaving such questions open.
- **LAWYER**: whether a processing agreement exists between Ujiajiri
  Enterprises Limited and HOSTAFRICA, and what it says about
  confidentiality, retention and sub-processing. A directorship is not a
  substitute for one.

### Anthropic (Anthropic PBC) and OpenAI (OpenAI, L.L.C.)
- **Role**: operate the language models Hermes and Buzz call from the
  HOSTAFRICA servers. Named 22 August 2026 (owner).
- **Receives**: the substance of an assessment — declared answers, the
  domain, public evidence — without name, email address or company name.
  **This is not anonymous data.** The domain identifies the business that
  owns it, so the removal protects the individual, not the company, and
  the notice now says so rather than claiming de-identification it cannot
  deliver.
- **Location**: both outside Kenya. This widens section 3 beyond
  Cloudflare's EEUR region.
- **Basis**: performance of the assessment the customer requested.
- **Answered 22 Aug 2026 (owner): OpenRouter has been removed.** Anthropic
  and OpenAI are called directly, so no broker chooses which provider
  serves a request and there is no further processor to name. DeepSeek was
  dropped in the same decision; the register and the notice describe that
  limited arrangement, and they are accurate once it is in force.
- **LAWYER**: confirm each provider's API terms on training and retention.
  Business API tiers commonly exclude training by default, but "commonly"
  is not a record, and nothing here has been verified against the
  contracts.

### Explicitly not processors
No analytics company. No advertising network. Cloudflare Web Analytics
was disabled on 20 August 2026 and its beacon no longer served — verify with
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
Submissions from that form stay inside Ujiajiri Enterprises Limited,
which operates Onduu; no partner, provider or HOSTAFRICA team receives
them (processors per section 2).

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

## 7. Introductions to independent providers — operating procedure

Owner policy, 20 August 2026. The website states the client-facing half;
this is the procedure and the evidence a reviewer would ask for.

**The boundary**: a partner is never copied into a first response merely
because someone submitted a form on onduu.ke. Submitting a form does not
disclose anything to anyone outside Ujiajiri Enterprises Limited.

**The sequence**:

1. Ujiajiri receives the enquiry and responds.
2. If the client asks for implementation help, Ujiajiri selects a proposed
   independent provider.
3. Ujiajiri tells the client who that provider is and exactly what
   information would be shared.
4. The client gives affirmative permission.
5. Ujiajiri sends the introduction email, copying the client and the named
   provider.

**Permission wording** to use at step 4, naming the recipient, the data and
the purpose:

> I agree that Ujiajiri may share my name, email address, telephone number
> and the project summary shown above with [Provider legal name] for the
> purpose of responding to this introduction.

**Records**: keep the permission, and share only what the provider needs.

**OWNER**: each regular provider relationship needs written data-sharing
terms covering purpose, confidentiality, security, retention and deletion,
and client rights. None are recorded as existing yet.

**Basis**: this follows the ODPC's consent guidance, which expects the
recipient and the purpose to be identified, and the Act's transparency,
purpose-limitation and minimisation principles.

- ODPC guidance note on consent (September 2025):
  https://www.odpc.go.ke/wp-content/uploads/2025/09/Guidance-note-on-Consent.pdf
- Data Protection Act 2019:
  https://new.kenyalaw.org/akn/ke/act/2019/24/eng%402019-11-15

**Who reads an enquiry** (revised 20 August 2026): enquiries and reports
are received by Ujiajiri Enterprises Limited and seen inside it only by
those who need them. The earlier statement that Wycliffe was the only
reader was removed when this policy made it inaccurate.

## 8. What Ujiajiri Enterprises Limited must do

onduu.ke now publishes commitments that only Ujiajiri can honour. Checked
against ujiajiri.ke on 20 August 2026; its partners page already describes
the private curated network, and its introduction page already promises to
name the provider and seek permission, so the two sites broadly agree.
These are the gaps:

- **ujiajiri.ke has no privacy notice** — `/privacy` and `/privacy-policy`
  both 404, while it collects introduction-request data through its own
  form. Onduu names Ujiajiri as controller; Ujiajiri publishes nothing.
  The largest gap, and one for the same legal review.
- **State exactly what would be shared.** Ujiajiri's page says "your
  information"; Onduu's says name, contact details and project summary.
  Naming the fields is what the ODPC consent guidance expects.
- **"Decline without affecting your assessment or advice"** is published on
  onduu.ke and appears nowhere on ujiajiri.ke. Whoever handles
  introductions must honour it.
- **Written partner agreements** must actually exist: onduu.ke states the
  referral fee sits under one, and that the provider must disclose whether
  it affects the quoted price.
- **Written data-sharing terms per regular provider** — purpose,
  confidentiality, security, retention and deletion, client rights. None
  recorded as existing.
- **Internal access** to enquiries and reports must be limited to those who
  need them, as both sites' copy now implies.
- **`info@ujiajiri.ke`** is published on onduu.ke for introduction and
  provider questions, and receives enquiry notifications (reference and
  form type only — details live in D1 and at `/go/enquiries`, which is
  behind Cloudflare Access). Whoever monitors it needs to know both.
- **Sending mail from ujiajiri.ke** requires verifying that domain in
  ZeptoMail and updating its DNS; its SPF currently authorises Google and
  SparkPost with no Zoho sender.

## 9. What this register does not do

It states no legal conclusion. It records what the software does, where
the data sits and which decisions are outstanding, so that the
professional review can be an assessment rather than an investigation.
