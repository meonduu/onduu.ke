"use client";

import { useEffect } from "react";

/**
 * First-party enquiry attribution.
 *
 * Answers "which content produced this enquiry?" without an analytics product.
 * The first page of a visit records where the visitor came from; that travels
 * with the form submission and is stored beside the enquiry in D1, tied to its
 * reference number.
 *
 * Deliberate limits:
 *   - sessionStorage, not a cookie, so it dies when the tab closes and cannot
 *     follow anyone between visits or between sites;
 *   - only the referring URL, the landing path and any UTM parameters. No
 *     identifier, no fingerprint, nothing about the person;
 *   - internal referrers are ignored, so navigating the site does not
 *     overwrite the original source;
 *   - it is disclosed in the privacy notice rather than left implicit.
 */

const KEY = "onduu-attribution";

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;

export type Attribution = {
  referrer?: string;
  landing_path?: string;
  submitted_from?: string;
} & Partial<Record<(typeof UTM_KEYS)[number], string>>;

function capture() {
  if (typeof window === "undefined") return;
  // Only the first page of a visit sets this; later pages leave it alone.
  if (window.sessionStorage.getItem(KEY)) return;

  const params = new URLSearchParams(window.location.search);
  const record: Attribution = { landing_path: window.location.pathname.slice(0, 300) };

  const referrer = document.referrer;
  if (referrer) {
    try {
      // An internal referrer is not a source; ignore it.
      if (new URL(referrer).host !== window.location.host) {
        record.referrer = referrer.slice(0, 300);
      }
    } catch {
      /* malformed referrer — ignore rather than store junk */
    }
  }

  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) record[key] = value.slice(0, 150);
  }

  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(record));
  } catch {
    /* storage unavailable (private mode, disabled) — attribution is optional */
  }
}

export function readAttribution(): Attribution {
  if (typeof window === "undefined") return {};
  let stored: Attribution = {};
  try {
    stored = JSON.parse(window.sessionStorage.getItem(KEY) || "{}") as Attribution;
  } catch {
    stored = {};
  }
  return { ...stored, submitted_from: window.location.pathname.slice(0, 300) };
}

/** Renders nothing; records the visit source once per session. */
export function AttributionCapture() {
  useEffect(capture, []);
  return null;
}
