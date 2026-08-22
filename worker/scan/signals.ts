/**
 * Signal evaluation for the Instant Public Fitness Scan: Observations in,
 * 24 SignalResults out, exactly as tabled in docs/specs/instant-scan.md §9.
 *
 * Pure and deterministic: the same Observations object always produces the
 * same signals (the scoring-replay launch gate depends on it). Every rule
 * here mirrors a row of the approved psr-v1 rubric — change the spec first,
 * then this file, never the other way round.
 *
 * Rule 2 of the spec governs every branch: what cannot be observed is
 * "unobservable", never a pass or a failure.
 */
import type { Observations } from "./collect.ts";
import type { SignalResult, SignalStatus, Dimension } from "./rubric.ts";

const VERIFIED_NOTE = "Covered by the Verified Digital Fitness Assessment.";

// `limitation` is no longer shown to visitors (owner, 22 Aug 2026): the
// per-signal caveats were all scope hedges — "presence only", "one
// request", "not tested" — and /scan already says all of it twice, in
// section 01 and in the note under the result. It is still carried on the
// signal and stored with the scan, because it records what a given check
// actually examined, which is the thing to reach for if a finding is ever
// disputed.
function signal(
  id: string,
  dimension: Dimension,
  label: string,
  status: SignalStatus,
  evidence: string,
  limitation: string,
): SignalResult {
  return { id, dimension, label, status, evidence, limitation };
}

function unobservable(id: string, dimension: Dimension, label: string, why: string): SignalResult {
  return signal(id, dimension, label, "unobservable", why, VERIFIED_NOTE);
}

/** Registrable-suffix grouping, coarse but deterministic: last two labels. */
function providerKey(host: string): string {
  const labels = host.toLowerCase().replace(/\.$/, "").split(".");
  return labels.slice(-2).join(".");
}

export function evaluateSignals(obs: Observations): SignalResult[] {
  const out: SignalResult[] = [];
  const home = obs.homepage;

  /* ── Control ── */

  if (!obs.rdap.fetched || !obs.rdap.expiryDate) {
    out.push(
      unobservable("expiry-buffer", "control", "Domain expiry buffer", "RDAP did not return an expiry date for this domain."),
    );
  } else {
    const days = Math.floor((Date.parse(obs.rdap.expiryDate) - Date.parse(obs.scannedAt)) / 86_400_000);
    out.push(
      signal(
        "expiry-buffer",
        "control",
        "Domain expiry buffer",
        days >= 60 ? "pass" : days >= 30 ? "warn" : "fail",
        `Registration expires ${obs.rdap.expiryDate.slice(0, 10)} (${days} days away).`,
        "Public registry data; renewal settings and billing are not visible.",
      ),
    );
  }

  // .length matters: an empty array is truthy, so "no codes published"
  // used to fall through and score a FAIL on missing evidence.
  if (!obs.rdap.fetched || !obs.rdap.eppStatuses?.length) {
    out.push(unobservable("transfer-lock", "control", "Transfer lock", "RDAP status codes were not available."));
  } else {
    // RDAP publishes spec-normalised, space-separated statuses ("client
    // transfer prohibited"); some servers echo EPP camelCase instead. Strip
    // everything non-alphabetic so both forms match.
    const locked = obs.rdap.eppStatuses.some((s) =>
      /transferprohibited/.test(s.toLowerCase().replace(/[^a-z]/g, "")),
    );
    out.push(
      signal(
        "transfer-lock",
        "control",
        "Transfer lock",
        locked ? "pass" : "fail",
        `Registry status: ${obs.rdap.eppStatuses.join(", ")}.`,
        "Shows the registry flag only, not who can change it.",
      ),
    );
  }

  if (obs.dns.dsPresent === null) {
    out.push(unobservable("dnssec", "control", "DNSSEC", "The DS record query did not complete."));
  } else {
    out.push(
      signal(
        "dnssec",
        "control",
        "DNSSEC",
        obs.dns.dsPresent ? "pass" : "fail",
        obs.dns.dsPresent ? "A DS record is published: DNS answers are signed." : "No DS record: DNS answers are not signed.",
        "Presence only; key management is not visible.",
      ),
    );
  }

  if (obs.dns.nsHosts.length === 0) {
    out.push(unobservable("ns-redundancy", "control", "Nameserver redundancy", "The NS query did not complete."));
  } else {
    const hosts = new Set(obs.dns.nsHosts);
    out.push(
      signal(
        "ns-redundancy",
        "control",
        "Nameserver redundancy",
        hosts.size >= 2 ? "pass" : "fail",
        `${hosts.size} nameserver${hosts.size === 1 ? "" : "s"}: ${[...hosts].join(", ")}.`,
        "Counts published NS records; actual server independence is not visible.",
      ),
    );
  }

  /* ── Trust ── */

  // https homepage fetch succeeding at all proves a presentable certificate;
  // workerd refuses invalid TLS, so a TLS-level failure surfaces as a
  // network error with the http probe still answering.
  if (home.fetched) {
    out.push(
      signal(
        "https-certificate",
        "trust",
        "HTTPS",
        "pass",
        `https://${obs.domain}/ served over a valid TLS connection (status ${home.status}).`,
        "Validity at scan time; expiry monitoring is not visible.",
      ),
    );
  } else if (home.error === "network" || home.error === "timeout") {
    out.push(
      signal(
        "https-certificate",
        "trust",
        "HTTPS",
        "fail",
        `https://${obs.domain}/ could not complete a TLS connection (${home.error}).`,
        "One attempt from one location.",
      ),
    );
  } else {
    out.push(unobservable("https-certificate", "trust", "HTTPS", `The homepage fetch did not complete (${home.error ?? "unknown"}).`));
  }

  if (!obs.httpProbe.fetched && obs.httpProbe.chain.length === 0) {
    out.push(unobservable("http-to-https", "trust", "http → https redirect", "The plain-http probe did not complete."));
  } else {
    const firstHop = obs.httpProbe.chain[0];
    const redirected = Boolean(firstHop?.location?.startsWith("https://"));
    const finalHttps = obs.httpProbe.finalUrl?.startsWith("https://") ?? false;
    out.push(
      signal(
        "http-to-https",
        "trust",
        "http → https redirect",
        redirected || finalHttps ? "pass" : "fail",
        redirected
          ? `http://${obs.domain}/ redirects to ${firstHop?.location}.`
          : `http://${obs.domain}/ served content without redirecting to https.`,
        "First request only.",
      ),
    );
  }

  if (!obs.twin.page.fetched && obs.twin.page.chain.length === 0) {
    out.push(
      unobservable("apex-www-coherence", "trust", "apex ↔ www coherence", `https://${obs.twin.host}/ did not resolve or complete.`),
    );
  } else {
    const twinFinal = obs.twin.page.finalUrl ?? "";
    const homeHost = home.finalUrl ? new URL(home.finalUrl).hostname : obs.domain;
    const twinLandsOnCanonical = twinFinal && new URL(twinFinal).hostname === homeHost;
    const sameTitle = obs.twin.page.title != null && obs.twin.page.title === home.title;
    out.push(
      signal(
        "apex-www-coherence",
        "trust",
        "apex ↔ www coherence",
        twinLandsOnCanonical ? "pass" : sameTitle ? "warn" : "fail",
        twinLandsOnCanonical
          ? `${obs.twin.host} resolves to the same canonical host (${homeHost}).`
          : sameTitle
            ? `${obs.twin.host} serves the same content without redirecting to one canonical host.`
            : `${obs.twin.host} serves different content (title: ${JSON.stringify(obs.twin.page.title)}).`,
        "Compared by redirect target and page title only.",
      ),
    );
  }

  if (!home.fetched) {
    out.push(unobservable("hsts", "trust", "HSTS", "The homepage fetch did not complete."));
    out.push(unobservable("security-headers", "trust", "Baseline security headers", "The homepage fetch did not complete."));
    out.push(unobservable("title-meta", "trust", "Title and description", "The homepage fetch did not complete."));
  } else {
    out.push(
      signal(
        "hsts",
        "trust",
        "HSTS",
        home.headers["strict-transport-security"] ? "pass" : "fail",
        home.headers["strict-transport-security"]
          ? `strict-transport-security: ${home.headers["strict-transport-security"]}`
          : "No strict-transport-security header.",
        "Header presence only.",
      ),
    );
    const baseline = ["x-content-type-options", "x-frame-options", "content-security-policy"].filter(
      (h) => home.headers[h],
    );
    out.push(
      signal(
        "security-headers",
        "trust",
        "Baseline security headers",
        baseline.length >= 2 ? "pass" : baseline.length === 1 ? "warn" : "fail",
        baseline.length ? `Present: ${baseline.join(", ")}.` : "None of x-content-type-options, x-frame-options or content-security-policy present.",
        "Presence only; policy quality is not assessed.",
      ),
    );
    const hasTitle = Boolean(home.title);
    const hasMeta = Boolean(home.metaDescription);
    out.push(
      signal(
        "title-meta",
        "trust",
        "Title and description",
        hasTitle && hasMeta ? "pass" : hasTitle || hasMeta ? "warn" : "fail",
        `Title: ${hasTitle ? JSON.stringify(home.title) : "missing"}; meta description: ${hasMeta ? "present" : "missing"}.`,
        "Presence only, not wording quality.",
      ),
    );
  }

  /* ── Speed ── */

  if (!home.fetched || home.timingMs == null) {
    out.push(unobservable("ttfb-band", "speed", "Response time", "The homepage fetch did not complete."));
    out.push(unobservable("html-weight", "speed", "HTML weight", "The homepage fetch did not complete."));
    out.push(unobservable("viewport", "speed", "Mobile viewport", "The homepage fetch did not complete."));
  } else {
    out.push(
      signal(
        "ttfb-band",
        "speed",
        "Response time",
        home.timingMs < 800 ? "pass" : home.timingMs <= 2500 ? "warn" : "fail",
        `Homepage answered in ${home.timingMs} ms.`,
        "One uncached request from one location; not a performance test.",
      ),
    );
    const weight = home.contentLength ?? home.bodyBytes ?? 0;
    const kib = Math.round(weight / 1024);
    out.push(
      signal(
        "html-weight",
        "speed",
        "HTML weight",
        weight < 100 * 1024 ? "pass" : weight <= 300 * 1024 ? "warn" : "fail",
        `Homepage HTML: ~${kib} KiB${home.contentLength ? " (as served)" : " (received)"}${home.truncated ? ", capped at the scan limit" : ""}.`,
        "HTML document only; images and scripts are not fetched.",
      ),
    );
    out.push(
      signal(
        "viewport",
        "speed",
        "Mobile viewport",
        home.viewport ? "pass" : "fail",
        home.viewport ? "A viewport meta tag is present." : "No viewport meta tag: mobile browsers will scale the desktop layout.",
        "Presence only; real rendering is not tested.",
      ),
    );
  }

  /* ── Conversion ── */

  if (!home.fetched) {
    out.push(unobservable("contact-path", "conversion", "Contact path", "The homepage fetch did not complete."));
    out.push(unobservable("single-h1", "conversion", "Clear headline", "The homepage fetch did not complete."));
  } else {
    out.push(
      signal(
        "contact-path",
        "conversion",
        "Contact path",
        home.hasContactPath ? "pass" : "fail",
        home.hasContactPath
          ? "The homepage exposes a contact route (phone, email, contact link or form)."
          : "No phone link, email link, contact link or form found on the homepage.",
        "Presence only; nothing was submitted and delivery is not tested.",
      ),
    );
    out.push(
      signal(
        "single-h1",
        "conversion",
        "Clear headline",
        home.h1Count === 1 ? "pass" : (home.h1Count ?? 0) > 1 ? "warn" : "fail",
        `${home.h1Count ?? 0} h1 element${home.h1Count === 1 ? "" : "s"} on the homepage.`,
        "Structure only, not copy quality.",
      ),
    );
  }

  if (!obs.missingProbe.fetched && obs.missingProbe.chain.length === 0) {
    out.push(unobservable("missing-page-handling", "conversion", "Missing-page handling", "The probe request did not complete."));
  } else {
    const st = obs.missingProbe.status ?? 0;
    out.push(
      signal(
        "missing-page-handling",
        "conversion",
        "Missing-page handling",
        st === 404 || st === 410 ? "pass" : st >= 200 && st < 300 ? "warn" : "fail",
        `A deliberately missing path returned status ${st || obs.missingProbe.error}.`,
        st >= 200 && st < 300 ? "A 200 for missing pages confuses search engines (soft 404)." : "One probe path only.",
      ),
    );
  }

  /* ── Resilience: email authentication, as one row ──
   *
   * Until 22 Aug 2026 this emitted four signals — spf, dkim, dmarc, mx —
   * each carrying the /email-security analyser's own detail text, so the
   * scan repeated that tool's result line for line. The scan is the
   * overview; the email page is where someone goes to fix things. One row
   * now says how many of the four are in order and links to the deep tool
   * with the domain carried across (owner decision; rubric psr-v3, same
   * Resilience weight as the four it replaces).
   */

  const email = obs.email.result;
  const emailKeys = ["spf", "dkim", "dmarc", "mx"] as const;
  const checks = email?.checks;
  if (!obs.email.fetched || !checks || !emailKeys.every((k) => checks[k])) {
    out.push(unobservable("email-auth", "resilience", "Email authentication", "The email-record check did not complete."));
  } else {
    const NAMES: Record<(typeof emailKeys)[number], string> = { spf: "SPF", dkim: "DKIM", dmarc: "DMARC", mx: "MX" };
    const st = (k: (typeof emailKeys)[number]) => checks[k]!.status;
    const inOrder = emailKeys.filter((k) => st(k) === "pass");
    const needsWork = emailKeys.filter((k) => st(k) === "warn");
    const missing = emailKeys.filter((k) => st(k) === "fail");
    const unknown = emailKeys.filter((k) => !["pass", "warn", "fail"].includes(st(k)));

    // The row's verdict is the worst of the four, which is also how a
    // receiver treats the records: one failing control is the one that
    // gets exploited. DMARC decides spoofability on its own, so a DMARC
    // fail is a fail whatever the others say.
    const status: SignalStatus =
      missing.length ? "fail" : needsWork.length ? "warn" : unknown.length === emailKeys.length ? "unobservable" : "pass";

    const parts: string[] = [];
    if (inOrder.length) parts.push(`${inOrder.map((k) => NAMES[k]).join(", ")} in order`);
    if (needsWork.length) parts.push(`${needsWork.map((k) => NAMES[k]).join(", ")} ${needsWork.length === 1 ? "needs" : "need"} work`);
    if (missing.length) parts.push(`${missing.map((k) => NAMES[k]).join(", ")} missing`);
    if (unknown.length) parts.push(`${unknown.map((k) => NAMES[k]).join(", ")} not determinable from outside`);
    const spoof = email?.spoofable ? " Mail claiming to be from this domain can currently be forged." : "";

    out.push(
      signal(
        "email-auth",
        "resilience",
        "Email authentication",
        status,
        `${inOrder.length} of 4 records in order: ${parts.join("; ")}.${spoof}`,
        status === "unobservable" ? VERIFIED_NOTE : "Published DNS records only; mailbox security is not visible.",
      ),
    );
  }

  if (obs.dns.nsHosts.length === 0 || !email?.checks?.mx) {
    out.push(unobservable("dns-diversity", "resilience", "Provider diversity", "NS or MX records were not observable."));
  } else {
    const nsProviders = new Set(obs.dns.nsHosts.map(providerKey));
    const mxRecord = email.checks.mx.record ?? "";
    const mxHosts = mxRecord.match(/[a-z0-9.-]+\.[a-z]{2,}/gi) ?? [];
    const mxProviders = new Set(mxHosts.map(providerKey));
    const allProviders = new Set([...nsProviders, ...mxProviders]);
    const single = allProviders.size === 1 && mxProviders.size > 0;
    out.push(
      signal(
        "dns-diversity",
        "resilience",
        "Provider diversity",
        single ? "fail" : "pass",
        single
          ? `DNS and mail both depend on a single provider (${[...allProviders][0]}).`
          : `DNS (${[...nsProviders].join(", ")}) and mail (${[...mxProviders].join(", ") || "n/a"}) are not on one single provider.`,
        "Grouped by registrable domain of the published hosts; contractual dependencies are not visible.",
      ),
    );
  }

  /* ── Agent fitness ── */

  const fileSignal = (
    id: string,
    label: string,
    page: Observations["robots"] | Observations["sitemap"],
    looksRight: boolean | undefined,
    absentMsg: string,
  ) => {
    if (!page.fetched && page.chain.length === 0) {
      out.push(unobservable(id, "agent-fitness", label, "The request did not complete."));
      return;
    }
    if (page.status !== 200) {
      out.push(signal(id, "agent-fitness", label, "fail", absentMsg, "Root path only."));
      return;
    }
    out.push(
      signal(
        id,
        "agent-fitness",
        label,
        looksRight ? "pass" : "warn",
        looksRight ? `Present and parseable at status 200.` : `Present at status 200 but did not parse as expected.`,
        "Syntax check only.",
      ),
    );
  };
  fileSignal("robots", "robots.txt", obs.robots, obs.robots.looksLikeRobots, "No robots.txt (crawlers and AI agents get no instructions).");
  fileSignal("sitemap", "sitemap.xml", obs.sitemap, obs.sitemap.looksLikeSitemap, "No sitemap.xml.");

  if (!home.fetched) {
    out.push(unobservable("structured-data", "agent-fitness", "Structured data", "The homepage fetch did not complete."));
  } else {
    out.push(
      signal(
        "structured-data",
        "agent-fitness",
        "Structured data",
        home.hasJsonLd ? (home.jsonLdParses ? "pass" : "warn") : "fail",
        home.hasJsonLd
          ? home.jsonLdParses
            ? "JSON-LD structured data is present and parseable."
            : "JSON-LD blocks are present but did not parse."
          : "No JSON-LD structured data on the homepage.",
        "Homepage only; schema correctness beyond JSON syntax is not assessed.",
      ),
    );
  }

  return out;
}
