"use client";

import { Link } from "./nav-link";
import { useEffect, useRef, useState } from "react";

// Field lists are taken verbatim from the definitive brief: section 10
// (Assessment form) and section 24 (Contact page form fields).
type FieldDef = {
  name: string;
  label: string;
  type?: "text" | "email" | "url" | "textarea" | "select";
  options?: string[];
  required?: boolean;
  full?: boolean;
};

const CONCERNS = [
  "leads",
  "trust",
  "speed",
  "control",
  "recovery",
  "brand",
  "measurement",
  "agents",
];

const READINESS_FIELDS: FieldDef[] = [
  { name: "full_name", label: "Full name", required: true },
  { name: "business_email", label: "Business email", type: "email", required: true },
  { name: "company", label: "Company", required: true },
  { name: "role", label: "Role" },
  { name: "website_url", label: "Website URL", type: "url" },
  {
    name: "primary_concern",
    label: "Primary concern",
    type: "select",
    options: CONCERNS,
    full: true,
  },
  { name: "trigger_now", label: "What triggered the need now?", type: "textarea", full: true },
];

const CONTACT_FIELDS: FieldDef[] = [
  { name: "full_name", label: "Full name", required: true },
  { name: "business_email", label: "Business email", type: "email", required: true },
  { name: "company", label: "Company", required: true },
  { name: "role", label: "Role" },
  { name: "website_url", label: "Website URL", type: "url" },
  {
    name: "business_result",
    label: "What business result should the website or workflow produce?",
    type: "textarea",
    required: true,
    full: true,
  },
  {
    name: "primary_concern",
    label: "Which issue is most urgent?",
    type: "select",
    options: [...CONCERNS.slice(0, 7), "data location", "agents"],
    full: true,
  },
  { name: "trigger_now", label: "What triggered the need now?", type: "textarea", full: true },
  {
    name: "current_manager",
    label: "Who currently manages the website and infrastructure?",
    type: "textarea",
    full: true,
  },
  {
    name: "consequence_six_months",
    label: "What is the consequence if nothing changes in the next six months?",
    type: "textarea",
    full: true,
  },
  {
    name: "enquiry_type",
    label: "Is this mainly a website project, infrastructure enquiry, agent workflow, or a combination?",
    type: "select",
    options: ["website", "infrastructure", "agent workflow", "combination"],
    full: true,
  },
];

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
    };
  }
}

export function SubmissionForm({
  kind,
  siteKey,
}: {
  kind: "readiness" | "contact";
  siteKey?: string;
}) {
  const fields = kind === "readiness" ? READINESS_FIELDS : CONTACT_FIELDS;
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);

  // Turnstile is rendered explicitly so the token can be read on submit.
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

  // Accessible error summary: move focus to it so the errors are announced.
  useEffect(() => {
    if ((Object.keys(errors).length || formError) && summaryRef.current) {
      summaryRef.current.focus();
    }
  }, [errors, formError]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "loading") return;

    const form = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = { kind };
    for (const [key, value] of form.entries()) payload[key] = value;
    payload.consent = form.get("consent") === "on";

    setState("loading");
    setErrors({});
    setFormError(null);

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as {
        ok: boolean;
        reference?: string;
        fields?: Record<string, string>;
        error?: string;
      };

      if (data.ok && data.reference) {
        setReference(data.reference);
        setState("done");
        return;
      }

      setErrors(data.fields ?? {});
      setFormError(
        response.status === 429
          ? "Too many requests from this connection. Please try again later."
          : "Your information has not been submitted successfully. Please review the highlighted fields or try again. If the problem continues, use the contact route shown below.",
      );
      window.turnstile?.reset(widgetId.current);
      setState("idle");
    } catch {
      setFormError(
        "Your information has not been submitted successfully. Please check your connection and try again.",
      );
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div className="form-confirmation" role="status">
        <h2>Your request has been received.</h2>
        <p>
          We will review the information before recommending a next step. This is not an instant
          security or compliance assessment. Keep your reference number for any follow-up.
        </p>
        <p className="reference">
          Reference <b>{reference}</b>
        </p>
      </div>
    );
  }

  const errorList = Object.entries(errors);

  return (
    <form className="request-form" onSubmit={onSubmit} noValidate>
      {(errorList.length > 0 || formError) && (
        <div className="form-error-summary" role="alert" tabIndex={-1} ref={summaryRef}>
          <h3>We could not complete that request.</h3>
          {formError && <p>{formError}</p>}
          {errorList.length > 0 && (
            <ul>
              {errorList.map(([field, message]) => (
                <li key={field}>
                  <a href={`#${field}`}>{message}</a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {fields.map((field) => (
        <label
          key={field.name}
          className={field.full ? "full" : undefined}
          htmlFor={field.name}
        >
          {field.label}
          {field.required && <span aria-hidden="true"> *</span>}
          {field.type === "textarea" ? (
            <textarea
              id={field.name}
              name={field.name}
              rows={3}
              required={field.required}
              aria-invalid={errors[field.name] ? true : undefined}
              aria-describedby={errors[field.name] ? `${field.name}-error` : undefined}
            />
          ) : field.type === "select" ? (
            <select
              id={field.name}
              name={field.name}
              defaultValue=""
              aria-invalid={errors[field.name] ? true : undefined}
            >
              <option value="">Select one</option>
              {field.options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : (
            <input
              id={field.name}
              name={field.name}
              type={field.type === "email" ? "email" : "text"}
              inputMode={field.type === "email" ? "email" : undefined}
              required={field.required}
              aria-invalid={errors[field.name] ? true : undefined}
              aria-describedby={errors[field.name] ? `${field.name}-error` : undefined}
            />
          )}
          {errors[field.name] && (
            <strong className="field-error" id={`${field.name}-error`}>
              {errors[field.name]}
            </strong>
          )}
        </label>
      ))}

      <label className="check full" htmlFor="consent">
        <input id="consent" type="checkbox" name="consent" required />
        <span>
          I agree to the{" "}
          <Link href="/legal/privacy">privacy notice</Link> and to Onduu processing this
          information to prepare a response.
        </span>
      </label>
      {errors.consent && <strong className="field-error full">{errors.consent}</strong>}

      {siteKey ? (
        <div className="full" ref={widgetRef} />
      ) : (
        <p className="note full">
          Spam protection is not yet configured, so this form cannot accept submissions. Please
          email me@onduu.ke in the meantime.
        </p>
      )}

      <button className="button full" type="submit" disabled={state === "loading" || !siteKey}>
        {state === "loading"
          ? "Sending…"
          : kind === "readiness"
            ? "Submit my assessment request"
            : "Submit my request"}
        <span aria-hidden="true">↗</span>
      </button>
    </form>
  );
}
