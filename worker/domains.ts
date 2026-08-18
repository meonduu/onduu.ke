/**
 * Domain search: availability across the .co.ke / .ke pair, plus public
 * registration facts (registrar, transfer lock, expiry) for taken names.
 *
 * Owner decisions (18 Aug 2026): outbound registration goes to the official
 * HOSTAFRICA panel with UTM attribution only — no affiliate parameter, no
 * commission. Availability is a public observation (DNS + RDAP) presented as
 * "appears available"; the panel is authoritative at checkout.
 *
 * Nothing about a search is stored. Rate limiting is a per-isolate token
 * bucket (no database dependency); the shared budget in net.ts caps the
 * outbound work per request.
 */
import { type Budget, makeBudget, normaliseHost, isScannableHost, dohQuery } from "./scan/net.ts";
import { collectRdap, type RdapFacts } from "./scan/collect.ts";

export const REGISTER_URL =
  "https://panel.hostafrica.com/?utm_source=onduu&utm_medium=referral&utm_campaign=domain-search";

export type Availability = "registered" | "maybe-available" | "unknown";

export interface DomainResult {
  domain: string;
  status: Availability;
  registrar?: string | null;
  locked?: boolean;
  expiryDate?: string | null;
  registerUrl?: string;
}

/**
 * The candidate list for a query: the name itself plus its .co.ke / .ke
 * twin, so a business sees both halves of its brand. A bare label gets both.
 */
export function candidatesFor(input: string): string[] {
  const host = normaliseHost(input.includes(".") ? input : `${input}.co.ke`);
  if (!host || !isScannableHost(host)) return [];

  const bare = !input.includes(".");
  const label = host.split(".")[0];
  const out = new Set<string>();

  if (bare) {
    out.add(`${label}.co.ke`);
    out.add(`${label}.ke`);
  } else if (host.endsWith(".co.ke")) {
    out.add(host);
    out.add(`${host.slice(0, -".co.ke".length)}.ke`);
  } else if (host.endsWith(".ke")) {
    out.add(host);
    out.add(`${host.slice(0, -".ke".length)}.co.ke`);
  } else {
    // Another TLD: check it, and offer the Kenyan pair for the same label.
    out.add(host);
    out.add(`${label}.co.ke`);
    out.add(`${label}.ke`);
  }
  return [...out].slice(0, 3);
}

/**
 * Availability by public observation: a domain that answers NS queries or
 * has an RDAP record is registered; NXDOMAIN with no RDAP record "appears
 * available"; anything ambiguous is unknown. Never presented as
 * authoritative — the registrar's checkout is.
 */
export async function checkDomain(
  domain: string,
  budget: Budget,
  fetcher: typeof fetch = fetch,
): Promise<DomainResult> {
  const [ns, rdap] = await Promise.all([
    dohQuery(domain, "NS", budget, fetcher),
    collectRdap(domain, budget, fetcher),
  ]);

  const hasDns = Boolean(ns && ns.Status === 0 && (ns.Answer?.length ?? 0) > 0);
  const nxdomain = ns?.Status === 3;

  if (rdap.fetched) {
    return {
      domain,
      status: "registered",
      registrar: rdap.registrar ?? null,
      locked: (rdap.eppStatuses ?? []).some((s) => /transferprohibited/i.test(s)),
      expiryDate: rdap.expiryDate ?? null,
    };
  }
  if (hasDns) {
    // Registered but its registry publishes no usable RDAP (common for .ke).
    return { domain, status: "registered", registrar: null, locked: undefined, expiryDate: null };
  }
  if (nxdomain) {
    return { domain, status: "maybe-available", registerUrl: REGISTER_URL };
  }
  return { domain, status: "unknown" };
}

/* ── per-isolate rate limiting (no database dependency) ─────────────── */

const WINDOW_MS = 60 * 60 * 1000;
const SEARCHES_PER_HOUR = 30;
const buckets = new Map<string, { windowStart: number; count: number }>();

export function withinSearchLimit(key: string, now = Date.now()): boolean {
  const bucket = buckets.get(key);
  if (!bucket || now - bucket.windowStart > WINDOW_MS) {
    buckets.set(key, { windowStart: now, count: 1 });
    if (buckets.size > 10_000) buckets.clear(); // crude memory cap
    return true;
  }
  if (bucket.count >= SEARCHES_PER_HOUR) return false;
  bucket.count += 1;
  return true;
}

/* ── the request handler ─────────────────────────────────────────────── */

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

export async function handleDomainSearch(
  request: Request,
  fetcher: typeof fetch = fetch,
): Promise<Response> {
  if (request.method !== "GET") {
    return new Response("Method not allowed", { status: 405, headers: { Allow: "GET" } });
  }
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (!query) return json({ ok: false, error: "Enter a domain or business name to search." }, 400);

  const candidates = candidatesFor(query);
  if (candidates.length === 0) {
    return json({ ok: false, error: "Please enter a valid domain or name, like yourbusiness or yourbusiness.co.ke." }, 400);
  }

  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  if (!withinSearchLimit(ip)) {
    return json({ ok: false, error: "Too many searches from this connection. Please try again later." }, 429);
  }

  const budget = makeBudget(10_000, 12);
  const results = await Promise.all(candidates.map((d) => checkDomain(d, budget, fetcher)));
  return json({ ok: true, query, results });
}

export type { RdapFacts };
