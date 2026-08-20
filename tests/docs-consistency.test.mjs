import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, basename } from "node:path";
import { fileURLToPath } from "node:url";

// Lesson L4 (OPERATIONS.md): documentation understating reality recurred
// four times in two days. This is its executable guard, limited to the
// LIVING documents — CHANGELOG.md, the specs and the strategy papers are
// historical records and correctly keep the paths of their moment.
const ROOT = fileURLToPath(new URL("..", import.meta.url));
const LIVING = ["README.md", "CLAUDE.md", "ROADMAP.md", "REVIEW.md", "OPERATIONS.md"];

const allFiles = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (["node_modules", "dist", ".astro", ".git", ".wrangler"].includes(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else allFiles.push(p);
  }
})(ROOT);
const byBase = new Map();
for (const f of allFiles) {
  const b = basename(f);
  byBase.set(b, [...(byBase.get(b) ?? []), f]);
}

test("every repo path named in a living document exists", () => {
  const misses = [];
  for (const doc of LIVING) {
    const text = readFileSync(join(ROOT, doc), "utf8");
    const refs = text.matchAll(/`([A-Za-z0-9_./-]+\.(?:md|ts|tsx|mjs|json|jsonc|sql|astro))`/g);
    for (const [, ref] of refs) {
      if (ref.includes("*")) continue;
      const ok =
        existsSync(join(ROOT, ref)) ||
        (byBase.get(basename(ref)) ?? []).some((f) => f.endsWith(ref) || basename(ref) === ref);
      if (!ok) misses.push(`${doc} → \`${ref}\``);
    }
  }
  assert.deepEqual(misses, [], `living docs name files that do not exist:\n${misses.join("\n")}`);
});

test("living documents do not describe the retired site", () => {
  // Route names and framings removed in Phase 1 (v4.0.0) and after. CLAUDE.md
  // and ROADMAP.md may name them as banned/superseded; README.md must not
  // present them as what the site includes.
  const readme = readFileSync(join(ROOT, "README.md"), "utf8");
  for (const gone of ["check.astro", "Labs", "`/check`", "Managed Operations", "Agent Pilot", "Results,"]) {
    assert.ok(!readme.includes(gone), `README.md still describes the retired site: ${JSON.stringify(gone)}`);
  }
  // The vinext-era app/ directory is gone everywhere.
  for (const doc of LIVING) {
    const text = readFileSync(join(ROOT, doc), "utf8");
    assert.doesNotMatch(text, /`app\//, `${doc} references the retired app/ directory`);
  }
});

test("the four governance files reference each other", () => {
  const need = {
    "CLAUDE.md": ["ROADMAP.md", "REVIEW.md", "OPERATIONS.md"],
    "README.md": ["CLAUDE.md", "ROADMAP.md", "REVIEW.md", "OPERATIONS.md"],
    "REVIEW.md": ["OPERATIONS.md"],
    "OPERATIONS.md": ["REVIEW.md", "CLAUDE.md"],
  };
  for (const [doc, wants] of Object.entries(need)) {
    const text = readFileSync(join(ROOT, doc), "utf8");
    for (const want of wants) {
      assert.ok(text.includes(want), `${doc} should point at ${want}`);
    }
  }
});
