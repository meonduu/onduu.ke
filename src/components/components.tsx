import { Link } from "./nav-link";
import type { ReactNode } from "react";

// Primary navigation follows brief section 7.
export function Header(){return <header className="site-header"><Link className="wordmark" href="/">ONDUU<span>.</span></Link><nav aria-label="Primary navigation"><Link href="/how-it-works">How it works</Link><Link href="/solutions">Solutions</Link><Link href="/managed-website-operations">Managed operations</Link><Link href="/insights">Insights</Link><Link href="/about">About</Link></nav><Link className="button button-small" href="/readiness">Get your readiness score</Link></header>}

export function Footer(){return <footer><div className="footer-brand"><Link className="wordmark" href="/">ONDUU<span>.</span></Link><p>Onduu helps established Kenyan businesses make their websites clearer, measurable, resilient and ready for carefully controlled improvement.</p></div><div><b>Start</b><Link href="/readiness">Digital Readiness Score</Link><Link href="/how-it-works">How It Works</Link><Link href="/contact">Contact</Link></div><div><b>Solutions</b><Link href="/solutions/digital-revenue-risk-review">Revenue & Risk Review</Link><Link href="/solutions/website-revenue-system">Website Revenue System</Link><Link href="/managed-website-operations">Managed Operations</Link><Link href="/solutions/agent-workflow-pilot">Agent Workflow Pilot</Link></div><div><b>Explore</b><Link href="/infrastructure">Kenyan Infrastructure</Link><Link href="/infrastructure/buzz-agent-collaboration">Buzz & Agent Collaboration</Link><Link href="/check">Email Security Check</Link><Link href="/labs">Labs & Tools</Link><Link href="/insights">Insights</Link><Link href="/results">Results</Link></div><div><b>Company</b><Link href="/about">About</Link><Link href="/legal/commercial-relationships">Commercial Relationships</Link><Link href="/legal/privacy">Privacy</Link><Link href="/legal/assessment-terms">Assessment Terms</Link><Link href="/legal/managed-service-terms">Managed Service Terms</Link></div></footer>}

export function Button({href,children,secondary=false}:{href:string;children:ReactNode;secondary?:boolean}){return <Link className={secondary?"text-link":"button"} href={href}>{children}<span aria-hidden="true">↗</span></Link>}

export type ContentSection={eyebrow?:string;title:string;body?:string[];items?:string[];cards?:{title:string;body:string;meta?:string}[];steps?:{title:string;body:string}[];note?:string};
export type PageContent={eyebrow?:string;title:string;intro:string;cta?:string;ctaHref?:string;gate?:string;sections:ContentSection[];form?:"readiness"|"contact"};

// The submission form hydrates as an Astro island, so it is passed in as
// children from the .astro page rather than imported here; everything in this
// file renders to static HTML with no client JavaScript.
export function StandardPage({page,children}:{page:PageContent;children?:ReactNode}){return <><Header/><main><section className="page-hero"><div><p className="eyebrow">{page.eyebrow||"ONDUU / DIGITAL READINESS"}</p><h1>{page.title}</h1><p className="lede">{page.intro}</p>{page.cta&&<Button href={page.ctaHref||"/contact"}>{page.cta}</Button>}</div><aside className="hero-index"><span>Find the weakness.</span><span>Fix the priority.</span><span>Operate the system.</span><span>Measure the result.</span></aside></section>{page.gate&&<div className="gate"><b>PREVIEW / APPROVAL GATE</b><span>{page.gate}</span></div>}{page.sections.map((s,i)=><section className="content-section" key={s.title}><div><p className="section-number">{String(i+1).padStart(2,"0")} / {s.eyebrow||"DETAIL"}</p><h2>{s.title}</h2></div><div className="section-body">{s.body?.map(p=><p key={p}>{p}</p>)}{s.items&&<ul>{s.items.map(x=><li key={x}>{x}</li>)}</ul>}{s.cards&&<div className="content-cards">{s.cards.map(c=><article key={c.title}>{c.meta&&<small>{c.meta}</small>}<h3>{c.title}</h3><p>{c.body}</p></article>)}</div>}{s.steps&&<div className="steps">{s.steps.map((x,n)=><article key={x.title}><b>{String(n+1).padStart(2,"0")}</b><div><h3>{x.title}</h3><p>{x.body}</p></div></article>)}</div>}{s.note&&<div className="note">{s.note}</div>}</div></section>)}{page.form&&<FormSection type={page.form}>{children}</FormSection>}<FinalCta href={page.form==="readiness"?"#request":"/readiness"}/></main><Footer/></>}

function FormSection({type,children}:{type:"readiness"|"contact";children?:ReactNode}){
  // Field lists, copy and microcopy come from the definitive brief, sections
  // 10 and 24. children is the hydrated SubmissionForm island.
  return <section className="form-section" id="request">
    <div>
      <p className="section-number">REQUEST FORM</p>
      <h2>{type==="readiness"?"Start with the facts you know.":"Tell me the business problem."}</h2>
      {type==="readiness"
        ? <p>Initial completion time: approximately 5-8 minutes. Do not submit passwords, credentials or sensitive customer data.</p>
        : <p>Share the result the website or workflow should produce and the weakness you suspect. Onduu will review the request and recommend a score, review, system, managed programme, pilot or &quot;not yet&quot;.</p>}
    </div>
    {children}
  </section>;
}

function FinalCta({href="/readiness"}:{href?:string}){return <section className="final-cta"><p className="section-number">YOUR NEXT STEP</p><h2>Find the three digital weaknesses worth fixing first.</h2><p>Start with a structured score rather than another open-ended sales call.</p><Button href={href}>Get your digital readiness score</Button></section>}
