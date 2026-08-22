/**
 * Read a request body under a hard byte ceiling.
 *
 * Security review, 22 August 2026: every endpoint parsed whatever arrived.
 * `/api/event` was the closest to safe and still read the whole body into
 * memory before measuring it —
 *
 *     const body = await request.text();
 *     if (body.length > MAX_BODY_BYTES) return 413;
 *
 * which pays the full cost of a hostile body before deciding to refuse it,
 * and measures UTF-16 code units rather than bytes so a multi-byte payload
 * passes at well over the intended size. The others had no ceiling at all.
 *
 * Two gates, in the order that matters:
 *   1. `Content-Length`, when present, is checked before a byte is read.
 *      Nearly every real client sends it, so nearly every oversized request
 *      is refused for free.
 *   2. A streaming counter for the rest — chunked bodies, or a client that
 *      lies about the length. The stream is cancelled the moment the
 *      running total passes the ceiling, so nothing accumulates.
 *
 * Field-level validation still runs afterwards and is unchanged. This only
 * decides whether the body is worth parsing at all.
 */

/** Ceilings per endpoint. Generous against real use, small against abuse. */
export const BODY_LIMITS = {
  /** Two long-form textareas plus attribution; LIMITS in submissions.ts caps the fields. */
  submit: 32_768,
  /** A domain and a Turnstile token. */
  scan: 4_096,
  /** A domain, an address and a 500-character note. */
  optOut: 4_096,
  /** A batch of engagement events (was MAX_BODY_BYTES). */
  event: 8_192,
  /** One route name from a two-item allowlist. */
  out: 1_024,
} as const;

export type BodyResult =
  | { ok: true; text: string }
  | { ok: false; reason: "too_large" };

export async function readBodyLimited(request: Request, maxBytes: number): Promise<BodyResult> {
  // Gate 1: refuse on the declared length, before reading anything.
  const declared = request.headers.get("content-length");
  if (declared !== null) {
    const n = Number(declared);
    if (Number.isFinite(n) && n > maxBytes) return { ok: false, reason: "too_large" };
  }

  if (!request.body) return { ok: true, text: "" };

  // Gate 2: count bytes as they arrive. A body with no Content-Length, or
  // one whose header understated it, is cut off at the ceiling rather than
  // being buffered to completion first.
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => {});
        return { ok: false, reason: "too_large" };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, reason: "too_large" };
  }

  const joined = new Uint8Array(total);
  let at = 0;
  for (const c of chunks) {
    joined.set(c, at);
    at += c.byteLength;
  }
  return { ok: true, text: new TextDecoder().decode(joined) };
}

export type JsonResult =
  | { ok: true; value: unknown }
  | { ok: false; reason: "too_large" | "unparseable" };

/** The same ceiling, then JSON. Callers distinguish 413 from 400. */
export async function readJsonLimited(request: Request, maxBytes: number): Promise<JsonResult> {
  const body = await readBodyLimited(request, maxBytes);
  if (!body.ok) return body;
  try {
    return { ok: true, value: JSON.parse(body.text) };
  } catch {
    return { ok: false, reason: "unparseable" };
  }
}
