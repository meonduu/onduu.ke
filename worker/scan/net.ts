/**
 * Network safety layer for the Instant Public Readiness Scan.
 *
 * The scanner fetches URLs derived from a visitor-supplied domain, which is
 * the classic SSRF shape. Everything here exists to make that safe:
 *
 *   - only http/https, only default ports, GET only;
 *   - hostnames must be registrable public DNS names — IP literals in any
 *     encoding (dotted, decimal, octal, hex, IPv6) never validate, because
 *     labels are LDH-only and the TLD must be alphabetic;
 *   - every hostname is resolved over DNS-over-HTTPS first, and every
 *     resolved address must be publicly routable (loopback, RFC1918, CGNAT,
 *     link-local, multicast, reserved, cloud-metadata, and the IPv6
 *     equivalents including v4-mapped/NAT64/6to4 embeddings all reject);
 *   - redirect targets are re-validated and re-resolved hop by hop, which is
 *     the DNS-rebinding-by-redirect defence;
 *   - responses are size-capped while streaming, time-capped, and restricted
 *     to text-ish content types;
 *   - a shared budget caps subrequests and total wall time for the whole job.
 *
 * Residual risk: workerd's own fetch resolves DNS again after our check, so a
 * rebinding window exists in theory. Cloudflare's egress cannot reach its own
 * loopback/metadata or the deploying account's private networks, which is the
 * platform backstop; the threat model document covers this in detail.
 */

const DOH = "https://cloudflare-dns.com/dns-query";

/** Shared per-job budget. Collectors stop cleanly when it runs out. */
export interface Budget {
  deadline: number; // epoch ms — hard wall-clock stop
  subrequests: number; // remaining outbound requests
}

export function makeBudget(wallMs: number, subrequests: number): Budget {
  return { deadline: Date.now() + wallMs, subrequests };
}

export function budgetExhausted(budget: Budget): boolean {
  return Date.now() >= budget.deadline || budget.subrequests <= 0;
}

function spendBudget(budget: Budget): boolean {
  if (budgetExhausted(budget)) return false;
  budget.subrequests -= 1;
  return true;
}

/* ── Hostname validation ─────────────────────────────────────────────── */

/**
 * Normalise visitor input to a bare lowercase hostname. Accepts the shapes
 * people paste (URLs, mailto-ish, trailing dots) and uses the URL parser for
 * IDN → punycode, so "münchen.de" and its punycode form validate identically.
 * Returns null when nothing hostname-shaped survives.
 */
export function normaliseHost(input: string): string | null {
  let d = String(input || "").trim().toLowerCase();
  d = d.replace(/^https?:\/\//, "").replace(/^www\./, "");
  d = d.split("/")[0].split("?")[0].split("#")[0];
  const at = d.lastIndexOf("@");
  if (at !== -1) d = d.slice(at + 1);
  d = d.replace(/\.$/, "");
  if (!d) return null;
  // Credentials, ports and brackets never survive into a scan target.
  if (d.includes(":") || d.includes("[") || d.includes("]")) return null;
  try {
    // Punycode-normalises IDN labels and rejects gross malformations.
    return new URL(`https://${d}/`).hostname.replace(/\.$/, "");
  } catch {
    return null;
  }
}

/**
 * A scannable hostname: LDH labels, at least two labels, alphabetic TLD.
 * The alphabetic-TLD rule is load-bearing — it rejects every IPv4 literal
 * encoding (1.2.3.4, 0x7f.1, 2130706433, 017700000001) without needing to
 * enumerate them, because those all end in a digit-bearing final label.
 */
export function isScannableHost(host: string | null): host is string {
  if (!host || host.length > 253) return false;
  if (host.includes(":")) return false; // IPv6 literal
  return /^(?=.{1,253}$)(xn--[a-z0-9-]{1,59}\.|[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+([a-z]{2,63}|xn--[a-z0-9-]{1,59})$/.test(
    host,
  );
}

/* ── IP range validation ─────────────────────────────────────────────── */

/** Parse strict dotted-quad decimal only. Anything else is not an IPv4. */
export function parseIPv4(s: string): number[] | null {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(s.trim());
  if (!m) return null;
  const parts = m.slice(1).map(Number);
  return parts.every((p) => p >= 0 && p <= 255) ? parts : null;
}

/** True when the address is NOT publicly routable (or unparseable). */
export function isForbiddenIPv4(s: string): boolean {
  const p = parseIPv4(s);
  if (!p) return true; // unparseable ⇒ refuse
  const [a, b] = p;
  if (a === 0 || a === 10 || a === 127) return true; // this-net, private, loopback
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64/10
  if (a === 169 && b === 254) return true; // link-local + cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // private 172.16/12
  if (a === 192 && b === 168) return true; // private
  if (a === 192 && b === 0 && (p[2] === 0 || p[2] === 2)) return true; // IETF, TEST-NET-1
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
  if (a === 198 && b === 51 && p[2] === 100) return true; // TEST-NET-2
  if (a === 203 && b === 0 && p[2] === 113) return true; // TEST-NET-3
  if (a >= 224) return true; // multicast + reserved + broadcast
  return false;
}

/** Expand an IPv6 string into eight 16-bit groups, or null. */
export function parseIPv6(s: string): number[] | null {
  let str = s.trim().toLowerCase();
  if (str.startsWith("[") && str.endsWith("]")) str = str.slice(1, -1);
  if (!str.includes(":")) return null;

  // Embedded IPv4 tail (::ffff:1.2.3.4) → two hex groups.
  const v4tail = /^(.*:)(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/.exec(str);
  if (v4tail) {
    const quad = parseIPv4(v4tail[2]);
    if (!quad) return null;
    str =
      v4tail[1] +
      ((quad[0] << 8) | quad[1]).toString(16) +
      ":" +
      ((quad[2] << 8) | quad[3]).toString(16);
  }

  const halves = str.split("::");
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(":") : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const missing = 8 - head.length - tail.length;
  if (halves.length === 2 ? missing < 0 : head.length !== 8) return null;
  const groups = [...head, ...Array(halves.length === 2 ? missing : 0).fill("0"), ...tail];
  if (groups.length !== 8) return null;
  const nums = groups.map((g) => (/^[0-9a-f]{1,4}$/.test(g) ? parseInt(g, 16) : NaN));
  return nums.some(Number.isNaN) ? null : nums;
}

/** True when the IPv6 address is NOT publicly routable (or unparseable). */
export function isForbiddenIPv6(s: string): boolean {
  const g = parseIPv6(s);
  if (!g) return true;
  const embeddedV4 = (hi: number, lo: number) =>
    `${hi >> 8}.${hi & 0xff}.${lo >> 8}.${lo & 0xff}`;

  const allZero = g.every((x) => x === 0);
  if (allZero) return true; // ::
  if (g.slice(0, 7).every((x) => x === 0) && g[7] === 1) return true; // ::1
  // v4-mapped ::ffff:0:0/96 and v4-translated ::ffff:0:0:0/96 — check the v4.
  if (g.slice(0, 5).every((x) => x === 0) && (g[5] === 0xffff || (g[4] === 0xffff && g[5] === 0)))
    return isForbiddenIPv4(embeddedV4(g[6], g[7]));
  // NAT64 64:ff9b::/96 — check the embedded v4.
  if (g[0] === 0x64 && g[1] === 0xff9b) return isForbiddenIPv4(embeddedV4(g[6], g[7]));
  if (g[0] === 0x2002) return isForbiddenIPv4(embeddedV4(g[1], g[2])); // 6to4
  if (g[0] === 0x2001 && g[1] === 0) return true; // Teredo — tunnels are refused outright
  if (g[0] === 0x2001 && g[1] === 0xdb8) return true; // documentation
  if ((g[0] & 0xfe00) === 0xfc00) return true; // ULA fc00::/7
  if ((g[0] & 0xffc0) === 0xfe80) return true; // link-local fe80::/10
  if ((g[0] & 0xff00) === 0xff00) return true; // multicast ff00::/8
  return false;
}

/** Reject any resolved address that must never be connected to. */
export function isForbiddenAddress(ip: string): boolean {
  return ip.includes(":") ? isForbiddenIPv6(ip) : isForbiddenIPv4(ip);
}

/* ── DNS resolution ──────────────────────────────────────────────────── */

export interface DnsAnswer {
  name: string;
  type: number;
  TTL?: number;
  data: string;
}

export interface DohResponse {
  Status: number;
  AD?: boolean;
  Answer?: DnsAnswer[];
}

/** One DoH query. Returns null on transport failure (not on NXDOMAIN). */
export async function dohQuery(
  name: string,
  type: string,
  budget: Budget,
  fetcher: typeof fetch = fetch,
): Promise<DohResponse | null> {
  if (!spendBudget(budget)) return null;
  try {
    const res = await fetcher(`${DOH}?name=${encodeURIComponent(name)}&type=${type}`, {
      headers: { Accept: "application/dns-json" },
      signal: AbortSignal.timeout(Math.min(5000, budget.deadline - Date.now())),
    });
    if (!res.ok) return null;
    return (await res.json()) as DohResponse;
  } catch {
    return null;
  }
}

export interface ResolveResult {
  ok: boolean;
  addresses: string[];
  reason?: "unresolvable" | "forbidden" | "budget";
}

/**
 * Resolve a hostname and require every returned address to be public.
 * One poisoned answer rejects the whole host — mixed answers are exactly what
 * a rebinding setup looks like.
 */
export async function resolveAndValidate(
  host: string,
  budget: Budget,
  fetcher: typeof fetch = fetch,
): Promise<ResolveResult> {
  if (budgetExhausted(budget)) return { ok: false, addresses: [], reason: "budget" };
  const [a, aaaa] = await Promise.all([
    dohQuery(host, "A", budget, fetcher),
    dohQuery(host, "AAAA", budget, fetcher),
  ]);
  const addresses = [
    ...(a?.Answer || []).filter((r) => r.type === 1).map((r) => r.data.trim()),
    ...(aaaa?.Answer || []).filter((r) => r.type === 28).map((r) => r.data.trim()),
  ];
  if (!addresses.length) return { ok: false, addresses: [], reason: "unresolvable" };
  if (addresses.some(isForbiddenAddress)) return { ok: false, addresses, reason: "forbidden" };
  return { ok: true, addresses };
}

/* ── Guarded fetch ───────────────────────────────────────────────────── */

const ALLOWED_CONTENT = /^(text\/|application\/(json|ld\+json|xml|rdap\+json|rss\+xml|atom\+xml|xhtml\+xml))/i;

export interface SafeFetchOptions {
  maxBytes?: number; // response body cap (default 512 KiB)
  maxRedirects?: number; // default 5
  timeoutMs?: number; // per-request cap (default 8s, also bounded by budget)
  accept?: string;
  /** Skip the pre-flight DoH validation for hosts already validated. */
  preValidated?: boolean;
  fetcher?: typeof fetch;
}

export interface RedirectHop {
  url: string;
  status: number;
  location?: string;
}

export type SafeFetchResult =
  | {
      ok: true;
      url: string; // final URL after redirects
      status: number;
      headers: Record<string, string>;
      body: string; // possibly truncated at maxBytes
      truncated: boolean;
      chain: RedirectHop[];
      timingMs: number;
      bodyBytes: number;
    }
  | {
      ok: false;
      error:
        | "invalid-url"
        | "forbidden-target"
        | "unresolvable"
        | "too-many-redirects"
        | "redirect-loop"
        | "unsupported-content"
        | "timeout"
        | "network"
        | "budget";
      chain: RedirectHop[];
      detail?: string;
    };

/** Response headers worth keeping as evidence. Nothing else is retained. */
const KEPT_HEADERS = [
  "content-type",
  "content-length",
  "content-encoding",
  "strict-transport-security",
  "content-security-policy",
  "x-content-type-options",
  "x-frame-options",
  "referrer-policy",
  "permissions-policy",
  "cross-origin-opener-policy",
  "cache-control",
  "age",
  "server",
  "via",
  "cf-cache-status",
  "x-cache",
  "x-vercel-cache",
  "x-powered-by",
  "location",
];

function keepHeaders(h: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  for (const name of KEPT_HEADERS) {
    const v = h.get(name);
    if (v != null) out[name] = v.slice(0, 1000);
  }
  return out;
}

/**
 * Validate a URL as a scan target: http/https, default port, no credentials,
 * scannable public hostname. Returns the parsed URL or an error string.
 */
export function validateTargetUrl(raw: string, base?: string): URL | string {
  let url: URL;
  try {
    url = new URL(raw, base);
  } catch {
    return "invalid-url";
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return "invalid-url";
  if (url.username || url.password) return "invalid-url";
  if (url.port && url.port !== "80" && url.port !== "443") return "invalid-url";
  if (!isScannableHost(url.hostname)) return "forbidden-target";
  return url;
}

/**
 * GET a URL with the full guard set. Follows redirects manually so every hop
 * is re-validated and re-resolved before it is fetched.
 */
export async function safeFetch(
  rawUrl: string,
  budget: Budget,
  options: SafeFetchOptions = {},
): Promise<SafeFetchResult> {
  const {
    maxBytes = 512 * 1024,
    maxRedirects = 5,
    timeoutMs = 8000,
    accept = "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.5",
    fetcher = fetch,
  } = options;

  const chain: RedirectHop[] = [];
  const seen = new Set<string>();
  const validatedHosts = new Set<string>();
  let current = rawUrl;

  for (let hop = 0; hop <= maxRedirects; hop++) {
    const url = validateTargetUrl(current);
    if (typeof url === "string") return { ok: false, error: url as never, chain };

    if (seen.has(url.href)) return { ok: false, error: "redirect-loop", chain };
    seen.add(url.href);

    // Re-resolve and re-validate every distinct hostname in the chain, unless
    // the caller proved this exact host immediately beforehand.
    const skipPreflight = options.preValidated && hop === 0;
    if (!skipPreflight && !validatedHosts.has(url.hostname)) {
      const resolved = await resolveAndValidate(url.hostname, budget, fetcher);
      if (!resolved.ok) {
        return {
          ok: false,
          error: resolved.reason === "forbidden" ? "forbidden-target" : (resolved.reason ?? "unresolvable"),
          chain,
          detail: url.hostname,
        };
      }
      validatedHosts.add(url.hostname);
    }

    if (!spendBudget(budget)) return { ok: false, error: "budget", chain };

    const started = Date.now();
    let res: Response;
    try {
      res = await fetcher(url.href, {
        method: "GET",
        redirect: "manual",
        headers: {
          Accept: accept,
          "Accept-Language": "en",
          "User-Agent": "OnduuReadinessScan/1.0 (+https://onduu.ke/readiness)",
        },
        signal: AbortSignal.timeout(
          Math.max(1, Math.min(timeoutMs, budget.deadline - Date.now())),
        ),
      });
    } catch (err) {
      const timedOut = err instanceof Error && err.name === "TimeoutError";
      return { ok: false, error: timedOut ? "timeout" : "network", chain };
    }
    const timingMs = Date.now() - started;

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location") ?? undefined;
      chain.push({ url: url.href, status: res.status, location });
      res.body?.cancel();
      if (!location) return { ok: false, error: "network", chain, detail: "redirect-without-location" };
      const next = validateTargetUrl(location, url.href);
      if (typeof next === "string") return { ok: false, error: next as never, chain };
      current = next.href;
      continue;
    }

    const contentType = res.headers.get("content-type") || "";
    if (res.status < 400 && contentType && !ALLOWED_CONTENT.test(contentType)) {
      res.body?.cancel();
      return { ok: false, error: "unsupported-content", chain, detail: contentType.slice(0, 100) };
    }

    // Stream with a byte cap — a huge body is truncated, never buffered whole.
    let body = "";
    let bodyBytes = 0;
    let truncated = false;
    if (res.body) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8", { fatal: false });
      try {
        while (bodyBytes < maxBytes) {
          const { done, value } = await reader.read();
          if (done) break;
          bodyBytes += value.byteLength;
          if (bodyBytes > maxBytes) {
            truncated = true;
            body += decoder.decode(value.subarray(0, value.byteLength - (bodyBytes - maxBytes)));
            break;
          }
          body += decoder.decode(value, { stream: true });
        }
        if (truncated) await reader.cancel();
        else body += decoder.decode();
      } catch {
        // Body died mid-stream (slow-loris or reset) — keep what we have.
        truncated = true;
      }
    }

    return {
      ok: true,
      url: url.href,
      status: res.status,
      headers: keepHeaders(res.headers),
      body,
      truncated,
      chain,
      timingMs,
      bodyBytes,
    };
  }

  return { ok: false, error: "too-many-redirects", chain };
}
