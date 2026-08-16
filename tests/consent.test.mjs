import assert from "node:assert/strict";
import test from "node:test";

async function fetchPath(path) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-consent`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    {},
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("no Google or Tag Manager request is present before consent", async () => {
  // The served HTML must contain no GTM script, no gtag and no dataLayer
  // bootstrap. Consent is asked for first; the tag is injected only after.
  for (const path of ["/", "/insights", "/contact", "/legal/privacy"]) {
    const html = await (await fetchPath(path)).text();
    assert.doesNotMatch(html, /googletagmanager\.com\/gtm\.js/, `${path} loads GTM before consent`);
    assert.doesNotMatch(html, /www\.google-analytics\.com/, `${path} loads GA before consent`);
    assert.doesNotMatch(html, /gtag\(/, `${path} bootstraps gtag before consent`);
  }
});

test("the consent banner is served, with both choices and a privacy link", async () => {
  const html = await (await fetchPath("/")).text();
  assert.match(html, /Measurement cookies/);
  assert.match(html, />Accept</);
  assert.match(html, />Decline</);
  assert.match(html, /href="\/legal\/privacy"/);
});

test("consent can be changed later from the footer", async () => {
  const html = await (await fetchPath("/")).text();
  assert.match(html, /id="cookie-preferences"/, "footer needs a control to reopen the choice");
});

test("the privacy notice describes the measurement it actually uses", async () => {
  const html = await (await fetchPath("/legal/privacy")).text();
  // Both halves must be present: what happens if you accept, and if you refuse.
  assert.match(html, /Google Tag Manager/, "must name the tag manager");
  assert.match(html, /outside Kenya/, "must disclose transfer out of Kenya");
  assert.match(html, /decline/i, "must state what declining does");
  assert.match(html, /Cookie choices/, "must point at the withdrawal control");
  // The old blanket claim must be gone now that analytics is being added.
  assert.doesNotMatch(
    html,
    /runs no analytics product, no advertising tags and no third-party tracking scripts/,
    "stale 'no analytics at all' claim must not survive",
  );
});

test("the notice describes Cloudflare Web Analytics as running, not planned", async () => {
  const html = await (await fetchPath("/legal/privacy")).text();
  assert.match(html, /Cloudflare Web Analytics runs on every visit/, "must state it is active");
  assert.match(html, /cookieless/i, "must explain why it is not gated");
  // It must not claim the site runs no analytics — the beacon is injected at
  // Cloudflare's edge and only appears for real browser requests, not curl.
  assert.doesNotMatch(html, /runs no analytics product/, "stale no-analytics claim");
  assert.doesNotMatch(html, /intended to be added/, "must not describe live analytics as planned");
});
