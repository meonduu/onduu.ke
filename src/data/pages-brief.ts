import type { PageContent } from "../components/components";

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
  "digital-fitness": {
    "eyebrow": "THE ONDUU DIGITAL FITNESS ASSESSMENT",
    "title": "How digitally fit is your business?",
    "intro": "The Digital Fitness Assessment is a human-reviewed business diagnostic. It combines what your team declares, what can be safely observed from the public internet and what Onduu manually verifies. You receive a Digital Fitness Score with its Evidence Coverage, six dimension scores, evidence labels, limitations and the three actions worth addressing first.",
    "cta": "Start my assessment",
    "ctaHref": "#request",
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
            "body": "Agents work through the evidence; a person chooses the three priorities."
          },
          {
            "title": "Receive",
            "body": "The report is delivered privately with an interpretation route."
          }
        ],
        "note": "Every assessment runs the same framework over the same six dimensions, so nothing is skipped and no finding depends on what a reviewer happened to remember. Onduu's agents do that first pass across your declared answers and the public evidence, and some of those agents run on third-party AI services. Agents misread things, which is why a person reviews every finding, score and recommendation before your report is issued."
      },
      {
        "eyebrow": "LIMITATIONS",
        "title": "What this assessment is not.",
        "body": [
          "The Digital Fitness Score is not a penetration test, vulnerability assessment, legal opinion, compliance certificate, email-delivery guarantee or proof that backups restore. Public observations are limited to what is safely visible. Deeper tests require separate written permission and an agreed scope.",
          "It is also not a certification, and it does not declare a business digitally fit. A score is a measurement of the evidence available at the time, which is why it is always shown with its Evidence Coverage: where coverage is low, the score describes a small part of the picture and should be read that way."
        ]
      }
    ],
    "form": "fitness"
  },
  "how-it-works": {
    "eyebrow": "ONDUU / HOW IT WORKS",
    "title": "From hidden weakness to measured improvement.",
    "intro": "Onduu begins with the business consequence, not a predetermined website package. We establish what is weak or unproven, fix the priority, assign ownership and measure what changes.",
    "cta": "Get your Digital Fitness Score",
    "ctaHref": "/digital-fitness",
    "sections": [
      {
        "eyebrow": "THE STAGES",
        "title": "Five stages, in order.",
        "steps": [
          {
            "title": "Score",
            "body": "Establish a baseline across Control, Trust, Speed, Conversion, Resilience and Agent Fitness. Separate customer declarations, public observations and tested evidence."
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
    "ctaHref": "/digital-fitness",
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
          "You do not know what is wrong: start with the Digital Fitness Score.",
          "Leadership needs evidence and a plan: choose the Digital Revenue and Risk Review.",
          "The offer, journey and platform need material work: choose the Website Revenue System."
        ]
      }
    ]
  },
  "solutions/digital-revenue-risk-review": {
    "eyebrow": "PAID DIAGNOSIS FOR DECISION-MAKERS",
    "title": "Know what to fix, who should own it and what happens if you do nothing.",
    "intro": "The Digital Revenue and Risk Review goes beyond the entry score. It examines the commercial journey, asset ownership, measurement, DNS and email foundations, resilience, brand consistency and fitness for controlled automation.",
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
    "intro": "Onduu, Ujiajiri and HOSTAFRICA have distinct roles. This page explains who is responsible for advice, introductions, products, contracts, payments and customer information.",
    "gate": "Draft for professional review. This page describes current practice accurately and has not yet been checked by a lawyer.",
    "sections": [
      {
        "eyebrow": "ONDUU AND UJIAJIRI",
        "title": "Who advises, who introduces, who delivers.",
        "body": [
          "Onduu is a Digital Fitness and educational platform operated by Ujiajiri Enterprises Limited. Onduu helps businesses understand weaknesses affecting their websites and digital operations, review available evidence and identify the actions worth addressing first.",
          "When a business needs independent website or digital-marketing implementation, it may separately ask Ujiajiri for an introduction. Ujiajiri uses a private, curated provider network; it does not publish an open directory.",
          "Ujiajiri will propose a suitable independent provider and identify that provider before sharing the customer's information. The customer may accept, decline or request another provider. Identifiable information is shared only after the customer gives permission.",
          "The selected provider scopes, quotes, contracts, invoices, delivers, supports and warrants its own work. The customer pays the provider directly. Neither Onduu nor Ujiajiri guarantees provider availability, suitability, price, delivery or results.",
          "Ujiajiri may receive a referral fee from the selected provider after qualifying client payment under a written partner agreement. The existence of that arrangement will be disclosed before the customer approves the introduction. The provider remains responsible for explaining whether the arrangement affects its quoted price."
        ]
      },
      {
        "eyebrow": "HOSTAFRICA",
        "title": "Relationship with HOSTAFRICA.",
        "body": [
          "Wycliffe is the Managing Director of [HOSTAFRICA](https://www.hostafrica.ke) Kenya. HOSTAFRICA is the provider, seller, biller, provisioner, renewer and supporter of any HOSTAFRICA domains, hosting, email, VPS or other infrastructure products referenced on this website.",
          "Onduu may explain infrastructure use cases and direct an interested visitor to an approved official HOSTAFRICA route. Onduu and Ujiajiri do not themselves supply or support HOSTAFRICA products and must not be understood as substitutes for HOSTAFRICA's contracts, terms, billing or support.",
          "An Ujiajiri introduction is separate from a HOSTAFRICA product route. An independent provider introduced by Ujiajiri is not thereby a HOSTAFRICA employee, agent or approved partner. Customers are not required to purchase HOSTAFRICA products merely because they use Onduu or request an Ujiajiri introduction.",
          "The domain search links an available name to HOSTAFRICA's checkout. That link carries HOSTAFRICA affiliate identifier 916 and campaign tags, which attribute the referral and pay Onduu no commission. Clicks on it are counted in aggregate only, with nothing recorded about the visitor who clicked.",
          "Any commission, referral benefit, sponsorship, free product or other material commercial relationship connected to a recommendation or link is disclosed on this page. It is reachable from the footer of every page on this site."
        ]
      },
      {
        "eyebrow": "INTRODUCTIONS",
        "title": "Introductions to independent providers.",
        "body": [
          "If you ask for implementation support, Ujiajiri may propose a suitable independent provider. We will identify the provider and ask for your permission before sharing your name, contact details or project information. If you agree, Ujiajiri will introduce you by email and copy the provider. You may decline an introduction without affecting your Onduu.ke assessment or advice. The provider will then scope, quote, contract, invoice and deliver directly under its own terms and privacy notice."
        ],
        "note": "A provider is copied only after you have approved that specific introduction. Asking Onduu a question, or submitting a form on this site, never puts a provider on the message."
      },
      {
        "eyebrow": "INFORMATION AND CHOICE",
        "title": "Nothing moves without your permission.",
        "body": [
          "Onduu assessment answers and contact details are not automatically sent to Ujiajiri, an independent provider or HOSTAFRICA. Any transfer requires a clear notice and the customer's appropriate permission. Following an external link means the destination organisation's own terms and privacy notice will apply."
        ]
      },
      {
        "eyebrow": "QUESTIONS",
        "title": "Ask directly.",
        "body": [
          "Questions about an Ujiajiri introduction, provider conduct or these commercial relationships may be sent to info@ujiajiri.ke."
        ],
        "note": "Questions about your own information held by Onduu — access, correction, deletion or a complaint — go through the contact form on this site instead, which reaches Ujiajiri Enterprises Limited only."
      }
    ]
  },
  "legal/privacy": {
    "eyebrow": "ONDUU / LEGAL",
    "title": "Privacy notice.",
    "intro": "What Onduu collects when you use this website, why it is collected, who else can see it, how long it is kept and what you can ask for.",
    "gate": "Draft for professional review. Two points below are still being decided, and no lawyer has checked this page yet.",
    "sections": [
      {
        "eyebrow": "STATUS",
        "title": "This is a draft.",
        "body": [
          "This notice describes what the website actually does today, checked against the code that runs it. It has not yet been reviewed by a legal professional, and two points marked \u0022still to decide\u0022 are choices that have not been made yet.",
          "Until that review is complete, treat this as a good-faith description rather than a final legal notice."
        ]
      },
      {
        "eyebrow": "WHO IS RESPONSIBLE",
        "title": "Who controls this information.",
        "body": [
          "The data controller is Ujiajiri Enterprises Limited, a limited liability company registered in Kenya, which trades as Onduu and operates this website. Onduu is the brand and is not itself a registered company; Ujiajiri Enterprises Limited is the accountable entity."
        ],
        "note": "Questions about your information can be sent through the contact form. Enquiries are received and answered by Ujiajiri Enterprises Limited, and inside that company are seen only by the people who need them."
      },
      {
        "eyebrow": "WHAT IS COLLECTED",
        "title": "What you type, and how the pages are used.",
        "body": [
          "The Digital Fitness Assessment request and the contact form collect the fields you complete. Those fields are listed below.",
          "Separately, how the pages themselves are used is measured: which page was opened, roughly how long it was on screen, and clicks on the few elements this site marks for counting. That measurement holds no name, address or identifier, and cannot recognise you on a later visit. Section 05 describes exactly how it works and how to switch it off."
        ],
        "items": [
          "Full name",
          "Business email address",
          "Company",
          "Role, if you give one",
          "Website address, if you give one",
          "The concern you select, and the free-text answers you write about your situation",
          "A record that you ticked the consent box, the exact wording you agreed to, and the date of that wording",
          "A reference number generated for your request",
          "How you arrived: the site that referred you, the page you landed on, and any campaign parameters in the link you followed"
        ],
        "note": "The forms ask you not to submit passwords, credentials or sensitive customer data, and you should not do so. Nothing on this site needs them. The arrival details above are recorded so it is possible to tell which article or link actually produced an enquiry; they are held with the enquiry and describe the visit, not you. Page-view records are separate from enquiries and hold nothing that identifies you."
      },
      {
        "eyebrow": "WHY, AND ON WHAT BASIS",
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
          },
          {
            "title": "To know which content works",
            "body": "Where you came from is stored with your enquiry so it is possible to tell which article or link produced it. This is kept in first-party records rather than sent to an analytics company. The basis is a legitimate interest in knowing which work is worth continuing."
          },
          {
            "title": "To see which pages are read",
            "body": "How the pages are used is measured: which page was opened, roughly how long it was on screen, and clicks on the elements this site marks for counting. Nothing in it identifies you or links one visit to another. The basis is a legitimate interest in improving what is published here, and the measurement stops entirely for a browser sending Global Privacy Control or Do Not Track."
          }
        ]
      },
      {
        "eyebrow": "THE DOMAIN TOOLS",
        "title": "What the domain tools read, and what they keep.",
        "body": [
          "The email security checker at /email-security sends the domain name to Cloudflare's public DNS resolver so its published SPF, DKIM, DMARC and MX records can be read. Those records are already public. Since 18 August 2026 the domain checked and the result are stored, so Onduu can see which checks are being run and which failures are common. No account or email address is required, and nothing about you is recorded with the result. A stored row says a domain was checked at a time, never who checked it.",
          "The Instant Public Fitness Scan at /scan reads more public information about a domain (its registry record, DNS, published email records, and the homepage, robots.txt and sitemap that any visitor can request) and returns a Public Signal Score. Unlike the checker, a scan result is stored: the domain scanned, the public observations behind each signal, the score and a reference number. This is what lets a repeat scan of the same domain return the recent result for a day rather than re-reading someone else's site, and it is what a score is recomputed from if a result is ever questioned.",
          "A scan result is about a domain, not about you. No name, email address or account is required or attached to it. The domain you enter need not be your own, because everything the scan reads is already public. To limit abuse, the scan uses the same one-way hashed connection address as the forms, held only for a short hourly counter and never stored with the result.",
          "The DNS health check at /dns reads a domain's public DNS and registry records to report whether its nameservers, delegation, addresses, mail routing and DNSSEC are coherent. Alongside the resolver lookups it asks two kinds of server a standard question directly, over the ordinary DNS port: one nameserver of the parent zone (for the delegation and glue records the parent publishes) and each of the domain's own nameservers (for the zone serial each is serving). These are read-only questions, the same ones every resolver on the internet sends, and no part of them concerns you: the servers see a request from Onduu's infrastructure, never anything about the visitor who asked. The domain checked and a summary of the outcome are stored, with no visitor identity attached, on the same basis and with the same deletion route as the tools above.",
          "The domain search at /domains checks whether a name is registered across the Kenyan extensions using public DNS and registry records, and shows a taken domain's registrar, transfer lock and expiry. Since 18 August 2026 the name searched and what was found are stored, on the same basis and with the same limit as the checker above: no account, and no identifier that could connect a search to you. If an available name leads you to register it, that happens at HOSTAFRICA's own site. The outbound link carries attribution tags so Onduu can see, in aggregate, that traffic came from this tool, and Onduu counts the click as a number with no identity attached. Onduu receives no commission on registrations."
        ],
        "note": "The basis for storing tool results is a legitimate interest in operating the tools, caching results so they do not repeatedly fetch third-party sites, seeing which checks are run and which failures are common, and being able to reproduce a score. A Public Signal Score describes public observations at a moment in time; it is not a Digital Fitness Score, and not proof that a domain, a mailbox or a business is secure. Results are kept until deleted rather than on a fixed schedule. If you operate a domain and want it left alone, ask at [/do-not-scan](/do-not-scan): every stored record of it is deleted (scan results and any stored email or domain lookups), the domain is added to a do-not-scan list so it is not scanned again, and future lookups of it are not recorded. The lookups themselves keep working, because they read only the public records any WHOIS tool can read. That request asks for one thing beyond the domain: an email address at the domain, to which a single confirmation link is sent, because receiving mail there is how control of the domain is shown. The address is kept with the request as the record of who asked, and is used for nothing else."
      },
      {
        "eyebrow": "COOKIES AND ANALYTICS",
        "title": "No tracking cookies, and nothing to consent to.",
        "body": [
          "This website runs no advertising tags, no third-party tracking scripts and no product that follows you between sites. There is no cookie banner because there is nothing here that needs one. No analytics company's product runs in your browser. A content-security policy served with every page permits scripts only from this site itself, plus the Turnstile spam check on the forms and an embedded video player; anything else a browser was asked to load would be refused.",
          "Page views are counted on the server: which page was requested, which external site referred it, the country reported by the network, and whether the device is a phone, tablet or desktop. No address, no browser fingerprint and no identifier is stored, and two views cannot be linked to the same person. Nothing needs to run in your browser for this counting and nothing is stored on your device for it.",
          "Since 19 August 2026 a small measurement script, written and served by this site itself, also runs in your browser. It reports which page was opened, roughly how long that page was actually on screen, and clicks on the handful of elements this site explicitly marks for counting — never what you type, never form contents, and never anything from other sites. So that the pages read in one sitting can be counted as one visit, it keeps a random label in your browser's session storage; the label means nothing outside that tab, is cleared when the tab closes, and cannot recognise you if you come back. If your browser sends the Global Privacy Control or Do Not Track signal, the script stays silent entirely.",
          "If you submit a form, the site that referred you and any campaign parameters from the link you followed are sent with it, so it is possible to tell which article or link produced an enquiry. Until you submit, those details sit in your browser's session storage, not a cookie, and they are cleared when you close the tab. They are never shared with a third party."
        ],
        "note": "Cloudflare, which serves this site, may set a short-lived security cookie, and the Turnstile spam check on the forms may set one. Those tell a person from an automated script; they do not measure or profile you. Separately, a browser that visited this domain before August 2026 may still hold analytics cookies set by the previous version of this site, including Google Analytics. Those are not set by the site as it stands, and clearing your cookies for this domain removes them."
      },
      {
        "eyebrow": "WHO ELSE PROCESSES IT",
        "title": "The other parties involved.",
        "cards": [
          {
            "title": "Cloudflare",
            "body": "Hosts this website, stores form submissions and stored tool results in its database service, provides the spam check on the forms, and resolves the DNS lookups the domain tools rely on."
          },
          {
            "title": "ZeptoMail",
            "body": "Sends the notification that tells Onduu a request has arrived. That message contains only the reference number and which form was used, none of your answers, and not your name or email address. One exception, since 21 August 2026: when a domain owner asks to be left alone, ZeptoMail delivers the confirmation link to the address they gave at that domain, so for that one message it receives that address and the domain."
          },
          {
            "title": "Slack",
            "body": "Receives the same one-line notification as the email, for the same reason: the reference number and which form was used, nothing you wrote and nothing that identifies you. Added 20 August 2026."
          }
        ],
        "note": "An independent provider is a different case: nothing reaches one because you used this site. If you ask for implementation support, Ujiajiri names the provider it proposes and tells you exactly what would be shared \u2014 your name, contact details and a project summary \u2014 and sends it only after you say yes to that specific introduction. You may decline without it affecting your assessment or advice. Assessment answers are analysed by Onduu's own agents, and some of those agents run on third-party AI services. What reaches those services is the substance of the assessment — your declared answers, the domain and the public evidence — with your name, email address and company name removed before anything is sent, so they never receive anything that identifies you or your business. The free domain, DNS and email tools use no agents at all. No analytics company receives anything at all. No information from these forms is sold, and none is passed to an infrastructure supplier, an implementation provider or any other third party without asking you first. Two further parties are contacted by the domain tools but receive nothing about you: the registries that answer RDAP lookups, and the nameservers the DNS check questions directly. Both see a request from Onduu's infrastructure carrying only the domain being checked."
      },
      {
        "eyebrow": "WHERE IT IS STORED",
        "title": "Where the information sits, and where it travels.",
        "body": [
          "Submissions are stored in Cloudflare's database service and are served from Cloudflare's network, which operates data centres in many countries. Information is therefore stored and processed outside Kenya.",
          "Specifically: the database runs in Cloudflare's Eastern Europe region, as a single copy with no replicas elsewhere. The website itself is served from whichever Cloudflare location is nearest the visitor, which is how a global network works.",
          "Onduu does not claim that this website keeps all data inside Kenya, because that would not be true."
        ],
        "note": "Still to decide: whether to pin storage to a chosen region, and which transfer safeguard to record under the Data Protection Act. The processing register behind this section is at docs/specs/processors-and-transfers.md in the site's repository."
      },
      {
        "eyebrow": "HOW LONG IT IS KEPT",
        "title": "Kept until deleted.",
        "body": [
          "There is no automatic deletion schedule. Submissions stay in the database until they are deleted by hand, and no fixed retention period is currently set.",
          "The same applies to the counted page views and the engagement measurement: nothing prunes them on a timer, and they are removed by hand. They hold no name, address or identifier, so there is nothing in them to trace back to a person, but they do accumulate with every visit rather than only when somebody writes in.",
          "You can ask at any time for information about you to be deleted, and it will be. That is the practical control available to you, and it is honoured on request rather than on a timer."
        ],
        "note": "Still to decide: whether a retention limit should be introduced later. Holding personal data indefinitely is a weaker position under the Data Protection Act than deleting it on a defined schedule."
      },
      {
        "eyebrow": "SECURITY",
        "title": "What is done to protect it, and what that does not prove.",
        "items": [
          "The site is served only over an encrypted connection",
          "Database queries use prepared statements, so submitted text cannot alter them",
          "Application logs record only an event name, the form type and the reference number, never your name, email address or answers",
          "The abuse counter stores a one-way hash of the connection address rather than the address itself",
          "The submission endpoint refuses to accept anything at all if its spam check is not configured, rather than accepting data unprotected"
        ],
        "note": "These are the measures in place. No website can promise that information is completely safe, and this notice does not make that claim."
      },
      {
        "eyebrow": "YOUR RIGHTS",
        "title": "What you can ask for.",
        "body": [
          "Under the Kenyan Data Protection Act 2019 you may ask to see the information held about you, to have it corrected, to have it deleted, to object to how it is used, and to receive a copy of it."
        ],
        "items": [
          "Send what you would like done through the contact form",
          "Include the reference number from your confirmation if you have it, as that makes the record easy to find",
          "You will not be asked for a password or any account credential in order to make a request"
        ],
        "note": "No response time is published, because no operating commitment has been made. Requests are handled directly by Wycliffe."
      },
      {
        "eyebrow": "WITHDRAWING CONSENT",
        "title": "You can change your mind.",
        "body": [
          "Where information is processed because you consented, you can withdraw that consent at any time through the contact form. Withdrawing it does not undo anything already done on the basis of your earlier consent, and it does not affect the separate record kept to show what you agreed to."
        ]
      },
      {
        "eyebrow": "COMPLAINTS",
        "title": "If you are not satisfied.",
        "body": [
          "Raise it directly first, through the contact form, choosing \u0022complaint\u0022 as the issue so it arrives marked as one. Complaints are handled by Ujiajiri Enterprises Limited, the company accountable for this site, and will be looked at properly.",
          "You also have the right to complain to the Office of the Data Protection Commissioner in Kenya. That right is independent: it does not require you to contact Onduu first, and using the contact form does not replace it."
        ],
        "note": "The Office of the Data Protection Commissioner publishes its own complaint route; this notice does not reproduce contact details that could go out of date."
      },
      {
        "eyebrow": "VERSION",
        "title": "Version and effective date.",
        "body": [
          "Draft version 0.5, prepared 20 August 2026 with facts confirmed by the owner the same day. It has no effective date until a legal professional has reviewed it and the two open points are decided.",
          "What changed in 0.5: the owner confirmed that Onduu itself is not a registered company and that Ujiajiri Enterprises Limited, a limited liability company registered in Kenya, is the accountable entity; the complaints section names that company and points at the contact form\u0027s new \u0022complaint\u0022 option, while keeping the independent right to complain to the Data Protection Commissioner. The registration number and registered address remain outstanding.",
          "What changed in 0.4: Slack was added to the list of parties that receive a notification, correcting an omission made when that channel was wired up earlier the same day; and where the information is stored is now stated exactly (Cloudflare's Eastern Europe region, single copy, no replicas) rather than as \u0022many countries\u0022. A processing register recording every processor, what each receives and the decisions still outstanding is published in the site's repository.",
          "What changed in 0.3: the cookies and analytics section now describes the first-party measurement script this site runs in the browser — which pages were opened, roughly how long each was on screen, and clicks on explicitly marked elements, with a tab-scoped label in session storage and nothing that can recognise a returning visitor — and records that the script honours the Global Privacy Control and Do Not Track signals. Three further sections were corrected to match it: what is collected no longer claims nothing is gathered as you browse, why-and-on-what-basis states the legitimate interest relied on for the measurement, and how-long-it-is-kept covers the counted views and events rather than form submissions alone.",
          "What changed in 0.2: the DNS health check at /dns was added to the tools section, including the direct questions it asks parent and authoritative nameservers; an inaccurate claim that this site used a cookieless analytics product was removed, because it does not, no analytics script runs in the browser at all, and the content-security policy would refuse one; and the third parties section now names the registries and nameservers the tools contact.",
          "The consent wording shown on the forms is versioned separately, so a record exists of the exact text each person agreed to."
        ]
      }
    ]
  },
  "legal/assessment-terms": {
    "eyebrow": "ONDUU / LEGAL",
    "title": "Assessment terms.",
    "intro": "The terms that apply when you request a human-reviewed Digital Fitness Assessment, or when a deeper piece of work is separately scoped and agreed in writing. The free tools on this site are covered by the tool limitations page.",
    "gate": "Draft for professional review. Everything on this page is settled and current; what it has not had is a lawyer's check.",
    "sections": [
      {
        "eyebrow": "STATUS",
        "title": "This is a draft.",
        "body": [
          "This page describes intent and current practice, and every point in it is now settled. What it has not had is a legal professional's review, so treat it as an accurate account of how Onduu works rather than as advice on whether that satisfies the law."
        ]
      },
      {
        "eyebrow": "WHAT THIS IS",
        "title": "A human-reviewed business diagnostic.",
        "body": [
          "An Onduu assessment combines what your team declares, what can be safely observed from public sources, and what an Onduu reviewer checks by hand. It produces a score, evidence labels, stated limitations and a small number of prioritised actions.",
          "It is a decision tool for a business owner. It is not an audit, a certification or an engineering deliverable."
        ]
      },
      {
        "eyebrow": "YOUR AUTHORITY",
        "title": "Only submit a domain you are entitled to submit.",
        "body": [
          "By submitting a domain or website you confirm that you own it or are authorised by the owner to have it assessed. If you are acting for a client, that authority must come from the client."
        ],
        "note": "The free tools on this site read only records that are already published publicly and are governed by the tool limitations page rather than these terms. They should still not be used to build a target list or to profile a business you have no relationship with."
      },
      {
        "eyebrow": "WHAT IS OBSERVED",
        "title": "Public records, read without touching your systems.",
        "items": [
          "Published DNS records, including MX, SPF, DKIM for common selectors, and DMARC",
          "Publicly reachable pages and their responses",
          "Information you provide in the request form",
          "Anything an Onduu reviewer verifies with you directly"
        ],
        "note": "No password, credential or system access is required, and none should be sent. Nothing on this site asks for one."
      },
      {
        "eyebrow": "WHAT IS NOT DONE",
        "title": "Explicitly out of scope.",
        "items": [
          "No penetration testing and no vulnerability scanning",
          "No attempt to log in, bypass a control or access private data",
          "No submission of your production forms without written permission",
          "No restoration of a backup outside an agreed safe environment",
          "No legal, regulatory or compliance certification"
        ],
        "note": "Any of these can be discussed as separate work with its own written scope and permission. None of them happens as part of a standard assessment."
      },
      {
        "eyebrow": "HOW FINDINGS ARE LABELLED",
        "title": "Every finding shows what it is based on.",
        "cards": [
          {
            "title": "Declared by customer",
            "body": "Supplied by you and not independently verified."
          },
          {
            "title": "Publicly observed",
            "body": "Read from public pages, DNS or performance sources."
          },
          {
            "title": "Manually reviewed",
            "body": "Checked by an Onduu reviewer."
          },
          {
            "title": "Directly tested",
            "body": "Observed in a test you permitted, such as an authorised enquiry trace."
          }
        ],
        "note": "These labels describe where a finding came from, not how it was analysed. Onduu's agents assist the analysis of every assessment, and that assistance is never itself an evidence basis: an agent produces no facts, it organises and interprets the facts your declarations, public observation or a permitted test supplied. \"Manually reviewed\" continues to mean a person examined the evidence."
      },
      {
        "eyebrow": "WHAT A RESULT DOES NOT PROVE",
        "title": "The limits, stated plainly.",
        "body": [
          "A clean result means the things checked looked correct at the time they were checked. It does not prove that your domain, your mailboxes, your website or your business are secure. It does not prove a backup will restore, that email will reach an inbox, or that any legal or regulatory requirement is met.",
          "Findings describe a moment in time. Records and systems change, and a result is not a continuing assurance."
        ]
      },
      {
        "eyebrow": "YOUR REPORT",
        "title": "Who sees it.",
        "body": [
          "A report prepared for you is delivered to you privately and is not published. Onduu will not name you, quote you or publish any result about your business without your written consent.",
          "The report is sent to you by email from Ujiajiri Enterprises Limited, which operates Onduu. Inside that company it is seen only by the people who need it to prepare or discuss your assessment. It is not circulated further, and it is never sent to an independent provider, to HOSTAFRICA or to anyone else without asking you first."
        ],
        "note": "Written consent means consent given against the exact words proposed, shown to you before anything appears. Silence is not consent, and agreeing to one piece of writing does not extend to another."
      },
      {
        "eyebrow": "WHAT MAY BE PUBLISHED WITHOUT ASKING",
        "title": "Patterns across many assessments. Never your assessment.",
        "body": [
          "Onduu may publish what it learns across assessments as a pattern: how many of the businesses assessed had no enforcing email policy, how often an enquiry path failed silently, which weaknesses recur. Figures of that kind describe the group, not any business in it, and they are how the guidance on this site stays grounded in what is actually found rather than in opinion.",
          "Two rules keep that safe. A published figure covers at least ten assessments, and no subdivision of it is reported for fewer than five, so no single business can be picked out of a small number. And identifying detail is left out even when the number is large: no combination of sector, town and size, no exact score, no date, no distinctive technical fingerprint."
        ],
        "note": "Anything narrower than that \u2014 your findings, your score, your story, however carefully the name is removed \u2014 is published only if you agree in writing, having seen exactly what would be said. In a market this size an \u0022anonymous\u0022 example is often recognisable to anyone who knows the sector, so the standard here is your permission rather than Onduu\u0027s judgement about whether you could be identified."
      },
      {
        "eyebrow": "RETENTION AND CORRECTIONS",
        "title": "How long it is kept, and fixing what is wrong.",
        "body": [
          "Information submitted through the request forms is kept until it is deleted; there is currently no automatic deletion schedule, as the privacy notice describes. You can ask at any time for it to be deleted, and it will be.",
          "If you believe a finding is wrong, say so and it will be re-examined. A finding based on a declaration you correct will be updated on the corrected basis."
        ]
      },
      {
        "eyebrow": "INTELLECTUAL PROPERTY",
        "title": "Who owns what.",
        "body": [
          "The report is yours to act on. It is written as a guide, and you may share it with anyone you choose to help you act on it \u2014 your own team, a developer, or an independent provider you engage. Nothing in it is confidential to Onduu in a way that would stop you fixing what it identifies.",
          "The method behind it stays Onduu\u0027s: the scoring system, the six dimensions, the evidence labels and any blank template or worksheet supplied with the report remain Onduu\u0027s intellectual property. You may use them freely for your own business, including with anyone you bring in to help. What you may not do is repackage the method itself \u2014 sell it, publish it as your own, or build a competing assessment product from it.",
          "The distinction in one line: the findings about your business are yours, the machinery that produced them is Onduu\u0027s."
        ]
      },
      {
        "eyebrow": "VERSION",
        "title": "Version and effective date.",
        "body": [
          "Draft version 0.5, prepared 16 August 2026 and completed on 20 August 2026. Every open question on this page has now been answered. It has no effective date until a legal professional has reviewed it.",
          "What changed in 0.5: ownership is settled. The report and its findings are the client\u0027s to act on and to share with whoever helps them act on it; the scoring method, the six dimensions, the evidence labels and any blank template remain Onduu\u0027s, usable by the client for their own business but not to be repackaged or resold.",
          "What changed in 0.4: a new section states exactly what Onduu may publish without asking \u2014 patterns across at least ten assessments, no subdivision below five, identifying detail left out regardless \u2014 and confirms that anything narrower needs written consent against the exact wording proposed. Report delivery and sole readership moved into the body. (Version 0.3 was prepared on 20 August but its note was written to the wrong page and lost when that page was replaced; this is the corrected record.)",
          "What changed in 0.2: a retention claim was corrected — draft 0.1 stated a fixed two-year retention period and cited the privacy notice, which actually states there is no automatic deletion schedule; the terms now match the notice and the running code. The scope was narrowed to the human-reviewed assessment and separately agreed work, with the four free tools pointed at the tool limitations page that already governs them. The DKIM wording now matches the code (common selectors)."
        ]
      }
    ]
  },
  "about": {
    "eyebrow": "ONDUU / ABOUT",
    "title": "A practical view of the whole digital system.",
    "intro": "A business website sits inside domains, hosting, email, analytics, customer journeys, suppliers, recovery processes, content decisions and, increasingly, agent workflows. Onduu exists because a website is rarely only a design problem.",
    "cta": "See how the review works",
    "ctaHref": "/solutions/digital-revenue-risk-review",
    "sections": [
      {
        "eyebrow": "WHO RUNS THIS",
        "title": "Twenty years inside the layer most businesses never see.",
        "body": [
          "Wycliffe Onduu started EACdirectory.co.ke, a .ke domain registrar, in 2005 and ran it for seventeen years until [HOSTAFRICA](https://www.hostafrica.ke) acquired it in 2022. He is now Managing Director for Kenya at HOSTAFRICA.",
          "That is two decades spent underneath Kenyan businesses rather than in front of them: registrations and renewals, DNS and mail routing, hosting migrations, outages at inconvenient hours, and the recurring discovery that a company does not control the domain its whole operation depends on.",
          "Onduu is the independent practice built from that experience. It applies the same operational view to the commercial side of a website. Whether enquiries arrive, whether anyone can prove they do, and what happens when a supplier or a person disappears."
        ]
      },
      {
        "eyebrow": "WHY THIS WORK",
        "title": "The failures are boring, and that is the problem.",
        "body": [
          "The faults that cost Kenyan businesses real money are rarely dramatic. A form that submits but reaches nobody. A backup nobody has restored. A domain in a former developer's name. Email that any stranger can send as.",
          "None of it looks urgent until the day it does. Writing here, and building the free checker on this site, both come from the same habit of looking at the unglamorous layer first."
        ],
        "note": "The domain checker was pointed at onduu.ke before it was pointed at anyone else, and it found a fault. That article is published on this site."
      },
      {
        "eyebrow": "OPERATING PRINCIPLES",
        "title": "How the work is done.",
        "items": [
          "Evidence before confidence. Label what was declared, observed, reviewed and tested.",
          "Business consequence before technical theatre. Explain why the issue matters.",
          "Client control before dependency. Leave ownership and handover clearer than they were.",
          "One priority before ten activities. Focus effort where it changes the outcome.",
          "Human judgement before autonomous action. Use agents within explicit boundaries.",
          "Kenyan context without false localisation claims. Map the full data and supplier journey."
        ]
      },
      {
        "eyebrow": "DISCLOSURE",
        "title": "The relationship you should know about.",
        "body": [
          "Wycliffe is Managing Director for Kenya at HOSTAFRICA, a hosting and infrastructure provider. Infrastructure products referenced on this site are supplied and supported by HOSTAFRICA, not by Onduu.",
          "It is stated here so that any recommendation touching hosting or infrastructure can be judged with that in mind. Onduu's website and digital-performance work is contracted separately and independently."
        ],
        "note": "The full position, including how referrals are handled, is set out on the Commercial Relationships page."
      }
    ]
  }
};
