import type { ReactNode } from "react";
import { Link } from "./nav-link";
import { Header, Footer, Button } from "./components";

// Title and description now live in src/pages/check.astro. children is the
// hydrated CheckForm island.
export function CheckPage({ children }: { children?: ReactNode }) {
  return (
    <>
      <Header />
      <main id="main">
        <section className="page-hero page-hero--tool">
          <div>
            <p className="eyebrow">ONDUU / FREE TOOL</p>
            <h1>Can someone send email pretending to be you?</h1>
            <p className="lede">
              Enter your domain. This reads the public records that decide whether a stranger can
              email your customers using your domain.
            </p>
          </div>
        </section>

        <section className="check-section">
          {children}
        </section>

        <section className="content-section">
          <div>
            <p className="section-number">01 / WHAT THIS READS</p>
            <h2>Published records only.</h2>
          </div>
          <div className="section-body">
            <p>
              Every record checked here is already public. Anyone can look them up, including the
              people who would spoof your domain. The domain checked and the result are kept; nothing about you is.
            </p>
            <ul>
              <li>SPF: which servers are allowed to send mail as your domain</li>
              <li>DKIM: whether your mail is signed, so tampering is detectable</li>
              <li>DMARC: what receiving servers should do with forged mail, and who gets reports</li>
              <li>MX: where your mail is delivered, and which provider runs it</li>
            </ul>
            <div className="note">
              A clean result means these four records are published correctly. It does not prove
              your domain, your mailboxes or your business are secure, and it is not a penetration
              test or a compliance certificate.
            </div>
          </div>
        </section>

        <section className="content-section">
          <div>
            <p className="section-number">02 / WHY IT MATTERS</p>
            <h2>The records are the defence.</h2>
          </div>
          <div className="section-body">
            <p>
              Over 100 Kenyan parastatal chief executives face disciplinary action over exactly
              these records. The full story, and what the checker found when it was first pointed
              at this domain, is in the article.
            </p>
            <p>
              <Link href="/insights/what-checking-domains-taught-me-about-email-security">
                Over 100 parastatal CEOs face action on email security. Check yours.
              </Link>
            </p>
          </div>
        </section>

        <section className="final-cta">
          <p className="section-number">YOUR NEXT STEP</p>
          <h2>The email records are one layer. Readiness covers the rest.</h2>
          <p>Identify the priorities, understand the responsibility and continue through the right route.</p>
          <Button href="/readiness">Check Your Digital Readiness</Button>
        </section>
      </main>
      <Footer />
    </>
  );
}
