import assert from "node:assert/strict";
import test from "node:test";
import { shouldRecord } from "../worker/pageviews.ts";

async function worker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-dash`);
  return (await import(workerUrl.href)).default;
}

const ctx = { waitUntil() {}, passThroughOnException() {} };

test("/go refuses anything that did not come through Cloudflare Access", async () => {
  const w = await worker();
  const res = await w.fetch(new Request("https://onduu.ke/go"), { onduu_leads: {} }, ctx);
  assert.equal(res.status, 403, "no Access headers means no dashboard");
  const body = await res.text();
  assert.doesNotMatch(body, /business_email|Enquiries, all time/, "must leak no data");
});

test("a client cannot fake its way in without Access headers", async () => {
  const w = await worker();
  // Anything reaching the Worker at onduu.ke/go has passed Access, which sets
  // these itself. A request without them is refused outright.
  for (const headers of [{}, { cookie: "onduu_dash=anything" }, { authorization: "Bearer x" }]) {
    const res = await w.fetch(new Request("https://onduu.ke/go", { headers }), { onduu_leads: {} }, ctx);
    assert.equal(res.status, 403, `should refuse: ${JSON.stringify(headers)}`);
  }
});

test("no token secret is involved any more", async () => {
  const w = await worker();
  // Supplying a token must not be a way in: Access is the only gate.
  const res = await w.fetch(
    new Request("https://onduu.ke/go", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: "token=whatever",
    }),
    { onduu_leads: {}, DASHBOARD_TOKEN: "whatever" },
    ctx,
  );
  assert.equal(res.status, 403, "a token must no longer grant access");
});

test("robots disallows the dashboard", async () => {
  const w = await worker();
  const body = await (await w.fetch(new Request("https://onduu.ke/robots.txt"), {}, ctx)).text();
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
