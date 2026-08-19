"use client";

import { useState } from "react";

interface DomainResult {
  domain: string;
  status: "registered" | "maybe-available" | "reserved" | "unknown";
  reservedNote?: string | null;
  registrar?: string | null;
  registrarUrl?: string | null;
  locked?: boolean;
  expiryDate?: string | null;
  registerUrl?: string;
}

/** DD-MM-YYYY (owner-specified format). Green when the renewal buffer is
 * comfortable (≥60 days, the guide's threshold), red when not — and a date
 * already past reads "EXPIRED n DAYS AGO" rather than negative days. */
function expiryParts(
  expiryDate: string | null | undefined,
): { label: string; text: string; good: boolean } | null {
  if (!expiryDate) return null;
  const days = Math.floor((Date.parse(expiryDate) - Date.now()) / 86_400_000);
  const [y, m, d] = expiryDate.slice(0, 10).split("-");
  const date = `${d}-${m}-${y}`;
  if (days < 0) {
    return { label: "EXPIRED:", text: `${Math.abs(days)} DAYS AGO (${date}).`, good: false };
  }
  return { label: "EXPIRES in", text: `(${days} days): ${date}.`, good: days >= 60 };
}

/** Fire-and-forget outbound click count; never blocks the navigation. */
function countClick() {
  try {
    navigator.sendBeacon(
      "/api/out",
      new Blob([JSON.stringify({ route: "hostafrica-domains" })], { type: "application/json" }),
    );
  } catch {
    /* counting is best-effort */
  }
}

const TONE = {
  "maybe-available": "pass",
  registered: "info",
  reserved: "warn",
  unknown: "warn",
} as const;

const BADGE = {
  "maybe-available": "APPEARS AVAILABLE",
  registered: "TAKEN",
  reserved: "RESERVED",
  unknown: "UNKNOWN",
} as const;

export function DomainsForm() {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<DomainResult[] | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!query.trim() || state === "loading") return;
    setState("loading");
    setError(null);
    setResults(null);
    try {
      const res = await fetch(`/api/domains?q=${encodeURIComponent(query.trim())}`);
      const data = (await res.json()) as
        | { ok: true; results: DomainResult[] }
        | { ok: false; error?: string };
      if (!data.ok) setError(data.error || "That search could not be completed.");
      else setResults(data.results);
    } catch {
      setError("The search could not run just now. Please try again in a moment.");
    } finally {
      setState("idle");
    }
  }

  return (
    <>
      <form className="check-form domain-form" onSubmit={onSubmit}>
        <label htmlFor="domain-query">
          Business name or domain
          <input
            id="domain-query"
            name="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="yourdomain"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            required
          />
        </label>
        <button className="button" type="submit" disabled={state === "loading"}>
          {state === "loading" ? "Checking the registries…" : "Search with the .ke twin"}
          <span aria-hidden="true">↗</span>
        </button>
      </form>

      {state === "loading" && (
        <div className="progress" role="progressbar" aria-label="Searching the registries">
          <span />
        </div>
      )}

      <p className="check-note" role="status" aria-live="polite">
        {state === "loading" ? "Reading public DNS and registry records…" : ""}
      </p>

      {error && (
        <div className="check-error" role="alert">
          {error}
        </div>
      )}

      {results && (
        <div className="check-result">
          <ul className="check-list">
            {results.map((r) => (
              <li
                key={r.domain}
                className={`check-${TONE[r.status]}`}
              >
                <div className="check-row-head">
                  <h3>{r.domain}</h3>
                  <span className={`check-badge check-${TONE[r.status]}`}>{BADGE[r.status]}</span>
                </div>
                {r.status === "registered" && (
                  <>
                    <p>
                      <strong>REGISTERED</strong>
                    </p>
                    {r.registrar && (
                      <p>
                        REGISTRAR:{" "}
                        {r.registrarUrl ? (
                          <a href={r.registrarUrl} target="_blank" rel="noopener noreferrer">
                            {r.registrar} <span aria-hidden="true">↗</span>
                          </a>
                        ) : (
                          r.registrar
                        )}
                        .
                      </p>
                    )}
                    {expiryParts(r.expiryDate) && (
                      <p>
                        {expiryParts(r.expiryDate)!.label}{" "}
                        <b className={expiryParts(r.expiryDate)!.good ? "value-good" : "value-bad"}>
                          {expiryParts(r.expiryDate)!.text}
                        </b>
                      </p>
                    )}
                  </>
                )}
                {r.status === "maybe-available" && (
                  <>
                    <p>Appears available. Confirm at checkout.</p>
                    <a
                      className="button"
                      href={r.registerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={countClick}
                    >
                      Register it at HOSTAFRICA <span aria-hidden="true">↗</span>
                    </a>
                  </>
                )}
                {r.status === "reserved" && (
                  <>
                    <p>
                      <strong>Not registered</strong>
                    </p>
                    {r.reservedNote && <code>{r.reservedNote}</code>}
                  </>
                )}
                {r.status === "unknown" && (
                  <p>The registries did not answer clearly just now. Try again in a moment.</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
