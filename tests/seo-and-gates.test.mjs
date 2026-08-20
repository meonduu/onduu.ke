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
  "/guides/buzz-workspaces": "/guides/agents-on-vps",
  "/labs": "/guides",
  "/legal/managed-service-terms": "/legal/assessment-terms",
  "/managed-website-operations": "/paths/website-and-digital-marketing",
  "/results": "/insights",
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

test("the retired Labs route leaves nothing behind", async () => {
  // Removed 19 Aug 2026 (owner): the page is gone, the redirect is covered
  // above, and no page may still advertise it.
  const xml = await (await fetchPath("/sitemap.xml")).text();
  assert.ok(!xml.includes(`${SITE_URL}/labs`), "labs must not be in the sitemap");

  for (const path of ["/", "/guides", "/readiness"]) {
    const html = await (await fetchPath(path)).text();
    assert.doesNotMatch(html, /href="\/labs"/, `${path} still links the retired Labs route`);
    assert.doesNotMatch(html, /Guides and Labs/, `${path} still advertises Labs`);
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
  // Removed 19 Aug 2026: the managed service was never contracted, so its
  // terms are gone rather than merely unlinked (the redirect is covered above).
  assert.doesNotMatch(home, /managed-service-terms/, "the retired terms page must not be linked");
});

test("no route is gated any more, and the retired ones are gone for good", async () => {
  // The gating mechanism is kept for future use, but nothing uses it today:
  // the loops over GATED_ROUTES elsewhere in this file are therefore
  // deliberately vacuous, and this test is what holds the line.
  assert.equal(GATED_ROUTES.size, 0, "a newly gated route needs a deliberate decision");

  const xml = await (await fetchPath("/sitemap.xml")).text();
  const home = await (await fetchPath("/")).text();
  for (const route of ["managed-website-operations", "results", "legal/managed-service-terms"]) {
    assert.ok(!xml.includes(`${SITE_URL}/${route}`), `${route} must not be in the sitemap`);
    assert.doesNotMatch(home, new RegExp(`href="/${route}"`), `${route} must not be linked`);
  }
});

test("tool limitations page states the honest limits of all four tools", async () => {
  const res = await fetchPath("/legal/tool-limitations");
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.match(html, /not a penetration test/i);
  assert.match(html, /not a reservation/i, "domain availability framed honestly");
  assert.match(html, /never counts as a pass or a failure/i, "scan rule 2 stated");
  assert.match(html, /contact form/i, "opt-out route published (via the contact form)");
  // Every live tool must appear here, or the page under-describes the site.
  for (const tool of ["/email-security", "/kedomains", "/scan", "/dns"]) {
    assert.ok(html.includes(tool), `tool limitations must cover ${tool}`);
  }
  assert.match(html, /not a propagation checker/i, "DNS check vantage limit stated");
  assert.match(html, /detected, not cryptographically validated/i, "DNSSEC limit stated");
});

test("the legal pages describe behaviour that actually exists", async () => {
  const privacy = await (await fetchPath("/legal/privacy")).text();
  // The notice must cover every tool that stores something.
  assert.match(privacy, /\/dns/, "privacy notice must cover the DNS check");
  // It must not claim analytics products the site does not run: the CSP
  // permits no third-party analytics script, so a claim would be false.
  assert.doesNotMatch(privacy, /Cloudflare Web Analytics runs/, "no analytics product is in use");
  // The notice must stay internally consistent about the first-party
  // measurement script: section 05 describes it, so section 02 cannot claim
  // nothing is gathered while browsing, section 03 must state a basis for it,
  // and section 08 must cover what it accumulates.
  assert.doesNotMatch(
    privacy,
    /Nothing else about you is gathered as you browse/i,
    "section 02 contradicts the measurement described in section 05",
  );
  assert.match(privacy, /Global Privacy Control/i, "the opt-out signal must be disclosed");
  assert.match(
    privacy,
    /legitimate interest in improving what is published here/i,
    "the measurement needs a stated legal basis",
  );
  assert.match(
    privacy,
    /engagement measurement: nothing prunes them on a timer/i,
    "retention must cover the counted views and events",
  );

  const commercial = await (await fetchPath("/legal/commercial-relationships")).text();
  // The referral fee must be disclosed, without an amount, and the shared
  // ownership with Ujiajiri stated at the point it matters.
  assert.match(commercial, /referral fee/i, "referral fee existence disclosed");
  // Owner copy (v4.56.0) states the shared ownership at the top of the same
  // section as the fee rather than in the fee sentence itself. The substance
  // pinned here is that both facts appear: who operates Onduu, and that a fee
  // may be received — a reader must be able to connect them.
  assert.match(commercial, /operated by Ujiajiri Enterprises Limited/i, "shared entity stated");
  assert.doesNotMatch(commercial, /referral fee[^.]*\d+\s*%|\d+\s*%[^.]*referral/i, "no fee amount");
  // The retired public-directory model must not survive here.
  assert.doesNotMatch(commercial, /Providers listed there/i, "directory language must be gone");
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

test("Ujiajiri cross-links are present, plain, and honestly worded", async () => {
  // Private curated introductions (19 Aug 2026 brief): the public directory
  // is gone; every implementation CTA requests an introduction instead.
  const introUrl = "https://ujiajiri.ke/request-an-introduction/";
  const youthUrl = "https://ujiajiri.ke/for-youth/";

  const paths = await (await fetchPath("/paths/website-and-digital-marketing")).text();
  assert.ok(paths.includes(introUrl), "partner path must link the introduction route");
  assert.match(paths, /Request an Implementation Introduction/);
  assert.match(paths, /permission before sharing/i, "consent step must be stated");
  assert.match(paths, /referral fee/i, "referral-fee existence must be disclosed");
  assert.doesNotMatch(paths, /referral fee[^.]*\d+\s*%|\d+\s*%[^.]*referral/i, "no fee amount published");
  assert.doesNotMatch(paths, /ujiajiri\.ke\/partners/, "public directory link must be gone");
  assert.doesNotMatch(paths, /directory is being established/i, "stale status must be gone");

  const readiness = await (await fetchPath("/readiness")).text();
  assert.ok(readiness.includes(introUrl), "readiness page must offer the introduction route");
  assert.match(readiness, /does not automatically transmit/i, "no-auto-transfer promise stays");
  // Phase 2 sign-off (19 Aug 2026): the fee's existence is disclosed at this
  // decision point too, not only on the implementation path page.
  assert.match(readiness, /referral fee/i, "fee existence disclosed beside the readiness CTA");
  assert.doesNotMatch(readiness, /referral fee[^.]*\d+\s*%|\d+\s*%[^.]*referral/i, "no fee amount published");

  const home = await (await fetchPath("/")).text();
  assert.ok(home.includes(youthUrl), "homepage skills section must link the youth pathway");
  assert.ok(home.includes(introUrl), "homepage status must link the introduction route");
  assert.doesNotMatch(home, /ujiajiri\.ke\/partners/, "homepage must not link the retired directory");

  // Plain links only: no query strings, no parameters, targets keep the slash.
  for (const html of [paths, readiness, home]) {
    assert.doesNotMatch(html, /ujiajiri\.ke[^"]*\?/, "no query strings on Ujiajiri links");
  }
  // The youth programme is under development: no promises of training outcomes.
  for (const banned of [/applications are open/i, /guaranteed placement/i, /certification/i]) {
    assert.doesNotMatch(home, banned, "youth copy must not overpromise");
  }
});

test("no direct-delivery promise survives on the homepage", async () => {
  const home = await (await fetchPath("/")).text();
  assert.doesNotMatch(home, /finds and fixes/i, "the banned phrase is back");
  assert.doesNotMatch(home, /Managed Website Operations/i);
  assert.doesNotMatch(home, /Agent Workflow Pilot/i);
});

test("every guide is reachable by clicking from the guides index", async () => {
  // v4.44.0: the index printed each guide's URL as plain text, leaving four
  // of five guides with no clickable route anywhere on the site.
  const guides = await (await fetchPath("/guides")).text();
  const routes = [
    "/guides/website-revenue-system",
    "/guides/domains-and-dns",
    "/guides/email-and-trust",
    "/guides/kenyan-vps",
    "/guides/agents-on-vps",
  ];
  for (const route of routes) {
    assert.match(guides, new RegExp(`href="${route}"`), `${route} must be linked from /guides`);
    assert.equal((await fetchPath(route)).status, 200, `${route} must still resolve`);
  }
  // The bare URL must not be printed as a label any more.
  assert.doesNotMatch(guides, /<small>\/guides\//, "guide URLs must not render as plain text");
});

test("the privacy notice names every processor the code actually uses", async () => {
  // Lesson L8: v4.52.0 wired Slack as a notification processor and did not
  // update the notice. A processor the code contacts but the notice omits is
  // a false privacy statement, so the two are pinned together here.
  const privacy = await (await fetchPath("/legal/privacy")).text();
  for (const processor of ["Cloudflare", "ZeptoMail", "Slack"]) {
    assert.match(privacy, new RegExp(processor), `the notice omits a processor: ${processor}`);
  }
  // Where the data sits is stated, not hand-waved.
  assert.match(privacy, /Eastern Europe/i, "the storage region must be stated");
  // And the register behind it is named for the reviewer.
  assert.match(privacy, /processors-and-transfers/, "the notice should point at the register");
});

test("the owner's personal email appears on no public page", async () => {
  // Owner instruction, 20 Aug 2026: every public mention of me@onduu.ke is
  // replaced by the contact form. Deletion requests, complaints, consent
  // withdrawal and the domain opt-out all route through /contact now.
  for (const path of [
    "/", "/contact", "/readiness", "/scan", "/kedomains", "/dns",
    "/email-security", "/legal/privacy", "/legal/tool-limitations",
    "/legal/commercial-relationships", "/legal/assessment-terms", "/about",
  ]) {
    const html = await (await fetchPath(path)).text();
    assert.doesNotMatch(html, /me@onduu\.ke/, `${path} exposes the personal email`);
  }
  // The rights channel must still exist: the privacy notice points at the form.
  const privacy = await (await fetchPath("/legal/privacy")).text();
  assert.match(privacy, /through the contact form/i, "rights requests need a stated channel");
});

test("the header carries the no-JS mobile disclosure menu", async () => {
  // Below 1000px the inline nav is display:none; the same five links must be
  // reachable through the <details> disclosure (v4.43.0, 19 Aug 2026).
  const home = await (await fetchPath("/")).text();
  assert.match(home, /<details class="mobile-nav"><summary>Menu<\/summary>/);
  for (const href of ["/paths", "/guides", "/dns", "/email-security", "/kedomains"]) {
    const links = home.match(new RegExp(`href="${href}"`, "g")) ?? [];
    assert.ok(links.length >= 2, `${href} must appear in both the inline nav and the disclosure`);
  }
});

test("the contact hero recommends routes, not superseded offers", async () => {
  // Phase 2 sign-off (19 Aug 2026): the prototype hero's "score, review,
  // system, programme, pilot" echoed the superseded direct-delivery offers.
  const contact = await (await fetchPath("/contact")).text();
  assert.doesNotMatch(contact, /system, programme, pilot/i, "superseded-offer echo is back");
  assert.match(
    contact,
    /an independent partner route, the official infrastructure route/i,
    "hero must use the approved route-recommendation formula",
  );
});

test("legal pages are still marked as drafts", async () => {
  for (const route of ["legal/privacy", "legal/assessment-terms"]) {
    const html = await (await fetchPath(`/${route}`)).text();
    assert.match(html, /draft/i, `${route} should still be marked a draft`);
  }
});

test("assessment terms match the privacy notice and the running code", async () => {
  // Terms 0.2 (19 Aug 2026): the false two-year retention claim is gone —
  // the privacy notice states there is no automatic deletion schedule — and
  // the free tools are governed by the tool limitations page, not these terms.
  const terms = await (await fetchPath("/legal/assessment-terms")).text();
  assert.doesNotMatch(terms, /kept for two years/i, "the false retention claim is back");
  assert.match(terms, /no automatic deletion schedule/i, "retention must match the privacy notice");
  assert.match(terms, /tool limitations page/i, "tools must be pointed at the tool limitations page");
  assert.doesNotMatch(terms, /where a selector can be guessed/i, "DKIM wording must match the code");

  const privacy = await (await fetchPath("/legal/privacy")).text();
  assert.match(privacy, /no automatic deletion schedule|no fixed retention period/i,
    "if the privacy notice gains a retention schedule, update the assessment terms with it");
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

test("our own pages load no third-party script beyond Turnstile", async () => {
  // Guards the code path only. Cloudflare's edge does not run against the
  // local build, so this cannot catch a dashboard toggle injecting a beacon
  // into production — `npm run check:live` is what does that, and it is why
  // that script exists. See scripts/check-live.mjs.
  const allowed = new Set(["challenges.cloudflare.com"]);
  for (const path of ["/", "/about", "/readiness", "/dns"]) {
    const html = await (await fetchPath(path)).text();
    for (const [, src] of html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)) {
      if (src.startsWith("/")) continue;
      const host = new URL(src, "https://onduu.ke").host;
      assert.ok(allowed.has(host), `${path} loads an unexpected script host: ${host}`);
    }
    assert.doesNotMatch(html, /cloudflareinsights|rocket-loader|email-decode/i,
      `${path} carries a Cloudflare-injected script`);
  }
});
