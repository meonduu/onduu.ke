import type { ReactNode } from "react";
import { Header, Footer } from "./components";
import type { ConfirmLookup } from "../../worker/do-not-scan";

// Copy reviewed against CLAUDE.md: this is a data-rights route, not a
// product page, so it states what happens and asks for nothing beyond what
// the action needs. One CTA — the confirmation email. children is the
// hydrated DoNotScanForm island.
export function DoNotScanPage({ children }: { children?: ReactNode }) {
  return (
    <>
      <Header />
      <main id="main">
        <section className="page-hero page-hero--tool">
          <div>
            <p className="eyebrow">ONDUU / DO NOT SCAN</p>
            <h1>Leave my domain alone.</h1>
            <p className="lede">
              If you operate a domain and do not want Onduu&rsquo;s tools to scan it or keep records
              of it, ask here. One email to an address at the domain confirms it is yours; no other
              questions are asked.
            </p>
          </div>
        </section>

        <section className="check-section">{children}</section>

        <section className="content-section">
          <div>
            <p className="section-number">WHAT HAPPENS</p>
            <h2>On confirmation, three things.</h2>
          </div>
          <div className="section-body">
            <p>
              The domain and all its subdomains are refused by the Instant Public Fitness Scan, before
              any network request is made. Every stored record of it is deleted: scan results, and
              any stored email-security or domain-search lookup. And future lookups of it are not
              recorded.
            </p>
            <p>
              The free lookups themselves keep working, because they read only the public DNS and
              registry records any WHOIS tool can read. What you are opting out of is Onduu keeping a
              record.
            </p>
          </div>
        </section>

        <section className="content-section">
          <div>
            <p className="section-number">WHY AN EMAIL</p>
            <h2>Proof of control, not identity.</h2>
          </div>
          <div className="section-body">
            <p>
              Without a check, anyone could block a competitor&rsquo;s domain. The one check is an
              email to an address at the domain itself &mdash; you@yourbusiness.co.ke for
              yourbusiness.co.ke &mdash; because receiving mail there is something only the domain&rsquo;s
              operator can do. A link in that email confirms the request; it works once and expires in
              48 hours. Nothing changes until it is pressed.
            </p>
            <p>
              The address is kept with the request as the record of who asked. It is not used for
              anything else, and it is not added to any list. The{" "}
              <a href="/legal/privacy">privacy notice</a> describes the handling in full.
            </p>
          </div>
        </section>

        <section className="content-section">
          <div>
            <p className="section-number">SOMETHING WRONG INSTEAD</p>
            <h2>If a finding is wrong, say so.</h2>
          </div>
          <div className="section-body">
            <p>
              Opting out removes the record; it does not correct it. If a scan reported something
              about your domain that you believe is wrong, use the{" "}
              <a href="/contact">contact form</a> and it will be re-examined.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

const ROOT = "/do-not-scan";

/** The confirm page, one block per token state. Plain form, no script. */
export function DoNotScanConfirmPage({ result, token }: { result: ConfirmLookup; token: string }) {
  return (
    <>
      <Header />
      <main id="main">
        <section className="page-hero page-hero--tool">
          <div>
            <p className="eyebrow">ONDUU / DO NOT SCAN</p>
            {result.state === "ready" && (
              <>
                <h1>Confirm: leave {result.domain} alone.</h1>
                <p className="lede">
                  Pressing the button refuses future scans of {result.domain} and its subdomains,
                  deletes every stored record of it, and stops future lookups being recorded. This
                  cannot be undone from here; write in if you later change your mind.
                </p>
                <form method="post" action={`${ROOT}/confirm`} className="check-form">
                  <input type="hidden" name="token" value={token} />
                  <button className="button" type="submit">
                    Yes, leave {result.domain} alone
                    <span aria-hidden="true">↗</span>
                  </button>
                </form>
              </>
            )}
            {result.state === "done" && (
              <>
                <h1>Done. {result.domain} is left alone.</h1>
                <p className="lede">
                  {result.domain} and its subdomains are now refused by the scan, and{" "}
                  {result.deleted === 0
                    ? "there were no stored records to delete"
                    : `${result.deleted} stored ${result.deleted === 1 ? "record was" : "records were"} deleted`}
                  . Future lookups of it are not recorded. Reference {result.reference}.
                </p>
              </>
            )}
            {result.state === "used" && (
              <>
                <h1>Already confirmed.</h1>
                <p className="lede">
                  This link was already used, and {result.domain} is on the do-not-scan list. Nothing
                  more is needed.
                </p>
              </>
            )}
            {result.state === "expired" && (
              <>
                <h1>That link has expired.</h1>
                <p className="lede">
                  Confirmation links work for 48 hours. Nothing has changed; you can{" "}
                  <a href={ROOT}>ask again</a> and a fresh link will be sent.
                </p>
              </>
            )}
            {result.state === "invalid" && (
              <>
                <h1>That link is not recognised.</h1>
                <p className="lede">
                  It may have been cut short when copied. Nothing has changed; you can{" "}
                  <a href={ROOT}>ask again</a> and a fresh link will be sent.
                </p>
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
