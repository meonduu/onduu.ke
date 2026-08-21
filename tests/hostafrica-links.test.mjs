import assert from "node:assert/strict";
import test from "node:test";

import { fetchPath } from "./helpers/server.mjs";
import { parseInlineLinks, isExternal } from "../src/components/inline-links.ts";

// Owner decision, 21 Aug 2026: HOSTAFRICA is linked on the first mention of
// four pages — the ones where a reader may reasonably want to check the
// company behind a disclosure — and nowhere else. On the other nine pages
// it is a passing routing mention, where a link informs nobody and turns
// a disclosure into an advert on a site whose position is that the role is
// "disclosed, never sold".
//
// Destination is the Kenyan site, not the group .com: the audience is
// Kenyan businesses. Plain and untracked, matching the rule that only the
// approved product route carries attribution.

const LINKED = [
  "/legal/commercial-relationships",
  "/about",
  "/paths/hostafrica-infrastructure",
  "/kedomains",
];
const UNLINKED = ["/", "/digital-fitness", "/contact", "/paths", "/how-it-works",
                  "/legal/tool-limitations", "/legal/privacy", "/guides/kenyan-vps"];

function bodyOf(html) {
  // Header and footer are shared furniture; only page content is in scope.
  return html.replace(/<header[\s\S]*?<\/header>/g, "").replace(/<footer[\s\S]*?<\/footer>/g, "");
}

test("the four chosen pages link HOSTAFRICA exactly once", async () => {
  for (const path of LINKED) {
    const body = bodyOf(await (await fetchPath(path)).text());
    const links = [...body.matchAll(/href="https:\/\/www\.hostafrica\.ke[^"]*"/g)];
    assert.equal(links.length, 1, `${path} should carry exactly one hostafrica.ke link, found ${links.length}`);
    assert.doesNotMatch(links[0][0], /utm_|aff=/, `${path}: informational links stay untracked`);
  }
});

test("the passing mentions stay plain text", async () => {
  for (const path of UNLINKED) {
    const body = bodyOf(await (await fetchPath(path)).text());
    assert.doesNotMatch(
      body,
      /href="https:\/\/www\.hostafrica\.ke/,
      `${path} links HOSTAFRICA — it was chosen to stay plain text`,
    );
  }
});

// The parser is the new risk: body copy is data, React escapes it, and a
// bug here would print raw markup to a visitor rather than fail a build.
test("the inline link parser produces tokens, never markup", () => {
  assert.deepEqual(parseInlineLinks("no links here"), ["no links here"],
    "text without a token is returned whole");

  const one = parseInlineLinks("go to [HOSTAFRICA](https://www.hostafrica.ke) today");
  assert.equal(one.length, 3, "text, link, text");
  assert.equal(one[0], "go to ");
  assert.deepEqual(one[1], { label: "HOSTAFRICA", href: "https://www.hostafrica.ke" });
  assert.equal(one[2], " today");
  assert.equal(isExternal(one[1].href), true, "an http href leaves the site");

  const internal = parseInlineLinks("see [the notice](/legal/privacy).");
  assert.deepEqual(internal[1], { label: "the notice", href: "/legal/privacy" });
  assert.equal(isExternal("/legal/privacy"), false, "an internal path stays in the tab");

  // A stray bracket must not be mistaken for a token.
  assert.deepEqual(parseInlineLinks("an [unclosed link example"), ["an [unclosed link example"]);
  // Nor a bracket with no href.
  assert.deepEqual(parseInlineLinks("[just brackets]"), ["just brackets".replace("just brackets","[just brackets]")]);
});

test("no page leaks an unrendered link token", async () => {
  for (const path of [...LINKED, ...UNLINKED]) {
    const html = await (await fetchPath(path)).text();
    assert.doesNotMatch(
      html,
      /\[[^\]]+\]\((?:https?:\/\/|\/)[^)]*\)/,
      `${path} shows a raw [text](href) token — the renderer did not run on that field`,
    );
  }
});
