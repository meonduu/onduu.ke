import assert from "node:assert/strict";
import test from "node:test";
import { GATED_ROUTES, SITE_URL } from "../app/route-policy.ts";

// Approved and published on 16 August 2026. These were gated; the tests below
// now assert the opposite — that they are indexable, in the sitemap and linked.
const PUBLISHED_ROUTES = [
  "managed-website-operations",
  "solutions/agent-workflow-pilot",
  "infrastructure",
  "infrastructure/kenyan-vps-data-location",
  "infrastructure/buzz-agent-collaboration",
  "results",
];

async function fetchPath(path, accept = "text/html") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-seo`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept } }),
    {},
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("sitemap lists public routes and excludes every gated one", async () => {
  const response = await fetchPath("/sitemap.xml");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /xml/);

  const xml = await response.text();
  assert.match(xml, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);

  const locs = [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
  assert.ok(locs.includes(`${SITE_URL}/insights`), "insights index should be listed");
  assert.ok(locs.length > 20, "articles should be listed");

  for (const route of GATED_ROUTES) {
    assert.ok(
      !locs.includes(`${SITE_URL}/${route}`),
      `gated route must not appear in sitemap: ${route}`,
    );
  }
});

test("previously gated pages are now published and indexable", async () => {
  for (const route of PUBLISHED_ROUTES) {
    const response = await fetchPath(`/${route}`);
    assert.equal(response.status, 200, `${route} should render`);
    const html = await response.text();
    assert.doesNotMatch(html, /content="noindex/, `${route} should be indexable`);
    // The internal review banner must not survive publication.
    assert.doesNotMatch(html, /PREVIEW \/ APPROVAL GATE/, `${route} still shows a gate banner`);
  }
});

test("published routes appear in the sitemap and are linked from the footer", async () => {
  const xml = await (await fetchPath("/sitemap.xml")).text();
  const home = await (await fetchPath("/")).text();
  for (const route of PUBLISHED_ROUTES) {
    assert.ok(xml.includes(`${SITE_URL}/${route}`), `sitemap missing ${route}`);
  }
  for (const route of ["managed-website-operations", "solutions/agent-workflow-pilot", "infrastructure", "results"]) {
    assert.match(home, new RegExp(`href="/${route}"`), `nothing links to ${route}`);
  }
});

test("all four legal routes are linked from the footer", async () => {
  const home = await (await fetchPath("/")).text();
  for (const route of [
    "legal/commercial-relationships",
    "legal/privacy",
    "legal/assessment-terms",
    "legal/managed-service-terms",
  ]) {
    assert.match(home, new RegExp(`href="/${route}"`), `footer missing ${route}`);
  }
});

test("legal pages are still marked as drafts", async () => {
  for (const route of ["legal/privacy", "legal/assessment-terms"]) {
    const html = await (await fetchPath(`/${route}`)).text();
    assert.match(html, /draft/i, `${route} should still be marked a draft`);
  }
});

test("public pages are indexable and carry canonical plus Open Graph", async () => {
  for (const path of ["/about", "/insights", "/insights/17-years-running-infrastructure"]) {
    const html = await (await fetchPath(path)).text();
    assert.doesNotMatch(html, /content="noindex/, `${path} should be indexable`);
    assert.match(
      html,
      new RegExp(`rel="canonical" href="${SITE_URL}${path.replace(/\//g, "\\/")}"`),
      `${path} should carry its canonical URL`,
    );
    assert.match(html, /property="og:title"/, `${path} needs Open Graph tags`);
  }
});

test("robots disallows gated routes and points at the sitemap", async () => {
  const body = await (await fetchPath("/robots.txt", "text/plain")).text();
  assert.match(body, new RegExp(`Sitemap: ${SITE_URL}/sitemap.xml`));
  assert.match(body, /Disallow: \/api\//);
  for (const route of GATED_ROUTES) {
    assert.match(body, new RegExp(`Disallow: /${route}`), `robots should disallow ${route}`);
  }
});

test("RSS is well formed and covers every article", async () => {
  const xml = await (await fetchPath("/rss.xml", "application/rss+xml")).text();
  assert.match(xml, /<rss version="2\.0"/);
  assert.match(xml, /<title>Onduu Insights<\/title>/);
  const items = [...xml.matchAll(/<item>/g)];
  assert.equal(items.length, 11);
  // pubDate must be RFC-822, not ISO, or feed readers reject it.
  assert.match(xml, /<pubDate>[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4}/);
});

test("gated routes are absent from the header and footer", async () => {
  const html = await (await fetchPath("/")).text();
  for (const route of GATED_ROUTES) {
    assert.doesNotMatch(
      html,
      new RegExp(`href="/${route}"`),
      `gated route should not be linked from navigation: ${route}`,
    );
  }
});
