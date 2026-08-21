import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const CHANGELOG = readFileSync(join(ROOT, "CHANGELOG.md"), "utf8");
const OPERATIONS = readFileSync(join(ROOT, "OPERATIONS.md"), "utf8");

// The owner built the lessons register on 20 Aug 2026 and asked the
// obvious question a day later: what makes anyone actually write in it?
// Twice by then a release had described a fault and recorded nothing —
// v4.64.3 (a forty-minute production outage) and v4.72.0 (a wrong
// conclusion that made visitors retype). Both were caught by a person
// noticing, which is exactly the mechanism a register is supposed to
// replace.
//
// This is deliberately NOT "every release needs a lesson". Forcing one
// each time would fill the register with filler and devalue the entries
// that matter. It forces a DECISION: a release that describes a fault
// must either cite a lesson — new or existing — or say in one line why
// none is needed. Either is fine; silence is not.

// Tuned against the real changelog rather than guessed. Words like
// "broke" and "silently" were tried and rejected: they appear most often
// describing a guard working correctly, so they flagged healthy releases.
const FAULT_SIGNALS = [
  /\bregression\b/i,
  /\boutage\b/i,
  /\bincident\b/i,
  /\b(was|were)\s+(wrong|broken|false)\b/i,
  /\bmy\s+(mistake|error|regression)\b/i,
  /\bI\s+(was|got)\s+(this\s+)?wrong\b/i,
  /\bproduction\s+(was|went)\s+down\b/i,
];

// "no regression", "prevents a regression", "not an outage" are the
// opposite of a fault report and must not trip the check.
const NEGATED = /\b(no|not|never|prevents?|preventing|without|avoids?)\s+(a\s+|an\s+|the\s+)?$/i;

function faultSignalsIn(text) {
  const found = [];
  for (const rx of FAULT_SIGNALS) {
    const m = text.match(rx);
    if (!m) continue;
    const runUp = text.slice(Math.max(0, m.index - 24), m.index);
    if (NEGATED.test(runUp)) continue;
    found.push(m[0]);
  }
  return found;
}

function currentEntry() {
  const version = CHANGELOG.match(/^CURRENT VERSION:\s*(v[\d.]+)/m)?.[1];
  assert.ok(version, "CHANGELOG.md must carry a CURRENT VERSION line");
  const start = CHANGELOG.indexOf(`## ${version} —`);
  assert.ok(start > -1, `no changelog entry found for ${version}`);
  const next = CHANGELOG.indexOf("\n## v", start + 1);
  return { version, body: CHANGELOG.slice(start, next === -1 ? undefined : next) };
}

const lessonNumbers = [...OPERATIONS.matchAll(/\*\*L(\d+)\s+—/g)].map((m) => Number(m[1]));

test("the lessons register numbers each entry once", () => {
  const dupes = lessonNumbers.filter((n, i) => lessonNumbers.indexOf(n) !== i);
  assert.deepEqual(dupes, [], `duplicate lesson numbers in OPERATIONS.md: L${dupes.join(", L")}`);
  assert.ok(lessonNumbers.length > 0, "no lessons found — has the register's format changed?");
});

test("a release describing a fault cites a lesson or says why not", () => {
  const { version, body } = currentEntry();
  const signals = faultSignalsIn(body);
  if (signals.length === 0) return; // nothing fault-shaped; nothing to declare

  const cited = [...body.matchAll(/\bL(\d+)\b/g)].map((m) => Number(m[1]));
  const declined = /No lesson:/i.test(body);

  assert.ok(
    cited.length > 0 || declined,
    `${version} describes a fault (${signals.join(", ")}) but neither cites a lesson ` +
      `nor declines one.\n` +
      `Add an L-entry to OPERATIONS.md and reference it here, cite an existing ` +
      `lesson, or write "No lesson: <one line why>" in the entry.`,
  );

  for (const n of cited) {
    assert.ok(
      lessonNumbers.includes(n),
      `${version} cites L${n}, which does not exist in OPERATIONS.md`,
    );
  }
});
