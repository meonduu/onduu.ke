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
  budgetExhausted,
  normaliseHost,
  isScannableHost,
  isForbiddenAddress,
  dohQuery,
  type DohResponse,
} from "./scan/net.ts";
import { collectRdap } from "./scan/collect.ts";
import { QTYPE } from "./dns-wire.ts";
import { tcpDnsQuery, type TcpDnsQuery } from "./dns-tcp.ts";

export type Severity = "pass" | "warn" | "fail" | "info";

/** Presentation groups, LeafDNS-style (spec §6, Phase 1 rendering). */
export type Category = "registry" | "nameservers" | "soa" | "web" | "mail" | "dnssec";

export interface DnsFinding {
  code: string;
  severity: Severity;
  category?: Category;
  title: string;
  detail: string;
  evidence?: string[];
  limitation?: string;
  link?: { href: string; label: string };
}

export interface NsHostInfo {
  host: string;
  ips: string[];
  /** null when the registry side is not observable for this domain. */
  inRegistry: boolean | null;
  answering: boolean;
}

export interface MxInfo {
  priority: number;
  host: string;
  ips: string[];
  ptr: { ip: string; name: string | null }[];
}

/** Structured data behind the findings, for tables and the diagram. */
export interface DnsDetail {
  registryNs: string[];
  registryObservable: boolean;
  nsHosts: NsHostInfo[];
  soa: {
    mname: string;
    rname: string;
    serial: string;
    refresh: number;
    retry: number;
    expire: number;
    minimum: number;
  } | null;
  /** Plain-language RFC 1912-style notes on SOA values. Advice, not findings. */
  soaAdvice: string[];
  mx: MxInfo[];
  apexAddresses: string[];
  wwwAddresses: string[];
  /** Phase 2: the parent zone's own view of the delegation, with glue. */
  parent: {
    zone: string;
    source: string;
    delegation: { host: string; ttl: number }[];
    glue: { name: string; ip: string }[];
  } | null;
  /** Phase 2: SOA serial as reported by each authoritative server. */
  serials: { server: string; serial: string | null }[];
}

export interface DnsReport {
  ok: true;
  domain: string;
  headline: string;
  summary: { pass: number; warn: number; fail: number; info: number };
  findings: DnsFinding[];
  detail: DnsDetail;
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

/* ── Phase 2 probes (spec §3, approved 19 Aug 2026) ──────────────────── */

const spendTcp = (budget: Budget): boolean => {
  if (budgetExhausted(budget)) return false;
  budget.subrequests -= 1;
  return true;
};

/**
 * Ask a parent-zone nameserver, non-recursively, who it delegates the
 * domain to. The authority section carries the parent-side NS set; the
 * additional section carries the glue addresses.
 */
async function probeParent(
  domain: string,
  budget: Budget,
  fetcher: typeof fetch,
  tcp: TcpDnsQuery,
): Promise<DnsDetail["parent"]> {
  const labels = domain.split(".");
  if (labels.length < 2) return null;
  const zone = labels.slice(1).join(".");
  const parentNs = await dohQuery(zone, "NS", budget, fetcher);
  const parentHosts = (parentNs?.Answer || [])
    .filter((r) => r.type === 2)
    .map((r) => normaliseNsHost(r.data))
    .slice(0, 3);

  for (const host of parentHosts) {
    const pa = await dohQuery(host, "A", budget, fetcher);
    const ip = (pa?.Answer || [])
      .filter((r) => r.type === 1)
      .map((r) => r.data.trim())
      .find((x) => !isForbiddenAddress(x));
    if (!ip || !spendTcp(budget)) continue;
    const msg = await tcp(ip, domain, QTYPE.NS);
    if (!msg || msg.rcode !== 0) continue;
    const delegation = [...msg.authority, ...msg.answers]
      .filter((r) => r.type === QTYPE.NS && r.name === domain)
      .map((r) => ({ host: normaliseNsHost(r.data), ttl: r.ttl }))
      .slice(0, 13);
    if (!delegation.length) continue;
    const glue = [...msg.additional]
      .filter((r) => r.type === QTYPE.A || r.type === QTYPE.AAAA)
      .map((r) => ({ name: normaliseNsHost(r.name), ip: r.data }))
      .slice(0, 13);
    return { zone, source: host, delegation, glue };
  }
  return null;
}

/* ── the check ───────────────────────────────────────────────────────── */

export async function runDnsCheck(
  domain: string,
  budget: Budget,
  fetcher: typeof fetch = fetch,
  tcp: TcpDnsQuery = tcpDnsQuery,
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

  /* ── second round: table data (spec §6 Phase 1 rendering) ──────────── */

  // Each nameserver's own addresses — the "live IP" column of the NS table.
  const nsHostList = liveNs.slice(0, 6);
  const nsAddressAnswers = await Promise.all(
    nsHostList.map(async (host) => {
      const [ha, haaaa] = await Promise.all([
        dohQuery(host, "A", budget, fetcher),
        dohQuery(host, "AAAA", budget, fetcher),
      ]);
      return {
        host,
        queried: ha !== null || haaaa !== null,
        ips: [...recordsOf(ha, 1), ...recordsOf(haaaa, 28)].slice(0, 4),
      };
    }),
  );
  const registrySet = new Set(registryNs);
  const nsHosts: NsHostInfo[] = nsAddressAnswers.map(({ host, ips }) => ({
    host,
    ips,
    inRegistry: registryNs.length ? registrySet.has(host) : null,
    answering: true,
  }));
  for (const host of registryNs) {
    if (!liveNs.includes(host)) {
      nsHosts.push({ host, ips: [], inRegistry: true, answering: false });
    }
  }

  // MX hosts resolved, then reverse DNS on their addresses (mail servers
  // without PTR records are commonly distrusted by receivers).
  const mxParsed = recordsOf(mx, 15)
    .map((r) => {
      const [prio, host] = r.split(/\s+/);
      return { priority: Number(prio), host: normaliseNsHost(host ?? "") };
    })
    .filter((m) => m.host)
    .sort((x, y) => x.priority - y.priority)
    .slice(0, 3);
  const mxDetail: MxInfo[] = await Promise.all(
    mxParsed.map(async ({ priority, host }) => {
      const ha = await dohQuery(host, "A", budget, fetcher);
      return { priority, host, ips: recordsOf(ha, 1).slice(0, 4), ptr: [] };
    }),
  );
  const ptrTargets = mxDetail.flatMap((m) => m.ips.map((ip) => ({ m, ip }))).slice(0, 4);
  await Promise.all(
    ptrTargets.map(async ({ m, ip }) => {
      const reverse = `${ip.split(".").reverse().join(".")}.in-addr.arpa`;
      const res = await dohQuery(reverse, "PTR", budget, fetcher);
      m.ptr.push({
        ip,
        name: res === null ? null : (recordsOf(res, 12)[0]?.replace(/\.$/, "") ?? null),
      });
    }),
  );

  // Full SOA fields for the table, with plain-language RFC 1912 advice.
  const soaRaw = recordsOf(soa, 6)[0];
  const soaParts = soaRaw?.split(/\s+/) ?? [];
  const soaDetail: DnsDetail["soa"] =
    soaParts.length >= 7
      ? {
          mname: normaliseNsHost(soaParts[0]),
          rname: soaParts[1].replace(/\.$/, ""),
          serial: soaParts[2],
          refresh: Number(soaParts[3]),
          retry: Number(soaParts[4]),
          expire: Number(soaParts[5]),
          minimum: Number(soaParts[6]),
        }
      : null;
  const soaAdvice: string[] = [];
  if (soaDetail) {
    if (soaDetail.refresh < 1200 || soaDetail.refresh > 43200)
      soaAdvice.push(
        `Refresh is ${soaDetail.refresh}s; 1200 to 43200 (20 minutes to 12 hours) is the usual range.`,
      );
    if (soaDetail.retry < 120 || soaDetail.retry > 7200)
      soaAdvice.push(`Retry is ${soaDetail.retry}s; 120 to 7200 is the usual range.`);
    if (soaDetail.expire < 604800 || soaDetail.expire > 2419200)
      soaAdvice.push(
        `Expire is ${soaDetail.expire}s; two to four weeks (1209600 to 2419200) is the usual range.`,
      );
    if (soaDetail.minimum > 10800 || soaDetail.minimum < 300)
      soaAdvice.push(
        `Negative-caching TTL is ${soaDetail.minimum}s; 300 to 10800 (5 minutes to 3 hours) is the usual range. It controls how long "this record does not exist" answers are remembered.`,
      );
  }

  /* ── Phase 2 round: parent delegation + per-server serials ─────────── */

  const parent = await probeParent(domain, budget, fetcher, tcp);
  const serialHosts = nsHosts.filter((h) => h.answering && h.ips.length > 0).slice(0, 4);
  const serials: DnsDetail["serials"] = await Promise.all(
    serialHosts.map(async (h) => {
      const ip = h.ips.find((x) => !x.includes(":")) ?? h.ips[0];
      if (isForbiddenAddress(ip) || !spendTcp(budget)) return { server: h.host, serial: null };
      const msg = await tcp(ip, domain, QTYPE.SOA);
      const record = msg?.rcode === 0 ? msg.answers.find((r) => r.type === QTYPE.SOA) : undefined;
      return { server: h.host, serial: record ? (record.data.split(" ")[2] ?? null) : null };
    }),
  );

  const detail: DnsDetail = {
    registryNs,
    registryObservable: registryNs.length > 0,
    nsHosts,
    soa: soaDetail,
    soaAdvice,
    mx: mxDetail,
    apexAddresses,
    wwwAddresses,
    parent,
    serials,
  };

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
        "Only one nameserver is published. If that single server has a bad day, the domain, website and email together, disappears with it. Two or more, on separate infrastructure, is the long-standing expectation.",
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
          "The registry has one set of nameservers on file, but a different set is answering. The domain can behave inconsistently, working for some visitors and failing for others, and changes made in one place quietly do not apply. Worth resolving with whoever manages the domain.",
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
      limitation: "Not a pass or a failure: the registry-side record simply is not publicly readable for this domain.",
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
          : `All nameservers are operated by one provider (${providers[0]}). That is common and often fine. It does mean that provider is a single point of dependency, which is worth knowing rather than a fault.`,
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
      detail: `www.${domain} does not resolve. Plenty of people still type www, for them, the site is down.`,
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
        "www resolves, but to entirely different addresses than the bare domain. Sometimes deliberate, often a leftover pointing at an old server. Worth confirming both destinations are intended.",
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
        "The registry publishes a DNSSEC fingerprint (DS) for this domain, but the zone itself returned no signing keys. Validating resolvers can treat the whole domain as failed. This usually follows a nameserver move where DNSSEC was not carried over, worth fixing promptly.",
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
        "DNSSEC is not enabled. Most domains in this market do not sign yet, so this is an observation, not a fault. Signing prevents a class of quiet DNS-tampering attacks, and is worth raising with your DNS provider when convenient.",
    });
  }

  /* 9 — every answering nameserver's own name resolves */
  const deadNsHosts = nsAddressAnswers.filter((h) => h.queried && h.ips.length === 0);
  if (deadNsHosts.length > 0) {
    findings.push({
      code: "NS_HOST_UNRESOLVED",
      severity: "warn",
      title: "Nameserver addresses",
      detail:
        "One or more of the published nameserver names does not itself resolve to an address. Resolvers that pick that server will fail and retry elsewhere, which slows every lookup down.",
      evidence: deadNsHosts.map((h) => h.host),
    });
  }

  /* 10 — reverse DNS on the mail servers' addresses */
  const ptrChecked = mxDetail.flatMap((m) => m.ptr);
  if (ptrChecked.length > 0) {
    const missing = ptrChecked.filter((p) => p.name === null);
    findings.push(
      missing.length === 0
        ? {
            code: "MX_PTR_OK",
            severity: "pass",
            title: "Mail server reverse DNS",
            detail: "The mail servers' addresses have matching reverse-DNS (PTR) records. A hygiene signal receiving servers check before trusting mail.",
            evidence: ptrChecked.map((p) => `${p.ip} → ${p.name}`),
          }
        : {
            code: "MX_PTR_MISSING",
            severity: "warn",
            title: "Mail server reverse DNS",
            detail:
              "Some mail-server addresses have no reverse-DNS (PTR) record. Many receiving servers treat that as a spam signal, so delivery can suffer even with correct MX records. Usually fixed by the mail host, not by you.",
            evidence: missing.map((p) => p.ip),
            limitation: "Checked for the first few addresses only; IPv6 reverse zones are not probed.",
          },
    );
  }

  /* 11 — the parent zone's delegation vs the answering nameservers */
  if (parent && liveNs.length > 0) {
    const parentSet = parent.delegation.map((d) => d.host);
    if (sameSet(parentSet, liveNs)) {
      findings.push({
        code: "PARENT_DELEGATION_MATCH",
        severity: "pass",
        title: "Parent delegation",
        detail: `The ${parent.zone} zone's nameserver (${parent.source}) delegates this domain to exactly the servers that are answering.`,
        evidence: parent.delegation.map((d) => `${d.host} (TTL ${d.ttl})`),
      });
    } else {
      findings.push({
        code: "PARENT_DELEGATION_MISMATCH",
        severity: "fail",
        title: "Parent delegation",
        detail:
          "The parent zone delegates this domain to a different set of nameservers than the ones answering. Resolvers that follow the parent's referral can land on servers with stale or missing data. The classic symptom is a site or mail that works for some networks and not others.",
        evidence: [
          `parent (${parent.source}): ${parentSet.join(", ")}`,
          `answering: ${liveNs.join(", ")}`,
        ],
      });
    }

    // Glue vs the nameservers' current addresses. Anycast nameservers
    // legitimately publish several addresses, so glue is only stale when a
    // host's glue set and live set share NO address at all.
    const glueByHost = new Map<string, string[]>();
    for (const g of parent.glue) {
      glueByHost.set(g.name, [...(glueByHost.get(g.name) ?? []), g.ip]);
    }
    const staleGlue = [...glueByHost.entries()]
      .filter(([host, glueIps]) => {
        const live = nsHosts.find((h) => h.host === host);
        return live && live.ips.length > 0 && !glueIps.some((ip) => live.ips.includes(ip));
      })
      .map(([host, glueIps]) => ({ name: host, ip: glueIps.join("/") }));
    if (staleGlue.length > 0) {
      findings.push({
        code: "GLUE_STALE",
        severity: "warn",
        title: "Glue records",
        detail:
          "The parent zone still hands out old addresses (glue) for one or more nameservers. Resolvers usually recover, but lookups are slower and a decommissioned old address would break them. Fixed by updating the nameserver's registered address at the registrar.",
        evidence: staleGlue.map((g) => {
          const live = nsHosts.find((h) => h.host === g.name);
          return `${g.name}: parent says ${g.ip}, server says ${live?.ips.join("/")}`;
        }),
      });
    } else if (parent.glue.length > 0) {
      findings.push({
        code: "GLUE_OK",
        severity: "pass",
        title: "Glue records",
        detail: "The addresses the parent zone hands out for the nameservers match the addresses the nameservers actually use.",
        evidence: parent.glue.map((g) => `${g.name} → ${g.ip}`),
      });
    }
  } else {
    findings.push({
      code: "PARENT_UNOBSERVABLE",
      severity: "info",
      title: "Parent delegation",
      detail:
        "The parent zone's nameservers could not be probed on this run, so the parent-side view of the delegation (and its glue) is unverified this time.",
      limitation: "A lookup limitation on this run, not a finding about the domain.",
    });
  }

  /* 12 — SOA serial agreement across the authoritative servers */
  const knownSerials = serials.filter((s) => s.serial !== null);
  if (knownSerials.length >= 2) {
    const distinct = [...new Set(knownSerials.map((s) => s.serial))];
    findings.push(
      distinct.length === 1
        ? {
            code: "SOA_SYNC",
            severity: "pass",
            title: "Nameserver synchronisation",
            detail: `All ${knownSerials.length} probed nameservers report the same zone serial. They are serving the same version of your DNS.`,
            evidence: [`serial ${distinct[0]}`],
          }
        : {
            code: "SOA_SYNC_MISMATCH",
            severity: "warn",
            title: "Nameserver synchronisation",
            detail:
              "The nameservers report different zone serials, meaning at least one is serving an older copy of your DNS. Often transient after a change; if it persists, zone transfers between the servers are broken.",
            evidence: knownSerials.map((s) => `${s.server}: ${s.serial}`),
          },
    );
  }

  // Presentation category by finding code (spec §6 Phase 1).
  const categoryOf = (code: string): Category =>
    code.startsWith("DELEGATION") || code.startsWith("PARENT") || code.startsWith("GLUE")
      ? "registry"
      : code.startsWith("NS")
        ? "nameservers"
        : code.startsWith("SOA")
          ? "soa"
          : code.startsWith("MX")
            ? "mail"
            : code.startsWith("DNSSEC")
              ? "dnssec"
              : "web";
  for (const f of findings) f.category = categoryOf(f.code);

  const summary = { pass: 0, warn: 0, fail: 0, info: 0 };
  for (const f of findings) summary[f.severity] += 1;

  const headline =
    summary.fail > 0
      ? `${domain} has ${summary.fail} DNS ${summary.fail === 1 ? "issue" : "issues"} that deserve attention.`
      : summary.warn > 0
        ? `${domain} looks broadly coherent, with ${summary.warn} advisory ${summary.warn === 1 ? "finding" : "findings"}.`
        : `${domain}'s DNS foundations look coherent.`;

  return { ok: true, domain, headline, summary, findings, detail };
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

  // 8 rule queries + RDAP (≤3 guarded fetches with their own resolve
  // lookups) + the table round (≤6 NS hosts × 2, ≤3 MX hosts, ≤4 PTRs)
  // + Phase 2: ≤3 DoH for the parent + ≤2 parent TCP + ≤4 serial TCP.
  const budget = makeBudget(18_000, 55);
  const result = await runDnsCheck(domain, budget, fetcher);
  if (!result.ok) return json({ ok: false, error: result.error }, result.status);
  return json(result);
}
