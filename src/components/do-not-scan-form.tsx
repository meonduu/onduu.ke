"use client";

import { useEffect, useRef, useState } from "react";

// Three fields and a consent line. Deliberately none of the enquiry form's
// questions: a request to be left alone must not require a company name or
// the business result a website should produce. Same Turnstile wiring as
// the scan form, because a submission here sends an email.

type Outcome =
  | { kind: "sent" | "already" | "cooldown"; message: string }
  | { kind: "error"; message: string; fields?: Record<string, string> };

export function DoNotScanForm({ siteKey }: { siteKey?: string }) {
  const [domain, setDomain] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "loading">("idle");
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);
  const outcomeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (outcome) outcomeRef.current?.focus();
  }, [outcome]);

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
    if (state === "loading") return;
    if (!consent) {
      setOutcome({
        kind: "error",
        message: "Please confirm that you control the domain and agree to the one confirmation email.",
        fields: { consent: "Required." },
      });
      return;
    }
    const token =
      (document.querySelector('[name="cf-turnstile-response"]') as HTMLInputElement | null)?.value ?? "";

    setState("loading");
    setOutcome(null);
    try {
      const response = await fetch("/api/do-not-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, email, note, "cf-turnstile-response": token }),
      });
      const data = (await response.json()) as {
        ok: boolean;
        state?: "sent" | "already" | "cooldown";
        message?: string;
        error?: string;
        fields?: Record<string, string>;
      };
      if (data.ok && data.state && data.message) {
        setOutcome({ kind: data.state, message: data.message });
        if (data.state === "sent") {
          setDomain("");
          setEmail("");
          setNote("");
          setConsent(false);
        }
      } else {
        setOutcome({
          kind: "error",
          message: data.error || "We could not complete that request.",
          fields: data.fields,
        });
      }
    } catch {
      setOutcome({ kind: "error", message: "The request could not be sent just now. Please try again in a moment." });
    } finally {
      window.turnstile?.reset(widgetId.current);
      setState("idle");
    }
  }

  const fieldError = (name: string) =>
    outcome?.kind === "error" ? outcome.fields?.[name] : undefined;

  return (
    <>
      <form className="request-form" onSubmit={onSubmit} noValidate>
        <label htmlFor="dns-domain" className="full">
          <span className="label-text">Domain</span>
          <input
            id="dns-domain"
            name="domain"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="yourbusiness.co.ke"
            autoComplete="url"
            autoCapitalize="none"
            spellCheck={false}
            required
            aria-invalid={fieldError("domain") ? true : undefined}
          />
          {fieldError("domain") && <strong className="field-error">{fieldError("domain")}</strong>}
        </label>
        <label htmlFor="dns-email" className="full">
          <span className="label-text">An email address at that domain</span>
          <input
            id="dns-email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@yourbusiness.co.ke"
            autoComplete="email"
            required
            aria-invalid={fieldError("email") ? true : undefined}
          />
          {fieldError("email") && <strong className="field-error">{fieldError("email")}</strong>}
        </label>
        <label htmlFor="dns-note" className="full">
          <span className="label-text">Anything to add (optional)</span>
          <textarea
            id="dns-note"
            name="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={500}
          />
        </label>
        <label className="check full">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            required
          />
          <span>
            I control this domain, and I agree to Onduu emailing this address once to confirm
            that, as the <a href="/legal/privacy">privacy notice</a> describes.
          </span>
        </label>
        {siteKey ? (
          <div className="turnstile-slot full" ref={widgetRef} />
        ) : (
          <p className="note full">Spam protection is not configured, so this request cannot be sent here.</p>
        )}
        <button className="button full" type="submit" disabled={state === "loading" || !siteKey}>
          {state === "loading" ? "Sending…" : "Send the confirmation link"}
          <span aria-hidden="true">↗</span>
        </button>
      </form>

      {outcome && (
        <div
          className={outcome.kind === "error" ? "check-error" : "check-result"}
          role={outcome.kind === "error" ? "alert" : "status"}
          tabIndex={-1}
          ref={outcomeRef}
        >
          {outcome.message}
        </div>
      )}
    </>
  );
}
