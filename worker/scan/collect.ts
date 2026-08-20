/**
 * Observation collectors for the Instant Public Fitness Scan.
 *
 * The fetch surface is fixed by the spec (docs/specs/instant-scan.md §2):
 * RDAP, DNS over HTTPS, the homepage over https, the http redirect
 * behaviour, the apex/www twin, robots.txt, sitemap.xml and one
 * deliberately missing path. Nothing else, GET only, everything through
 * the safety layer in net.ts.
 *
 * Collectors record *facts*, not judgements — signals.ts turns facts into
 * pass/warn/fail, and rubric.ts turns those into the score. Page bodies are
 * not stored: the extracted facts plus retained headers are the replay
 * evidence (bodies would bloat storage and could embed personal data).
 */
import {
  type Budget,
  type RedirectHop,
  dohQuery,
  safeFetch,
} from "./net.ts";
import { handleCheck } from "../email-check.js";

/** Fixed probe path for missing-page behaviour — never a real page. */
export const MISSING_PROBE_PATH = "/.well-known/onduu-scan-missing-page-probe";

export interface PageFacts {
  fetched: boolean;
  error?: string;
  finalUrl?: string;
  status?: number;
  timingMs?: number;
  bodyBytes?: number;
  contentLength?: number | null;
  truncated?: boolean;
  chain: RedirectHop[];
  headers: Record<string, string>;
  title?: string | null;
  metaDescription?: boolean;
  viewport?: boolean;
  h1Count?: number;
  hasContactPath?: boolean;
  hasJsonLd?: boolean;
  jsonLdParses?: boolean;
}

export interface RdapFacts {
  fetched: boolean;
  error?: string;
  expiryDate?: string | null;
  /** Only set when the registry actually published status codes. An empty
   * array would read as "no lock"; absent means "not observable". */
  eppStatuses?: string[];
  registrar?: string | null;
  /** Registry-side delegation (ldhName of each nameserver object). */
  nameservers?: string[];
  /**
   * False when the registry answered with an RDAP object that is NOT a
   * registration — KeNIC returns 200 with a notice for reserved and
   * prohibited strings (e.g. simba.ke, "not allowed under registry policy").
   * Such a name is neither taken nor available.
   */
  registered?: boolean;
  /** The registry's own words for why it cannot be registered. */
  reservedNote?: string | null;
}

export interface DnsFacts {
  nsHosts: string[];
  dsPresent: boolean | null; // null: query failed → unobservable
}

export interface EmailFacts {
  fetched: boolean;
  error?: string;
  /** Verbatim JSON result of the existing /check analysers. */
  result?: {
    ok: boolean;
    checks?: Record<string, { status: string; detail: string; record?: string }>;
    provider?: string | null;
    mailConfigured?: boolean;
  };
}

export interface Observations {
  domain: string;
  scannedAt: string;
  rdap: RdapFacts;
  dns: DnsFacts;
  homepage: PageFacts;
  httpProbe: PageFacts;
  twin: { host: string; page: PageFacts };
  robots: PageFacts & { looksLikeRobots?: boolean };
  sitemap: PageFacts & { looksLikeSitemap?: boolean };
  missingProbe: PageFacts;
  email: EmailFacts;
}

/* ── page fact extraction ────────────────────────────────────────────── */

function extractPageFacts(result: Awaited<ReturnType<typeof safeFetch>>): PageFacts {
  if (!result.ok) {
    return { fetched: false, error: result.error, chain: result.chain, headers: {} };
  }
  const body = result.body;
  const title = (body.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]?.trim().slice(0, 300) ?? null;
  const contentLength = result.headers["content-length"]
    ? Number(result.headers["content-length"]) || null
    : null;
  const jsonLdBlocks = [
    ...body.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi),
  ];
  let jsonLdParses = false;
  for (const block of jsonLdBlocks) {
    try {
      JSON.parse(block[1]);
      jsonLdParses = true;
      break;
    } catch {
      /* keep looking */
    }
  }
  return {
    fetched: true,
    finalUrl: result.url,
    status: result.status,
    timingMs: result.timingMs,
    bodyBytes: result.bodyBytes,
    contentLength,
    truncated: result.truncated,
    chain: result.chain,
    headers: result.headers,
    title,
    metaDescription: /<meta\s+name=["']description["']\s+content=["'][^"']+["']/i.test(body),
    viewport: /<meta\s+name=["']viewport["']/i.test(body),
    h1Count: (body.match(/<h1[\s>]/gi) || []).length,
    hasContactPath:
      /href=["']tel:/i.test(body) ||
      /href=["']mailto:/i.test(body) ||
      /href=["'][^"']*contact[^"']*["']/i.test(body) ||
      /<form[\s>]/i.test(body),
    hasJsonLd: jsonLdBlocks.length > 0,
    jsonLdParses,
  };
}

/* ── collectors ──────────────────────────────────────────────────────── */

/**
 * RDAP endpoints in preference order. For .ke domains KeNIC's own server is
 * queried first: the rdap.org bootstrap hop answered the Worker
 * inconsistently in production (observed 18 Aug 2026, twice), and KeNIC is
 * the authority anyway. Other TLDs go through the rdap.org bootstrap.
 */
function rdapBases(domain: string): string[] {
  return domain.endsWith(".ke")
    ? ["https://rdap.kenic.or.ke/domain/", "https://rdap.org/domain/"]
    : ["https://rdap.org/domain/"];
}

export async function collectRdap(
  domain: string,
  budget: Budget,
  fetcher: typeof fetch = fetch,
): Promise<RdapFacts> {
  // Two passes over the base list (i.e. one retry each), capped at three
  // requests total so a bad day cannot eat the scan budget. A definitive
  // answer — a parsed record, or an authoritative 404 meaning "no such
  // registration" — stops the loop; only transient failures fall through.
  const bases = rdapBases(domain);
  const attempts = [...bases, ...bases].slice(0, 3);
  let last: RdapFacts = { fetched: false, error: "rdap-unreachable" };
  for (const base of attempts) {
    const attempt = await collectRdapFrom(base, domain, budget, fetcher);
    if (attempt.fetched || attempt.error === "rdap-not-found") return attempt;
    last = attempt;
  }
  return last;
}

async function collectRdapFrom(
  base: string,
  domain: string,
  budget: Budget,
  fetcher: typeof fetch,
): Promise<RdapFacts> {
  const res = await safeFetch(`${base}${encodeURIComponent(domain)}`, budget, {
    accept: "application/rdap+json, application/json",
    maxBytes: 256 * 1024,
    fetcher,
  });
  if (!res.ok) return { fetched: false, error: res.error };
  // Registries answer 404 (often with an RDAP error object) for domains with
  // no record: that is "no registration found", never a parsed registration.
  if (res.status === 404) return { fetched: false, error: "rdap-not-found" };
  if (res.status !== 200) return { fetched: false, error: `rdap-status-${res.status}` };
  try {
    const data = JSON.parse(res.body) as {
      handle?: string;
      status?: string[];
      events?: { eventAction?: string; eventDate?: string }[];
      entities?: { roles?: string[]; vcardArray?: unknown }[];
      nameservers?: { ldhName?: string }[];
      notices?: { title?: string; description?: string[] }[];
      variants?: { relations?: string[] }[];
    };

    // A registration leaves traces: a handle, dated events, a registrar.
    // Reserved and prohibited strings have none of those — the registry
    // answers 200 with a notice instead. Treating that as "registered"
    // reported reserved names as taken (fixed 19 Aug 2026).
    const hasRegistration = Boolean(
      data.handle || (data.events || []).length || (data.entities || []).length,
    );
    const restricted = (data.variants || []).some((v) =>
      (v.relations || []).some((r) => /restricted|prohibited|reserved/i.test(String(r))),
    );
    const notice = (data.notices || []).find((n) =>
      /prohibit|reserv|restrict|cannot be registered|not allowed/i.test(
        `${n.title ?? ""} ${(n.description || []).join(" ")}`,
      ),
    );
    if (!hasRegistration && (restricted || notice)) {
      // The registry's own sentence, minus its heading and internal policy
      // code — those are registry bookkeeping, not useful to a visitor.
      const why = ((notice?.description ?? []).join(" ").trim() || notice?.title || "")
        .replace(/[.\s]+$/, "")
        .replace(/\s*\([^)]*\)$/, "")
        .trim();
      return {
        fetched: true,
        registered: false,
        reservedNote: why.slice(0, 300) || null,
      };
    }
    const expiry =
      (data.events || []).find((e) => e.eventAction === "expiration")?.eventDate ?? null;
    // The registrar's display name. gTLD servers put an fn vcard on the
    // registrar entity itself; KeNIC's entity carries only a handle (e.g.
    // "EAL") and nests the name inside a sub-entity (the abuse contact,
    // fn "HOSTAFRICA EAC") — so descend before falling back to the handle.
    const fnOf = (entity?: { vcardArray?: unknown }): string | null => {
      const vcard = entity?.vcardArray as [string, [string, unknown, string, string][]] | undefined;
      if (!Array.isArray(vcard) || !Array.isArray(vcard[1])) return null;
      return (vcard[1].find((row) => row[0] === "fn")?.[3] as string) ?? null;
    };
    const registrarEntity = (data.entities || []).find((e) => e.roles?.includes("registrar")) as
      | { handle?: string; vcardArray?: unknown; entities?: { vcardArray?: unknown }[] }
      | undefined;
    const registrar =
      fnOf(registrarEntity) ??
      (registrarEntity?.entities ?? []).map(fnOf).find((name) => name) ??
      registrarEntity?.handle ??
      null;
    return {
      fetched: true,
      registered: hasRegistration,
      expiryDate: expiry,
      eppStatuses: (data.status || []).length ? data.status!.map(String).slice(0, 20) : undefined,
      registrar,
      nameservers: (data.nameservers || [])
        .map((n) => String(n.ldhName || "").trim().toLowerCase().replace(/\.$/, ""))
        .filter(Boolean)
        .slice(0, 13),
    };
  } catch {
    return { fetched: false, error: "unparseable-rdap" };
  }
}

async function collectDns(domain: string, budget: Budget): Promise<DnsFacts> {
  const [ns, ds] = await Promise.all([
    dohQuery(domain, "NS", budget),
    dohQuery(domain, "DS", budget),
  ]);
  return {
    nsHosts: (ns?.Answer || [])
      .filter((r) => r.type === 2)
      .map((r) => r.data.trim().toLowerCase().replace(/\.$/, ""))
      .slice(0, 13),
    dsPresent: ds === null ? null : Boolean(ds.Answer?.some((r) => r.type === 43)),
  };
}

async function collectEmail(domain: string): Promise<EmailFacts> {
  try {
    // The /check analysers, reused unchanged (spec §2, decision #5): a
    // synthetic internal request through the same handler the public
    // checker uses. It performs its own bounded DNS work.
    const res = await handleCheck(
      new Request(`https://internal/api/check?domain=${encodeURIComponent(domain)}`),
    );
    return { fetched: true, result: (await res.json()) as EmailFacts["result"] };
  } catch {
    return { fetched: false, error: "email-check-failed" };
  }
}

export async function collectObservations(domain: string, budget: Budget): Promise<Observations> {
  const twinHost = domain.startsWith("www.") ? domain.slice(4) : `www.${domain}`;

  // Email first (own DNS budget), then the fetch surface in parallel pairs.
  const email = await collectEmail(domain);
  const [rdap, dns] = await Promise.all([collectRdap(domain, budget), collectDns(domain, budget)]);
  const homepage = extractPageFacts(await safeFetch(`https://${domain}/`, budget, {}));
  const [httpProbe, twinPage, robotsRaw, sitemapRaw, missingProbe] = await Promise.all([
    safeFetch(`http://${domain}/`, budget, { maxBytes: 32 * 1024 }).then(extractPageFacts),
    safeFetch(`https://${twinHost}/`, budget, { maxBytes: 128 * 1024 }).then(extractPageFacts),
    safeFetch(`https://${domain}/robots.txt`, budget, { maxBytes: 64 * 1024, accept: "text/plain" }),
    safeFetch(`https://${domain}/sitemap.xml`, budget, {
      maxBytes: 256 * 1024,
      accept: "application/xml, text/xml",
    }),
    safeFetch(`https://${domain}${MISSING_PROBE_PATH}`, budget, { maxBytes: 32 * 1024 }).then(
      extractPageFacts,
    ),
  ]);

  // Parseability is judged here, while the body is still in hand — bodies
  // are not stored (see module header).
  const robots: Observations["robots"] = {
    ...extractPageFacts(robotsRaw),
    looksLikeRobots:
      robotsRaw.ok && robotsRaw.status === 200
        ? /^\s*(user-agent|allow|disallow|sitemap)\s*:/im.test(robotsRaw.body)
        : undefined,
  };
  const sitemap: Observations["sitemap"] = {
    ...extractPageFacts(sitemapRaw),
    looksLikeSitemap:
      sitemapRaw.ok && sitemapRaw.status === 200
        ? /<(urlset|sitemapindex)[\s>]/i.test(sitemapRaw.body)
        : undefined,
  };

  return {
    domain,
    scannedAt: new Date().toISOString(),
    rdap,
    dns,
    homepage,
    httpProbe,
    twin: { host: twinHost, page: twinPage },
    robots,
    sitemap,
    missingProbe,
    email,
  };
}
