import assert from "node:assert/strict";
import test from "node:test";
import { fetchPath, startWorker } from "./helpers/server.mjs";
import { readBodyLimited, readJsonLimited, BODY_LIMITS } from "../worker/body-limit.ts";

// Security review, 22 August 2026, recommendations 7 and 8.
//
// Bodies: every endpoint parsed whatever arrived. /api/event came closest
// to safe and still read the whole thing into memory before measuring it,
// then measured UTF-16 units rather than bytes.
//
// /api/out: no origin check, no content-type check, no rate limit. Nothing
// leaked, but the figure it feeds is the strategy's measure of routed
// demand, read on /go/routing to make decisions. A metric anyone can
// inflate is worse than none, because it still looks like evidence.

/* ── the ceiling ─────────────────────────────────────────────────────── */

const post = (body, headers = {}) =>
  new Request("https://onduu.ke/x", { method: "POST", body, headers });

test("an oversized body is refused on Content-Length, before it is read", async () => {
  // The header is a lie here: the body is tiny. If the ceiling were only
  // enforced after reading, this would pass — so a refusal proves the
  // declared length is checked first.
  const r = await readBodyLimited(post("hi", { "content-length": "999999" }), 1_024);
  assert.equal(r.ok, false);
  assert.equal(r.reason, "too_large");
});

test("a body that lies about its length is still cut off", async () => {
  // No Content-Length at all: only the streaming counter can stop this.
  const big = "x".repeat(5_000);
  const stream = new ReadableStream({
    start(c) {
      c.enqueue(new TextEncoder().encode(big));
      c.close();
    },
  });
  const req = new Request("https://onduu.ke/x", { method: "POST", body: stream, duplex: "half" });
  const r = await readBodyLimited(req, 1_024);
  assert.equal(r.ok, false, "the stream must be cut at the ceiling");
});

test("bytes are counted, not characters", async () => {
  // The old check used String.length, so 600 three-byte characters
  // measured as 600 against an 8192 ceiling while weighing 1800 bytes.
  // Each of these is 3 bytes in UTF-8.
  const text = "京".repeat(400); // 400 chars, 1200 bytes
  const under = await readBodyLimited(post(text), 1_500);
  const over = await readBodyLimited(post(text), 1_000);
  assert.equal(under.ok, true, "1200 bytes must pass a 1500-byte ceiling");
  assert.equal(over.ok, false, "1200 bytes must fail a 1000-byte ceiling despite being 400 chars");
});

test("a body inside the ceiling is returned intact", async () => {
  const r = await readJsonLimited(post(JSON.stringify({ a: 1, b: "two" })), 1_024);
  assert.equal(r.ok, true);
  assert.deepEqual(r.value, { a: 1, b: "two" });
});

test("unparseable and oversized are distinguishable", async () => {
  const bad = await readJsonLimited(post("{not json"), 1_024);
  assert.equal(bad.ok, false);
  assert.equal(bad.reason, "unparseable", "callers answer 400 here, not 413");
});

test("every endpoint has a ceiling, and none is generous", () => {
  for (const [name, bytes] of Object.entries(BODY_LIMITS)) {
    assert.ok(bytes > 0 && bytes <= 32_768, `${name} ceiling looks wrong: ${bytes}`);
  }
  assert.ok(BODY_LIMITS.out < BODY_LIMITS.submit, "a route name needs far less than two textareas");
});

/* ── /api/out, through the real Worker ───────────────────────────────── */

const OUT = "/api/out";
const body = JSON.stringify({ route: "hostafrica-domains" });

test("the click counter refuses another site's origin", async () => {
  const res = await fetchPath(OUT, "application/json", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://evil.example" },
    body,
  });
  assert.equal(res.status, 403, "a cross-site POST must not be counted as a click");
});

test("a lookalike host is not the same origin", async () => {
  // The reason the check compares hosts exactly rather than by prefix.
  const res = await fetchPath(OUT, "application/json", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://onduu.ke.example.com" },
    body,
  });
  assert.equal(res.status, 403);
});

test("a same-origin beacon with no Origin header is still counted", async () => {
  // navigator.sendBeacon may omit Origin on a same-origin POST. Demanding
  // one would look stricter and quietly stop counting real clicks —
  // /api/event carries the same allowance for the same reason.
  const res = await fetchPath(OUT, "application/json", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
  assert.notEqual(res.status, 403, "a missing Origin is not a cross-site request");
  assert.ok([204, 429].includes(res.status), `expected 204 or 429, got ${res.status}`);
});

test("the click counter requires JSON", async () => {
  const origin = await startWorker();
  const res = await fetchPath(OUT, "application/json", {
    method: "POST",
    headers: { "content-type": "text/plain", origin },
    body,
  });
  assert.equal(res.status, 415, "a form-encoded or text POST needs no preflight, so it is refused");
});

test("the click counter refuses an oversized body and unknown routes", async () => {
  const origin = await startWorker();
  const huge = await fetchPath(OUT, "application/json", {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify({ route: "hostafrica-domains", pad: "x".repeat(BODY_LIMITS.out * 2) }),
  });
  assert.equal(huge.status, 413);

  const unknown = await fetchPath(OUT, "application/json", {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify({ route: "../../admin" }),
  });
  assert.equal(unknown.status, 204, "an unknown route is ignored, never recorded");
});

test("the click counter still refuses GET", async () => {
  assert.equal((await fetchPath(OUT, "application/json")).status, 405);
});
