# Spec — Instant Public Readiness Scan

**Status: DRAFT — not approved.** ROADMAP Phase 4. Nothing in this document
may reach production until the owner approves it and every launch gate at
the end passes. The scanner stays out of production regardless of the state
of the code.

## 1. What it is, and is not

A visitor enters a domain and receives, in under ~20 seconds, a report of
**publicly observable signals** about that domain's digital readiness,
summarised as a **Public Signal Score** with an explicit **Evidence
Coverage** figure. It is Onduu's instant entry product: the widened
successor to `/check`, and the on-ramp to the human-reviewed assessment
(the primary conversion) and, later, the **Verified Digital Readiness
Score**.

It is **not** a security audit, a compliance check, a penetration test, or
a Digital Readiness Score. It observes only what anyone on the internet can
already see. Three sentences govern everything below:

1. The scan reports **only public observations**, each with its evidence
   and its limitation.
2. **Missing private evidence is never scored as a pass or a failure** — it
   is reported as *not publicly observable* and excluded from scoring.
3. A **Verified** Digital Readiness Score requires customer evidence, human
   review and separately authorised tests; the scan must always say so.

## 2. Observations (v1 signal set)

Grouped by the six readiness dimensions. Every signal is deterministic:
derived from fetched bytes by fixed rules, no sampling, no model calls.

| Dimension | Publicly observable in v1 | Never observable publicly |
| --- | --- | --- |
| **Control** | Registrar, nameservers, registration/expiry dates via RDAP; DNSSEC presence; whether NS, web host and mail are spread across providers (single-vendor concentration is reported, not judged). | Who holds the accounts, admin access, recovery. |
| **Trust** | HTTPS reachability and certificate validity/expiry window; HSTS and the other retained security headers; apex↔www and http→https redirect coherence; visible business identity on the homepage (title, meta description present). | Whether claims on the site are true; certifications. |
| **Speed** | Response basics from one fetch: TTFB band, compressed HTML size, viewport meta present. Reported as coarse bands with the limitation "one request, one location, no browser rendering". | Real-user performance, Core Web Vitals. |
| **Conversion** | A reachable contact path on the homepage (tel/mailto/contact link/form presence — presence only, nothing submitted); 404 handling returns a page, not an error dump. | Whether enquiries are answered; form delivery. |
| **Resilience** | Email authentication: SPF, DKIM (common selectors), DMARC, MX — the existing `/check` analysers reused unchanged; DNS provider diversity (single NS provider reported as observation). | Backups, recovery, monitoring, incident response. |
| **Agent readiness** | robots.txt and sitemap.xml presence and parseability; structured data (JSON-LD) presence on the homepage. | Internal workflows, agent controls. |

Fetch surface is fixed and tiny: RDAP for the registrable domain, DNS over
HTTPS (A/AAAA/NS/TXT/MX/DS as needed), `https://{host}/`,
`http://{host}/` (redirect check only), `https://www.{host}/` (or apex
twin), `/robots.txt`, `/sitemap.xml`, one deliberately missing path for
404 behaviour. **Nothing else** — no crawling, no login pages, no form
submission, no ports beyond 80/443, GET only.

## 3. Scoring model

- **Public Signal Score (0–100).** Weighted sum over *observed* signals
  only. Weights live in a versioned rubric table in the repo
  (`score-model: psr-v1`); every result carries the rubric version. Changing
  weights requires a new version, never an in-place edit.
- **Evidence Coverage (%).** The share of the full readiness rubric that
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
- that this is a Public Signal Score, not a Digital Readiness Score, and
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
- **Do-not-scan:** a repo-held blocklist honoured before any fetch;
  documented contact route for removal requests.
- **Stored data:** domain, observations, score, rubric version, timestamps.
  No visitor identity attached to scan results; the scanning client's IP is
  used for rate limiting only and not stored with the result. Retention
  aligned with the privacy notice (Phase 3) before launch.
- **Third-party domains:** scanning a domain you do not own is possible by
  design (the data is public), but results pages for uncached third-party
  scans are shown to the requester only — no public index of scanned
  domains, no share URLs in v1.

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

## 8. Open owner decisions

| # | Decision | Options / notes |
| --- | --- | --- |
| 1 | Result cache TTL | 24 h default proposed |
| 2 | Turnstile before scan | proposed: yes (same widget as forms) |
| 3 | Rubric weights for psr-v1 | table to be drafted for approval |
| 4 | Where results live | ephemeral vs stored with reference ID |
| 5 | DKIM selector list | reuse `/check`'s list vs extend |
| 6 | Relationship to `/check` | keep both vs fold /check into the scan |
| 7 | Name shown to visitors | "Instant Public Readiness Scan" vs shorter |
