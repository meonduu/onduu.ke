/**
 * POST /api/submit — assessment requests and contact enquiries.
 *
 * Implements the form requirements in section 28 of the definitive brief:
 * server-side schema validation, server-side Turnstile Siteverify, field
 * length limits and allowlists, prepared D1 queries, rate limits, a generic
 * success response with a reference ID, no PII in logs, and no automatic
 * infrastructure referral.
 */

export interface SubmissionEnv {
  onduu_leads?: D1Database;
  TURNSTILE_SECRET?: string;
  ZEPTOMAIL_TOKEN?: string;
  NOTIFY_EMAIL?: string;
}

const CONSENT_VERSION = "2026-08-15";
const CONSENT_TEXT =
  "I agree to the privacy notice and to Onduu processing this information to prepare a response.";

// Allowlists — anything outside these is rejected rather than coerced.
const CONCERNS = [
  "leads",
  "trust",
  "speed",
  "control",
  "recovery",
  "brand",
  "measurement",
  "data location",
  "agents",
];
const ENQUIRY_TYPES = ["website", "infrastructure", "agent workflow", "combination"];

const LIMITS = {
  full_name: 120,
  business_email: 254,
  company: 160,
  role: 120,
  website_url: 300,
  primary_concern: 40,
  trigger_now: 2000,
  business_result: 2000,
  current_manager: 500,
  consequence_six_months: 2000,
  enquiry_type: 40,
} as const;

type Field = keyof typeof LIMITS;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });

// Deliberately generic: the client shows the brief's approved error copy.
const GENERIC_ERROR = {
  ok: false as const,
  error: "We could not complete that request.",
};

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

// Email shape only. Deliverability is not claimed or checked here.
function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) && value.length <= LIMITS.business_email;
}

function isSafeUrl(value: string) {
  if (!value) return true; // optional
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      !!url.hostname.includes(".") &&
      value.length <= LIMITS.website_url
    );
  } catch {
    return false;
  }
}

export function validate(kind: string, body: Record<string, unknown>) {
  const errors: Record<string, string> = {};
  const value = (field: Field) => str(body[field]).slice(0, LIMITS[field] + 1);

  if (kind !== "readiness" && kind !== "contact") {
    return { ok: false as const, errors: { form: "Unknown form." } };
  }

  const data: Record<string, string> = {};
  for (const field of Object.keys(LIMITS) as Field[]) {
    const v = value(field);
    if (v.length > LIMITS[field]) {
      errors[field] = `Please keep this under ${LIMITS[field]} characters.`;
      continue;
    }
    data[field] = v;
  }

  // A length failure already explains the problem — don't overwrite it with a
  // "required" message for the same field.
  if (!errors.full_name && !data.full_name) errors.full_name = "Please give your full name.";
  if (!errors.business_email) {
    if (!data.business_email) errors.business_email = "Please give a business email address.";
    else if (!isEmail(data.business_email))
      errors.business_email = "That email address does not look valid.";
  }
  if (!errors.company && !data.company) errors.company = "Please give your company name.";
  if (data.website_url && !isSafeUrl(data.website_url))
    errors.website_url = "That website address does not look valid.";
  if (data.primary_concern && !CONCERNS.includes(data.primary_concern))
    errors.primary_concern = "Please choose one of the listed options.";
  if (data.enquiry_type && !ENQUIRY_TYPES.includes(data.enquiry_type))
    errors.enquiry_type = "Please choose one of the listed options.";

  if (kind === "contact" && !data.business_result)
    errors.business_result = "Please describe the result the website or workflow should produce.";

  if (body.consent !== true && body.consent !== "true" && body.consent !== "on")
    errors.consent = "Please confirm you agree to the privacy notice.";

  if (Object.keys(errors).length) return { ok: false as const, errors };
  return { ok: true as const, data };
}

// Human-readable, non-sequential, safe to quote in an email. Not a secret.
export function reference(now = new Date(), random = Math.random) {
  const stamp = now.toISOString().slice(2, 10).replace(/-/g, "");
  const suffix = Math.floor(random() * 36 ** 4)
    .toString(36)
    .toUpperCase()
    .padStart(4, "0");
  return `ON-${stamp}-${suffix}`;
}

async function verifyTurnstile(token: string, secret: string, ip: string | null) {
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: form,
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

async function withinRateLimit(db: D1Database, clientKey: string) {
  const windowStart = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const row = await db
    .prepare("SELECT count, window_start FROM submission_throttle WHERE client_key = ?")
    .bind(clientKey)
    .first<{ count: number; window_start: string }>();

  if (!row || row.window_start < windowStart) {
    await db
      .prepare(
        "INSERT INTO submission_throttle (client_key, window_start, count) VALUES (?, ?, 1)\n         ON CONFLICT(client_key) DO UPDATE SET window_start = excluded.window_start, count = 1"
      )
      .bind(clientKey, new Date().toISOString())
      .run();
    return true;
  }

  if (row.count >= 5) return false;

  await db
    .prepare("UPDATE submission_throttle SET count = count + 1 WHERE client_key = ?")
    .bind(clientKey)
    .run();
  return true;
}

// Coarse, hashed client key. Never store or log the raw IP.
async function clientKeyOf(request: Request) {
  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
  return [...new Uint8Array(digest)].slice(0, 8).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function notify(env: SubmissionEnv, kind: string, ref: string) {
  // The notification deliberately carries no submitted content — only the
  // reference and form type. Details are read from D1 by an authorised person.
  if (!env.ZEPTOMAIL_TOKEN || !env.NOTIFY_EMAIL) return;
  try {
    await fetch("https://api.zeptomail.com/v1.1/email", {
      method: "POST",
      headers: {
        Authorization: env.ZEPTOMAIL_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: { address: env.NOTIFY_EMAIL },
        to: [{ email_address: { address: env.NOTIFY_EMAIL } }],
        subject: `New ${kind} request — ${ref}`,
        textbody: `A new ${kind} request was received.\n\nReference: ${ref}\n\nThe submitted details are stored in the onduu-leads database. This message intentionally contains no personal data.`,
      }),
    });
  } catch {
    // Notification failure must never fail the submission.
  }
}

export async function handleSubmit(request: Request, env: SubmissionEnv): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: { Allow: "POST" } });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json(GENERIC_ERROR, 400);
  }

  const kind = str(body.kind);
  const result = validate(kind, body);
  if (!result.ok) return json({ ...GENERIC_ERROR, fields: result.errors }, 422);

  // Fail closed: without a configured secret the form must not accept traffic,
  // rather than silently running without spam protection.
  if (!env.TURNSTILE_SECRET) {
    return json({ ...GENERIC_ERROR, reason: "unconfigured" }, 503);
  }
  const passed = await verifyTurnstile(
    str(body["cf-turnstile-response"]),
    env.TURNSTILE_SECRET,
    request.headers.get("cf-connecting-ip")
  );
  if (!passed) return json({ ...GENERIC_ERROR, fields: { turnstile: "Please complete the check." } }, 403);

  if (!env.onduu_leads) return json({ ...GENERIC_ERROR, reason: "unconfigured" }, 503);

  const clientKey = await clientKeyOf(request);
  if (!(await withinRateLimit(env.onduu_leads, clientKey))) {
    return json(
      { ...GENERIC_ERROR, error: "Too many requests. Please try again later." },
      429
    );
  }

  const ref = reference();
  const retainUntil = new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const d = result.data;

  try {
    await env.onduu_leads
      .prepare(
        `INSERT INTO submissions (
          reference, kind, full_name, business_email, company, role, website_url,
          primary_concern, trigger_now, business_result, current_manager,
          consequence_six_months, enquiry_type,
          consent_given, consent_text, consent_version, retain_until
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`
      )
      .bind(
        ref,
        kind,
        d.full_name,
        d.business_email,
        d.company,
        d.role || null,
        d.website_url || null,
        d.primary_concern || null,
        d.trigger_now || null,
        d.business_result || null,
        d.current_manager || null,
        d.consequence_six_months || null,
        d.enquiry_type || null,
        CONSENT_TEXT,
        CONSENT_VERSION,
        retainUntil
      )
      .run();
  } catch {
    // Log the failure without the body — no PII in logs.
    console.error(JSON.stringify({ event: "submission_insert_failed", kind, ref }));
    return json(GENERIC_ERROR, 500);
  }

  await notify(env, kind, ref);
  console.log(JSON.stringify({ event: "submission_received", kind, ref }));

  return json({ ok: true, reference: ref });
}
