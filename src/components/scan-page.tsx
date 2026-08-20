import type { ReactNode } from "react";
import { Link } from "./nav-link";
import { Header, Footer } from "./components";

// Copy reviewed against CLAUDE.md claims rules: no "secure", "compliant" or
// "guaranteed"; the Public Signal Score is never called a Digital Readiness
// Score; the Verified route and the human review are stated at every turn.
// children is the hydrated ScanForm island.
export function ScanPage({ children }: { children?: ReactNode }) {
  return (
    <>
      <Header />
      <main id="main">
        <section className="page-hero page-hero--tool">
          <div>
            <p className="eyebrow">ONDUU / INSTANT PUBLIC SCAN</p>
            <h1>See what your domain shows the public.</h1>
            <p className="lede">
              Enter your domain. Onduu reads the public records (registry, DNS, email and your
              homepage) and reports what anyone on the internet can already observe, as a Public
              Signal Score with an honest coverage figure. It is a starting point, not a verdict.
            </p>
          </div>
        </section>

        <section className="check-section">{children}</section>

        <section className="content-section">
          <div>
            <p className="section-number">01 / WHAT THIS IS</p>
            <h2>A public signal, not a verdict.</h2>
          </div>
          <div className="section-body">
            <p>
              The scan looks only at information that is already public. It reports two numbers: a
              Public Signal Score, from the signals it could observe, and Evidence Coverage, how
              much of the full readiness picture those signals actually represent. A high score at
              low coverage means the visible parts look good, not that the business is ready.
            </p>
            <p>
              Anything that cannot be seen from outside (your backups, your accounts, whether an
              enquiry is answered) is marked as not publicly observable. It never counts for or
              against the score.
            </p>
            <div className="note">
              A Public Signal Score is not a Digital Readiness Score, and this is not a security
              test, a compliance check or a penetration test. It cannot tell you that a domain, a
              mailbox or a business is secure or compliant. If you operate a domain and do not want
              it scanned, email me@onduu.ke and it will be removed and blocked from future scans.
            </div>
          </div>
        </section>

        <section className="content-section">
          <div>
            <p className="section-number">02 / WHAT COMES NEXT</p>
            <h2>The Verified assessment fills the gaps.</h2>
          </div>
          <div className="section-body">
            <p>
              A Verified Digital Readiness Score requires evidence you provide, a human review and
              tests that are separately agreed with you. That is where the &quot;not publicly
              observable&quot; items are examined properly.
            </p>
            <p>
              The email records are one layer of the scan. For those alone, in more depth, use the{" "}
              <Link href="/email-security">free email security check</Link>.
            </p>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
