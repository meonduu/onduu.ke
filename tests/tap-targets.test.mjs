import assert from "node:assert/strict";
import test from "node:test";

import { fetchPath } from "./helpers/server.mjs";

// WCAG 2.5.8 (Target Size, Minimum, AA) asks for 24x24 CSS pixels. Three
// separate tap-target defects shipped and were found only because the owner
// looked at the live site on a phone: the mobile menu, the header CTA at 8px,
// and every footer link at 18px. Each was invisible in the desktop layout.
// A sitewide sweep on 21 Aug 2026 then found one more — the article
// back-link. This is that sweep, so the next one runs for free.
//
// The measurement is deliberately CRUDE and static: the harness serves real
// HTML but no browser lays it out, so this cannot read boxes. What it CAN do
// is pin the CSS rules that set the sizes, which is where every one of these
// defects actually lived. A rule changing here is the signal to re-measure
// in a 375px viewport; the numbers below were measured there.
//
// WCAG's exceptions are why this list is short. Links inside a sentence are
// exempt ("Inline": size constrained by the line-height of surrounding
// text), which covers the prose links in articles, on /scan and in the
// consent sentence. A control wrapped in a label is activated by the whole
// label. Those are not failures and are not pinned here — pinning them
// would invite someone to "fix" what is already correct.

// Declarations are matched individually, not as an ordered block: the
// build minifies and REORDERS them, so pinning the literal rule text makes
// a test that passes today and fails on an unrelated build change.
const RULES = [
  {
    what: "footer navigation links",
    // Bare 18px line boxes until v4.66.3; now 18 + 7px top and bottom.
    selector: "footer>div:not(.footer-brand) a",
    needs: ["padding:7px 0"],
    measured: "32px tall at 375px (50px when wrapped)",
  },
  {
    what: "the article back-link",
    // Standalone navigation, so 2.5.8's inline exception does not apply.
    // It was the 15px line box of 10px text until v4.66.4.
    selector: ".article-back",
    needs: ["padding:6px 0"],
    measured: "27px tall at 375px",
  },
  {
    what: "the consent checkbox",
    // The label wraps it, so the label is the activation target and this
    // would pass regardless. 24px means no exemption has to be argued.
    selector: ".check input",
    needs: ["width:24px", "height:24px"],
    measured: "24x24, inside a 323x63 label",
  },
  {
    what: "the mobile menu summary",
    selector: ".mobile-nav summary",
    needs: ["min-height:44px"],
    measured: "44px tall — the owner asked for 44 specifically",
  },
  {
    what: "the header CTA below 620px",
    // 8px in a 68px box over four lines until v4.64.2.
    selector: ".button-small",
    needs: ["font-size:10px", "padding:11px 12px"],
    measured: "115x49 at 375px, two lines",
  },
];

// A selector can appear more than once (base rule plus a media-query
// override); the requirement is that SOME block for it carries the
// declaration.
function blocksFor(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return [...css.matchAll(new RegExp(`${escaped}\\{([^}]*)\\}`, "g"))].map((m) => m[1]);
}

test("the tap-target CSS rules are all still in place", async () => {
  // Read the stylesheets the site actually serves, so this fails if a rule
  // is edited away rather than if a source file is merely moved.
  const home = await (await fetchPath("/")).text();
  const hrefs = [...home.matchAll(/href="(\/_astro\/[^"]+\.css)"/g)].map((m) => m[1]);
  assert.ok(hrefs.length, "no stylesheet linked from the homepage");

  let css = "";
  for (const href of hrefs) css += await (await fetchPath(href, "text/css")).text();

  const missing = RULES.filter((r) => {
    const blocks = blocksFor(css, r.selector);
    return !r.needs.every((decl) => blocks.some((b) => b.includes(decl)));
  }).map((r) => `${r.what} — \`${r.selector}\` (expected ${r.measured})`);
  assert.deepEqual(
    missing,
    [],
    `tap-target rules missing from the served CSS — re-measure at 375px before changing these:\n${missing.join("\n")}`,
  );
});

test("no page reintroduces a tiny font on a standalone control", async () => {
  // The header CTA's 8px is the specific regression this catches: a font
  // small enough that its line box cannot reach 24px however it is padded.
  const home = await (await fetchPath("/")).text();
  const hrefs = [...home.matchAll(/href="(\/_astro\/[^"]+\.css)"/g)].map((m) => m[1]);
  let css = "";
  for (const href of hrefs) css += await (await fetchPath(href, "text/css")).text();

  const tiny = [...css.matchAll(/font-size:([0-9.]+)px/g)]
    .map((m) => Number(m[1]))
    .filter((n) => n < 9);
  assert.deepEqual(
    tiny,
    [],
    `font sizes below 9px found (${tiny.join(", ")}) — the header CTA shipped at 8px and was unreadable`,
  );
});
