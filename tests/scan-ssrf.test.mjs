// Launch gate 1 (docs/specs/instant-scan.md §7): the SSRF suite. Every
// control in worker/scan/net.ts exercised offline with a stub fetcher —
// no network is touched anywhere in this file.
import assert from "node:assert/strict";
import test from "node:test";
import {
  normaliseHost,
  isScannableHost,
  isForbiddenIPv4,
  isForbiddenIPv6,
  makeBudget,
  resolveAndValidate,
  safeFetch,
} from "../worker/scan/net.ts";

/* ── input normalisation and hostname policy ── */

test("normaliseHost accepts the shapes people paste", () => {
  assert.equal(normaliseHost("https://www.example.co.ke/path?q=1"), "example.co.ke");
  assert.equal(normaliseHost("Example.CO.KE."), "example.co.ke");
  assert.equal(normaliseHost("user@example.co.ke"), "example.co.ke");
  assert.equal(normaliseHost("münchen.de"), "xn--mnchen-3ya.de");
});

test("hostnames with ports, brackets or nothing left are refused", () => {
  assert.equal(normaliseHost("example.co.ke:8080"), null);
  assert.equal(normaliseHost("[::1]"), null);
  assert.equal(normaliseHost("https://"), null);
  assert.equal(normaliseHost(""), null);
});

test("every IPv4 literal encoding fails the scannable-host test", () => {
  for (const ip of [
    "127.0.0.1", // dotted
    "0x7f.0.0.1", // hex label
    "0177.0.0.1", // octal-looking label
    "2130706433", // decimal
    "017700000001", // octal whole
    "192.168.1.1",
    "169.254.169.254", // metadata
  ]) {
    assert.equal(isScannableHost(ip), false, `should refuse: ${ip}`);
  }
});

test("IPv6 literals and single labels are not scannable", () => {
  assert.equal(isScannableHost("::1"), false);
  assert.equal(isScannableHost("fe80::1"), false);
  assert.equal(isScannableHost("localhost"), false);
  assert.equal(isScannableHost("intranet"), false);
});

test("real public hostnames are scannable", () => {
  assert.equal(isScannableHost("example.co.ke"), true);
  assert.equal(isScannableHost("xn--mnchen-3ya.de"), true);
  assert.equal(isScannableHost("a.b.c.example.com"), true);
});

/* ── address range policy ── */

test("forbidden IPv4 ranges all reject", () => {
  for (const ip of [
    "0.1.2.3",
    "10.0.0.1",
    "100.64.0.1",
    "100.127.255.254",
    "127.0.0.1",
    "169.254.169.254",
    "172.16.0.1",
    "172.31.255.255",
    "192.0.0.1",
    "192.0.2.1",
    "192.168.0.1",
    "198.18.0.1",
    "198.51.100.7",
    "203.0.113.9",
    "224.0.0.1",
    "255.255.255.255",
  ]) {
    assert.equal(isForbiddenIPv4(ip), true, `should forbid: ${ip}`);
  }
  assert.equal(isForbiddenIPv4("104.16.1.1"), false);
  assert.equal(isForbiddenIPv4("41.90.7.7"), false);
  assert.equal(isForbiddenIPv4("garbage"), true, "unparseable refuses");
});

test("forbidden IPv6 ranges all reject, including embedded IPv4 tricks", () => {
  for (const ip of [
    "::",
    "::1",
    "fe80::1",
    "fc00::1",
    "fdff::1",
    "ff02::1",
    "2001:db8::1",
    "2001:0::1", // Teredo
    "::ffff:192.168.0.1", // v4-mapped private
    "::ffff:10.0.0.1",
    "64:ff9b::192.168.0.1", // NAT64 private
    "2002:c0a8:1::", // 6to4 embedding 192.168.0.1
  ]) {
    assert.equal(isForbiddenIPv6(ip), true, `should forbid: ${ip}`);
  }
  assert.equal(isForbiddenIPv6("2606:4700::6810:84e5"), false, "public IPv6 allowed");
  assert.equal(isForbiddenIPv6("::ffff:104.16.1.1"), false, "v4-mapped public allowed");
});

/* ── DoH resolution with a stub resolver ── */

function dohStub(map) {
  return async (url) => {
    const u = new URL(url);
    const name = u.searchParams.get("name");
    const type = u.searchParams.get("type");
    const answers = (map[name] || [])
      .filter((a) => (type === "A" ? !a.includes(":") : a.includes(":")))
      .map((data) => ({ name, type: type === "A" ? 1 : 28, data }));
    return new Response(JSON.stringify({ Status: 0, Answer: answers }), {
      headers: { "content-type": "application/dns-json" },
    });
  };
}

test("resolution requires every answer to be public — one poisoned record rejects", async () => {
  const fetcher = dohStub({
    "good.example": ["104.16.1.1"],
    "mixed.example": ["104.16.1.1", "10.0.0.1"],
    "internal.example": ["192.168.1.1"],
  });
  const ok = await resolveAndValidate("good.example", makeBudget(5000, 10), fetcher);
  assert.equal(ok.ok, true);

  const mixed = await resolveAndValidate("mixed.example", makeBudget(5000, 10), fetcher);
  assert.deepEqual({ ok: mixed.ok, reason: mixed.reason }, { ok: false, reason: "forbidden" });

  const internal = await resolveAndValidate("internal.example", makeBudget(5000, 10), fetcher);
  assert.deepEqual({ ok: internal.ok, reason: internal.reason }, { ok: false, reason: "forbidden" });

  const missing = await resolveAndValidate("nxdomain.example", makeBudget(5000, 10), fetcher);
  assert.deepEqual({ ok: missing.ok, reason: missing.reason }, { ok: false, reason: "unresolvable" });
});

/* ── guarded fetch with stubbed network ── */

function webStub(dohMap, pages) {
  const doh = dohStub(dohMap);
  return async (url, init) => {
    if (String(url).startsWith("https://cloudflare-dns.com/")) return doh(url, init);
    const page = pages[String(url)];
    if (!page) throw new TypeError("fetch failed");
    return page();
  };
}

test("a redirect to an internal host is refused before it is fetched", async () => {
  const fetcher = webStub(
    { "public.example": ["104.16.1.1"], "victim.internal.example": ["10.0.0.1"] },
    {
      "https://public.example/": () =>
        new Response(null, { status: 302, headers: { location: "https://victim.internal.example/admin" } }),
    },
  );
  const res = await safeFetch("https://public.example/", makeBudget(5000, 10), { fetcher });
  assert.equal(res.ok, false);
  assert.equal(res.error, "forbidden-target");
  assert.equal(res.chain.length, 1, "the internal hop itself was never fetched");
});

test("redirect loops and redirect chains beyond five hops stop", async () => {
  const dohMap = { "loop.example": ["104.16.1.1"], "chain.example": ["104.16.1.1"] };
  const loopFetcher = webStub(dohMap, {
    "https://loop.example/": () =>
      new Response(null, { status: 301, headers: { location: "https://loop.example/" } }),
  });
  const loop = await safeFetch("https://loop.example/", makeBudget(5000, 20), { fetcher: loopFetcher });
  assert.equal(loop.ok, false);
  assert.equal(loop.error, "redirect-loop");

  const pages = {};
  for (let i = 0; i < 10; i++) {
    pages[`https://chain.example/${i}`] = () =>
      new Response(null, { status: 301, headers: { location: `https://chain.example/${i + 1}` } });
  }
  const chain = await safeFetch("https://chain.example/0", makeBudget(5000, 20), { fetcher: webStub(dohMap, pages) });
  assert.equal(chain.ok, false);
  assert.equal(chain.error, "too-many-redirects");
});

test("non-http schemes in redirects are refused", async () => {
  const fetcher = webStub(
    { "public.example": ["104.16.1.1"] },
    {
      "https://public.example/": () =>
        new Response(null, { status: 302, headers: { location: "ftp://public.example/file" } }),
    },
  );
  const res = await safeFetch("https://public.example/", makeBudget(5000, 10), { fetcher });
  assert.equal(res.ok, false);
  assert.equal(res.error, "invalid-url");
});

test("oversize bodies are truncated at the cap, not buffered", async () => {
  const big = "x".repeat(64 * 1024);
  const fetcher = webStub(
    { "public.example": ["104.16.1.1"] },
    {
      "https://public.example/": () =>
        new Response(big, { status: 200, headers: { "content-type": "text/html" } }),
    },
  );
  const res = await safeFetch("https://public.example/", makeBudget(5000, 10), { fetcher, maxBytes: 16 * 1024 });
  assert.equal(res.ok, true);
  assert.equal(res.truncated, true);
  assert.ok(res.body.length <= 16 * 1024);
});

test("unsupported content types are refused without reading the body", async () => {
  const fetcher = webStub(
    { "public.example": ["104.16.1.1"] },
    {
      "https://public.example/": () =>
        new Response("binary", { status: 200, headers: { "content-type": "application/octet-stream" } }),
    },
  );
  const res = await safeFetch("https://public.example/", makeBudget(5000, 10), { fetcher });
  assert.equal(res.ok, false);
  assert.equal(res.error, "unsupported-content");
});

test("an exhausted budget stops all further requests", async () => {
  const fetcher = webStub(
    { "public.example": ["104.16.1.1"] },
    { "https://public.example/": () => new Response("hi", { headers: { "content-type": "text/plain" } }) },
  );
  const spent = makeBudget(5000, 0);
  const res = await safeFetch("https://public.example/", spent, { fetcher });
  assert.equal(res.ok, false);
  assert.equal(res.error, "budget");
});

test("credentials and odd ports never reach the network", async () => {
  const fetcher = () => {
    throw new Error("must not fetch");
  };
  for (const url of [
    "https://user:pass@public.example/",
    "https://public.example:8443/",
    "http://public.example:8080/",
  ]) {
    const res = await safeFetch(url, makeBudget(5000, 10), { fetcher });
    assert.equal(res.ok, false, `should refuse: ${url}`);
    assert.equal(res.error, "invalid-url");
  }
});
