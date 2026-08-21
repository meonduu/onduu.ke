# Spec — Instant Public Fitness Scan

**Status: LIVE. Launched 18 August 2026 on the owner's instruction** after
all §7 gates passed (SSRF/abuse/scoring-replay suites, privacy review with
recorded retention and opt-out decisions, copy review). Migrations
0004/0005 applied to production; `SCAN_ENABLED` set as a Worker secret so
it survives deploys — deleting the secret is the instant kill switch.
Verified live: real Turnstile, real scans, cache and reference IDs working.

**Known vantage limitation:** scanning onduu.ke *from its own Worker*
under-observes (Cloudflare blocks a Worker fetching its own zone), so the
site's self-scan reports honest-but-low Evidence Coverage with web signals
"not publicly observable". Third-party domains — the product's purpose —
observe fully (verified live).

## 1. What it is, and is not

A visitor enters a domain and receives, in under ~20 seconds, a report of
**publicly observable signals** about that domain's digital fitness,
summarised as a **Public Signal Score** with an explicit **Evidence
Coverage** figure. It is Onduu's instant entry product: the widened
successor to `/check`, and the on-ramp to the human-reviewed assessment
(the primary conversion) and, later, the **Verified Digital Fitness
Score**.

It is **not** a security audit, a compliance check, a penetration test, or
a Digital Fitness Score. It observes only what anyone on the internet can
already see. Three sentences govern everything below:

1. The scan reports **only public observations**, each with its evidence
   and its limitation.
2. **Missing private evidence is never scored as a pass or a failure** — it
   is reported as *not publicly observable* and excluded from scoring.
3. A **Verified** Digital Fitness Score requires customer evidence, human
   review and separately authorised tests; the scan must always say so.

## 2. Observations (v1 signal set)

Grouped by the six fitness dimensions. Every signal is deterministic:
derived from fetched bytes by fixed rules, no sampling, no model calls.

| Dimension | Publicly observable in v1 | Never observable publicly |
| --- | --- | --- |
| **Control** | Registrar, nameservers, registration/expiry dates via RDAP; DNSSEC presence; whether NS, web host and mail are spread across providers (single-vendor concentration is reported, not judged). | Who holds the accounts, admin access, recovery. |
| **Trust** | HTTPS reachability and certificate validity/expiry window; HSTS and the other retained security headers; apex↔www and http→https redirect coherence; visible business identity on the homepage (title, meta description present). | Whether claims on the site are true; certifications. |
| **Speed** | Response basics from one fetch: TTFB band, compressed HTML size, viewport meta present. Reported as coarse bands with the limitation "one request, one location, no browser rendering". | Real-user performance, Core Web Vitals. |
| **Conversion** | A reachable contact path on the homepage (tel/mailto/contact link/form presence — presence only, nothing submitted); 404 handling returns a page, not an error dump. | Whether enquiries are answered; form delivery. |
| **Resilience** | Email authentication: SPF, DKIM (common selectors), DMARC, MX — the existing `/check` analysers reused unchanged; DNS provider diversity (single NS provider reported as observation). | Backups, recovery, monitoring, incident response. |
| **Agent fitness** | robots.txt and sitemap.xml presence and parseability; structured data (JSON-LD) presence on the homepage. | Internal workflows, agent controls. |

Fetch surface is fixed and tiny: RDAP for the registrable domain, DNS over
HTTPS (A/AAAA/NS/TXT/MX/DS as needed), `https://{host}/`,
`http://{host}/` (redirect check only), `https://www.{host}/` (or apex
twin), `/robots.txt`, `/sitemap.xml`, one deliberately missing path for
404 behaviour. **Nothing else** — no crawling, no login pages, no form
submission, no ports beyond 80/443, GET only.

## 2a. Existence pre-flight (added 19 August 2026)

Before any scoring, the scan establishes that there is something to scan.
DNS alone cannot answer this, because a registered domain with no
nameservers also returns NXDOMAIN, so when DNS is empty the registry is
asked over RDAP:

- **Unregistered** (NXDOMAIN and RDAP 404): refused with "not registered,
  nothing to scan yet" and a link to the domain search. Nothing is scored
  or stored.
- **Reserved** (RDAP object with no registration): refused, quoting the
  registry's reason.
- **Registered but not resolving**: scanned normally. There is a
  registration to observe, and low coverage is the honest result.
- **Registry unreachable**: refused, saying so, rather than scoring an
  absence.

This exists because example.ke, which is not registered, was returned as
0/100 at 4% coverage. A zero reads as "this domain is bad" rather than
"this domain does not exist", which breaks the rule that missing evidence
is never scored as a failure.

## 3. Scoring model

- **Public Signal Score (0–100).** Weighted sum over *observed* signals
  only. Weights live in a versioned rubric table in the repo
  (`score-model: psr-v1`); every result carries the rubric version. Changing
  weights requires a new version, never an in-place edit.
- **Evidence Coverage (%).** The share of the full fitness rubric that
  was publicly observable for this domain. It is displayed as prominently
  as the score, because it is the honest number: a high score at 40%
  coverage must read as "what we could see looks good", never "you are
  ready".
- **Unobservable ≠ zero.** Signals that cannot be observed (no mail
  configured, site unreachable, RDAP withheld) drop out of both numerator
  and denominator and appear in the report as "not publicly observable —
  covered by the Verified assessment".
- **Determinism and replay.** The raw observation set (fetched evidence,
  timestamps, rubric version) is stored with the result. Recomputing the
  score from stored observations must reproduce it byte-for-byte, at any
  later date, on any rubric version in the repo — this is the
  scoring-replay test.

## 4. Result presentation

For each signal: status word, the evidence (the actual record/header
fetched), and a one-line limitation. Same pattern `/check` already uses.
The page states, verbatim-level clearly:

- what was checked and when;
- that the scan reads public information only, stores no personal data and
  touched nothing private;
- that this is a Public Signal Score, not a Digital Fitness Score, and
  what the Verified score additionally requires;
- one primary CTA: request the human-reviewed assessment.

Prohibited in output: "secure", "compliant", "guaranteed", letter-grade
framing that implies certification, any implication that a good scan means
low risk, and any claim about signals that were not observed.

## 5. Network safety (implemented: `worker/scan/net.ts`)

The scan runs entirely behind the checked-in safety layer: LDH-only public
hostnames (every IP-literal encoding rejects); DNS-over-HTTPS
pre-resolution with public-routability checks on every address (loopback,
RFC1918, CGNAT, link-local, metadata, and the IPv6 equivalents including
v4-mapped/NAT64/6to4/Teredo all refuse); per-hop redirect re-validation
(max 5); http/https on default ports, GET only; text-ish content types
only; 512 KiB streaming body cap; 8 s per request inside a shared per-job
wall-clock and subrequest budget. Residual risk (workerd re-resolution
window) is documented in the file header; Cloudflare egress isolation is
the platform backstop.

## 6. Abuse, privacy and data handling

- **Rate limits:** per-client-IP and per-target-domain, enforced in the
  Worker (reuse the submission throttle pattern); Turnstile before scan
  submission. Repeated scans of one domain serve the cached result.
- **Caching:** results cached by domain for a fixed TTL (owner decision
  below) so the scan cannot be used to hammer a third party.
- **Do-not-scan:** two layers, both checked before any fetch — a repo-held
  `DO_NOT_SCAN` set for permanent, version-controlled exclusions, and a
  `scan_blocklist` D1 table (migration `0005`) that logs per-domain opt-outs
  at runtime. A block on a domain covers its subdomains.
- **Owner opt-out (policy, 18 Aug 2026; self-service 21 Aug 2026):**
  `optOutDomain()` records the domain in `scan_blocklist` and deletes any
  stored result for it and its subdomains. Since v4.84.0 the owner asks at
  `/do-not-scan` (`worker/do-not-scan.ts`, migration `0010`): the request
  is stored, a one-time link is emailed to an address *at the domain* —
  exact match, so nobody at `x.co.ke` can block `co.ke` — and the POST
  behind the link runs `optOutDomain()`. Links expire in 48 hours; one
  email per domain per hour. Proof of control was the gap in the earlier
  contact-form route, and the reason it is now required is that a
  blocklist without it is a denial-of-service tool against any
  competitor's domain (Shadowserver, the nearest published precedent,
  requires the same). The hand-run command in
  `docs/runbooks/scan-launch.md` remains for requests arriving any other
  way.
- **Stored data:** domain, observations, score, rubric version, timestamps.
  No visitor identity attached to scan results; the scanning client's IP is
  used for rate limiting only and not stored with the result. Retention
  aligned with the privacy notice (Phase 3) before launch.
- **Third-party domains:** scanning a domain you do not own is possible by
  design (the data is public), but results pages for uncached third-party
  scans are shown to the requester only — no public index of scanned
  domains, no share URLs in v1.

## 7a. Implementation map (v3.1.0)

| Concern | Where |
| --- | --- |
| Network safety | `worker/scan/net.ts` (pre-existing) |
| Observation collection (fixed fetch surface) | `worker/scan/collect.ts` |
| Signal evaluation (24 signals) | `worker/scan/signals.ts` |
| Rubric + scoring (versioned, replayable) | `worker/scan/rubric.ts` |
| Orchestrator (validate, budget, score, store) | `worker/scan/scan.ts` |
| Storage: 24h cache, rate limit, references | `worker/scan/store.ts` |
| Do-not-scan list | `worker/scan/do-not-scan.ts` |
| D1 schema | `migrations/0004_scans.sql` |
| Endpoint, flag-gated, Turnstile + rate limit | `src/pages/api/scan.ts` |
| Visitor page + island (v3.2.0) | `src/pages/scan.astro`, `src/components/scan-page.tsx`, `scan-form.tsx` |
| Privacy notice coverage (v3.2.0) | `src/data/pages-brief.ts` §04 |
| Gate suites | `tests/scan-{ssrf,scoring,abuse}.test.mjs` |

The flag: `POST /api/scan` returns 404 unless the `SCAN_ENABLED` Worker var
is exactly `"true"`. Production has no such var, so the endpoint is dark
until an owner sets it. The `/scan` page renders for everyone but cannot
run a scan until the flag is set; it is not linked from navigation and is
absent from the sitemap until launch.

## 7. Launch gates (all must pass before any public exposure)

1. **SSRF suite:** every `net.ts` control exercised — IP-literal encodings,
   forbidden ranges v4/v6, redirect-to-internal, rebinding-shaped answers,
   oversize bodies, slow responses, budget exhaustion.
2. **Abuse suite:** rate limits, cache behaviour, do-not-scan, Turnstile.
3. **Scoring-replay suite:** stored observations reproduce scores exactly;
   rubric versioning enforced.
4. **Privacy review:** stored fields vs privacy notice; retention set.
5. **Copy review:** every output string against CLAUDE.md claims rules and
   REVIEW.md blockers (a scan that treats missing private evidence as pass
   or failure is an automatic MUST FIX).
6. **Owner approval** of this spec, the rubric weights, and launch itself.

## 8. Owner decisions — recorded 18 August 2026

| # | Decision | Outcome |
| --- | --- | --- |
| 1 | Result cache TTL | **24 hours** |
| 2 | Turnstile before scan | **Yes** (same widget as the forms) |
| 3 | Rubric weights for psr-v1 | Drafted in §9 — **awaiting approval** |
| 4 | Where results live | **Stored with a reference ID** (required anyway by scoring replay, §3) |
| 5 | DKIM selector list | **Reuse `/check`'s list** unchanged |
| 6 | Relationship to `/check` | **Keep both**; revisit folding after the scan is live |
| 7 | Name shown to visitors | **"Instant Public Fitness Scan"** |

## 9. Rubric `psr-v1` — DRAFT, awaiting owner approval

Weights sum to 100 across the full public rubric. Each observed signal
scores pass = 1.0, needs-work = 0.5, fail = 0 of its weight.

**Public Signal Score** = 100 × Σ(points × weight) / Σ(weight), over
observed signals only. **Evidence Coverage** = Σ(weight of observed
signals) as a percentage. Unobservable signals leave both sums.

| Dimension | Signal | Weight | Pass / needs-work / fail (deterministic) |
| --- | --- | --- | --- |
| Control (20) | Domain expiry buffer (RDAP) | 6 | ≥60 days / 30–59 / <30 |
| | Transfer lock visible (RDAP EPP status) | 5 | lock present / — / absent |
| | DNSSEC (DS record) | 4 | present / — / absent |
| | Nameserver redundancy | 5 | ≥2 NS on distinct hosts / 2 on one host / 1 NS |
| Trust (20) | Valid HTTPS certificate | 6 | valid / expires <14 days / invalid or none |
| | http → https redirect | 4 | redirects / — / plain-http content served |
| | apex ↔ www coherence | 3 | one canonical, other redirects / both serve same content / split content |
| | HSTS header | 2 | present / — / absent |
| | Baseline security headers (XCTO, XFO or CSP) | 2 | ≥2 present / 1 / none |
| | Title + meta description on homepage | 3 | both / one / neither |
| Speed (10) | TTFB band (single request) | 4 | <800 ms / 800–2500 / >2500 |
| | Compressed HTML weight | 3 | <100 KiB / 100–300 / >300 |
| | Viewport meta present | 3 | present / — / absent |
| Conversion (15) | Contact path on homepage (tel/mailto/contact link/form) | 8 | present / — / none found |
| | 404 handling | 4 | proper page with 404 status / 200 for missing path / server error |
| | Single clear h1 on homepage | 3 | exactly one / multiple / none |
| Resilience (25) | SPF | 6 | per `/check` analyser (pass/warn/fail) |
| | DKIM (common selectors) | 4 | observed: per analyser; **not found: unobservable, drops out** |
| | DMARC | 8 | enforcing / p=none or partial / absent |
| | MX | 4 | per `/check` analyser |
| | DNS provider diversity | 3 | mail and web not on one failing provider / — / all single-provider |
| Agent fitness (10) | robots.txt | 4 | present and parseable / present with errors / absent |
| | sitemap.xml | 4 | present and parseable / present with errors / absent |
| | JSON-LD structured data on homepage | 2 | present and parseable / present with errors / absent |

Notes: "—" means the signal is binary (pass or fail only). DKIM is the
worked example of rule 2 in §1: selectors cannot be enumerated from DNS,
so an unfound key is *not observable* and neither helps nor hurts the
score — it appears in the report as covered by the Verified assessment.
Signals whose fetch fails (timeout, budget) are likewise unobservable,
never failures.
