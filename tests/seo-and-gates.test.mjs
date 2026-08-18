import assert from "node:assert/strict";
import test from "node:test";
import { GATED_ROUTES, SITE_URL } from "../src/data/route-policy.ts";
import { fetchPath } from "./helpers/server.mjs";

// The paths-and-guides architecture from the 18 August 2026 strategy
// (docs/strategy/). These must be live, indexable, in the sitemap and linked.
const PUBLISHED_ROUTES = [
  "paths",
  "paths/website-and-digital-marketing",
  "paths/hostafrica-infrastructure",
  "guides",
  "guides/website-revenue-system",
  "guides/kenyan-vps",
  "guides/agents-on-vps",
];

// Old delivery-offer routes 301 to their strategy successors.
const REDIRECTED = {
  "/solutions": "/paths",
  "/solutions/digital-revenue-risk-review": "/readiness",
  "/solutions/website-revenue-system": "/guides/website-revenue-system",
  "/solutions/agent-workflow-pilot": "/guides/agents-on-vps",
  "/infrastructure": "/paths/hostafrica-infrastructure",
  "/infrastructure/kenyan-vps-data-location": "/guides/kenyan-vps",
  "/infrastructure/buzz-agent-collaboration": "/guides/agents-on-vps",
};


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

test("the paths and guides architecture is published and indexable", async () => {
  for (const route of PUBLISHED_ROUTES) {
    const response = await fetchPath(`/${route}`);
    assert.equal(response.status, 200, `${route} should render`);
    const html = await response.text();
    assert.doesNotMatch(html, /content="noindex/, `${route} should be indexable`);
    assert.doesNotMatch(html, /PREVIEW \/ APPROVAL GATE/, `${route} still shows a gate banner`);
  }
});

test("published routes appear in the sitemap and are linked from the homepage", async () => {
  const xml = await (await fetchPath("/sitemap.xml")).text();
  const home = await (await fetchPath("/")).text();
  for (const route of PUBLISHED_ROUTES) {
    assert.ok(xml.includes(`${SITE_URL}/${route}`), `sitemap missing ${route}`);
  }
  for (const route of ["readiness", "paths/website-and-digital-marketing", "paths/hostafrica-infrastructure", "guides/website-revenue-system", "guides"]) {
    assert.match(home, new RegExp(`href="/${route}"`), `nothing links to ${route}`);
  }
});

test("old delivery-offer routes 301 to their strategy successors", async () => {
  for (const [from, to] of Object.entries(REDIRECTED)) {
    const res = await fetchPath(from);
    assert.equal(res.status, 301, `${from} should redirect`);
    const location = res.headers.get("location") ?? "";
    assert.ok(new URL(location).pathname === to, `${from} should land on ${to}, got ${location}`);
  }
});

test("gated routes stay reachable but noindex, and carry no delivery promise in nav", async () => {
  for (const route of GATED_ROUTES) {
    const res = await fetchPath(`/${route}`);
    assert.equal(res.status, 200, `${route} should stay reachable for review`);
    const html = await res.text();
    assert.match(html, /content="noindex/, `${route} must be noindex`);
  }
});

test("the legal routes in the footer exclude the gated managed-service terms", async () => {
  const home = await (await fetchPath("/")).text();
  for (const route of ["legal/commercial-relationships", "legal/privacy", "legal/assessment-terms"]) {
    assert.match(home, new RegExp(`href="/${route}"`), `footer missing ${route}`);
  }
  assert.doesNotMatch(home, /href="\/legal\/managed-service-terms"/, "gated terms must not be linked");
});

test("the footer carries the responsibility disclosure", async () => {
  const home = await (await fetchPath("/")).text();
  assert.match(home, /operated by Ujiajiri Enterprises Limited/);
  assert.match(home, /HOSTAFRICA provides, bills and supports/);
});

test("no direct-delivery promise survives on the homepage", async () => {
  const home = await (await fetchPath("/")).text();
  assert.doesNotMatch(home, /finds and fixes/i, "the banned phrase is back");
  assert.doesNotMatch(home, /Managed Website Operations/i);
  assert.doesNotMatch(home, /Agent Workflow Pilot/i);
});

test("legal pages are still marked as drafts", async () => {
  for (const route of ["legal/privacy", "legal/assessment-terms"]) {
    const html = await (await fetchPath(`/${route}`)).text();
    assert.match(html, /draft/i, `${route} should still be marked a draft`);
  }
});

test("the homepage and /check carry canonical and Open Graph", async () => {
  // These two shipped without canonical/OG under vinext; fixed post-migration.
  for (const { path, canonical } of [
    { path: "/", canonical: "https://onduu.ke" },
    { path: "/check", canonical: "https://onduu.ke/check" },
  ]) {
    const html = await (await fetchPath(path)).text();
    assert.match(
      html,
      new RegExp(`rel="canonical" href="${canonical.replace(/\//g, "\\/")}"`),
      `${path} should carry its canonical URL`,
    );
    assert.match(html, /property="og:title"/, `${path} needs Open Graph tags`);
  }
});

test("the 404 page has its own title, not the homepage's", async () => {
  const res = await fetchPath("/no-such-page");
  assert.equal(res.status, 404);
  const html = await res.text();
  assert.match(html, /<title>Page not found \| Onduu<\/title>/);
  assert.doesNotMatch(html, /<link rel="canonical"/, "an error response has no canonical");
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
