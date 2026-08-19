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
  "readiness": {
    "eyebrow": "THE ONDUU DIGITAL READINESS SCORE",
    "title": "See what your website is costing, risking or leaving unproven.",
    "intro": "The Digital Readiness Score is a human-reviewed business diagnostic. It combines what your team declares, what can be safely observed from the public internet and what Onduu manually verifies. You receive six dimension scores, evidence labels, limitations and the three actions worth addressing first.",
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
    "intro": "Who Onduu is, what it contracts for independently, which relationships could create a conflict, and how referrals are handled.",
    "gate": "Draft for professional review. The employment and supplier boundaries below require the owner's written confirmation before publication.",
    "sections": [
      {
        "eyebrow": "STATUS",
        "title": "This is a draft.",
        "body": [
          "This page describes intent and current practice. It has not been reviewed by a legal professional, and items marked TO CONFIRM need the owner's input before anything here can be relied on."
        ]
      },
      {
        "eyebrow": "01 / WHO ONDUU IS",
        "title": "The entity behind the brand.",
        "body": [
          "Onduu is the brand used for the website, conversion, measurement and digital-performance work offered to businesses in Kenya. The contracting legal entity is Ujiajiri Enterprises Limited.",
          "Any agreement, invoice or engagement is with Ujiajiri Enterprises Limited trading as Onduu.",
          "Ujiajiri Enterprises Limited also operates ujiajiri.ke, a practical-skills platform and a private introduction service for independent website and digital-marketing providers. There is no public provider directory: a business asks Ujiajiri for an introduction, Ujiajiri proposes one provider from its private network and names it, and nothing identifiable is sent to that provider until the business gives permission. The provider is an independent business that scopes, quotes, contracts, invoices and delivers directly, and neither Ujiajiri nor Onduu delivers, manages or guarantees its work. Links from this site to ujiajiri.ke are plain links. Nothing you submit to Onduu is passed to Ujiajiri.",
          "TO CONFIRM: company registration number and registered address."
        ]
      },
      {
        "eyebrow": "02 / THE RELATIONSHIP TO DISCLOSE",
        "title": "The relationship a client should know about.",
        "body": [
          "Wycliffe Onduu is Managing Director for Kenya at HOSTAFRICA, a hosting and infrastructure provider. HOSTAFRICA acquired EACdirectory.co.ke, the .ke domain registrar he founded and ran from 2005, in 2022.",
          "Infrastructure products referenced on this website are supplied and supported by HOSTAFRICA, not by Onduu.",
          "This is disclosed because a client considering both website work and infrastructure should know that the same person has a position on both sides, and can then weigh the advice accordingly."
        ],
        "note": "TO CONFIRM: whether Wycliffe is a statutory director of the Kenyan company, which carries duties beyond the job title. No claim either way is made here until that is settled."
      },
      {
        "eyebrow": "03 / WHAT ONDUU CONTRACTS FOR",
        "title": "What is bought from Onduu, and what is not.",
        "cards": [
          {
            "title": "Contracted with Onduu",
            "body": "The human-reviewed Digital Readiness assessment, and the free tools on this site, which are offered as-is. Any deeper piece of work exists only if it has been separately scoped and agreed with you in writing; nothing on this website sells one."
          },
          {
            "title": "Not contracted with Onduu",
            "body": "Website and digital-marketing implementation, which independent providers contract and deliver directly following a Ujiajiri introduction. Hosting, virtual servers, domains and infrastructure support, which are supplied under a separate agreement with the infrastructure provider, on their terms and their pricing."
          }
        ],
        "note": "Onduu does not act as prime contractor for implementation work, does not manage another provider's delivery and does not guarantee it. TO CONFIRM: whether any Onduu service is excluded from this list under an employment or non-compete boundary."
      },
      {
        "eyebrow": "04 / HOW REFERRALS WORK",
        "title": "Nothing is passed on automatically.",
        "body": [
          "This website does not send your enquiry anywhere. There is no automatic routing, no lead-sharing integration and no mechanism on this site that forwards what you submit to an infrastructure supplier, an implementation provider or anyone else. Every route off this site is a plain link you choose to follow.",
          "Infrastructure: Onduu receives no commission, fee or revenue share if you choose HOSTAFRICA or any other supplier. The outbound link carries attribution tags so routed demand can be counted, and nothing more. If an infrastructure conversation would genuinely help you, it will be raised with you first and you decide whether to have it.",
          "Implementation: this is the one place money can flow back. If you ask Ujiajiri for an introduction and go on to contract and pay the provider it proposes, Ujiajiri may receive a referral fee from that provider under a separate agreement. Ujiajiri Enterprises Limited is the same company that operates Onduu, so treat the interest as Onduu's own. You are told the fee may exist before you approve an introduction, the provider must tell you whether the arrangement affects the price it quotes you, and you are free to decline the proposed provider or use someone else entirely."
        ],
        "note": "The fee's existence is disclosed; its amount is not published here, because it is set in the partner agreement rather than on this website. Ask the provider what it means for your quote. If any of this changes, this page changes in the same release. A disclosure page that lags behind the arrangement it describes is worse than no page at all."
      },
      {
        "eyebrow": "05 / HOW CONFLICTS ARE HANDLED",
        "title": "The working rule.",
        "items": [
          "A recommendation should be traceable to evidence about your business, not to who supplies the product",
          "Where a recommendation touches infrastructure, the relationship above is restated at that point, not buried here",
          "You are free to take any recommendation to a different supplier, and doing so does not affect the rest of the work"
        ],
        "note": "TO CONFIRM: whether an internal conflicts policy exists that should be summarised or linked here."
      },
      {
        "eyebrow": "06 / QUESTIONS",
        "title": "Ask directly.",
        "body": [
          "If anything about these relationships is unclear, or you want it stated in writing before engaging, email me@onduu.ke and ask."
        ]
      },
      {
        "eyebrow": "07 / VERSION",
        "title": "Version and effective date.",
        "body": [
          "Draft version 0.2, prepared 16 August 2026 and re-checked against the live site on 19 August 2026. No effective date until reviewed and the TO CONFIRM items are answered.",
          "What changed in 0.2: Ujiajiri is described as a private introduction service rather than a provider listing; the referral fee Ujiajiri may receive from an introduced provider is disclosed, including that Ujiajiri and Onduu are the same company; and the list of what Onduu contracts for was corrected to match what this site actually offers."
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
          "The data controller is Ujiajiri Enterprises Limited, which trades as Onduu and operates this website. Onduu is the brand; Ujiajiri Enterprises Limited is the contracting entity.",
          "TO CONFIRM: company registration number and registered postal address, so the entity can be identified and checked."
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
          "A reference number generated for your request",
          "How you arrived: the site that referred you, the page you landed on, and any campaign parameters in the link you followed"
        ],
        "note": "The forms ask you not to submit passwords, credentials or sensitive customer data, and you should not do so. Nothing on this site needs them. The arrival details above are recorded so it is possible to tell which article or link actually produced an enquiry; they are held with the enquiry and describe the visit, not you. Page-view records are separate from enquiries and hold nothing that identifies you."
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
          },
          {
            "title": "To know which content works",
            "body": "Where you came from is stored with your enquiry so it is possible to tell which article or link produced it. This is kept in first-party records rather than sent to an analytics company. The basis is a legitimate interest in knowing which work is worth continuing."
          }
        ]
      },
      {
        "eyebrow": "04 / THE DOMAIN TOOLS",
        "title": "What the domain tools read, and what they keep.",
        "body": [
          "The email security checker at /email-security sends the domain name to Cloudflare's public DNS resolver so its published SPF, DKIM, DMARC and MX records can be read. Those records are already public. Since 18 August 2026 the domain checked and the result are stored, so Onduu can see which checks are being run and which failures are common. No account or email address is required, and nothing about you is recorded with the result. A stored row says a domain was checked at a time, never who checked it.",
          "The Instant Public Readiness Scan at /scan reads more public information about a domain (its registry record, DNS, published email records, and the homepage, robots.txt and sitemap that any visitor can request) and returns a Public Signal Score. Unlike the checker, a scan result is stored: the domain scanned, the public observations behind each signal, the score and a reference number. This is what lets a repeat scan of the same domain return the recent result for a day rather than re-reading someone else's site, and it is what a score is recomputed from if a result is ever questioned.",
          "A scan result is about a domain, not about you. No name, email address or account is required or attached to it. The domain you enter need not be your own, because everything the scan reads is already public. To limit abuse, the scan uses the same one-way hashed connection address as the forms, held only for a short hourly counter and never stored with the result.",
          "The DNS health check at /dns reads a domain's public DNS and registry records to report whether its nameservers, delegation, addresses, mail routing and DNSSEC are coherent. Alongside the resolver lookups it asks two kinds of server a standard question directly, over the ordinary DNS port: one nameserver of the parent zone (for the delegation and glue records the parent publishes) and each of the domain's own nameservers (for the zone serial each is serving). These are read-only questions, the same ones every resolver on the internet sends, and no part of them concerns you: the servers see a request from Onduu's infrastructure, never anything about the visitor who asked. The domain checked and a summary of the outcome are stored, with no visitor identity attached, on the same basis and with the same deletion route as the tools above.",
          "The domain search at /kedomains checks whether a name is registered across the Kenyan extensions using public DNS and registry records, and shows a taken domain's registrar, transfer lock and expiry. Since 18 August 2026 the name searched and what was found are stored, on the same basis and with the same limit as the checker above: no account, and no identifier that could connect a search to you. If an available name leads you to register it, that happens at HOSTAFRICA's own site. The outbound link carries attribution tags so Onduu can see, in aggregate, that traffic came from this tool, and Onduu counts the click as a number with no identity attached. Onduu receives no commission on registrations."
        ],
        "note": "The basis for storing tool results is a legitimate interest in operating the tools, caching results so they do not repeatedly fetch third-party sites, seeing which checks are run and which failures are common, and being able to reproduce a score. A Public Signal Score describes public observations at a moment in time; it is not a Digital Readiness Score, and not proof that a domain, a mailbox or a business is secure. Results are kept until deleted rather than on a fixed schedule. If you operate a domain and want it left alone, email me@onduu.ke: every stored record of it is deleted (scan results and any stored email or domain lookups), the domain is added to a do-not-scan list so it is not scanned again, and future lookups of it are not recorded. The lookups themselves keep working, because they read only the public records any WHOIS tool can read."
      },
      {
        "eyebrow": "05 / COOKIES AND ANALYTICS",
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
        "eyebrow": "06 / WHO ELSE PROCESSES IT",
        "title": "The other parties involved.",
        "cards": [
          {
            "title": "Cloudflare",
            "body": "Hosts this website, stores form submissions and stored tool results in its database service, provides the spam check on the forms, and resolves the DNS lookups the domain tools rely on."
          },
          {
            "title": "ZeptoMail",
            "body": "Sends the notification that tells Onduu a request has arrived. That message contains only the reference number and which form was used, none of your answers, and not your name or email address."
          }
        ],
        "note": "No artificial-intelligence or language-model provider receives your form submissions, and no analytics company receives anything at all. No information from these forms is sold, and none is passed to an infrastructure supplier, an implementation provider or any other third party without asking you first. Two further parties are contacted by the domain tools but receive nothing about you: the registries that answer RDAP lookups, and the nameservers the DNS check questions directly. Both see a request from Onduu's infrastructure carrying only the domain being checked."
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
        "title": "Kept until deleted.",
        "body": [
          "There is no automatic deletion schedule. Submissions stay in the database until they are deleted by hand, and no fixed retention period is currently set.",
          "You can ask at any time for information about you to be deleted, and it will be. That is the practical control available to you, and it is honoured on request rather than on a timer."
        ],
        "note": "TO CONFIRM: whether a retention limit should be introduced later. Holding personal data indefinitely is a weaker position under the Data Protection Act than deleting it on a defined schedule."
      },
      {
        "eyebrow": "09 / SECURITY",
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
        "note": "No response time is published, because no operating commitment has been made. Requests are handled directly by Wycliffe."
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
          "Draft version 0.3, prepared 19 August 2026 and checked against the running code the same day. It has no effective date until it has been reviewed and the TO CONFIRM items have been answered.",
          "What changed in 0.3: the cookies and analytics section now describes the first-party measurement script this site runs in the browser — which pages were opened, roughly how long each was on screen, and clicks on explicitly marked elements, with a tab-scoped label in session storage and nothing that can recognise a returning visitor — and records that the script honours the Global Privacy Control and Do Not Track signals.",
          "What changed in 0.2: the DNS health check at /dns was added to the tools section, including the direct questions it asks parent and authoritative nameservers; an inaccurate claim that this site used a cookieless analytics product was removed, because it does not, no analytics script runs in the browser at all, and the content-security policy would refuse one; and the third parties section now names the registries and nameservers the tools contact.",
          "The consent wording shown on the forms is versioned separately, so a record exists of the exact text each person agreed to."
        ]
      }
    ]
  },
  "legal/assessment-terms": {
    "eyebrow": "ONDUU / LEGAL",
    "title": "Assessment terms.",
    "intro": "The terms that apply when you request a human-reviewed Digital Readiness assessment, or when a deeper piece of work is separately scoped and agreed in writing. The free tools on this site are covered by the tool limitations page.",
    "gate": "Draft for professional review. Items marked TO CONFIRM need the owner's input before this can be relied on.",
    "sections": [
      {
        "eyebrow": "STATUS",
        "title": "This is a draft.",
        "body": [
          "This page describes intent and current practice. It has not been reviewed by a legal professional, and items marked TO CONFIRM need the owner's input before anything here can be relied on."
        ]
      },
      {
        "eyebrow": "01 / WHAT THIS IS",
        "title": "A human-reviewed business diagnostic.",
        "body": [
          "An Onduu assessment combines what your team declares, what can be safely observed from public sources, and what an Onduu reviewer checks by hand. It produces a score, evidence labels, stated limitations and a small number of prioritised actions.",
          "It is a decision tool for a business owner. It is not an audit, a certification or an engineering deliverable."
        ]
      },
      {
        "eyebrow": "02 / YOUR AUTHORITY",
        "title": "Only submit a domain you are entitled to submit.",
        "body": [
          "By submitting a domain or website you confirm that you own it or are authorised by the owner to have it assessed. If you are acting for a client, that authority must come from the client."
        ],
        "note": "The free tools on this site read only records that are already published publicly and are governed by the tool limitations page rather than these terms. They should still not be used to build a target list or to profile a business you have no relationship with."
      },
      {
        "eyebrow": "03 / WHAT IS OBSERVED",
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
        "eyebrow": "04 / WHAT IS NOT DONE",
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
        "eyebrow": "05 / HOW FINDINGS ARE LABELLED",
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
        ]
      },
      {
        "eyebrow": "06 / WHAT A RESULT DOES NOT PROVE",
        "title": "The limits, stated plainly.",
        "body": [
          "A clean result means the things checked looked correct at the time they were checked. It does not prove that your domain, your mailboxes, your website or your business are secure. It does not prove a backup will restore, that email will reach an inbox, or that any legal or regulatory requirement is met.",
          "Findings describe a moment in time. Records and systems change, and a result is not a continuing assurance."
        ]
      },
      {
        "eyebrow": "07 / YOUR REPORT",
        "title": "Who sees it.",
        "body": [
          "A report prepared for you is delivered to you privately and is not published. Onduu will not name you, quote you or publish any result about your business without your written consent."
        ],
        "note": "TO CONFIRM: how reports are delivered and stored, who inside Onduu can access them, and whether an anonymised finding may ever be used as an example."
      },
      {
        "eyebrow": "08 / RETENTION AND CORRECTIONS",
        "title": "How long it is kept, and fixing what is wrong.",
        "body": [
          "Information submitted through the request forms is kept until it is deleted; there is currently no automatic deletion schedule, as the privacy notice describes. You can ask at any time for it to be deleted, and it will be.",
          "If you believe a finding is wrong, say so and it will be re-examined. A finding based on a declaration you correct will be updated on the corrected basis."
        ]
      },
      {
        "eyebrow": "09 / INTELLECTUAL PROPERTY",
        "title": "Who owns what.",
        "body": [
          "TO CONFIRM: whether the report, the scoring method and any template supplied remain Onduu's intellectual property, what licence the client receives to use the report internally, and what the client owns outright."
        ]
      },
      {
        "eyebrow": "10 / VERSION",
        "title": "Version and effective date.",
        "body": [
          "Draft version 0.2, prepared 16 August 2026 and re-checked against the live site on 19 August 2026. No effective date until reviewed and the TO CONFIRM items are answered.",
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
        "eyebrow": "01 / WHO RUNS THIS",
        "title": "Twenty years inside the layer most businesses never see.",
        "body": [
          "Wycliffe Onduu started EACdirectory.co.ke, a .ke domain registrar, in 2005 and ran it for seventeen years until HOSTAFRICA acquired it in 2022. He is now Managing Director for Kenya at HOSTAFRICA.",
          "That is two decades spent underneath Kenyan businesses rather than in front of them: registrations and renewals, DNS and mail routing, hosting migrations, outages at inconvenient hours, and the recurring discovery that a company does not control the domain its whole operation depends on.",
          "Onduu is the independent practice built from that experience. It applies the same operational view to the commercial side of a website. Whether enquiries arrive, whether anyone can prove they do, and what happens when a supplier or a person disappears."
        ]
      },
      {
        "eyebrow": "02 / WHY THIS WORK",
        "title": "The failures are boring, and that is the problem.",
        "body": [
          "The faults that cost Kenyan businesses real money are rarely dramatic. A form that submits but reaches nobody. A backup nobody has restored. A domain in a former developer's name. Email that any stranger can send as.",
          "None of it looks urgent until the day it does. Writing here, and building the free checker on this site, both come from the same habit of looking at the unglamorous layer first."
        ],
        "note": "The domain checker was pointed at onduu.ke before it was pointed at anyone else, and it found a fault. That article is published on this site."
      },
      {
        "eyebrow": "03 / OPERATING PRINCIPLES",
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
        "eyebrow": "04 / DISCLOSURE",
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
