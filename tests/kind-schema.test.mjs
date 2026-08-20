import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { validate, normaliseKind, storageKind } from "../worker/submissions.ts";

// v4.64.0 renamed the form kind from "readiness" to "fitness" and left
// migration 0001's `CHECK (kind IN ('readiness','contact'))` untouched.
// Every assessment insert then failed and returned 500: the conversion
// path was down for about forty minutes in production on 20 August 2026.
//
// The whole suite passed throughout, because `tests/submissions.test.mjs`
// calls validate() directly and nothing ever exercised the insert. The
// application accepted a value its own database forbade, and no test could
// see the disagreement — the two halves were never compared.
//
// This compares them. It does not need a database: the constraint is in
// the migrations, the stored value comes from storageKind(), and the
// invariant is that one always satisfies the other.
//
// Every CHECK across every migration must hold, not just the newest,
// because a migration applied locally is not necessarily applied to
// production — that gap is exactly what broke the site. Satisfying all of
// them means the code is correct whichever have run.

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const MIGRATIONS = join(ROOT, "migrations");

function kindConstraints() {
  const sets = [];
  for (const file of readdirSync(MIGRATIONS).filter((f) => f.endsWith(".sql")).sort()) {
    const sql = readFileSync(join(MIGRATIONS, file), "utf8");
    for (const [, list] of sql.matchAll(/kind\s+TEXT\s+NOT\s+NULL\s+CHECK\s*\(\s*kind\s+IN\s*\(([^)]*)\)/gi)) {
      const allowed = [...list.matchAll(/'([^']+)'/g)].map((m) => m[1]);
      sets.push({ file, allowed });
    }
  }
  return sets;
}

test("the migrations really do constrain kind", () => {
  const sets = kindConstraints();
  assert.ok(
    sets.length > 0,
    "no CHECK on submissions.kind found — if the constraint was dropped, delete this test deliberately rather than letting it pass vacuously",
  );
});

test("every kind the form accepts can actually be stored", () => {
  const sets = kindConstraints();
  const valid = {
    full_name: "Jane Wanjiru",
    business_email: "jane@example.co.ke",
    company: "Example Ltd",
    business_result: "More qualified enquiries.",
    consent: true,
  };

  // Everything the wire accepts, including the pre-rename value a stale
  // browser tab still posts.
  for (const wire of ["fitness", "contact", "readiness"]) {
    assert.equal(validate(wire, valid).ok, true, `${wire} should validate`);

    const stored = storageKind(normaliseKind(wire));
    for (const { file, allowed } of sets) {
      assert.ok(
        allowed.includes(stored),
        `${wire} is accepted by the form but stores as "${stored}", which ` +
          `${file} forbids (allows ${allowed.map((a) => `"${a}"`).join(", ")}). ` +
          `This is the v4.64.0 failure: the insert would return 500.`,
      );
    }
  }
});

test("a kind the form rejects is never storable", () => {
  assert.equal(validate("nonsense", {}).ok, false);
});
