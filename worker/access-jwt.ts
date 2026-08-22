/**
 * Cryptographic verification of the Cloudflare Access assertion on /go.
 *
 * Before 22 August 2026 the dashboard accepted the request if either
 * `Cf-Access-Authenticated-User-Email` or `Cf-Access-Jwt-Assertion` was
 * merely PRESENT, and displayed the email straight from the header. No
 * signature was checked, no expiry, no audience.
 *
 * That was survivable rather than safe, and the distinction matters. The
 * Worker has no workers.dev route (`workers_dev: false`) and is itself the
 * origin, so the only way to reach it is through onduu.ke, where Access
 * sits in front and overwrites these headers on every request. There is no
 * path around it today. The weakness is what happens the day that stops
 * being true — a second route, a policy edited to cover fewer paths, a
 * hostname added in a hurry — because on that day there was no second line
 * at all.
 *
 * Now the assertion is verified: RS256 signature against Cloudflare's
 * published keys, issuer, audience and expiry, and the identity is taken
 * from the verified payload rather than from a header anyone upstream
 * could set.
 *
 * The team domain and the AUD tag are not secrets. Both are visible in the
 * redirect an unauthenticated request receives, which is where these came
 * from — so they live in code rather than in a binding that could go
 * missing and silently disable the check.
 */

export const ACCESS_TEAM_DOMAIN = "midnightpulse.cloudflareaccess.com";
export const ACCESS_AUD = "05ef868200e029b669f5c27671c53f144d0cfbad91230a3b887dfe25d1f50fed";

const CERTS_TTL_MS = 60 * 60 * 1000;

interface Jwk {
  kid: string;
  kty: string;
  alg: string;
  n: string;
  e: string;
}

let cached: { at: number; keys: Map<string, CryptoKey> } | null = null;

const b64urlToBytes = (s: string) => {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

async function keys(fetcher: typeof fetch): Promise<Map<string, CryptoKey>> {
  if (cached && Date.now() - cached.at < CERTS_TTL_MS) return cached.keys;
  const res = await fetcher(`https://${ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`);
  if (!res.ok) throw new Error(`certs ${res.status}`);
  const body = (await res.json()) as { keys?: Jwk[] };
  const map = new Map<string, CryptoKey>();
  for (const jwk of body.keys ?? []) {
    if (jwk.kty !== "RSA") continue;
    map.set(
      jwk.kid,
      await crypto.subtle.importKey(
        "jwk",
        { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: "RS256", ext: true },
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        false,
        ["verify"],
      ),
    );
  }
  if (map.size === 0) throw new Error("no usable keys");
  cached = { at: Date.now(), keys: map };
  return map;
}

export type AccessResult =
  | { ok: true; email: string }
  | { ok: false; reason: "malformed" | "unknown_key" | "bad_signature" | "expired" | "wrong_audience" | "wrong_issuer" }
  | { ok: false; reason: "unverifiable" };

/**
 * Returns the identity from a verified assertion.
 *
 * `unverifiable` is distinct from every other failure and means only that
 * Cloudflare's keys could not be fetched. The caller falls back to the
 * pre-existing header check for that case alone — Access is still in front
 * of this Worker, and locking the owner out of the dashboard during a
 * network blip would be a worse outcome than the defence-in-depth layer
 * being briefly unavailable. Every other reason is a refusal.
 */
export async function verifyAccessJwt(
  token: string,
  now = Date.now(),
  fetcher: typeof fetch = fetch,
): Promise<AccessResult> {
  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, reason: "malformed" };

  let header: { kid?: string; alg?: string };
  let payload: { aud?: string | string[]; iss?: string; exp?: number; nbf?: number; email?: string };
  try {
    header = JSON.parse(new TextDecoder().decode(b64urlToBytes(parts[0])));
    payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(parts[1])));
  } catch {
    return { ok: false, reason: "malformed" };
  }
  // "alg": "none" and friends: the algorithm is dictated here, never read
  // from the token.
  if (header.alg !== "RS256" || !header.kid) return { ok: false, reason: "malformed" };

  let keyMap: Map<string, CryptoKey>;
  try {
    keyMap = await keys(fetcher);
  } catch {
    return { ok: false, reason: "unverifiable" };
  }
  const key = keyMap.get(header.kid);
  if (!key) return { ok: false, reason: "unknown_key" };

  const signed = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    b64urlToBytes(parts[2]),
    signed,
  );
  if (!valid) return { ok: false, reason: "bad_signature" };

  // Claims are checked only after the signature, so nothing in an
  // unverified payload is ever trusted.
  const seconds = Math.floor(now / 1000);
  if (typeof payload.exp !== "number" || payload.exp <= seconds) return { ok: false, reason: "expired" };
  if (typeof payload.nbf === "number" && payload.nbf > seconds + 60) return { ok: false, reason: "expired" };
  if (payload.iss !== `https://${ACCESS_TEAM_DOMAIN}`) return { ok: false, reason: "wrong_issuer" };

  const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!aud.includes(ACCESS_AUD)) return { ok: false, reason: "wrong_audience" };

  return { ok: true, email: typeof payload.email === "string" ? payload.email : "" };
}

/** Test seam: drop the cached keys. */
export function resetAccessCerts() {
  cached = null;
}
