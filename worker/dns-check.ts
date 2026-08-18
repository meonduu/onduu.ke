/**
 * DNS Health Check (/dns) — spec: docs/specs/dns-check.md.
 *
 * Eight deterministic rules over a domain's public DNS: nameserver
 * redundancy, registry-vs-live delegation (RDAP compared with DoH — Workers
 * cannot speak port 53, so the registry side comes from RDAP), provider
 * diversity, SOA coherence, apex and www resolution, MX presence, and DNSSEC
 * adoption. Detection only — never validation, never a score.
 *
 * Everything observed here is public. Findings follow the instant-scan
 * rules: each carries its evidence and its limitation, and missing private
 * evidence is reported as unobservable, never as a pass or a failure.
 *
 * Severity vocabulary maps to the site's existing tool statuses:
 *   pass = spec "ok" · warn = spec "advisory" · fail = spec "warning"
 *   (rendered as ATTENTION, not FAIL) · info = observation/unobservable.
 */
import {
  type Budget,
  makeBudget,
  normaliseHost,
  isScannableHost,
  dohQuery,
  type DohResponse,
} from "./scan/net.ts";
import { collectRdap } from "./scan/collect.ts";

export type Severity = "pass" | "warn" | "fail" | "info";

export interface DnsFinding {
  code: string;
  severity: Severity;
  title: string;
  detail: string;
  evidence?: string[];
  limitation?: string;
  link?: { href: string; label: string };
}

export interface DnsReport {
  ok: true;
  domain: string;
  headline: string;
  summary: { pass: number; warn: number; fail: number; info: number };
  findings: DnsFinding[];
}

/* ── helpers ─────────────────────────────────────────────────────────── */

const recordsOf = (res: DohResponse | null, type: number): string[] =>
  (res?.Answer || []).filter((r) => r.type === type).map((r) => r.data.trim());

const normaliseNsHost = (h: string) => h.toLowerCase().replace(/\.$/, "");

/**
 * Suffixes that register at the third level, so a nameserver's operator is
 * label+suffix (ns1.host.co.ke → host.co.ke). Not a public-suffix list —
 * just enough to group the providers this audience actually uses.
 */
const TWO_LABEL_SUFFIXES = new Set([
  "co.ke", "or.ke", "ne.ke", "go.ke", "me.ke", "mobi.ke", "info.ke",
  "sc.ke", "ac.ke", "co.uk", "org.uk", "co.za", "co.tz", "co.ug", "com.au",
]);

/** The operator grouping for one nameserver host. Exported for tests. */
export function providerOf(nsHost: string): string {
  const labels = normaliseNsHost(nsHost).split(".");
  if (labels.length < 2) return normaliseNsHost(nsHost);
  const lastTwo = labels.slice(-2).join(".");
  if (TWO_LABEL_SUFFIXES.has(lastTwo) && labels.length >= 3) {
    return labels.slice(-3).join(".");
  }
  return lastTwo;
}

const sameSet = (a: string[], b: string[]) => {
  const sa = new Set(a);
  const sb = new Set(b);
  return sa.size === sb.size && [...sa].every((x) => sb.has(x));
};

/* ── the check ───────────────────────────────────────────────────────── */

export async function runDnsCheck(
  domain: string,
  budget: Budget,
  fetcher: typeof fetch = fetch,
): Promise<DnsReport | { ok: false; status: number; error: string }> {
  const [ns, soa, a, aaaa, mx, ds, dnskey, wwwA, rdap] = await Promise.all([
    dohQuery(domain, "NS", budget, fetcher),
    dohQuery(domain, "SOA", budget, fetcher),
    dohQuery(domain, "A", budget, fetcher),
    dohQuery(domain, "AAAA", budget, fetcher),
    dohQuery(domain, "MX", budget, fetcher),
    dohQuery(domain, "DS", budget, fetcher),
    dohQuery(domain, "DNSKEY", budget, fetcher),
    dohQuery(`www.${domain}`, "A", budget, fetcher),
    collectRdap(domain, budget, fetcher),
  ]);

  // Transport failure on the anchor queries: nothing useful can be said.
  if (!ns && !soa && !a) {
    return { ok: false, status: 502, error: "The check could not reach DNS. Try again in a moment." };
  }
  // NXDOMAIN across the board: the name has no delegation at all.
  if (ns?.Status === 3 && soa?.Status === 3 && !rdap.fetched) {
    return {
      ok: false,
      status: 404,
      error: `${domain} does not resolve. Check the spelling, or the domain may not be registered.`,
    };
  }

  const liveNs = recordsOf(ns, 2).map(normaliseNsHost);
  const registryNs = (rdap.nameservers ?? []).map(normaliseNsHost);
  const apexAddresses = [...recordsOf(a, 1), ...recordsOf(aaaa, 28)];
  const wwwAddresses = recordsOf(wwwA, 1);
  const findings: DnsFinding[] = [];

  /* 1 — nameservers exist, and more than one */
  if (ns === null) {
    findings.push({
      code: "NS_UNOBSERVABLE",
      severity: "info",
      title: "Nameservers",
      detail: "The nameserver query did not complete, so nothing can be said about delegation on this run.",
      limitation: "A repeat check usually resolves this; it is a lookup failure, not a finding about the domain.",
    });
  } else if (liveNs.length === 0) {
    findings.push({
      code: "NS_NONE",
      severity: "fail",
      title: "Nameservers",
      detail:
        "No nameservers answered for this domain. Until delegation works, the website and email that depend on this name cannot work reliably.",
    });
  } else if (liveNs.length === 1) {
    findings.push({
      code: "NS_SINGLE",
      severity: "fail",
      title: "Nameservers",
      detail:
        "Only one nameserver is published. If that single server has a bad day, the domain — website and email together — disappears with it. Two or more, on separate infrastructure, is the long-standing expectation.",
      evidence: liveNs,
    });
  } else {
    findings.push({
      code: "NS_OK",
      severity: "pass",
      title: "Nameservers",
      detail: `${liveNs.length} nameservers answer for this domain.`,
      evidence: liveNs,
    });
  }

  /* 2 — delegation consistency: registry (RDAP) vs live (DoH) */
  if (registryNs.length && liveNs.length) {
    if (sameSet(registryNs, liveNs)) {
      findings.push({
        code: "DELEGATION_MATCH",
        severity: "pass",
        title: "Delegation",
        detail: "The nameservers on file at the registry match the nameservers actually answering.",
        evidence: [`registry: ${registryNs.join(", ")}`],
      });
    } else {
      findings.push({
        code: "DELEGATION_MISMATCH",
        severity: "fail",
        title: "Delegation",
        detail:
          "The registry has one set of nameservers on file, but a different set is answering. The domain can behave inconsistently — working for some visitors and failing for others — and changes made in one place quietly do not apply. Worth resolving with whoever manages the domain.",
        evidence: [`registry: ${registryNs.join(", ")}`, `answering: ${liveNs.join(", ")}`],
      });
    }
  } else {
    findings.push({
      code: "DELEGATION_UNOBSERVABLE",
      severity: "info",
      title: "Delegation",
      detail: registryNs.length
        ? "The registry lists nameservers but none could be observed answering on this run."
        : "This domain's registry does not publish nameserver data over RDAP, so the registry side of delegation is not observable from here.",
      limitation: "Not a pass or a failure — the registry-side record simply is not publicly readable for this domain.",
    });
  }

  /* 3 — provider diversity: observation, never judged */
  if (liveNs.length >= 2) {
    const providers = [...new Set(liveNs.map(providerOf))];
    findings.push({
      code: providers.length > 1 ? "NS_PROVIDERS_SPREAD" : "NS_PROVIDER_SINGLE",
      severity: providers.length > 1 ? "pass" : "info",
      title: "Nameserver providers",
      detail:
        providers.length > 1
          ? `Nameservers are spread across ${providers.length} providers.`
          : `All nameservers are operated by one provider (${providers[0]}). That is common and often fine — it does mean that provider is a single point of dependency, which is worth knowing rather than a fault.`,
      evidence: providers,
    });
  }

  /* 4 — SOA present and coherent */
  const soaRecords = recordsOf(soa, 6);
  if (soa === null) {
    findings.push({
      code: "SOA_UNOBSERVABLE",
      severity: "info",
      title: "Zone record (SOA)",
      detail: "The SOA query did not complete on this run.",
    });
  } else if (soaRecords.length === 0) {
    findings.push({
      code: "SOA_MISSING",
      severity: "warn",
      title: "Zone record (SOA)",
      detail:
        "No SOA record was returned. Every properly delegated zone has one; its absence usually means the delegation itself is unhealthy.",
    });
  } else {
    const parts = soaRecords[0].split(/\s+/);
    const refresh = Number(parts[3]);
    const expire = Number(parts[5]);
    const incoherent =
      parts.length < 7 || !(refresh > 0) || !(expire > 0) || expire <= refresh;
    findings.push({
      code: incoherent ? "SOA_INCOHERENT" : "SOA_OK",
      severity: incoherent ? "warn" : "pass",
      title: "Zone record (SOA)",
      detail: incoherent
        ? "The zone's SOA record is published but its timing values are unusual, which can make secondary nameservers serve stale answers."
        : "The zone's SOA record is published with sensible timing values.",
      evidence: [soaRecords[0]],
    });
  }

  /* 5 — the apex resolves */
  if (a === null && aaaa === null) {
    findings.push({
      code: "APEX_UNOBSERVABLE",
      severity: "info",
      title: "Domain address",
      detail: "Address queries did not complete on this run.",
    });
  } else if (apexAddresses.length === 0) {
    findings.push({
      code: "APEX_NO_ADDRESS",
      severity: "fail",
      title: "Domain address",
      detail: `${domain} does not point to any server. Anyone typing the bare domain gets an error. If the website lives on www only, this is the classic reason "the site works for me but not for my customer".`,
    });
  } else {
    findings.push({
      code: "APEX_OK",
      severity: "pass",
      title: "Domain address",
      detail: `${domain} resolves.`,
      evidence: apexAddresses.slice(0, 6),
    });
  }

  /* 6 — www resolves and coheres with the apex */
  if (wwwA === null) {
    findings.push({
      code: "WWW_UNOBSERVABLE",
      severity: "info",
      title: "www",
      detail: "The www lookup did not complete on this run.",
    });
  } else if (wwwAddresses.length === 0) {
    findings.push({
      code: "WWW_NO_ADDRESS",
      severity: "warn",
      title: "www",
      detail: `www.${domain} does not resolve. Plenty of people still type www — for them, the site is down.`,
    });
  } else if (
    apexAddresses.length > 0 &&
    !wwwAddresses.some((ip) => apexAddresses.includes(ip))
  ) {
    findings.push({
      code: "WWW_DIVERGES",
      severity: "warn",
      title: "www",
      detail:
        "www resolves, but to entirely different addresses than the bare domain. Sometimes deliberate — often a leftover pointing at an old server. Worth confirming both destinations are intended.",
      evidence: [
        `${domain}: ${apexAddresses.slice(0, 3).join(", ")}`,
        `www.${domain}: ${wwwAddresses.slice(0, 3).join(", ")}`,
      ],
    });
  } else {
    findings.push({
      code: "WWW_OK",
      severity: "pass",
      title: "www",
      detail: `www.${domain} resolves alongside the bare domain.`,
    });
  }

  /* 7 — MX presence only; depth belongs to /email-security */
  const mxRecords = recordsOf(mx, 15);
  if (mx === null) {
    findings.push({
      code: "MX_UNOBSERVABLE",
      severity: "info",
      title: "Mail routing (MX)",
      detail: "The MX query did not complete on this run.",
    });
  } else if (mxRecords.length === 0) {
    findings.push({
      code: "MX_NONE",
      severity: "info",
      title: "Mail routing (MX)",
      detail:
        "No mail routing is published. Fine if this domain is not meant to receive email; if customers are supposed to reach you at this domain, their mail has nowhere to go.",
    });
  } else {
    findings.push({
      code: "MX_PRESENT",
      severity: "pass",
      title: "Mail routing (MX)",
      detail: `Mail routing is published (${mxRecords.length} record${mxRecords.length === 1 ? "" : "s"}). Whether the domain also refuses forged mail is a separate question.`,
      evidence: mxRecords.slice(0, 4),
      link: { href: "/email-security", label: "Run the email security check" },
    });
  }

  /* 8 — DNSSEC adoption: detection, not validation */
  const dsRecords = recordsOf(ds, 43);
  const dnskeyRecords = recordsOf(dnskey, 48);
  if (ds === null) {
    findings.push({
      code: "DNSSEC_UNOBSERVABLE",
      severity: "info",
      title: "DNSSEC",
      detail: "The DNSSEC queries did not complete on this run.",
    });
  } else if (dsRecords.length > 0 && dnskey !== null && dnskeyRecords.length === 0) {
    findings.push({
      code: "DNSSEC_BROKEN_CHAIN",
      severity: "fail",
      title: "DNSSEC",
      detail:
        "The registry publishes a DNSSEC fingerprint (DS) for this domain, but the zone itself returned no signing keys. Validating resolvers can treat the whole domain as failed. This usually follows a nameserver move where DNSSEC was not carried over — worth fixing promptly.",
      limitation: "Detection only: this check does not cryptographically validate the chain.",
    });
  } else if (dsRecords.length > 0) {
    findings.push({
      code: "DNSSEC_PRESENT",
      severity: "pass",
      title: "DNSSEC",
      detail: "DNSSEC is in place: the registry publishes a fingerprint and the zone publishes signing keys.",
      limitation: "Detection only: presence of the records, not cryptographic validation of the chain.",
    });
  } else {
    findings.push({
      code: "DNSSEC_ABSENT",
      severity: "info",
      title: "DNSSEC",
      detail:
        "DNSSEC is not enabled. Most domains in this market do not sign yet, so this is an observation, not a fault — signing prevents a class of quiet DNS-tampering attacks, and is worth raising with your DNS provider when convenient.",
    });
  }

  const summary = { pass: 0, warn: 0, fail: 0, info: 0 };
  for (const f of findings) summary[f.severity] += 1;

  const headline =
    summary.fail > 0
      ? `${domain} has ${summary.fail} DNS ${summary.fail === 1 ? "issue" : "issues"} that deserve attention.`
      : summary.warn > 0
        ? `${domain} looks broadly coherent, with ${summary.warn} advisory ${summary.warn === 1 ? "finding" : "findings"}.`
        : `${domain}'s DNS foundations look coherent.`;

  return { ok: true, domain, headline, summary, findings };
}

/* ── per-isolate rate limiting (same shape as the domain search) ─────── */

const WINDOW_MS = 60 * 60 * 1000;
const CHECKS_PER_HOUR = 30;
const buckets = new Map<string, { windowStart: number; count: number }>();

export function withinDnsCheckLimit(key: string, now = Date.now()): boolean {
  const bucket = buckets.get(key);
  if (!bucket || now - bucket.windowStart > WINDOW_MS) {
    buckets.set(key, { windowStart: now, count: 1 });
    if (buckets.size > 10_000) buckets.clear();
    return true;
  }
  if (bucket.count >= CHECKS_PER_HOUR) return false;
  bucket.count += 1;
  return true;
}

/* ── the request handler ─────────────────────────────────────────────── */

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

export async function handleDnsCheck(
  request: Request,
  fetcher: typeof fetch = fetch,
): Promise<Response> {
  if (request.method !== "GET") {
    return new Response("Method not allowed", { status: 405, headers: { Allow: "GET" } });
  }
  const raw = new URL(request.url).searchParams.get("domain")?.trim() ?? "";
  if (!raw) return json({ ok: false, error: "Please enter a domain name." }, 400);

  const domain = normaliseHost(raw);
  if (!isScannableHost(domain)) {
    return json(
      { ok: false, error: `"${raw}" does not look like a valid domain name. Try something like yourbusiness.co.ke` },
      400,
    );
  }

  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  if (!withinDnsCheckLimit(ip)) {
    return json({ ok: false, error: "Too many checks from this connection. Please try again later." }, 429);
  }

  // 8 DoH queries for the rules + RDAP (up to 3 guarded fetches, each with
  // its own resolve-and-validate lookups) fit comfortably in this budget.
  const budget = makeBudget(12_000, 22);
  const result = await runDnsCheck(domain, budget, fetcher);
  if (!result.ok) return json({ ok: false, error: result.error }, result.status);
  return json(result);
}
