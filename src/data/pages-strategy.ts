import type { PageContent } from "../components/components";
import { briefPages } from "./pages-brief";
import { pages as prototypePages } from "./site-data";

// Page content from the current strategy (docs/strategy/
// onduu-strategy-current-2026-08-18.pdf, consolidating the 16 August
// two-site decision, whose Part A carries the exact copy used here).
// This layer overrides the 15 August brief entries where the strategy
// changed the positioning: Onduu educates, assesses and routes; independent
// Ujiajiri partners implement; HOSTAFRICA supplies infrastructure.
//
// Routes REMOVED by the strategy (redirected in src/middleware.ts):
// /solutions and its children, /infrastructure and its children.
// Routes GATED (kept reachable, noindex, out of nav/sitemap — see
// route-policy.ts): managed-website-operations, results,
// legal/managed-service-terms.

/** Routes the strategy removes outright; their keys are dropped from the
 * merged page table so they 301 via middleware instead of rendering. */
export const REMOVED_ROUTES = [
  // Labs (service descriptions for manual tests that were never staffed)
  // removed on the owner's instruction, 19 August 2026; the free tools and
  // guides now carry that ground.
  "labs",
  "solutions",
  "solutions/digital-revenue-risk-review",
  "solutions/website-revenue-system",
  "solutions/agent-workflow-pilot",
  "infrastructure",
  "infrastructure/kenyan-vps-data-location",
  "infrastructure/buzz-agent-collaboration",
] as const;

const wrsSource = prototypePages["solutions/website-revenue-system"];
const vpsSource = prototypePages["infrastructure/kenyan-vps-data-location"];
const pilotSource = prototypePages["solutions/agent-workflow-pilot"];

export const strategyPages: Record<string, PageContent> = {
  // ── The two delivery paths ──────────────────────────────────────────
  "paths": {
    eyebrow: "ONDUU / CHOOSE A PATH",
    title: "Onduu explains the problem. The appropriate provider delivers the solution.",
    intro:
      "Onduu helps you identify the weaknesses, understand the priority and choose the right delivery path. Implementation and infrastructure are supplied by the parties responsible for them, not by Onduu.",
    cta: "Check Your Digital Readiness",
    ctaHref: "/readiness",
    sections: [
      {
        eyebrow: "TWO ROUTES",
        title: "Continue through the right route.",
        cards: [
          {
            title: "Website and digital-marketing implementation",
            body: "Independent providers, reached through Ujiajiri's private curated introductions. Ujiajiri proposes a suitable provider and asks your permission before sharing your information; the provider contracts and delivers directly. Ujiajiri and Onduu do not quote, collect payment for or guarantee the provider's work.",
            meta: "UJIAJIRI INTRODUCTIONS",
          },
          {
            title: "Domains, hosting, email and VPS infrastructure",
            body: "An official HOSTAFRICA destination for product information, ordering, billing, provisioning, renewal and product support. Onduu explains suitable use cases and responsibilities but does not resell or support the product.",
            meta: "HOSTAFRICA",
          },
        ],
      },
      {
        eyebrow: "WHY THIS SPLIT",
        title: "Responsibility stays with the party doing the work.",
        body: [
          "A recommendation is only useful when it is clear who is accountable for delivering it. Onduu's role ends at evidence, priorities and routing; the partner or provider you choose is responsible for its own scope, price, delivery, warranty and support.",
        ],
      },
    ],
  },

  "paths/website-and-digital-marketing": {
    eyebrow: "PATHS / IMPLEMENTATION",
    title: "Independent providers implement. You contract them directly.",
    intro:
      "Website-design and digital-marketing implementation routes to independent providers through Ujiajiri's private curated introductions. The provider you approve contracts with you and is paid by you directly.",
    cta: "Check Your Digital Readiness",
    ctaHref: "/readiness",
    sections: [
      {
        eyebrow: "HOW IT WORKS",
        title: "The introduction, plainly.",
        items: [
          "You tell Ujiajiri what the business needs",
          "Ujiajiri proposes one suitable provider from its private network and tells you who it is",
          "Nothing identifiable is shared with the provider until you give permission",
          "You may accept, decline or ask for another provider",
          "The provider scopes, quotes, contracts, invoices, delivers and warrants its own work. You pay the provider directly",
          "Ujiajiri and Onduu do not quote, collect project payments or guarantee the work",
        ],
      },
      {
        eyebrow: "THE INTRODUCTION",
        title: "Ask Ujiajiri for a private introduction.",
        body: [
          "When independent website or digital-marketing implementation is needed, you may ask Ujiajiri to identify a suitable provider from its private network. Ujiajiri will propose a provider and request your permission before sharing your information. The provider contracts and delivers directly.",
          "An introduction is not guaranteed: it depends on project fit, jurisdiction and the availability of a suitable approved provider. International enquiries are welcome on the same basis.",
        ],
        links: [
          { label: "Request an Implementation Introduction", href: "https://ujiajiri.ke/request-an-introduction/", external: true },
        ],
        note: "Onduu is operated by Ujiajiri Enterprises Limited, which also runs the Ujiajiri introduction service. Ujiajiri may receive a referral fee from the proposed provider after qualifying client payment; the fee's existence is disclosed to you before you approve an introduction, and the provider must tell you whether the arrangement affects its quoted price. Onduu does not deliver or guarantee the provider's work.",
      },
    ],
  },

  "paths/hostafrica-infrastructure": {
    eyebrow: "PATHS / INFRASTRUCTURE",
    title: "HOSTAFRICA supplies the products. Onduu explains the decisions.",
    intro:
      "Domains, hosting, business email and VPS products are provided, sold, billed, provisioned, renewed and supported by HOSTAFRICA through its official channels. Onduu helps you understand which product fits which workload, and what responsibility comes with it.",
    cta: "Check Your Digital Readiness",
    ctaHref: "/readiness",
    sections: [
      {
        eyebrow: "WHO DOES WHAT",
        title: "The boundary, plainly.",
        items: [
          "HOSTAFRICA provides, bills, provisions, renews and supports its products",
          "Onduu explains use cases, trade-offs and operating responsibilities",
          "Onduu does not resell, administer or support HOSTAFRICA products",
          "A local server does not automatically create compliance or prove data location",
        ],
      },
      {
        eyebrow: "DISCLOSURE",
        title: "The commercial relationship, disclosed.",
        body: [
          "Wycliffe, who operates Onduu, is also Managing Director of HOSTAFRICA Kenya. Onduu receives no commission on this route; the destination link carries attribution tags so routed demand can be measured. HOSTAFRICA brand assets, programme claims and endorsements appear only once formally approved.",
        ],
        links: [
          {
            label: "Explore the HOSTAFRICA Path",
            href: "https://panel.hostafrica.com/?utm_source=onduu&utm_medium=referral&utm_campaign=infrastructure-path",
            external: true,
          },
          { label: "Search Kenyan domains first", href: "/kedomains" },
        ],
        note: "Destination approved by the owner on 18 August 2026 (docs/strategy/ decision log in CHANGELOG v4.1.0). Product information, ordering, billing, provisioning, renewal and support all happen at HOSTAFRICA.",
      },
    ],
  },

  // ── Guides ──────────────────────────────────────────────────────────
  "guides": {
    eyebrow: "ONDUU / GUIDES",
    title: "Understand the responsibility before adopting the technology.",
    intro:
      "Practical, trigger-based guidance for the decisions behind a working digital operation. Written to be useful before any money is spent, and honest about what each method can and cannot prove.",
    cta: "Check Your Digital Readiness",
    ctaHref: "/readiness",
    sections: [
      {
        eyebrow: "THE GUIDES",
        title: "Start with the question you actually have.",
        cards: [
          {
            title: "The Website Revenue System",
            body: "Treat the website as a commercial system, the framework for aligning audience, offer, proof, journey, enquiry route and measurement.",
            meta: "/guides/website-revenue-system",
          },
          {
            title: "Domains and DNS",
            body: "Who really controls your domain: registrant, registrar account, lock, expiry and nameservers, and how to check yours today.",
            meta: "/guides/domains-and-dns",
          },
          {
            title: "Email and trust",
            body: "What SPF, DKIM and DMARC actually decide, what a clean check proves, and what it deliberately cannot.",
            meta: "/guides/email-and-trust",
          },
          {
            title: "Choosing Kenyan VPS infrastructure",
            body: "Map the workload, the data journey and the responsibilities before deciding where anything should run.",
            meta: "/guides/kenyan-vps",
          },
          {
            title: "Agents on a VPS",
            body: "What an always-on AI agent needs beyond a server: boundaries, supervision, measurement and a way to stop it.",
            meta: "/guides/agents-on-vps",
          },
        ],
      },
      {
        eyebrow: "MORE",
        title: "The Insights archive carries the rest.",
        body: [
          "Domain control, email trust, enquiry-path failures and ownership stories are covered in depth in Insights, including what SPF, DKIM and DMARC do and do not prove, and what to do when a developer disappears.",
        ],
        note: "Each guide ends with one relevant next step, not a sales pitch. The honest limits of every free tool on this site are stated in one place: the tool limitations page under Legal.",
      },
    ],
  },

  "guides/website-revenue-system": {
    eyebrow: "GUIDES / FRAMEWORK",
    title: "Treat the website as a commercial system - not a collection of pages.",
    intro:
      "The Website Revenue System is Onduu's published framework for aligning the audience, offer, proof, page journey, enquiry route and measurement. Use it to define the work; if implementation is required, select an independent Ujiajiri partner. It is a framework, not an Onduu delivery promise.",
    cta: "Check Your Digital Readiness",
    ctaHref: "/readiness",
    sections: [
      {
        eyebrow: "WHAT IT ADDRESSES",
        title: "The failures the framework makes visible.",
        items: wrsSource?.sections[0]?.items ?? [],
      },
      {
        eyebrow: "THE FRAMEWORK",
        title: "Six connected workstreams.",
        cards: wrsSource?.sections[1]?.cards ?? [],
      },
      {
        eyebrow: "USING IT",
        title: "Define the work, then choose who delivers it.",
        body: [
          "Work through the six workstreams to describe what your website should achieve and what is currently missing. Where implementation is needed, take the definition to an independent partner through the Ujiajiri path. The partner contracts with you directly.",
          "Whoever does the work, the business should finish with control of its domain, website, analytics, content, records and documented dependencies, subject to third-party licensing and the signed agreement.",
        ],
        note: "Onduu does not implement the Website Revenue System as a service. The framework is published so the work can be specified honestly and delivered by whoever is accountable for it.",
      },
    ],
  },

  "guides/kenyan-vps": {
    eyebrow: "GUIDES / INFRASTRUCTURE",
    title: vpsSource?.title ?? "Choose where your core workload runs. Map where the rest of its data travels.",
    intro:
      "A Kenyan VPS may suit workloads with particular location, control or performance objectives. The decision still depends on architecture, data flow, backup, support and cost. This guide is the set of questions that make it an evidence-based choice.",
    cta: "Check Your Digital Readiness",
    ctaHref: "/readiness",
    sections: [
      {
        eyebrow: "PRINCIPLES",
        title: "What a location decision can and cannot do.",
        items: [
          "Local workload placement can support specific operational goals",
          "It does not automatically create compliance",
          "A local server does not prove every dependency stays local",
          "Responsibility, access, recovery and total cost matter as much as location",
          "The recommendation must follow the application and data map, not the other way round",
        ],
      },
      {
        eyebrow: "THE QUESTIONS",
        title: "Answer these before choosing.",
        items: vpsSource?.sections[0]?.items ?? [],
      },
      {
        eyebrow: "THE OUTPUT",
        title: "A good decision process produces these artefacts.",
        items: [
          "A workload and dependency map",
          "A data-journey diagram",
          "A responsibility matrix: who patches, monitors, backs up, restores",
          "Stated performance and recovery objectives",
          "An operating-cost estimate",
          "A fit / pilot / alternative conclusion",
        ],
        note: "Product supply, billing and support for VPS infrastructure sit with HOSTAFRICA through its official route. See the infrastructure path for the responsibility split and disclosure.",
      },
    ],
  },

  "guides/agents-on-vps": {
    eyebrow: "GUIDES / SUPERVISED AGENTS",
    title: "What an always-on agent needs beyond a VPS.",
    intro:
      "An AI agent that runs unattended is an operational commitment, not a feature flag. Before one touches real work, it needs boundaries, supervision, measurement and a way to stop it. This guide covers what that means in practice.",
    cta: "Check Your Digital Readiness",
    ctaHref: "/readiness",
    sections: [
      {
        eyebrow: "SUITABLE WORK",
        title: "Workflows that suit a supervised agent.",
        items: pilotSource?.sections[0]?.items ?? [],
      },
      {
        eyebrow: "THE METHOD",
        title: "A supervised pilot, step by step.",
        steps: pilotSource?.sections[1]?.steps ?? [],
      },
      {
        eyebrow: "BEFORE IT RUNS",
        title: "What the business should own first.",
        items: [
          "A map of the workflow the agent will touch, with its baseline effort",
          "A permission and authority matrix: what it may read, recommend and do",
          "A data and privacy map covering permitted and prohibited data",
          "An operating charter with human-approval points and prohibited actions",
          "Evaluation fixtures for quality, cost, latency and failure",
          "An incident and shutdown process that works without the agent's cooperation",
        ],
        note: "An agent does not replace accountable people, and no agent's accuracy is guaranteed. Bounded, supervised and reversible is the standard. Anything less is not ready for real work.",
      },
    ],
  },

  "guides/domains-and-dns": {
    eyebrow: "GUIDES / CONTROL",
    title: "Who really controls your domain and DNS?",
    intro:
      "The domain is the one asset everything else hangs off, the website, the email, the brand. Yet in many Kenyan businesses nobody can answer who owns it, where it renews or who can move it. This guide is the set of checks that make the answer definite.",
    cta: "Check Your Digital Readiness",
    ctaHref: "/readiness",
    sections: [
      {
        eyebrow: "THE CONTROL QUESTIONS",
        title: "Five facts every business owner should be able to state.",
        items: [
          "Who is the registrant: the business, or a developer, freelancer or agency?",
          "Who holds the registrar account login, and does the business have its own access?",
          "Is the transfer lock on, so the domain cannot be moved without deliberate steps?",
          "When does it expire, who receives the renewal notices, and who pays?",
          "Who can change the nameservers, because whoever controls DNS controls where the website and email actually go?",
        ],
      },
      {
        eyebrow: "THE COMMON FAILURE",
        title: "Registered by someone else, renewed by nobody.",
        body: [
          "The recurring Kenyan pattern, covered at length in Insights: a domain registered in a helper's personal account, renewal notices going to an inbox nobody reads, and the business discovering the problem the day the website goes dark or the helper disappears. Recovering a lapsed or hostage domain is slow, sometimes expensive, and sometimes impossible.",
          "The pair matters too: owning yourbusiness.co.ke without yourbusiness.ke (or the reverse) leaves the twin open for anyone, including someone who wants to send email that looks like yours.",
        ],
        links: [
          { label: "Check a domain now: registrar, lock and expiry", href: "/kedomains" },
        ],
      },
      {
        eyebrow: "PUTTING IT RIGHT",
        title: "The order of repair.",
        steps: [
          { title: "Establish", body: "Look up the registrar, lock status and expiry for your domain and its .co.ke/.ke twin. Public records answer this in seconds." },
          { title: "Repatriate", body: "Get the registrar account (not just the domain) under a business-controlled login with a business-owned email address." },
          { title: "Lock and diarise", body: "Turn the transfer lock on and put the renewal date, with a 60-day buffer, where the business will actually see it." },
          { title: "Document", body: "Record who controls DNS, what each record does, and what would need to change in a provider exit, before the exit happens." },
        ],
        note: "This guide describes public checks and account hygiene. It is not legal advice on domain disputes, and no check here proves a domain cannot be lost. It reduces the ways it can be.",
      },
    ],
  },

  "guides/email-and-trust": {
    eyebrow: "GUIDES / TRUST",
    title: "What email-security checks can and cannot prove.",
    intro:
      "SPF, DKIM and DMARC decide one narrow, important thing: whether a stranger can send email that claims to be from your domain, and whether the world's mail servers have been told to refuse it. This guide explains what each record does, and is honest about the limits.",
    cta: "Check Your Digital Readiness",
    ctaHref: "/readiness",
    sections: [
      {
        eyebrow: "THE RECORDS",
        title: "Four public records, one decision.",
        cards: [
          { title: "SPF", body: "Lists the servers allowed to send mail as your domain. Ending in -all tells receivers to distrust everything else." },
          { title: "DKIM", body: "Signs your outgoing mail so tampering and forgery are detectable by the receiver." },
          { title: "DMARC", body: "Tells receiving servers what to do with mail that fails the checks, and p=reject is the setting that actually refuses forgeries." },
          { title: "MX", body: "Says where your incoming mail is delivered, and reveals which provider runs it." },
        ],
      },
      {
        eyebrow: "WHY IT MATTERS HERE",
        title: "This is a live Kenyan problem, not a theoretical one.",
        body: [
          "Over one hundred Kenyan parastatal chief executives were put on notice over exactly these records. The full story is in Insights. A domain without them can be impersonated to its own customers, suppliers and bank; most recipients will never spot the difference.",
        ],
        links: [{ label: "Check your records now: free, in seconds", href: "/email-security" }],
      },
      {
        eyebrow: "THE HONEST LIMITS",
        title: "What a clean result does not prove.",
        items: [
          "It does not prove your mailboxes are secure. Passwords, sessions and staff phishing are untouched by these records",
          "It does not prove mail is delivered, read or answered",
          "It does not prove the business is secure or compliant in any general sense",
          "It is not a penetration test, an audit or a certificate",
        ],
        note: "Published DNS records are the defence the world can see. The rest (mailbox access, recovery, staff practice) is exactly what the human-reviewed readiness assessment examines.",
      },
    ],
  },

  "legal/tool-limitations": {
    eyebrow: "ONDUU / LEGAL",
    title: "Tool limitations.",
    intro:
      "What each of the four free tools on this site reads, what it stores, and, most importantly, what its results do and do not prove. If a statement here ever conflicts with a marketing sentence elsewhere, this page wins.",
    gate: "Draft for professional review, maintained against the code that runs the tools.",
    sections: [
      {
        eyebrow: "01 / EMAIL SECURITY CHECK",
        title: "/email-security, published DNS records only.",
        body: [
          "Reads a domain's public SPF, DKIM (common selectors only), DMARC and MX records through Cloudflare's public DNS resolver, and explains them in plain language. The domain checked and the result are stored (since 18 August 2026) with no visitor identity attached.",
        ],
        items: [
          "A clean result means the published records are correct, not that the domain, mailboxes or business are secure",
          "DKIM selectors cannot be listed from outside: a key not found at common selectors is reported as not found, not as missing",
          "Not a penetration test, a deliverability guarantee or a compliance certificate",
        ],
      },
      {
        eyebrow: "02 / DOMAIN SEARCH",
        title: "/kedomains, public availability signals, confirmed at checkout.",
        body: [
          "Checks the extension you enter alongside its .ke twin, using public DNS and registry (RDAP) records. Taken domains show their registrar, transfer-lock status and expiry where the registry publishes them; some registries publish little or nothing. The name searched and what was found are stored (since 18 August 2026) with no visitor identity attached.",
        ],
        items: [
          "“Appears available” is an observation, not a reservation. Availability and price are confirmed at the registrar's checkout",
          "Registration, billing, renewal and support happen at HOSTAFRICA, not on this site; Onduu earns no commission and the outbound link carries attribution tags only",
          "Registry data can lag or be incomplete; the registry's own answer is authoritative",
        ],
      },
      {
        eyebrow: "03 / READINESS SCAN",
        title: "/scan, a Public Signal Score, never a verdict.",
        body: [
          "Reads only public information about a domain: registry record, DNS, published email records, and the homepage, robots.txt and sitemap any visitor can request. Results are stored (domain, observations, score, reference) so repeat scans within 24 hours serve the cached result and any score can be reproduced; no visitor identity is attached.",
        ],
        items: [
          "The Public Signal Score covers only what is publicly observable; Evidence Coverage says how much that is",
          "Anything not observable from outside is excluded from the score. It never counts as a pass or a failure",
          "It is not a Digital Readiness Score, a penetration test, a legal opinion or a compliance certificate",
          "A domain owner who wants their domain left alone can email me@onduu.ke: every stored record of it is deleted (scan results and any stored email or domain lookups), the domain is blocked from future scans, and future lookups of it are not recorded",
        ],
      },
      {
        eyebrow: "04 / DNS HEALTH CHECK",
        title: "/dns, coherence of the public records, not a verdict on them.",
        body: [
          "Reads a domain's nameservers, delegation, zone record, addresses, mail routing and DNSSEC from public DNS and registry (RDAP) data, and compares them against each other. It also asks a parent-zone nameserver and each of the domain's own nameservers a standard read-only question directly, which is where the parent's glue records and each server's zone serial come from. The domain checked and a summary of the outcome are stored, with no visitor identity attached.",
        ],
        items: [
          "One vantage point at one moment: this is not a propagation checker, and it does not tell you what every network in the world currently sees",
          "DNSSEC is detected, not cryptographically validated. The records are read, the chain is not verified",
          "Reverse DNS is checked for the first few mail-server addresses only, and IPv6 reverse zones are not probed",
          "Some observations are limited by where the check runs from: nameservers hosted on Cloudflare cannot be questioned directly from this site's own infrastructure, and some registries' parent servers do not answer these questions. Where that happens the result says the item was not observed on that run, never that the domain failed",
          "Coherent records are not proof that the domain, the website or the business behind them is secure",
        ],
      },
      {
        eyebrow: "05 / ALL TOOLS",
        title: "Shared boundaries.",
        items: [
          "No tool on this site promises guaranteed security, compliance, rankings, leads, revenue, uptime, recovery or agent accuracy",
          "All tools are rate-limited and read public information only, no logins, no credentials, nothing private is touched",
          "Results describe a moment in time; records change, and a result is not monitoring",
          "What each tool stores is described in the privacy notice, which governs where this page is silent",
          "Anything stored about a domain can be deleted on request, email me@onduu.ke",
        ],
        links: [{ label: "Read the privacy notice", href: "/legal/privacy" }],
      },
    ],
  },

  // ── Rewritten and extended existing pages ───────────────────────────
  "how-it-works": {
    eyebrow: "ONDUU / HOW IT WORKS",
    title: "From hidden weakness to a responsible next step.",
    intro:
      "Onduu begins with the business consequence, not a predetermined package. The work is to identify what is weak or unproven, prioritise what matters, choose the responsible delivery path and agree how the result will be verified.",
    cta: "Check Your Digital Readiness",
    ctaHref: "/readiness",
    sections: [
      {
        eyebrow: "THE STAGES",
        title: "Four stages, in order.",
        steps: [
          {
            title: "Assess",
            body: "Identify the signals and the missing evidence across Control, Trust, Speed, Conversion, Resilience and Agent readiness. Public observations, your declarations and human review are labelled separately.",
          },
          {
            title: "Prioritise",
            body: "Select the three questions with the greatest business consequence, not the longest list of findings.",
          },
          {
            title: "Choose a path",
            body: "Continue with an independent Ujiajiri implementation partner, or through the official HOSTAFRICA route for infrastructure. The provider you choose is accountable for the work.",
          },
          {
            title: "Verify",
            body: "You and the chosen provider agree how the result will be tested (in enquiries, performance, ownership or recovery) before the work begins.",
          },
        ],
      },
      {
        eyebrow: "YOUR PART",
        title: "What the customer provides.",
        items: [
          "Accurate business context",
          "The website and the important journey",
          "No passwords or unnecessary personal data",
          "A named authorised decision-maker",
        ],
      },
      {
        eyebrow: "BOUNDARIES",
        title: "What Onduu will not imply.",
        items: [
          "That a public scan proves security",
          "That a backup exists because a setting says so",
          "That traffic equals revenue",
          "That Kenyan hosting automatically creates compliance",
          "That an agent replaces accountable people",
          "That every client needs a new website",
          "That Onduu delivers or guarantees the implementation",
        ],
      },
    ],
  },

  "readiness": {
    ...briefPages["readiness"],
    sections: [
      ...briefPages["readiness"].sections,
      {
        eyebrow: "AFTER THE SCORE",
        title: "What happens after the score?",
        body: [
          "Need implementation? Ask Ujiajiri for a private curated introduction: Ujiajiri proposes one suitable independent provider, asks your permission before sharing your information, and the provider contracts and delivers directly. HOSTAFRICA product enquiries continue through the approved official HOSTAFRICA route.",
          "Onduu does not automatically transmit your assessment answers to either destination. Nothing you enter here is shared with Ujiajiri or anyone else. The routes are plain outbound links you follow yourself.",
        ],
        links: [
          { label: "Request an Implementation Introduction", href: "https://ujiajiri.ke/request-an-introduction/", external: true },
        ],
      },
    ],
  },

  "about": {
    ...briefPages["about"],
    sections: [
      {
        eyebrow: "THE RELATIONSHIPS",
        title: "Who operates what.",
        body: [
          "Onduu is an expert-content and digital-readiness brand operated by Ujiajiri Enterprises Limited. Onduu publishes practical guidance and routes readers to the appropriate independent provider. Ujiajiri implementation partners contract with clients directly. Wycliffe is also Managing Director of HOSTAFRICA Kenya. HOSTAFRICA provides, bills and supports the HOSTAFRICA products referenced on this site.",
        ],
        note: "Name, titles, biography and relationship wording remain subject to owner and HOSTAFRICA approval where they concern HOSTAFRICA.",
      },
      ...briefPages["about"].sections,
    ],
  },

  "contact": {
    ...prototypePages["contact"],
    sections: [
      {
        eyebrow: "THREE DESTINATIONS",
        title: "Send the enquiry to the party responsible for it.",
        cards: [
          {
            title: "Digital Readiness or Onduu content",
            body: "Use the form below. It reaches Onduu and nobody else.",
          },
          {
            title: "Website or digital-marketing implementation",
            body: "Ask Ujiajiri for a private curated introduction to a suitable independent provider. You approve before anything is shared, and the provider contracts with you directly. The form below can still point you at the next step if you are unsure.",
          },
          {
            title: "HOSTAFRICA products or support",
            body: "Product, billing and support enquiries belong with HOSTAFRICA's official route. Onduu cannot resolve them and does not pass your details along.",
          },
        ],
        note: "One enquiry is never silently sent to all three organisations. What you submit here goes to Onduu only.",
      },
      ...(prototypePages["contact"]?.sections ?? []),
    ],
  },
};
