/**
 * Domain-owner opt-out: the request, the proof, and the action.
 *
 * Policy (owner, 18 Aug 2026, docs/specs/instant-scan.md §6): a domain
 * owner who asks is blocked from future scans, every stored record of the
 * domain is deleted, and future lookups of it are not recorded. Until
 * 21 Aug 2026 the route was the sales contact form, and the action was a
 * hand-run SQL command. This module makes it self-service, with the one
 * thing the old route lacked: proof that the requester controls the domain.
 *
 * The proof is an email to an address AT the domain. Exact match only —
 * the mailbox host must equal the domain. A suffix rule would let
 * someone@example.co.ke block co.ke itself, taking every .co.ke business
 * with it; the exact rule makes that impossible by construction.
 *
 * What a confirmation email reveals is bounded the same way: an attacker
 * can only cause mail to addresses at the domain they name, once per
 * domain per hour, behind Turnstile and the shared rate limit.
 *
 * GET on the confirm page only shows a button; the POST does the work.
 * Corporate mail filters fetch every link in a message before the reader
 * sees it, and a GET that acted would let a filter opt a domain out on
 * the owner's behalf.
 */
import { normaliseHost, isScannableHost } from "./scan/net.ts";
import { withinLimit, clientKeyOf } from "./rate-limit.ts";
import { readJsonLimited, BODY_LIMITS } from "./body-limit.ts";
import { optOutDomain, isDomainBlocklisted } from "./scan/store.ts";
import {
  type SubmissionEnv,
  reference,
  verifyTurnstile,
  notifyOwner,
} from "./submissions.ts";

const CONFIRM_PATH = "/do-not-scan/confirm";
const TOKEN_TTL_MS = 48 * 60 * 60 * 1000;
const COOLDOWN_MS = 60 * 60 * 1000;
const NOTE_LIMIT = 500;

// A request against a registry extension would, with the subdomain match
// in isBlocked(), silence every domain under it. Exact-match email makes
// that unreachable in practice (nobody has a mailbox at co.ke), and this
// list makes it unreachable in principle. KeNIC's second-level extensions.
const KE_EXTENSIONS = new Set([
  "ke", "co.ke", "or.ke", "ne.ke", "go.ke", "ac.ke", "sc.ke", "me.ke", "mobi.ke", "info.ke",
]);

export interface OptOutRequest {
  domain: string;
  email: string;
  note: string | null;
}

export type Validation =
  | { ok: true; data: OptOutRequest }
  | { ok: false; errors: Record<string, string> };

function str(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

/** Same shape rule as the enquiry forms; deliverability is not claimed. */
function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) && value.length <= 254;
}

export function validateOptOut(body: Record<string, unknown>): Validation {
  const errors: Record<string, string> = {};
  const domain = normaliseHost(str(body.domain));
  const email = str(body.email).toLowerCase();
  const note = str(body.note);

  if (!domain || !isScannableHost(domain)) {
    errors.domain = "Please give a domain name, such as yourbusiness.co.ke.";
  } else if (KE_EXTENSIONS.has(domain)) {
    errors.domain = "That is a registry extension, not a domain. Give the domain itself.";
  }

  if (!isEmail(email)) {
    errors.email = "Please give an email address at that domain.";
  } else if (domain && email.slice(email.lastIndexOf("@") + 1) !== domain) {
    errors.email = `The address must be at ${domain} itself — that is how control of the domain is shown.`;
  }

  if (note.length > NOTE_LIMIT) errors.note = `Please keep this under ${NOTE_LIMIT} characters.`;

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, data: { domain: domain!, email, note: note || null } };
}

/* ── Tokens ──────────────────────────────────────────────────────────── */

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/* ── The email ───────────────────────────────────────────────────────── */

// The sender pairing is the one notify() established on 21 Aug 2026: the
// ujiajiri token wins when set because NOTIFY_EMAIL sends as ujiajiri.ke.
// Trimmed and prefixed for the same reasons recorded there — a pasted
// newline or a bare key both produce an indistinguishable 401 TM_4001.
async function sendConfirmation(
  env: SubmissionEnv,
  to: string,
  domain: string,
  link: string,
  ref: string,
): Promise<boolean> {
  const token = (env.ZEPTOMAIL_UJIAJIRI_TOKEN || env.ZEPTOMAIL_TOKEN || "").trim();
  const from = (env.NOTIFY_EMAIL || "").trim();
  if (!token || !isEmail(from)) {
    console.error(JSON.stringify({ event: "optout_mail_skipped", reason: "secrets_missing", ref }));
    return false;
  }
  try {
    const res = await fetch("https://api.zeptomail.com/v1.1/email", {
      method: "POST",
      headers: {
        Authorization: token.startsWith("Zoho-enczapikey") ? token : `Zoho-enczapikey ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: { address: from, name: "Onduu" },
        to: [{ email_address: { address: to } }],
        subject: `Confirm: leave ${domain} alone on onduu.ke`,
        textbody:
          `Someone — probably you — asked onduu.ke to stop scanning ${domain} and to delete ` +
          `everything it has stored about that domain.\n\n` +
          `If that was you, open this link and press the button:\n${link}\n\n` +
          `The link works once and expires in 48 hours. If you did not ask, ignore this message; ` +
          `nothing changes unless the button is pressed.\n\n` +
          `What happens on confirmation: ${domain} and its subdomains are refused by the Instant ` +
          `Public Fitness Scan, every stored scan result and tool lookup for it is deleted, and ` +
          `future lookups of it are not recorded. The free lookups themselves keep working, because ` +
          `they read only the public DNS and registry records any WHOIS tool can read.\n\n` +
          `Reference ${ref}.\n\nOnduu is operated by Ujiajiri Enterprises Limited. ` +
          `Privacy notice: https://onduu.ke/legal/privacy`,
      }),
    });
    if (!res.ok) {
      const detail = (await res.text().catch(() => "")).slice(0, 200);
      const code = detail.match(/"(?:sub_)?code"\s*:\s*"([A-Z0-9_]+)"/)?.[1] ?? "unknown";
      console.error(JSON.stringify({ event: "optout_mail_failed", status: res.status, code, ref }));
      return false;
    }
    return true;
  } catch (err) {
    console.error(
      JSON.stringify({ event: "optout_mail_failed", status: 0, code: (err as Error).name, ref }),
    );
    return false;
  }
}

/* ── POST /api/do-not-scan ───────────────────────────────────────────── */

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });

const GENERIC = { ok: false as const, error: "We could not complete that request." };

export async function handleOptOutRequest(request: Request, env: SubmissionEnv): Promise<Response> {
  if (request.method !== "POST") return json({ ok: false, error: "Method not allowed." }, 405);
  const db = env.onduu_leads;
  if (!db) return json({ ...GENERIC, reason: "unconfigured" }, 503);

  let body: Record<string, unknown>;
  try {
    const parsed = await readJsonLimited(request, BODY_LIMITS.optOut);
    if (!parsed.ok) {
      return parsed.reason === "too_large"
        ? json({ ...GENERIC, error: "That request was too large." }, 413)
        : json({ ...GENERIC, fields: { form: "The request was not readable." } }, 400);
    }
    body = parsed.value as Record<string, unknown>;
  } catch {
    return json({ ...GENERIC, fields: { form: "The request was not readable." } }, 400);
  }

  const passed = await verifyTurnstile(
    str(body["cf-turnstile-response"]),
    env.TURNSTILE_SECRET ?? "",
    request.headers.get("cf-connecting-ip"),
  );
  if (!passed) return json({ ...GENERIC, fields: { turnstile: "Please complete the check." } }, 403);

  const checked = validateOptOut(body);
  if (!checked.ok) return json({ ...GENERIC, fields: checked.errors }, 400);
  const { domain, email, note } = checked.data;

  const clientKey = await clientKeyOf(request, "submission", env.CLIENT_KEY_SECRET);
  if (!(await withinRateLimit(db, clientKey))) {
    return json({ ...GENERIC, error: "Too many requests. Please try again later." }, 429);
  }

  const now = new Date();
  try {
    if (await isDomainBlocklisted(db, domain)) {
      return json({
        ok: true,
        state: "already",
        message: `${domain} is already on the do-not-scan list. Nothing more is needed.`,
      });
    }

    // One confirmation email per domain per hour, whoever asks. This is
    // the control that stops the form being used to flood a mailbox.
    const recent = await db
      .prepare(
        "SELECT 1 FROM do_not_scan_requests WHERE domain = ? AND confirmed_at IS NULL AND created_at > ? LIMIT 1",
      )
      .bind(domain, new Date(now.getTime() - COOLDOWN_MS).toISOString())
      .first();
    if (recent) {
      return json({
        ok: true,
        state: "cooldown",
        message: `A confirmation for ${domain} was sent within the last hour. Check that inbox, including spam, before asking again.`,
      });
    }

    const token = randomToken();
    const ref = reference(now);
    await db
      .prepare(
        "INSERT INTO do_not_scan_requests (reference, domain, email, note, token_hash, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(
        ref,
        domain,
        email,
        note,
        await sha256(token),
        now.toISOString(),
        new Date(now.getTime() + TOKEN_TTL_MS).toISOString(),
      )
      .run();

    const link = `${new URL(request.url).origin}${CONFIRM_PATH}?token=${token}`;
    const sent = await sendConfirmation(env, email, domain, link, ref);
    if (!sent) {
      // A row with no email behind it would hold the hour-long cooldown
      // against the owner's own retry. Remove it so "try again" is true.
      await db.prepare("DELETE FROM do_not_scan_requests WHERE reference = ?").bind(ref).run();
      return json({ ...GENERIC, error: "The confirmation email could not be sent just now. Please try again later." }, 502);
    }
    return json({
      ok: true,
      state: "sent",
      reference: ref,
      message: `A confirmation link has been sent to ${email}. Open it and press the button; the link expires in 48 hours.`,
    });
  } catch (err) {
    // Most likely migration 0010 not yet applied. Say so in the log, not
    // to the visitor.
    console.error(JSON.stringify({ event: "optout_failed", code: (err as Error).message.slice(0, 80) }));
    return json(GENERIC, 500);
  }
}

// The shared limiter (worker/rate-limit.ts). This file carried its own
// copy of the read-then-write version until 22 Aug 2026.
const withinRateLimit = (db: D1Database, clientKey: string) =>
  withinLimit(db, "submission_throttle", clientKey, 5, 60 * 60 * 1000);

/* ── The confirm page ────────────────────────────────────────────────── */

export type ConfirmLookup =
  | { state: "ready"; domain: string; reference: string }
  | { state: "done"; domain: string; reference: string; deleted: number }
  | { state: "expired" }
  | { state: "used"; domain: string }
  | { state: "invalid" };

/** GET: resolve a token to what the button would do, without doing it. */
export async function lookupToken(db: D1Database, token: string): Promise<ConfirmLookup> {
  if (!/^[0-9a-f]{48}$/.test(token)) return { state: "invalid" };
  const row = await db
    .prepare("SELECT reference, domain, expires_at, confirmed_at FROM do_not_scan_requests WHERE token_hash = ?")
    .bind(await sha256(token))
    .first<{ reference: string; domain: string; expires_at: string; confirmed_at: string | null }>();
  if (!row) return { state: "invalid" };
  if (row.confirmed_at) return { state: "used", domain: row.domain };
  if (row.expires_at < new Date().toISOString()) return { state: "expired" };
  return { state: "ready", domain: row.domain, reference: row.reference };
}

/** POST: the action. Idempotent; a second press reports "used". */
export async function confirmToken(db: D1Database, env: SubmissionEnv, token: string): Promise<ConfirmLookup> {
  const found = await lookupToken(db, token);
  if (found.state !== "ready") return found;
  const now = new Date();
  const result = await optOutDomain(
    db,
    found.domain,
    `Owner request ${found.reference}, confirmed by email at the domain`,
    now,
  );
  await db
    .prepare("UPDATE do_not_scan_requests SET confirmed_at = ? WHERE reference = ?")
    .bind(now.toISOString(), found.reference)
    .run();
  // The owner learns a domain left, by the same two channels as an enquiry.
  // The message carries the reference only.
  await notifyOwner(env, "do-not-scan", found.reference, "onduu.ke/go/blocklist");
  return {
    state: "done",
    domain: found.domain,
    reference: found.reference,
    deleted: result.deleted + result.checksDeleted,
  };
}
