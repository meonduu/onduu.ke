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
  registrarWebsite,
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

test("another TLD is checked as given, paired with the commercial default", () => {
  assert.deepEqual(candidatesFor("shop.com"), ["shop.com", "shop.co.ke"]);
});

test("junk, IP literals and URLs with credentials produce no candidates", () => {
  assert.deepEqual(candidatesFor("127.0.0.1"), []);
  assert.deepEqual(candidatesFor("not a name!"), []);
  assert.deepEqual(candidatesFor(""), []);
});

test("pasted URLs and casing normalise before candidates are built", () => {
  assert.deepEqual(candidatesFor("https://Shop.CO.KE/path"), ["shop.co.ke", "shop.ke"]);
});

test("every KeNIC third-level extension pairs with its .ke twin — no invented twins", () => {
  // The bug this pins: kra.go.ke once produced the nonsense "kra.go.co.ke".
  // Owner decision: exactly two results — the entered extension + name.ke.
  assert.deepEqual(candidatesFor("kra.go.ke"), ["kra.go.ke", "kra.ke"]);
  for (const ext of ["or.ke", "ne.ke", "go.ke", "me.ke", "mobi.ke", "info.ke", "sc.ke", "ac.ke"]) {
    const got = candidatesFor(`name.${ext}`);
    assert.deepEqual(got, [`name.${ext}`, "name.ke"], `wrong candidates for .${ext}`);
    assert.ok(!got.some((d) => d.includes(`.${ext}.`)), `invented twin under .${ext}`);
  }
});

test("subdomains collapse to the registrable domain", () => {
  assert.deepEqual(candidatesFor("portal.kra.go.ke"), ["kra.go.ke", "kra.ke"]);
  assert.deepEqual(candidatesFor("www.shop.co.ke"), ["shop.co.ke", "shop.ke"]);
  assert.deepEqual(candidatesFor("foo.bar.ke"), ["bar.ke", "bar.co.ke"]);
});

test("a bare KeNIC suffix alone is refused", () => {
  assert.deepEqual(candidatesFor("co.ke"), []);
  assert.deepEqual(candidatesFor("go.ke"), []);
});

/* ── availability classification with a stubbed network ── */

const RDAP_HOSTS = new Set(["rdap.org", "rdap.kenic.or.ke"]);

function stubNet({ dns = {}, rdap = {}, deadRdapHosts = [] }) {
  const dead = new Set(deadRdapHosts);
  return async (url) => {
    const u = new URL(url);
    if (u.hostname === "cloudflare-dns.com") {
      const name = u.searchParams.get("name");
      const type = u.searchParams.get("type");
      if (RDAP_HOSTS.has(name)) {
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
    if (RDAP_HOSTS.has(u.hostname)) {
      if (dead.has(u.hostname)) throw new TypeError("fetch failed");
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
  // KeNIC publishes only the RDAP spec-normalised spaced form.
  status: ["client transfer prohibited"],
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
  assert.equal(result.registrarUrl, "https://www.hostafrica.com", "known registrar links to its site");
  assert.equal(result.locked, true);
  assert.equal(result.expiryDate, "2027-03-01T00:00:00Z");
});

test("registrar names match their websites across published variants", () => {
  assert.equal(registrarWebsite("HostAfrica Kenya Ltd"), "https://www.hostafrica.com");
  assert.equal(registrarWebsite("Truehost Cloud Limited"), "https://truehost.co.ke");
  assert.equal(registrarWebsite("Safaricom PLC"), "https://www.safaricom.co.ke");
  assert.equal(registrarWebsite("GoDaddy.com, LLC"), "https://www.godaddy.com");
  assert.equal(registrarWebsite("Some Unknown Registrar Ltd"), null, "unknown names get no link");
  assert.equal(registrarWebsite(null), null);
});

test("KeNIC's nested registrar shape resolves the name from the abuse sub-entity", async () => {
  // KeNIC's registrar entity has only a handle; the display name lives in a
  // nested entity (verified against rdap.kenic.or.ke for onduu.ke).
  const KENIC_RECORD = {
    status: ["client transfer prohibited"],
    events: [{ eventAction: "expiration", eventDate: "2027-08-14T08:44:08Z" }],
    entities: [
      {
        roles: ["registrar"],
        handle: "EAL",
        entities: [
          { roles: ["abuse"], vcardArray: ["vcard", [["fn", {}, "text", "HOSTAFRICA EAC"]]] },
        ],
      },
    ],
  };
  const fetcher = stubNet({ dns: { "nested.ke": ["ns1.host.africa"] }, rdap: { "nested.ke": KENIC_RECORD } });
  const result = await checkDomain("nested.ke", makeBudget(5000, 10), fetcher);
  assert.equal(result.registrar, "HOSTAFRICA EAC");
  assert.equal(result.registrarUrl, "https://www.hostafrica.com", "nested name still matches its website");
  assert.equal(result.locked, true);
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

test("when KeNIC's RDAP is down, the rdap.org fallback still answers for .ke", async () => {
  const fetcher = stubNet({
    dns: { "taken.co.ke": ["ns1.host.africa"] },
    rdap: { "taken.co.ke": RDAP_RECORD },
    deadRdapHosts: ["rdap.kenic.or.ke"],
  });
  const result = await checkDomain("taken.co.ke", makeBudget(5000, 12), fetcher);
  assert.equal(result.status, "registered");
  assert.equal(result.registrar, "HOSTAFRICA", "fallback delivered the full record");
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
