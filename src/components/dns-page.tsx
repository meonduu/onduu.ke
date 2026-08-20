import type { ReactNode } from "react";
import { Link } from "./nav-link";
import { Header, Footer } from "./components";

// Title and description live in src/pages/dns.astro. children is the
// hydrated DnsForm island.
export function DnsPage({ children }: { children?: ReactNode }) {
  return (
    <>
      <Header />
      <main id="main">
        <section className="page-hero page-hero--tool">
          <div>
            <p className="eyebrow">ONDUU / FREE TOOL</p>
            <h1>Is your domain actually wired up correctly?</h1>
            <p className="lede">
              This reads the public DNS and registry records that decide whether your website
              and email work reliably.
            </p>
          </div>
        </section>

        <section className="check-section">
          {children}
        </section>

        <section className="content-section">
          <div>
            <p className="section-number">01 / WHAT THIS READS</p>
            <h2>Public records, compared against each other.</h2>
          </div>
          <div className="section-body">
            <p>
              DNS answers anyone can query, and the registry record anyone can read. What makes
              the check useful is the comparison: the nameservers the registry has on file against
              the ones actually answering. The domain checked and the result are kept; nothing about you is.
            </p>
            <ul>
              <li>Nameservers: how many answer, and whether one provider carries everything</li>
              <li>Delegation: registry record and live answers, compared</li>
              <li>SOA: the zone&rsquo;s own housekeeping record, present and sensible</li>
              <li>Addresses: the bare domain and www both reaching a server</li>
              <li>Mail routing: whether MX records exist (depth lives in the email check)</li>
              <li>DNSSEC: adopted, absent, or broken mid-move</li>
            </ul>
            <div className="note">
              One vantage point, resolved recursively. This is not a propagation checker, DNSSEC is
              detected rather than validated, and a coherent result is not proof the domain or the
              business behind it is secure. Deeper testing of authoritative servers requires the
              owner&rsquo;s written permission and is out of scope here.
            </div>
          </div>
        </section>

        <section className="content-section">
          <div>
            <p className="section-number">02 / WHY IT MATTERS</p>
            <h2>DNS failures do not look like DNS failures.</h2>
          </div>
          <div className="section-body">
            <p>
              They look like a website that works in the office but not for a customer, email that
              vanishes after a hosting move, or a domain that quietly stops resolving abroad. The
              causes (a stale delegation, a single overloaded nameserver, DNSSEC left behind in a
              migration) are visible in public records long before they cost an enquiry. That is
              what this check reads.
            </p>
            <p>
              Related checks:{" "}
              <Link href="/email-security">can a stranger send email as your business?</Link> and{" "}
              <Link href="/scan">the instant fitness scan</Link> for the wider picture.
            </p>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
