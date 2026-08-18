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

function expiryLine(expiryDate: string | null | undefined): string | null {
  if (!expiryDate) return null;
  const days = Math.floor((Date.parse(expiryDate) - Date.now()) / 86_400_000);
  return `Expires ${expiryDate.slice(0, 10)} (${days} days)`;
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
            placeholder="yourbusiness or yourbusiness.co.ke"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            required
          />
        </label>
        <button className="button" type="submit" disabled={state === "loading"}>
          {state === "loading" ? "Checking the registries…" : "Search both .co.ke and .ke"}
          <span aria-hidden="true">↗</span>
        </button>
      </form>

      <p className="check-note" role="status" aria-live="polite">
        {state === "loading"
          ? "Reading public DNS and registry records…"
          : "Checks the .co.ke and .ke pair together. Public records only; nothing you search is stored."}
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
                      {r.registrar ? `Registrar: ${r.registrar}.` : "Registered; the registry publishes no registrar details."}
                      {r.locked === true && " Transfer lock: on."}
                      {r.locked === false && " Transfer lock: off — worth fixing."}
                      {expiryLine(r.expiryDate) ? ` ${expiryLine(r.expiryDate)}.` : ""}
                    </p>
                    <small>Public registry data only. If this is your domain, the readiness assessment covers what these records mean.</small>
                  </>
                )}
                {r.status === "maybe-available" && (
                  <>
                    <p>
                      Not found in public DNS or the registry — it appears available. Availability
                      is confirmed at checkout.
                    </p>
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
          <div className="note">
            Registration, billing and support happen at HOSTAFRICA, not on this site. Wycliffe, who
            operates Onduu, is also Managing Director of HOSTAFRICA Kenya. Onduu receives no
            commission on registrations; outbound clicks are counted in aggregate only.
          </div>
        </div>
      )}
    </>
  );
}
