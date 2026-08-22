import assert from "node:assert/strict";
import test from "node:test";
import { extractPageFacts } from "../worker/scan/collect.ts";

// Owner, 22 Aug 2026: the scan reported wpfoss.com as having no viewport
// meta, no meta description and no structured data. It has all three. The
// site serves minified HTML — attributes unquoted, content before name —
// and the extractors matched one house style of HTML rather than HTML.
// A scan that reads a site's page has to read what browsers read.

const page = (body) => ({
  ok: true, url: "https://x.test/", status: 200, timingMs: 100, bodyBytes: body.length,
  truncated: false, chain: [], headers: {}, body,
});

const FORMS = {
  "quoted, name first":       `<meta name="viewport" content="width=device-width">`,
  "quoted, content first":    `<meta content="width=device-width" name="viewport">`,
  "unquoted (minified)":      `<meta content="width=device-width,initial-scale=1" name=viewport>`,
  "single quotes":            `<meta name='viewport' content='width=device-width'>`,
  "extra attributes between": `<meta id="vp" name="viewport" data-x="1" content="width=device-width">`,
  "uppercase":                `<META NAME="VIEWPORT" CONTENT="width=device-width">`,
  "self-closing":             `<meta name="viewport" content="width=device-width"/>`,
};

test("the viewport meta is found in every form browsers accept", () => {
  for (const [label, tag] of Object.entries(FORMS)) {
    const facts = extractPageFacts(page(`<html><head>${tag}</head></html>`));
    assert.equal(facts.viewport, true, `viewport missed: ${label}`);
  }
});

test("a meta description is found regardless of attribute order or quoting", () => {
  const forms = [
    `<meta name="description" content="A real description.">`,
    `<meta content="A real description." name=description>`,
    `<meta content='A real description.' name='description'>`,
  ];
  for (const tag of forms) {
    assert.equal(extractPageFacts(page(`<head>${tag}</head>`)).metaDescription, true, tag);
  }
  // An empty description is still missing — the check is for content, not
  // for the tag.
  assert.equal(extractPageFacts(page(`<head><meta name="description" content=""></head>`)).metaDescription, false);
  assert.equal(extractPageFacts(page(`<head><meta name="keywords" content="x"></head>`)).metaDescription, false);
});

test("JSON-LD is found whether or not the type attribute is quoted", () => {
  const ld = `{"@context":"https://schema.org","@type":"Organization","name":"X"}`;
  for (const open of [
    `<script type="application/ld+json">`,
    `<script type=application/ld+json>`,
    `<script type='application/ld+json'>`,
    `<script id="s" type="application/ld+json" data-x="1">`,
    `<SCRIPT TYPE="APPLICATION/LD+JSON">`,
  ]) {
    const facts = extractPageFacts(page(`<head>${open}${ld}</script></head>`));
    assert.equal(facts.hasJsonLd, true, `missed: ${open}`);
    assert.equal(facts.jsonLdParses, true, `did not parse: ${open}`);
  }
  // A plain script is not structured data.
  assert.equal(extractPageFacts(page(`<script>var a=1</script>`)).hasJsonLd, false);
});

test("a lookalike attribute does not fool the reader", () => {
  // `data-name="viewport"` must not count as `name="viewport"`, and an
  // attribute value containing the word must not either.
  const decoys = [
    `<meta data-name="viewport" content="x">`,
    `<meta name="og:viewport-hint" content="x">`,
    `<meta content="name=viewport">`,
  ];
  for (const tag of decoys) {
    assert.equal(extractPageFacts(page(`<head>${tag}</head>`)).viewport, false, `false positive: ${tag}`);
  }
});

test("the wpfoss.com head, as served on 22 Aug 2026, reads correctly", () => {
  // The actual markup that produced three wrong findings.
  const body = `<!doctype html><html><head>
<meta charset=utf-8>
<meta content="width=device-width,initial-scale=1,viewport-fit=cover" name=viewport>
<meta content="Protect your business from email impersonation, DNS hijacking and uncontrolled shared access." name=description>
<script type=application/ld+json>{"@context":"https://schema.org","@type":"WebSite","name":"WPfoss"}</script>
<title>DNS, Email &amp; Password Security | WPfoss</title>
</head><body><h1>x</h1></body></html>`;
  const f = extractPageFacts(page(body));
  assert.equal(f.viewport, true);
  assert.equal(f.metaDescription, true);
  assert.equal(f.hasJsonLd, true);
  assert.equal(f.jsonLdParses, true);
});
