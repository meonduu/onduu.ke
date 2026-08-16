import assert from "node:assert/strict";
import test from "node:test";
import { staleCookieNames, expiryHeaders, clearStaleCookies } from "../worker/stale-cookies.ts";

test("detects the analytics cookies the previous site left behind", () => {
  const header =
    "_ga=GA1.1.123; _ga_HFJ4SF94RP=GS1.1.x; _clck=abc; encheventsnippet=1; __cf_bm=keepme; cf_clearance=keepme";
  const names = staleCookieNames(header);

  assert.ok(names.includes("_ga"));
  assert.ok(names.includes("_ga_HFJ4SF94RP"), "per-property GA cookies use a prefix");
  assert.ok(names.includes("_clck"));
  assert.ok(names.includes("encheventsnippet"));
});

test("never touches Cloudflare's own functional cookies", () => {
  // Expiring these would break bot protection and the Turnstile check.
  const names = staleCookieNames("__cf_bm=a; cf_clearance=b; __cflb=c");
  assert.deepEqual(names, []);
});

test("returns nothing when no cookies are sent", () => {
  assert.deepEqual(staleCookieNames(null), []);
  assert.deepEqual(staleCookieNames(""), []);
});

test("expiry covers both the host-only and dot-prefixed domain", () => {
  // A cookie is only deleted if the domain and path match how it was set, and
  // Google Analytics sets on .onduu.ke while others set host-only.
  const headers = expiryHeaders(["_ga"], "onduu.ke");
  assert.equal(headers.length, 3);
  assert.ok(headers.some((h) => h.includes("Domain=onduu.ke")));
  assert.ok(headers.some((h) => h.includes("Domain=.onduu.ke")));
  assert.ok(headers.some((h) => !h.includes("Domain=")), "host-only form required");
  for (const h of headers) {
    assert.match(h, /Max-Age=0/);
    assert.match(h, /Expires=Thu, 01 Jan 1970/);
    assert.match(h, /Path=\//);
  }
});

test("adds expiry headers to an HTML response carrying stale cookies", () => {
  const request = new Request("https://onduu.ke/", { headers: { cookie: "_ga=GA1.1.9" } });
  const response = new Response("<html></html>", {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
  const out = clearStaleCookies(request, response);
  const set = out.headers.getSetCookie?.() ?? [out.headers.get("set-cookie")];
  assert.ok(set.some((v) => v && v.startsWith("_ga=;")), "must expire the cookie");
});

test("leaves clean requests and non-HTML responses alone", () => {
  const clean = clearStaleCookies(
    new Request("https://onduu.ke/"),
    new Response("<html></html>", { headers: { "content-type": "text/html" } }),
  );
  assert.equal(clean.headers.get("set-cookie"), null, "no cookies, no headers");

  const asset = clearStaleCookies(
    new Request("https://onduu.ke/app.js", { headers: { cookie: "_ga=GA1.1.9" } }),
    new Response("//js", { headers: { "content-type": "application/javascript" } }),
  );
  assert.equal(asset.headers.get("set-cookie"), null, "assets must not carry Set-Cookie");
});
