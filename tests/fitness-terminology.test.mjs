import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// Digital Readiness became Digital Fitness on the owner's instruction,
// 20 August 2026 (v4.64.0). Two things have to hold afterwards, and neither
// is self-enforcing:
//
//   1. The old vocabulary must not creep back. A rename that lands in nine
//      files and is undone in one produces a site that calls its own
//      product two names — the failure mode that made the guides index
//      unclickable and the enquiry path silent, both of which were single
//      inconsistencies nobody was checking for.
//   2. "Fitness" invites a claim that "readiness" did not. A readiness
//      score sounds like a measurement; a fitness score sounds like a
//      verdict. The owner's instruction was explicit: no certification
//      language, and no absolute fitness claim without sufficient evidence
//      coverage. That is a content rule, so it needs a content test.
//
// Live surfaces only. CHANGELOG.md, docs/strategy/ and parity-baseline.json
// are dated records of what was true when written; rewriting them to match
// today's vocabulary would falsify the audit trail, so they are excluded
// here by the same reasoning that excluded them from the rename.

import { fetchPath } from "./helpers/server.mjs";

const SOURCE_DIRS = ["src", "worker", "scripts"];
const SOURCE_EXTS = [".ts", ".tsx", ".astro", ".mjs"];
// Published article prose. CLAUDE.md: regenerate, never hand-edit — so the
// rename deliberately did not touch it, and this guard must not demand it.
const EXCLUDED_FILES = new Set(["src/data/insights-data.ts"]);

function sourceFiles(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(path, acc);
    else if (SOURCE_EXTS.some((e) => entry.name.endsWith(e))) acc.push(path);
  }
  return acc;
}

// Comments are exempt on purpose. This repo explains itself in comments,
// and the three compatibility shims below each need a paragraph saying why
// the old word is still there — a guard that forbade the word outright
// would force those explanations to be deleted, which is the opposite of
// what it is for. Code and strings are what this checks.
const COMMENT_LINE = /^\s*(?:\/\/|\/\*|\*|#)/;

test("the old vocabulary does not return to live code", () => {
  const offenders = [];
  for (const dir of SOURCE_DIRS) {
    for (const file of sourceFiles(dir)) {
      if (EXCLUDED_FILES.has(file)) continue;
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (!/readiness/i.test(line) || COMMENT_LINE.test(line)) return;
          // The three deliberate shims: the legacy form kind, the 301, and
          // the pre-rename dimension label kept for stored psr-v1 rows.
          if (/kind === "readiness" \? "fitness"/.test(line)) return;
          if (/"\/readiness":\s*"\/digital-fitness"/.test(line)) return;
          if (/"agent-readiness":\s*"Agent fitness"/.test(line)) return;
          offenders.push(`${file}:${i + 1}  ${line.trim().slice(0, 90)}`);
        });
    }
  }
  assert.deepEqual(offenders, [], `pre-rename terminology found:\n${offenders.join("\n")}`);
});

test("no visitor-facing page still says Readiness", async () => {
  // The check that actually protects the visitor: whatever the source says,
  // nothing rendered may carry the retired vocabulary.
  const paths = [
    "/", "/digital-fitness", "/how-it-works", "/about", "/contact", "/scan",
    "/guides", "/paths", "/dns", "/legal/privacy", "/legal/assessment-terms",
  ];
  for (const path of paths) {
    const html = await (await fetchPath(path)).text();
    assert.doesNotMatch(html, /readiness/i, `${path} still renders the old vocabulary`);
  }
});

test("/readiness permanently redirects to /digital-fitness", async () => {
  const response = await fetchPath("/readiness", "text/html", { redirect: "manual" });
  assert.equal(response.status, 301, "the most-linked route on the site must not 404");
  assert.match(
    response.headers.get("location") ?? "",
    /\/digital-fitness$/,
    "old inbound links must land on the renamed page",
  );
});

test("the assessment page carries the new vocabulary", async () => {
  const html = await (await fetchPath("/digital-fitness")).text();
  assert.match(html, /Digital Fitness Assessment/, "the product must be named");
  assert.match(html, /Digital Fitness Score/, "the result must be named");
  assert.match(html, /Evidence Coverage/i, "the supporting measure must be named");
  assert.match(html, /How digitally fit is your business\?/, "the central question must appear");
});

test("no page claims a certification or declares a business digitally fit", async () => {
  const paths = ["/", "/digital-fitness", "/scan", "/how-it-works", "/legal/assessment-terms"];
  for (const path of paths) {
    const html = await (await fetchPath(path)).text();
    // "not a compliance certificate" and "no score certifies" are denials,
    // so match the claim shape rather than the word.
    assert.doesNotMatch(
      html,
      /(?:is|are)\s+(?:now\s+)?(?:certified|digitally fit\b)(?!\s*[?.]?\s*<)/i,
      `${path} states an absolute fitness verdict`,
    );
    assert.doesNotMatch(
      html,
      /Digital Fitness (?:Score|Assessment|Certification)[^.<]{0,40}\bcertif(?:ies|ication|icate)\b(?![^.<]*\bnot\b)/i,
      `${path} presents the assessment as a certification`,
    );
    assert.doesNotMatch(
      html,
      /guarantee[sd]?\s+(?:your|the)\s+(?:business|website|domain)\s+is\s+fit/i,
      `${path} guarantees fitness`,
    );
  }
});

test("the score is never shown without its evidence coverage", async () => {
  // The scan page is where a number is most likely to be read as a verdict,
  // so the coverage caveat has to be on the page itself, not only in terms.
  const html = await (await fetchPath("/scan")).text();
  assert.match(html, /Evidence Coverage/i, "/scan must name Evidence Coverage");
  assert.match(
    html,
    /not a Digital Fitness Score/i,
    "/scan must keep the Public Signal Score distinct from the verified score",
  );
});
