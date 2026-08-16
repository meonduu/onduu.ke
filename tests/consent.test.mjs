import assert from "node:assert/strict";
import test from "node:test";

// Google Analytics and Tag Manager were removed on 16 August 2026, along with
// the consent banner they required. These tests assert the absence: nothing
// here should ever reintroduce a third-party tracker without the privacy
// notice changing in the same release.

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

test("no third-party tracker is served on any page", async () => {
  for (const path of ["/", "/insights", "/contact", "/readiness", "/legal/privacy"]) {
    const html = await (await fetchPath(path)).text();
    assert.doesNotMatch(html, /googletagmanager\.com/, `${path} loads Tag Manager`);
    assert.doesNotMatch(html, /google-analytics\.com/, `${path} loads Google Analytics`);
    assert.doesNotMatch(html, /gtag\(/, `${path} bootstraps gtag`);
    assert.doesNotMatch(html, /clarity\.ms/, `${path} loads Clarity`);
    assert.doesNotMatch(html, /connect\.facebook\.net/, `${path} loads a Meta pixel`);
  }
});

test("no consent banner is served, since nothing requires consent", async () => {
  const html = await (await fetchPath("/")).text();
  assert.doesNotMatch(html, /Measurement cookies/, "consent banner still rendered");
  assert.doesNotMatch(html, /id="cookie-preferences"/, "footer still has the cookie control");
  assert.doesNotMatch(html, /class="consent/, "consent markup still present");
});

test("the privacy notice matches: no banner, cookieless analytics, first-party attribution", async () => {
  const html = await (await fetchPath("/legal/privacy")).text();
  assert.match(html, /no advertising tags, no third-party tracking scripts/);
  assert.match(html, /There is no cookie banner/);
  assert.match(html, /Cloudflare Web Analytics runs on every visit/);
  assert.match(html, /cookieless/i);
  assert.match(html, /session storage/i, "must describe how attribution is held");

  // Stale claims from earlier releases must not come back.
  assert.doesNotMatch(html, /Google Tag Manager/, "GA wording survived its removal");
  assert.doesNotMatch(html, /intended to be added/, "must not describe live analytics as planned");
});

test("form consent is untouched — it is data-processing consent, not cookies", async () => {
  const html = await (await fetchPath("/readiness")).text();
  assert.match(html, /id="consent"/, "the form consent checkbox must remain");
  assert.match(html, /privacy notice/i);
});
