import type { PageContent } from "./components";

// Page content taken from the definitive brief of 15 August 2026
// (ONDUU_DEFINITIVE_WEBSITE_CONTENT_AND_LLM_BUILD_BRIEF_2026_08_15.pdf),
// sections 10, 11, 12, 13 and 25. These entries override the earlier
// prototype copy in site-data.ts; the merge happens in site-pages.ts.
//
// Gated offers (Managed Website Operations, Agent Workflow Pilot) are
// deliberately not described here. Legal routes carry the coverage list the
// brief requires and are clearly marked as drafts — no legal conclusions are
// invented.

export const briefPages: Record<string, PageContent> = {
  "readiness": {
    "eyebrow": "THE ONDUU DIGITAL READINESS SCORE",
    "title": "See what your website is costing, risking or leaving unproven.",
    "intro": "The Digital Readiness Score is a human-reviewed business diagnostic. It combines what your team declares, what can be safely observed from the public internet and what Onduu manually verifies. You receive six dimension scores, evidence labels, limitations and the three actions worth addressing first.",
    "sections": [
      {
        "eyebrow": "WHY THIS EXISTS",
        "title": "A conventional website audit often checks the page. This checks the operating system around it.",
        "body": [
          "A fast homepage does not prove the enquiry reaches sales. A backup schedule does not prove a restore works. A DMARC record does not prove every authorised sender aligns. An analytics tag does not prove the business can connect traffic to qualified outcomes.",
          "The Score makes those distinctions visible."
        ]
      },
      {
        "eyebrow": "EVIDENCE LABELS",
        "title": "Know what the finding is based on.",
        "cards": [
          {
            "title": "Declared by customer",
            "body": "Information supplied by the business but not yet independently verified."
          },
          {
            "title": "Publicly observed",
            "body": "Information visible through safe, non-invasive checks of public pages, DNS or performance sources."
          },
          {
            "title": "Manually reviewed",
            "body": "Evidence reviewed by an Onduu reviewer."
          },
          {
            "title": "Directly tested",
            "body": "A control observed in a permitted test, such as an authorised enquiry trace or non-production restoration drill."
          }
        ]
      },
      {
        "eyebrow": "OUTPUT",
        "title": "A short decision document, not a wall of warnings.",
        "items": [
          "Overall score and descriptive band",
          "Six dimension scores",
          "Evidence and confidence for each material finding",
          "Strengths worth preserving",
          "The three highest-priority actions",
          "Business consequence, effort, recommended owner and next step",
          "Clear limitations",
          "The appropriate next engagement, including “not yet” where applicable"
        ]
      },
      {
        "eyebrow": "PROCESS",
        "title": "How the assessment runs.",
        "steps": [
          {
            "title": "Request",
            "body": "Provide the website, business context and consent."
          },
          {
            "title": "Answer",
            "body": "Complete the structured questions."
          },
          {
            "title": "Observe",
            "body": "Approved public observations are gathered where included."
          },
          {
            "title": "Review",
            "body": "Onduu checks the evidence and chooses the three priorities."
          },
          {
            "title": "Receive",
            "body": "The report is delivered privately with an interpretation route."
          }
        ]
      },
      {
        "eyebrow": "LIMITATIONS",
        "title": "What this assessment is not.",
        "body": [
          "The Digital Readiness Score is not a penetration test, vulnerability assessment, legal opinion, compliance certificate, email-delivery guarantee or proof that backups restore. Public observations are limited to what is safely visible. Deeper tests require separate written permission and an agreed scope."
        ]
      }
    ],
    "form": "readiness"
  },
  "how-it-works": {
    "eyebrow": "ONDUU / HOW IT WORKS",
    "title": "From hidden weakness to measured improvement.",
    "intro": "Onduu begins with the business consequence, not a predetermined website package. We establish what is weak or unproven, fix the priority, assign ownership and measure what changes.",
    "cta": "Get your digital readiness score",
    "ctaHref": "/readiness",
    "sections": [
      {
        "eyebrow": "THE STAGES",
        "title": "Five stages, in order.",
        "steps": [
          {
            "title": "Score",
            "body": "Establish a baseline across Control, Trust, Speed, Conversion, Resilience and Agent Readiness. Separate customer declarations, public observations and tested evidence."
          },
          {
            "title": "Review",
            "body": "Where the business needs deeper evidence, the Digital Revenue and Risk Review traces ownership, customer journeys, measurement, continuity and operating responsibilities. The output is a 30/60/90-day plan."
          },
          {
            "title": "Fix",
            "body": "Complete the Website Revenue System or the targeted sprint that matches the diagnosis. Do not force every client into a redesign."
          },
          {
            "title": "Operate",
            "body": "Keep the system monitored, reported and improved. The work follows exceptions and business priorities, not a checklist of busywork."
          },
          {
            "title": "Introduce agents carefully",
            "body": "When one workflow is suitable, define what the agent may read, recommend and do; what requires human approval; how quality and cost are measured; and how the workflow is stopped safely."
          }
        ]
      },
      {
        "eyebrow": "STAGE 1 RESPONSIBILITIES",
        "title": "What the customer provides.",
        "items": [
          "Accurate business context",
          "The website and important journey",
          "No passwords or unnecessary personal data",
          "A named authorised decision-maker"
        ]
      },
      {
        "eyebrow": "DELIVERABLES",
        "title": "What the customer receives.",
        "items": [
          "Evidence and source labels",
          "Clear priorities",
          "Responsible owners",
          "Implementation scope",
          "Measurement plan",
          "Decision and change history",
          "Concise regular reporting",
          "Client-owned handover and offboarding materials"
        ]
      },
      {
        "eyebrow": "BOUNDARIES",
        "title": "What Onduu will not imply.",
        "items": [
          "That a public scan proves security",
          "That a backup exists because a setting says so",
          "That traffic equals revenue",
          "That Kenyan hosting automatically creates compliance",
          "That an agent replaces accountable people",
          "That every client needs a new website"
        ]
      }
    ]
  },
  "solutions": {
    "eyebrow": "ONDUU / SOLUTIONS",
    "title": "Fix the right problem - not simply the visible one.",
    "intro": "A redesign will not solve unclear ownership. More traffic will not solve a broken form. A new agent will not solve an undocumented process. Start with the weakness and choose the response that fits.",
    "cta": "Start with my score",
    "ctaHref": "/readiness",
    "sections": [
      {
        "eyebrow": "THE RESPONSES",
        "title": "Choose the response that matches the diagnosis.",
        "cards": [
          {
            "title": "Digital Revenue and Risk Review",
            "body": "A deeper, paid diagnosis for leadership teams that need evidence, ownership, priorities and a 30/60/90-day corrective plan.",
            "meta": "PAID DIAGNOSIS"
          },
          {
            "title": "Website Revenue System",
            "body": "Clarify the offer, build or improve the website, prove the enquiry path, establish measurement and leave the business in control.",
            "meta": "FLAGSHIP"
          }
        ],
        "note": "Managed Website Operations and the Agent Workflow Pilot are not published while their commercial boundaries are being approved."
      },
      {
        "eyebrow": "DECISION GUIDE",
        "title": "Where to start.",
        "items": [
          "You do not know what is wrong: start with the Digital Readiness Score.",
          "Leadership needs evidence and a plan: choose the Digital Revenue and Risk Review.",
          "The offer, journey and platform need material work: choose the Website Revenue System."
        ]
      }
    ]
  },
  "solutions/digital-revenue-risk-review": {
    "eyebrow": "PAID DIAGNOSIS FOR DECISION-MAKERS",
    "title": "Know what to fix, who should own it and what happens if you do nothing.",
    "intro": "The Digital Revenue and Risk Review goes beyond the entry score. It examines the commercial journey, asset ownership, measurement, DNS and email foundations, resilience, brand consistency and readiness for controlled automation.",
    "cta": "Discuss the review",
    "ctaHref": "/contact",
    "sections": [
      {
        "eyebrow": "BEST FIT",
        "title": "When this is the right response.",
        "items": [
          "A managing director needs a prioritised plan",
          "Marketing and IT disagree about the problem",
          "The website produces activity but unclear outcomes",
          "A rebrand, redesign, supplier change or agent project is being considered",
          "Ownership, recovery or data-flow questions are unresolved"
        ]
      },
      {
        "eyebrow": "DELIVERABLES",
        "title": "What the review produces.",
        "items": [
          "Executive scorecard",
          "Stakeholder interview",
          "Evidence and limitation register",
          "Ownership matrix",
          "One lead-path trace where authorised",
          "Brand, message and CTA review",
          "DNS/email-domain and operational health review",
          "Measurement baseline",
          "Top five business risks and opportunities",
          "30/60/90-day action plan",
          "Management presentation"
        ]
      },
      {
        "eyebrow": "SCOPE",
        "title": "Not included by default.",
        "items": [
          "Penetration testing",
          "Production-form submission without written permission",
          "Backup restoration without an agreed safe environment",
          "Legal or compliance certification",
          "Implementation work beyond the signed scope"
        ]
      }
    ]
  },
  "legal/commercial-relationships": {
    "eyebrow": "ONDUU / LEGAL",
    "title": "Commercial relationships.",
    "intro": "How Onduu is owned, what it contracts independently, and how any referral or disclosure works.",
    "gate": "Legal drafting and professional review pending. Do not rely on this page yet.",
    "sections": [
      {
        "eyebrow": "STATUS",
        "title": "This page is a draft.",
        "body": [
          "Draft. This page is published so the routes and structure exist, and so the assessment and contact forms can link to it. The wording below is not final and is awaiting professional review. It does not yet constitute the published notice."
        ]
      },
      {
        "eyebrow": "COVERAGE",
        "title": "What the final version will cover.",
        "items": [
          "Onduu identity and ownership",
          "Wycliffe's current HOSTAFRICA role",
          "Which services Onduu contracts independently",
          "Which infrastructure services HOSTAFRICA contracts and supports",
          "How referrals and attribution work",
          "Conflicts and disclosures",
          "Contact for questions"
        ]
      },
      {
        "eyebrow": "IN THE MEANTIME",
        "title": "Questions about your data.",
        "body": [
          "If you have a question about information you have already sent, or you want it corrected or deleted, email me@onduu.ke and it will be handled directly."
        ]
      }
    ]
  },
  "legal/privacy": {
    "eyebrow": "ONDUU / LEGAL",
    "title": "Privacy notice.",
    "intro": "What Onduu collects when you use this website or request an assessment, why, and what you can ask for.",
    "gate": "Legal drafting and professional review pending. Do not rely on this page yet.",
    "sections": [
      {
        "eyebrow": "STATUS",
        "title": "This page is a draft.",
        "body": [
          "Draft. This page is published so the routes and structure exist, and so the assessment and contact forms can link to it. The wording below is not final and is awaiting professional review. It does not yet constitute the published notice."
        ]
      },
      {
        "eyebrow": "COVERAGE",
        "title": "What the final version will cover.",
        "items": [
          "Controller and processor identity by purpose",
          "Information collected",
          "Purpose and lawful basis",
          "Analytics and cookies",
          "Assessment data",
          "Processors and model providers",
          "Data locations and transfers",
          "Retention",
          "Security approach",
          "Data-subject rights and contact route",
          "Consent withdrawal",
          "Complaint route",
          "Version and effective date"
        ]
      },
      {
        "eyebrow": "IN THE MEANTIME",
        "title": "Questions about your data.",
        "body": [
          "If you have a question about information you have already sent, or you want it corrected or deleted, email me@onduu.ke and it will be handled directly."
        ]
      }
    ]
  },
  "legal/assessment-terms": {
    "eyebrow": "ONDUU / LEGAL",
    "title": "Assessment terms.",
    "intro": "The terms that apply when you request a Digital Readiness Score or a review.",
    "gate": "Legal drafting and professional review pending. Do not rely on this page yet.",
    "sections": [
      {
        "eyebrow": "STATUS",
        "title": "This page is a draft.",
        "body": [
          "Draft. This page is published so the routes and structure exist, and so the assessment and contact forms can link to it. The wording below is not final and is awaiting professional review. It does not yet constitute the published notice."
        ]
      },
      {
        "eyebrow": "COVERAGE",
        "title": "What the final version will cover.",
        "items": [
          "Permitted public observations",
          "Customer authority to submit the domain",
          "Prohibited use",
          "Distinction among declaration, observation, review and test",
          "No penetration test, compliance certificate or guarantee",
          "Report confidentiality and access",
          "Retention",
          "Correction process",
          "Intellectual property and limitations"
        ]
      },
      {
        "eyebrow": "IN THE MEANTIME",
        "title": "Questions about your data.",
        "body": [
          "If you have a question about information you have already sent, or you want it corrected or deleted, email me@onduu.ke and it will be handled directly."
        ]
      }
    ]
  },
  "legal/managed-service-terms": {
    "eyebrow": "ONDUU / LEGAL",
    "title": "Managed service terms.",
    "intro": "The terms that will apply to ongoing managed work once that service is approved and contracted.",
    "gate": "Legal drafting and professional review pending. Do not rely on this page yet.",
    "sections": [
      {
        "eyebrow": "STATUS",
        "title": "This page is a draft.",
        "body": [
          "Draft. This page is published so the routes and structure exist, and so the assessment and contact forms can link to it. The wording below is not final and is awaiting professional review. It does not yet constitute the published notice."
        ]
      },
      {
        "eyebrow": "COVERAGE",
        "title": "What the final version will cover.",
        "items": [
          "Included systems and monitored journeys",
          "Support hours and escalation",
          "Reporting cadence",
          "Approval and authority matrix",
          "Availability and remediation limitations",
          "Client responsibilities",
          "Access and security",
          "Model and agent limitations",
          "Incident and breach responsibilities",
          "Pricing and out-of-scope work",
          "Termination, export, retention, deletion and offboarding"
        ]
      },
      {
        "eyebrow": "IN THE MEANTIME",
        "title": "Questions about your data.",
        "body": [
          "If you have a question about information you have already sent, or you want it corrected or deleted, email me@onduu.ke and it will be handled directly."
        ]
      }
    ]
  }
};
