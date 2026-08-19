import assert from "node:assert/strict";
import test from "node:test";

// Renders through the built Worker so these cover the real production path.
import { fetchPath } from "./helpers/server.mjs";

const render = (path = "/") => fetchPath(path);

const { articles } = await import("../src/data/insights-data.ts").catch(() => ({}));

test("home page server-renders", async () => {
  const response = await render("/");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>[^<]*Onduu<\/title>/i);
  assert.match(html, /ONDUU/);
  // The starter scaffolding must never reappear in a production render.
  assert.doesNotMatch(html, /Your site is taking shape|react-loading-skeleton/i);
});

test("insights index lists every migrated article", async () => {
  const response = await render("/insights");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /The layer your business runs on/);

  const slugs = [
    "what-checking-domains-taught-me-about-email-security",
    "ai-agent-in-your-inbox-obeys-whoever-emails-you",
    "17-years-running-infrastructure",
    "ai-in-kenya-is-about-workflow",
    "reliability-africas-biggest-tech-gap",
    "freelancers-guide-to-ethical-domain-management-in-kenya",
    "navigating-client-domains-best-practices-for-kenyan-digital-agencies",
    "boss-encounters-episode-1-sir-i-want-to-speak-to-the-boss",
    "protecting-your-online-presence-domain-management-for-kenyan-smes",
    "startup-founders-securing-your-digital-identity-in-kenya",
    "top-10-items-every-business-owner-must-know-about-their-domain",
  ];
  for (const slug of slugs) {
    assert.match(html, new RegExp(`/insights/${slug}"`), `missing link: ${slug}`);
  }
});

test("an article renders its prose, metadata and tags", async () => {
  const response = await render(
    "/insights/top-10-items-every-business-owner-must-know-about-their-domain",
  );
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Top 10 items every business owner must know about their domain/);
  assert.match(html, /10 February 2025/);
  assert.match(html, /Wycliffe Onduu/);
  assert.match(html, /#domains/);
  assert.match(html, /Keep your contact information up to date/);
  assert.match(html, /<h2[^>]*>Basics<\/h2>/);
});

test("an article with an embed renders the iframe", async () => {
  const response = await render(
    "/insights/what-checking-domains-taught-me-about-email-security",
  );
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /<iframe[^>]+youtube\.com\/embed/);
});

test("external article links are safely attributed", async () => {
  const response = await render("/insights/17-years-running-infrastructure");
  const html = await response.text();
  const external = [...html.matchAll(/<a[^>]+href="https?:\/\/(?!onduu\.ke)[^"]+"[^>]*>/g)];
  assert.ok(external.length > 0, "expected at least one external link");
  for (const [tag] of external) {
    assert.match(tag, /rel="noopener noreferrer"/, `unsafe external link: ${tag}`);
    assert.match(tag, /target="_blank"/, `external link missing target: ${tag}`);
  }
});

test("the checker page renders with its limits stated", async () => {
  const response = await render("/email-security");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Can someone send email pretending to be you\?/);
  assert.match(html, /id="domain"/);
  // The README forbids implying that a public scan proves security.
  assert.match(html, /does not prove your domain, your mailboxes or your business are secure/);
  assert.match(html, /published DNS only|already public/i);
});

test("the check API rejects bad input without touching DNS", async () => {
  const call = (qs) => fetchPath(`/api/check${qs}`, "application/json");

  const empty = await call("");
  assert.equal(empty.status, 400);
  assert.match((await empty.json()).error, /enter a domain/i);

  const invalid = await call("?domain=not-a-domain");
  assert.equal(invalid.status, 400);
  assert.match((await invalid.json()).error, /valid domain name/i);

  // checkOrigin hardening (19 Aug 2026): a POST whose Origin header does not
  // match the site is refused with 403 before any handler runs; a
  // same-origin POST still reaches the handler's own method check (405).
  const crossOrigin = await fetchPath("/api/check?domain=example.ke", "application/json", {
    method: "POST",
    headers: { origin: "https://evil.example" },
  });
  assert.equal(crossOrigin.status, 403);

  const wrongMethod = await fetchPath("/api/check?domain=example.ke", "application/json", {
    method: "POST",
    headers: { origin: new URL(crossOrigin.url).origin },
  });
  assert.equal(wrongMethod.status, 405);
});

test("unknown routes return 404", async () => {
  const response = await render("/insights/this-does-not-exist");
  assert.equal(response.status, 404);
});

test("every article carries renderable content", () => {
  assert.ok(articles, "insights data should be importable");
  assert.equal(articles.length, 12);
  for (const article of articles) {
    assert.ok(article.title, `${article.slug}: missing title`);
    assert.ok(article.lede, `${article.slug}: missing lede`);
    assert.match(article.date, /^\d{4}-\d{2}-\d{2}$/, `${article.slug}: bad date`);
    assert.ok(article.body.length > 0, `${article.slug}: empty body`);
    for (const block of article.body) {
      if (block.type === "p") assert.ok(block.nodes.length, "empty paragraph");
      if (block.type === "ul" || block.type === "ol")
        assert.ok(block.items.length, "empty list");
    }
  }
});
