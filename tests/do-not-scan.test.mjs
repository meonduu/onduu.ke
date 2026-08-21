import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { fetchPath, startWorker } from "./helpers/server.mjs";
import { validateOptOut, lookupToken, confirmToken } from "../worker/do-not-scan.ts";

// The domain-owner opt-out, self-service since 21 Aug 2026 (v4.84.0).
// Before it, the route was the sales contact form — company name and
// "what business result should the website produce" required in order to
// be left alone — and nothing checked that the requester controlled the
// domain, so the blocklist could be aimed at a competitor. Three things
// this file holds:
//
//   1. The ownership rule is EXACT. A suffix match would let
//      someone@example.co.ke block co.ke and silence every .co.ke domain.
//   2. A confirmation link does nothing until the POST; a GET only looks.
//      Mail filters fetch links before the reader sees them.
//   3. The route is the one the site publishes, and the privacy notice
//      says what the one email costs (ZeptoMail sees the address). L8/L14:
//      the notice and the code change in the same release, or the notice
//      goes false.

/* ── 1. the rule, in isolation ─────────────────────────────────────── */

test("accepts an address at the domain, and normalises what was typed", () => {
  const r = validateOptOut({ domain: "https://www.Example.CO.KE/page", email: "Me@Example.co.ke" });
  assert.equal(r.ok, true);
  assert.equal(r.data.domain, "example.co.ke");
  assert.equal(r.data.email, "me@example.co.ke");
  assert.equal(r.data.note, null);
});

test("the email must be at the domain itself — not a subdomain, not a parent, not elsewhere", () => {
  const cases = [
    ["example.co.ke", "me@mail.example.co.ke", "a subdomain mailbox does not prove the parent"],
    ["mail.example.co.ke", "me@example.co.ke", "a parent mailbox is not the subdomain asked for"],
    ["example.co.ke", "me@gmail.com", "any other host"],
    ["example.co.ke", "me@example.ke", "the .ke twin is a different domain"],
  ];
  for (const [domain, email, why] of cases) {
    const r = validateOptOut({ domain, email });
    assert.equal(r.ok, false, why);
    assert.ok(r.errors.email, `${why}: the email field must carry the error`);
  }
});

test("registry extensions cannot be opted out — a block there would cover everyone under it", () => {
  for (const ext of ["co.ke", "or.ke", "go.ke", "ac.ke", "ke"]) {
    const r = validateOptOut({ domain: ext, email: `hostmaster@${ext}` });
    assert.equal(r.ok, false, ext);
    assert.ok(r.errors.domain, `${ext}: refused on the domain field`);
  }
});

test("rejects what is not a domain at all", () => {
  for (const bad of ["", "not a domain", "1.2.3.4", "localhost", "http://", "a@b"]) {
    const r = validateOptOut({ domain: bad, email: "me@example.co.ke" });
    assert.equal(r.ok, false, JSON.stringify(bad));
  }
});

test("the note is optional and capped", () => {
  assert.equal(validateOptOut({ domain: "example.co.ke", email: "me@example.co.ke", note: "  " }).data.note, null);
  const long = validateOptOut({ domain: "example.co.ke", email: "me@example.co.ke", note: "x".repeat(501) });
  assert.equal(long.ok, false);
  assert.ok(long.errors.note);
});

/* ── 2. the token lifecycle, against an in-memory D1 ───────────────── */

const sha256 = (s) => createHash("sha256").update(s).digest("hex");
const TOKEN = "ab".repeat(24); // 48 hex chars, the shape the lookup requires

function fakeDb(row) {
  const requests = row ? [row] : [];
  const blocklist = new Map();
  const calls = [];
  return {
    requests,
    blocklist,
    calls,
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async first() {
              if (sql.includes("FROM do_not_scan_requests WHERE token_hash")) {
                return requests.find((r) => r.token_hash === args[0]) ?? null;
              }
              if (sql.includes("FROM scan_blocklist")) return args.some((d) => blocklist.has(d)) ? { 1: 1 } : null;
              throw new Error(`unexpected first(): ${sql}`);
            },
            async run() {
              calls.push(sql.split(" ").slice(0, 3).join(" "));
              if (sql.startsWith("INSERT INTO scan_blocklist")) {
                blocklist.set(args[0], { created_at: args[1], note: args[2] });
              } else if (sql.startsWith("UPDATE do_not_scan_requests SET confirmed_at")) {
                const r = requests.find((r) => r.reference === args[1]);
                if (r) r.confirmed_at = args[0];
              } else if (sql.startsWith("DELETE FROM")) {
                return { meta: { changes: sql.includes("scans") ? 2 : 1 } };
              }
              return { meta: { changes: 1 } };
            },
          };
        },
      };
    },
  };
}

const future = new Date(Date.now() + 60_000).toISOString();
const past = new Date(Date.now() - 60_000).toISOString();
const pending = () => ({
  reference: "ON-260821-TEST",
  domain: "example.co.ke",
  email: "me@example.co.ke",
  token_hash: sha256(TOKEN),
  expires_at: future,
  confirmed_at: null,
});
// No secrets: the owner notification logs "skipped" and sends nothing.
const quietEnv = {};

test("a GET-side lookup resolves the token without touching the blocklist", async () => {
  const db = fakeDb(pending());
  const r = await lookupToken(db, TOKEN);
  assert.deepEqual(r, { state: "ready", domain: "example.co.ke", reference: "ON-260821-TEST" });
  assert.equal(db.blocklist.size, 0, "looking must not block");
  assert.deepEqual(db.calls, [], "looking must write nothing");
});

test("the POST-side confirm blocks the domain, deletes its records, and burns the token", async () => {
  const db = fakeDb(pending());
  const r = await confirmToken(db, quietEnv, TOKEN);
  assert.equal(r.state, "done");
  assert.equal(r.domain, "example.co.ke");
  assert.equal(r.deleted, 3, "scan deletions plus lookup deletions are reported together");
  assert.ok(db.blocklist.has("example.co.ke"));
  assert.match(db.blocklist.get("example.co.ke").note, /ON-260821-TEST/, "the blocklist note cites the request");

  const again = await confirmToken(db, quietEnv, TOKEN);
  assert.equal(again.state, "used", "a second press must not run the deletion twice");
});

test("an expired, used, malformed or unknown token does nothing", async () => {
  assert.equal((await lookupToken(fakeDb({ ...pending(), expires_at: past }), TOKEN)).state, "expired");
  assert.equal((await lookupToken(fakeDb({ ...pending(), confirmed_at: past }), TOKEN)).state, "used");
  assert.equal((await lookupToken(fakeDb(pending()), "short")).state, "invalid");
  assert.equal((await lookupToken(fakeDb(pending()), "ff".repeat(24))).state, "invalid");
  const db = fakeDb({ ...pending(), expires_at: past });
  assert.equal((await confirmToken(db, quietEnv, TOKEN)).state, "expired");
  assert.equal(db.blocklist.size, 0);
});

/* ── 3. through the real built Worker ──────────────────────────────── */

const post = (body) =>
  fetchPath("/api/do-not-scan", "application/json", {
    method: "POST",
    headers: { "content-type": "application/json" },
    // Cloudflare's published test secret in .dev.vars passes any token.
    body: JSON.stringify({ "cf-turnstile-response": "test", ...body }),
  });

test("the API refuses GET and validates before it stores anything", async () => {
  assert.equal((await fetchPath("/api/do-not-scan", "application/json")).status, 405);

  const badDomain = await post({ domain: "co.ke", email: "x@co.ke" });
  assert.equal(badDomain.status, 400);
  assert.ok((await badDomain.json()).fields.domain);

  const badEmail = await post({ domain: "example.co.ke", email: "me@gmail.com" });
  assert.equal(badEmail.status, 400);
  assert.ok((await badEmail.json()).fields.email);
});

test("without mail secrets the request fails honestly, and a failed request does not start the cooldown", async () => {
  // .dev.vars carries no ZeptoMail token, so the send cannot succeed here.
  // The behaviour under test is what the visitor is told and what is left
  // behind: "try again later" must be true, so the pending row has to go.
  const first = await post({ domain: "retry-test.co.ke", email: "me@retry-test.co.ke" });
  assert.equal(first.status, 502, await first.clone().text());
  assert.match((await first.json()).error, /could not be sent/i);

  const second = await post({ domain: "retry-test.co.ke", email: "me@retry-test.co.ke" });
  assert.equal(second.status, 502, "a second try must reach the send again, not a cooldown notice");
});

test("/do-not-scan asks for the domain and an address there — and nothing from the sales form", async () => {
  const res = await fetchPath("/do-not-scan");
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.match(html, /<h1>Leave my domain alone\.<\/h1>/);
  assert.match(html, /name="domain"/);
  assert.match(html, /name="email"/);
  for (const salesField of ["company", "business_result", "full_name", "primary_concern", "trigger_now"]) {
    assert.doesNotMatch(html, new RegExp(`name="${salesField}"`), `a data-rights request must not ask for ${salesField}`);
  }
  assert.match(html, /href="\/legal\/privacy"/, "the consent line points at the notice");
  assert.match(html, /rel="canonical" href="https:\/\/onduu\.ke\/do-not-scan"/);
});

test("the confirm page acts only on POST, and a bad or missing token is harmless", async () => {
  for (const path of ["/do-not-scan/confirm", "/do-not-scan/confirm?token=nope", `/do-not-scan/confirm?token=${"00".repeat(24)}`]) {
    const res = await fetchPath(path);
    assert.equal(res.status, 200, path);
    const html = await res.text();
    assert.match(html, /not recognised/, path);
    assert.match(html, /name="robots" content="noindex/, "a token page must never be indexed");
    assert.doesNotMatch(html, /<form/, `${path}: no button without a live token`);
  }
  // Astro's checkOrigin guard refuses a form POST whose Origin is not
  // this site — which is what a browser sends for the page's own button.
  // The first version of this test omitted Origin and met a 403: the
  // guard doing its job, not the page failing.
  const origin = await startWorker();
  const posted = await fetchPath("/do-not-scan/confirm", "text/html", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", origin },
    body: "token=nope",
  });
  assert.equal(posted.status, 200);
  assert.match(await posted.text(), /not recognised/);

  const crossSite = await fetchPath("/do-not-scan/confirm", "text/html", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", origin: "https://evil.example" },
    body: "token=nope",
  });
  assert.equal(crossSite.status, 403, "a cross-site form POST must be refused before the token is even read");
});

/* ── 4. the published route, and the notice that describes it ─────── */

test("every page that offers the opt-out points at /do-not-scan, not the sales form", async () => {
  for (const path of ["/scan", "/legal/privacy", "/legal/tool-limitations"]) {
    const html = await (await fetchPath(path)).text();
    assert.match(html, /href="\/do-not-scan"/, `${path} must link the self-service route`);
    assert.doesNotMatch(
      html.replace(/<[^>]+>/g, " "),
      /left alone[^.]{0,80}contact form|do not want it scanned[^.]{0,40}contact form/i,
      `${path} still routes the opt-out through the contact form`,
    );
  }
  const sitemap = await (await fetchPath("/sitemap.xml", "application/xml")).text();
  assert.match(sitemap, /<loc>https:\/\/onduu\.ke\/do-not-scan<\/loc>/);
});

test("the privacy notice says what the one email costs", async () => {
  // ZeptoMail's card said it never receives a visitor's address. It now
  // receives one, for one purpose; the card must say so (lesson L8).
  const text = (await (await fetchPath("/legal/privacy")).text()).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  assert.match(text, /ZeptoMail[^.]*\.[^]*?confirmation link[^.]*address/i, "the ZeptoMail card must state the exception");
  assert.match(text, /email address at the domain/i, "the domain-tools section must say why an address is asked for");
  assert.doesNotMatch(text, /\[\/do-not-scan\]/, "an inline-link token leaked unrendered into the notice");
});

test("/scan offers a correction route beside the opt-out", async () => {
  // The ratings firms learned most people who write in want a finding
  // fixed, not the record removed. Both doors on the same page.
  const text = (await (await fetchPath("/scan")).text()).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  assert.match(text, /finding[^.]{0,40}wrong[^.]{0,80}re-examined/i);
});
