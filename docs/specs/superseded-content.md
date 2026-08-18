# Superseded-content inventory — input to Phase 1

Compiled 18 August 2026 (ROADMAP Phase 0). Page-by-page record of live copy
that conflicts with the 16 August two-site strategy: Onduu educates and
routes; independent Ujiajiri partners implement; HOSTAFRICA supplies
infrastructure through an approved route. Final wording decisions wait for
the strategy document itself — dispositions below are provisional and need
owner confirmation.

Content sources: `src/data/pages-brief.ts` (overrides, from the 15 Aug
brief) and `src/data/site-data.ts` (prototype copy), merged in
`src/data/site-pages.ts`; the homepage lives in `src/components/home.tsx`.

## Routes with superseded direct-delivery claims

| Route | Offending copy (source) | Provisional disposition |
| --- | --- | --- |
| `/` (home.tsx) | Hero lede: **"Onduu finds and fixes the weaknesses…"** — the exact banned phrase. "Core solutions" section markets all four delivery offers. Split-feature promotes the Website Revenue System build. | Reframe hero to educate/route; solutions section becomes education + routing paths. |
| `/how-it-works` (pages-brief) | "**We** establish what is weak or unproven, **fix the priority**, assign ownership and measure what changes." | Reframe: Onduu scores and explains; the client or a routed partner fixes. |
| `/solutions` (pages-brief) | Offer architecture sells four Onduu-delivered offers; decision guide routes readers into Managed Operations and the Agent Pilot. | Rebuild as a routing page: readiness first, then partner/infrastructure paths. |
| `/solutions/website-revenue-system` (site-data) | "THE FLAGSHIP TRANSFORMATION … fixed-scope transformation" — direct implementation by Onduu. | Superseded. Implementation routes to Ujiajiri partners (Phase 2 destination + disclosures). |
| `/managed-website-operations` (site-data) | Entire page: managed service, "Digital Performance Steward" agent, reporting rhythm, client lifecycle. Explicitly gated by CLAUDE.md unless staffed and contracted. | Superseded. Remove or gate; nav/footer links go with it. |
| `/solutions/agent-workflow-pilot` (site-data) | Paid pilot delivered by Onduu ("run a controlled pilot"). | Superseded as a delivery offer; salvage the educational method content into a guide (Phase 5). |
| `/contact` + form microcopy (site-data, components.tsx) | "Onduu will review the request and recommend a score, review, system, **managed programme, pilot** or 'not yet'." | Update recommendation list to match surviving offers. |

## Routes needing strategy review (not clearly superseded)

| Route | Note |
| --- | --- |
| `/solutions/digital-revenue-risk-review` (pages-brief) | Paid diagnosis delivered by Onduu. Likely evolves into the **Verified Digital Readiness Score** rather than disappearing — needs the strategy document. |
| `/infrastructure`, `/infrastructure/kenyan-vps-data-location` (site-data) | Educational mapping content is consistent with the strategy; the handoff ("Approved handoff where appropriate") becomes the approved HOSTAFRICA route with disclosures in Phase 2. |
| `/infrastructure/buzz-agent-collaboration` (site-data) | Educational; keep, verify claims and limits. |
| `/results` (site-data) | Evidence policy framing is fine; review in Phase 6. |
| Site-wide final CTA (components.tsx) | "Find the three digital weaknesses worth fixing first." Acceptable if "fixing" is the client's/partner's act — confirm wording against the strategy. |

## Survives as-is

`/readiness` (human-reviewed assessment — the primary conversion),
`/check`, `/insights` and all articles, `/about`, `/labs`, the four legal
pages (drafts; realigned in Phase 3 after Phases 1–2 change behaviour).

## Structural consequences for Phase 1

- Header nav links "Managed operations"; footer lists all four delivery
  offers (`components.tsx`). Both change with the offer architecture.
- `worker/feeds.ts` sitemap includes the superseded routes; removals need
  redirects (REVIEW.md: no broken routes, no loops).
- Superseded pages that disappear need 301 targets — decide per page when
  the strategy document lands.
