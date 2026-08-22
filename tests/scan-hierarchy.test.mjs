import assert from "node:assert/strict";
import test from "node:test";
import { fetchPath } from "./helpers/server.mjs";

// Owner, 22 Aug 2026: the six dimension headings on the scan result
// ("Control", "Trust", …) rendered at a bare 16px browser default under
// 25px finding titles — the group smaller than its members — because
// .scan-dimension h3 had no rule at all. The same six names are styled on
// the homepage grid and the /dns category heads as a copper number beside
// a Georgia title. This holds the scan to that.
//
// It checks the RELATIONSHIP, not a pixel: a group heading must be set
// larger than the rows it groups, and numbered from the fixed dimension
// order. Measured from the served CSS and the built island, the two places
// the rendered page is actually assembled from.

const px = (decl, prop) => {
  const m = decl.match(new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([0-9.]+)px`));
  return m ? Number(m[1]) : null;
};

async function servedCss() {
  const home = await (await fetchPath("/")).text();
  const hrefs = [...home.matchAll(/href="(\/_astro\/[^"]+\.css)"/g)].map((m) => m[1]);
  let css = "";
  for (const href of hrefs) css += await (await fetchPath(href, "text/css")).text();
  return css;
}

const block = (css, selector) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return css.match(new RegExp(`${escaped}\\{([^}]*)\\}`))?.[1] ?? null;
};

test("a scan dimension heading is set larger than the finding titles beneath it", async () => {
  const css = await servedCss();
  const head = block(css, ".scan-dimension-head h3");
  assert.ok(head, "the dimension heading has no rule — it will fall back to the browser default again");
  const headSize = px(head, "font-size");
  assert.ok(headSize, "the dimension heading must set an explicit size");

  // The finding title inside a row: whatever the shared checker rows use.
  const row = block(css, ".check-row-head h3") ?? block(css, ".check-list h3") ?? "";
  const rowSize = px(row, "font-size");
  // If the row size is not pinned in CSS it inherits the h3 default (~18.7px),
  // which is still below 23; the real comparison is the one measured on the
  // live page at 25px, so the floor is set there.
  const floor = rowSize ?? 25;
  assert.ok(
    headSize > 16,
    `dimension heading is ${headSize}px — the bare h3 default it was before`,
  );
  // Strictly larger, measured against the real row size. The first fix
  // matched /dns at 23px and shipped a heading still smaller than the 25px
  // rows under it — visibly so in the screenshot. A floor of "at least as
  // big as /dns" was the wrong floor; the only one that means anything is
  // "bigger than what it groups".
  assert.ok(
    headSize > floor,
    `dimension heading (${headSize}px) must be larger than the finding titles it groups (${floor}px)`,
  );
});

test("the dimension heading carries the house number, in copper", async () => {
  const css = await servedCss();
  const num = block(css, ".scan-dimension-head span");
  assert.ok(num, "no rule for the dimension number");
  assert.match(num, /color:var\(--copper\)/, "the number is copper, as on the homepage grid and every section eyebrow");
  assert.match(num, /font-weight:800/, "the number is set bold like its siblings");
  assert.match(block(css, ".scan-dimension-head") ?? "", /border-bottom:2px solid/, "a rule beneath, as the /dns category heads have");
});

test("dimensions are numbered from the fixed order, not from what happened to render", async () => {
  // A scan of a site with no observable Speed signals skips that block.
  // Its neighbours must keep their numbers: Conversion is 04 whether or
  // not Speed appeared above it. Reading the component rather than a
  // rendered page, because that case needs a specific domain to reproduce.
  const { readFileSync } = await import("node:fs");
  const src = readFileSync(new URL("../src/components/scan-form.tsx", import.meta.url), "utf8");
  assert.match(src, /DIMENSION_ORDER\.map\(\(dim, n\)/, "the number must come from the index in DIMENSION_ORDER");
  assert.match(src, /String\(n \+ 1\)\.padStart\(2, "0"\)/, "two digits, 01–06, like the rest of the site");
  assert.doesNotMatch(
    src,
    /filter\([^)]*\)\.map\(\(dim, n\)/,
    "numbering after a filter would renumber whenever a dimension is skipped",
  );
});
