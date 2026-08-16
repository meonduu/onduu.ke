import assert from "node:assert/strict";
import test from "node:test";
import { shouldRecord } from "../worker/pageviews.ts";

async function worker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-dash`);
  return (await import(workerUrl.href)).default;
}

const ctx = { waitUntil() {}, passThroughOnException() {} };

test("/go is unreachable when no token is configured", async () => {
  const w = await worker();
  const res = await w.fetch(new Request("https://onduu.ke/go"), {}, ctx);
  assert.equal(res.status, 503, "must fail closed, never render without a token");
  const body = await res.text();
  assert.doesNotMatch(body, /business_email|Enquiries, all time/, "must leak no data");
});

test("/go shows only a sign-in prompt without a valid session", async () => {
  const w = await worker();
  const res = await w.fetch(
    new Request("https://onduu.ke/go"),
    { DASHBOARD_TOKEN: "test-token", onduu_leads: {} },
    ctx,
  );
  const body = await res.text();
  assert.match(body, /Access token/, "should offer sign-in");
  assert.doesNotMatch(body, /Enquiries, all time/, "must not render the dashboard");
  assert.match(body, /noindex/, "must not be indexable");
});

test("a wrong token is rejected and sets no session", async () => {
  const w = await worker();
  const res = await w.fetch(
    new Request("https://onduu.ke/go", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: "token=wrong",
    }),
    { DASHBOARD_TOKEN: "correct-token", onduu_leads: {} },
    ctx,
  );
  assert.equal(res.headers.get("set-cookie"), null, "must not issue a session");
  assert.match(await res.text(), /not accepted/);
});

test("a correct token issues a hardened, expiring session cookie", async () => {
  const w = await worker();
  const res = await w.fetch(
    new Request("https://onduu.ke/go", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: "token=correct-token",
    }),
    { DASHBOARD_TOKEN: "correct-token", onduu_leads: {} },
    ctx,
  );
  assert.equal(res.status, 303);
  const cookie = res.headers.get("set-cookie") ?? "";
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /Secure/);
  assert.match(cookie, /SameSite=Strict/);
  assert.match(cookie, /Max-Age=43200/, "12 hour session");
  assert.doesNotMatch(cookie, /correct-token/, "the secret must never reach the browser");
});

test("a forged session cookie is refused", async () => {
  const w = await worker();
  const res = await w.fetch(
    new Request("https://onduu.ke/go", {
      headers: { cookie: `onduu_dash=${encodeURIComponent(`${Date.now() + 9e6}.deadbeef`)}` },
    }),
    { DASHBOARD_TOKEN: "correct-token", onduu_leads: {} },
    ctx,
  );
  assert.match(await res.text(), /Access token/, "a bad signature must not sign you in");
});

test("robots disallows the dashboard", async () => {
  const w = await worker();
  const body = await (
    await w.fetch(new Request("https://onduu.ke/robots.txt"), {}, ctx)
  ).text();
  assert.match(body, /Disallow: \/go/);
});

test("page views record real HTML pages only", () => {
  const html = new Response("", { headers: { "content-type": "text/html" } });
  assert.equal(shouldRecord(new Request("https://onduu.ke/insights"), html), true);

  // Never the dashboard, never assets, never errors, never bots.
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
    shouldRecord(
      new Request("https://onduu.ke/", { headers: { "user-agent": "Googlebot/2.1" } }),
      html,
    ),
    false,
  );
  assert.equal(
    shouldRecord(new Request("https://onduu.ke/", { method: "POST" }), html),
    false,
  );
});
