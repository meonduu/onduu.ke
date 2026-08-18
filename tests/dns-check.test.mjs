import assert from "node:assert/strict";
import test from "node:test";
import { runDnsCheck, handleDnsCheck, providerOf, withinDnsCheckLimit } from "../worker/dns-check.ts";
import { makeBudget } from "../worker/scan/net.ts";

/* ── fixture fetcher ─────────────────────────────────────────────────── */

// DNS record type numbers as DoH JSON uses them.
const T = { A: 1, NS: 2, SOA: 6, MX: 15, AAAA: 28, DS: 43, DNSKEY: 48 };

const jsonResponse = (body, status = 200, contentType = "application/json") =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": contentType } });

/**
 * config.dns: { "name TYPE": { status?, answers?: [ [type, data], ... ] } }
 * config.rdap: object to serve (200), or "missing" (404), or undefined (host
 * unresolvable, so RDAP is unreachable).
 */
function makeFetcher(config) {
  return async (input) => {
    const u = new URL(typeof input === "string" ? input : input.url);
    if (u.hostname === "cloudflare-dns.com") {
      const name = (u.searchParams.get("name") || "").toLowerCase();
      const type = u.searchParams.get("type");
      // RDAP endpoints must resolve for safeFetch's pre-flight validation.
      if (name.startsWith("rdap.")) {
        if (config.rdap === undefined) return jsonResponse({ Status: 0, Answer: [] });
        return jsonResponse({
          Status: 0,
          Answer: type === "A" ? [{ name, type: T.A, data: "197.248.1.1" }] : [],
        });
      }
      const spec = config.dns[`${name} ${type}`];
      if (!spec) return jsonResponse({ Status: 0, Answer: [] });
      return jsonResponse({
        Status: spec.status ?? 0,
        Answer: (spec.answers ?? []).map(([t, data]) => ({ name, type: t, data })),
      });
    }
    if (u.hostname.startsWith("rdap.")) {
      if (config.rdap === "missing" || config.rdap === undefined) {
        return jsonResponse({ errorCode: 404 }, 404, "application/rdap+json");
      }
      return jsonResponse(config.rdap, 200, "application/rdap+json");
    }
    throw new Error(`unexpected fetch in test: ${u.href}`);
  };
}

const DOMAIN = "example.co.ke";

function healthyConfig() {
  return {
    dns: {
      [`${DOMAIN} NS`]: { answers: [[T.NS, "ns1.host.co.ke."], [T.NS, "ns2.host.co.ke."]] },
      [`${DOMAIN} SOA`]: {
        answers: [[T.SOA, "ns1.host.co.ke. admin.host.co.ke. 2024010101 7200 900 1209600 300"]],
      },
      [`${DOMAIN} A`]: { answers: [[T.A, "197.248.10.10"]] },
      [`${DOMAIN} AAAA`]: { answers: [] },
      [`${DOMAIN} MX`]: { answers: [[T.MX, "10 mail.example.co.ke."]] },
      [`${DOMAIN} DS`]: { answers: [] },
      [`${DOMAIN} DNSKEY`]: { answers: [] },
      [`www.${DOMAIN} A`]: { answers: [[T.A, "197.248.10.10"]] },
    },
    rdap: {
      nameservers: [{ ldhName: "NS1.host.co.ke." }, { ldhName: "ns2.host.co.ke" }],
      status: ["active"],
      events: [{ eventAction: "expiration", eventDate: "2027-01-01T00:00:00Z" }],
    },
  };
}

const run = (config) => runDnsCheck(DOMAIN, makeBudget(10_000, 40), makeFetcher(config));
const findingBy = (report, code) => report.findings.find((f) => f.code === code);
const severityOf = (report, code) => findingBy(report, code)?.severity;

/* ── rule tests ──────────────────────────────────────────────────────── */

test("a healthy domain reports coherent foundations", async () => {
  const report = await run(healthyConfig());
  assert.equal(report.ok, true);
  assert.equal(report.summary.fail, 0);
  assert.equal(report.summary.warn, 0);
  assert.equal(severityOf(report, "NS_OK"), "pass");
  assert.equal(severityOf(report, "DELEGATION_MATCH"), "pass");
  assert.equal(severityOf(report, "SOA_OK"), "pass");
  assert.equal(severityOf(report, "APEX_OK"), "pass");
  assert.equal(severityOf(report, "WWW_OK"), "pass");
  assert.equal(severityOf(report, "MX_PRESENT"), "pass");
  // Single provider and unsigned zone are observations, never faults.
  assert.equal(severityOf(report, "NS_PROVIDER_SINGLE"), "info");
  assert.equal(severityOf(report, "DNSSEC_ABSENT"), "info");
  assert.match(report.headline, /coherent/);
});

test("registry-vs-live delegation mismatch is an attention finding with both lists", async () => {
  const config = healthyConfig();
  config.rdap.nameservers = [{ ldhName: "ns1.oldhost.com" }, { ldhName: "ns2.oldhost.com" }];
  const report = await run(config);
  const finding = findingBy(report, "DELEGATION_MISMATCH");
  assert.equal(finding.severity, "fail");
  assert.ok(finding.evidence.some((e) => e.includes("oldhost.com")));
  assert.ok(finding.evidence.some((e) => e.includes("ns1.host.co.ke")));
});

test("delegation is unobservable, not failed, when the registry publishes nothing", async () => {
  const config = healthyConfig();
  config.rdap = "missing";
  const report = await run(config);
  assert.equal(severityOf(report, "DELEGATION_UNOBSERVABLE"), "info");
  const finding = findingBy(report, "DELEGATION_UNOBSERVABLE");
  assert.match(finding.limitation, /[Nn]ot a pass or a failure/);
});

test("a single nameserver is called out", async () => {
  const config = healthyConfig();
  config.dns[`${DOMAIN} NS`] = { answers: [[T.NS, "ns1.host.co.ke."]] };
  config.rdap.nameservers = [{ ldhName: "ns1.host.co.ke" }];
  const report = await run(config);
  assert.equal(severityOf(report, "NS_SINGLE"), "fail");
  assert.equal(findingBy(report, "NS_PROVIDER_SINGLE"), undefined);
});

test("nameservers across two providers is a pass", async () => {
  const config = healthyConfig();
  config.dns[`${DOMAIN} NS`] = {
    answers: [[T.NS, "ns1.host.co.ke."], [T.NS, "anna.ns.cloudflare.com."]],
  };
  config.rdap.nameservers = [{ ldhName: "ns1.host.co.ke" }, { ldhName: "anna.ns.cloudflare.com" }];
  const report = await run(config);
  assert.equal(severityOf(report, "NS_PROVIDERS_SPREAD"), "pass");
});

test("DS without DNSKEY reports a broken DNSSEC chain", async () => {
  const config = healthyConfig();
  config.dns[`${DOMAIN} DS`] = { answers: [[T.DS, "2371 13 2 ABCDEF"]] };
  const report = await run(config);
  assert.equal(severityOf(report, "DNSSEC_BROKEN_CHAIN"), "fail");
});

test("DS with DNSKEY reports DNSSEC present, detection only", async () => {
  const config = healthyConfig();
  config.dns[`${DOMAIN} DS`] = { answers: [[T.DS, "2371 13 2 ABCDEF"]] };
  config.dns[`${DOMAIN} DNSKEY`] = { answers: [[T.DNSKEY, "257 3 13 mdsswUyr..."]] };
  const report = await run(config);
  const finding = findingBy(report, "DNSSEC_PRESENT");
  assert.equal(finding.severity, "pass");
  assert.match(finding.limitation, /[Dd]etection only/);
});

test("an apex with no address is an attention finding", async () => {
  const config = healthyConfig();
  config.dns[`${DOMAIN} A`] = { answers: [] };
  const report = await run(config);
  assert.equal(severityOf(report, "APEX_NO_ADDRESS"), "fail");
});

test("www resolving somewhere unrelated is an advisory with both destinations", async () => {
  const config = healthyConfig();
  config.dns[`www.${DOMAIN} A`] = { answers: [[T.A, "203.0.114.9"]] };
  const report = await run(config);
  const finding = findingBy(report, "WWW_DIVERGES");
  assert.equal(finding.severity, "warn");
  assert.equal(finding.evidence.length, 2);
});

test("missing www is an advisory; missing MX is an observation", async () => {
  const config = healthyConfig();
  config.dns[`www.${DOMAIN} A`] = { answers: [] };
  config.dns[`${DOMAIN} MX`] = { answers: [] };
  const report = await run(config);
  assert.equal(severityOf(report, "WWW_NO_ADDRESS"), "warn");
  assert.equal(severityOf(report, "MX_NONE"), "info");
});

test("an incoherent SOA is an advisory", async () => {
  const config = healthyConfig();
  config.dns[`${DOMAIN} SOA`] = {
    answers: [[T.SOA, "ns1.host.co.ke. admin.host.co.ke. 2024010101 0 900 0 300"]],
  };
  const report = await run(config);
  assert.equal(severityOf(report, "SOA_INCOHERENT"), "warn");
});

test("the MX finding routes depth to the email security check", async () => {
  const report = await run(healthyConfig());
  assert.equal(findingBy(report, "MX_PRESENT").link.href, "/email-security");
});

/* ── provider grouping ───────────────────────────────────────────────── */

test("providerOf groups by operator, including third-level .ke suffixes", () => {
  assert.equal(providerOf("ns1.host.co.ke."), "host.co.ke");
  assert.equal(providerOf("anna.ns.cloudflare.com"), "cloudflare.com");
  assert.equal(providerOf("NS2.HOST.CO.KE"), "host.co.ke");
});

/* ── the handler ─────────────────────────────────────────────────────── */

const handlerRequest = (query, ip, method = "GET") =>
  new Request(`https://onduu.ke/api/dns${query}`, {
    method,
    headers: { "cf-connecting-ip": ip },
  });

test("the handler rejects non-GET and missing or invalid domains", async () => {
  const fetcher = makeFetcher(healthyConfig());
  assert.equal((await handleDnsCheck(handlerRequest("?domain=x.co.ke", "10.0.0.1", "POST")).then((r) => r.status)), 405);
  assert.equal((await handleDnsCheck(handlerRequest("", "10.0.0.2"), fetcher)).status, 400);
  assert.equal((await handleDnsCheck(handlerRequest("?domain=not_a_domain", "10.0.0.3"), fetcher)).status, 400);
});

test("the handler normalises pasted URLs and returns a full report", async () => {
  const response = await handleDnsCheck(
    handlerRequest(`?domain=${encodeURIComponent(`https://WWW.${DOMAIN}/contact`)}`, "10.0.0.4"),
    makeFetcher(healthyConfig()),
  );
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.domain, DOMAIN);
  assert.equal(body.findings.length, 8);
});

test("an unregistered domain returns 404 with a human explanation", async () => {
  const config = {
    dns: {
      [`${DOMAIN} NS`]: { status: 3, answers: [] },
      [`${DOMAIN} SOA`]: { status: 3, answers: [] },
    },
    rdap: "missing",
  };
  const response = await handleDnsCheck(
    handlerRequest(`?domain=${DOMAIN}`, "10.0.0.5"),
    makeFetcher(config),
  );
  assert.equal(response.status, 404);
  const body = await response.json();
  assert.match(body.error, /does not resolve/);
});

test("the per-connection limit holds at 30 checks per hour", () => {
  for (let i = 0; i < 30; i++) assert.equal(withinDnsCheckLimit("198.51.100.7"), true);
  assert.equal(withinDnsCheckLimit("198.51.100.7"), false);
  assert.equal(withinDnsCheckLimit("198.51.100.8"), true);
});
