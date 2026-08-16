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
    "intro": "What Onduu collects when you use this website, why it is collected, who else can see it, how long it is kept and what you can ask for.",
    "gate": "Draft for professional review. Items marked TO CONFIRM need Wycliffe's input before this can be relied on.",
    "sections": [
      {
        "eyebrow": "STATUS",
        "title": "This is a draft.",
        "body": [
          "This notice describes what the website actually does today, checked against the code that runs it. It has not yet been reviewed by a legal professional, and the entries marked TO CONFIRM are facts only the owner can supply.",
          "Until that review is complete, treat this as a good-faith description rather than a final legal notice."
        ]
      },
      {
        "eyebrow": "01 / WHO IS RESPONSIBLE",
        "title": "Who controls this information.",
        "body": [
          "Onduu is the data controller for information submitted through this website. Onduu is the independent professional practice of Wycliffe Onduu, operating in Kenya.",
          "TO CONFIRM: registered legal entity name and registration number, postal and physical address, whether Onduu is registered as a data controller with the Office of the Data Protection Commissioner, and the named contact for data questions."
        ],
        "note": "Questions about your information can be sent to me@onduu.ke."
      },
      {
        "eyebrow": "02 / WHAT IS COLLECTED",
        "title": "Only what you type into a form.",
        "body": [
          "The Digital Readiness Score request and the contact form collect the fields you complete. Nothing else about you is gathered as you browse."
        ],
        "items": [
          "Full name",
          "Business email address",
          "Company",
          "Role, if you give one",
          "Website address, if you give one",
          "The concern you select, and the free-text answers you write about your situation",
          "A record that you ticked the consent box, the exact wording you agreed to, and the date of that wording",
          "A reference number generated for your request"
        ],
        "note": "The forms ask you not to submit passwords, credentials or sensitive customer data, and you should not do so. Nothing on this site needs them."
      },
      {
        "eyebrow": "03 / WHY, AND ON WHAT BASIS",
        "title": "Why each piece is held.",
        "cards": [
          {
            "title": "To answer your request",
            "body": "Your form answers are used to review what you have asked for and recommend a next step. The basis is your consent, given by ticking the box when you submit."
          },
          {
            "title": "To keep a record of consent",
            "body": "The consent text and version are stored so it can be shown later exactly what you agreed to. The basis is the legal obligation to be able to demonstrate consent."
          },
          {
            "title": "To stop abuse of the forms",
            "body": "A spam check runs on submission and a short-lived counter limits how many requests one connection can send in an hour. The basis is a legitimate interest in keeping the forms usable."
          }
        ]
      },
      {
        "eyebrow": "04 / THE DOMAIN CHECKER",
        "title": "The email security checker stores nothing.",
        "body": [
          "When you check a domain at /check, the domain name is sent to Cloudflare's public DNS resolver so its published SPF, DKIM, DMARC and MX records can be read. Those records are already public: anyone can look them up.",
          "The result is generated and returned to you. The domain you checked and the result are not written to any database by this site, and no account or email address is required to use it."
        ],
        "note": "A result from the checker describes published DNS records. It is not proof that a domain, a mailbox or a business is secure."
      },
      {
        "eyebrow": "05 / COOKIES AND ANALYTICS",
        "title": "No analytics, and no tracking cookies.",
        "body": [
          "This website runs no analytics product, no advertising tags and no third-party tracking scripts. Your visit is not profiled and no cookie is set to follow you between pages or between sites.",
          "The spam check on the forms is Cloudflare Turnstile, which may set its own cookie in your browser for the purpose of telling a person from an automated script. Cloudflare, which serves this site, may also set a short-lived security cookie for the same reason."
        ],
        "note": "TO CONFIRM: whether to add a privacy-conscious analytics baseline later. If one is added, this section must be updated before it goes live."
      },
      {
        "eyebrow": "06 / WHO ELSE PROCESSES IT",
        "title": "The other parties involved.",
        "cards": [
          {
            "title": "Cloudflare",
            "body": "Hosts this website, stores form submissions in its database service, provides the spam check and resolves the DNS lookups used by the checker."
          },
          {
            "title": "ZeptoMail",
            "body": "Sends the notification that tells Onduu a request has arrived. That message contains only the reference number and which form was used — none of your answers, and not your name or email address."
          }
        ],
        "note": "No artificial-intelligence or language-model provider receives your form submissions. No information from these forms is sold, and none is passed to an infrastructure supplier or any other third party without asking you first."
      },
      {
        "eyebrow": "07 / WHERE IT IS STORED",
        "title": "Where the information sits, and where it travels.",
        "body": [
          "Submissions are stored in Cloudflare's database service and are served from Cloudflare's network, which operates data centres in many countries. Information may therefore be stored or processed outside Kenya.",
          "Onduu does not claim that this website keeps all data inside Kenya, because that would not be true of a service delivered on a global network."
        ],
        "note": "TO CONFIRM: whether the storage region should be pinned, and the safeguards to be recorded for transfers outside Kenya."
      },
      {
        "eyebrow": "08 / HOW LONG IT IS KEPT",
        "title": "Two years, then deleted.",
        "body": [
          "Each submission is stored with a deletion date set two years (730 days) from the day it was received. It is kept for that long so a business relationship or an earlier enquiry can be picked up again, and so a consent record exists for as long as it may be needed.",
          "You can ask for your information to be deleted sooner, and it will be."
        ],
        "note": "TO CONFIRM: whether two years is the retention period Wycliffe wants, and who performs the deletion and how it is evidenced."
      },
      {
        "eyebrow": "09 / SECURITY",
        "title": "What is done to protect it, and what that does not prove.",
        "items": [
          "The site is served only over an encrypted connection",
          "Database queries use prepared statements, so submitted text cannot alter them",
          "Application logs record only an event name, the form type and the reference number — never your name, email address or answers",
          "The abuse counter stores a one-way hash of the connection address rather than the address itself",
          "The submission endpoint refuses to accept anything at all if its spam check is not configured, rather than accepting data unprotected"
        ],
        "note": "These are the measures in place. No website can promise that information is completely safe, and this notice does not make that claim."
      },
      {
        "eyebrow": "10 / YOUR RIGHTS",
        "title": "What you can ask for.",
        "body": [
          "Under the Kenyan Data Protection Act 2019 you may ask to see the information held about you, to have it corrected, to have it deleted, to object to how it is used, and to receive a copy of it."
        ],
        "items": [
          "Email me@onduu.ke with what you would like done",
          "Include the reference number from your confirmation if you have it, as that makes the record easy to find",
          "You will not be asked for a password or any account credential in order to make a request"
        ],
        "note": "TO CONFIRM: the response time Onduu commits to. No commitment is published here until the operating capacity to meet it exists."
      },
      {
        "eyebrow": "11 / WITHDRAWING CONSENT",
        "title": "You can change your mind.",
        "body": [
          "Where information is processed because you consented, you can withdraw that consent at any time by emailing me@onduu.ke. Withdrawing it does not undo anything already done on the basis of your earlier consent, and it does not affect the separate record kept to show what you agreed to."
        ]
      },
      {
        "eyebrow": "12 / COMPLAINTS",
        "title": "If you are not satisfied.",
        "body": [
          "Raise it directly first, at me@onduu.ke, and it will be looked at properly.",
          "You also have the right to complain to the Office of the Data Protection Commissioner in Kenya. Doing so does not require you to contact Onduu first."
        ],
        "note": "TO CONFIRM: the ODPC contact details and complaint route to publish here."
      },
      {
        "eyebrow": "13 / VERSION",
        "title": "Version and effective date.",
        "body": [
          "Draft version 0.1, prepared 16 August 2026. It has no effective date until it has been reviewed and the TO CONFIRM items have been answered.",
          "The consent wording shown on the forms is versioned separately, so a record exists of the exact text each person agreed to."
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
