import assert from "node:assert/strict";
import test from "node:test";
import { shouldRecord } from "../worker/pageviews.ts";
import { startWorker, fetchPath } from "./helpers/server.mjs";

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
    "/go/kedomains",
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
