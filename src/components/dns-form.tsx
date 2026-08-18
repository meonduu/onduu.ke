"use client";

import { useState } from "react";

type Severity = "pass" | "warn" | "fail" | "info";

type Finding = {
  code: string;
  severity: Severity;
  title: string;
  detail: string;
  evidence?: string[];
  limitation?: string;
  link?: { href: string; label: string };
};

type Result = {
  ok: true;
  domain: string;
  headline: string;
  summary: { pass: number; warn: number; fail: number; info: number };
  findings: Finding[];
};

// The DNS tool's own status words: "fail" renders as ATTENTION, because a
// finding here is a risk observation, not an exam result.
const STATUS_WORD: Record<Severity, string> = {
  pass: "OK",
  warn: "ADVISORY",
  fail: "ATTENTION",
  info: "OBSERVED",
};

export function DnsForm() {
  const [domain, setDomain] = useState("");
  const [state, setState] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!domain.trim() || state === "loading") return;

    setState("loading");
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/dns?domain=${encodeURIComponent(domain.trim())}`);
      const data = (await response.json()) as Result | { ok: false; error?: string };
      if (!data.ok) setError(data.error || "That check could not be completed.");
      else setResult(data);
    } catch {
      setError("The check could not reach DNS. Try again in a moment.");
    } finally {
      setState("idle");
    }
  }

  return (
    <>
      <form className="check-form dns-form" onSubmit={onSubmit}>
        <label htmlFor="domain">
          Domain name
          <input
            id="domain"
            name="domain"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="yourbusiness.co.ke"
            autoComplete="url"
            autoCapitalize="none"
            spellCheck={false}
            required
          />
        </label>
        <button className="button" type="submit" disabled={state === "loading"}>
          {state === "loading" ? "Reading DNS…" : "Check this domain"}
          <span aria-hidden="true">↗</span>
        </button>
      </form>

      <p className="check-note" role="status" aria-live="polite">
        {state === "loading"
          ? "Querying public DNS and the registry…"
          : "Reads public DNS and registry records only. No signup, nothing private."}
      </p>

      {error && (
        <div className="check-error" role="alert">
          {error}
        </div>
      )}

      {result && (
        <div className="check-result">
          <div className="check-headline">
            <div className={`check-score check-${result.summary.fail > 0 ? "fail" : "pass"}`}>
              <b>{result.summary.pass}</b>
              <span>
                of {result.findings.length} checks OK
                {result.summary.fail > 0 ? ` · ${result.summary.fail} need attention` : ""}
              </span>
            </div>
            <div>
              <h2>{result.headline}</h2>
              <p>
                {result.summary.fail > 0
                  ? "Findings marked ATTENTION affect whether this domain works reliably; advisories are worth a look when convenient."
                  : "Nothing observed here blocks the domain from working. Items marked OBSERVED are facts worth knowing, not faults."}
              </p>
            </div>
          </div>

          <ul className="check-list">
            {result.findings.map((finding) => (
              <li key={finding.code} className={`check-${finding.severity}`}>
                <div className="check-row-head">
                  <h3>{finding.title}</h3>
                  <span className={`check-badge check-${finding.severity}`}>
                    {STATUS_WORD[finding.severity]}
                  </span>
                </div>
                <p>{finding.detail}</p>
                {finding.evidence && finding.evidence.length > 0 && (
                  <code>{finding.evidence.join(" · ")}</code>
                )}
                {finding.limitation && <p className="check-limitation">{finding.limitation}</p>}
                {finding.link && (
                  <p>
                    <a className="text-link" href={finding.link.href}>
                      {finding.link.label} ↗
                    </a>
                  </p>
                )}
              </li>
            ))}
          </ul>

          <div className="note">
            One vantage point, resolved recursively over public DNS, with registry data read over
            RDAP. DNSSEC is detected, not cryptographically validated. A clean result means the
            public records are coherent — it does not prove the domain, the website or the business
            behind them are secure.
          </div>
        </div>
      )}
    </>
  );
}
