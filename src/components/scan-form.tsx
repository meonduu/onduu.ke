"use client";

import { useEffect, useRef, useState } from "react";
import { eatDateTime } from "../lib/datetime";

// Mirrors the response shape of worker/scan/scan.ts (ScanResponseBody). Kept
// as a local type so the island has no server import.
type SignalStatus = "pass" | "warn" | "fail" | "unobservable";

interface Signal {
  id: string;
  dimension: string;
  label: string;
  status: SignalStatus;
  evidence: string;
  limitation: string;
}

interface ScanResult {
  ok: true;
  reference: string;
  domain: string;
  scannedAt: string;
  cached: boolean;
  publicSignalScore: number;
  evidenceCoverage: number;
  signals: Signal[];
  notObserved: { label: string; note: string }[];
  statement: string;
}

const DIMENSION_LABELS: Record<string, string> = {
  control: "Control",
  trust: "Trust",
  speed: "Speed",
  conversion: "Conversion",
  resilience: "Resilience",
  "agent-fitness": "Agent fitness",
  // Pre-rename id (psr-v1). The cache lookup is pinned to the current
  // rubric so this should never be reached from a live scan, but an
  // unknown key falls through to the raw id, and "agent-readiness" printed
  // on a results page is a worse failure than one redundant line here.
  "agent-readiness": "Agent fitness",
};

const DIMENSION_ORDER = ["control", "trust", "speed", "conversion", "resilience", "agent-fitness"];

const STATUS_WORD: Record<SignalStatus, string> = {
  pass: "PASS",
  warn: "NEEDS WORK",
  fail: "MISSING",
  unobservable: "NOT PUBLIC",
};

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
    };
  }
}

export function ScanForm({ siteKey }: { siteKey?: string }) {
  const [domain, setDomain] = useState("");
  const [state, setState] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);
  const [next, setNext] = useState<{ label: string; href: string } | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);
  const outcomeRef = useRef<HTMLDivElement>(null);

  // The submit button disables while loading, which drops keyboard focus to
  // the body; moving focus to the outcome restores the keyboard position and
  // makes screen readers land on the result instead of hearing nothing.
  useEffect(() => {
    if (result || error) outcomeRef.current?.focus();
  }, [result, error]);

  // Turnstile, rendered explicitly so the token can be read on submit — same
  // pattern as the enquiry forms.
  useEffect(() => {
    if (!siteKey || !widgetRef.current || widgetId.current) return;
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = () => {
      if (widgetRef.current && window.turnstile) {
        widgetId.current = window.turnstile.render(widgetRef.current, { sitekey: siteKey });
      }
    };
    document.head.appendChild(script);
  }, [siteKey]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!domain.trim() || state === "loading") return;

    const token =
      (document.querySelector('[name="cf-turnstile-response"]') as HTMLInputElement | null)?.value ?? "";

    setState("loading");
    setError(null);
    setNext(null);
    setResult(null);

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domain.trim(), "cf-turnstile-response": token }),
      });
      const data = (await response.json()) as
        | ScanResult
        | { ok: false; error?: string; next?: { label: string; href: string } };
      if (!data.ok) {
        setError(data.error || "That scan could not be completed.");
        setNext(data.next ?? null);
      }
      else setResult(data);
    } catch {
      setError("The scan could not run just now. Please try again in a moment.");
    } finally {
      window.turnstile?.reset(widgetId.current);
      setState("idle");
    }
  }

  return (
    <>
      <form className="check-form" onSubmit={onSubmit}>
        <label htmlFor="scan-domain">
          Domain name
          <input
            id="scan-domain"
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
        {siteKey ? (
          <div className="turnstile-slot" ref={widgetRef} />
        ) : (
          <p className="note">
            Spam protection is not configured, so the scan cannot run here.
          </p>
        )}
        <button className="button" type="submit" disabled={state === "loading" || !siteKey}>
          {state === "loading" ? "Reading public signals…" : "Scan this domain"}
          <span aria-hidden="true">↗</span>
        </button>
      </form>

      {state === "loading" && (
        <p className="check-note" role="status" aria-live="polite">
          Reading public records: registry, DNS, email and the homepage…
        </p>
      )}

      {error && (
        <div className="check-error" role="alert" tabIndex={-1} ref={outcomeRef}>
          {error}
          {next && (
            <p>
              <a className="text-link" href={next.href}>
                {next.label} ↗
              </a>
            </p>
          )}
        </div>
      )}

      {result && (
        <div className="check-result" tabIndex={-1} ref={outcomeRef}>
          <div className="check-headline">
            <div className="check-score">
              <b>{result.publicSignalScore}</b>
              <span>/100 Public Signal Score</span>
            </div>
            <div>
              <h2>What the public signals show for {result.domain}.</h2>
              <p>
                Evidence coverage {result.evidenceCoverage}%. The share of the fitness picture
                that is publicly observable. {result.statement}
              </p>
            </div>
          </div>

          {DIMENSION_ORDER.map((dim) => {
            const items = result.signals.filter((s) => s.dimension === dim);
            if (items.length === 0) return null;
            return (
              <div key={dim} className="scan-dimension">
                <h3>{DIMENSION_LABELS[dim] ?? dim}</h3>
                <ul className="check-list">
                  {items.map((s) => (
                    <li key={s.id} className={`check-${s.status === "unobservable" ? "info" : s.status}`}>
                      <div className="check-row-head">
                        <h3>{s.label}</h3>
                        <span className={`check-badge check-${s.status === "unobservable" ? "info" : s.status}`}>
                          {STATUS_WORD[s.status]}
                        </span>
                      </div>
                      <p>{s.evidence}</p>
                      <small>{s.limitation}</small>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          <div className="note">
            This is a Public Signal Score, not a Digital Fitness Score. Items marked NOT PUBLIC
            could not be seen from outside and neither helped nor hurt the score. They are exactly
            what the human-reviewed Verified assessment covers. Scan reference {result.reference},
            run {eatDateTime(result.scannedAt)} EAT
            {result.cached ? " (a recent result for this domain)." : "."}
          </div>
        </div>
      )}
    </>
  );
}
