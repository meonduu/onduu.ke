"use client";

import { useEffect, useState } from "react";
import { Link } from "./nav-link";

/**
 * Cookie consent gate.
 *
 * Google Tag Manager sets cookies and sends data to Google, so under the Kenyan
 * Data Protection Act it needs consent before it runs — not after. Nothing is
 * loaded until someone actively accepts:
 *
 *   - no GTM script, no dataLayer and no Google request on first visit;
 *   - the choice is stored in localStorage, not a cookie, so declining leaves
 *     no cookie behind at all;
 *   - the decision is reversible from the footer, which is what makes
 *     "withdraw consent at any time" in the privacy notice true in practice.
 *
 * Cloudflare Web Analytics, when it is added, is cookieless and does not
 * identify visitors, so it is not gated here.
 */

const STORAGE_KEY = "onduu-consent";
const GTM_ID = "GTM-MSMMVVZ7";

type Choice = "granted" | "denied";

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

let injected = false;

function loadTagManager() {
  if (injected || typeof window === "undefined") return;
  injected = true;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
  document.head.appendChild(script);
}

export function ConsentGate() {
  // The banner is rendered into the HTML but hidden by CSS, and revealed once
  // the client confirms no choice is stored. That keeps it in the served
  // markup — so it still works if JavaScript is slow — without flashing at
  // visitors who already answered.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Choice | null;
    setVisible(!stored);
    if (stored === "granted") loadTagManager();

    // The footer control re-opens this so a decision can be changed later.
    const reopen = () => {
      window.localStorage.removeItem(STORAGE_KEY);
      setVisible(true);
    };
    const button = document.getElementById("cookie-preferences");
    button?.addEventListener("click", reopen);
    return () => button?.removeEventListener("click", reopen);
  }, []);

  function decide(next: Choice) {
    window.localStorage.setItem(STORAGE_KEY, next);
    setVisible(false);
    if (next === "granted") loadTagManager();
    // Declining cannot unload a script already running, so the page is
    // reloaded to guarantee a clean state if consent is withdrawn.
    else if (injected) window.location.reload();
  }

  return (
    <aside
      className={visible ? "consent is-visible" : "consent"}
      role="dialog"
      aria-modal="false"
      aria-labelledby="consent-title"
      aria-hidden={visible ? undefined : true}
    >
      <div>
        <h2 id="consent-title">Measurement cookies</h2>
        <p>
          Onduu would like to use Google Analytics to see which pages and articles are read.
          It sets cookies and sends data to Google, including outside Kenya. Nothing is loaded
          unless you accept, and you can change your mind from the footer at any time.
        </p>
        <p className="consent-detail">
          Declining leaves no analytics cookie on your device. The site works exactly the same
          either way. See the <Link href="/legal/privacy">privacy notice</Link>.
        </p>
      </div>
      <div className="consent-actions">
        <button type="button" className="button" onClick={() => decide("granted")}>
          Accept
        </button>
        <button type="button" className="button button-quiet" onClick={() => decide("denied")}>
          Decline
        </button>
      </div>
    </aside>
  );
}
