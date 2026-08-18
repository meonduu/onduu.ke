# Spec — DNS Health Check (`/dns`)

**Status: APPROVED FOR BUILD — concept, spec and standalone-tool option
approved by the owner on 18 August 2026** ("approved, build it, call the
url /dns"). The owner set the URL to **`/dns`**, overriding the drafted
`/dns-check` recommendation; §2 records both the decision and the original
reasoning. Source
idea: `~/Downloads/cloudflare-dns-checker-mvp-guide.md` (a LeafDNS-style
Workers/D1/Queues design), adopted here as a **rule-set spec, not an
architecture spec** — the architecture it proposes duplicates what this
repo already runs.

## 1. What it is, and is not

A visitor enters a domain and receives, in a few seconds, a plain-language
report on whether the domain's **DNS foundations** are set up coherently:
delegation, nameservers, apex and `www` resolution, mail routing presence,
and DNSSEC adoption. It is the fourth free check in the tool family
(`/email-security`, `/kedomains`, `/scan`) and, like them, exists to
educate and route toward the Digital Readiness assessment.

It is **not** a propagation checker (one vantage point, not many), not a
DNSSEC validator (detection only in v1), not a security audit, and not a
score. The instant-scan rules govern here too:

1. Only **public observations**, each with its evidence and limitation.
2. **Missing private evidence is never a pass or a failure.**
3. Anything deeper (authoritative-server behaviour tests, validation)
   requires separate written permission and is out of scope for this tool.

## 2. URL and naming

The tool gets its own top-level path like its siblings: **`/dns`** (owner
decision, 18 August 2026), API at `GET /api/dns?domain=`.

The draft recommended `/dns-check` (hyphenated matches `/email-security`;
names the action like the sibling tools; less generic than bare `/dns`).
The owner chose `/dns` — shorter and memorable. Consequences handled in
the build: the page title and meta carry the "check" language the path no
longer does, and nav/cross-links still label it "DNS Check".

**SEO posture (validated 18 Aug 2026):** page one for the head term
"dns checker" is exclusively established free global tools — dnschecker.org,
whatsmydns.net, nslookup.io, EasyDMARC, Sendmarc — with no local or
commercial site present. That SERP is unwinnable for this domain and the
intent is tool-seeking, not hiring.

| Keyword | Volume (KE) | Who holds page 1 | Intent | Verdict |
|---|---|---|---|---|
| dns checker | not verified — no keyword-data source in session | Global free tools only | Tool-seeking | **Reject** as target — unwinnable |
| dns check .ke domain / problem-phrased local queries | not verified, assumed near-zero | — | Troubleshooting | **Not an SEO page** — long-tail and AI-citation value only |

Consequences: the page is built for **referral and funnel traffic**
(guides, insights, tool cross-links, proposals), not to rank for the head
term. Technical vocabulary (delegation, SOA, DNSSEC, glue) belongs in body
copy for long-tail and AI-answer citation, never in the nav label. Nav and
cross-links call it **"DNS Check"** (the label carries the action word the `/dns` path omits). Before any further SEO investment,
rerun Gate 1 with real Kenya volume data.

## 3. Checks (v1 rule set)

Eight deterministic rules, each producing a finding with `code`,
`severity` (`ok` / `advisory` / `warning`), `message`, `evidence`, and a
stated limitation. No numeric score — a second score would compete with
the Public Signal Score; the summary line is counts ("6 ok · 1 advisory ·
1 warning").

| # | Rule | Method | Notes |
|---|---|---|---|
| 1 | NS records exist and are ≥ 2 | DoH `NS` | Single NS = warning (RFC 2182 expectation, phrased plainly) |
| 2 | **Delegation consistency** | KeNIC/registry NS via **RDAP** vs live NS via DoH | The differentiator: registry-side vs answering nameservers compared without port-53, which Workers cannot do. Mismatch = warning with both lists shown. Non-.ke TLDs: use their RDAP where available, else "not observable from this vantage" |
| 3 | NS provider diversity | Grouping live NS by registrable domain | Single provider = **observation, not judged** (mirrors `/scan` §2 wording) |
| 4 | SOA present and coherent | DoH `SOA` | Values reported, not graded; absurdities (e.g. zero refresh) = advisory |
| 5 | Apex resolves | DoH `A`/`AAAA` | Neither = warning ("your domain name does not point anywhere") |
| 6 | `www` resolves and coheres with apex | DoH `A` on `www.` + comparison | Missing `www` = advisory; apex/www pointing to unrelated hosts = advisory |
| 7 | MX present | DoH `MX` | Presence only; the finding **links to `/email-security`** for SPF/DKIM/DMARC — no duplication (cannibalisation guard) |
| 8 | DNSSEC adoption | DoH `DS` + `DNSKEY` | Detection only: DS present without DNSKEY answers = warning; absent entirely = observation ("most .ke domains do not yet sign; here is what it adds") |

Fetch surface: ≤ 12 DoH queries + 1 RDAP request per check, GET only,
existing budget/timeout machinery. **Nothing else** — no AXFR attempts, no
port scans, no queries to authoritative servers directly.

## 4. Architecture

Everything reuses what is live today. **Explicitly rejected from the
source guide:** a second Worker, a `check.` subdomain, and Cloudflare
Queues (a new billable service; inline checks under existing budgets are
proven at current traffic in `/scan` and `/email-security`).

- Single Worker **`onduudotke`**, new module `worker/dns-check/` beside
  `worker/scan/`.
- DoH via `worker/scan/net.ts` (`dohQuery`, `makeBudget`,
  `normaliseHost`, `isScannableHost`); RDAP via the client already used by
  `worker/domains.ts`; `do-not-scan` list honoured.
- Rate limiting and logging via the existing throttle and `tool-log`
  patterns; Turnstile on the form as on `/scan`.
- Kill switch: `DNS_CHECK_ENABLED` Worker secret, same semantics as
  `SCAN_ENABLED` (delete = instant off, survives deploys).

## 5. Storage

Follows the v4.9.x stored-lookup-results decision exactly: results stored
under the same retention promises, covered by the existing deletion route,
never containing visitor identity beyond what the tool-log already keeps.
**Shareable result IDs (LeafDNS-style revisitable reports) are an owner
gate** — default v1 behaviour is same-session display only, with storage
powering the dashboard aggregates like the other tools.

## 6. Page and UX

- Astro page `/dns` in the sibling tools' pattern: 540px input bar
  (the v4.15.x standard), Georgia display copy, findings as labelled cards
  with evidence and limitation lines.
- One primary CTA: the readiness assessment. Secondary cross-links:
  `/email-security` (from the MX finding) and `/scan`.
- Plain-language findings first, technical evidence expandable — the
  audience is a business decision-maker, not a DNS engineer.
- Footer link under **Learn**, alongside the other checks.

## 7. Copy rules

- No guarantees ("your DNS is safe/correct" is banned phrasing); findings
  say what was observed and what it means commercially.
- The delegation-mismatch warning explains the business consequence
  (site/email can behave inconsistently or break silently) — not protocol
  trivia.
- Limitations block on the page: one vantage point, recursive resolution,
  detection-not-validation for DNSSEC, .ke registry data via RDAP.

## 8. Relationship to `/scan`

`/scan` keeps its coarse DNS signals (NS diversity, DNSSEC presence) as
readiness inputs. `/dns` is the deep, single-topic view. The scan's
DNS findings may link to `/dns` ("inspect this in detail"), never
the reverse duplication. If both ever disagree, that is a bug in one of
them, not a judgement call.

## 9. Gates before build (owner)

1. ~~Approve this spec and the URL~~ — approved 18 Aug 2026; URL set to
   `/dns` by the owner. No-Queues inline architecture approved with it.
2. Approve storage under the v4.9 promises; decide the shareable-IDs
   question (recommended: defer to v2).
3. Copy review of the eight findings' plain-language wording before launch.
4. Confirm the fourth tool joins the "three free checks" messaging (the
   launch post and any pages that say "three" need updating — count them).

## 10. Verification checklist (for the build PR)

- Rule unit tests per finding, including delegation mismatch fixtures and
  RDAP-unavailable TLD fallback.
- Abuse tests: do-not-scan honoured, throttle enforced, budget cap holds.
- Live checks against: a healthy .ke domain, a single-NS domain, a
  DS-without-DNSKEY domain, a parked domain, onduu.ke itself (note the
  known self-scan vantage limitation from the instant-scan spec).
- Desktop and mobile viewports; dark chrome favicon unaffected.
- `npm run build`, `npm run lint`, `npm test` clean, from a clean cache.
