/**
 * /go — private dashboard, split into sections:
 *   /go                    index and headline numbers
 *   /go/enquiries          form submissions and their sources
 *   /go/scans              readiness scan results
 *   /go/email-security     email checker usage
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

const SECTIONS: [slug: string, label: string][] = [
  ["", "Overview"],
  ["enquiries", "Enquiries"],
  ["scans", "Readiness scans"],
  ["email-security", "Email checker"],
  ["kedomains", "Domain search"],
  ["analytics", "Analytics"],
  ["routing", "Routed clicks"],
  ["blocklist", "Do-not-scan"],
];

function page(title: string, body: string, current: string): Response {
  const nav = SECTIONS.map(
    ([slug, label]) =>
      `<a class="${slug === current ? "on" : ""}" href="/go${slug ? "/" + slug : ""}">${escape(label)}</a>`,
  ).join("");

  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex, nofollow">
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
</style></head><body><main><nav>${nav}</nav>${body}</main></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
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
  const [counts, scanCounts, outbound] = await Promise.all([
    db
      .prepare(
        `SELECT
           (SELECT COUNT(*) FROM submissions) AS enquiries,
           (SELECT COUNT(*) FROM submissions WHERE created_at >= datetime('now','-30 days')) AS enquiries30,
           (SELECT COUNT(*) FROM page_views) AS views,
           (SELECT COUNT(*) FROM page_views WHERE viewed_at >= datetime('now','-30 days')) AS views30`,
      )
      .first<{ enquiries: number; enquiries30: number; views: number; views30: number }>(),
    safe(
      db
        .prepare(
          `SELECT (SELECT COUNT(*) FROM scans) AS scansAll,
                  (SELECT COUNT(*) FROM scans WHERE created_at >= datetime('now','-30 days')) AS scans30`,
        )
        .first<{ scansAll: number; scans30: number }>(),
      { scansAll: 0, scans30: 0 },
    ),
    safe(
      db
        .prepare(
          `SELECT COUNT(*) AS n FROM page_views WHERE path LIKE '/outbound/%'
             AND viewed_at >= datetime('now','-30 days')`,
        )
        .first<{ n: number }>(),
      { n: 0 },
    ),
  ]);

  const c = counts!;
  const s = scanCounts ?? { scansAll: 0, scans30: 0 };

  return page(
    "Dashboard",
    `<h1>Onduu dashboard</h1>
<p class="sub">Signed in via Cloudflare Access as ${escape(identity)}. Nothing here is shared with a third party.</p>

<div class="cards">
  <div class="card"><b>${c.enquiries30}</b><span>Enquiries, 30 days</span><a href="/go/enquiries">All ${c.enquiries} →</a></div>
  <div class="card"><b>${s.scans30}</b><span>Readiness scans, 30 days</span><a href="/go/scans">All ${s.scansAll} →</a></div>
  <div class="card"><b>${c.views30}</b><span>Page views, 30 days</span><a href="/go/analytics">All ${c.views} →</a></div>
  <div class="card"><b>${outbound?.n ?? 0}</b><span>Routed clicks, 30 days</span><a href="/go/routing">Detail →</a></div>
</div>

<h2>Sections</h2>
${table(
  ["Section", "What it shows", ""],
  [
    ['<a href="/go/enquiries">Enquiries</a>', "Assessment and contact submissions, with the source that produced them", ""],
    ['<a href="/go/scans">Readiness scans</a>', "Stored scan results: domain, score, coverage, rubric version", ""],
    ['<a href="/go/email-security">Email checker</a>', "SPF/DKIM/DMARC checks run, most-checked domains, daily trend", ""],
    ['<a href="/go/kedomains">Domain search</a>', "Domain searches run, most-searched names, daily trend", ""],
    ['<a href="/go/analytics">Analytics</a>', "First-party page views: pages, referrers, countries, devices, daily trend", ""],
    ['<a href="/go/routing">Routed clicks</a>', "Outbound clicks to HOSTAFRICA and other routed destinations", ""],
    ['<a href="/go/blocklist">Do-not-scan</a>', "Domains that asked not to be scanned", ""],
  ],
  "",
)}`,
    "",
  );
}

async function enquiries(db: D1Database): Promise<Response> {
  const [list, sources] = await Promise.all([
    db
      .prepare(
        `SELECT reference, created_at, full_name, business_email, company, primary_concern,
                COALESCE(utm_source, referrer, 'direct') AS source
         FROM submissions ORDER BY created_at DESC LIMIT 200`,
      )
      .all(),
    db
      .prepare(
        `SELECT COALESCE(utm_source, referrer, 'direct') AS source,
                COALESCE(landing_path, '-') AS landing, COUNT(*) AS n
         FROM submissions GROUP BY source, landing ORDER BY n DESC LIMIT 25`,
      )
      .all(),
  ]);

  return page(
    "Enquiries",
    `<h1>Enquiries</h1>
<p class="sub">Assessment and contact submissions. Personal data — do not export or forward.</p>

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
<p class="sub">Fresh runs only — a repeat scan inside 24 hours serves the cached result and writes no row.</p>

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
<p class="sub">${escape(opts.blurb)} Stored rows carry the domain and the outcome only — never who ran the check.</p>

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

async function analytics(db: D1Database): Promise<Response> {
  const [topPages, referrers, daily, countries, devices] = await Promise.all([
    db
      .prepare(
        `SELECT path, COUNT(*) AS n FROM page_views
         WHERE viewed_at >= datetime('now','-30 days') AND path NOT LIKE '/outbound/%'
         GROUP BY path ORDER BY n DESC LIMIT 30`,
      )
      .all(),
    db
      .prepare(
        `SELECT referrer_host, COUNT(*) AS n FROM page_views
         WHERE referrer_host IS NOT NULL AND viewed_at >= datetime('now','-30 days')
         GROUP BY referrer_host ORDER BY n DESC LIMIT 20`,
      )
      .all(),
    db
      .prepare(
        `SELECT substr(viewed_at,1,10) AS day, COUNT(*) AS n FROM page_views
         WHERE viewed_at >= datetime('now','-30 days') GROUP BY day ORDER BY day DESC`,
      )
      .all(),
    db
      .prepare(
        `SELECT COALESCE(country,'unknown') AS country, COUNT(*) AS n FROM page_views
         WHERE viewed_at >= datetime('now','-30 days') GROUP BY country ORDER BY n DESC LIMIT 15`,
      )
      .all(),
    db
      .prepare(
        `SELECT COALESCE(device,'unknown') AS device, COUNT(*) AS n FROM page_views
         WHERE viewed_at >= datetime('now','-30 days') GROUP BY device ORDER BY n DESC`,
      )
      .all(),
  ]);

  return page(
    "Analytics",
    `<h1>Analytics</h1>
<p class="sub">First-party page views, recorded server-side. No address, no fingerprint, no identifier — two views cannot be linked to one person.</p>

<h2>Most read, last 30 days</h2>
${table(
  ["Path", "Views"],
  rowsOf<{ path: string; n: number }>(topPages).map((r) => [escape(r.path), String(r.n)]),
  "No page views recorded yet.",
)}

<h2>Where readers came from</h2>
${table(
  ["Referring site", "Views"],
  rowsOf<{ referrer_host: string; n: number }>(referrers).map((r) => [escape(r.referrer_host), String(r.n)]),
  "No external referrers recorded yet.",
)}

<h2>Countries</h2>
${table(
  ["Country", "Views"],
  rowsOf<{ country: string; n: number }>(countries).map((r) => [escape(r.country), String(r.n)]),
  "No page views recorded yet.",
)}

<h2>Devices</h2>
${table(
  ["Device", "Views"],
  rowsOf<{ device: string; n: number }>(devices).map((r) => [escape(r.device), String(r.n)]),
  "No page views recorded yet.",
)}

<h2>Daily views</h2>
${table(
  ["Day", "Views"],
  rowsOf<{ day: string; n: number }>(daily).map((r) => [escape(r.day), String(r.n)]),
  "No page views recorded yet.",
)}`,
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
  "No outbound clicks counted yet — they appear when someone follows a routed link.",
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
      headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
    });
  }

  if (!env.onduu_leads) {
    return new Response("Dashboard is not configured.", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
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
    case "kedomains":
      return toolUsage(db, {
        slug: "kedomains",
        tool: "kedomains",
        title: "Domain search",
        paths: ["/kedomains", "/domains"],
        blurb: "Kenyan domain searches run by visitors.",
      });
    case "analytics":
      return analytics(db);
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
