import assert from "node:assert/strict";
import test from "node:test";

import { fetchPath } from "./helpers/server.mjs";

// The privacy notice runs fourteen sections and about 26 phone screens, so
// it carries a contents list (v4.69.0). A contents list whose links do not
// resolve is worse than none — it promises navigation and delivers a
// silent no-op — and the anchors are derived from section eyebrows, so
// editing a heading can break one without touching the list.

const LONG = ["/legal/privacy", "/legal/assessment-terms"];
const SHORT = ["/legal/tool-limitations", "/about", "/digital-fitness", "/contact"];

function parse(html) {
  const ids = [...html.matchAll(/<section class="content-section" id="([^"]+)"/g)].map((m) => m[1]);
  const nav = html.match(/<nav class="jump-list"[\s\S]*?<\/nav>/)?.[0] ?? "";
  const links = [...nav.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);
  return { ids, links, hasNav: !!nav };
}

test("long pages carry a contents list whose every link resolves", async () => {
  for (const path of LONG) {
    const { ids, links, hasNav } = parse(await (await fetchPath(path)).text());
    assert.ok(hasNav, `${path} should carry a contents list`);
    assert.ok(links.length >= 8, `${path} contents list has only ${links.length} entries`);
    assert.equal(links.length, ids.length, `${path}: ${links.length} links for ${ids.length} sections`);
    const dead = links.filter((l) => !ids.includes(l));
    assert.deepEqual(dead, [], `${path} contents links with no matching section: ${dead.join(", ")}`);
  }
});

test("section anchors are unique, so no link is ambiguous", async () => {
  for (const path of [...LONG, ...SHORT]) {
    const { ids } = parse(await (await fetchPath(path)).text());
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    assert.deepEqual(dupes, [], `${path} has duplicate section ids: ${dupes.join(", ")}`);
  }
});

test("short pages are not given a contents list", async () => {
  // The threshold is the point: a list of three entries above three
  // sections is furniture, not navigation.
  for (const path of SHORT) {
    const { hasNav, ids } = parse(await (await fetchPath(path)).text());
    assert.ok(ids.length < 8, `${path} now has ${ids.length} sections — re-check the threshold`);
    assert.ok(!hasNav, `${path} has only ${ids.length} sections and should not carry a contents list`);
  }
});
