// Domain search: candidate generation, availability classification and the
// request handler — entirely offline with a stub fetcher.
import assert from "node:assert/strict";
import test from "node:test";
import { makeBudget } from "../worker/scan/net.ts";
import {
  candidatesFor,
  checkDomain,
  handleDomainSearch,
  withinSearchLimit,
  REGISTER_URL,
} from "../worker/domains.ts";

/* ── candidate generation: the .co.ke / .ke pair ── */

test("a bare name gets both Kenyan variants", () => {
  assert.deepEqual(candidatesFor("mybusiness"), ["mybusiness.co.ke", "mybusiness.ke"]);
});

test(".co.ke input adds the .ke twin, and vice versa", () => {
  assert.deepEqual(candidatesFor("shop.co.ke"), ["shop.co.ke", "shop.ke"]);
  assert.deepEqual(candidatesFor("shop.ke"), ["shop.ke", "shop.co.ke"]);
});

test("another TLD is checked alongside the Kenyan pair", () => {
  assert.deepEqual(candidatesFor("shop.com"), ["shop.com", "shop.co.ke", "shop.ke"]);
});

test("junk, IP literals and URLs with credentials produce no candidates", () => {
  assert.deepEqual(candidatesFor("127.0.0.1"), []);
  assert.deepEqual(candidatesFor("not a name!"), []);
  assert.deepEqual(candidatesFor(""), []);
});

test("pasted URLs and casing normalise before candidates are built", () => {
  assert.deepEqual(candidatesFor("https://Shop.CO.KE/path"), ["shop.co.ke", "shop.ke"]);
});

/* ── availability classification with a stubbed network ── */

function stubNet({ dns = {}, rdap = {} }) {
  return async (url) => {
    const u = new URL(url);
    if (u.hostname === "cloudflare-dns.com") {
      const name = u.searchParams.get("name");
      const type = u.searchParams.get("type");
      if (name === "rdap.org") {
        const answers = type === "A" ? [{ name, type: 1, data: "104.16.1.1" }] : [];
        return Response.json({ Status: 0, Answer: answers });
      }
      const entry = dns[name];
      if (!entry) return Response.json({ Status: 3 }); // NXDOMAIN
      if (entry === "fail") throw new TypeError("fetch failed");
      const answers =
        type === "NS" ? entry.map((data) => ({ name, type: 2, data })) : [];
      return Response.json({ Status: 0, Answer: answers });
    }
    if (u.hostname === "rdap.org") {
      const domain = decodeURIComponent(u.pathname.split("/").pop());
      const record = rdap[domain];
      if (!record)
        return Response.json({ errorCode: 404 }, { status: 404, headers: { "content-type": "application/rdap+json" } });
      return Response.json(record, { headers: { "content-type": "application/rdap+json" } });
    }
    throw new TypeError("fetch failed");
  };
}

const RDAP_RECORD = {
  status: ["client transfer prohibited", "clientTransferProhibited"],
  events: [{ eventAction: "expiration", eventDate: "2027-03-01T00:00:00Z" }],
  entities: [
    { roles: ["registrar"], vcardArray: ["vcard", [["fn", {}, "text", "HOSTAFRICA"]]] },
  ],
};

test("a domain with an RDAP record reports registrar, lock and expiry", async () => {
  const fetcher = stubNet({ dns: { "taken.co.ke": ["ns1.host.africa"] }, rdap: { "taken.co.ke": RDAP_RECORD } });
  const result = await checkDomain("taken.co.ke", makeBudget(5000, 10), fetcher);
  assert.equal(result.status, "registered");
  assert.equal(result.registrar, "HOSTAFRICA");
  assert.equal(result.locked, true);
  assert.equal(result.expiryDate, "2027-03-01T00:00:00Z");
});

test("a domain in DNS but without RDAP is registered with unknown details", async () => {
  const fetcher = stubNet({ dns: { "quiet.ke": ["ns1.kenic.or.ke"] } });
  const result = await checkDomain("quiet.ke", makeBudget(5000, 10), fetcher);
  assert.equal(result.status, "registered");
  assert.equal(result.registrar, null);
});

test("NXDOMAIN plus no RDAP record appears available, with the register link", async () => {
  const fetcher = stubNet({});
  const result = await checkDomain("free-name.co.ke", makeBudget(5000, 10), fetcher);
  assert.equal(result.status, "maybe-available");
  assert.equal(result.registerUrl, REGISTER_URL);
  assert.match(REGISTER_URL, /utm_source=onduu/, "attribution is UTM");
  assert.doesNotMatch(REGISTER_URL, /aff=/, "no affiliate parameter");
});

test("a DNS transport failure is unknown, never available", async () => {
  const fetcher = stubNet({ dns: { "flaky.co.ke": "fail" } });
  const result = await checkDomain("flaky.co.ke", makeBudget(5000, 10), fetcher);
  assert.equal(result.status, "unknown");
  assert.equal(result.registerUrl, undefined);
});

/* ── the handler ── */

test("the handler validates input and method", async () => {
  const fetcher = stubNet({});
  const empty = await handleDomainSearch(new Request("https://onduu.ke/api/domains"), fetcher);
  assert.equal(empty.status, 400);

  const bad = await handleDomainSearch(new Request("https://onduu.ke/api/domains?q=%20!!"), fetcher);
  assert.equal(bad.status, 400);

  const post = await handleDomainSearch(
    new Request("https://onduu.ke/api/domains?q=shop", { method: "POST" }),
    fetcher,
  );
  assert.equal(post.status, 405);
});

test("a search returns the pair with mixed statuses", async () => {
  const fetcher = stubNet({ dns: { "shop.co.ke": ["ns1.host.africa"] }, rdap: { "shop.co.ke": RDAP_RECORD } });
  const res = await handleDomainSearch(new Request("https://onduu.ke/api/domains?q=shop"), fetcher);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.ok, true);
  assert.equal(data.results.length, 2);
  const byDomain = Object.fromEntries(data.results.map((r) => [r.domain, r.status]));
  assert.equal(byDomain["shop.co.ke"], "registered");
  assert.equal(byDomain["shop.ke"], "maybe-available");
});

/* ── rate limiting ── */

test("the per-connection search limit refuses after the cap and resets", () => {
  const t0 = Date.now();
  for (let i = 0; i < 30; i++) assert.equal(withinSearchLimit("test-key", t0 + i), true);
  assert.equal(withinSearchLimit("test-key", t0 + 100), false);
  assert.equal(withinSearchLimit("other-key", t0 + 100), true);
  assert.equal(withinSearchLimit("test-key", t0 + 61 * 60 * 1000), true);
});
