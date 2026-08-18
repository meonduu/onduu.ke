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
      "Onduu helps you identify the weaknesses, understand the priority and choose the right delivery path. Implementation and infrastructure are supplied by the parties responsible for them — not by Onduu.",
    cta: "Check Your Digital Readiness",
    ctaHref: "/readiness",
    sections: [
      {
        eyebrow: "TWO ROUTES",
        title: "Continue through the right route.",
        cards: [
          {
            title: "Website and digital-marketing implementation",
            body: "Independent implementation partners, discovered through Ujiajiri. Each partner publishes its own capabilities and contracts directly with the client. Ujiajiri and Onduu do not quote, collect payment for or guarantee the partner's work.",
            meta: "UJIAJIRI PARTNERS",
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
    title: "Independent partners implement. You contract them directly.",
    intro:
      "Website-design and digital-marketing implementation routes to independent partners listed through Ujiajiri. The client chooses, contracts and pays the partner directly.",
    cta: "Check Your Digital Readiness",
    ctaHref: "/readiness",
    sections: [
      {
        eyebrow: "HOW IT WORKS",
        title: "The partner relationship, plainly.",
        items: [
          "Each partner publishes its own capabilities, portfolio and terms",
          "You choose the partner and contract with them directly",
          "The partner sets its own scope, price and delivery commitments",
          "The partner is responsible for its warranty and support",
          "Ujiajiri and Onduu do not quote, collect project payments or guarantee the work",
        ],
      },
      {
        eyebrow: "STATUS",
        title: "The partner directory is being established.",
        body: [
          "Ujiajiri is establishing its first reviewed independent partners before the directory is promoted. Until it is live, use the contact route and Onduu will point you at the appropriate next step — without acting as the contractor.",
        ],
        note: "Onduu does not receive a share of partner project fees. Any future referral or commercial arrangement will be disclosed here before it takes effect.",
      },
    ],
  },

  "paths/hostafrica-infrastructure": {
    eyebrow: "PATHS / INFRASTRUCTURE",
    title: "HOSTAFRICA supplies the products. Onduu explains the decisions.",
    intro:
      "Domains, hosting, business email and VPS products are provided, sold, billed, provisioned, renewed and supported by HOSTAFRICA through its official channels. Onduu helps you understand which product fits which workload — and what responsibility comes with it.",
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
          { label: "Search Kenyan domains first", href: "/domains" },
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
      "Practical, trigger-based guidance for the decisions behind a working digital operation — written to be useful before any money is spent, and honest about what each method can and cannot prove.",
    cta: "Check Your Digital Readiness",
    ctaHref: "/readiness",
    sections: [
      {
        eyebrow: "THE GUIDES",
        title: "Start with the question you actually have.",
        cards: [
          {
            title: "The Website Revenue System",
            body: "Treat the website as a commercial system — the framework for aligning audience, offer, proof, journey, enquiry route and measurement.",
            meta: "/guides/website-revenue-system",
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
          "Domain control, email trust, enquiry-path failures and ownership stories are covered in depth in Insights — including what SPF, DKIM and DMARC do and do not prove, and what to do when a developer disappears.",
        ],
        note: "Further guides — domains and DNS, email and trust — are being drawn from that material. Each guide ends with one relevant next step, not a sales pitch.",
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
          "Work through the six workstreams to describe what your website should achieve and what is currently missing. Where implementation is needed, take the definition to an independent partner through the Ujiajiri path — the partner contracts with you directly.",
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
      "A Kenyan VPS may suit workloads with particular location, control or performance objectives. The decision still depends on architecture, data flow, backup, support and cost — this guide is the set of questions that make it an evidence-based choice.",
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
          "The recommendation must follow the application and data map — not the other way round",
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
          "A responsibility matrix — who patches, monitors, backs up, restores",
          "Stated performance and recovery objectives",
          "An operating-cost estimate",
          "A fit / pilot / alternative conclusion",
        ],
        note: "Product supply, billing and support for VPS infrastructure sit with HOSTAFRICA through its official route — see the infrastructure path for the responsibility split and disclosure.",
      },
    ],
  },

  "guides/agents-on-vps": {
    eyebrow: "GUIDES / SUPERVISED AGENTS",
    title: "What an always-on agent needs beyond a VPS.",
    intro:
      "An AI agent that runs unattended is an operational commitment, not a feature flag. Before one touches real work, it needs boundaries, supervision, measurement and a way to stop it — this guide covers what that means in practice.",
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
          "A permission and authority matrix — what it may read, recommend and do",
          "A data and privacy map covering permitted and prohibited data",
          "An operating charter with human-approval points and prohibited actions",
          "Evaluation fixtures for quality, cost, latency and failure",
          "An incident and shutdown process that works without the agent's cooperation",
        ],
        note: "An agent does not replace accountable people, and no agent's accuracy is guaranteed. Bounded, supervised and reversible is the standard — anything less is not ready for real work.",
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
            body: "Select the three questions with the greatest business consequence — not the longest list of findings.",
          },
          {
            title: "Choose a path",
            body: "Continue with an independent Ujiajiri implementation partner, or through the official HOSTAFRICA route for infrastructure. The provider you choose is accountable for the work.",
          },
          {
            title: "Verify",
            body: "You and the chosen provider agree how the result will be tested — in enquiries, performance, ownership or recovery — before the work begins.",
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
          "Website and digital-marketing implementation can be discussed directly with an independent Ujiajiri partner. HOSTAFRICA product enquiries continue through the approved official HOSTAFRICA route.",
          "Onduu does not automatically transmit your assessment answers to either destination. Any transfer of your information requires your explicit consent first — at launch, the routes are outbound links you follow yourself.",
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
            body: "Independent Ujiajiri partners contract directly with clients. The directory is being established; until then the form below can point you at the next step.",
          },
          {
            title: "HOSTAFRICA products or support",
            body: "Product, billing and support enquiries belong with HOSTAFRICA's official route — Onduu cannot resolve them and does not pass your details along.",
          },
        ],
        note: "One enquiry is never silently sent to all three organisations. What you submit here goes to Onduu only.",
      },
      ...(prototypePages["contact"]?.sections ?? []),
    ],
  },
};
