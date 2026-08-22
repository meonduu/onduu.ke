import assert from "node:assert/strict";
import test from "node:test";
import {
  normaliseDomain,
  isValidDomain,
  analyseSpf,
  analyseDmarc,
  analyseDkim,
  analyseMx,
  parseSpfMechanisms,
  expandSpf,
  score,
  grade,
  buildFixes,
} from "../worker/email-check.js";

test("normalises the shapes people actually paste", () => {
  assert.equal(normaliseDomain("https://www.Example.co.ke/path?x=1"), "example.co.ke");
  assert.equal(normaliseDomain("me@example.ke"), "example.ke");
  assert.equal(normaliseDomain("EXAMPLE.KE."), "example.ke");
  assert.equal(normaliseDomain("  example.ke "), "example.ke");
});

test("rejects things that are not domains", () => {
  for (const bad of ["", "localhost", "no-tld", "-bad.ke", "a".repeat(300) + ".ke"]) {
    assert.equal(isValidDomain(normaliseDomain(bad)), false, `should reject: ${bad}`);
  }
  assert.equal(isValidDomain("safaricom.co.ke"), true);
});

test("+all is a failure, not a pass", () => {
  const result = analyseSpf(["v=spf1 include:_spf.google.com +all"], null);
  assert.equal(result.status, "fail");
  assert.match(result.detail, /every server on the internet/);
});

test("two SPF records is a failure", () => {
  const result = analyseSpf(["v=spf1 -all", "v=spf1 include:x.com -all"], null);
  assert.equal(result.status, "fail");
  assert.match(result.detail, /More than one SPF record/);
});

test("missing SPF is a failure", () => {
  assert.equal(analyseSpf([], null).status, "fail");
});

test("a clean -all record passes", () => {
  const result = analyseSpf(["v=spf1 include:_spf.google.com -all"], {
    total: 3,
    duplicates: [],
    unresolved: [],
  });
  assert.equal(result.status, "pass");
});

// Owner, 22 Aug 2026: ten lookups is the maximum RFC 7208 ALLOWS, so a
// record using ten is valid and working. The checker was marking 8, 9 and
// 10 as NEEDS WORK while printing "This is correct" beside the badge —
// the headroom remark shared an array with the real faults, and anything
// in that array set the status. Advice must not be scored as a defect.

test("a record at exactly 10 of 10 lookups passes — the limit is allowed, not exceeded", () => {
  const result = analyseSpf(["v=spf1 include:_spf.google.com -all"], {
    total: 10,
    duplicates: [],
    unresolved: [],
  });
  assert.equal(result.status, "pass", "ten lookups is compliant; the record works");
  assert.equal(result.lookups, 10);
  assert.match(result.detail, /This is correct/, "and the wording must agree with the badge");
  assert.match(result.detail, /no room left/, "the headroom is still worth saying");
});

test("8 and 9 lookups pass too, with the warning kept as advice", () => {
  for (const total of [8, 9]) {
    const result = analyseSpf(["v=spf1 include:_spf.google.com -all"], {
      total,
      duplicates: [],
      unresolved: [],
    });
    assert.equal(result.status, "pass", `${total} lookups is under the limit`);
    assert.match(result.detail, /Close to the limit/, `${total} should still carry the caution`);
  }
});

test("11 lookups is a fail, because the record actually stops working", () => {
  // The line that matters: at eleven the record permerrors, so nothing is
  // authenticated. That is a different thing from being at the limit.
  const result = analyseSpf(["v=spf1 include:_spf.google.com -all"], {
    total: 11,
    duplicates: [],
    unresolved: [],
  });
  assert.equal(result.status, "fail");
  assert.match(result.detail, /permanent error/);
});

test("real faults still mark the record as needing work, at any lookup count", () => {
  const dupes = analyseSpf(["v=spf1 include:a.com include:a.com -all"], {
    total: 4,
    duplicates: ["a.com"],
    unresolved: [],
  });
  assert.equal(dupes.status, "warn", "a duplicated include is a genuine defect");

  const dead = analyseSpf(["v=spf1 include:gone.example -all"], {
    total: 3,
    duplicates: [],
    unresolved: ["gone.example"],
  });
  assert.equal(dead.status, "warn", "an include resolving to nothing is a genuine defect");

  // And a fault at the limit is still a fault — the fix must not have
  // made 10 lookups a blanket pass.
  const both = analyseSpf(["v=spf1 include:a.com include:a.com -all"], {
    total: 10,
    duplicates: ["a.com"],
    unresolved: [],
  });
  assert.equal(both.status, "warn");
});

test("~all passes, with -all stated as the recommendation", () => {
  const result = analyseSpf(["v=spf1 include:_spf.google.com ~all"], {
    total: 3,
    duplicates: [],
    unresolved: [],
  });
  assert.equal(result.status, "pass");
  assert.match(result.detail, /softfail/);
  assert.match(result.detail, /"-all" is the recommended endpoint/);
});

test("~all with record problems still warns", () => {
  const result = analyseSpf(["v=spf1 include:_spf.google.com ~all"], {
    total: 3,
    duplicates: ["_spf.google.com"],
    unresolved: [],
  });
  assert.equal(result.status, "warn");
});

test("exceeding 10 lookups fails, because the record permerrors", () => {
  const result = analyseSpf(["v=spf1 include:a.com -all"], {
    total: 12,
    duplicates: [],
    unresolved: [],
  });
  assert.equal(result.status, "fail");
  assert.match(result.detail, /12 DNS lookups/);
});

test("counts only mechanisms that cost a lookup", () => {
  const parsed = parseSpfMechanisms(
    "v=spf1 ip4:1.2.3.4 a mx include:one.com include:two.com -all",
  );
  assert.deepEqual(parsed.includes, ["one.com", "two.com"]);
  assert.equal(parsed.bare, 2); // a, mx — ip4 and all are free
});

test("expansion walks the include tree and counts nested lookups", async () => {
  const zone = {
    "one.com": ["v=spf1 include:nested.com -all"],
    "nested.com": ["v=spf1 a mx -all"],
    "two.com": ["v=spf1 -all"],
  };
  const expansion = await expandSpf(
    "v=spf1 include:one.com include:two.com -all",
    async (name) => zone[name] || [],
  );
  // one + two + nested = 3 lookups, plus a and mx inside nested = 5
  assert.equal(expansion.total, 5);
  assert.deepEqual(expansion.unresolved, []);
});

test("expansion reports duplicates without double-counting their children", async () => {
  const zone = { "dup.com": ["v=spf1 a a a -all"] };
  const expansion = await expandSpf(
    "v=spf1 include:dup.com include:dup.com -all",
    async (name) => zone[name] || [],
  );
  assert.deepEqual(expansion.duplicates, ["dup.com"]);
});

test("expansion survives a self-referencing loop", async () => {
  const zone = { "loop.com": ["v=spf1 include:loop.com -all"] };
  const expansion = await expandSpf(
    "v=spf1 include:loop.com -all",
    async (name) => zone[name] || [],
  );
  assert.ok(expansion.total < 100, "a loop must not fan out indefinitely");
});

test("a dead include is recorded as unresolved", async () => {
  const expansion = await expandSpf("v=spf1 include:gone.com -all", async () => []);
  assert.deepEqual(expansion.unresolved, ["gone.com"]);
});

test("DMARC enforcing policies pass, p=none only warns", () => {
  assert.equal(analyseDmarc(["v=DMARC1; p=reject; rua=mailto:a@b.ke"]).status, "pass");
  assert.equal(analyseDmarc(["v=DMARC1; p=quarantine; rua=mailto:a@b.ke"]).status, "pass");
  assert.equal(analyseDmarc(["v=DMARC1; p=none; rua=mailto:a@b.ke"]).status, "warn");
  assert.equal(analyseDmarc([]).status, "fail");
});

test("quarantine's pass detail still recommends p=reject", () => {
  const result = analyseDmarc(["v=DMARC1; p=quarantine; rua=mailto:a@b.ke"]);
  assert.match(result.detail, /p=reject is the recommended endpoint/);
});

test("DMARC with a partial pct is not treated as full enforcement", () => {
  const result = analyseDmarc(["v=DMARC1; p=reject; pct=20; rua=mailto:a@b.ke"]);
  assert.equal(result.status, "warn");
  assert.match(result.detail, /80% is unprotected/);
});

test("an unfindable DKIM key on an enforcing domain is not called a failure", () => {
  const result = analyseDkim([], "Google Workspace", true);
  assert.equal(result.status, "warn");
  assert.equal(result.undetectable, true);
  assert.match(result.detail, /limit of the check/);
});

test("a key on the wrong selector still flags the provider gap", () => {
  const result = analyseDkim(["default"], "Google Workspace", true);
  assert.equal(result.status, "warn");
  assert.equal(result.missingProvider, "Google Workspace");
});

test("MX identifies the provider", () => {
  const result = analyseMx([{ priority: 1, host: "aspmx.l.google.com" }]);
  assert.equal(result.status, "pass");
  assert.equal(result.provider, "Google Workspace");
});

test("no MX is a failure", () => {
  assert.equal(analyseMx([]).status, "fail");
});

test("scoring puts an unspoofable domain far above a spoofable one", () => {
  const strong = score({
    mx: analyseMx([{ priority: 1, host: "aspmx.l.google.com" }]),
    spf: analyseSpf(["v=spf1 include:_spf.google.com -all"], { total: 3, duplicates: [], unresolved: [] }),
    dkim: analyseDkim(["google"], "Google Workspace", true),
    dmarc: analyseDmarc(["v=DMARC1; p=reject; rua=mailto:a@b.ke"]),
  });
  const weak = score({
    mx: analyseMx([{ priority: 1, host: "aspmx.l.google.com" }]),
    spf: analyseSpf([], null),
    dkim: analyseDkim([], "Google Workspace", false),
    dmarc: analyseDmarc([]),
  });
  assert.equal(strong, 100);
  assert.ok(weak < 30, `spoofable domain should score low, got ${weak}`);
  assert.equal(grade(strong), "A");
  assert.equal(grade(weak), "F");
});

test("fixes are ordered by priority and name the real problem", () => {
  const fixes = buildFixes({
    mx: analyseMx([]),
    spf: analyseSpf([], null),
    dkim: analyseDkim([], null, false),
    dmarc: analyseDmarc([]),
  });
  assert.ok(fixes.length >= 3);
  assert.deepEqual(
    fixes.map((f) => f.priority),
    [...fixes.map((f) => f.priority)].sort((a, b) => a - b),
  );
  assert.match(fixes[0].title, /MX|SPF|DMARC/);
});
