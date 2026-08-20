/**
 * /go — private dashboard, split into sections:
 *   /go                    index and headline numbers
 *   /go/enquiries          form submissions and their sources
 *   /go/scans              readiness scan results
 *   /go/email-security     email checker usage
 *   /go/dns                DNS health check usage
 *   /go/kedomains          domain search usage
 *   /go/analytics          first-party page views
 *   /go/routing            outbound clicks to routed destinations
 *   /go/blocklist          do-not-scan list
 *
 * Access control is Cloudflare Access, bound to onduu.ke/go. Rather than
 * assume that gate is in place, the Worker requires proof of it: Access adds
 * its own headers to every request it lets through, and this refuses anything
 * arriving without them — every section, not just the index.
 *
 * That matters because Access protects a hostname path, not a Worker. The
 * workers.dev route reached the same code without passing Access at all, and
 * has been disabled (`workers_dev: false`). This check is the belt to that
 * braces — if Access is ever removed, reconfigured, or does not cover a new
 * /go/* subpath, the dashboard refuses rather than quietly serving
 * enquirers' names and email addresses.
 *
 * The page is noindex and disallowed in robots.
 */

interface Env {
  onduu_leads?: D1Database;
}

/**
 * Cloudflare Access sets these on every request it authenticates, and strips
 * any a client tries to send. Their absence means the request did not come
 * through Access.
 */
function accessIdentity(request: Request): string | null {
  const email = request.headers.get("Cf-Access-Authenticated-User-Email");
  const jwt = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!jwt && !email) return null;
  return email || "authenticated";
}

const escape = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** A link from a dashboard row to the visitor-facing page it describes. */
const publicLink = (path: string, label = `onduu.ke${path === "/" ? "" : path}`) =>
  `<a href="${path}" target="_blank" rel="noopener">${escape(label)}</a>`;

const SECTIONS: [slug: string, label: string][] = [
  ["", "Overview"],
  ["enquiries", "Enquiries"],
  ["scans", "Readiness scans"],
  ["email-security", "Email checker"],
  ["dns", "DNS checker"],
  ["kedomains", "Domain search"],
  ["analytics", "Analytics"],
  ["routing", "Routed clicks"],
  ["blocklist", "Do-not-scan"],
];

/**
 * Content-Security-Policy for the dashboard.
 *
 * The public pages get their CSP from Astro (astro.config.mjs), but /go is an
 * endpoint that builds its own HTML, and worker/security-headers.ts
 * deliberately ships no CSP — so until 20 Aug 2026 the dashboard had none at
 * all. Cloudflare Web Analytics' auto-injected beacon consequently ran here
 * while being refused on every public page, and reported which dashboard
 * pages were opened.
 *
 * This page renders no JavaScript whatsoever, so script-src can be 'none' —
 * an injected script is refused outright rather than allow-listed. The only
 * inline asset is the static <style> block below; styles carry no script
 * capability on a page where scripts cannot run. Sent as a header rather than
 * a meta tag so frame-ancestors applies (a meta CSP cannot carry it).
 */
const DASHBOARD_CSP = [
  "default-src 'none'",
  "script-src 'none'",
  "style-src 'unsafe-inline'",
  "img-src 'self'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join("; ");

function page(title: string, body: string, current: string): Response {
  const nav = SECTIONS.map(
    ([slug, label]) =>
      `<a class="${slug === current ? "on" : ""}" href="/go${slug ? "/" + slug : ""}">${escape(label)}</a>`,
  ).join("");

  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<title>${escape(title)} | Onduu</title>
<style>
:root{--carbon:#101820;--ivory:#F5F1E8;--copper:#B8643B;--green:#2F6B5B;--slate:#60707C;--mist:#DDE3E1}
*{box-sizing:border-box}body{margin:0;background:var(--ivory);color:var(--carbon);font:15px/1.5 Arial,Helvetica,sans-serif}
main{max-width:1100px;margin:0 auto;padding:28px 24px 80px}
h1{font:34px Georgia;margin:0 0 6px}h2{font:24px Georgia;margin:40px 0 12px}
.sub{color:var(--slate);margin:0 0 8px}
nav{display:flex;flex-wrap:wrap;gap:2px;margin:0 0 26px;border-bottom:1px solid var(--mist)}
nav a{padding:10px 14px;font-size:12px;text-transform:uppercase;letter-spacing:.06em;font-weight:700;color:var(--slate);text-decoration:none;border-bottom:3px solid transparent}
nav a:hover{color:var(--carbon)}nav a.on{color:var(--carbon);border-bottom-color:var(--copper)}
table{width:100%;border-collapse:collapse;background:#fff;font-size:13px}
th,td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--mist);vertical-align:top}
th{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--slate)}
td.num{text-align:right;font-variant-numeric:tabular-nums}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:20px 0}
.card{background:#fff;padding:16px;border-left:3px solid var(--copper)}
.card b{display:block;font:28px Georgia}
.card span{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--slate)}
.card a{color:var(--green);font-size:11px}
.empty{background:#fff;padding:22px;color:var(--slate)}
.note{background:#fff;border-left:3px solid var(--slate);padding:18px 20px;margin:18px 0;font-size:13px;line-height:1.7}
.note b{display:block;margin-bottom:6px}
.note ol{margin:10px 0 0;padding-left:20px}
a{color:var(--green)}
.tabs{display:flex;gap:6px;margin:18px 0 6px;flex-wrap:wrap}
.tabs a{padding:7px 12px;border:1px solid var(--mist);border-radius:3px;text-decoration:none;font-size:13px}
.tabs a.on{background:var(--carbon);color:#fff;border-color:var(--carbon)}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;margin:16px 0 6px}
.card{border:1px solid var(--mist);border-radius:3px;padding:14px 16px;background:#fff}
.card small{display:block;text-transform:uppercase;letter-spacing:.08em;font-size:10px;color:var(--slate)}
.card b{display:block;font-size:30px;line-height:1.15;margin:6px 0 4px}
.card span{display:block;font-size:12px;color:var(--slate)}
.basis{display:inline-block;font-style:normal;font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:var(--slate);border:1px solid var(--mist);border-radius:2px;padding:1px 5px;margin-top:8px}
h2 .basis{margin:0 0 0 8px;vertical-align:middle}
.spark{width:100%;height:90px;color:var(--green);display:block;margin:10px 0}
</style></head><body><main><nav>${nav}</nav>${body}</main></body></html>`,
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "Content-Security-Policy": DASHBOARD_CSP,
      },
    },
  );
}

function table(headers: string[], rows: string[][], emptyNote: string): string {
  if (!rows.length) return `<div class="empty">${escape(emptyNote)}</div>`;
  return `<table><thead><tr>${headers
    .map((h) => `<th>${escape(h)}</th>`)
    .join("")}</tr></thead><tbody>${rows
    .map(
      (row) =>
        `<tr>${row
          .map((cell, i) => `<td${i === row.length - 1 ? ' class="num"' : ""}>${cell}</td>`)
          .join("")}</tr>`,
    )
    .join("")}</tbody></table>`;
}

/** Tables from later migrations may be absent on an older database. */
async function safe<T>(q: Promise<T>, fallback: T): Promise<T> {
  try {
    return await q;
  } catch {
    return fallback;
  }
}

const EMPTY = { results: [] } as unknown as D1Result<Record<string, unknown>>;
const rowsOf = <T>(r: { results?: unknown[] }) => (r.results ?? []) as T[];

/* ── sections ────────────────────────────────────────────────────────── */

async function overview(db: D1Database, identity: string): Promise<Response> {
  const notifyHealth = await safe(
    db
      .prepare("SELECT last_outcome, last_code, changed_at FROM notify_health WHERE id = 1")
      .first<{ last_outcome: string; last_code: string | null; changed_at: string }>(),
    undefined,
  );
  const [counts, scanCounts, outbound] = await Promise.all([
    safe(
      db
        .prepare(
          `SELECT
           (SELECT COUNT(*) FROM submissions) AS enquiries,
           (SELECT COUNT(*) FROM submissions WHERE created_at >= datetime('now','-30 days')) AS enquiries30,
           (SELECT COUNT(*) FROM page_views) AS views,
           (SELECT COUNT(*) FROM page_views WHERE viewed_at >= datetime('now','-30 days')) AS views30`,
        )
        .first<{ enquiries: number; enquiries30: number; views: number; views30: number }>(),
      null,
    ),
    safe(
      db
        .prepare(
          `SELECT (SELECT COUNT(*) FROM scans) AS scansAll,
                  (SELECT COUNT(*) FROM scans WHERE created_at >= datetime('now','-30 days')) AS scans30`,
        )
        .first<{ scansAll: number; scans30: number }>(),
      null,
    ),
    safe(
      db
        .prepare(
          `SELECT COUNT(*) AS n FROM page_views WHERE path LIKE '/outbound/%'
             AND viewed_at >= datetime('now','-30 days')`,
        )
        .first<{ n: number }>(),
      null,
    ),
  ]);

  // A missing table must not become a confident zero: an empty dashboard and
  // a broken query look identical to a reader, so say which this is.
  const c = counts;
  const s = scanCounts;
  // One rule for all four cards: an unavailable source shows a dash, never a
  // zero. Two cards saying "0" beside two saying "—" for the same reason
  // would be worse than either.
  const num = (available: boolean, v: number | undefined) => (available ? String(v ?? 0) : "—");

  // The notification status light (lesson L6): the path failed silently
  // from launch to 20 Aug 2026. Green = last attempt delivered; red = the
  // owner is not being told about enquiries RIGHT NOW; amber covers the
  // not-configured and not-yet-migrated states. undefined = query failed
  // (pre-0008 database); null result cannot happen with first().
  const light =
    notifyHealth === undefined
      ? `<div class="note">Notification status unknown — migration 0008 is not applied, so outcomes are not recorded. Apply it: <code>npx wrangler d1 execute onduu-leads --remote --file=migrations/0008_notify_health.sql</code></div>`
      : !notifyHealth
        ? `<div class="note">No enquiry notification has been attempted since migration 0008 was applied.</div>`
        : notifyHealth.last_outcome === "sent"
          ? `<div class="note" style="border-left-color:#2F6B5B;background:#e4ece9">Notifications delivering — last sent ${escape(notifyHealth.changed_at)} UTC.</div>`
          : `<div class="note" style="border-left-color:#a8342a;background:#f6e3e0"><b>Enquiry notifications ${escape(notifyHealth.last_outcome)}</b> since ${escape(notifyHealth.changed_at)} UTC${notifyHealth.last_code ? ` (${escape(notifyHealth.last_code)})` : ""}. Enquiries are still stored — check /go/enquiries and the Worker log, then re-run OPERATIONS.md checklist item 1.</div>`;

  return page(
    "Dashboard",
    `<h1>Onduu dashboard</h1>
<p class="sub">Signed in via Cloudflare Access as ${escape(identity)}. Nothing here is shared with a third party.</p>
${light}

<div class="cards">
  <div class="card"><b>${num(c !== null, c?.enquiries30)}</b><span>Enquiries, 30 days</span><a href="/go/enquiries">All ${num(c !== null, c?.enquiries)} →</a></div>
  <div class="card"><b>${num(s !== null, s?.scans30)}</b><span>Readiness scans, 30 days</span><a href="/go/scans">All ${num(s !== null, s?.scansAll)} →</a></div>
  <div class="card"><b>${num(c !== null, c?.views30)}</b><span>Page views, 30 days</span><a href="/go/analytics">All ${num(c !== null, c?.views)} →</a></div>
  <div class="card"><b>${num(outbound !== null, outbound?.n)}</b><span>Routed clicks, 30 days</span><a href="/go/routing">Detail →</a></div>
</div>

<h2>Sections</h2>
${table(
  ["Section", "What it shows", "Client-facing page"],
  [
    ['<a href="/go/enquiries">Enquiries</a>', "Assessment and contact submissions, with the source that produced them", publicLink("/readiness") + " · " + publicLink("/contact")],
    ['<a href="/go/scans">Readiness scans</a>', "Stored scan results: domain, score, coverage, rubric version", publicLink("/scan")],
    ['<a href="/go/email-security">Email checker</a>', "SPF/DKIM/DMARC checks run, most-checked domains, daily trend", publicLink("/email-security")],
    ['<a href="/go/dns">DNS checker</a>', "DNS health checks run, most-checked domains, daily trend", publicLink("/dns")],
    ['<a href="/go/kedomains">Domain search</a>', "Domain searches run, most-searched names, daily trend", publicLink("/kedomains")],
    ['<a href="/go/analytics">Analytics</a>', "First-party page views: pages, referrers, countries, devices, daily trend", publicLink("/", "onduu.ke (all pages)")],
    ['<a href="/go/routing">Routed clicks</a>', "Outbound clicks to HOSTAFRICA and other routed destinations", publicLink("/paths/hostafrica-infrastructure")],
    ['<a href="/go/blocklist">Do-not-scan</a>', "Domains that asked not to be scanned", publicLink("/legal/tool-limitations")],
  ],
  "",
)}`,
    "",
  );
}

async function enquiries(db: D1Database): Promise<Response> {
  const [list, sources] = await Promise.all([
    safe(
      db
        .prepare(
          `SELECT reference, created_at, full_name, business_email, company, primary_concern,
                COALESCE(utm_source, referrer, 'direct') AS source
         FROM submissions ORDER BY created_at DESC LIMIT 200`,
        )
        .all(),
      EMPTY,
    ),
    safe(
      db
        .prepare(
          `SELECT COALESCE(utm_source, referrer, 'direct') AS source,
                COALESCE(landing_path, '-') AS landing, COUNT(*) AS n
         FROM submissions GROUP BY source, landing ORDER BY n DESC LIMIT 25`,
        )
        .all(),
      EMPTY,
    ),
  ]);

  return page(
    "Enquiries",
    `<h1>Enquiries</h1>
<p class="sub">Assessment and contact submissions. Personal data. Do not export or forward.
Client-facing pages: ${publicLink("/readiness")} · ${publicLink("/contact")}</p>

<h2>Which source produced enquiries</h2>
${table(
  ["Source", "Landed on", "Enquiries"],
  rowsOf<{ source: string; landing: string; n: number }>(sources).map((r) => [
    escape(r.source),
    escape(r.landing),
    String(r.n),
  ]),
  "No enquiries yet.",
)}

<h2>All enquiries</h2>
${table(
  ["Reference", "Received", "Name", "Email", "Company", "Concern", "Source"],
  rowsOf<Record<string, string>>(list).map((r) => [
    escape(r.reference),
    escape(r.created_at),
    escape(r.full_name),
    `<a href="mailto:${escape(r.business_email)}">${escape(r.business_email)}</a>`,
    escape(r.company),
    escape(r.primary_concern || "-"),
    escape(r.source),
  ]),
  "No enquiries yet.",
)}`,
    "enquiries",
  );
}

async function scans(db: D1Database): Promise<Response> {
  const [list, counts, repeats] = await Promise.all([
    safe(
      db
        .prepare(
          `SELECT reference, domain, score, coverage, rubric_version, created_at
           FROM scans ORDER BY created_at DESC LIMIT 100`,
        )
        .all(),
      EMPTY,
    ),
    safe(
      db
        .prepare(
          `SELECT COUNT(*) AS all_time,
                  SUM(CASE WHEN created_at >= datetime('now','-30 days') THEN 1 ELSE 0 END) AS d30,
                  COUNT(DISTINCT domain) AS domains,
                  AVG(score) AS avg_score, AVG(coverage) AS avg_cov
           FROM scans`,
        )
        .first<{ all_time: number; d30: number; domains: number; avg_score: number; avg_cov: number }>(),
      { all_time: 0, d30: 0, domains: 0, avg_score: 0, avg_cov: 0 },
    ),
    safe(
      db
        .prepare(
          `SELECT domain, COUNT(*) AS n, MAX(created_at) AS last_seen
           FROM scans GROUP BY domain HAVING n > 1 ORDER BY n DESC LIMIT 20`,
        )
        .all(),
      EMPTY,
    ),
  ]);
  const c = counts ?? { all_time: 0, d30: 0, domains: 0, avg_score: 0, avg_cov: 0 };

  return page(
    "Readiness scans",
    `<h1>Readiness scans</h1>
<p class="sub">Fresh runs only, a repeat scan inside 24 hours serves the cached result and writes no row.
Client-facing page: ${publicLink("/scan")}</p>

<div class="cards">
  <div class="card"><b>${c.all_time}</b><span>Scans, all time</span></div>
  <div class="card"><b>${c.d30}</b><span>Scans, 30 days</span></div>
  <div class="card"><b>${c.domains}</b><span>Distinct domains</span></div>
  <div class="card"><b>${c.avg_score ? Math.round(c.avg_score) : 0}</b><span>Average signal score</span></div>
  <div class="card"><b>${c.avg_cov ? Math.round(c.avg_cov) : 0}%</b><span>Average coverage</span></div>
</div>

<h2>Domains scanned more than once</h2>
${table(
  ["Domain", "Scans", "Last scan"],
  rowsOf<{ domain: string; n: number; last_seen: string }>(repeats).map((r) => [
    escape(r.domain),
    escape(r.last_seen),
    String(r.n),
  ]),
  "No domain has been scanned twice yet.",
)}

<h2>Recent scans</h2>
${table(
  ["Reference", "Domain", "Score", "Coverage", "Rubric", "When"],
  rowsOf<Record<string, string>>(list).map((r) => [
    escape(r.reference),
    escape(r.domain),
    escape(r.score),
    `${escape(r.coverage)}%`,
    escape(r.rubric_version),
    escape(r.created_at),
  ]),
  "No scans stored yet.",
)}`,
    "scans",
  );
}

/**
 * Usage view for a lookup tool: stored check results (migration 0006) plus
 * page visits for context. Rows carry the domain and outcome only — no
 * visitor identity is recorded with them.
 */
async function toolUsage(
  db: D1Database,
  opts: { slug: string; tool: string; title: string; paths: string[]; blurb: string },
): Promise<Response> {
  const placeholders = opts.paths.map(() => "?").join(",");
  const [checks, recent, top, visits, daily] = await Promise.all([
    safe(
      db
        .prepare(
          `SELECT COUNT(*) AS all_time,
                  SUM(CASE WHEN created_at >= datetime('now','-30 days') THEN 1 ELSE 0 END) AS d30,
                  SUM(CASE WHEN created_at >= datetime('now','-7 days') THEN 1 ELSE 0 END) AS d7,
                  COUNT(DISTINCT query) AS domains
           FROM tool_checks WHERE tool = ?`,
        )
        .bind(opts.tool)
        .first<{ all_time: number; d30: number; d7: number; domains: number }>(),
      { all_time: 0, d30: 0, d7: 0, domains: 0 },
    ),
    safe(
      db
        .prepare(
          `SELECT query, summary, created_at FROM tool_checks
           WHERE tool = ? ORDER BY created_at DESC LIMIT 100`,
        )
        .bind(opts.tool)
        .all(),
      EMPTY,
    ),
    safe(
      db
        .prepare(
          `SELECT query, COUNT(*) AS n, MAX(created_at) AS last_seen FROM tool_checks
           WHERE tool = ? GROUP BY query ORDER BY n DESC, last_seen DESC LIMIT 25`,
        )
        .bind(opts.tool)
        .all(),
      EMPTY,
    ),
    safe(
      db
        .prepare(
          `SELECT COUNT(*) AS all_time,
                  SUM(CASE WHEN viewed_at >= datetime('now','-30 days') THEN 1 ELSE 0 END) AS d30
           FROM page_views WHERE path IN (${placeholders})`,
        )
        .bind(...opts.paths)
        .first<{ all_time: number; d30: number }>(),
      { all_time: 0, d30: 0 },
    ),
    safe(
      db
        .prepare(
          `SELECT substr(created_at,1,10) AS day, COUNT(*) AS n FROM tool_checks
           WHERE tool = ? AND created_at >= datetime('now','-30 days')
           GROUP BY day ORDER BY day DESC`,
        )
        .bind(opts.tool)
        .all(),
      EMPTY,
    ),
  ]);
  const c = checks ?? { all_time: 0, d30: 0, d7: 0, domains: 0 };
  const v = visits ?? { all_time: 0, d30: 0 };

  return page(
    opts.title,
    `<h1>${escape(opts.title)}</h1>
<p class="sub">${escape(opts.blurb)} Stored rows carry the domain and the outcome only, never who ran the check.
Client-facing page: ${publicLink(opts.paths[0])}</p>

<div class="cards">
  <div class="card"><b>${c.all_time}</b><span>Checks, all time</span></div>
  <div class="card"><b>${c.d30}</b><span>Checks, 30 days</span></div>
  <div class="card"><b>${c.d7}</b><span>Checks, 7 days</span></div>
  <div class="card"><b>${c.domains}</b><span>Distinct domains</span></div>
  <div class="card"><b>${v.d30}</b><span>Page visits, 30 days</span></div>
</div>

<h2>Most checked</h2>
${table(
  ["Domain or name", "Last checked", "Checks"],
  rowsOf<{ query: string; n: number; last_seen: string }>(top).map((r) => [
    escape(r.query),
    escape(r.last_seen),
    String(r.n),
  ]),
  "No checks recorded yet.",
)}

<h2>Recent checks</h2>
${table(
  ["When", "Domain or name", "Result"],
  rowsOf<Record<string, string>>(recent).map((r) => [
    escape(r.created_at),
    escape(r.query),
    escape(r.summary || "-"),
  ]),
  "No checks recorded yet. Rows appear here from the moment someone runs a lookup.",
)}

<h2>Daily checks, last 30 days</h2>
${table(
  ["Day", "Checks"],
  rowsOf<{ day: string; n: number }>(daily).map((r) => [escape(r.day), String(r.n)]),
  "No checks recorded yet.",
)}`,
    opts.slug,
  );
}

/* ── analytics ───────────────────────────────────────────────────────── */

// Nairobi is UTC+3 with no daylight saving, so a fixed offset is exact and
// needs no timezone database. D1 stores UTC in 'YYYY-MM-DD HH:MM:SS'.
const TZ_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 86_400_000;
const sqlTime = (ms: number) => new Date(ms).toISOString().slice(0, 19).replace("T", " ");

/** The UTC instant of the most recent Nairobi midnight at or before `ms`. */
function nairobiMidnight(ms: number): number {
  const shifted = new Date(ms + TZ_MS);
  return Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()) - TZ_MS;
}

const RANGES: Record<string, string> = {
  today: "Today",
  yesterday: "Yesterday",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
};

type Range = { key: string; label: string; from: number; to: number; prevFrom: number };

/** Ranges are whole Nairobi days; the comparison period is the same length. */
function rangeOf(url: URL, now: number): Range {
  const key = url.searchParams.get("range") ?? "30d";
  const midnight = nairobiMidnight(now);
  let from = midnight - 29 * DAY_MS;
  let to = now;
  switch (key) {
    case "today":
      from = midnight;
      break;
    case "yesterday":
      from = midnight - DAY_MS;
      to = midnight;
      break;
    case "7d":
      from = midnight - 6 * DAY_MS;
      break;
  }
  const resolved = RANGES[key] ? key : "30d";
  return { key: resolved, label: RANGES[resolved], from, to, prevFrom: from - (to - from) };
}

/** Percentage change against the comparison period, or null when it had none. */
function delta(current: number, previous: number): string {
  if (previous === 0) return current === 0 ? "—" : "new";
  const pct = Math.round(((current - previous) / previous) * 100);
  return `${pct > 0 ? "+" : ""}${pct}%`;
}

function card(label: string, value: string, note: string, basis: string): string {
  return `<article class="card"><small>${escape(label)}</small><b>${escape(value)}</b>
<span>${escape(note)}</span><i class="basis">${escape(basis)}</i></article>`;
}

/** Inline SVG: no chart library, and it degrades to a note when empty. */
function sparkline(points: number[]): string {
  if (points.length < 2) return `<div class="empty">Not enough days in this range to plot.</div>`;
  const max = Math.max(...points, 1);
  const w = 720;
  const h = 90;
  const step = w / (points.length - 1);
  const path = points
    .map((n, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${(h - (n / max) * h).toFixed(1)}`)
    .join(" ");
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img"
 aria-label="Daily views, oldest to newest, peak ${max}"><path d="${path}" fill="none"
 stroke="currentColor" stroke-width="2"/></svg>`;
}

const csvCell = (v: unknown) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

async function analytics(db: D1Database, url: URL): Promise<Response> {
  const now = Date.now();
  const r = rangeOf(url, now);
  const [from, to, prevFrom] = [sqlTime(r.from), sqlTime(r.to), sqlTime(r.prevFrom)];

  // Server-side views are the ground truth: recorded for every HTML response,
  // unblockable, no script required. Everything from `events` is an
  // undercount by design and is labelled as such.
  const viewsIn = (a: string, b: string) =>
    db
      .prepare(
        `SELECT COUNT(*) AS n FROM page_views
         WHERE viewed_at >= ? AND viewed_at < ? AND path NOT LIKE '/outbound/%'`,
      )
      .bind(a, b)
      .first<{ n: number }>();

  const group = (column: string, extra = "") =>
    db
      .prepare(
        `SELECT ${column} AS k, COUNT(*) AS n FROM page_views
         WHERE viewed_at >= ? AND viewed_at < ? AND path NOT LIKE '/outbound/%' ${extra}
         GROUP BY k ORDER BY n DESC LIMIT 25`,
      )
      .bind(from, to)
      .all();

  // Every query is wrapped: a database missing a table must leave the section
  // showing an honest empty state, not collapse the whole page into a 404.
  const [views, prevViews, daily, topPages, referrers, countries, devices] = await Promise.all([
    safe(viewsIn(from, to), null),
    safe(viewsIn(prevFrom, from), null),
    safe(
      db
        .prepare(
          `SELECT substr(datetime(viewed_at,'+3 hours'),1,10) AS day, COUNT(*) AS n
           FROM page_views WHERE viewed_at >= ? AND viewed_at < ? AND path NOT LIKE '/outbound/%'
           GROUP BY day ORDER BY day`,
        )
        .bind(from, to)
        .all(),
      EMPTY,
    ),
    safe(group("path"), EMPTY),
    safe(group("referrer_host", "AND referrer_host IS NOT NULL"), EMPTY),
    safe(group("COALESCE(country,'unknown')"), EMPTY),
    safe(group("COALESCE(device,'unknown')"), EMPTY),
  ]);

  // The events tables arrive with migration 0007; until it is applied these
  // all fail and the coverage panel says so rather than showing a false zero.
  const [eventRows, sessionRows, healthRows, latestRows] = await Promise.all([
    safe(
      db
        .prepare(`SELECT COUNT(*) AS n FROM events WHERE received_at >= ? AND received_at < ?`)
        .bind(from, to)
        .all(),
      EMPTY,
    ),
    safe(
      db
        .prepare(
          `SELECT COUNT(DISTINCT session_id) AS n FROM events
           WHERE received_at >= ? AND received_at < ? AND session_id IS NOT NULL`,
        )
        .bind(from, to)
        .all(),
      EMPTY,
    ),
    safe(
      db
        .prepare(
          `SELECT COALESCE(SUM(received),0) AS received, COALESCE(SUM(rejected),0) AS rejected
           FROM event_health WHERE day >= ?`,
        )
        .bind(from.slice(0, 10))
        .all(),
      EMPTY,
    ),
    safe(db.prepare(`SELECT MAX(received_at) AS t FROM events`).all(), EMPTY),
  ]);

  // Event-derived panels (slice 2). Each is wrapped: before migration 0007,
  // or on a database without the table, they render an honest empty state
  // rather than taking the page down.
  const ev = (sql: string, ...binds: string[]) =>
    safe(db.prepare(sql).bind(...binds).all(), EMPTY);

  const [clicksByLabel, clicksByPath, engagementByPath, entryPages, exitPages] = await Promise.all([
    ev(
      `SELECT COALESCE(label,'(unlabelled)') AS k, COUNT(*) AS n FROM events
       WHERE received_at >= ? AND received_at < ?
         AND event_name IN ('click','conversion','download','outbound_link')
       GROUP BY k ORDER BY n DESC LIMIT 25`,
      from,
      to,
    ),
    ev(
      `SELECT path AS k, COUNT(*) AS n FROM events
       WHERE received_at >= ? AND received_at < ?
         AND event_name IN ('click','conversion','download','outbound_link')
       GROUP BY k ORDER BY n DESC LIMIT 25`,
      from,
      to,
    ),
    // Engaged time is summed from engagement heartbeats and the exit event;
    // views here are the tracker's own page_view count, so the average is
    // consistent within the client data rather than mixing sources.
    ev(
      `SELECT path AS k,
              SUM(engaged_ms) AS ms,
              SUM(CASE WHEN event_name = 'page_view' THEN 1 ELSE 0 END) AS views
       FROM events WHERE received_at >= ? AND received_at < ?
       GROUP BY k HAVING ms > 0 ORDER BY ms DESC LIMIT 25`,
      from,
      to,
    ),
    // Entry and exit are per-session firsts and lasts: a session is one tab
    // in one sitting, so these are estimates, not journeys across visits.
    ev(
      `SELECT path AS k, COUNT(*) AS n FROM (
         SELECT session_id, path, MIN(received_at) AS t FROM events
         WHERE received_at >= ? AND received_at < ? AND event_name = 'page_view'
           AND session_id IS NOT NULL
         GROUP BY session_id
       ) GROUP BY k ORDER BY n DESC LIMIT 15`,
      from,
      to,
    ),
    ev(
      `SELECT path AS k, COUNT(*) AS n FROM (
         SELECT session_id, path, MAX(received_at) AS t FROM events
         WHERE received_at >= ? AND received_at < ? AND event_name IN ('page_view','page_exit')
           AND session_id IS NOT NULL
         GROUP BY session_id
       ) GROUP BY k ORDER BY n DESC LIMIT 15`,
      from,
      to,
    ),
  ]);

  const n = (rows: D1Result<Record<string, unknown>>, key = "n") =>
    Number((rowsOf<Record<string, number>>(rows)[0]?.[key] as number) ?? 0);

  // A failed query and a genuinely quiet period both produce nothing; they
  // must not look the same. null means the source is unavailable.
  const viewsAvailable = views !== null;
  const viewCount = views?.n ?? 0;
  const prevCount = prevViews?.n ?? 0;
  const eventCount = n(eventRows);
  const sessions = n(sessionRows);
  const rejected = n(healthRows, "rejected");
  const latest = (rowsOf<{ t: string | null }>(latestRows)[0]?.t ?? null) as string | null;
  const trackerLive = rowsOf<Record<string, unknown>>(eventRows).length > 0;

  const dailyRows = rowsOf<{ day: string; n: number }>(daily);

  // CSV of whichever table was asked for, over the same range.
  const csv = url.searchParams.get("csv");
  const CSV_SETS: Record<string, { header: string; rows: string[][] }> = {
    pages: {
      header: "path,views",
      rows: rowsOf<{ k: string; n: number }>(topPages).map((x) => [x.k, String(x.n)]),
    },
    referrers: {
      header: "referrer_host,views",
      rows: rowsOf<{ k: string; n: number }>(referrers).map((x) => [x.k, String(x.n)]),
    },
    countries: {
      header: "country,views",
      rows: rowsOf<{ k: string; n: number }>(countries).map((x) => [x.k, String(x.n)]),
    },
    devices: {
      header: "device,views",
      rows: rowsOf<{ k: string; n: number }>(devices).map((x) => [x.k, String(x.n)]),
    },
    daily: { header: "day,views", rows: dailyRows.map((x) => [x.day, String(x.n)]) },
    clicks: {
      header: "element,clicks",
      rows: rowsOf<{ k: string; n: number }>(clicksByLabel).map((x) => [x.k, String(x.n)]),
    },
    engagement: {
      header: "path,engaged_minutes,views",
      rows: rowsOf<{ k: string; ms: number; views: number }>(engagementByPath).map((x) => [
        x.k,
        String(Math.round(x.ms / 60000)),
        String(x.views),
      ]),
    },
    entry: {
      header: "entry_path,sessions",
      rows: rowsOf<{ k: string; n: number }>(entryPages).map((x) => [x.k, String(x.n)]),
    },
    exit: {
      header: "exit_path,sessions",
      rows: rowsOf<{ k: string; n: number }>(exitPages).map((x) => [x.k, String(x.n)]),
    },
  };
  if (csv && CSV_SETS[csv]) {
    const set = CSV_SETS[csv];
    const body = [set.header, ...set.rows.map((row) => row.map(csvCell).join(","))].join("\n");
    return new Response(body, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="onduu-${csv}-${r.key}.csv"`,
        "Cache-Control": "no-store",
        "Content-Security-Policy": DASHBOARD_CSP,
      },
    });
  }

  const q = (extra: string) => `/go/analytics?range=${r.key}${extra}`;
  const tabs = Object.entries(RANGES)
    .map(
      ([key, label]) =>
        `<a class="${key === r.key ? "on" : ""}" href="/go/analytics?range=${key}">${escape(label)}</a>`,
    )
    .join("");

  const keyed = (rows: D1Result<Record<string, unknown>>, head: string, empty: string, link = false) =>
    table(
      [head, "Views"],
      rowsOf<{ k: string; n: number }>(rows).map((x) => [
        link ? publicLink(x.k, x.k) : escape(x.k),
        String(x.n),
      ]),
      empty,
    );

  return page(
    "Analytics",
    `<h1>Analytics</h1>
<p class="sub">First-party only. Server-side page views are recorded for every page served and cannot be blocked; the engagement tracker runs in the browser and is an undercount by design. No address, no fingerprint, no identifier that outlives a tab.</p>

<nav class="tabs">${tabs}</nav>
<p class="sub">${escape(r.label)}: ${escape(from.slice(0, 16))} to ${escape(to.slice(0, 16))} UTC.
Compared with ${escape(prevFrom.slice(0, 16))} to ${escape(from.slice(0, 16))} UTC, the immediately preceding window of identical length. Days are Nairobi days.</p>

<div class="cards">
${
  viewsAvailable
    ? card("Page views", String(viewCount), `${delta(viewCount, prevCount)} vs previous period`, "exact — server-side")
    : card("Page views", "unavailable", "the page_views table is missing", "no source — not a zero")
}
${card("Events received", trackerLive ? String(eventCount) : "not recording", trackerLive ? "from the browser tracker" : "migration 0007 not applied", "undercount — blockers and no-JS")}
${card("Sessions", trackerLive && sessions ? String(sessions) : "—", "one tab, one sitting", "estimated — tab-scoped")}
${card("Rejected events", trackerLive ? String(rejected) : "—", "counted, never stored", "exact — when recording")}
</div>

<h2>Daily views <span class="basis">exact</span></h2>
${sparkline(dailyRows.map((d) => d.n))}
${table(
  ["Day (Nairobi)", "Views"],
  dailyRows.map((d) => [escape(d.day), String(d.n)]).reverse(),
  "No page views in this range.",
)}
<p class="sub"><a href="${q("&csv=daily")}">Download CSV</a></p>

<h2>Most read <span class="basis">exact</span></h2>
${keyed(topPages, "Path", "No page views in this range.", true)}
<p class="sub"><a href="${q("&csv=pages")}">Download CSV</a></p>

<h2>Where readers came from <span class="basis">exact</span></h2>
${keyed(referrers, "Referring site", "No external referrers in this range.")}
<p class="sub"><a href="${q("&csv=referrers")}">Download CSV</a></p>

<h2>Countries <span class="basis">exact</span></h2>
${keyed(countries, "Country", "No page views in this range.")}
<p class="sub"><a href="${q("&csv=countries")}">Download CSV</a></p>

<h2>Devices <span class="basis">exact</span></h2>
${keyed(devices, "Device", "No page views in this range.")}
<p class="sub"><a href="${q("&csv=devices")}">Download CSV</a></p>

<h2>Conversion and clicks <span class="basis">undercount</span></h2>
${
  rowsOf<Record<string, unknown>>(clicksByLabel).length
    ? `${keyed(clicksByLabel, "Element", "No tagged clicks in this range.")}
${keyed(clicksByPath, "Clicked from", "No tagged clicks in this range.")}
<p class="sub"><a href="${q("&csv=clicks")}">Download CSV</a></p>`
    : `<div class="empty">No tagged clicks recorded in this range. Only elements carrying <code>data-analytics-event</code> are counted — the readiness CTAs in the header, the heroes and the homepage were tagged on 20 August 2026, so this fills from that date forward. Outbound clicks to HOSTAFRICA and Ujiajiri are counted separately and server-side: see <a href="/go/routing">Routed clicks</a>.</div>`
}

<h2>Engagement by page <span class="basis">estimated</span></h2>
${table(
  ["Path", "Time on screen", "Avg per view"],
  rowsOf<{ k: string; ms: number; views: number }>(engagementByPath).map((r) => [
    publicLink(r.k, r.k),
    `${Math.round(r.ms / 60000)} min`,
    r.views ? `${Math.round(r.ms / r.views / 1000)}s` : "—",
  ]),
  "No engagement recorded in this range.",
)}
<p class="sub"><a href="${q("&csv=engagement")}">Download CSV</a></p>
<div class="note">Time on screen counts only while the tab is visible and the visitor is active; idle time is excluded. It is an estimate from the browser, so anything that blocks scripts is missing from it. "Avg per view" divides by the tracker's own page views, not the server-side count, so the two sides of the ratio come from the same source.</div>

<h2>Entry pages <span class="basis">estimated</span></h2>
${keyed(entryPages, "First page of a session", "No sessions recorded in this range.")}
<p class="sub"><a href="${q("&csv=entry")}">Download CSV</a></p>

<h2>Exit pages <span class="basis">estimated</span></h2>
${keyed(exitPages, "Last page of a session", "No sessions recorded in this range.")}
<p class="sub"><a href="${q("&csv=exit")}">Download CSV</a></p>
<div class="note">A session is one tab in one sitting — it cannot follow a person across visits or devices. Entry and exit are the first and last page seen within that tab, so a visitor who returns tomorrow appears as a new session with a new entry page.</div>

<h2>Coverage</h2>
${
  trackerLive
    ? table(
        ["Measure", "Value"],
        [
          ["Server-side views (ground truth)", viewsAvailable ? String(viewCount) : "unavailable"],
          ["Client events received", String(eventCount)],
          [
            "Client coverage",
            viewsAvailable && viewCount ? `${Math.round((eventCount / viewCount) * 100)}%` : "—",
          ],
          ["Rejected events", String(rejected)],
          ["Most recent event", latest ? escape(latest) : "none yet"],
        ],
        "No coverage data.",
      )
    : `<div class="empty">The engagement tracker is live in the browser, but migration 0007 has not been applied to this database, so nothing it sends is being stored. Apply it to start recording: <code>npx wrangler d1 execute onduu-leads --remote --file=migrations/0007_analytics_events.sql</code></div>`
}
<div class="note">Client events are always fewer than server-side views: script blockers, disabled JavaScript and visitors who leave before the script runs all suppress them. A gap is expected, not a fault. Server-side views are the number to trust.</div>

<h2>What these numbers mean</h2>
<div class="note"><ol>
<li><b>Exact</b> — counted server-side for every page served. Cannot be blocked.</li>
<li><b>Undercount</b> — sent by the browser, so anything that stops scripts stops the count.</li>
<li><b>Estimated</b> — derived rather than observed. A session is one tab in one sitting; it cannot link two visits or two devices, so it is a proxy for a person, not a count of people.</li>
<li><b>Page views</b> exclude <code>/outbound/*</code>, which are routed-click records rather than pages read.</li>
<li><b>Days</b> are Nairobi days (UTC+3, no daylight saving); the range boundaries above are shown in UTC.</li>
<li><b>Comparison</b> is the immediately preceding period of the same length. "new" means the previous period had none.</li>
<li>Nothing here identifies a person. There is no address, no fingerprint and no identifier that outlives a browser tab.</li>
</ol></div>`,
    "analytics",
  );
}

async function routing(db: D1Database): Promise<Response> {
  const [totals, daily] = await Promise.all([
    safe(
      db
        .prepare(
          `SELECT path, COUNT(*) AS n,
                  SUM(CASE WHEN viewed_at >= datetime('now','-30 days') THEN 1 ELSE 0 END) AS n30
           FROM page_views WHERE path LIKE '/outbound/%' GROUP BY path ORDER BY n DESC`,
        )
        .all(),
      EMPTY,
    ),
    safe(
      db
        .prepare(
          `SELECT substr(viewed_at,1,10) AS day, COUNT(*) AS n FROM page_views
           WHERE path LIKE '/outbound/%' AND viewed_at >= datetime('now','-30 days')
           GROUP BY day ORDER BY day DESC`,
        )
        .all(),
      EMPTY,
    ),
  ]);

  return page(
    "Routed clicks",
    `<h1>Routed clicks</h1>
<p class="sub">The strategy's &ldquo;approved HOSTAFRICA-path clicks&rdquo; measure: how much demand this site routes onward. Counted first-party, with no identity attached.</p>

<h2>By destination</h2>
${table(
  ["Route", "All time", "Last 30 days"],
  rowsOf<{ path: string; n: number; n30: number }>(totals).map((r) => [
    escape(r.path.replace("/outbound/", "")),
    String(r.n),
    String(r.n30),
  ]),
  "No outbound clicks counted yet. They appear when someone follows a routed link.",
)}

<h2>Daily, last 30 days</h2>
${table(
  ["Day", "Clicks"],
  rowsOf<{ day: string; n: number }>(daily).map((r) => [escape(r.day), String(r.n)]),
  "No outbound clicks counted yet.",
)}`,
    "routing",
  );
}

async function blocklist(db: D1Database): Promise<Response> {
  const list = await safe(
    db
      .prepare(`SELECT domain, created_at, note FROM scan_blocklist ORDER BY created_at DESC LIMIT 200`)
      .all(),
    EMPTY,
  );

  return page(
    "Do-not-scan",
    `<h1>Do-not-scan list</h1>
<p class="sub">Domains that asked not to be scanned. A block covers the domain and all its subdomains, and is checked before any network request.</p>

${table(
  ["Domain", "Added", "Note"],
  rowsOf<Record<string, string>>(list).map((r) => [
    escape(r.domain),
    escape(r.created_at),
    escape(r.note || "-"),
  ]),
  "No domains have asked to be excluded.",
)}

<div class="note"><b>Adding a domain</b>
The opt-out command is in <code>docs/runbooks/scan-launch.md</code>: it records the domain here
and deletes any stored scan result for it in one step.</div>`,
    "blocklist",
  );
}

/* ── entry ───────────────────────────────────────────────────────────── */

export async function handleDashboard(
  request: Request,
  env: Env,
  section = "",
): Promise<Response> {
  // Fail closed, on every section. No Access headers means the request did
  // not come through Cloudflare Access, so it sees nothing.
  const identity = accessIdentity(request);
  if (!identity) {
    return new Response("Not available.", {
      status: 403,
      headers: {
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex",
        "Content-Security-Policy": DASHBOARD_CSP,
      },
    });
  }

  if (!env.onduu_leads) {
    return new Response("Dashboard is not configured.", {
      status: 503,
      headers: { "Cache-Control": "no-store", "Content-Security-Policy": DASHBOARD_CSP },
    });
  }

  const db = env.onduu_leads;
  switch (section.replace(/\/$/, "")) {
    case "":
      return overview(db, identity);
    case "enquiries":
      return enquiries(db);
    case "scans":
      return scans(db);
    case "email-security":
      return toolUsage(db, {
        slug: "email-security",
        tool: "email-security",
        title: "Email checker",
        // /check was the tool's route until 18 Aug 2026; keep its history.
        paths: ["/email-security", "/check"],
        blurb: "SPF, DKIM, DMARC and MX checks run by visitors.",
      });
    case "dns":
      return toolUsage(db, {
        slug: "dns",
        tool: "dns",
        title: "DNS checker",
        paths: ["/dns"],
        blurb: "DNS health checks run by visitors: nameservers, delegation, addresses, DNSSEC.",
      });
    case "kedomains":
      return toolUsage(db, {
        slug: "kedomains",
        tool: "kedomains",
        title: "Domain search",
        paths: ["/kedomains", "/domains"],
        blurb: "Kenyan domain searches run by visitors.",
      });
    case "analytics":
      return analytics(db, new URL(request.url));
    case "routing":
      return routing(db);
    case "blocklist":
      return blocklist(db);
    default:
      return page(
        "Not found",
        `<h1>No such section</h1><p class="sub">Pick one from the tabs above.</p>`,
        "",
      );
  }
}
