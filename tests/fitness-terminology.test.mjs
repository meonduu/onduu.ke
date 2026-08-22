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
// Published article prose. The 18 August tools article was regenerated for
// the rename (v4.64.0) rather than word-patched, and it deliberately keeps
// the retired term in a dated postscript explaining the change — a
// published article that quietly rewrites its own history is worse than
// one that says what changed. So this file is excluded by intent, not by
// oversight.
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
          // The deliberate shims: the legacy form kind, the 301, and
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
    "/guides", "/dns", "/legal/privacy", "/legal/assessment-terms",
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
    const text = (await (await fetchPath(path)).text())
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ");

    // The site says these things in order to deny them — "no score
    // certifies that a business is digitally fit" must pass while "your
    // business is digitally fit" must fail. So find every claim, then
    // require a negation in the run-up to it. Checking the preceding words
    // is the whole test; an earlier version leaned on trailing punctuation
    // and passed for a reason that had nothing to do with the denial.
    const DENIAL = /\b(?:not|never|no|nor|cannot|does not|is not|doesn't)\b/i;
    const claims = [
      [/\b(?:is|are)\s+(?:now\s+)?digitally fit\b/gi, "states an absolute fitness verdict"],
      [/\b(?:is|are)\s+(?:now\s+)?certified\b/gi, "claims a certification"],
      [/\bcertif(?:ies|ication|icate)\b/gi, "presents the assessment as a certification"],
      [/\bguarantee[sd]?\b[^.]{0,40}\bfit\b/gi, "guarantees fitness"],
    ];
    for (const [pattern, complaint] of claims) {
      for (const match of text.matchAll(pattern)) {
        const runUp = text.slice(Math.max(0, match.index - 80), match.index);
        assert.ok(
          DENIAL.test(runUp),
          `${path} ${complaint}: ...${runUp.slice(-60)}[${match[0]}]`,
        );
      }
    }
  }
});

// RETIRED 22 Aug 2026 (owner). "The score is never rendered without its
// coverage beside it" guarded the pairing CLAUDE.md describes — a Public
// Signal Score shown alongside its Evidence Coverage. The owner removed the
// coverage line from the result headline twice in one day, the second time
// explicitly; that is a decision, not drift, and a guard that fails on a
// decision is noise. The figure is still computed, still returned by the
// API, still shown on /go/scans, and still explained on the /scan page
// itself (below). What changed is that the result panel opens with the
// score and the domain and nothing else.
//
// CLAUDE.md's wording ("may report only public observations, a Public
// Signal Score and Evidence Coverage") reads as a ceiling on what a scan
// may claim, not a floor on what the panel must print — but if a reviewer
// reads it the other way, this is the line to revisit.

test("the scan page explains Evidence Coverage before anyone runs one", async () => {
  // Renamed 22 Aug 2026 to say what it actually checks. It was called "the
  // score is never shown without its evidence coverage", which reads as a
  // guarantee about the RESULT — and it never tested the result at all.
  // The result panel is a React island rendered in the browser, so it is
  // absent from this HTML, and the test passed unchanged on the day the
  // coverage figure was removed from that panel (owner's instruction). A
  // guard named for something it cannot see is worse than no guard: it
  // occupies the space where a real one would go.
  const html = await (await fetchPath("/scan")).text();
  assert.match(html, /Evidence Coverage/i, "/scan must name Evidence Coverage");
  assert.match(
    html,
    /not a Digital Fitness Score/i,
    "/scan must keep the Public Signal Score distinct from the verified score",
  );
});
