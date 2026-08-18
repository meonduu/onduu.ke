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
  "guides/domains-and-dns",
  "guides/email-and-trust",
  "kedomains",
];

// Old delivery-offer routes 301 to their strategy successors.
const REDIRECTED = {
  "/check": "/email-security",
  "/domains": "/kedomains",
  "/email-security/glossary": "/email-security",
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
  for (const route of ["legal/commercial-relationships", "legal/privacy", "legal/assessment-terms", "legal/tool-limitations"]) {
    assert.match(home, new RegExp(`href="/${route}"`), `footer missing ${route}`);
  }
  assert.doesNotMatch(home, /href="\/legal\/managed-service-terms"/, "gated terms must not be linked");
});

test("tool limitations page states the honest limits of all three tools", async () => {
  const res = await fetchPath("/legal/tool-limitations");
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.match(html, /not a penetration test/i);
  assert.match(html, /not a reservation/i, "domain availability framed honestly");
  assert.match(html, /never counts as a pass or a failure/i, "scan rule 2 stated");
  assert.match(html, /me@onduu\.ke/, "opt-out route published");
});

test("pages carry a hashed CSP header allowing only Turnstile and YouTube beyond self", async () => {
  const res = await fetchPath("/about");
  const csp = res.headers.get("content-security-policy") ?? "";
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /script-src [^;]*'sha256-/, "Astro's inline scripts are hashed, not unsafe-inline");
  assert.doesNotMatch(csp, /script-src[^;]*'unsafe-inline'/, "no blanket inline scripts");
  assert.match(csp, /frame-src [^;]*challenges\.cloudflare\.com/);
  assert.match(csp, /frame-src [^;]*youtube\.com/);
  const external = csp.match(/https:\/\/[a-z0-9.-]+/g) ?? [];
  const allowed = new Set(["https://challenges.cloudflare.com", "https://www.youtube.com"]);
  for (const origin of external) assert.ok(allowed.has(origin), `unexpected CSP origin: ${origin}`);
});

test("the Dial lockup and favicon are in place", async () => {
  const html = await (await fetchPath("/")).text();
  assert.match(html, /<link rel="icon" href="\/favicon.svg"/, "favicon must be declared");
  // Header and footer both carry the mark; the name stays real text.
  assert.equal((html.match(/wordmark-dial/g) ?? []).length, 2, "dial in header and footer");
  assert.equal((html.match(/class="wordmark"/g) ?? []).length, 2);
  assert.match(html, /class="wordmark"[^>]*>.*?ONDUU/s, "the name is selectable text, not an image");

  const icon = await fetchPath("/favicon.svg", "image/svg+xml");
  assert.equal(icon.status, 200);
  const svg = await icon.text();
  assert.match(svg, /#B8643B/, "favicon uses the copper token");
  assert.match(svg, /prefers-color-scheme:dark/, "favicon adapts to dark browser chrome");
  assert.doesNotMatch(svg, /68C4FF/, "the starter placeholder icon must not return");
});

test("share card, app icons and manifest are served and declared", async () => {
  const html = await (await fetchPath("/")).text();
  assert.match(html, new RegExp(`property="og:image" content="${SITE_URL}/og-card.png"`.replace(/[./]/g, "\\$&")), "og:image must be absolute");
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
  assert.match(html, /rel="apple-touch-icon" href="\/apple-touch-icon.png"/);
  assert.match(html, /rel="manifest" href="\/site.webmanifest"/);

  // Raster assets actually resolve — a dead og:image is worse than none.
  for (const [path, type] of [
    ["/og-card.png", /image\/png/],
    ["/apple-touch-icon.png", /image\/png/],
    ["/icon-192.png", /image\/png/],
    ["/icon-512.png", /image\/png/],
    ["/site.webmanifest", /json|manifest/],
  ]) {
    const res = await fetchPath(path, "*/*");
    assert.equal(res.status, 200, `${path} should be served`);
    assert.match(res.headers.get("content-type") ?? "", type, `${path} content type`);
  }
  const manifest = JSON.parse(await (await fetchPath("/site.webmanifest", "*/*")).text());
  assert.equal(manifest.theme_color, "#B8643B", "manifest carries the copper token");
  assert.equal(manifest.icons.length, 2);
});

test("keyboard users get a skip link targeting the main landmark", async () => {
  const html = await (await fetchPath("/")).text();
  assert.match(html, /class="skip-link" href="#main"/);
  assert.match(html, /<main id="main"/);
});

test("every page carries the browser security headers, with a short-start HSTS", async () => {
  for (const path of ["/", "/scan", "/api/check?domain=onduu.ke"]) {
    const res = await fetchPath(path);
    assert.equal(res.headers.get("x-content-type-options"), "nosniff", `${path} nosniff`);
    assert.equal(res.headers.get("x-frame-options"), "DENY", `${path} frame-deny`);
    assert.equal(res.headers.get("referrer-policy"), "strict-origin-when-cross-origin", `${path} referrer`);
    const hsts = res.headers.get("strict-transport-security") ?? "";
    assert.match(hsts, /max-age=\d+/, `${path} HSTS present`);
    assert.doesNotMatch(hsts, /preload/, "preload must never ride along casually");
    assert.doesNotMatch(hsts, /includeSubDomains/i, "subdomains must not be committed by accident");
  }
});

test("the footer carries the responsibility disclosure", async () => {
  const home = await (await fetchPath("/")).text();
  assert.match(home, /operated by Ujiajiri Enterprises Limited/);
  assert.match(home, /HOSTAFRICA provides, bills and supports/);
});

test("the approved HOSTAFRICA destination is UTM-tagged with no affiliate parameter", async () => {
  const paths = await (await fetchPath("/paths/hostafrica-infrastructure")).text();
  assert.match(paths, /panel\.hostafrica\.com\/\?utm_source=onduu/, "outbound CTA missing");
  assert.doesNotMatch(paths, /aff=/, "affiliate parameters are not approved");
  assert.match(paths, /Managing Director of HOSTAFRICA Kenya/, "disclosure at the decision point");

  const domains = await (await fetchPath("/kedomains")).text();
  assert.match(domains, /Managing Director of HOSTAFRICA Kenya/, "domain page carries the disclosure");
  assert.doesNotMatch(domains, /aff=/);
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

test("the homepage and the email checker carry canonical and Open Graph", async () => {
  // These two shipped without canonical/OG under vinext; fixed post-migration.
  for (const { path, canonical } of [
    { path: "/", canonical: "https://onduu.ke" },
    { path: "/email-security", canonical: "https://onduu.ke/email-security" },
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
  assert.equal(items.length, 12);
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
