/**
 * First-party engagement tracker.
 *
 * Records only what the spec allows (docs/specs/analytics-dashboard.md):
 * page views, engaged time, and clicks on elements that opt in with an
 * explicit data-analytics-event attribute. Nothing else — no DOM text, no
 * input values, no typed characters, no fingerprint.
 *
 * Deliberate limits, matching attribution.ts:
 *   - the session id lives in sessionStorage, dies with the tab, and cannot
 *     link two visits or follow anyone anywhere;
 *   - Global Privacy Control and Do Not Track disable the tracker entirely;
 *   - paths are sent without query strings or fragments;
 *   - engaged time counts only while the page is visible, focused and
 *     recently active — so "session duration" derived from it is an
 *     estimate, and is labelled as one on the dashboard;
 *   - the tracker never runs on the private dashboard (/go).
 */

export const HEARTBEAT_MS = 30_000;
export const IDLE_AFTER_MS = 60_000;
const ENDPOINT = "/api/event";
const SESSION_KEY = "onduu-session";
/** Events a page element may raise via data-analytics-event. */
const CLICK_EVENTS = new Set(["click", "conversion", "download", "outbound_link"]);

/* ── engaged-time core: pure, DOM-free, unit-tested ─────────────────── */

export interface Timer {
  engagedMs: number;
  /** Timestamp counting started, or null while paused. */
  activeSince: number | null;
  lastActivity: number;
}

export function makeTimer(now: number): Timer {
  return { engagedMs: 0, activeSince: now, lastActivity: now };
}

/** Fold the running stretch into the total; idle time does not count. */
function settle(t: Timer, now: number): number {
  if (t.activeSince === null) return t.engagedMs;
  const end = Math.min(now, t.lastActivity + IDLE_AFTER_MS);
  return t.engagedMs + Math.max(0, end - t.activeSince);
}

export function pause(t: Timer, now: number): Timer {
  return { engagedMs: settle(t, now), activeSince: null, lastActivity: t.lastActivity };
}

export function resume(t: Timer, now: number): Timer {
  return t.activeSince === null
    ? { engagedMs: t.engagedMs, activeSince: now, lastActivity: now }
    : activity(t, now);
}

export function activity(t: Timer, now: number): Timer {
  // Waking from idle restarts counting from now; the idle gap is not engaged.
  const woken = t.activeSince !== null && now > t.lastActivity + IDLE_AFTER_MS;
  return woken
    ? { engagedMs: settle(t, now), activeSince: now, lastActivity: now }
    : { ...t, lastActivity: t.activeSince === null ? t.lastActivity : now };
}

/** Engaged milliseconds since the last flush; resets the accumulator. */
export function flush(t: Timer, now: number): { timer: Timer; delta: number } {
  const total = settle(t, now);
  return {
    timer: { engagedMs: 0, activeSince: t.activeSince === null ? null : now, lastActivity: t.lastActivity },
    delta: total,
  };
}

/* ── wiring ─────────────────────────────────────────────────────────── */

type Payload = {
  name: string;
  path: string;
  label?: string;
  session?: string;
  referrer?: string;
  engaged_ms?: number;
};

function declined(): boolean {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  return nav.globalPrivacyControl === true || nav.doNotTrack === "1";
}

function sessionId(): string | undefined {
  try {
    let id = sessionStorage.getItem(SESSION_KEY) ?? "";
    if (!/^[0-9a-f-]{8,40}$/.test(id)) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return undefined; // storage unavailable: events still count, sessions don't
  }
}

function send(events: Payload[], useBeacon = false): void {
  if (events.length === 0) return;
  const body = JSON.stringify({ events });
  if (useBeacon && navigator.sendBeacon) {
    if (navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }))) return;
  }
  fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    /* losing an event must never surface */
  });
}

export function initAnalytics(): void {
  if (typeof window === "undefined") return;
  if (location.pathname.startsWith("/go")) return;
  if (declined()) return;

  const session = sessionId();
  const path = location.pathname;
  const base = (extra: Partial<Payload> & { name: string }): Payload => ({
    path,
    session,
    ...extra,
  });

  let timer = makeTimer(Date.now());
  let viewSent = false;
  const sendView = () => {
    if (viewSent) return;
    viewSent = true;
    send([base({ name: "page_view", referrer: document.referrer || undefined })]);
  };
  sendView();

  // A bfcache restore is a fresh reading of the page: new view, new timer.
  addEventListener("pageshow", (e) => {
    if (!e.persisted) return;
    viewSent = false;
    timer = makeTimer(Date.now());
    sendView();
  });

  const visible = () => document.visibilityState === "visible" && document.hasFocus();
  addEventListener("visibilitychange", () => {
    timer = visible() ? resume(timer, Date.now()) : pause(timer, Date.now());
  });
  addEventListener("blur", () => (timer = pause(timer, Date.now())));
  addEventListener("focus", () => (timer = resume(timer, Date.now())));
  for (const type of ["pointerdown", "keydown", "scroll", "pointermove"]) {
    addEventListener(type, () => (timer = activity(timer, Date.now())), { passive: true });
  }

  // Heartbeats bound the loss when the exit beacon never arrives.
  setInterval(() => {
    const out = flush(timer, Date.now());
    timer = out.timer;
    if (out.delta > 0) send([base({ name: "engagement", engaged_ms: out.delta })]);
  }, HEARTBEAT_MS);

  addEventListener("pagehide", () => {
    const out = flush(timer, Date.now());
    timer = out.timer;
    send([base({ name: "page_exit", engaged_ms: out.delta })], true);
  });

  // Clicks: only elements that opted in, only allowlisted event names.
  addEventListener("click", (e) => {
    const el = (e.target as Element | null)?.closest?.("[data-analytics-event]");
    if (!el) return;
    const name = el.getAttribute("data-analytics-event") ?? "";
    if (!CLICK_EVENTS.has(name)) return;
    const label = el.getAttribute("data-analytics-label") ?? undefined;
    send([base({ name, label })]);
  });
}
