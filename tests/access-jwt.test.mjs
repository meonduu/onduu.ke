import assert from "node:assert/strict";
import test from "node:test";
import {
  verifyAccessJwt,
  resetAccessCerts,
  ACCESS_TEAM_DOMAIN,
  ACCESS_AUD,
} from "../worker/access-jwt.ts";

// Security review, 22 August 2026 (OWASP A01/A07). /go accepted the
// request if Cf-Access-Authenticated-User-Email or Cf-Access-Jwt-Assertion
// was merely PRESENT, and printed the email straight from the header. No
// signature, no expiry, no audience.
//
// Access does strip client-supplied Cf-Access-* headers, and the Worker has
// no route that bypasses it, so nothing was open. The point of these tests
// is the day that stops being true: a second route, or a policy edited to
// cover fewer paths. Real RSA keys are generated here so the signature
// check is actually exercised rather than mocked around.

const b64url = (buf) =>
  Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const pair = await crypto.subtle.generateKey(
  { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
  true,
  ["sign", "verify"],
);
const impostor = await crypto.subtle.generateKey(
  { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
  true,
  ["sign", "verify"],
);

const KID = "test-key-1";
const jwk = await crypto.subtle.exportKey("jwk", pair.publicKey);

/** Stands in for Cloudflare's certs endpoint, serving our test key. */
const certs = async () =>
  new Response(JSON.stringify({ keys: [{ kid: KID, kty: "RSA", alg: "RS256", n: jwk.n, e: jwk.e }] }), {
    headers: { "content-type": "application/json" },
  });

async function mint(claims = {}, { key = pair.privateKey, kid = KID, alg = "RS256" } = {}) {
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg, kid, typ: "JWT" }));
  const body = b64url(
    JSON.stringify({
      iss: `https://${ACCESS_TEAM_DOMAIN}`,
      aud: ACCESS_AUD,
      email: "owner@onduu.ke",
      iat: now,
      exp: now + 3600,
      ...claims,
    }),
  );
  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(`${head}.${body}`),
  );
  return `${head}.${body}.${b64url(sig)}`;
}

test.beforeEach(() => resetAccessCerts());

test("a properly signed assertion is accepted, and the identity comes from it", async () => {
  const r = await verifyAccessJwt(await mint(), Date.now(), certs);
  assert.equal(r.ok, true);
  assert.equal(r.email, "owner@onduu.ke", "the email must come from the verified payload, not a header");
});

test("a token signed by the wrong key is refused", async () => {
  // The forgery case: right shape, right claims, wrong signer.
  const r = await verifyAccessJwt(await mint({}, { key: impostor.privateKey }), Date.now(), certs);
  assert.deepEqual(r, { ok: false, reason: "bad_signature" });
});

test("a tampered payload is refused", async () => {
  const token = await mint();
  const [h, , s] = token.split(".");
  const swapped = b64url(JSON.stringify({ iss: `https://${ACCESS_TEAM_DOMAIN}`, aud: ACCESS_AUD, email: "attacker@example.com", exp: Math.floor(Date.now() / 1000) + 3600 }));
  const r = await verifyAccessJwt(`${h}.${swapped}.${s}`, Date.now(), certs);
  assert.equal(r.ok, false);
  assert.equal(r.reason, "bad_signature", "editing the claims must invalidate the signature");
});

test("an expired assertion is refused", async () => {
  const now = Math.floor(Date.now() / 1000);
  const r = await verifyAccessJwt(await mint({ exp: now - 1 }), Date.now(), certs);
  assert.deepEqual(r, { ok: false, reason: "expired" });
});

test("an assertion for another Access application is refused", async () => {
  // A valid Cloudflare token from a different app of the same account
  // would otherwise sail through: same issuer, same signing keys.
  const r = await verifyAccessJwt(await mint({ aud: "some-other-application-tag" }), Date.now(), certs);
  assert.deepEqual(r, { ok: false, reason: "wrong_audience" });
});

test("an assertion from another team is refused", async () => {
  const r = await verifyAccessJwt(await mint({ iss: "https://someone-else.cloudflareaccess.com" }), Date.now(), certs);
  assert.deepEqual(r, { ok: false, reason: "wrong_issuer" });
});

test('the "none" algorithm and unknown keys are refused', async () => {
  // The classic JWT bypass: strip the signature and claim it was not
  // needed. The algorithm is dictated by the verifier, never read from the
  // token.
  const head = b64url(JSON.stringify({ alg: "none", kid: KID, typ: "JWT" }));
  const body = b64url(JSON.stringify({ iss: `https://${ACCESS_TEAM_DOMAIN}`, aud: ACCESS_AUD, exp: 9e9 }));
  assert.deepEqual(await verifyAccessJwt(`${head}.${body}.`, Date.now(), certs), {
    ok: false,
    reason: "malformed",
  });

  const unknown = await mint({}, { kid: "a-key-we-do-not-have" });
  assert.deepEqual(await verifyAccessJwt(unknown, Date.now(), certs), {
    ok: false,
    reason: "unknown_key",
  });
});

test("garbage is refused without throwing", async () => {
  for (const bad of ["", "x", "a.b", "a.b.c", "....", "not-a-jwt-at-all"]) {
    const r = await verifyAccessJwt(bad, Date.now(), certs);
    assert.equal(r.ok, false, JSON.stringify(bad));
  }
});

test("unreachable keys are reported as unverifiable, not as a forgery", async () => {
  // The one failure the dashboard treats differently: it falls back to the
  // header check rather than locking the owner out, because Access is
  // still in front. Anything else is a refusal, so the two must not be
  // confused.
  const down = async () => new Response("nope", { status: 503 });
  const r = await verifyAccessJwt(await mint(), Date.now(), down);
  assert.deepEqual(r, { ok: false, reason: "unverifiable" });
});

test("the configured team and audience match the live Access application", async () => {
  // These came from the redirect an unauthenticated /go returns. If the
  // Access application is ever recreated they change, and every dashboard
  // request would start failing verification — so the check is pinned to
  // the real thing rather than to a copy of the constant.
  const res = await fetch("https://onduu.ke/go", { redirect: "manual" });
  const location = res.headers.get("location") ?? "";
  assert.ok(location.includes(ACCESS_TEAM_DOMAIN), `Access redirects elsewhere: ${location.slice(0, 80)}`);
  assert.ok(location.includes(ACCESS_AUD), "the audience tag no longer matches the live application");
});

test("the production config never carries the test bypass", async () => {
  // ACCESS_DEV_BYPASS lets an email header alone through, which is exactly
  // what this release stopped production doing. The harness sets it on the
  // worker it spawns; if it ever appears in the deployed config, the whole
  // change is undone and nothing else would say so.
  const { readFileSync } = await import("node:fs");
  for (const file of ["wrangler.jsonc", "dist/server/wrangler.json"]) {
    let text = "";
    try {
      text = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
    } catch {
      continue; // dist/ is absent until a build has run
    }
    assert.doesNotMatch(text, /ACCESS_DEV_BYPASS/, `${file} must not carry the test bypass`);
  }
});
