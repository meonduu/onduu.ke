import type { ReactNode } from "react";
import { Link } from "./nav-link";
import { Header, Footer } from "./components";

// Domain search page. Education-first (the Control dimension: own both
// halves of your brand), with registration routed to HOSTAFRICA under the
// approved UTM-only destination. children is the hydrated DomainsForm island.
export function DomainsPage({ children }: { children?: ReactNode }) {
  return (
    <>
      <Header />
      <main id="main">
        <section className="page-hero page-hero--tool">
          <div>
            <p className="eyebrow">ONDUU / FREE TOOL</p>
            <h1>Is your business name protected in .ke too?</h1>
            <p className="lede">
              Owning one without the other leaves the door open to cybersquatting.
            </p>
          </div>
        </section>

        <section className="check-section">{children}</section>

        <section className="content-section">
          <div>
            <p className="section-number">01 / WHY BOTH</p>
            <h2>Two doors to one brand.</h2>
          </div>
          <div className="section-body">
            <p>
              Kenyan businesses usually register one of the pair and forget the other. Anyone can
              register the twin, for a competing business, a copycat, or worse, an email domain
              that looks like yours to your own customers. Registering both is one of the cheapest
              pieces of brand protection available.
            </p>
            <ul>
              <li>A taken domain shows its registrar: where the renewal relationship lives</li>
              <li>An expiry date inside 60 days is a renewal risk worth acting on today</li>
            </ul>
            <div className="note">
              &quot;Appears available&quot; is a public observation from DNS and the registry, not a
              reservation. Availability and price are confirmed at the registrar&apos;s checkout.
              The name searched and what was found are kept; nothing about you is.
            </div>
          </div>
        </section>

        <section className="content-section">
          <div>
            <p className="section-number">02 / WHO DOES WHAT</p>
            <h2>Registration happens at HOSTAFRICA.</h2>
          </div>
          <div className="section-body">
            <p>
              If a name is available, registration, billing, renewal and support happen at
              HOSTAFRICA through its official panel, not on this site. Wycliffe, who operates
              Onduu, is also Managing Director of HOSTAFRICA Kenya. Onduu receives no commission on
              registrations. The outbound link carries HOSTAFRICA affiliate identifier 916 and
              campaign tags, used to attribute routed demand rather than to earn on it, and clicks
              are counted here in aggregate only.
            </p>
            <p>
              Already own the domain? The next question is whether its records protect you. {" "}
              <Link href="/email-security">Run the free email security check</Link>.
            </p>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
