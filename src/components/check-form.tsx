"use client";

import { useEffect, useRef, useState } from "react";

type Status = "pass" | "warn" | "fail" | "info";

type Check = {
  status: Status;
  detail: string;
  record?: string;
  records?: { priority: number; host: string }[];
  selectors?: string[];
  lookups?: number;
  policy?: string;
  provider?: string | null;
};

type Result = {
  ok: true;
  domain: string;
  score: number;
  grade: string;
  spoofable: boolean;
  provider: string | null;
  mailConfigured: boolean;
  selectorsProbed: number;
  checks: { spf: Check; dkim: Check; dmarc: Check; mx: Check };
  fixes: { priority: number; title: string; detail: string }[];
};

const LABELS: Record<string, string> = {
  spf: "SPF: who may send as you",
  dkim: "DKIM: message signing",
  dmarc: "DMARC: policy and reporting",
  mx: "MX: mail delivery",
};

const STATUS_WORD: Record<Status, string> = {
  pass: "PASS",
  warn: "NEEDS WORK",
  fail: "FAIL",
  info: "NOT SET",
};

export function CheckForm() {
  const [domain, setDomain] = useState("");

  // Arriving from the scan's "Email authentication" row carries the domain
  // across (?domain=…) so nobody retypes it.
  //
  // This has to be an effect, not a useState initialiser. The initialiser
  // runs on the server too, where there is no URL, and React's hydration
  // keeps the server's "" rather than re-running it in the browser — so
  // the first version of this prefilled nothing while every test passed.
  // The lint rule against setState-in-effect is right in general; this is
  // the documented exception (syncing from an external source, once), and
  // a single setState on mount costs one extra render of a four-field form.
  //
  // Prefilled, never auto-submitted: the check sends DNS queries, and
  // following a link must not fire them on someone's behalf. One
  // hostname-shaped value only; anything else is ignored.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("domain")?.trim().toLowerCase() ?? "";
    if (/^[a-z0-9.-]{3,253}$/.test(q) && q.includes(".")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from the URL; see above
      setDomain(q);
    }
  }, []);
  const [state, setState] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const outcomeRef = useRef<HTMLDivElement>(null);

  // The submit button disables while loading, which drops keyboard focus to
  // the body; moving focus to the outcome restores the keyboard position and
  // makes screen readers land on the result instead of hearing nothing.
  useEffect(() => {
    if (result || error) outcomeRef.current?.focus();
  }, [result, error]);


  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!domain.trim() || state === "loading") return;

    setState("loading");
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/check?domain=${encodeURIComponent(domain.trim())}`);
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
      <form className="check-form email-form" onSubmit={onSubmit}>
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
          ? "Querying public DNS records…"
          : "This reads published DNS records only."}
      </p>

      {error && (
        <div className="check-error" role="alert" tabIndex={-1} ref={outcomeRef}>
          {error}
        </div>
      )}

      {result && (
        <div className="check-result" tabIndex={-1} ref={outcomeRef}>
          <div className="check-headline">
            <div className={`check-score check-${result.spoofable ? "fail" : "pass"}`}>
              <b>{result.score}</b>
              <span>/100 · grade {result.grade}</span>
            </div>
            <div>
              <h2>
                {result.spoofable
                  ? `Someone can send email pretending to be ${result.domain}.`
                  : `${result.domain} refuses forged mail.`}
              </h2>
              <p>
                {result.spoofable
                  ? "No enforcing DMARC policy is published, so receiving servers have no instruction to refuse forgeries."
                  : "An enforcing DMARC policy is published, so receivers are told to reject or quarantine forged mail."}
                {result.provider ? ` Mail is delivered to ${result.provider}.` : ""}
              </p>
            </div>
          </div>

          <ul className="check-list">
            {(["spf", "dkim", "dmarc", "mx"] as const).map((key) => {
              const check = result.checks[key];
              if (!check) return null;
              return (
                <li key={key} className={`check-${check.status}`}>
                  <div className="check-row-head">
                    <h3>{LABELS[key]}</h3>
                    <span className={`check-badge check-${check.status}`}>
                      {STATUS_WORD[check.status]}
                    </span>
                  </div>
                  <p>{check.detail}</p>
                  {check.record && <code>{check.record}</code>}
                  {check.records && check.records.length > 0 && (
                    <code>{check.records.map((r) => `${r.priority} ${r.host}`).join(" · ")}</code>
                  )}
                  {check.selectors && check.selectors.length > 0 && (
                    <code>selectors found: {check.selectors.join(", ")}</code>
                  )}
                  {typeof check.lookups === "number" && (
                    <code>{check.lookups} of 10 permitted DNS lookups</code>
                  )}
                </li>
              );
            })}
          </ul>

          {result.fixes.length > 0 && (
            <div className="check-fixes">
              <h3>What to fix, in order</h3>
              <div className="steps">
                {result.fixes.map((fix, i) => (
                  <article key={fix.title}>
                    <b>{String(i + 1).padStart(2, "0")}</b>
                    <div>
                      <h3>{fix.title}</h3>
                      <p>{fix.detail}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </>
  );
}
