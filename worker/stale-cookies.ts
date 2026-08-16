/**
 * Expires analytics cookies left behind by the previous version of this site.
 *
 * v8.8 ran Google Analytics, Microsoft Clarity and an Encharge snippet. Those
 * cookies are still sitting in the browser of anyone who visited before August
 * 2026, and this site sets none of them. The privacy notice says the site does
 * not track you; leaving someone else's tracking cookies on the domain makes
 * that technically true and practically hollow.
 *
 * How it works: if a request arrives carrying one of these cookies, the
 * response expires it. Once cleared the browser stops sending it, so the
 * headers stop being added — no flag, no state, and no cost for the visitors
 * who never had them.
 */

// Exact names, plus prefixes for the per-property cookies GA creates
// (_ga_G-XXXXXXX) and Clarity's session cookie.
const STALE_EXACT = [
  "_ga",
  "_gid",
  "_gat",
  "_clck",
  "_clsk",
  "encheventsnippet",
  "unique_session_id",
  "wai_from_id",
];
const STALE_PREFIXES = ["_ga_", "_gac_", "_gcl_"];

function isStale(name: string) {
  return STALE_EXACT.includes(name) || STALE_PREFIXES.some((p) => name.startsWith(p));
}

/** Cookie names present on the request that this site does not set. */
export function staleCookieNames(cookieHeader: string | null): string[] {
  if (!cookieHeader) return [];
  const names = cookieHeader
    .split(";")
    .map((part) => part.split("=")[0]?.trim())
    .filter((name): name is string => !!name && isStale(name));
  return [...new Set(names)];
}

/**
 * Deleting a cookie requires matching the domain and path it was set with.
 * The originals were set by third-party scripts on this domain, so both the
 * host-only and the dot-prefixed domain forms are expired.
 */
export function expiryHeaders(names: string[], host: string): string[] {
  const past = "Thu, 01 Jan 1970 00:00:00 GMT";
  const bare = host.split(":")[0];
  return names.flatMap((name) => [
    `${name}=; Expires=${past}; Max-Age=0; Path=/`,
    `${name}=; Expires=${past}; Max-Age=0; Path=/; Domain=${bare}`,
    `${name}=; Expires=${past}; Max-Age=0; Path=/; Domain=.${bare}`,
  ]);
}

/**
 * Adds expiry headers to an HTML response when the request carries stale
 * cookies. Only documents are touched: attaching Set-Cookie to static assets
 * would add weight to every request for no benefit.
 */
export function clearStaleCookies(request: Request, response: Response): Response {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) return response;

  const names = staleCookieNames(request.headers.get("cookie"));
  if (!names.length) return response;

  const headers = new Headers(response.headers);
  for (const value of expiryHeaders(names, new URL(request.url).host)) {
    headers.append("Set-Cookie", value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
