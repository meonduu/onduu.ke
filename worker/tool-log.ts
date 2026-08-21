/**
 * Result logging for the two lookup tools (migration 0006).
 *
 * Owner decision, 18 Aug 2026: store what was searched and what was found,
 * so demand and common failures are visible in the dashboard. The privacy
 * notice and both tool pages were changed in the same release to say so.
 *
 * The hard rule this module enforces: a row records the DOMAIN and the
 * RESULT, never the visitor. No address, no hash of one, no account, no
 * session identifier is passed in or written. Logging is best-effort — a
 * failure here must never break a visitor's lookup.
 */

import { isDomainBlocklisted } from "./scan/store.ts";

export type ToolName = "email-security" | "domains" | "dns";

export interface ToolCheck {
  tool: ToolName;
  query: string;
  summary: string;
  detail?: unknown;
  /** Domains this check concerned; any one opted out means nothing is kept. */
  domains?: string[];
}

export async function logToolCheck(db: D1Database | undefined, check: ToolCheck): Promise<void> {
  if (!db) return;
  try {
    // A domain owner who opted out is not recorded again. The lookup itself
    // still worked — only the record is withheld (worker/scan/store.ts).
    const subjects = check.domains?.length ? check.domains : [check.query];
    for (const subject of subjects) {
      if (subject.includes(".") && (await isDomainBlocklisted(db, subject))) return;
    }
  } catch {
    /* blocklist unreadable: fall through and log, as before */
  }
  try {
    await db
      .prepare(
        "INSERT INTO tool_checks (tool, query, summary, detail, created_at) VALUES (?, ?, ?, ?, ?)",
      )
      .bind(
        check.tool,
        check.query.slice(0, 253),
        check.summary.slice(0, 300),
        check.detail === undefined ? null : JSON.stringify(check.detail).slice(0, 4000),
        new Date().toISOString(),
      )
      .run();
  } catch {
    /* best effort: never break the lookup a visitor asked for */
  }
}

/* ── summaries: one readable line per tool ───────────────────────────── */

interface EmailCheckBody {
  ok?: boolean;
  domain?: string;
  score?: number;
  grade?: string;
  spoofable?: boolean;
  mailConfigured?: boolean;
  provider?: string | null;
  checks?: Record<string, { status?: string }>;
}

export function summariseEmailCheck(body: EmailCheckBody): ToolCheck | null {
  if (!body?.ok || !body.domain) return null;
  const statuses = Object.entries(body.checks ?? {})
    .map(([k, v]) => `${k}:${v?.status ?? "?"}`)
    .join(" ");
  return {
    tool: "email-security",
    query: body.domain,
    domains: [body.domain],
    summary: `${body.score ?? "-"}/100 ${body.grade ?? ""}`.trim() + (statuses ? `, ${statuses}` : ""),
    detail: {
      score: body.score,
      grade: body.grade,
      spoofable: body.spoofable,
      mailConfigured: body.mailConfigured,
      provider: body.provider ?? null,
      checks: Object.fromEntries(
        Object.entries(body.checks ?? {}).map(([k, v]) => [k, v?.status ?? null]),
      ),
    },
  };
}

interface DnsCheckBody {
  ok?: boolean;
  domain?: string;
  headline?: string;
  summary?: { pass?: number; warn?: number; fail?: number; info?: number };
  findings?: { code?: string; severity?: string }[];
}

export function summariseDnsCheck(body: DnsCheckBody): ToolCheck | null {
  if (!body?.ok || !body.domain) return null;
  const s = body.summary ?? {};
  return {
    tool: "dns",
    query: body.domain,
    domains: [body.domain],
    summary: `${s.pass ?? 0} pass · ${s.warn ?? 0} advisory · ${s.fail ?? 0} attention · ${s.info ?? 0} observed`,
    detail: (body.findings ?? []).map((f) => ({ code: f.code ?? null, severity: f.severity ?? null })),
  };
}

interface DomainSearchBody {
  ok?: boolean;
  query?: string;
  results?: { domain: string; status: string; registrar?: string | null; locked?: boolean }[];
}

export function summariseDomainSearch(body: DomainSearchBody): ToolCheck | null {
  if (!body?.ok || !body.query || !body.results?.length) return null;
  return {
    tool: "domains",
    query: body.query,
    // The typed query may be a bare name; the blocklist is checked against
    // the domains the search actually concerned.
    domains: body.results.map((r) => r.domain),
    summary: body.results.map((r) => `${r.domain}: ${r.status}`).join(" · "),
    detail: body.results.map((r) => ({
      domain: r.domain,
      status: r.status,
      registrar: r.registrar ?? null,
      locked: r.locked ?? null,
    })),
  };
}
