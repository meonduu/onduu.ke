import { Link } from "./nav-link";
import type { ReactNode } from "react";

// Study A (Dial) + Study D (Letterhead), the pairing recommended in
// logos/README.md. The dial is inline SVG so it costs no request and can
// recolour per ground; the name stays real text, so it is selectable,
// searchable and independent of any font file.
function Wordmark(){return <Link className="wordmark" href="/"><svg className="wordmark-dial" viewBox="0 0 96 96" width="26" height="26" aria-hidden="true" focusable="false"><circle className="track" cx="48" cy="48" r="34" fill="none" strokeWidth="16"/><circle className="arc" cx="48" cy="48" r="34" fill="none" strokeWidth="16" strokeLinecap="round" strokeDasharray="132.4 81.2" transform="rotate(-90 48 48)"/></svg>ONDUU<i aria-hidden="true"/></Link>}

// Primary navigation per the current strategy (docs/strategy/, 18 Aug 2026):
// Fitness · How It Works · Paths · Guides · About, with the single primary
// CTA "Check Your Digital Fitness".
export function Header(){
  const links=[["/paths","Paths"],["/guides","Guides"],["/dns","DNS Checker"],["/email-security","Email Security"],["/kedomains","Domain Search"]] as const;
  // Below 1000px the inline nav is hidden; the same links live in a native
  // <details> disclosure, which is keyboard-accessible with no client
  // JavaScript — content pages must stay JS-free.
  return <header className="site-header"><Wordmark/><nav aria-label="Primary navigation">{links.map(([href,label])=><Link key={href} href={href}>{label}</Link>)}</nav><details className="mobile-nav"><summary>Menu</summary><nav aria-label="Primary navigation">{links.map(([href,label])=><Link key={href} href={href}>{label}</Link>)}</nav></details><Link className="button button-small" href="/digital-fitness" data-analytics-event="conversion" data-analytics-label="fitness-cta-header">Check Your Digital Fitness</Link></header>;
}

export function Footer(){return <footer><div className="footer-brand"><Wordmark/><p>Practical Digital Fitness guidance for better website and infrastructure decisions.</p><p className="footer-disclosure">Onduu is operated by Ujiajiri Enterprises Limited. Ujiajiri arranges consent-based introductions to independent providers who contract with clients directly.</p></div><div><b>Start</b><Link href="/digital-fitness">Digital Fitness</Link><Link href="/about">About</Link><Link href="/contact">Contact</Link></div><div><b>Choose a Path</b><Link href="/how-it-works">How It Works</Link><Link href="/paths/website-and-digital-marketing">Ujiajiri Introductions</Link><Link href="/paths/hostafrica-infrastructure">HOSTAFRICA Infrastructure</Link></div><div><b>Learn</b><Link href="/guides">Guides</Link><Link href="/insights">Insights</Link><Link href="/guides/website-revenue-system">Website Revenue System</Link><Link href="/email-security">Email Security Check</Link><Link href="/dns">DNS Checker</Link><Link href="/kedomains">Domain Search</Link><Link href="/scan">Fitness Scan</Link></div><div><b>Legal</b><Link href="/legal/commercial-relationships">Commercial Relationships</Link><Link href="/legal/privacy">Privacy</Link><Link href="/legal/assessment-terms">Assessment Terms</Link><Link href="/legal/tool-limitations">Tool Limitations</Link></div></footer>}

// `event`/`label` opt an element into the engagement tracker. Nothing is
// counted unless it is marked here deliberately — the tracker fires only on
// elements carrying data-analytics-event, and the label charset is
// allowlisted server-side (worker/events.ts).
export function Button({href,children,secondary=false,event,label}:{href:string;children:ReactNode;secondary?:boolean;event?:string;label?:string}){return <Link className={secondary?"text-link":"button"} href={href} data-analytics-event={event} data-analytics-label={label}>{children}<span aria-hidden="true">↗</span></Link>}

export type ContentSection={eyebrow?:string;title:string;body?:string[];items?:string[];cards?:{title:string;body:string;meta?:string;href?:string}[];steps?:{title:string;body:string}[];note?:string;links?:{label:string;href:string;external?:boolean}[]};
export type PageContent={eyebrow?:string;title:string;intro:string;cta?:string;ctaHref?:string;gate?:string;sections:ContentSection[];form?:"fitness"|"contact"};

// Anchor id for a section, derived from its eyebrow so a reader can link to
// one clause directly (/legal/privacy#who-is-responsible) rather than to the
// top of a 21,000px page. Falls back to the index when an eyebrow is absent,
// and de-duplicates so two sections can never claim the same anchor.
function sectionIds(sections:ContentSection[]){
  const seen=new Set<string>();
  return sections.map((s,i)=>{
    const base=(s.eyebrow||s.title||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,48);
    let id=base||`section-${i+1}`;
    if(seen.has(id)) id=`${id}-${i+1}`;
    seen.add(id);
    return id;
  });
}

// The submission form hydrates as an Astro island, so it is passed in as
// children from the .astro page rather than imported here; everything in this
// file renders to static HTML with no client JavaScript.
export function StandardPage({page,children}:{page:PageContent;children?:ReactNode}){
  const ids=sectionIds(page.sections);
  // A contents list earns its place only where the page is long enough to
  // get lost in: the privacy notice runs fourteen sections and about 26
  // phone screens. Threshold rather than a per-page flag, so a page that
  // grows past it gets one without anybody remembering to ask.
  const showContents=page.sections.length>=8;
  return <><Header/><main id="main"><section className="page-hero"><div><p className="eyebrow">{page.eyebrow||"ONDUU / DIGITAL FITNESS"}</p><h1>{page.title}</h1><p className="lede">{page.intro}</p>{page.cta&&<Button href={page.ctaHref||"/contact"} event="conversion" label="fitness-cta-hero">{page.cta}</Button>}</div><aside className="hero-index"><span>Assess.</span><span>Prioritise.</span><span>Choose a path.</span><span>Verify.</span></aside></section>{page.gate&&<div className="gate"><b>PREVIEW / APPROVAL GATE</b><span>{page.gate}</span></div>}{showContents&&<nav className="jump-list" aria-label="Sections on this page"><b>On this page</b><ol>{page.sections.map((s,i)=><li key={s.title}><a href={`#${ids[i]}`}>{s.eyebrow||s.title}</a></li>)}</ol></nav>}{page.sections.map((s,i)=><section className="content-section" id={ids[i]} key={s.title}><div><p className="section-number">{String(i+1).padStart(2,"0")} / {s.eyebrow||"DETAIL"}</p><h2>{s.title}</h2></div><div className="section-body">{s.body?.map(p=><p key={p}>{p}</p>)}{s.items&&<ul>{s.items.map(x=><li key={x}>{x}</li>)}</ul>}{s.cards&&<div className="content-cards">{s.cards.map(c=>
  // A card with href links from its heading; CSS stretches that link over the
  // whole card, so the card is clickable while the accessible name stays the
  // guide title rather than the whole card's text.
  <article className={c.href?"card-linked":undefined} key={c.title}>{c.meta&&<small>{c.meta}</small>}<h3>{c.href?<Link href={c.href}>{c.title}</Link>:c.title}</h3><p>{c.body}</p></article>)}</div>}{s.steps&&<div className="steps">{s.steps.map((x,n)=><article key={x.title}><b>{String(n+1).padStart(2,"0")}</b><div><h3>{x.title}</h3><p>{x.body}</p></div></article>)}</div>}{s.links&&<div className="actions">{s.links.map(l=>l.external
  ?<a key={l.href} className="button" href={l.href} target="_blank" rel="noopener noreferrer">{l.label}<span aria-hidden="true">↗</span></a>
  :<Link key={l.href} className="button" href={l.href}>{l.label}<span aria-hidden="true">↗</span></Link>)}</div>}{s.note&&<div className="note">{s.note}</div>}</div></section>)}{page.form&&<FormSection type={page.form}>{children}</FormSection>}</main><Footer/></>}

function FormSection({type,children}:{type:"fitness"|"contact";children?:ReactNode}){
  // Field lists, copy and microcopy come from the definitive brief, sections
  // 10 and 24. children is the hydrated SubmissionForm island.
  return <section className="form-section" id="request">
    <div>
      <p className="section-number">REQUEST FORM</p>
      <h2>{type==="fitness"?"Start with the facts you know.":"Tell me the business problem."}</h2>
      {type==="fitness"
        ? <p>Initial completion time: approximately 5-8 minutes. Do not submit passwords, credentials or sensitive customer data.</p>
        : <p>Share the result the website or workflow should produce and the weakness you suspect. Onduu will review the request and recommend the fitness assessment, a guide, an independent partner route, the official infrastructure route or &quot;not yet&quot;.</p>}
    </div>
    {children}
  </section>;
}
