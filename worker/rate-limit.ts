/**
 * Client identity and rate limiting, in one place.
 *
 * Both halves existed five times over — submissions, the do-not-scan
 * request, scans, domain searches and analytics events each carried their
 * own copy — and both copies were wrong in the same way everywhere.
 * Security review, 22 August 2026 (OWASP Top 10:2025, A04 and A10).
 *
 * ── The limit is now one statement ──────────────────────────────────
 * Every copy read the counter and then wrote it back:
 *
 *     SELECT count FROM t WHERE client_key = ?      -- 29
 *     ...decide...
 *     UPDATE t SET count = count + 1                -- 30
 *
 * Two requests arriving together both read 29, both decide they are under
 * the ceiling, and both proceed. The limit held only against traffic that
 * was not trying — which is the opposite of the case it exists for. It is
 * now a single upsert that resets or increments and returns the resulting
 * count, so the decision is made from a number no other request can have
 * changed in between.
 *
 * ── The key is now keyed ────────────────────────────────────────────
 * The identifier was `SHA-256(ip)` truncated to 64 bits, with no secret.
 * IPv4 is a 2^32 space: anyone holding the database can walk it and
 * recover every address exactly. That is not a pseudonym, and
 * `docs/specs/processors-and-transfers.md` called these rows
 * "pseudonymous" on the strength of it — so the weakness was also making
 * a published claim untrue.
 *
 * HMAC with a Worker secret makes the mapping unreproducible without the
 * key. A daily bucket makes yesterday's identifiers stop matching today's,
 * so they expire by construction rather than by a cleanup job. A purpose
 * prefix keeps the same visitor's rows unlinkable across the four tables.
 *
 * The daily bucket costs one window reset per address per day — an
 * attacker gets one extra allowance at midnight UTC. That is a deliberate
 * trade of a negligible amount of limiting for identifiers that do not
 * accumulate forever.
 */

export type KeyPurpose = "submission" | "scan" | "search" | "event";

export type ThrottleTable =
  | "submission_throttle"
  | "scan_throttle"
  | "search_throttle"
  | "event_throttle";

const BUCKET_MS = 24 * 60 * 60 * 1000;

const hex = (buf: ArrayBuffer) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

let warnedNoSecret = false;

/**
 * A per-visitor identifier that cannot be reversed without the secret.
 *
 * Without `CLIENT_KEY_SECRET` this falls back to an unkeyed digest — the
 * pre-22-August behaviour — because refusing every request over a missing
 * secret would take the site down for a privacy improvement. The fallback
 * is logged loudly and reported by `clientKeyIsKeyed()` so it cannot sit
 * there unnoticed, which is the failure mode that mattered: a control
 * that is quietly absent looks exactly like one that is working.
 */
export async function clientKeyOf(
  request: Request,
  purpose: KeyPurpose,
  secret?: string,
): Promise<string> {
  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  const bucket = Math.floor(Date.now() / BUCKET_MS);
  const message = new TextEncoder().encode(`${purpose}:${bucket}:${ip}`);

  if (!secret) {
    if (!warnedNoSecret) {
      warnedNoSecret = true;
      console.error(
        JSON.stringify({
          event: "client_key_unkeyed",
          detail: "CLIENT_KEY_SECRET is not set; abuse counters are reversible to the address",
        }),
      );
    }
    return hex(await crypto.subtle.digest("SHA-256", message)).slice(0, 32);
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return hex(await crypto.subtle.sign("HMAC", key, message)).slice(0, 32);
}

/** Whether the deployment is deriving keys with a secret. Read by /go. */
export function clientKeyIsKeyed(secret?: string): boolean {
  return Boolean(secret);
}

/**
 * Admit one request against a sliding window, atomically.
 *
 * Returns true when the caller is inside the ceiling. The row is written
 * on every call, including refusals: sustained abuse keeps the counter
 * above the line rather than letting it drift back down.
 *
 * Throws if the statement fails. Callers decide whether that is fatal —
 * a state-changing endpoint should refuse, a public read may fall back to
 * a cheaper local check. Nothing is swallowed here.
 */
export async function withinLimit(
  db: D1Database,
  table: ThrottleTable,
  clientKey: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): Promise<boolean> {
  const nowIso = new Date(now).toISOString();
  const cutoff = new Date(now - windowMs).toISOString();

  // One statement. The CASE arms make it "reset if the window has rolled
  // over, otherwise increment", and RETURNING hands back the value that
  // was actually written — not one read a moment earlier.
  const row = await db
    .prepare(
      `INSERT INTO ${table} (client_key, window_start, count) VALUES (?1, ?2, 1)
       ON CONFLICT(client_key) DO UPDATE SET
         window_start = CASE WHEN ${table}.window_start < ?3 THEN ?2 ELSE ${table}.window_start END,
         count        = CASE WHEN ${table}.window_start < ?3 THEN 1 ELSE ${table}.count + 1 END
       RETURNING count`,
    )
    .bind(clientKey, nowIso, cutoff)
    .first<{ count: number }>();

  return (row?.count ?? 1) <= limit;
}
