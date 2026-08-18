/**
 * Browser security headers, attached to every response the Worker serves
 * (owner-approved 18 Aug 2026; explanation in CHANGELOG v4.2.1).
 *
 * - HSTS starts with a deliberately SHORT max-age (7 days). It is a promise:
 *   browsers that see it will refuse plain-http for that long, with no
 *   click-through if HTTPS ever breaks. Grow it (30d → 180d → 1y) as
 *   confidence accumulates; never add `preload` casually — that is
 *   effectively permanent. No includeSubDomains: future subdomains must not
 *   be committed to HTTPS by accident.
 * - nosniff stops MIME-type guessing; DENY stops clickjacking via iframes
 *   (Turnstile's iframe inside our pages is unaffected — this controls who
 *   may frame US); Referrer-Policy limits what outbound links learn.
 * - Content-Security-Policy is deliberately absent: it needs its own
 *   careful task (Turnstile, Astro's hydration scripts and the YouTube
 *   embed all need allowing) and breaks pages when rushed.
 */

export const SECURITY_HEADERS: Record<string, string> = {
  "strict-transport-security": "max-age=604800",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "strict-origin-when-cross-origin",
};

/** Returns a response carrying the security headers (existing values win). */
export function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  let changed = false;
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    if (!headers.has(name)) {
      headers.set(name, value);
      changed = true;
    }
  }
  if (!changed) return response;
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
