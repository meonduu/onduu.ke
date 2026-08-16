/**
 * /go — private dashboard: enquiries and first-party page views.
 *
 * Access control is Cloudflare Access, bound to onduu.ke/go. Rather than
 * assume that gate is in place, the Worker requires proof of it: Access adds
 * its own headers to every request it lets through, and this refuses anything
 * arriving without them.
 *
 * That matters because Access protects a hostname, not a Worker. The
 * workers.dev route reached the same code without passing Access at all, and
 * has been disabled (`workers_dev: false`). This check is the belt to that
 * braces — if Access is ever removed, reconfigured or bypassed, the dashboard
 * refuses rather than quietly serving enquirers' names and email addresses.
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

function page(title: string, body: string): Response {
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${escape(title)} | Onduu</title>
<style>
:root{--carbon:#101820;--ivory:#F5F1E8;--copper:#B8643B;--green:#2F6B5B;--slate:#60707C;--mist:#DDE3E1}
*{box-sizing:border-box}body{margin:0;background:var(--ivory);color:var(--carbon);font:15px/1.5 Arial,Helvetica,sans-serif}
main{max-width:1100px;margin:0 auto;padding:40px 24px 80px}
h1{font:34px Georgia;margin:0 0 6px}h2{font:24px Georgia;margin:44px 0 12px}
.sub{color:var(--slate);margin:0 0 8px}
table{width:100%;border-collapse:collapse;background:#fff;font-size:13px}
th,td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--mist);vertical-align:top}
th{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--slate)}
td.num{text-align:right;font-variant-numeric:tabular-nums}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:20px 0}
.card{background:#fff;padding:16px;border-left:3px solid var(--copper)}
.card b{display:block;font:28px Georgia}
.card span{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--slate)}
.empty{background:#fff;padding:22px;color:var(--slate)}
form{background:#fff;padding:28px;max-width:420px}
label{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.08em;font-weight:800;margin-bottom:8px}
input{width:100%;padding:13px;border:1px solid #9fa9a4;font:15px Arial}
button{margin-top:14px;background:var(--copper);color:#fff;border:0;padding:13px 22px;font:11px Arial;text-transform:uppercase;letter-spacing:.1em;font-weight:800;cursor:pointer}
.err{color:#8d2b22;margin-top:12px}
a{color:var(--green)}
</style></head><body><main>${body}</main></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } }
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
          .join("")}</tr>`
    )
    .join("")}</tbody></table>`;
}

async function dashboard(env: Env, identity: string): Promise<Response> {
  const db = env.onduu_leads!;

  const [enquiries, counts, topPages, topReferrers, sources, daily] = await Promise.all([
    db
      .prepare(
        `SELECT reference, created_at, full_name, business_email, company, primary_concern,
                COALESCE(utm_source, referrer, 'direct') AS source, landing_path
         FROM submissions ORDER BY created_at DESC LIMIT 100`
      )
      .all(),
    db
      .prepare(
        `SELECT
           (SELECT COUNT(*) FROM submissions) AS enquiries,
           (SELECT COUNT(*) FROM submissions WHERE created_at >= datetime('now','-30 days')) AS enquiries30,
           (SELECT COUNT(*) FROM page_views) AS views,
           (SELECT COUNT(*) FROM page_views WHERE viewed_at >= datetime('now','-30 days')) AS views30`
      )
      .first<{ enquiries: number; enquiries30: number; views: number; views30: number }>(),
    db
      .prepare(
        `SELECT path, COUNT(*) AS n FROM page_views
         WHERE viewed_at >= datetime('now','-30 days')
         GROUP BY path ORDER BY n DESC LIMIT 20`
      )
      .all(),
    db
      .prepare(
        `SELECT referrer_host, COUNT(*) AS n FROM page_views
         WHERE referrer_host IS NOT NULL AND viewed_at >= datetime('now','-30 days')
         GROUP BY referrer_host ORDER BY n DESC LIMIT 15`
      )
      .all(),
    db
      .prepare(
        `SELECT COALESCE(utm_source, referrer, 'direct') AS source,
                COALESCE(landing_path, '-') AS landing, COUNT(*) AS n
         FROM submissions GROUP BY source, landing ORDER BY n DESC LIMIT 20`
      )
      .all(),
    db
      .prepare(
        `SELECT substr(viewed_at,1,10) AS day, COUNT(*) AS n FROM page_views
         WHERE viewed_at >= datetime('now','-14 days')
         GROUP BY day ORDER BY day DESC`
      )
      .all(),
  ]);

  const c = counts!;
  const rows = <T>(r: { results?: unknown[] }) => (r.results ?? []) as T[];

  return page(
    "Dashboard",
    `<h1>Onduu dashboard</h1>
<p class="sub">Enquiries and first-party page views. Nothing here is shared with a third party.<br>Signed in via Cloudflare Access as ${escape(identity)}.</p>

<div class="cards">
  <div class="card"><b>${c.enquiries}</b><span>Enquiries, all time</span></div>
  <div class="card"><b>${c.enquiries30}</b><span>Enquiries, 30 days</span></div>
  <div class="card"><b>${c.views}</b><span>Page views, all time</span></div>
  <div class="card"><b>${c.views30}</b><span>Page views, 30 days</span></div>
</div>

<h2>Which source produced enquiries</h2>
${table(
  ["Source", "Landed on", "Enquiries"],
  rows<{ source: string; landing: string; n: number }>(sources).map((r) => [
    escape(r.source),
    escape(r.landing),
    String(r.n),
  ]),
  "No enquiries yet."
)}

<h2>Enquiries</h2>
${table(
  ["Reference", "Received", "Name", "Email", "Company", "Concern", "Source"],
  rows<Record<string, string>>(enquiries).map((r) => [
    escape(r.reference),
    escape(r.created_at),
    escape(r.full_name),
    `<a href="mailto:${escape(r.business_email)}">${escape(r.business_email)}</a>`,
    escape(r.company),
    escape(r.primary_concern || "-"),
    escape(r.source),
  ]),
  "No enquiries yet."
)}

<h2>Most read, last 30 days</h2>
${table(
  ["Path", "Views"],
  rows<{ path: string; n: number }>(topPages).map((r) => [escape(r.path), String(r.n)]),
  "No page views recorded yet."
)}

<h2>Where readers came from, last 30 days</h2>
${table(
  ["Referring site", "Views"],
  rows<{ referrer_host: string; n: number }>(topReferrers).map((r) => [
    escape(r.referrer_host),
    String(r.n),
  ]),
  "No external referrers recorded yet."
)}

<h2>Daily views, last 14 days</h2>
${table(
  ["Day", "Views"],
  rows<{ day: string; n: number }>(daily).map((r) => [escape(r.day), String(r.n)]),
  "No page views recorded yet."
)}`
  );
}

export async function handleDashboard(request: Request, env: Env): Promise<Response> {
  // Fail closed. No Access headers means the request did not come through
  // Cloudflare Access, so it does not see anything.
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

  return dashboard(env, identity);
}
