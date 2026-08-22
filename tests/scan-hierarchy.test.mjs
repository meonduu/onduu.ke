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
//
// Scope grew on 22 Aug 2026 beyond the scan: `.check-list h3` is shared by
// /scan, /dns, /domains and /email-security, so a change for one moves all
// four. The last test here covers /domains, where the rule needed an
// exception rather than the shared value.

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

/**
 * The declared font-size for a selector, in px, or null.
 *
 * Looks through EVERY block for the selector rather than the first: the
 * size may sit in a later rule or a media query, and a selector can carry
 * unrelated declarations. This function exists because the first version
 * of this guard did `block(".check-row-head h3")`, got back `{order:2}`,
 * found no font-size, and fell through to a hardcoded 25 — so the
 * "measured against the real row size" comparison was measured against a
 * constant, and it passed a 30px heading that outranked the page's own
 * result heading. Same shape as L16: the check agreed with itself.
 */
const sizeOf = (css, selector) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  for (const m of css.matchAll(new RegExp(`${escaped}\\{([^}]*)\\}`, "g"))) {
    const n = px(m[1], "font-size");
    if (n) return n;
  }
  return null;
};

test("the scan result type ladder descends: result heading, dimension, finding, evidence", async () => {
  const css = await servedCss();

  const dimension = sizeOf(css, ".scan-dimension-head h3");
  assert.ok(dimension, "the dimension heading has no size — it will fall back to the browser default again");
  const row = sizeOf(css, ".check-list h3");
  assert.ok(row, "the finding title has no declared size; this guard cannot measure the relationship");

  // Every step must be strictly smaller than the one above it. Sizes are
  // read from the served CSS, never assumed, because a missing rule that
  // silently becomes a fallback number is how both faults here happened.
  assert.ok(
    dimension > row,
    `the dimension heading (${dimension}px) groups the finding titles (${row}px) and must be larger`,
  );

  // And the group must not outrank the heading of the whole result, which
  // renders at 27px. That is the fault v5.6.0 shipped: clearing the rows by
  // inflating the heading past the result's own h2.
  assert.ok(
    dimension < 27,
    `the dimension heading (${dimension}px) must sit under the result heading "Signal for …" (27px) — ` +
      "a chapter title must not outrank the book",
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

test("on /domains, where a row is the answer, the row title leads its own detail", async () => {
  // /domains has no result heading — each row IS the top-level answer
  // ("wpfoss.co.ke is TAKEN"), unlike the other checkers where rows are
  // sub-items under both a result heading and a group heading. Taking the
  // shared row size down to 19px left it 3px above its own registrar and
  // expiry lines, and the answer stopped reading as the answer.
  const css = await servedCss();
  const shared = sizeOf(css, ".check-list h3");
  const lead = sizeOf(css, ".check-list--lead h3");
  assert.ok(shared, "the shared row size is not declared");
  assert.ok(lead, "/domains rows must set their own size; without it they inherit the sub-item size");
  assert.ok(
    lead > shared,
    `a leading row (${lead}px) must be set larger than a sub-item row (${shared}px)`,
  );

  // And it must clear the detail lines beneath it by more than a hair.
  const detail = sizeOf(css, ".check-list p") ?? 16;
  assert.ok(
    lead - detail >= 6,
    `a leading row (${lead}px) must stand clear of its detail lines (${detail}px); ` +
      `${lead - detail}px apart reads as one block`,
  );

  // The exception must actually be applied on the page that needs it.
  const { readFileSync } = await import("node:fs");
  const src = readFileSync(new URL("../src/components/domains-form.tsx", import.meta.url), "utf8");
  assert.match(src, /className="check-list check-list--lead"/, "/domains must opt into the leading-row size");
});

test("/dns categories carry the same numbered head as the scan's dimensions", async () => {
  const css = await servedCss();
  const num = block(css, ".dns-cat-title span");
  assert.ok(num, "no rule for the /dns category number");
  assert.match(num, /color:var\(--copper\)/, "the number is copper, as on /scan and the homepage grid");
  assert.match(num, /font-weight:800/, "same weight as its siblings");
  assert.equal(sizeOf(css, ".dns-cat-title span"), 10, "same 10px eyebrow as /scan");

  // The counts (2 OK / 1 OBSERVED) must stay pushed right, which needs the
  // head to keep exactly two flex children — number and title are wrapped
  // together. A third child would spread all three across the row.
  const { readFileSync } = await import("node:fs");
  const src = readFileSync(new URL("../src/components/dns-form.tsx", import.meta.url), "utf8");
  assert.match(src, /<div className="dns-cat-title">/, "number and title must be wrapped together");
  assert.match(src, /CATEGORIES\.map\(\(\{ key, label \}, n\)/, "the number comes from the CATEGORIES index");
  assert.match(src, /String\(n \+ 1\)\.padStart\(2, "0"\)/, "two digits, as on /scan");
});

test("record blocks wrap at spaces, breaking a token only when it cannot fit", async () => {
  // Owner, 22 Aug 2026, checking /email-security on a phone: an SPF record
  // rendered as "include:zep / tomail.net" — `word-break:break-all` on
  // `.check-list code` breaks at any character, even with spaces available.
  // A split domain is unreadable and reads as a different domain. Same fault
  // as the /dns tables in v5.9.1, in the element beside them.
  //
  // `overflow-wrap:break-word` is the wanted behaviour, not the absence of
  // any rule: a DKIM public key is one space-free token far wider than a
  // phone, and must still break rather than overflow.
  const css = await servedCss();
  const rule = block(css, ".check-list code");
  assert.ok(rule, "the .check-list code rule moved; this guard needs repointing");
  assert.doesNotMatch(
    rule,
    /word-break:break-all/,
    "break-all splits records mid-token: SPF and DMARC values have spaces to break at",
  );
  assert.match(
    rule,
    /overflow-wrap:break-word/,
    "a space-free value wider than the screen (a DKIM key) must still break rather than overflow",
  );
});
