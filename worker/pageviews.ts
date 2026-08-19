/**
 * First-party page-view recording.
 *
 * Runs server-side on HTML responses. Nothing is added to the page, no script
 * runs in the browser and no cookie is involved — so it cannot be blocked, and
 * it needs no consent because nothing is stored on the visitor's device.
 *
 * What is deliberately not recorded: the IP address or any hash of it, the
 * user-agent string, and any session or visitor identifier. Two views cannot
 * be linked to the same person, by design. That means this cannot report
 * unique visitors — Cloudflare Web Analytics already does that.
 */

interface Env {
  onduu_leads?: D1Database;
}

// Cheap heuristic. The user agent is read here and never stored.
// Shared with worker/events.ts so both recorders classify identically.
export const BOT = /bot|crawl|spider|slurp|bingpreview|headless|curl|wget|python-requests|monitor|pingdom|uptime|lighthouse|gtmetrix|semrush|ahrefs|facebookexternalhit|preview/i;

export function deviceFrom(userAgent: string): string {
  if (/mobile|iphone|android(?!.*tablet)/i.test(userAgent)) return "mobile";
  if (/ipad|tablet/i.test(userAgent)) return "tablet";
  return "desktop";
}

export function referrerHost(referrer: string | null, ownHost: string): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).host;
    // Internal navigation is not a source.
    return host && host !== ownHost ? host.slice(0, 120) : null;
  } catch {
    return null;
  }
}

export function shouldRecord(request: Request, response: Response): boolean {
  if (request.method !== "GET") return false;
  if (!(response.headers.get("content-type") || "").includes("text/html")) return false;
  if (response.status !== 200) return false;
  if (BOT.test(request.headers.get("user-agent") || "")) return false;
  // Never record the private dashboard.
  return !new URL(request.url).pathname.startsWith("/go");
}

export async function recordPageView(request: Request, env: Env): Promise<void> {
  if (!env.onduu_leads) return;
  const url = new URL(request.url);
  try {
    await env.onduu_leads
      .prepare(
        "INSERT INTO page_views (path, referrer_host, country, device) VALUES (?, ?, ?, ?)"
      )
      .bind(
        url.pathname.slice(0, 300),
        referrerHost(request.headers.get("referer"), url.host),
        (request as Request & { cf?: { country?: string } }).cf?.country?.slice(0, 4) ?? null,
        deviceFrom(request.headers.get("user-agent") || "")
      )
      .run();
  } catch {
    // Recording a view must never affect the page the visitor asked for.
  }
}
