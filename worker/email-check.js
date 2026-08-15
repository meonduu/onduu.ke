/**
 * GET /api/check?domain=example.com — Onduu email security checker.
 *
 * Resolves a domain's public email-authentication records over DNS-over-HTTPS
 * and returns a plain-language assessment. Reads public DNS only: no
 * credentials, no mailbox access, nothing the domain owner has not published.
 *
 * No environment variables required.
 *
 * The analysers are pure functions so they can be tested against fixtures
 * without touching DNS — see tests/email-check.test.mjs.
 */

const DOH = 'https://cloudflare-dns.com/dns-query';

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      // Public data, cheap to recompute — let the edge hold it briefly so a
      // shared result link doesn't re-query DNS for every visitor.
      'Cache-Control': 'public, max-age=300',
    },
  });

/**
 * DKIM selectors are not discoverable from DNS — you can only guess them.
 * This is the published selector list for the mail providers Kenyan SMEs
 * actually use. A miss here does NOT prove DKIM is absent, and the UI says so.
 */
const DKIM_SELECTORS = [
  'google', 'selector1', 'selector2', 'k1', 'k2', 's1', 's2', 'default',
  'dkim', 'mail', 'smtp', 'zoho', 'zmail', 'zeptomail', 'zepto', 'mandrill',
  'sendgrid', 'mailjet', 'sparkpost', 'scph0', 'pm', 'cm', 'protonmail',
  'everlytic', 'hs1', 'hs2', 'mimecast', 'dk', 'key1', 'litesrv', 'fm1',
  'mxvault', 'titan', 'en1', 'm1',
];

/**
 * Selectors that identify a specific sending platform. Finding a key on a
 * generic selector like "default" proves *something* signs mail — but if the
 * MX provider's own selector is absent, that provider's mail is unsigned and
 * fails DMARC the moment a message is forwarded (forwarding breaks SPF, and
 * there is then no DKIM to fall back on). This is a common real-world gap on
 * domains that look fine until a message is forwarded.
 */
const PROVIDER_SELECTORS = [
  [/Google Workspace/, 'google', 'Google Workspace'],
  [/Microsoft 365/, 'selector1', 'Microsoft 365'],
  [/Zoho Mail/, 'zmail', 'Zoho Mail'],
];

// MX hostname fragment → human name. Order matters; first match wins.
const PROVIDERS = [
  [/aspmx.*google|google\.com$|googlemail/i, 'Google Workspace'],
  [/outlook\.com|microsoft|office365/i, 'Microsoft 365'],
  [/zoho/i, 'Zoho Mail'],
  [/titan\.email|titan/i, 'Titan'],
  [/mimecast/i, 'Mimecast'],
  [/protonmail|proton\.me/i, 'Proton Mail'],
  [/yandex/i, 'Yandex'],
  [/mailgun|sendgrid|mailjet/i, 'a bulk sending service'],
  [/cpanel|hostafrica|safaricom|kenyaweb|truehost|sasahost|eac/i, 'a local hosting provider (cPanel-style)'],
];

async function dnsQuery(name, type) {
  try {
    const res = await fetch(`${DOH}?name=${encodeURIComponent(name)}&type=${type}`, {
      headers: { Accept: 'application/dns-json' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// TXT answers arrive as quoted, possibly-chunked strings: "a" "b" → ab
const unquoteTxt = (data) =>
  String(data || '')
    .split(/"\s+"/)
    .map((s) => s.replace(/^"|"$/g, ''))
    .join('')
    .trim();

export function normaliseDomain(input) {
  let d = String(input || '').trim().toLowerCase();
  d = d.replace(/^https?:\/\//, '').replace(/^www\./, '');
  d = d.split('/')[0].split('?')[0].split('@').pop();
  d = d.replace(/\.$/, '');
  return d;
}

export function isValidDomain(d) {
  if (!d || d.length > 253) return false;
  return /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(d);
}

/* ── Analysers (pure functions — unit tested against fixtures) ───────── */

export function analyseMx(records) {
  if (!records.length) {
    return {
      status: 'fail',
      records: [],
      detail:
        'No MX records found. Mail sent to this domain has nowhere to go — it will bounce. If you use email on this domain at all, this is the first thing to fix.',
    };
  }
  const hosts = records.map((r) => r.host).join(' ');
  const provider = (PROVIDERS.find(([re]) => re.test(hosts)) || [])[1] || null;
  return {
    status: 'pass',
    records,
    provider,
    detail: provider
      ? `Mail is delivered to ${provider}.`
      : 'Mail delivery is configured.',
  };
}

/**
 * Mechanisms that cost a DNS lookup under RFC 7208 §4.6.4. IP literals and
 * "all" are free. The limit is 10 across the whole recursive expansion — not
 * per record — and exceeding it is a permerror, which fails the entire record.
 */
export function parseSpfMechanisms(record) {
  const terms = String(record).trim().split(/\s+/).slice(1); // drop v=spf1
  const includes = [];
  let redirect = null;
  let bare = 0; // a, mx, ptr, exists — each costs 1

  for (const raw of terms) {
    const t = raw.replace(/^[+\-~?]/, '');
    if (/^include:/i.test(t)) includes.push(t.slice(8).toLowerCase());
    else if (/^redirect=/i.test(t)) redirect = t.slice(9).toLowerCase();
    else if (/^(a|mx|ptr)(:|\/|$)/i.test(t) || /^exists:/i.test(t)) bare++;
  }
  return { includes, redirect, bare };
}

/**
 * Walk the include tree for real. The single most common serious SPF fault in
 * the wild is a record that looks short but expands past 10 lookups — counting
 * only top-level mechanisms misses it entirely.
 *
 * `resolveTxt(name)` returns an array of TXT strings. Budgeted so a hostile or
 * looping record can't fan out indefinitely.
 */
export async function expandSpf(record, resolveTxt, opts = {}) {
  const maxDepth = opts.maxDepth ?? 4;
  const maxQueries = opts.maxQueries ?? 25;

  const seen = new Set();
  const duplicates = new Set();
  const unresolved = [];
  let total = 0;
  let queries = 0;
  let truncated = false;

  async function walk(rec, depth) {
    const { includes, redirect, bare } = parseSpfMechanisms(rec);
    total += bare;

    const targets = redirect ? includes.concat([redirect]) : includes;

    for (const target of targets) {
      total += 1; // the lookup itself is chargeable even if it fails

      if (seen.has(target)) {
        duplicates.add(target);
        continue; // already walked — don't double-count its children
      }
      seen.add(target);

      if (depth >= maxDepth || queries >= maxQueries) {
        truncated = true;
        continue;
      }

      queries++;
      let txt = null;
      try {
        txt = await resolveTxt(target);
      } catch {
        txt = null;
      }
      const child = (txt || []).find((t) => /^v=spf1\b/i.test(t));
      if (!child) {
        // A "void lookup" — resolves to nothing usable. RFC 7208 permits only
        // two of these before permerror.
        unresolved.push(target);
        continue;
      }
      await walk(child, depth + 1);
    }
  }

  await walk(record, 0);
  return {
    total,
    duplicates: [...duplicates],
    unresolved,
    truncated,
    limit: 10,
  };
}

export function analyseSpf(txtRecords, expansion) {
  const spf = txtRecords.filter((t) => /^v=spf1\b/i.test(t));

  if (spf.length === 0) {
    return {
      status: 'fail',
      detail:
        'No SPF record. Nothing tells receiving servers which servers are allowed to send email using your domain, so anyone can.',
    };
  }
  if (spf.length > 1) {
    return {
      status: 'fail',
      record: spf.join(' | '),
      detail:
        'More than one SPF record. This is invalid — receiving servers ignore all of them, so you effectively have no SPF at all. Merge them into a single record.',
    };
  }

  const record = spf[0];
  const allMatch = record.match(/([+\-~?])all\b/i);
  const qualifier = allMatch ? allMatch[1] : null;

  // Prefer the real recursive count; fall back to a top-level estimate when no
  // expansion was supplied (unit tests, or DNS unavailable).
  const shallow = parseSpfMechanisms(record);
  const lookups = expansion ? expansion.total : shallow.includes.length + shallow.bare + (shallow.redirect ? 1 : 0);
  const duplicates = expansion?.duplicates || [];
  const unresolved = expansion?.unresolved || [];

  if (qualifier === '+') {
    return {
      status: 'fail',
      record,
      lookups,
      detail:
        'Your SPF ends in "+all", which authorises every server on the internet to send as you. This is worse than having no SPF. Change it to "-all".',
    };
  }
  if (!qualifier || qualifier === '?') {
    return {
      status: 'warn',
      record,
      lookups,
      detail:
        'Your SPF has no enforcing "all" mechanism, so it gives receivers no instruction about unauthorised senders. End the record with "-all".',
    };
  }
  // Over the limit is a hard failure, not a warning: the record permerrors and
  // stops authenticating anything at all.
  if (lookups > 10) {
    return {
      status: 'fail',
      record,
      lookups,
      duplicates,
      unresolved,
      detail: `This record needs ${lookups} DNS lookups. SPF allows 10 — past that it fails with a permanent error and stops working entirely, so your legitimate mail is no longer authenticated.${
        duplicates.length ? ` It also includes ${duplicates.join(' and ')} more than once.` : ''
      } Remove senders you no longer use, or flatten the record to IP addresses.`,
    };
  }

  const notes = [];
  if (duplicates.length) {
    notes.push(
      `${duplicates.join(' and ')} ${duplicates.length > 1 ? 'are' : 'is'} included more than once, wasting ${duplicates.length} of your 10 lookups.`
    );
  }
  if (unresolved.length) {
    notes.push(
      `${unresolved.join(', ')} did not return an SPF record. Each dead include still costs a lookup, and more than two is itself a permanent error.`
    );
  }
  if (lookups >= 8) {
    notes.push(`You are at ${lookups} of 10 lookups — close enough that adding one more service could break the record.`);
  }

  const clean = qualifier === '-' && !notes.length;
  return {
    status: clean ? 'pass' : 'warn',
    record,
    lookups,
    qualifier,
    duplicates,
    unresolved,
    detail: clean
      ? `A single valid SPF record ending in "-all", using ${lookups} of the 10 permitted DNS lookups. This is correct.`
      : [
          qualifier === '-'
            ? 'Valid SPF ending in "-all".'
            : 'Valid SPF, but it ends in "~all" (softfail) — unauthorised mail is marked suspicious rather than refused. Once every real sender is listed, move to "-all".',
          ...notes,
        ].join(' '),
  };
}

export function analyseDkim(found, provider, dmarcEnforcing) {
  if (!found.length) {
    return {
      status: 'warn',
      selectors: [],
      undetectable: !!dmarcEnforcing,
      detail: dmarcEnforcing
        ? 'We could not find a DKIM key, but this is very likely a limit of the check rather than a fault on your domain. Selectors cannot be discovered from DNS — only guessed — and several providers issue unguessable ones (ZeptoMail and SparkPost use numbers like "28419" or "scph0526"). Since your DMARC policy is already enforcing, your own mail would be bouncing if signing were broken. Confirm the selector in your mail provider\'s console.'
        : 'No DKIM key found on the selectors we checked. DKIM selectors cannot be discovered from DNS — they can only be guessed — so this is not proof that DKIM is missing. But if you have not deliberately switched DKIM on with your mail provider, it almost certainly is.',
    };
  }

  // Your mail provider signs with its own selector. A key on some other
  // selector does not cover it.
  const expected = PROVIDER_SELECTORS.find(([re]) => provider && re.test(provider));
  if (expected && !found.includes(expected[1])) {
    return {
      status: 'warn',
      selectors: found,
      missingProvider: expected[2],
      detail: `A DKIM key is published (${found.join(', ')}), but not on the "${expected[1]}" selector that ${expected[2]} uses — so your ${expected[2]} mail is not being signed. It still passes today because SPF covers it, but SPF breaks whenever a message is forwarded. With an enforcing DMARC policy, forwarded mail would then be refused outright. Switch DKIM on in your ${expected[2]} admin console.`,
    };
  }

  return {
    status: 'pass',
    selectors: found,
    detail: `DKIM signing key published on: ${found.join(', ')}. Messages are signed, so tampering in transit is detectable.`,
  };
}

export function analyseDmarc(txtRecords) {
  const dmarc = txtRecords.filter((t) => /^v=DMARC1\b/i.test(t));

  if (dmarc.length === 0) {
    return {
      status: 'fail',
      detail:
        'No DMARC record. Receiving servers have no instruction about what to do with forged mail claiming to be from you — so most will deliver it. You also get no reports, meaning spoofing of your domain is invisible to you.',
    };
  }
  if (dmarc.length > 1) {
    return {
      status: 'fail',
      record: dmarc.join(' | '),
      detail: 'More than one DMARC record. This is invalid and receivers will ignore it. Keep exactly one.',
    };
  }

  const record = dmarc[0];
  const policy = (record.match(/\bp\s*=\s*(none|quarantine|reject)/i) || [])[1]?.toLowerCase() || null;
  const pct = parseInt((record.match(/\bpct\s*=\s*(\d+)/i) || [])[1] ?? '100', 10);
  const rua = /\brua\s*=\s*mailto:/i.test(record);

  if (!policy) {
    return { status: 'fail', record, rua, detail: 'DMARC record present but it sets no policy (p=). Without p= it does nothing.' };
  }
  if (policy === 'none') {
    return {
      status: 'warn',
      record,
      policy,
      pct,
      rua,
      detail: rua
        ? 'DMARC is in monitoring mode (p=none). This collects reports but does not stop anyone spoofing your domain. Monitoring is the correct first step — the mistake is stopping here. Once the reports show every real sender passing, move to quarantine, then reject.'
        : 'DMARC is in monitoring mode (p=none) and has no rua= reporting address, so it is neither blocking spoofing nor collecting evidence. Add a rua= address, then work towards reject.',
    };
  }
  if (pct < 100) {
    return {
      status: 'warn',
      record,
      policy,
      pct,
      rua,
      detail: `Policy is p=${policy} but only applied to ${pct}% of mail. The remaining ${100 - pct}% is unprotected. Raise pct to 100 once you are confident.`,
    };
  }
  return {
    status: policy === 'reject' ? 'pass' : 'warn',
    record,
    policy,
    pct,
    rua,
    detail:
      policy === 'reject'
        ? `Policy is p=reject${rua ? ' with reporting enabled' : ''}. Forged mail claiming to be from your domain is refused outright. This is the goal.${rua ? '' : ' Add a rua= address so you can still see who is trying.'}`
        : 'Policy is p=quarantine — forged mail goes to spam rather than being refused. Good progress. Move to p=reject once the reports are clean.',
  };
}

/**
 * DMARC carries the most weight on purpose: SPF and DKIM prove who a message
 * came from, but only DMARC tells receivers to refuse forgeries. A domain with
 * perfect SPF and DKIM and no DMARC is still fully spoofable, and the score
 * should say so.
 */
/* ── Advanced analysers ──────────────────────────────────────────────
 * These are scored separately from the core four. They describe hardening
 * beyond the spoofing question, so a domain that has none of them is not
 * "failing" — it is just ordinary. Never let these drag the main grade down.
 */

export function analyseMtaSts(policyTxt, hasPolicyHost) {
  const rec = policyTxt.find((t) => /^v=STSv1\b/i.test(t));
  if (!rec) {
    return {
      status: 'info',
      present: false,
      detail:
        'No MTA-STS policy. Mail servers delivering to you will use TLS if offered, but will fall back to an unencrypted connection if someone strips it. MTA-STS closes that downgrade. Uncommon outside large organisations — worth having, not a fault.',
    };
  }
  const id = (rec.match(/\bid\s*=\s*([^;\s]+)/i) || [])[1] || null;
  return {
    status: 'pass',
    present: true,
    id,
    policyHost: hasPolicyHost,
    detail: hasPolicyHost
      ? 'MTA-STS is published, so senders are told to require TLS when delivering to you and to refuse a downgraded connection. This is ahead of most organisations.'
      : 'An MTA-STS DNS record exists but the policy host (mta-sts.yourdomain) did not resolve. Senders cannot fetch the policy, so it has no effect until that host serves it over HTTPS.',
  };
}

export function analyseTlsRpt(txt) {
  const rec = txt.find((t) => /^v=TLSRPTv1\b/i.test(t));
  if (!rec) {
    return {
      status: 'info',
      present: false,
      detail:
        'No TLS reporting. You will not be told when another server fails to establish an encrypted connection to you. Pairs with MTA-STS — without it you are enforcing a policy you cannot see failing.',
    };
  }
  return {
    status: 'pass',
    present: true,
    record: rec,
    detail: 'TLS reporting is on. You receive reports when a sender cannot negotiate an encrypted connection to your mail servers.',
  };
}

export function analyseDnssec(ad) {
  return ad
    ? {
        status: 'pass',
        present: true,
        detail: 'DNSSEC is on. Your DNS answers are signed, so an attacker cannot forge a reply that points your mail somewhere else.',
      }
    : {
        status: 'info',
        present: false,
        detail:
          'DNSSEC is not enabled. Without it, a DNS answer for your domain can in principle be forged — including your MX records. Most Kenyan domains do not have it; enabling it at your registrar is usually a single switch.',
      };
}

export function analyseBimi(txt) {
  const rec = txt.find((t) => /^v=BIMI1\b/i.test(t));
  if (!rec) {
    return {
      status: 'info',
      present: false,
      detail:
        'No BIMI record. BIMI shows your logo beside your messages in supporting inboxes, but only once DMARC is at quarantine or reject. It is a branding reward for finishing the authentication work — not a security control.',
    };
  }
  const hasLogo = /\bl\s*=\s*https:/i.test(rec);
  const hasVmc = /\ba\s*=\s*https:/i.test(rec);
  return {
    status: 'pass',
    present: true,
    record: rec,
    detail: `BIMI is published${hasLogo ? ' with a logo' : ' but without a logo URL'}${hasVmc ? ' and a verified mark certificate' : ''}. Gmail requires a VMC to display the logo; most other providers do not.`,
  };
}

export function score(checks) {
  const enforcing = checks.dmarc.status === 'pass' || checks.dmarc.policy === 'quarantine';
  let s = 0;
  let max = 0;

  max += 10;
  if (checks.mx.status === 'pass') s += 10;

  max += 25;
  if (checks.spf.status === 'pass') s += 25;
  else if (checks.spf.status === 'warn') s += 15;

  // Only counted when DKIM was actually probed (advanced mode), so simple and
  // advanced grades stay comparable rather than simple looking better for
  // having asked fewer questions.
  if (checks.dkim) {
    max += 20;
    if (checks.dkim.status === 'pass') s += 20;
    else if (!checks.dkim.selectors?.length && enforcing) {
      // Providers issue unguessable selectors — ZeptoMail and SparkPost use
      // numbers like "28419" or "scph0526". An enforcing DMARC policy is strong
      // evidence signing works: if it did not, the owner's own mail would
      // already be bouncing. Partial credit beats punishing a limit of method.
      s += 10;
    }
  }

  max += 45;
  if (checks.dmarc.status === 'pass') s += 45; // p=reject
  else if (checks.dmarc.status === 'warn') {
    if (checks.dmarc.policy === 'quarantine') s += 30;
    else s += checks.dmarc.rua ? 10 : 5; // p=none, with or without reporting
  }

  return Math.max(0, Math.min(100, Math.round((s / max) * 100)));
}

export function grade(s) {
  if (s >= 90) return 'A';
  if (s >= 80) return 'B';
  if (s >= 62) return 'C';
  if (s >= 45) return 'D';
  return 'F';
}

export function buildFixes(checks) {
  const fixes = [];
  const enforcing = checks.dmarc.status === 'pass' || checks.dmarc.policy === 'quarantine';
  if (checks.mx.status === 'fail') {
    fixes.push({
      priority: 1,
      title: 'Publish MX records',
      detail: 'Point your domain at your mail provider. Until this exists, mail to your domain bounces.',
    });
  }
  if (checks.spf.status !== 'pass') {
    fixes.push({
      priority: checks.spf.status === 'fail' ? 1 : 3,
      title: checks.spf.status === 'fail' ? 'Publish one valid SPF record' : 'Tighten your SPF record',
      detail:
        'List every service that legitimately sends mail as you — your mailbox provider, invoicing tool, newsletter, website forms — in a single TXT record ending in "-all".',
    });
  }
  // Don't nag about DKIM we simply couldn't see on a domain that is already
  // enforcing DMARC — that is a false alarm, and false alarms cost trust.
  // In simple mode DKIM is not probed at all, so there is nothing to say.
  const dkimUndetectable = !checks.dkim?.selectors?.length && enforcing;
  if (checks.dkim && checks.dkim.status !== 'pass' && !dkimUndetectable) {
    fixes.push({
      priority: 2,
      title: checks.dkim.missingProvider
        ? `Switch on DKIM signing in ${checks.dkim.missingProvider}`
        : 'Switch on DKIM signing',
      detail: checks.dkim.missingProvider
        ? `You have a DKIM key published, but not the one ${checks.dkim.missingProvider} signs with. Generate and publish it from the ${checks.dkim.missingProvider} admin console, then start authentication.`
        : "Enable DKIM in your mail provider's admin console and publish the key it gives you. Without it, DMARC cannot pass for forwarded mail.",
    });
  }
  if (checks.dmarc.status !== 'pass') {
    fixes.push({
      priority: checks.dmarc.status === 'fail' ? 1 : 2,
      title:
        checks.dmarc.status === 'fail'
          ? 'Publish a DMARC record at p=none with reporting'
          : 'Move DMARC towards enforcement',
      detail:
        'Start at p=none with a rua= address so nothing legitimate breaks. Read a few weeks of reports, confirm every real sender passes, then move to quarantine and finally reject.',
    });
  }
  return fixes.sort((a, b) => a.priority - b.priority);
}

/* ── Handler ─────────────────────────────────────────────────────────── */

export async function handleCheck(request) {
  const url = new URL(request.url);
  const domain = normaliseDomain(url.searchParams.get('domain'));

  if (!domain) return json({ ok: false, error: 'Please enter a domain name.' }, 400);
  if (!isValidDomain(domain)) {
    return json({ ok: false, error: `"${domain}" does not look like a valid domain name. Try something like yourbusiness.co.ke` }, 400);
  }

  // The default check is the trio everyone knows: SPF, DKIM, DMARC. MX is
  // still resolved — it identifies the mail provider, which is what lets us
  // tell whether that provider's own DKIM selector is missing — but it is
  // reported as context rather than as a fourth check.
  //
  // mode=advanced additionally returns MTA-STS, TLS-RPT, DNSSEC, BIMI, the SPF
  // expansion tree and the raw records. Nothing links to it yet; it is the
  // foundation for the separate technical page.
  const advanced = url.searchParams.get('mode') === 'advanced';

  const [mxRes, txtRes, dmarcRes, ...dkimRes] = await Promise.all([
    dnsQuery(domain, 'MX'),
    dnsQuery(domain, 'TXT'),
    dnsQuery(`_dmarc.${domain}`, 'TXT'),
    ...DKIM_SELECTORS.map((sel) => dnsQuery(`${sel}._domainkey.${domain}`, 'TXT')),
  ]);

  // NXDOMAIN on the domain itself (Status 3 with no MX and no TXT) — the
  // domain is probably not registered or not resolving at all.
  if (mxRes && mxRes.Status === 3 && (!txtRes || txtRes.Status === 3)) {
    return json({ ok: false, error: `${domain} does not resolve. Check the spelling, or the domain may not be registered.` }, 404);
  }

  const mxRecords = (mxRes?.Answer || [])
    .filter((a) => a.type === 15)
    .map((a) => {
      const [pref, ...rest] = String(a.data).trim().split(/\s+/);
      return { priority: Number(pref), host: rest.join(' ').replace(/\.$/, '') };
    })
    .sort((a, b) => a.priority - b.priority);

  const rootTxt = (txtRes?.Answer || []).filter((a) => a.type === 16).map((a) => unquoteTxt(a.data));
  const dmarcTxt = (dmarcRes?.Answer || []).filter((a) => a.type === 16).map((a) => unquoteTxt(a.data));

  // Walk the SPF include tree for the true lookup count. Only worth doing when
  // there is exactly one record to walk.
  const spfRecords = rootTxt.filter((t) => /^v=spf1\b/i.test(t));
  let expansion = null;
  if (spfRecords.length === 1) {
    const resolveTxt = async (name) => {
      const r = await dnsQuery(name, 'TXT');
      return (r?.Answer || []).filter((a) => a.type === 16).map((a) => unquoteTxt(a.data));
    };
    expansion = await expandSpf(spfRecords[0], resolveTxt);
  }

  const txtOf = (r) => (r?.Answer || []).filter((a) => a.type === 16).map((a) => unquoteTxt(a.data));

  const mx = analyseMx(mxRecords);
  const dmarc = analyseDmarc(dmarcTxt);
  const enforcing = dmarc.status === 'pass' || dmarc.policy === 'quarantine';

  const dkimFound = DKIM_SELECTORS.filter((_, i) => {
    const answers = txtOf(dkimRes[i]);
    return answers.some((t) => /v=DKIM1|k=rsa|(^|;)\s*p=[A-Za-z0-9+/]/.test(t));
  });

  const checks = {
    spf: analyseSpf(rootTxt, expansion),
    dkim: analyseDkim(dkimFound, mx.provider, enforcing),
    dmarc,
    mx, // context, not a headline check — surfaced only when broken
  };

  let extra = null;
  if (advanced) {
    const [stsRes, stsHost, tlsRes, bimiRes] = await Promise.all([
      dnsQuery(`_mta-sts.${domain}`, 'TXT'),
      dnsQuery(`mta-sts.${domain}`, 'A'),
      dnsQuery(`_smtp._tls.${domain}`, 'TXT'),
      dnsQuery(`default._bimi.${domain}`, 'TXT'),
    ]);

    extra = {
      mtaSts: analyseMtaSts(txtOf(stsRes), !!(stsHost?.Answer || []).length),
      tlsRpt: analyseTlsRpt(txtOf(tlsRes)),
      // AD = "Authenticated Data": the resolver validated DNSSEC for this answer.
      dnssec: analyseDnssec(!!mxRes?.AD || !!txtRes?.AD),
      bimi: analyseBimi(txtOf(bimiRes)),
      spfExpansion: expansion,
      rawRecords: {
        mx: mxRecords,
        txt: rootTxt,
        dmarc: dmarcTxt,
      },
    };
  }

  const s = score(checks);

  // The headline a business owner actually needs: can a stranger send mail
  // as you right now?
  const spoofable = !(checks.dmarc.status === 'pass' || checks.dmarc.policy === 'quarantine');

  return json({
    ok: true,
    domain,
    mode: advanced ? 'advanced' : 'simple',
    checkedAt: new Date().toISOString(),
    score: s,
    grade: grade(s),
    spoofable,
    provider: mx.provider || null,
    mailConfigured: mx.status === 'pass',
    selectorsProbed: DKIM_SELECTORS.length,
    checks,
    advanced: extra,
    fixes: buildFixes(checks),
  });
}
