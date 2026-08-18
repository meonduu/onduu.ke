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
