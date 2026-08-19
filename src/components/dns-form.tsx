"use client";

import { useState } from "react";

type Severity = "pass" | "warn" | "fail" | "info";
type Category = "registry" | "nameservers" | "soa" | "web" | "mail" | "dnssec";

type Finding = {
  code: string;
  severity: Severity;
  category?: Category;
  title: string;
  detail: string;
  evidence?: string[];
  limitation?: string;
  link?: { href: string; label: string };
};

type NsHostInfo = { host: string; ips: string[]; inRegistry: boolean | null; answering: boolean };
type MxInfo = { priority: number; host: string; ips: string[]; ptr: { ip: string; name: string | null }[] };

type Detail = {
  registryNs: string[];
  registryObservable: boolean;
  nsHosts: NsHostInfo[];
  soa: { mname: string; rname: string; serial: string; refresh: number; retry: number; expire: number; minimum: number } | null;
  soaAdvice: string[];
  mx: MxInfo[];
  apexAddresses: string[];
  wwwAddresses: string[];
  parent: {
    zone: string;
    source: string;
    delegation: { host: string; ttl: number }[];
    glue: { name: string; ip: string }[];
  } | null;
  serials: { server: string; serial: string | null }[];
};

type Result = {
  ok: true;
  domain: string;
  headline: string;
  summary: { pass: number; warn: number; fail: number; info: number };
  findings: Finding[];
  detail: Detail;
};

// "fail" renders as ATTENTION: a finding here is a risk observation, not an
// exam result.
const STATUS_WORD: Record<Severity, string> = {
  pass: "OK",
  warn: "ADVISORY",
  fail: "ATTENTION",
  info: "OBSERVED",
};

const CATEGORIES: { key: Category; label: string }[] = [
  { key: "registry", label: "Parent & registry" },
  { key: "nameservers", label: "Nameservers" },
  { key: "soa", label: "Zone record (SOA)" },
  { key: "web", label: "Web addresses" },
  { key: "mail", label: "Mail" },
  { key: "dnssec", label: "DNSSEC" },
];

/* ── the delegation diagram ──────────────────────────────────────────── */

const COLOR: Record<Severity, string> = {
  pass: "#2F6B5B",
  warn: "#B8643B",
  fail: "#a8342a",
  info: "#60707C",
};

function worstIn(findings: Finding[], category: Category): Severity {
  const list = findings.filter((f) => f.category === category);
  if (list.some((f) => f.severity === "fail")) return "fail";
  if (list.some((f) => f.severity === "warn")) return "warn";
  if (list.some((f) => f.severity === "pass")) return "pass";
  return "info";
}

/**
 * Registry → nameservers → services, coloured by status. Pure SVG computed
 * from the report; scrolls horizontally on narrow screens.
 */
function Diagram({ result }: { result: Result }) {
  const { detail, findings, domain } = result;
  const ns = detail.nsHosts.slice(0, 6);
  const colW = 170;
  const width = Math.max(560, ns.length * colW);
  const nsY = 96;
  const svcY = 196;
  const registryStatus = worstIn(findings, "registry");
  const nsX = (i: number) => (width / (ns.length + 1)) * (i + 1);

  const services: { label: string; value: string; status: Severity }[] = [
    {
      label: domain,
      value: detail.apexAddresses.length ? detail.apexAddresses[0] : "no address",
      status: detail.apexAddresses.length ? "pass" : "fail",
    },
    {
      label: `www.${domain}`,
      value: detail.wwwAddresses.length ? detail.wwwAddresses[0] : "no address",
      status: detail.wwwAddresses.length ? "pass" : "warn",
    },
    {
      label: "mail (MX)",
      value: detail.mx.length ? `${detail.mx.length} route${detail.mx.length === 1 ? "" : "s"}` : "none published",
      status: worstIn(findings, "mail"),
    },
  ];
  const svcX = (i: number) => (width / 4) * (i + 1);

  return (
    <div className="dns-diagram" role="img" aria-label="Delegation diagram: registry to nameservers to services">
      <svg viewBox={`0 0 ${width} 236`} width={width} height="236">
        {/* registry node */}
        <g>
          <rect x={width / 2 - 110} y={8} width={220} height={40} fill="none" stroke={COLOR[registryStatus]} strokeWidth="2" strokeDasharray={detail.registryObservable ? undefined : "5 4"} />
          <text x={width / 2} y={25} textAnchor="middle" fontSize="11" fontFamily="Arial" fontWeight="bold" fill="#101820">
            {detail.parent ? `PARENT ZONE .${detail.parent.zone.toUpperCase()}` : "REGISTRY (RDAP)"}
          </text>
          <text x={width / 2} y={40} textAnchor="middle" fontSize="10" fontFamily="Arial" fill="#60707C">
            {detail.parent
              ? `delegates to ${detail.parent.delegation.length} nameservers`
              : detail.registryObservable
                ? `${detail.registryNs.length} nameservers on file`
                : "not observable for this domain"}
          </text>
        </g>

        {/* registry → NS edges and NS nodes */}
        {ns.map((h, i) => {
          const edge =
            h.inRegistry === null ? "#60707C" : h.inRegistry && h.answering ? "#2F6B5B" : "#a8342a";
          const dashed = h.inRegistry === null || !h.answering;
          return (
            <g key={h.host}>
              <line x1={width / 2} y1={48} x2={nsX(i)} y2={nsY - 22} stroke={edge} strokeWidth="1.6" strokeDasharray={dashed ? "5 4" : undefined} />
              <rect x={nsX(i) - 74} y={nsY - 22} width={148} height={44} fill="#fff" stroke={edge} strokeWidth="1.6" strokeDasharray={h.answering ? undefined : "5 4"} />
              <text x={nsX(i)} y={nsY - 5} textAnchor="middle" fontSize="10.5" fontFamily="Menlo,monospace" fill="#101820">
                {h.host.length > 24 ? `${h.host.slice(0, 23)}…` : h.host}
              </text>
              <text x={nsX(i)} y={nsY + 11} textAnchor="middle" fontSize="9.5" fontFamily="Menlo,monospace" fill="#60707C">
                {h.answering ? (h.ips[0] ?? "no address") : "not answering"}
              </text>
            </g>
          );
        })}

        {/* NS tier → service leaves */}
        {services.map((s, i) => (
          <g key={s.label}>
            <line x1={width / 2} y1={nsY + 22} x2={svcX(i)} y2={svcY - 18} stroke={COLOR[s.status]} strokeWidth="1.6" />
            <rect x={svcX(i) - 78} y={svcY - 18} width={156} height={40} fill="#fff" stroke={COLOR[s.status]} strokeWidth="1.6" />
            <text x={svcX(i)} y={svcY - 2} textAnchor="middle" fontSize="10.5" fontFamily="Menlo,monospace" fill="#101820">
              {s.label.length > 26 ? `${s.label.slice(0, 25)}…` : s.label}
            </text>
            <text x={svcX(i)} y={svcY + 13} textAnchor="middle" fontSize="9.5" fontFamily="Arial" fill="#60707C">
              {s.value}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/* ── category tables ─────────────────────────────────────────────────── */

function CategoryTable({ cat, detail }: { cat: Category; detail: Detail }) {
  if (cat === "registry" && detail.parent) {
    const p = detail.parent;
    return (
      <>
        <p className="dns-advice" style={{ borderLeftColor: "var(--green)" }}>
          Asked {p.source} (a .{p.zone} parent server) directly, without caching.
        </p>
        <table className="dns-table">
          <thead><tr><th>Delegated nameserver</th><th>TTL</th><th>Glue address at parent</th></tr></thead>
          <tbody>
            {p.delegation.map((d) => (
              <tr key={d.host}>
                <td>{d.host}</td>
                <td>{d.ttl}</td>
                <td>{p.glue.filter((g) => g.name === d.host).map((g) => g.ip).join(", ") || ", "}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    );
  }
  if (cat === "registry" && detail.registryObservable) {
    return (
      <table className="dns-table">
        <thead><tr><th>Nameserver on file at the registry</th><th>Answering?</th></tr></thead>
        <tbody>
          {detail.registryNs.map((h) => {
            const live = detail.nsHosts.find((n) => n.host === h);
            return (
              <tr key={h}>
                <td>{h}</td>
                <td>{live?.answering ? "yes" : "no"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }
  if (cat === "nameservers" && detail.nsHosts.length > 0) {
    return (
      <table className="dns-table">
        <thead><tr><th>Nameserver</th><th>Address</th><th>At registry?</th></tr></thead>
        <tbody>
          {detail.nsHosts.map((h) => (
            <tr key={h.host}>
              <td>{h.host}</td>
              <td>{h.answering ? (h.ips.join(", ") || ", ") : "not answering"}</td>
              <td>{h.inRegistry === null ? "n/a" : h.inRegistry ? "yes" : "no"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  if (cat === "soa" && detail.soa) {
    const s = detail.soa;
    const rows: [string, string][] = [
      ["Master nameserver", s.mname],
      ["Hostmaster", s.rname],
      ["Serial", s.serial],
      ["Refresh", `${s.refresh}s`],
      ["Retry", `${s.retry}s`],
      ["Expire", `${s.expire}s`],
      ["Negative-caching TTL", `${s.minimum}s`],
    ];
    return (
      <>
        <table className="dns-table">
          <thead><tr><th>Field</th><th>Value</th></tr></thead>
          <tbody>{rows.map(([k, v]) => <tr key={k}><td>{k}</td><td>{v}</td></tr>)}</tbody>
        </table>
        {detail.soaAdvice.map((a) => (
          <p key={a} className="dns-advice">{a}</p>
        ))}
        {detail.serials.length > 0 && (
          <table className="dns-table">
            <thead><tr><th>Authoritative server</th><th>Serial it reports</th></tr></thead>
            <tbody>
              {detail.serials.map((row) => (
                <tr key={row.server}>
                  <td>{row.server}</td>
                  <td>{row.serial ?? "not probed this run"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </>
    );
  }
  if (cat === "web") {
    return (
      <table className="dns-table">
        <thead><tr><th>Name</th><th>Addresses</th></tr></thead>
        <tbody>
          <tr><td>apex</td><td>{detail.apexAddresses.join(", ") || "none"}</td></tr>
          <tr><td>www</td><td>{detail.wwwAddresses.join(", ") || "none"}</td></tr>
        </tbody>
      </table>
    );
  }
  if (cat === "mail" && detail.mx.length > 0) {
    return (
      <table className="dns-table">
        <thead><tr><th>Priority</th><th>Mail server</th><th>Address</th><th>Reverse DNS</th></tr></thead>
        <tbody>
          {detail.mx.map((m) => (
            <tr key={m.host}>
              <td>{m.priority}</td>
              <td>{m.host}</td>
              <td>{m.ips.join(", ") || ", "}</td>
              <td>{m.ptr.map((p) => p.name ?? `${p.ip}: none`).join(", ") || ", "}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  return null;
}

/* ── the form ────────────────────────────────────────────────────────── */

export function DnsForm() {
  const [domain, setDomain] = useState("");
  const [state, setState] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!domain.trim() || state === "loading") return;

    setState("loading");
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/dns?domain=${encodeURIComponent(domain.trim())}`);
      const data = (await response.json()) as Result | { ok: false; error?: string };
      if (!data.ok) setError(data.error || "That check could not be completed.");
      else setResult(data);
    } catch {
      setError("The check could not reach DNS. Try again in a moment.");
    } finally {
      setState("idle");
    }
  }

  return (
    <>
      <form className="check-form dns-form" onSubmit={onSubmit}>
        <label htmlFor="domain">
          Domain name
          <input
            id="domain"
            name="domain"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="yourbusiness.co.ke"
            autoComplete="url"
            autoCapitalize="none"
            spellCheck={false}
            required
          />
        </label>
        <button className="button" type="submit" disabled={state === "loading"}>
          {state === "loading" ? "Reading DNS…" : "Check this domain"}
          <span aria-hidden="true">↗</span>
        </button>
      </form>

      <p className="check-note" role="status" aria-live="polite">
        {state === "loading"
          ? "Querying public DNS and the registry…"
          : "This reads public DNS and registry records only. You need no account to run it."}
      </p>

      {error && (
        <div className="check-error" role="alert">
          {error}
        </div>
      )}

      {result && (
        <div className="check-result">
          <div className="check-headline">
            <div className={`check-score check-${result.summary.fail > 0 ? "fail" : "pass"}`}>
              <b>{result.summary.pass}</b>
              <span>
                of {result.findings.length} checks OK
                {result.summary.fail > 0 ? ` · ${result.summary.fail} need attention` : ""}
              </span>
            </div>
            <div>
              <h2>{result.headline}</h2>
              <p>
                {result.summary.fail > 0
                  ? "Findings marked ATTENTION affect whether this domain works reliably; advisories are worth a look when convenient."
                  : "Nothing observed here blocks the domain from working. Items marked OBSERVED are facts worth knowing, not faults."}
              </p>
            </div>
          </div>

          <Diagram result={result} />

          {CATEGORIES.map(({ key, label }) => {
            const items = result.findings.filter((f) => f.category === key);
            const table = <CategoryTable cat={key} detail={result.detail} />;
            if (items.length === 0 && table === null) return null;
            const counts = (["pass", "warn", "fail", "info"] as const)
              .map((s) => [s, items.filter((f) => f.severity === s).length] as const)
              .filter(([, n]) => n > 0);
            return (
              <section className="dns-cat" key={key}>
                <div className="dns-cat-head">
                  <h3>{label}</h3>
                  <div className="dns-counts">
                    {counts.map(([s, n]) => (
                      <span key={s} className={`check-${s}`}>
                        {n} {STATUS_WORD[s]}
                      </span>
                    ))}
                  </div>
                </div>
                {table}
                <ul className="check-list">
                  {items.map((finding) => (
                    <li key={finding.code} className={`check-${finding.severity}`}>
                      <div className="check-row-head">
                        <h3>{finding.title}</h3>
                        <span className={`check-badge check-${finding.severity}`}>
                          {STATUS_WORD[finding.severity]}
                        </span>
                      </div>
                      <p>{finding.detail}</p>
                      {finding.evidence && finding.evidence.length > 0 && (
                        <code>{finding.evidence.join(" · ")}</code>
                      )}
                      {finding.limitation && <p className="check-limitation">{finding.limitation}</p>}
                      {finding.link && (
                        <p>
                          <a className="text-link" href={finding.link.href}>
                            {finding.link.label} ↗
                          </a>
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}

          <div className="note">
            Resolved over public DNS and RDAP, plus direct read-only questions to the parent zone
            and your own nameservers (standard DNS queries. The same ones every resolver sends).
            DNSSEC is detected, not cryptographically validated; reverse DNS covers the first few
            mail addresses only. A clean result means the public records are coherent. It does not
            prove the domain, the website or the business behind them are secure.
          </div>
        </div>
      )}
    </>
  );
}
