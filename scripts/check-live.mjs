#!/usr/bin/env node
/**
 * Production check: what Cloudflare actually serves.
 *
 * The test suite runs against a locally built Worker, where Cloudflare's edge
 * never runs — so no unit test can catch a dashboard toggle that injects a
 * script into live pages. That is exactly what went unnoticed until 20 August
 * 2026: Web Analytics was set to "Enable, excluding visitor data in the EU",
 * which injected a beacon the content-security policy then refused, leaving a
 * console error on every visit and no measurement to show for it.
 *
 * Run this against production after any Cloudflare dashboard change, and
 * periodically:  npm run check:live
 */
const BASE = process.env.CHECK_BASE ?? "https://onduu.ke";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

// Cloudflare only injects for requests that look like a browser, which is why
// a plain curl showed nothing while real visitors got the beacon.
const HEADERS = { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" };

const PAGES = [
  "/", "/about", "/guides", "/readiness", "/contact",
  "/legal/privacy", "/dns", "/email-security", "/kedomains", "/scan",
];

// The only third-party script origin the policy permits.
const ALLOWED_SCRIPT_HOSTS = new Set(["challenges.cloudflare.com"]);

// Signatures of Cloudflare features that rewrite HTML: Web Analytics / RUM,
// Rocket Loader, Email Obfuscation, Speed Brain, Zaraz.
const INJECTION_SIGNS = [
  ["cloudflareinsights", /cloudflareinsights/i],
  ["cdn-cgi script", /\/cdn-cgi\/(scripts|challenge-platform)/i],
  ["rocket-loader", /rocket-loader/i],
  ["email-decode", /email-decode/i],
  ["speculation rules", /type=["']speculationrules["']/i],
  ["zaraz", /\/cdn-cgi\/zaraz/i],
];

const failures = [];
const fail = (where, msg) => failures.push(`${where}: ${msg}`);

async function checkPage(path) {
  const res = await fetch(`${BASE}${path}?cb=${Date.now()}`, { headers: HEADERS });
  if (res.status !== 200) return fail(path, `expected 200, got ${res.status}`);

  const html = await res.text();
  for (const [name, pattern] of INJECTION_SIGNS) {
    if (pattern.test(html)) fail(path, `injected by Cloudflare: ${name}`);
  }

  for (const m of html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)) {
    const src = m[1];
    if (src.startsWith("/") || src.startsWith(BASE)) continue;
    const host = (() => {
      try {
        return new URL(src, BASE).host;
      } catch {
        return src;
      }
    })();
    if (!ALLOWED_SCRIPT_HOSTS.has(host)) fail(path, `third-party script: ${host}`);
  }

  const csp = res.headers.get("content-security-policy") ?? "";
  if (!csp) return fail(path, "no content-security-policy header");
  if (!/default-src 'self'/.test(csp)) fail(path, "CSP lost default-src 'self'");
  if (/script-src[^;]*'unsafe-inline'/.test(csp)) fail(path, "CSP allows inline script");
}

async function checkDashboard() {
  // In production Cloudflare Access intercepts /go and 302s to its login, so
  // the Worker never runs and its own 403 (and its CSP) are never seen from
  // outside — those are covered by tests/dashboard.test.mjs against the local
  // build. What matters here is that an unauthenticated request is turned
  // away and no dashboard content is served.
  const res = await fetch(`${BASE}/go?cb=${Date.now()}`, {
    headers: HEADERS,
    redirect: "manual",
  });

  const location = res.headers.get("location") ?? "";
  const turnedAway =
    (res.status === 302 && /cloudflareaccess\.com\/cdn-cgi\/access\/login/.test(location)) ||
    res.status === 403;
  if (!turnedAway) {
    fail("/go", `unauthenticated request was not turned away (status ${res.status})`);
  }

  const body = await res.text();
  if (/business_email|Enquiries, all time|Do-not-scan/.test(body)) {
    fail("/go", "dashboard content served to an unauthenticated request");
  }
}

console.log(`Checking ${BASE} as a browser…\n`);
for (const path of PAGES) await checkPage(path);
await checkDashboard();

if (failures.length === 0) {
  console.log(`OK — ${PAGES.length} pages plus /go: no injected scripts, policy intact.`);
  process.exit(0);
}
console.error(`FAILED — ${failures.length} problem(s):\n`);
for (const f of failures) console.error(`  • ${f}`);
process.exit(1);
