import assert from "node:assert/strict";
import test from "node:test";
import { shouldRecord } from "../worker/pageviews.ts";
import { startWorker, startWorkerWithoutSchema, fetchPath } from "./helpers/server.mjs";

// The vinext harness injected a stub env ({ onduu_leads: {} }, DASHBOARD_TOKEN)
// straight into worker.fetch. The Astro Worker runs in real workerd, so the
// token is supplied as a dev var instead — the assertions are unchanged: no
// Access headers means no dashboard, token or not.
await startWorker(["--var", "DASHBOARD_TOKEN:whatever"]);

test("/go refuses anything that did not come through Cloudflare Access", async () => {
  const res = await fetchPath("/go");
  assert.equal(res.status, 403, "no Access headers means no dashboard");
  const body = await res.text();
  assert.doesNotMatch(body, /business_email|Enquiries, all time/, "must leak no data");
});

test("EVERY dashboard section refuses without Access headers", async () => {
  // The Access policy protects a hostname path; if it ever fails to cover a
  // new /go/* subpath, this fail-closed check is what stops enquirers' names
  // and email addresses being served to the open internet.
  const sections = [
    "/go",
    "/go/enquiries",
    "/go/scans",
    "/go/email-security",
    "/go/dns",
    "/go/domains",
    "/go/analytics",
    "/go/routing",
    "/go/blocklist",
    "/go/anything-else",
  ];
  for (const path of sections) {
    const res = await fetchPath(path);
    assert.equal(res.status, 403, `${path} must refuse without Access`);
    const body = await res.text();
    assert.doesNotMatch(body, /business_email|Enquiries, all time|@/, `${path} must leak nothing`);
  }
});

test("a client cannot fake its way in without Access headers", async () => {
  // Anything reaching the Worker at onduu.ke/go has passed Access, which sets
  // these itself. A request without them is refused outright.
  for (const headers of [{}, { cookie: "onduu_dash=anything" }, { authorization: "Bearer x" }]) {
    const res = await fetchPath("/go", "text/html", { headers });
    assert.equal(res.status, 403, `should refuse: ${JSON.stringify(headers)}`);
  }
});

test("no token secret is involved any more", async () => {
  // Supplying a token must not be a way in: Access is the only gate.
  const res = await fetchPath("/go", "text/html", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: "token=whatever",
  });
  assert.equal(res.status, 403, "a token must no longer grant access");
});

test("robots disallows the dashboard", async () => {
  const body = await (await fetchPath("/robots.txt", "text/plain")).text();
  assert.match(body, /Disallow: \/go/);
});

test("page views record real HTML pages only", () => {
  const html = new Response("", { headers: { "content-type": "text/html" } });
  assert.equal(shouldRecord(new Request("https://onduu.ke/insights"), html), true);
  assert.equal(shouldRecord(new Request("https://onduu.ke/go"), html), false);
  assert.equal(
    shouldRecord(
      new Request("https://onduu.ke/app.js"),
      new Response("", { headers: { "content-type": "application/javascript" } }),
    ),
    false,
  );
  assert.equal(
    shouldRecord(
      new Request("https://onduu.ke/missing"),
      new Response("", { status: 404, headers: { "content-type": "text/html" } }),
    ),
    false,
  );
  assert.equal(
    shouldRecord(new Request("https://onduu.ke/", { headers: { "user-agent": "Googlebot/2.1" } }), html),
    false,
  );
  assert.equal(shouldRecord(new Request("https://onduu.ke/", { method: "POST" }), html), false);
});

test("the dashboard carries its own CSP, and it forbids script entirely", async () => {
  // /go builds its own HTML and gets no CSP from Astro, so until 20 Aug 2026
  // it shipped none — which is why Cloudflare's auto-injected beacon ran here
  // while being refused on every public page. The dashboard renders no
  // JavaScript, so script-src stays 'none': adding a script to /go must be a
  // deliberate act that also weakens this policy, not an accident.
  const res = await fetchPath("/go");
  const csp = res.headers.get("content-security-policy") ?? "";
  assert.match(csp, /default-src 'none'/, "dashboard must default to denying everything");
  assert.match(csp, /script-src 'none'/, "the dashboard must run no script at all");
  assert.match(csp, /frame-ancestors 'none'/, "sent as a header so frame-ancestors applies");
  assert.doesNotMatch(csp, /script-src[^;]*unsafe-inline/, "never allow inline script here");
  assert.doesNotMatch(
    csp,
    /cloudflareinsights|static\.cloudflare/,
    "no third-party beacon may be allow-listed on the private dashboard",
  );
});

// Cloudflare Access strips client-supplied Cf-Access-* headers in production
// and sets its own, so sending one here simulates an already-authenticated
// request. That is the only way to exercise the rendered dashboard locally.
const asOwner = (path) =>
  fetchPath(path, "text/html", { headers: { "Cf-Access-Authenticated-User-Email": "owner@example.test" } });

test("the analytics section renders ranges, bases and a coverage panel", async () => {
  const res = await asOwner("/go/analytics?range=30d");
  assert.equal(res.status, 200, "an authenticated request should render");
  const html = await res.text();

  for (const range of ["today", "yesterday", "7d", "30d"]) {
    assert.match(html, new RegExp(`range=${range}"`), `missing the ${range} range`);
  }
  // Every metric must declare what it is. Page views are exact when the table
  // exists and explicitly unavailable when it does not — a missing source must
  // never be rendered as a zero, which would read as "no traffic".
  assert.match(
    html,
    /exact — server-side|no source — not a zero/,
    "page views must be labelled exact, or declared unavailable",
  );
  assert.match(html, /undercount/, "client events must be labelled an undercount");
  assert.match(html, /estimated — tab-scoped/, "sessions must be labelled estimated");
  // The comparison window is stated outright rather than as a rounded day count.
  assert.match(html, /Compared with .* the immediately preceding window/, "comparison window must be explicit");
  assert.match(html, /Server-side views \(ground truth\)|migration 0007 has not been applied/,
    "coverage must either report or explain its absence");
});

test("the analytics section refuses to be steered by its own query string", async () => {
  // range and csv come from the URL, so both must fall back rather than
  // reaching a query or a file path.
  const bogus = await asOwner("/go/analytics?range=../../etc/passwd");
  assert.equal(bogus.status, 200);
  assert.match(await bogus.text(), /Last 30 days/, "an unknown range must fall back to the default");

  const notCsv = await asOwner("/go/analytics?csv=../../secret");
  assert.match(notCsv.headers.get("content-type") ?? "", /text\/html/, "an unknown csv key must not export");
});

test("analytics CSV export is a real download, scoped to the range", async () => {
  const res = await asOwner("/go/analytics?range=7d&csv=pages");
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type") ?? "", /text\/csv/);
  assert.match(res.headers.get("content-disposition") ?? "", /attachment; filename="onduu-pages-7d\.csv"/);
  assert.match(res.headers.get("content-security-policy") ?? "", /script-src 'none'/, "export keeps the policy");
  assert.match((await res.text()).split("\n")[0], /^path,views$/, "CSV needs a header row");
});

const SECTIONS = [
  "/go",
  "/go/enquiries",
  "/go/scans",
  "/go/email-security",
  "/go/dns",
  "/go/domains",
  "/go/analytics",
  "/go/routing",
  "/go/blocklist",
];

test("every dashboard section renders an honest empty state on a fresh schema", async () => {
  // Since 21 Aug 2026 the harness applies the migrations, so this is the
  // state right after deploy: every table present, every table empty.
  for (const path of SECTIONS) {
    const res = await asOwner(path);
    assert.equal(res.status, 200, `${path} must render rather than fail`);
    const html = await res.text();
    assert.match(html, /<h1>/, `${path} rendered no page`);
    assert.doesNotMatch(html, /ROUTE NOT FOUND/, `${path} fell through to the site 404`);
  }
});

test("with real, empty tables the overview shows zeros — a true count, not an excuse", async () => {
  const html = await (await asOwner("/go")).text();
  assert.doesNotMatch(
    html,
    /migration 00\d\d is not applied/,
    "every migration is applied here; a 'not applied' notice would be the dashboard misreading its own database",
  );
});

test("the overview shows a notification status light in every database state", async () => {
  // Lesson L6: the notification path failed silently from launch to
  // 20 Aug 2026. The overview must always say something about it — green,
  // red, "never attempted", or "migration 0008 not applied" — and the
  // harness database has no tables, so this exercises the last of those.
  const html = await (await asOwner("/go")).text();
  assert.match(
    html,
    /Notifications delivering|Enquiry notifications|No enquiry notification has been attempted|migration 0008 is not applied/,
    "the overview must always state the notification path's condition",
  );
});

/* ── a database with no tables at all ───────────────────────────────── */
// The state production is in between a deploy and `migrations apply` —
// exactly where it sits for migration 0010 until the owner runs it. This
// tears the shared Worker down, so it stays the last test in the file.

test("with no tables, every section still renders and the overview says '—', not 0", async () => {
  await startWorkerWithoutSchema();
  for (const path of SECTIONS) {
    const res = await asOwner(path);
    assert.equal(res.status, 200, `${path} must render rather than fail on a bare database`);
    const html = await res.text();
    assert.match(html, /<h1>/, `${path} rendered no page`);
  }
  // This is the failure that took /go/analytics down as a 404 before
  // v4.48.0: one throwing query collapsing a whole page. And "0 enquiries"
  // from a table that does not exist would read as "nobody wrote in".
  const overview = await (await asOwner("/go")).text();
  assert.match(overview, /—/, "counts from an unavailable table must not render as 0");
  assert.match(overview, /migration 0008 is not applied/, "the notification light must name the missing migration");
});
