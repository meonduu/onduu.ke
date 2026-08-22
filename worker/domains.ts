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
import { clientKeyOf } from "./submissions.ts";
import { collectRdap, type RdapFacts } from "./scan/collect.ts";

// Owner instruction, 21 Aug 2026: an available-domain result sends the
// visitor to HOSTAFRICA's checkout rather than the panel home page, so the
// next step after "appears available" is the step that registers it.
//
// The searched domain does NOT carry through: the checkout reflects any
// query parameter into its own state without pre-filling the search (a
// nonsense parameter reflects identically), so the visitor re-enters the
// name there. If HOSTAFRICA publishes a pre-fill parameter, adding it here
// is the whole change.
//
// Attribution (owner instruction, 21 Aug 2026, superseding the 18 Aug
// "no affiliate parameter" decision): the link now carries HOSTAFRICA
// affiliate id 916 as well as the UTMs. The owner confirmed that id 916 is
// used for ATTRIBUTION ONLY and pays Onduu no commission — which is why
// the disclosures on /domains and /legal/tool-limitations now name the
// affiliate id explicitly instead of saying "attribution tags only".
//
// If that ever changes and the id starts paying, those disclosures become
// false in the same instant and must change in the same release. The
// paired test in tests/domains.test.mjs exists to make the link and its
// disclosure impossible to move independently.
const REGISTER_BASE =
  "https://panel.hostafrica.com/checkout/0?aff=916&ident=keha&utm_source=onduu&utm_medium=referral&utm_campaign=domain-search";

/** Kept for callers and tests that want the destination without a name. */
export const REGISTER_URL = REGISTER_BASE;

/**
 * The checkout with the searched name already in its box.
 *
 * `ident=keha` is the piece that makes `domain` work, and it was not
 * guesswork: HOSTAFRICA's own public search at www.hostafrica.ke/domains/
 * submits `GET /checkout/0?ident=keha&domain=…`, so this is their format,
 * not one invented here. Without `ident` the checkout ignores `domain`
 * entirely — which is why an earlier attempt (v4.70.0) concluded the name
 * could not be carried through at all.
 *
 * Verified end to end: the box arrives filled and the page reports the
 * availability itself. The checkout consumes `domain` and drops it from
 * the address bar, keeping `ident` and the UTMs; `aff=916` is stored as a
 * cookie, so attribution survives the parameter being consumed.
 */
export function registerUrlFor(domain: string) {
  return `${REGISTER_BASE}&domain=${encodeURIComponent(domain)}`;
}

export type Availability = "registered" | "maybe-available" | "reserved" | "unknown";

export interface DomainResult {
  domain: string;
  status: Availability;
  /** Reserved names only: the registry's stated reason, quoted. */
  reservedNote?: string | null;
  registrar?: string | null;
  registrarUrl?: string | null;
  locked?: boolean;
  expiryDate?: string | null;
  registerUrl?: string;
}

/**
 * Websites of well-known registrars, matched against the registrar name the
 * registry publishes. Owner-requested (18 Aug 2026): many people assume the
 * largest registrar controls every domain, so a taken domain links to its
 * ACTUAL registrar. Competitor links are plain — no tracking parameters;
 * only the approved HOSTAFRICA destination carries attribution. Every URL
 * here was verified reachable before inclusion; unknown registrars simply
 * show their published name without a link.
 */
const REGISTRAR_SITES: [pattern: string, url: string][] = [
  // Government domains (.go.ke) register through the ICT Authority.
  ["ictauthority", "https://www.icta.go.ke"],
  ["hostafrica", "https://www.hostafrica.com"],
  ["truehost", "https://truehost.co.ke"],
  ["safaricom", "https://www.safaricom.co.ke"],
  ["kenyawebsiteexperts", "https://kenyawebexperts.co.ke"],
  ["kenyawebexperts", "https://kenyawebexperts.co.ke"],
  ["sasahost", "https://www.sasahost.co.ke"],
  ["hostpinnacle", "https://www.hostpinnacle.co.ke"],
  ["eacdirectory", "https://www.eacdirectory.co.ke"],
  ["godaddy", "https://www.godaddy.com"],
  ["namecheap", "https://www.namecheap.com"],
  ["cloudflare", "https://www.cloudflare.com"],
  ["gandi", "https://www.gandi.net"],
  ["ionos", "https://www.ionos.com"],
  ["hostinger", "https://www.hostinger.com"],
  ["namecom", "https://www.name.com"],
  ["porkbun", "https://porkbun.com"],
  ["ovh", "https://www.ovhcloud.com"],
  ["markmonitor", "https://www.markmonitor.com"],
];

/** Match the published registrar name to a known website, or null. */
export function registrarWebsite(name: string | null | undefined): string | null {
  if (!name) return null;
  const key = name.toLowerCase().replace(/[^a-z]/g, "");
  for (const [pattern, url] of REGISTRAR_SITES) {
    if (key.includes(pattern)) return url;
  }
  return null;
}

/**
 * KeNIC's namespace: .ke registers at the second level, and these nine
 * extensions register at the third level (owner-confirmed, 18 Aug 2026).
 * Recognising them prevents nonsense twins like "kra.go.co.ke".
 */
const KENIC_3LDS = [
  "co.ke",
  "or.ke",
  "ne.ke",
  "go.ke",
  "me.ke",
  "mobi.ke",
  "info.ke",
  "sc.ke",
  "ac.ke",
];

/**
 * The candidate pair for a query — exactly two results (owner decision,
 * 18 Aug 2026): the extension the visitor entered, plus its .ke twin.
 *
 * - a bare label → label.co.ke + label.ke;
 * - name.co.ke ↔ name.ke pair each other;
 * - any other KeNIC third-level (kra.go.ke, school.ac.ke, …) → itself plus
 *   name.ke;
 * - subdomains collapse to the registrable domain first
 *   (portal.kra.go.ke → kra.go.ke);
 * - another TLD is checked as given, paired with name.co.ke.
 */
export function candidatesFor(input: string): string[] {
  const host = normaliseHost(input.includes(".") ? input : `${input}.co.ke`);
  if (!host || !isScannableHost(host)) return [];

  const out = new Set<string>();
  const labels = host.split(".");

  const kenicSuffix = KENIC_3LDS.find((s) => host === s || host.endsWith(`.${s}`));
  if (kenicSuffix) {
    const suffixLabels = kenicSuffix.split(".").length;
    if (labels.length <= suffixLabels) return []; // the bare suffix itself
    // The label immediately before the suffix is the registrable name;
    // anything before that is a subdomain and is dropped.
    const label = labels[labels.length - suffixLabels - 1];
    out.add(`${label}.${kenicSuffix}`);
    out.add(`${label}.ke`);
  } else if (host.endsWith(".ke")) {
    // Second-level .ke (name.ke), or a subdomain of one (foo.name.ke).
    const label = labels[labels.length - 2];
    out.add(`${label}.ke`);
    out.add(`${label}.co.ke`);
  } else {
    // Another TLD: check it as given, paired with the commercial default.
    out.add(host);
    out.add(`${labels[0]}.co.ke`);
  }
  return [...out].slice(0, 2);
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

  // Reserved or prohibited strings: the registry answers with an RDAP
  // object but no registration. Neither taken nor available — a third
  // state, or the tool claims a name is owned when nobody owns it.
  if (rdap.fetched && rdap.registered === false) {
    return { domain, status: "reserved", reservedNote: rdap.reservedNote ?? null };
  }
  if (rdap.fetched) {
    return {
      domain,
      status: "registered",
      registrar: rdap.registrar ?? null,
      registrarUrl: registrarWebsite(rdap.registrar),
      // Undefined when the registry published no status codes at all:
      // "not observable" must never render as a confident "lock is OFF".
      locked: rdap.eppStatuses
        ? rdap.eppStatuses.some((s) =>
            /transferprohibited/.test(s.toLowerCase().replace(/[^a-z]/g, "")),
          )
        : undefined,
      expiryDate: rdap.expiryDate ?? null,
    };
  }
  if (hasDns) {
    // Registered but its registry publishes no usable RDAP (common for .ke).
    return { domain, status: "registered", registrar: null, locked: undefined, expiryDate: null };
  }
  if (nxdomain) {
    return { domain, status: "maybe-available", registerUrl: registerUrlFor(domain) };
  }
  return { domain, status: "unknown" };
}

/* ── rate limiting ────────────────────────────────────────────────────
 * Two layers. The in-memory bucket is a fast reject inside one isolate —
 * it costs nothing and stops a burst before any database call. The D1
 * window (migration 0012) is the one that actually holds: an isolate is
 * recycled whenever Cloudflare decides, and many isolates serve the site
 * at once, so the in-memory count alone meant 30 an hour PER ISOLATE and
 * a reset at any moment. This was the busiest public tool with the
 * weakest limit.
 *
 * Both key on the hashed client key, never the address. The Map used to
 * hold raw IPs in Worker memory, which is the one thing every other
 * counter here is careful to avoid.
 */

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

/**
 * The durable half. Same sliding window as withinScanRateLimit; survives
 * isolate recycling and is shared across every isolate. Returns true when
 * the database is unavailable — a search is a public read, and refusing
 * everyone because the counter is unreachable is the worse failure.
 */
export async function withinSearchLimitDurable(
  db: D1Database | undefined,
  clientKey: string,
  now = Date.now(),
): Promise<boolean> {
  if (!db) return true;
  try {
    const windowStart = new Date(now - WINDOW_MS).toISOString();
    const row = await db
      .prepare("SELECT count, window_start FROM search_throttle WHERE client_key = ?")
      .bind(clientKey)
      .first<{ count: number; window_start: string }>();

    if (!row || row.window_start < windowStart) {
      await db
        .prepare(
          "INSERT INTO search_throttle (client_key, window_start, count) VALUES (?, ?, 1)" +
            " ON CONFLICT(client_key) DO UPDATE SET window_start = excluded.window_start, count = 1",
        )
        .bind(clientKey, new Date(now).toISOString())
        .run();
      return true;
    }

    if (row.count >= SEARCHES_PER_HOUR) return false;

    await db
      .prepare("UPDATE search_throttle SET count = count + 1 WHERE client_key = ?")
      .bind(clientKey)
      .run();
    return true;
  } catch {
    // Migration 0012 not applied, or D1 unreachable. The in-memory bucket
    // still applies; the tool keeps working.
    return true;
  }
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
  db?: D1Database,
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

  const clientKey = await clientKeyOf(request);
  const tooMany = { ok: false, error: "Too many searches from this connection. Please try again later." };
  if (!withinSearchLimit(clientKey)) return json(tooMany, 429);
  if (!(await withinSearchLimitDurable(db, clientKey))) return json(tooMany, 429);

  const budget = makeBudget(10_000, 12);
  const results = await Promise.all(candidates.map((d) => checkDomain(d, budget, fetcher)));
  return json({ ok: true, query, results });
}

export type { RdapFacts };
