"use client";

import { useState } from "react";

interface DomainResult {
  domain: string;
  status: "registered" | "maybe-available" | "unknown";
  registrar?: string | null;
  locked?: boolean;
  expiryDate?: string | null;
  registerUrl?: string;
}

/** DD-MM-YYYY (owner-specified format) with days remaining; green when the
 * renewal buffer is comfortable (≥60 days, the guide's threshold), red when
 * not. */
function expiryParts(expiryDate: string | null | undefined): { text: string; good: boolean } | null {
  if (!expiryDate) return null;
  const days = Math.floor((Date.parse(expiryDate) - Date.now()) / 86_400_000);
  const [y, m, d] = expiryDate.slice(0, 10).split("-");
  return { text: `${d}-${m}-${y} (${days} days).`, good: days >= 60 };
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
      <form className="check-form" onSubmit={onSubmit}>
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
        {state === "loading" ? "Reading public DNS and registry records…" : "Checks the extension you enter"}
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
                className={`check-${r.status === "maybe-available" ? "pass" : r.status === "registered" ? "info" : "warn"}`}
              >
                <div className="check-row-head">
                  <h3>{r.domain}</h3>
                  <span
                    className={`check-badge check-${r.status === "maybe-available" ? "pass" : r.status === "registered" ? "info" : "warn"}`}
                  >
                    {r.status === "maybe-available"
                      ? "APPEARS AVAILABLE"
                      : r.status === "registered"
                        ? "TAKEN"
                        : "UNKNOWN"}
                  </span>
                </div>
                {r.status === "registered" && (
                  <>
                    <p>
                      <strong>REGISTERED</strong>
                    </p>
                    {r.registrar && <p>REGISTRAR: {r.registrar}.</p>}
                    {r.locked === true && (
                      <p>
                        TRANSFER LOCK: <b className="value-good">ON.</b>
                      </p>
                    )}
                    {r.locked === false && (
                      <p>
                        TRANSFER LOCK: <b className="value-bad">OFF.</b>
                      </p>
                    )}
                    {expiryParts(r.expiryDate) && (
                      <p>
                        EXPIRES:{" "}
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
