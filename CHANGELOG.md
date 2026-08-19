# Changelog

CURRENT VERSION: v4.34.0 — 1611hrs:19th August2026

## v4.34.0 — 1611hrs:19th August2026

Meta descriptions trimmed to match the pages, and a broken sentence found
while doing it.

**The broken sentence.** `/scan` opened "Onduu reads the public records.
Registry, DNS, email and your homepage, and reports what anyone on the
internet can already observe" — a fragment with no subject. It is another
casualty of the v4.25.0 dash removal: the aside wrapped across two source
lines, so the pairing rule did not see it and each dash was converted on
its own. It reads "the public records (registry, DNS, email and your
homepage) and reports…" again.

Two earlier sweeps missed this because both worked line by line. A
whole-file sweep against the pre-removal sources found six multi-line
asides in total: this one, two already repaired by hand, one that reads
correctly as two sentences, and two inside code comments, which the
removal never touched. All six are now accounted for.

**Descriptions**, each cut to what its page now claims and to a length
that survives a search result:

- `/kedomains` 145 to 156 chars, dropping "free, no signup, no account"
  and picking up the twin-ownership point the lede actually makes.
- `/dns` 164 to 160, dropping "in plain English" and "no signup".
- `/email-security` 148 to 122, same two removals.
- `/scan` 212 to 157. Nothing on that page contradicted it, but 212
  characters is cut off in a result listing, so it was losing its ending.

174 tests pass; lint clean.


## v4.33.0 — 1557hrs:19th August2026

The result status now reads first. It sat right-aligned at the far end of
the row, so "TAKEN" or "APPEARS AVAILABLE" was the last thing a visitor
saw rather than the first.

CSS only, no component changes: all four tools already share the same
`check-row-head` markup, so one rule moves the badge left on
`/kedomains`, `/dns`, `/email-security` and `/scan` at once. The move uses
`order` rather than reordering the DOM, so the heading is still what a
screen reader meets first.

The badge is also more prominent: larger text, thicker border, and a
tinted background per status instead of an outline alone.

Two things came out of measuring rather than eyeballing:

- With badges sized to their text, the headings started at different
  x-positions ("TAKEN" is 115px wide, "APPEARS AVAILABLE" 155px), so the
  rows looked ragged. A 15.5em minimum turns the status into a proper
  column and the headings line up at a single left edge.
- That fixed column then forced headings onto their own line on a phone,
  where the width is not available to spare. Below 760px the minimum is
  dropped and badges size to their text again.

Verified on real lookups: zero.co.ke and zero.ke on `/kedomains`
(headings aligned at 290px), and an 11-finding kenic.or.ke report on
`/dns`, at 1280x800 and 375x812, with no horizontal overflow at either.
174 tests pass.


## v4.32.0 — 1547hrs:19th August2026

Four changes on `/kedomains`, as instructed.

- **An unlocked domain now says what to do about it.** "TRANSFER LOCK:
  OFF." is followed by "Log into your registrar panel and lock it. It is
  the main defence against domain theft." Previously the tool reported the
  weakness and left the reader to work out the fix.
- The reserved-name limitation line ("Reported by the registry itself…")
  is deleted.
- The idle form microcopy ("Checks the extension you enter") is removed.
  The element stays in the DOM as the aria-live region that announces
  "Reading public DNS and registry records…".
- The lede drops its closing sentence about registrar, lock and expiry.

**One wording change from the instruction, flagged for the owner.** The
guidance was given as "It prevents theft". A transfer lock blocks an
unauthorised transfer, which is the usual route for domain theft, but it
does not prevent theft through a compromised registrar account, so
"prevents" would be a guarantee the tool cannot make, and CLAUDE.md
forbids promising guaranteed security. It reads "It is the main defence
against domain theft" instead, which keeps the point and stays true. Say
the word if the original wording is preferred.

Verified against a live lookup of safaricom.co.ke and safaricom.ke: both
report the lock off and now carry the guidance. 174 tests pass.


## v4.31.1 — 1523hrs:19th August2026

The storage disclosure returns to both tool pages as one sentence, closing
the gap opened by the v4.30.1 and v4.31.0 trims: "The domain checked and
the result are kept; nothing about you is."

It sits at the end of section 01 on `/email-security` and `/dns`, which is
where the longer version used to be. Both halves of the original statement
survive, what is kept and what is not, in a form short enough not to
reintroduce the bulk the owner removed. The v4.9.x decision that the
privacy notice and both tool pages disclose the storage holds again.

174 tests pass; lint clean.


## v4.31.0 — 1512hrs:19th August2026

Three copy trims on `/dns`, as instructed.

- Lede: "This reads the public DNS and registry records that decide whether
  your website and email work reliably." The "Enter your domain" opener,
  the bracketed list and the "in plain English" clause are gone.
- Form microcopy: removed. The element stays in the DOM because it is the
  aria-live region that announces "Querying public DNS and the registry…",
  but it now shows nothing when idle.
- Section 01: keeps the first comparison only, and no longer mentions RDAP.

As on `/email-security` in v4.30.1, the deleted section-01 text carried the
storage disclosure. It is still stated in `/legal/privacy` §04 and
`/legal/tool-limitations` §04, both linked from this page's footer.

**Correction to v4.29.2.** That entry claimed the flaky fixture was fixed.
It was not: the SCAN_ENABLED gate test failed again afterwards, under load.
The two races fixed there were real, but they were not the cause.

The cause is now better understood, and it was never the flag.
`SCAN_ENABLED` appears in neither `.dev.vars` nor the built config, and the
route treats anything other than the string "true" as off, so the endpoint
would 404 even if `--var` never applied. The non-404 must therefore be the
worker answering while still settling. Readiness now requires two
successful probes 250ms apart rather than one, and the assertion reports
the status and body it actually received, so the next occurrence explains
itself instead of needing to be reproduced.

Honest limit: the flake appears roughly once in ten full-suite runs and
only under load. Twelve clean runs followed this change, which is not proof.

174 tests pass; lint clean.


## v4.30.1 — 1502hrs:19th August2026

Three copy trims on `/email-security`, as instructed.

- Lede: drops "and tells you, in plain English, what to fix" and now ends
  "…using your domain."
- Form microcopy: "This reads published DNS records only." (the account and
  password reassurance is gone).
- Section 01: keeps the first two sentences and drops the rest.

**One consequence worth recording.** The deleted section-01 text carried
the storage disclosure: "The domain checked and the result are kept so
Onduu can see which checks are run and which failures are common; nothing
about you is recorded with them." That sentence was added in v4.9.x
specifically because storage began then, and the decision at the time was
that the privacy notice **and both tool pages** would say so. The tool
page no longer does.

The disclosure itself is not lost: `/legal/privacy` §04 and
`/legal/tool-limitations` §01 both still state that the domain and result
are stored, and the footer on this page links to both. So the statement
remains one click away rather than in front of the visitor. Flagged for
the owner in case a shorter line is wanted back on the page.

174 tests pass; lint clean.


## v4.30.0 — 1447hrs:19th August2026

The last two gated pages are removed on the owner's instruction, so
nothing on the site is now "reachable but hidden".

- **Managed Website Operations** described a service that was never
  staffed, priced or contracted. It 301s to
  `/paths/website-and-digital-marketing`, since ongoing website work is
  now an independent-provider route.
- **Results** promised case evidence that does not exist yet. It 301s to
  `/insights`, which is where published evidence actually lives.

Retired the same way as `/labs` and the managed service terms: content
deleted, routes added to `REMOVED_ROUTES` so they leave the page table and
the sitemap, and a redirect each. `GATED_ROUTES` is now empty. The gating
mechanism itself is kept, so a future page can be gated without rebuilding
it.

That left four tests looping over an empty set and therefore asserting
nothing, which is worse than no test. A new test now states the real
expectation: the set is empty, and all three retired routes are absent
from the sitemap and unlinked. If a route is gated again, the existing
loops resume doing their job.

174 tests pass. Verified on the build: all four retired routes
(`/labs`, `/legal/managed-service-terms`, `/managed-website-operations`,
`/results`) 301 to live successors, none appear in the sitemap, and
robots.txt is unaffected.


## v4.29.2 — 1430hrs:19th August2026

The flaky test fixture is fixed. Two tests failed once each today and
passed on re-run ("robots disallows the dashboard", and the SCAN_ENABLED
launch gate). Both use `tests/helpers/server.mjs`, so the race was in the
harness, not in either assertion.

Two defects, both in how a worker was claimed:

1. **The port was picked at random with no check that it was free.** Test
   files run in parallel, each spawning its own `wrangler dev`, so two
   processes could choose the same port.
2. **Readiness was "GET /robots.txt returned ok" on that port, from any
   server at all.** The process that lost the bind could therefore adopt
   the winner's worker. That is exactly how a file spawning with
   `--var SCAN_ENABLED:false` could end up asserting against a worker
   started without it, and see `/api/scan` answer instead of 404 — the
   failure observed.

Now the port comes from the OS (bind to :0, read the assigned number,
release it), and readiness additionally requires this child's own log to
name that port, which only happens when this child is the one serving it.
A bind conflict is detected from the log and abandoned immediately instead
of waiting out a 60-second deadline. Concurrent callers in one process
share a single spawn, so a `fetchPath()` racing a `startWorker([...])` can
no longer start a second, differently configured worker.

Verified: 8 consecutive full runs, 173/173 each. The failure path was
tested too — pointed at a missing config, the helper now fails in about 6
seconds with the log tail rather than hanging. No site behaviour changed.


## v4.29.1 — 1425hrs:19th August2026

"The introduction, plainly." becomes "The introduction." on
`/paths/website-and-digital-marketing`, matching the change made to its
sibling heading on the infrastructure path in v4.29.0. No "plainly"
headings remain anywhere. 173 tests pass.


## v4.29.0 — 1418hrs:19th August2026

`/legal/managed-service-terms` removed on the owner's instruction. The
managed service was never contracted or priced, so terms for it had no
business being reachable, even behind noindex.

Retired the same way as `/labs`: the content is deleted from both the
brief and prototype layers, the route joins `REMOVED_ROUTES` so it leaves
the page table and the sitemap, it drops out of `GATED_ROUTES`, and
`/legal/managed-service-terms` now 301s to `/legal/assessment-terms`,
which is the terms document that does exist. Two gated routes remain
(`managed-website-operations` and `results`).

Also on `/paths/hostafrica-infrastructure`, the section heading "The
boundary, plainly." becomes "The boundary."

The sibling heading on the implementation path, "The introduction,
plainly.", was left as it is, since the instruction named only the
boundary one. Say the word if it should match.

173 tests pass; the redirect and the absent sitemap entry are covered by
the existing route tests.


## v4.28.1 — 1359hrs:19th August2026

Internal bookkeeping removed from a public page, spotted by the owner. The
disclosure note on `/paths/hostafrica-infrastructure` opened with
"Destination approved by the owner on 18 August 2026 (docs/strategy/
decision log in CHANGELOG v4.1.0)" — a repository path and a version
number, which mean nothing to a visitor and read as an internal ticket. The
note now begins at the sentence that is actually for the reader: "Product
information, ordering, billing, provisioning, renewal and support all
happen at HOSTAFRICA." The approval itself stays recorded where it
belongs, in this changelog at v4.1.0.

Swept the rest of the site for the same problem. One other instance exists
in `site-data.ts` ("Biography facts, dates, titles and relationship
wording are an owner approval gate") but it never renders: the strategy
layer overrides that About entry, so it is dead prototype copy. No page
now shows a CHANGELOG version, a docs/ path, an internal decision log or
an approval date.

Deliberately left: the "PREVIEW / APPROVAL GATE" banner on
`/legal/managed-service-terms`. That page is noindex, out of the nav and
sitemap, and the banner is the point of it. 173 tests pass.


## v4.28.0 — 1331hrs:19th August2026

Three owner-requested changes.

About moves out of the primary navigation and into the footer, in the
Start column beside Contact. The header is now Readiness, How it works,
Paths, Guides, plus the readiness CTA. The page itself is unchanged and
still indexed and in the sitemap; only its promotion changed.

On `/paths/hostafrica-infrastructure` the title drops its second sentence,
from "HOSTAFRICA supplies the products. Onduu explains the decisions." to
"HOSTAFRICA supplies the products.", and the lede's closing sentence
("Onduu helps you understand which product fits which workload, and what
responsibility comes with it.") is deleted. The lede now ends on the
factual statement that HOSTAFRICA provides, bills and supports the
products. The disclosure section and the boundary list below are
untouched, so who-does-what is still stated on the page.

173 tests pass; lint clean.

**Flaky test, second sighting:** "without SCAN_ENABLED the endpoint is
indistinguishable from a missing route" failed once then passed on two
clean re-runs, the same way "robots disallows the dashboard" did earlier
today. Both use the `startWorker`/`fetchPath` fixture, so the race is in
worker startup rather than in either assertion. Worth hardening.


## v4.27.0 — 1315hrs:19th August2026

Hero spacing evened out sitewide, on the owner's instruction after
spotting it on /kedomains.

Measured before changing anything: the eyebrow sat **10px** above the
headline while the paragraph floated **45px** below it, a 1:4.5 split. The
box margins were all zero, so the gaps were coming entirely from Georgia's
internal leading. The headline was wedged against its own kicker and
adrift from the sentence it introduces.

Two rules now govern all three hero types (`.page-hero` for content and
tool pages, `.hero-copy` on the homepage, `.article-head` on insights):
6px below the eyebrow and 14px above the lede. Measured after: 16px above
and 27px below on content and tool pages, 29/29 on the homepage, 26/30 on
articles. The kicker still reads as attached to the headline, which is the
point of a kicker, but the block no longer looks broken in the middle.

Affected: 35 pages. The homepage, four tool pages, eighteen standard
content pages (paths, guides, legal, readiness, contact, about,
how-it-works, insights index) and twelve articles.

The homepage hero CTA is still above the fold. 173 tests pass; lint clean.


## v4.26.1 — 1317hrs:19th August2026

One sentence repaired on /kedomains, spotted by the owner: "checks it
together with its .ke twin. because owning one..." — a full stop followed
by lowercase "because". A casualty of the v4.25.0 dash removal: the source
had the dash at the end of a wrapped line, the replacer did not read past
the newline, so it chose a period and could not capitalise what it could
not see. Now a comma, which is what the sentence always wanted.

Swept the whole codebase for the same signature (period, line break,
lowercase letter): this was the only instance. 173 tests pass.


## v4.26.0 — 1303hrs:19th August2026

`/scan` now checks that a domain exists before scoring it (owner report:
example.ke, which is not registered, came back as 0/100 at 4% coverage).

A zero on a domain that does not exist reads as "this domain is terrible"
rather than "this domain is not there", and it breaks the scan's own rule
that missing evidence is never counted as a failure. The same flaw applied
to reserved names.

The pre-flight runs before collection, and DNS alone cannot decide it: a
registered domain with no nameservers also returns NXDOMAIN. So when DNS
is empty, the registry is asked over RDAP:

- Not registered: refused with "there is nothing to scan yet" and a link
  to the domain search, which is what the visitor actually needs. Nothing
  is scored, nothing is stored.
- Reserved: refused, quoting the registry's own reason.
- Registered but not resolving: scanned as normal, because there is a
  registration to observe and low coverage is then the honest answer.
- Registry unreachable: says so, rather than scoring an absence.

Verified against live DNS and KeNIC: example.ke and simba.ke are refused
in about a second each, and onduu.ke still scans normally (98/100 at 100%
coverage). The scan form renders the suggested next step as a link. Spec
§2a records the behaviour; three tests cover the outcomes. 173 tests pass.


## v4.25.1 — 1246hrs:19th August2026

Findings from reading the paths pages and privacy notice after the dash
removal, as promised.

One regression from that pass, now fixed. In the privacy notice the scan
paragraph had a long aside ("a domain — its registry record, DNS,
published email records, and the homepage, robots.txt and sitemap that
any visitor can request — and returns a Public Signal Score"). The aside
was longer than the pairing rule's limit, so both dashes became separate
commas and the list blurred into the sentence. It is parentheses now. A
diff sweep confirmed this was the only aside affected.

Two directory-era labels found while reading, unrelated to the dashes.
The 19 August brief §12 replaced the public-directory model, and v4.17.0
updated the links and section copy, but two internal labels survived
because that pass searched for the external ujiajiri.ke/partners URL
rather than link text:

- The final CTA on every standard page, and the homepage, offered "Find
  an Implementation Partner". It links to the paths page, which now
  describes private introductions, so the label promised browsing that no
  longer exists. It reads "See the implementation path".
- The footer's "Choose a Path" column listed "Ujiajiri Partners", now
  "Ujiajiri Introductions".

The rest of both pages reads correctly: the paths copy, the referral-fee
disclosure, the consent step and the privacy notice's tool sections all
survived the punctuation change intact. 170 tests pass; lint clean.


## v4.25.0 — 1229hrs:19th August2026

Em and en dashes removed from all visible copy, on the owner's
instruction, completing the humanizer pass. 206 automated replacements
plus nine hand-written fixes; zero dashes remain in any rendered page,
verified across twelve page types and an article.

Each dash resolved by what followed it rather than by a blanket
substitution: a full stop where an independent clause followed, a comma
for a trailing fragment, a colon for a term and its definition
("Nameservers: how many answer"), parentheses for an aside that already
contained commas, "to" for numeric ranges in the DNS advice strings, and
a middot for the two decorative markers in the homepage method list. Code
comments were left alone; they are not site copy.

Getting there took two passes. The first was reverted, and the failures
are worth recording because they are the traps in this kind of edit:

- URLs contain "//", so the inline-comment detector skipped every line
  holding a link, silently leaving those dashes in place.
- Pairing logic matched an opening dash in one list item with the dash in
  the *next* item, producing unbalanced parentheses across two `<li>`
  elements ("Nameservers ( how many answer" / "Delegation ) registry
  record").
- Asides that wrap across source lines had only their closing dash
  converted, orphaning the verb: "The causes. A stale delegation... Are
  visible in public records."
- A comma before an imperative link produced a splice ("delivery
  partners, explore the Ujiajiri youth pathway").

All four were found by reading the output rather than trusting the script,
and every category of change was reviewed by hand afterwards. 170 tests
pass; lint clean.


## v4.24.0 — 1213hrs:19th August2026

Two article opening sentences rewritten to drop "In today's digital age",
on the owner's explicit approval. Both were first lines, which is where a
filler opener costs the most credibility.

- *Startup founders — securing your digital identity*: "In today's digital
  age, a SME's online presence is as crucial as its physical operations."
  becomes "An SME's online presence now matters as much as its physical
  operations." The following sentence already says "Kenyan", so this one
  no longer repeats it, and the a/an agreement is fixed.
- *Top 10 items every business owner must know about their domain*: "In
  today's digital age, your business's domain name is not just an address;
  it's a critical asset." becomes "Your domain name is one of your
  business's most important assets." This also removes a second tell (the
  "not just X; it's Y" construction). The existing next sentence already
  made the point my first draft would have duplicated, so only the opener
  changed.

No claims were added or removed; both paragraphs keep their meaning.
The remaining mild words ("crucial" x4, "leverage" x3) sit mid-paragraph
where they cost nothing, and were deliberately left.

**Rule note:** CLAUDE.md says article prose is regenerated, never
hand-edited. There is no regeneration script in the repo, and the owner
approved these two edits directly after seeing the exact wording. Recorded
here so the exception is visible rather than silent. 170 tests pass.


## v4.23.2 — 1148hrs:19th August2026

Ran the humanizer pass (Wikipedia "Signs of AI writing") over the site
copy. The page copy came back essentially clean: zero AI-vocabulary hits
across `site-data.ts`, `pages-brief.ts`, `pages-strategy.ts` and the page
components. Three real tells were found in tool microcopy and fixed.

The three were subjectless tailing negations (pattern 9 and 13), which
read as clipped ad copy rather than a sentence:

- `/email-security`: "Reads published DNS only. No signup, no credentials,
  nothing private." becomes "This reads published DNS records only. You
  need no account, and it never asks for a password."
- `/dns`: "No signup, nothing private." becomes "You need no account to
  run it."
- `/scan`: "Nothing private is touched and no login is asked for." was
  also passive; it becomes "It touches nothing private and never asks you
  to log in."

Left alone deliberately: meta descriptions, where clipped fragments are
idiomatic in search snippets; all copy taken verbatim from the approved
strategy documents; and the legal drafts, where rewording changes meaning
before professional review.

Two findings for the owner rather than edits, recorded in ROADMAP Phase 5:
every AI-vocabulary tell in the repo (crucial x5, leverage x3, "in today's
digital age" x2) sits in the 12 published articles in `insights-data.ts`,
which CLAUDE.md says must be regenerated rather than hand-edited; and the
em dash question, below.

**The em dash decision is the owner's.** The copy uses 156 of them, and
the humanizer treats them as a hard tell to remove. Its own voice-matching
rule says an author's sample overrides that, and here the sample is the
approved strategy copy, which uses them deliberately. Stripping them would
be a large diff against text the owner approved, so nothing was changed.
170 tests pass; lint clean.


## v4.23.1 — 1124hrs:19th August2026

Reserved-name copy tightened on the owner's instruction. The explanation
is now simply **"Not registered"**, and the quoted registry note drops its
heading and internal policy code — "Prohibited String - Domain Cannot Be
Registered — This domain is not allowed under registry policy (2306)"
becomes "This domain is not allowed under registry policy". Trimmed in the
worker, so the stored value matches what is shown. The RESERVED badge, the
absent register link and the limitation line are unchanged.


## v4.23.0 — 1116hrs:19th August2026

Two accuracy bugs found from a live report: `/kedomains` said **simba.ke
was REGISTERED and TAKEN**. It is neither — KeNIC holds it back as a
reserved string.

**Reserved names were read as registrations.** KeNIC answers RDAP with
HTTP 200 and a real object for prohibited strings, but that object carries
no handle, no events and no entities — only a notice ("Prohibited String -
Domain Cannot Be Registered… not allowed under registry policy (2306)")
and a RESTRICTED_REGISTRATION relation. `checkDomain` treated any parseable
200 as proof of registration, so the tool claimed the name was owned while
DNS was returning NXDOMAIN. There is now a third state: **reserved** —
not registered, not available, with the registry's own words quoted and no
"register it" link offered for a name nobody can register.

**"TRANSFER LOCK: OFF" was being fabricated.** `locked` was computed as
`eppStatuses.some(...)`, so a registry publishing no status codes produced
`false`, and the page stated in red that the lock was off. Absence of
evidence rendered as a definite negative — the exact thing the tool
limitations page promises these tools do not do. `eppStatuses` is now
`undefined` rather than `[]` when nothing was published, `locked` is
tri-state, and the UI says the lock cannot be observed either way.

**The same flaw was scoring a FAIL inside `/scan`.** Its transfer-lock
guard read `!obs.rdap.eppStatuses`, and an empty array is truthy — so a
domain whose registry publishes no status codes fell through and was
scored `fail` on Control with "none published". That breaks instant-scan
rule 2 (missing evidence is never a pass or a failure); it is now
`unobservable`, as the spec always required.

170 tests pass, including fixtures for a reserved string and for a
registration with no published status codes. Verified against live KeNIC
RDAP: simba.ke reports reserved with the policy note; simba.co.ke and
safaricom.co.ke still report registered, and their locks are real
observations because those records do publish status codes.


## v4.22.0 — 0943hrs:19th August2026

Tool-first heroes, and a sitewide reduction in display type (owner
request: "the text are too imposing… the tool itself is hidden").

**The defect.** On a 1280x800 laptop the fold fell just below the "DOMAIN
NAME" label on all four tool pages: a visitor who clicked through to run a
check arrived at an essay and had to scroll to find the input. The hero
was spending the whole first viewport on a 90px headline, 90px of padding
and a decorative right-hand index listing what the results would show.

**Tool pages** (`/dns`, `/email-security`, `/scan`, `/kedomains`) now use a
`page-hero--tool` variant: single column, headline capped at 44px, tighter
padding, no bottom border, and the decorative index removed — the results
are their own index. The form section follows immediately, so headline,
lede, input, button and the "public records only, no signup" line all sit
in the first viewport. Verified: input top 477px and button bottom 533px
at 1280x800 (was below 800px entirely); at 375x812 both are visible with
no horizontal overflow.

**Sitewide** the display scale comes down roughly a third at the top end,
keeping the Georgia editorial character without shouting: page-hero h1
90→56px, homepage h1 96→64px, section h2s 68-80→46-52px, article h1
74→52px, with hero and section padding reduced to match. The homepage hero
now fits headline, lede, both CTAs and the whole sample scorecard above
the fold.

Content pages keep their editorial hero and index column — only the tool
pages hand the first screen to the tool. 168 tests pass; lint clean.

One cascade note for future work: `.page-hero--tool` rules share
specificity with the `.page-hero` rules they override, so they live at the
end of `site.css` deliberately. Moving them earlier silently restores the
old type sizes — which is exactly what happened on the first attempt here.


## v4.21.0 — 0757hrs:19th August2026

Legal pages re-aligned with what the site actually does (ROADMAP Phase 3).
Behaviour descriptions only: **no draft marking was lifted and no TO
CONFIRM item was answered** — those remain the owner's and a professional
reviewer's to settle.

**A real defect found and fixed.** The privacy notice claimed "Cloudflare
Web Analytics runs on every visit". It does not: no beacon is served on
any page, and the content-security policy (self + Turnstile + YouTube)
would refuse one if it were. The notice now states plainly that no
analytics script runs in the browser and that page views are counted
server-side. A test had been pinning the false sentence in place; it now
asserts the opposite.

**Privacy notice → draft 0.2.** The DNS health check was missing entirely;
§04 now describes what `/dns` reads, that it asks parent and authoritative
nameservers standard read-only questions directly, that those servers see
Onduu's infrastructure and nothing about the visitor, and that the domain
and outcome are stored under the existing deletion route. The processors
section drops the analytics line and names the registries and nameservers
the tools contact.

**Commercial relationships → draft 0.2.** The page said Onduu receives "no
commission, fee, revenue share or other benefit" from any supplier. That
is no longer true for implementation: Ujiajiri may receive a referral fee
from an introduced provider, and Ujiajiri Enterprises Limited is the same
company that operates Onduu — now stated in those terms, with the amount
deliberately unpublished and the provider's duty to explain price impact
named. The infrastructure no-commission statement stands, since it remains
accurate. Provider-directory language replaced with the introduction
model, and "what Onduu contracts for" corrected: the assessment and the
free tools, not website delivery, managed operations or agent pilots.

**Tool limitations.** A fourth section covers `/dns` — one vantage point,
not a propagation checker, DNSSEC detected not validated, reverse DNS
partial, and the honest note that Cloudflare-hosted nameservers and some
parent servers cannot be questioned from this site's infrastructure, which
reports as not-observed rather than as a failure.

168 tests pass, including two new ones that pin every live tool's presence
in tool limitations and hold the legal pages to observed behaviour. Lint
clean; all three pages verified rendered on the production build.

## v4.20.0 — 0742hrs:19th August2026

`/labs` removed on the owner's instruction. The page described six manual
tests (Developer Disappeared Test, Invisible Lead Leak Review, Restore
Don't Assume, Kenyan Data Journey Map, Brand Consistency Review, Agent
Readiness Workshop) that were never staffed or contracted; the free tools
and the guides now cover that ground honestly.

- Page content deleted from `site-data.ts`; `labs` added to
  `REMOVED_ROUTES`, so it leaves the page table and the sitemap.
- `/labs` 301s to `/guides` (middleware), keeping inbound links alive.
- Footer "Labs" link removed from the Learn column; the homepage's
  "Explore Guides and Labs" now reads "Explore the Guides".
- New test asserts the route redirects, is absent from the sitemap, and is
  advertised nowhere. 167 tests pass; lint clean; verified on the
  production build (301 → /guides, zero references, /guides still 200).

## v4.19.2 — 0732hrs:19th August2026

The introduction routing is live: `feat/introduction-routing` (v4.17.0,
below in sequence) merged on the owner's instruction after
`ujiajiri.ke/request-an-introduction/` was verified live (HTTP 200, form
present). Every implementation CTA on onduu.ke now routes to Ujiajiri's
private curated introductions. Merge-only release; the change itself is
described in the v4.17.0 entry.

## v4.19.1 — 0718hrs:19th August2026
Docs only: spec §3 records the Phase 2 vantage limits verified from the
production edge. Cloudflare-hosted nameservers cannot be TCP-probed from
a Worker (platform restriction — serials degrade to "not probed" for
Cloudflare-DNS zones), and KeNIC's parent servers do not answer TCP/53
from the edge (parent/glue works for gTLD parents, degrades for .ke).
Production-verified working: gTLD parent referrals with full glue
(hostafrica.com via a.gtld-servers.net) and per-server serial agreement
on non-Cloudflare nameservers — isaca.or.ke's four servers report serial
2026081815, exactly matching the LeafDNS reference report that motivated
the feature. No site behaviour changed.

## v4.19.0 — 0716hrs:19th August2026

`/dns` Phase 2: true parent-side delegation, glue records and per-server
consistency — the LeafDNS capabilities that recursive DNS cannot see.
Owner-approved ("approve phase 2"); spec §3 amended with the design and
safety envelope.

- New `worker/dns-wire.ts`: a minimal RFC 1035 codec (non-recursive query
  encoding; A/AAAA/NS/SOA parsing with loop-guarded name decompression).
- New `worker/dns-tcp.ts`: one DNS question over TCP port 53 via Workers
  `cloudflare:sockets` `connect()` with RFC 7766 framing — only to
  DoH-resolved, SSRF-validated public IPs, only port 53, one question per
  connection, 3.5s timeout, budget-counted.
- Three new probe groups: a parent-zone nameserver asked non-recursively
  for the delegation (authority = parent NS set, additional = glue);
  glue compared against each nameserver's current addresses (stale only
  when the sets share no address — anycast multi-IP sets are not false
  positives); each answering nameserver (≤4) asked for SOA so zone
  serials are compared (`SOA_SYNC`/`SOA_SYNC_MISMATCH`).
- New findings: PARENT_DELEGATION_MATCH/MISMATCH, GLUE_OK/GLUE_STALE,
  SOA_SYNC/_MISMATCH, PARENT_UNOBSERVABLE (a blocked probe degrades to an
  observation, never a failure).
- UI: the "Parent & registry" block leads with the parent's own referral
  table (nameserver, TTL, glue address — the LeafDNS "Parent NS Tests"
  view), the SOA block gains a serial-per-server table, and the diagram's
  top node becomes the parent zone when observed.
- Budget now 55 subrequests / 18s.

Verified: 166 tests pass (12 new: wire codec round-trip with compression
pointers and loop-guard, parent mismatch, stale vs anycast glue, serial
disagreement, graceful degradation); live against real servers from the
local build — hostafrica.com's `.com` referral from a.gtld-servers.net
with full glue (PARENT_DELEGATION_MATCH, GLUE_OK, SOA_SYNC all pass;
an anycast false-stale caught and fixed during verification), and real
TCP SOA probes to Cloudflare nameservers agreeing on serials. Known
limit: KeNIC's parent servers did not answer TCP from the local vantage
(degrades to "not probed this run"); to re-verify from the production
edge after deploy.

## v4.18.0 — 0702hrs:19th August2026

`/dns` Phase 1: LeafDNS-style graphical results (owner request, spec §3/§6
amended — "build phase 1").

- Results are now grouped into six category blocks — Registry & delegation,
  Nameservers, Zone record (SOA), Web addresses, Mail, DNSSEC — each with
  its own status counts, data table and findings.
- New data behind the tables, still recursive DoH only: each nameserver's
  own addresses, the full SOA field table with RFC 1912-style advice lines
  (advice, never findings), MX hosts resolved with reverse-DNS (PTR)
  checks on their addresses, and registry-only nameservers shown as "not
  answering".
- Two findings joined the rule set: NS_HOST_UNRESOLVED (a published
  nameserver name that doesn't resolve, advisory) and MX_PTR_OK/MISSING
  (mail reverse-DNS hygiene, advisory).
- An SVG delegation diagram sits above the blocks: registry → nameservers
  (with IPs) → apex/www/mail, every node and edge coloured by status, so a
  registry/live mismatch reads as a broken path. Scrolls sideways on
  mobile instead of breaking the page.
- Budget raised to ≤45 subrequests/15s for the table round (≤6 NS hosts,
  ≤3 MX hosts, ≤4 PTRs). Parent-side glue and per-server consistency
  remain the Phase 2 owner gate (DNS-over-TCP), recorded in the spec.

Verified: 159 tests pass (five new: detail payload, registry-only NS,
missing PTR, dead NS name, SOA advice); lint clean; live check of
kenic.or.ke on the production build renders all six blocks, five tables
and the diagram, with real registry data, Outlook PTR names and no
horizontal overflow.

## v4.17.0 — 0641hrs:19th August2026 — merged 0732hrs:19th August2026 (v4.19.2)

Onduu's side of the 19 August developer brief (private curated
introductions): every implementation route now describes Ujiajiri's
introduction model instead of the retired public directory.

- Paths hub card, `/paths/website-and-digital-marketing` (intro, "how it
  works" list rewritten to the §2 business rules, "THE DIRECTORY" section
  replaced by "THE INTRODUCTION" carrying the brief's recommended wording
  and the no-guarantee/worldwide-scope sentence), `/readiness` after-score
  section, `/contact` implementation card, homepage status paragraph.
- All links now target `https://ujiajiri.ke/request-an-introduction/` with
  the label "Request an Implementation Introduction"; no
  `ujiajiri.ke/partners/` link remains anywhere (published articles never
  linked it).
- Disclosure updated per §2/§9: the possible referral fee's existence is
  stated at the decision point, its amount is not, and the provider's duty
  to explain price impact is named. The "no automatic transfer of
  assessment answers" promise is retained on /readiness.
- The cross-link test suite now pins the new model: introduction URL and
  label present, consent step stated, fee disclosed without an amount,
  directory links banned, youth-page link and plain-URL rules unchanged.
  154 tests pass; lint clean; copy verified on the production build.

Held unmerged until the owner approved the wording and the ujiajiri.ke
route went live; both confirmed and merged 19 August 2026 (v4.19.2).

## v4.16.3 — 0650hrs:19th August2026

Two owner-requested dashboard improvements on `/go`:

- The overview's sections table gained a right-hand **"Client-facing
  page"** column linking each dashboard section to the public page it
  describes (readiness/contact for enquiries, /scan, /email-security,
  /dns, /kedomains, the whole site for analytics, the infrastructure path
  for routed clicks, tool-limitations for the opt-out list). The same
  link appears in each tool section's header line. Links open in a new
  tab.
- The dashboard pages now declare the site favicon — their minimal head
  never did, so `/go` tabs showed a blank icon while the rest of the site
  showed the Dial.

Verified on the production build locally: overview and section links
render, favicon declared, and every `/go` route still refuses with 403
without Cloudflare Access headers (154 tests pass).

## v4.16.2 — 0636hrs:19th August2026

Docs only: ROADMAP.md brought back in line with what actually shipped on
18 August. The "Current website state" section now describes the Astro
v4.16.x site with its four tools instead of the retired vinext v2.10.2
build; Phase 2 moves from `blocked` to `in progress` (strategy documents
filed, HOSTAFRICA destination decided, parts already delivered in v4.0.0);
Phase 4 records the DNS Health Check as shipped and launched, and gains
the two open items (fourth-tool article decision, shareable DNS result
IDs); the stale "instant scanner stays out of production" wording and the
gated-list entry are corrected to reflect the 18 Aug launches; the owner
decisions table marks the strategy documents supplied, the Astro merge,
scan spec/launch and DNS check as decided, and adds the two new
outstanding rows. No site behaviour changed.

## v4.16.1 — 2248hrs:18th August2026

Dashboard aggregation for the DNS Health Check (the follow-up recorded in
v4.16.0): `/go/dns` renders the same `toolUsage` view as the other lookup
tools — checks all-time/30-day/7-day, distinct domains, page visits, most
checked, recent checks with summaries, daily trend. Added to the dashboard
nav and the overview section table. The fail-closed Access test now covers
`/go/dns`. Verified locally against the production build: renders with the
logged rows, refuses 403 without Access headers.

## v4.16.0 — 2236hrs:18th August2026

The DNS Health Check is built at `/dns` (spec: `docs/specs/dns-check.md`,
owner-approved). Launch-gated: page and `/api/dns` both 404 until the
`DNS_CHECK_ENABLED` production secret is set to "true" — the same
kill-switch semantics as the scan. **Not yet launched: the secret is not
set in production.**

What it does: eight deterministic findings over public DNS and registry
records — nameserver count, registry-vs-live delegation (KeNIC/registry
RDAP compared with DoH answers; Workers cannot query port 53, so RDAP is
the registry side), provider diversity as an observation, SOA coherence,
apex and www resolution, MX presence (depth routed to `/email-security`),
and DNSSEC adoption (detection, not validation). No numeric score — counts
only, so nothing competes with the Public Signal Score. Severity words are
OK / ADVISORY / ATTENTION / OBSERVED; missing registry data reads
"not observable", never pass or fail.

Implementation: `worker/dns-check.ts` reusing `scan/net.ts` budgets and
DoH, `collectRdap` extended (additively) to surface registry nameservers,
per-isolate rate limit (30/hour, as the domain search; Turnstile decision
recorded in spec §4), `tool-log` extended with a `dns` summariser (domain
and outcome only, never the visitor), footer link under Learn, `/dns` in
the sitemap, `DNS_CHECK_ENABLED=true` in `.dev.vars` for local work.

Verified: 154 tests pass including 16 new rule/handler tests (delegation
mismatch fixtures, RDAP-unavailable fallback, NXDOMAIN, rate limit); lint
clean; production build served locally — live checks against kenic.or.ke
(7/8 OK, delegation match via real KeNIC RDAP, DNSSEC detected) and
onduu.ke; NXDOMAIN message, sitemap entry, footer link and the logged
`tool='dns'` D1 row all confirmed; mobile viewport collapses cleanly.

Launch steps remaining (owner): set the `DNS_CHECK_ENABLED` secret in
production, merge, and decide whether the "three free checks" launch
article gets a follow-up mentioning the fourth. Dashboard aggregation for
the new tool is a small follow-up (`worker/dashboard.ts` sections).

## v4.15.4 — 2219hrs:18th August2026

Docs only: spec drafted for a fourth free tool, the DNS Health Check at
`/dns-check` (`docs/specs/dns-check.md`). Owner approved the standalone-tool
concept; build waits on the spec's §9 gates. Key decisions recorded in the
spec: hyphenated `/dns-check` URL, eight-rule v1 check set with delegation
consistency via RDAP-vs-DoH comparison, inline execution on the existing
`onduudotke` Worker (the source guide's separate Worker, subdomain and
Cloudflare Queues explicitly rejected), storage under the v4.9 promises, no
numeric score, and an SEO posture of referral/funnel traffic because the
"dns checker" SERP is held entirely by global free tools. No site behaviour
changed.

## v4.15.3 — 2204hrs:18th August2026

Completes the form-width pass: the readiness/contact request form
(`.request-form`), previously uncapped and stretching to its full grid
column, is now capped at the same 540px as the three tool search bars.
Two-column field layout and the 620px mobile stack point unchanged.

## v4.15.2 — 2200hrs:18th August2026

## v4.15.2 — 2200hrs:18th August2026

Owner request, completing v4.15.1: the /kedomains (620px) and /scan
(900px) search bars now match the email checker at 540px. The width
moved into the shared `.check-form` base rule and the per-form
modifiers were removed, so all three tools stay in step by
construction. Mobile stacking unchanged; verified at 540px computed on
all three pages.

## v4.15.1 — 2157hrs:18th August2026

## v4.15.1 — 2157hrs:18th August2026

Owner request: the /email-security domain input was full content width
(900px). The form gets its own `email-form` modifier at 540px — exactly
40% narrower — leaving the scan form (which shares the base class) and
the domain search (620px) untouched. Mobile stacking unchanged.

## v4.15.0 — 2153hrs:18th August2026

## v4.15.0 — 2153hrs:18th August2026

Companion to v4.14.0, per the owner: DMARC **p=quarantine now reads
PASS** — it is an enforcing policy (forged mail is kept out of the
inbox), so it is treated like p=reject with the detail stating that
p=reject is the recommended endpoint once reports are clean. Scoring
follows: full 45 DMARC points. An enforcing policy diluted by pct<100
still warns, now with consistent partial credit (30) whether the policy
is quarantine or reject. p=none keeps its warning, a missing policy its
failure. 137 tests.

## v4.14.0 — 2149hrs:18th August2026

## v4.14.0 — 2149hrs:18th August2026

Owner correction to the email check's SPF verdict: a valid record ending
in "~all" (softfail) is a legitimate, working configuration, not a
defect — it now reads **PASS** instead of NEEDS WORK, with the detail
stating plainly that "-all" is the recommended endpoint once every real
sender is listed. Scoring follows (full 25 SPF points instead of 15).
Real problems still warn or fail exactly as before: duplicate includes,
dead includes, 8+ lookups (warn); "+all", no "all" qualifier, over the
10-lookup limit (warn/fail). Tests updated: ~all passes with the
recommendation, ~all with record problems still warns. 136 tests.

## v4.13.1 — 2143hrs:18th August2026

## v4.13.1 — 2143hrs:18th August2026

Owner correction to the partner-path disclosure note: "Ujiajiri and
Onduu are operated by the same company" mis-framed the relationship —
Ujiajiri Enterprises Limited is the operator, not a sibling brand. Now
reads "Onduu is operated by Ujiajiri Enterprises Limited, which also
runs the Ujiajiri platform." Matches the footer and the
commercial-relationships page.

## v4.13.0 — 2140hrs:18th August2026

## v4.13.0 — 2140hrs:18th August2026

First cross-links to the relaunched ujiajiri.ke (same operator, Ujiajiri
Enterprises Limited; relaunched 18 August 2026). Two CTAs, bare URLs with
trailing slashes, no query strings, nothing auto-shared:

- **Implementation → https://ujiajiri.ke/partners/** — a "Find a Delivery
  Partner" button on /paths/website-and-digital-marketing (whose stale
  "directory is being established" status is replaced: the directory is
  live) and on /readiness in the "after the score" section. Copy keeps
  the boundary: providers are independent, clients contract and pay them
  directly, neither site delivers or guarantees the work.
- **Youth pathway → https://ujiajiri.ke/for-youth/** — inline link in the
  homepage "Skills into opportunity" section. Copy says the pathway is
  under development and promises no training, certification, placement
  or income; the stale sibling status line now reflects the live
  directory.
- Contact-page card updated to point at the directory instead of "being
  established".
- /legal/commercial-relationships §01 now names ujiajiri.ke, the shared
  operating company, provider independence and that links are plain —
  nothing submitted to Onduu is passed to Ujiajiri (page remains a
  marked draft pending professional review).
- New test pins both URLs on all three pages, forbids query strings on
  any Ujiajiri link, forbids the stale status text and overpromising
  youth copy. 135/135.

## v4.12.0 — 2131hrs:18th August2026

## v4.12.0 — 2131hrs:18th August2026

The launch announcement is published on the site itself:
`/insights/three-free-checks-for-your-domain` ("Three free checks for
your domain. I pointed them at mine first."), adapted from the approved
post draft in `docs/marketing/announcement-post.md`. Dated 18 August
2026, it sorts to the top of `/insights` automatically; it links each
tool, the earlier parastatal-CEOs article and the tool-limitations page,
and carries the HOSTAFRICA disclosure verbatim. Shared links to it render
the v4.11.0 brand card. RSS now carries 12 items; both hard-coded article
counts in tests updated. 134/134.

## v4.11.1 — 2114hrs:18th August2026

## v4.11.1 — 2114hrs:18th August2026

Docs only, no site change. The launch post moves out of chat and into the
repo: `docs/marketing/announcement-post.md` (verbatim draft plus owner
notes), now paired with a branded 1200×630 card
(`logos/announcement-card.svg` → `docs/marketing/announcement-card.png`)
in the new identity — dark-ground Dial lockup, the three tool routes in
copper, "FREE · NO SIGN-UP · PUBLIC RECORDS ONLY" strapline. Bare links
already auto-render the v4.11.0 share card, so the post carries the Dial
either way.

## v4.11.0 — 2107hrs:18th August2026

## v4.11.0 — 2107hrs:18th August2026

Brand rollout beyond the header — every study earns its keep, and shared
links finally carry an image.

- **Share card (the big one).** Links to onduu.ke shared on WhatsApp,
  LinkedIn or X previously rendered with *no image*. A 1200×630 card
  (`logos/og-card.svg` → `public/og-card.png`) now backs `og:image` on
  every page with a canonical URL, with `summary_large_image` for X.
  Carbon ground, dark-variant Dial lockup, tagline, copper baseline.
- **Adaptive favicon.** `favicon.svg` now carries a
  `prefers-color-scheme: dark` block, so on dark browser chrome the Dial
  swaps to the dark-ground tokens (#28323C track, #CD7A50 copper) instead
  of showing a light-ground mark on a dark tab bar.
- **Study E goes to work.** The stamp-avatar — drawn for exactly this —
  becomes `apple-touch-icon.png` (180) and PWA icons (192/512), declared
  through a new `site.webmanifest` (copper theme colour). Home-screen
  saves and Android installs now show the copper uu stamp.
- `theme-color` meta (ivory) added for mobile browser chrome.
- Rasters are generated, never hand-made:
  `node scripts/generate-brand-rasters.mjs` rebuilds all four PNGs from
  the SVG masters using sharp, which ships with Astro — no new
  dependency. `logos/README.md` documents the loop; its "no raster
  exports" caveat is retired.
- Tests: og:image must be absolute and resolvable (a dead og:image is
  worse than none), all four rasters and the manifest must serve, the
  favicon must keep its dark-mode block. 134/134.

## v4.10.0 — 2050hrs:18th August2026

The Dial identity goes live — Study A + Study D, the pairing recommended
in `logos/README.md`.

- **Favicon replaced.** The site had *no* `<link rel="icon">` at all, and
  `public/favicon.svg` was still the OpenAI starter's blue placeholder.
  Both fixed: the Dial favicon (heavier strokes, holds at 16px) is now
  served and declared.
- **Header and footer wordmark** is now the lockup: the Dial as inline
  SVG plus ONDUU in caps with the copper square stop. Inline SVG means no
  extra request and per-ground recolouring; the name stays **real text**,
  so it is selectable, searchable and independent of any font file —
  which also sidesteps the README's live-`<text>` caveat for web use.
- Dark grounds use the specified variants: track `#28323C`, copper lifted
  to `#CD7A50` — verified as computed styles in the footer.
- The mark is the homepage scorecard's 62/100 gauge promoted to a symbol,
  so the identity and the product illustration are now the same shape.
- `logos/` (five studies, README, masters) is committed rather than left
  untracked; `.DS_Store` added to `.gitignore`.
- A test pins the favicon link, the icon's copper token, the mark in both
  header and footer, and the name remaining text — and fails if the
  starter placeholder ever returns. 133/133.

**Unchanged caveat from the README:** the standalone lockup/wordmark SVGs
still use live `<text>`; convert to outlines before print, sticker or
merchandise use. No raster exports yet (icons and OG cards still to
generate).

## v4.9.1 — 2026hrs:18th August2026

The deletion route now covers everything stored about a domain, not just
scan results (owner request, closing the gap opened by v4.9.0).

- `optOutDomain()` deletes stored **lookup results as well as scans** —
  matching the domain, its subdomains, and bare-name searches whose
  stored detail named it (so a search for "zero" that returned
  `zero.co.ke` is removed too). It returns both counts.
- The blocklist now does double duty: it refuses future **scans**
  outright, and stops future **lookups being recorded**. The lookups
  themselves keep working — they read only the public DNS and registry
  records any WHOIS tool can read, so blocking them would be theatre;
  what the owner opted out of is Onduu keeping a record.
- Privacy notice and the tool-limitations page now state this: one email
  to me@onduu.ke deletes every stored record of a domain, blocks future
  scans, and stops future lookups being recorded.
- The runbook's opt-out command covers `tool_checks`.

### Verified end to end against real D1

Check a domain → one row stored. Opt out → row deleted. Check it again →
still answers, but no row. Unrelated domain → still recorded. Two new
unit tests pin both halves (deletion across tools, and no-record-after
opt-out). 132/132 tests.

## v4.9.0 — 2014hrs:18th August2026

## v4.9.0 — 2014hrs:18th August2026

**Lookup results are now stored** — owner decision (option 2, 18 August
2026), taken with the privacy notice and every page promise changed in
this same release.

### What is stored, and what is not

- `tool_checks` (migration `0006`, applied to production): the tool used,
  the domain or name searched, a readable outcome, the JSON detail behind
  it, and the time.
- **No visitor identity, in any form** — no address, no hash of one, no
  account, no session. A row says a domain was checked at a time, never
  who checked it. The rate-limit counter stays separate and is never
  joined to these rows. `worker/tool-log.ts` is the only writer and
  enforces this; the schema has no column that could hold an identifier.
- Logging runs after the response is on its way (`waitUntil`) and is
  best-effort, so it can never delay or break a visitor's lookup.

### Promises changed in the same commit (required, not optional)

Six places previously told visitors nothing was stored. All now describe
the new behaviour: privacy notice §04 (both tools), the tool-limitations
page (both entries), the checker page body copy, and the `/kedomains`
meta description. No page now claims storage that does not happen, and
none claims the opposite.

### Dashboard

`/go/email-security` and `/go/kedomains` now show real results: checks
all-time/30/7 days, distinct domains, most-checked names with counts and
last-seen, recent checks with their outcome, and a daily trend — instead
of the placeholder note explaining why they were empty.

### Verified

Migration applied locally and to production; both tools run end-to-end
with rows landing (`onduu.ke → 90/100 A — spf:warn dkim:pass dmarc:pass
mx:pass`; `kra.go.ke → kra.go.ke: registered · kra.ke: registered`);
dashboard sections render them; schema confirmed to hold no identity
column; test rows deleted. 130/130 tests.

## v4.8.0 — 1957hrs:18th August2026

## v4.8.0 — 1957hrs:18th August2026

The dashboard becomes an index with sections (owner request), each on its
own route with its own tables.

- `/go` — overview: headline cards (enquiries, scans, page views, routed
  clicks over 30 days) and a table of every section with what it shows.
- `/go/enquiries` — sources that produced enquiries, then the submissions.
- `/go/scans` — scan counts, average score and coverage, domains scanned
  more than once, and recent results.
- `/go/email-security` and `/go/kedomains` — tool usage: visits all-time,
  30 and 7 days, referrers and a daily trend.
- `/go/analytics` — pages, referrers, countries, devices, daily views.
- `/go/routing` — outbound clicks by destination and day.
- `/go/blocklist` — the do-not-scan list.

### Security

Every section fails closed independently: `handleDashboard` refuses
without Cloudflare Access headers before touching the database, so a
`/go/*` subpath the Access policy does not cover returns 403 rather than
serving enquirers' names and addresses. A new test asserts 403 on all
eight sections plus an unknown one. `robots.txt`'s `Disallow: /go`
already covers subpaths by prefix.

### Owner decision surfaced, not taken

The email checker and domain search **do not record what visitors search**
— the privacy notice promises exactly that. Their dashboard sections
therefore show visits, not results, and state the promise verbatim with
the two ways to get more: (1) count tool runs without the query, which
keeps the promise as written; (2) store the searched domain and result,
which is more useful but requires changing the privacy notice and the
tool page copy first, and disclosing the change. Nothing was logged in
this release.

130/130 tests.

## v4.7.2 — 1941hrs:18th August2026

## v4.7.2 — 1941hrs:18th August2026

Titles and descriptions for the two renamed tool pages, chosen against
live SERP evidence (seo-target-validation methodology).

- `/kedomains` — "Kenyan Domain Search: Registrar, Lock and Expiry |
  Onduu". The old title still said ".co.ke and .ke together", which
  contradicted the page after the two-row rename.
- `/email-security` — "Free Email Spoofing Check: SPF, DKIM, DMARC, MX |
  Onduu", leading with the problem in business language and keeping the
  acronyms for long-tail and AI-citation value.
- Both descriptions rewritten inside the 158-character display limit
  (the old ones were ~190-200 and truncated in results).

**Evidence and honest limits, recorded:** page one for Kenyan domain
availability and WHOIS queries is held entirely by registrars (Truehost,
HostAfrica, Olitt, Novahost, HostGuru, EuroDNS); page one for
SPF/DKIM/DMARC checkers is held entirely by global SaaS (Mimecast,
EasyDMARC, DMARCLY, Red Sift). No local or small commercial site appears
on either. **Neither page is a viable head-term SEO target for a new
domain**, so both are written for click-through from referral, social
and long-tail traffic rather than to harvest head terms. Search-volume
data could not be measured — no keyword-volume tool is connected to this
environment; the volume gate is unverified, not passed.

## v4.7.1 — 1920hrs:18th August2026

## v4.7.1 — 1920hrs:18th August2026

Domain search: expired domains read plainly, and a narrower search bar
(owner spec, from a zero.co.ke search showing "(-78 days)").

- A past expiry date now renders **EXPIRED: 78 DAYS AGO (02-06-2026).**
  in bold red, instead of a negative day count under an "EXPIRES:" label.
  Future dates are unchanged: EXPIRES: DD-MM-YYYY (n days), green at 60+
  days of buffer.
- The search form is capped at 620px (`.domain-form`) — a domain is
  short, and the full-width field looked out of proportion. The email
  checker's form is untouched.
- 129/129 tests.

## v4.7.0 — 1916hrs:18th August2026

## v4.7.0 — 1916hrs:18th August2026

Tool routes renamed (owner spec): `/domains` → `/kedomains` and `/check`
→ `/email-security` (the checker returns to its original v8.8 address).

- Old URLs 301 to the new ones; `/email-security/glossary` now lands on
  the checker itself. No redirect loops — the old /email-security→/check
  rule is retired since /email-security is a real page again.
- Canonicals, sitemap, footer, homepage, cross-links between the tools,
  the tool-limitations page and the privacy notice all updated; the API
  endpoints (`/api/check`, `/api/domains`) are unchanged, so nothing
  bookmarked at the API level breaks.
- Tests updated: published routes, redirect map (including the flipped
  glossary rule), canonical checks. 129/129.

## v4.6.2 — 1858hrs:18th August2026

## v4.6.2 — 1858hrs:18th August2026

Added the ICT Authority (icta.go.ke, URL verified) to the registrar
directory, so government .go.ke domains link to the body that actually
registers them. 129/129 tests.

## v4.6.1 — 1853hrs:18th August2026

## v4.6.1 — 1853hrs:18th August2026

Registrar names now resolve for .ke domains (owner-spotted): KeNIC's RDAP
publishes the registrar's display name inside a NESTED sub-entity (the
abuse contact, e.g. fn "HOSTAFRICA EAC") while the registrar entity
itself carries only a handle ("EAL"). The parser now tries the entity's
own vcard, then descends into sub-entities, then falls back to the
handle. Verified against rdap.kenic.or.ke for onduu.ke; fixture test pins
the nested shape. Registrar links light up for .ke domains as a result.
129/129.

## v4.6.0 — 1847hrs:18th August2026

## v4.6.0 — 1847hrs:18th August2026

Registrar links in domain results (owner request: people assume the
largest registrar controls every domain — the tool now shows and links
each domain's ACTUAL registrar).

- REGISTRAR: now links to the registrar's own website when the published
  name matches a known registrar — 17 entries covering the major Kenyan
  registrars (Truehost, Safaricom, Kenya Website Experts, Sasahost,
  HostPinnacle, EAC Directory, HOSTAFRICA) and the big internationals
  (GoDaddy, Namecheap, Cloudflare, Gandi, IONOS, Hostinger, Name.com,
  Porkbun, OVH, MarkMonitor). Unknown registrars show their name with no
  link — nothing is guessed.
- Neutral treatment by design: competitor links are plain, with no
  tracking parameters; only the approved HOSTAFRICA destination carries
  attribution. Every URL was verified reachable before inclusion (Deep
  Africa excluded — its site did not answer).
- Name matching is normalised, so "HostAfrica Kenya Ltd", "Truehost Cloud
  Limited" and "GoDaddy.com, LLC" all resolve. Tests pin the variants.
  128/128.

## v4.5.3 — 1840hrs:18th August2026

## v4.5.3 — 1840hrs:18th August2026

Removed the duplicated HOSTAFRICA disclosure note from the domain search
results block (owner request). The disclosure remains on the same page —
the "Registration happens at HOSTAFRICA" section with the MD relationship
and no-commission statement — and in the footer, so it still sits at the
decision point; the results block no longer repeats it after every
search. The SEO test asserting the page-level disclosure still passes.
127/127.

## v4.5.2 — 1834hrs:18th August2026

## v4.5.2 — 1834hrs:18th August2026

Domain search polish (owner spec).

- Indeterminate copper progress bar while a search runs (static under
  prefers-reduced-motion; the aria-live note still announces the state
  for screen readers).
- Form note shortened to "Checks the extension you enter" (the storage
  disclosure remains on the page body and in the privacy notice).
- Input placeholder is now just "yourdomain".
- The per-result "Public registry data only…" small print removed.
- 127/127 tests.

## v4.5.1 — 1817hrs:18th August2026

## v4.5.1 — 1817hrs:18th August2026

Domain search result values colour-coded (owner spec): good values bold
green, bad values bold red.

- TRANSFER LOCK: ON. → green; OFF. → red (the "— worth fixing" tail is
  removed — the colour now says it).
- EXPIRES: green at 60+ days of renewal buffer (the guide's threshold),
  red inside 60.
- Green uses the brand token; red matches the dashboard's error tone.
  127/127 tests.

## v4.5.0 — 1802hrs:18th August2026

## v4.5.0 — 1802hrs:18th August2026

Domain search presentation, to the owner's spec.

- **Exactly two results per search**: the extension the visitor entered
  plus its .ke twin (a .ke query pairs with .co.ke; another TLD pairs
  with .co.ke; a bare name still gets the .co.ke/.ke pair).
- Headline: "Is your business name protected in .ke too?"; lede, button
  ("Search with the .ke twin") and form note updated to match.
- Registered results broken into lines: bold **REGISTERED**, then
  REGISTRAR (only when the registry publishes a name), TRANSFER LOCK:
  ON/OFF, EXPIRES: DD-MM-YYYY (days). The awkward "publishes no registrar
  details" sentence is gone.
- Available results: "Appears available. Confirm at checkout."
- Tests updated to the two-row pairing; 127/127.

## v4.4.2 — 1741hrs:18th August2026

## v4.4.2 — 1741hrs:18th August2026

Domain search understands KeNIC's full namespace (owner report: searching
kra.go.ke invented the nonsense twin "kra.go.co.ke" and offered to
register it).

- All nine KeNIC third-level extensions are now recognised — co.ke,
  or.ke, ne.ke, go.ke, me.ke, mobi.ke, info.ke, sc.ke, ac.ke — alongside
  second-level .ke. A third-level query (kra.go.ke, school.ac.ke, …)
  returns itself plus the open pair for the same name (kra.ke,
  kra.co.ke); twins are never built by bolting suffixes together.
- Subdomains collapse to the registrable domain first
  (portal.kra.go.ke → kra.go.ke; www.shop.co.ke → shop.co.ke), and a
  bare suffix alone (co.ke, go.ke) is refused.
- Tests pin every extension against invented twins. 127/127.

## v4.4.1 — 1729hrs:18th August2026

## v4.4.1 — 1729hrs:18th August2026

RDAP reliability and a real accuracy bug, both surfaced by the owner
questioning the transfer-lock signal on the live scan.

### What was wrong (two separate things)

1. The owner's live scan (SC-260818-ZVCE) predated locking the domain AND
   caught rdap.org failing to answer the Worker — so it honestly reported
   the lock as "not publicly observable" and the 24-hour cache kept
   serving that snapshot. Working as designed; the stale row is deleted.
2. **A genuine bug found while fixing #1:** KeNIC's RDAP publishes the
   spec-normalised spaced status form ("client transfer prohibited"),
   while the matcher only recognised camelCase EPP
   ("clientTransferProhibited") — so a locked .ke domain could evaluate
   as unlocked. Affected the scan's transfer-lock signal and the domain
   search's lock display.

### Fixed

- **RDAP hardened:** .ke/.co.ke domains now query KeNIC's own RDAP
  (`rdap.kenic.or.ke`) first — the authority, observed answering
  directly — with rdap.org as fallback and one retry per endpoint,
  capped at three requests. Transient failures fall through; a parsed
  record or an authoritative 404 stops the loop.
- **Status matching normalised** (strip non-letters, lowercase) so both
  RDAP's spaced form and EPP camelCase match, in `worker/scan/signals.ts`
  and `worker/domains.ts`. The test fixture now uses KeNIC's spaced-only
  form so the regression is pinned.
- Verified with a fresh local scan of onduu.ke: transfer-lock **PASS**
  with the registry's "client transfer prohibited, client update
  prohibited, client delete prohibited" as evidence; 124/124 tests.

### Note

The production self-scan of onduu.ke will still show reduced Evidence
Coverage (the Worker cannot fetch its own zone — spec §status), but the
registry-side signals (lock, expiry, DNSSEC) now observe reliably there.

## v4.4.0 — 1623hrs:18th August2026

## v4.4.0 — 1623hrs:18th August2026

Content-Security-Policy and the accessibility pass.

### CSP (the deferred security header, done carefully)

- Astro's stabilised `security.csp` now emits a **response-header CSP with
  per-page hashes** for its inline hydration scripts — no
  `unsafe-inline` for scripts anywhere. Only two external origins are
  allowed, each for one purpose: `challenges.cloudflare.com` (Turnstile
  script/frame/connect) and `www.youtube.com` (the one Insights embed).
  Style elements are hashed; only style *attributes* (astro-island's
  `display: contents`) get attribute-scoped `unsafe-inline`.
  `frame-ancestors` stays with the X-Frame-Options header.
- Verified with zero CSP violations: islands hydrate, the /check island
  ran a full live check under the policy, and the embed iframe loads its
  allowed source. A test pins the policy shape and fails on any
  unexpected origin.

### Accessibility

- **Skip link** ("Skip to content") as the first focusable element on
  every page, targeting the new `id="main"` landmark on all nine page
  layouts.
- **:focus-visible** outline (3px copper) so keyboard position is always
  visible; CSS had no outline suppression anywhere (verified).
- Forms audit: the submission forms already carry correct labels,
  aria-invalid, aria-describedby per-field errors, a focused role=alert
  error summary and a role=status confirmation — no changes needed. The
  tool islands announce busy/result states via aria-live (pre-existing).
- Fixed a Phase-1 straggler: the 404 CTA still said "Get your readiness
  score" — now "Check Your Digital Readiness".

### Findings reported, not changed (owner decisions)

- **Colour contrast:** copper (#B8643B) as small text on ivory, and white
  on copper buttons, measure ≈3.3–3.5:1 — below the 4.5:1 AA threshold
  for small text. Fixing it means adjusting brand colours; an owner call,
  not a silent edit.
- **Mobile navigation:** below 1000px the header nav links are hidden
  with no menu button — mobile users navigate via the CTA and footer
  only. Adding a disclosure menu is a design decision.

- 123/123 tests.

## v4.3.0 — 1609hrs:18th August2026

## v4.3.0 — 1609hrs:18th August2026

Completing the tools story: the tool-limitations page, the two promised
guides, and dashboard visibility for what the tools produce.

### Added

- **`/legal/tool-limitations`** — the honest limits of all three tools in
  one place (what each reads, what it stores, what results do and do not
  prove, the scan opt-out route), marked as a draft for professional
  review like the other legal pages, linked from the footer. Where a
  marketing sentence conflicts with it, this page wins — by its own words.
- **`/guides/domains-and-dns`** — "Who really controls your domain and
  DNS?": the five control questions, the registered-by-someone-else
  failure pattern from the Insights archive, and an order of repair;
  routes to the domain search.
- **`/guides/email-and-trust`** — what SPF, DKIM, DMARC and MX decide,
  why it is a live Kenyan problem, and the honest limits of a clean
  result; routes to /check. The guides index now lists all five guides
  the strategy's sitemap named.
- **Dashboard (/go):** two new stat cards (readiness scans all-time/30d),
  a routed-clicks table (the strategy's "approved HOSTAFRICA-path clicks"
  measure, from the /outbound/* counts), and a recent-scans table
  (reference, domain, score, coverage, rubric). Queries degrade to zeros
  on a database that predates migrations 0004–0005 rather than breaking
  the page.

### Verified

- 121/121 tests (new: tool-limitations content pinned — "not a
  penetration test", "not a reservation", scan rule 2, the opt-out
  address; the two guides join the published-architecture suite).
- Dashboard sections verified locally with a simulated Access identity;
  new pages 200 and in the sitemap.

## v4.2.1 — 1557hrs:18th August2026

## v4.2.1 — 1557hrs:18th August2026

Browser security headers, owner-approved, attached in code
(`worker/security-headers.ts`, applied by the middleware to every response
the Worker serves).

- **HSTS** with a deliberately short starting max-age (7 days): browsers
  that see it refuse plain-http for that window. Growth path 30d → 180d →
  1y as confidence accumulates; `preload` and `includeSubDomains`
  deliberately absent (the test forbids them riding along casually).
- **X-Content-Type-Options: nosniff** — no MIME guessing.
- **X-Frame-Options: DENY** — no clickjacking frames; Turnstile's iframe
  inside our own pages is unaffected.
- **Referrer-Policy: strict-origin-when-cross-origin** — outbound links
  (e.g. the HOSTAFRICA panel) learn the origin, not the full URL.
- **Content-Security-Policy deliberately deferred** to its own task:
  Turnstile, Astro's hydration scripts and the one YouTube embed all need
  allowing, and a rushed CSP breaks pages.
- New test pins all four headers on a page, the scan page and an API
  response (120 total). With this, the scanner's remaining self-findings
  (HSTS, baseline headers) are addressed for external observers.

## v4.2.0 — 1537hrs:18th August2026

## v4.2.0 — 1537hrs:18th August2026

**The Instant Public Readiness Scan is LIVE**, on the owner's instruction,
with every launch gate passed.

### Launch actions (production)

- Migrations `0004_scans.sql` and `0005_scan_blocklist.sql` applied to the
  production D1 database (additive only).
- `SCAN_ENABLED=true` set as a **Worker secret** — secrets survive Workers
  Builds deploys where dashboard plaintext vars can be wiped; deleting the
  secret is the instant kill switch.
- `/scan` linked from the footer ("Readiness Scan") and added to the
  sitemap; the page comment updated from gated to launched.

### Verified live on production

- Bare POST to `/api/scan` → 403 Turnstile challenge (live, guarded).
- Real browser scan of onduu.ke through the real Turnstile widget:
  reference SC-260818-ZVCE. This exposed a **vantage limitation**, now
  documented in the spec: a Worker cannot fetch its own zone (Cloudflare
  recursion protection), so onduu.ke's self-scan reports web signals as
  "not publicly observable" — Evidence Coverage 34%, score 91 on what
  remains. Honest behaviour, exactly as rule 2 requires.
- Real browser scan of example.com: score 75 at 81% coverage — third-party
  domains (the product's purpose) observe fully; the missing 19% is
  example.com's absent mail configuration, correctly unobservable.

## v4.1.0 — 1520hrs:18th August2026

## v4.1.0 — 1520hrs:18th August2026

Kenyan domain search, and the HOSTAFRICA path goes live. Owner decisions
(18 Aug): destination is the official HOSTAFRICA panel with **UTM
attribution only — no affiliate parameter, no commission**; two-step
checkout (no deep link); the same destination powers the infrastructure
path CTA.

### Added

- **`/domains`** — search a business name and check the **.co.ke and .ke
  pair together** (brand-protection framing, the Control dimension).
  Taken domains show registrar, transfer lock and expiry from public RDAP
  (the scan's collector, reused); a lock that is off says "worth fixing".
  Available names get "Register it at HOSTAFRICA ↗" with the UTM link,
  presented honestly as "appears available — confirmed at checkout"
  (DNS NXDOMAIN + no RDAP record; the registry answer at checkout is
  authoritative). Nothing searched is stored; per-connection rate limit;
  all lookups through the scan's SSRF-safe layer.
- **`/api/domains`** (GET) — the search endpoint behind the page.
- **`/api/out`** — first-party outbound-click counting for the strategy's
  "approved HOSTAFRICA-path clicks" measure: an allowlisted route name is
  recorded as a synthetic page view (no IP, no identity, nothing on the
  device), via sendBeacon from the register button.
- Footer "Domain Search" link; `/domains` in the sitemap.

### Changed

- **`/paths/hostafrica-infrastructure` CTA is live**: "Explore the
  HOSTAFRICA Path" now links the approved panel destination
  (utm_campaign=infrastructure-path), with the no-commission disclosure at
  the decision point and a cross-link to the domain search.
  `ContentSection` gained an optional `links` field to carry it.
- `collectRdap` now treats RDAP 404/non-200 as "no record found" instead
  of parsing error bodies (also correct for the scan: unobservable, never
  a fake registration), and accepts an injectable fetcher for tests.
- Privacy notice §04 covers the domain search: nothing stored, aggregate
  click counting, UTM attribution, no commission.

### Verified

- 119/119 tests (13 new: candidate pairing, availability classification
  with stubbed DNS/RDAP, handler validation, rate limit; SEO suite now
  pins the UTM destination, the absence of any `aff=` parameter, and the
  disclosure on both pages).
- Live searches against real registries: `onduu` → both registered, with
  onduu.ke's real RDAP (expiry 2027-08-14, **transfer lock off — flagged
  to the owner**); an unlikely name → both "appears available" with the
  register link. Browser end-to-end verified on the built Worker.

## v4.0.0 — 1323hrs:18th August2026

## v4.0.0 — 1323hrs:18th August2026

Phase 1: reposition Onduu per the current strategy. Onduu educates,
assesses and routes; independent Ujiajiri partners implement; HOSTAFRICA
supplies infrastructure. The direct-delivery era of the site ends here.

### The strategy, filed and authoritative

- `docs/strategy/onduu-strategy-current-2026-08-18.pdf` (authoritative),
  the 16 Aug two-site decision (exact approved copy) and the 15 Aug brief
  are now in the repo; `CLAUDE.md`'s source-of-truth order points at them.

### Changed

- **Homepage rewritten** with the approved copy: "Know what is weakening
  your digital business — and what to do next." The banned "Onduu finds
  and fixes" is gone; new problem, readiness, two-paths, framework,
  knowledge, youth-pathway and evidence sections; metadata updated.
- **Single primary CTA everywhere: "Check Your Digital Readiness"** —
  header button, section CTAs, final CTAs, articles, /check and /scan.
- **New architecture:** nav Readiness · How It Works · Paths · Guides ·
  About. New pages: `/paths`, `/paths/website-and-digital-marketing`,
  `/paths/hostafrica-infrastructure` (with the MD disclosure; outbound
  destination link withheld until approved), `/guides`,
  `/guides/website-revenue-system` (the WRS demoted from delivery offer to
  published framework), `/guides/kenyan-vps`, `/guides/agents-on-vps`
  (educational method salvaged from the pilot).
- **Removed with 301s:** `/solutions` → `/paths`; the Revenue & Risk
  Review → `/readiness`; the WRS page → its guide; the Agent Pilot →
  `/guides/agents-on-vps`; `/infrastructure` tree → the HOSTAFRICA path
  and the VPS guide.
- **Regated (noindex, out of nav/sitemap, reachable for review):**
  Managed Website Operations (a service with no operator), Results
  (awaits approved evidence), the managed-service terms.
- `/how-it-works` reframed to **Assess → Prioritise → Choose a path →
  Verify**; `/readiness` gained the "What happens after the score?"
  consent-first routing block; `/about` the operating-relationship
  paragraph; `/contact` the three-destination split (nothing silently
  shared between organisations); footer rebuilt per the strategy with the
  responsibility disclosure; contact-form microcopy no longer offers
  managed programmes or pilots.
- Content layering: new `src/data/pages-strategy.ts` overrides the brief
  and prototype layers, keeping provenance auditable.

### Verified

- 106/106 tests, lint and type-check clean. New tests pin the
  architecture, the 301 map, the gates (reachable + noindex), the footer
  disclosure, the legal-link set, and the absence of "finds and fixes",
  Managed Website Operations and Agent Workflow Pilot from the homepage.

### Notes

- HOSTAFRICA outbound link and any tracking remain gated until the owner
  approves the exact destination and wording (stated on the path page).
- The Ujiajiri partner directory is described as "being established"; no
  link is published to the current ujiajiri.ke (still a clone of the old
  Onduu homepage). The youth section likewise carries no external link yet.
- `/legal/tool-limitations` from the strategy's sitemap is not yet drafted
  (Phase 3); the footer links the three existing legal pages.

## v3.2.0 — 1114hrs:18th August2026

## v3.2.0 — 1114hrs:18th August2026

The visitor-facing side of the Instant Public Readiness Scan, plus the
privacy review it needs — the launch-enabling work. **Still gated:** the
`/scan` form posts to the flag-dark `/api/scan`, so the page explains the
product but cannot run a scan in production until the owner sets
`SCAN_ENABLED=true`.

### Added

- `/scan` — the scan page. Copy reviewed against the CLAUDE.md claims
  rules: it is a "Public Signal Score", never a Digital Readiness Score,
  never "secure"/"compliant"/"guaranteed"; the human-reviewed Verified
  route and the "not publicly observable" framing are stated throughout.
  `src/components/scan-page.tsx` (static) + `src/components/scan-form.tsx`
  (React island: domain input, Turnstile, results grouped by the six
  dimensions with score, coverage and the not-observed list).
- Not linked from navigation and deliberately absent from the sitemap; the
  `/api/` disallow already covers the endpoint. It ships linked at launch.
- `scan_blocklist` D1 table (migration `0005`) backing the domain opt-out:
  the scan now checks a runtime blocklist as well as the code-level
  `DO_NOT_SCAN` set before any fetch, and refuses a blocked domain and its
  subdomains. `optOutDomain()` records a domain and deletes its stored
  results in one step; the production command is in the spec §6.

### Changed

- Privacy notice (`src/data/pages-brief.ts`, section 04) rewritten from
  "the checker stores nothing" to cover both tools honestly: the scan
  **does** store a result (domain, public observations, score, reference)
  and why (caching, score replay), that no visitor identity is attached,
  and that the abuse counter reuses the same one-way hashed address as the
  forms. The processors section notes Cloudflare now stores scan results.
  Owner decisions (18 Aug 2026) recorded in the notice and on the page:
  scan results are kept until deleted (no fixed schedule); a domain owner
  who emails me@onduu.ke has their result deleted and the domain added to
  the do-not-scan list.

### Verified

- 100/100 tests, lint and type-check clean.
- Full browser end-to-end on the Astro dev server (test Turnstile key):
  the `/scan` form hydrated, solved Turnstile, scanned onduu.ke, and
  rendered score 82 at 100% coverage across all 24 signals in six
  dimensions, with the "not a Digital Readiness Score" statement. Test
  rows deleted.
- The flag-off gate re-tested: `/api/scan` 404s without `SCAN_ENABLED`.

### Still required before launch

Owner review of the privacy wording (esp. the two TO CONFIRM items), then
the go-live steps: apply migration `0004` to production, set
`SCAN_ENABLED=true`, link `/scan` from navigation, and approve. None are in
this change.

## v3.1.0 — 1048hrs:18th August2026

## v3.1.0 — 1048hrs:18th August2026

Build the Instant Public Readiness Scan (ROADMAP Phase 4), to the approved
spec and psr-v1 rubric. **Gated and dark** — no user-visible change.

### The gate

`POST /api/scan` returns 404 unless the `SCAN_ENABLED` Worker var is
exactly `"true"`. Production has no such var, so deploying this exposes
nothing. Launch is a separate owner action: apply migration 0004, review
the gate results, build the visitor-facing page, set the flag, approve.

### What was built

- `worker/scan/collect.ts` — observation collectors over the fixed fetch
  surface (RDAP, DoH, homepage, http probe, www twin, robots, sitemap, one
  missing-page probe), all through the existing `net.ts` safety layer. Page
  bodies are never stored — only extracted facts and retained headers.
- `worker/scan/signals.ts` — the 24 deterministic signals from rubric §9.
  Unobservable signals (unfound DKIM selectors, failed fetches) are marked
  unobservable, never pass or fail.
- `worker/scan/rubric.ts` — versioned `psr-v1` weights and the Public
  Signal Score / Evidence Coverage calculation. Integer arithmetic, so
  replay is exact.
- `worker/scan/scan.ts` — orchestrator: validate, do-not-scan check, one
  shared 20 s / 40-subrequest budget, score, store, shape the result with
  its "not a Digital Readiness Score" statement.
- `worker/scan/store.ts` + `migrations/0004_scans.sql` — 24 h per-domain
  result cache, hourly per-client rate limit, scan reference IDs. No
  visitor identity stored with a result.
- `worker/scan/do-not-scan.ts` — blocklist honoured before any fetch.
- `src/pages/api/scan.ts` — the flag-gated endpoint: Turnstile (same widget
  and secret as the forms), then rate limit, then cache, then scan. Fails
  closed with no secret, exactly like `/api/submit`.

### Verified

- 100/100 tests pass (31 new). Three launch-gate suites:
  **SSRF** (`net.ts` controls: every IP-literal encoding, forbidden v4/v6
  ranges, redirect-to-internal, loops, oversize bodies, budget), **abuse**
  (flag-off 404, rate limit, 24 h cache, do-not-scan), **scoring-replay**
  (a JSON round trip of stored observations reproduces signals and score
  byte-for-byte; unknown rubric/signal is a hard error).
- Live end-to-end scan of onduu.ke through `wrangler dev` with the flag on:
  real RDAP/DNS/HTTP observations, score 80 at 100% coverage, cache-hit on
  the second call. Test rows deleted.
- Two small exports added to `worker/submissions.ts` (`verifyTurnstile`,
  `clientKeyOf`) so the scan reuses the exact Turnstile and rate-limit
  logic; behaviour unchanged.

### Still required before launch (gates §7)

Privacy review (stored fields vs the privacy notice; retention), copy
review of every visitor-facing string, the `/scan` page, and explicit
owner approval. Migration 0004 is **not** applied to production by this
change.

## v3.0.1 — 1010hrs:18th August2026

## v3.0.1 — 1010hrs:18th August2026

Phase 0 closeout: metadata fixes, the superseded-content inventory, and
toolchain maintenance.

### Fixed

- The homepage and `/check` now carry a canonical URL and Open Graph tags;
  they were the only indexable pages without them (pre-existing, preserved
  through the migration for parity, logged in `ROADMAP.md`).
- The 404 page has its own title ("Page not found | Onduu") and a
  description reusing its on-page copy, instead of masquerading as the
  homepage. No canonical on the error response.
- Two new tests pin all of the above; 69 total, all passing.

### Added

- `docs/specs/superseded-content.md` — the page-by-page inventory of
  direct-delivery copy that Phase 1 must replace, with provisional
  dispositions pending the 16 August strategy document. Completes the last
  open Phase 0 audit item.

### Changed

- wrangler 4.92.0 → 4.123.0 with @cloudflare/workers-types 5.x (the old CLI
  could not read local dev state written by the Astro adapter's newer
  workerd). Clean build, lint, type-check and full test suite verified on
  the new toolchain.
- `ROADMAP.md`: Phase 0.5 marked done (live since v3.0.0); Phase 0 audit
  items closed out.
- Deleted the merged `astro-migration` branch on GitHub.

## v3.0.0 — 0846hrs:18th August2026

## v3.0.0 — 0846hrs:18th August2026

Migrate the site from vinext to Astro (ROADMAP Phase 0.5, owner-approved).
Same Worker, same bindings, same content — a different renderer.

### Why

The site is ~95% static content and ran on vinext 1.0.0-beta.2, which broke
production twice (v1.3.1 dead nav links; v1.1.0 stale-cache build missing
/check). Astro renders the same pages as server-rendered HTML with React
islands only where there is real interactivity.

### Proven

- **Parity:** all 37 baseline routes match the v2.11.1 production build —
  status codes, redirects, titles, descriptions, canonicals, Open Graph,
  and the complete visible prose of every page including all 11 articles
  (`docs/specs/parity-baseline.json`, captured before the port).
- **Tests:** 67/67 pass. The harness now boots the built Worker in real
  workerd via wrangler dev (`tests/helpers/server.mjs`); every assertion
  from the vinext suite is preserved.
- **Forms:** verified end-to-end in the browser — Turnstile test widget,
  /api/submit, local D1 row with reference, attribution and consent
  version; test rows deleted afterwards.
- **Weight:** content pages ship 0.9KB of JavaScript (0.5KB gzipped),
  down from 187KB (58.6KB gzipped) under vinext — a 99.5% reduction on 33
  of 37 routes. React now loads only on /readiness, /contact and /check.

### Changed

- Astro 7 + @astrojs/cloudflare 14 + @astrojs/react; vinext, its Vite
  pin and the RSC toolchain removed. `app/` became `src/` (data files and
  worker modules moved unmodified; import paths only).
- worker/index.ts wiring became Astro endpoints and middleware; the worker
  modules themselves (submissions, email-check, feeds, dashboard,
  pageviews, stale-cookies) are byte-identical.
- Metadata now renders in <head>; vinext had left it in a hidden div at the
  end of <body>. Values unchanged.
- Attribution capture is a plain bundled script instead of a React island —
  that is where most of the JavaScript reduction on content pages comes
  from.
- `session: false` keeps the adapter from declaring a SESSION KV binding
  wrangler would auto-provision on deploy; `/_vinext/image` and the IMAGES
  binding are gone (public/ holds only SVGs).
- README, tsconfig, eslint config and .claude/launch.json updated for the
  new stack. Full deviation log in `docs/specs/astro-migration.md`.

### Notes

- HTML pages stay server-rendered on demand so the middleware keeps seeing
  every page request (page views, stale-cookie expiry). Do not prerender
  without moving that logic.
- Deploy config is now the build output's `dist/server/wrangler.json`; if
  Workers Builds uses a custom deploy command, it must point there (owner
  to confirm in the dashboard before merge).
- The pinned wrangler 4.92.0 cannot read local dev state written by the
  adapter's newer workerd; upgrade wrangler as a follow-up.

## v2.11.1 — 0802hrs:18th August2026

## v2.11.1 — 0802hrs:18th August2026

Check in the scanner's network safety layer as work in progress.

- `worker/scan/net.ts` — SSRF defence for the future Instant Public
  Readiness Scan: LDH-only public hostnames (IP literals in any encoding
  reject), DNS-over-HTTPS pre-resolution with public-routability checks on
  every address, per-hop redirect re-validation, streaming size caps, and a
  shared wall-time/subrequest budget.
- **Not wired in and not deployed.** Nothing imports it; the Worker's
  behaviour is unchanged. The scanner itself stays gated behind the Phase 4
  specification and threat-model tests (`ROADMAP.md`).

## v2.11.0 — 0801hrs:18th August2026

Governance files, approved by the owner after review.

- `CLAUDE.md` — permanent operating manual: purpose, the Onduu/Ujiajiri/
  HOSTAFRICA responsibility boundaries, content and claims rules, technical
  rules and the required work loop.
- `ROADMAP.md` — current state, the two 18 August decisions (reposition per
  the 16 Aug two-site strategy; migrate the stack to Astro), phases 0–6 with
  statuses and acceptance criteria, the gated list, and outstanding owner
  decisions.
- `REVIEW.md` — pre-merge/pre-deploy standard: outcome categories, seven
  checklist sections, twelve automatic MUST FIX blockers.
- No website code, dependencies, migrations, resources, DNS or deployment
  changes in this release.

## v2.10.2 — 0637hrs:18th August2026

Turnstile now works on localhost, using Cloudflare's published test keys.

The real widget key is registered for onduu.ke only, so every dev-server page
with a form threw error 110200 and the forms could never submit locally.

- `route-policy.ts` picks the site key by environment: under the Vite dev
  server (`import.meta.env.DEV`) it uses Cloudflare's official always-passing
  test key; production builds inline `DEV: false`, so onduu.ke keeps the real
  key. Verified in the built output — the conditional resolves to the real key.
- `.dev.vars` (new, gitignored) gives the local Worker the matching published
  test secret, so `/api/submit` verification passes locally. Neither value is
  a real credential — both are Cloudflare's documented test keys.
- Local D1 already had the migrations applied, so the whole path works in dev:
  widget issues its dummy token, the Worker verifies it against siteverify, and
  a submission stores and returns a reference (tested end-to-end, then the test
  row was deleted).

## v2.10.1 — 0629hrs:18th August2026

Three small CTA fixes from a site-wide action review.

- **/readiness no longer links to itself.** The final CTA band on every
  standard page pointed at `/readiness` — including on `/readiness`, where it
  reloaded the page the visitor was already on. On the readiness page it now
  anchors to `#request`, the form section. Every other page is unchanged.
- **/readiness has a hero CTA again.** The brief copy dropped the prototype's
  "Start my assessment" button, so visitors had to scroll five sections to find
  the form. Restored as "Start my assessment → #request".
- **/check surfaced on the homepage.** The email security check was only
  reachable from the footer. The six-part-score section now pairs "Score my
  website" with a text link "Run the free email security check → /check",
  matching the hero's button-plus-text-link pattern.

Verified on the dev server: both readiness CTAs resolve to the existing
`#request` anchor, and the homepage action row renders both links.

## v2.10.0 — 2226hrs:16th August2026

Dashboard moved to Cloudflare Access only, and a real hole closed on the way.

### The hole

Cloudflare Access protects a **hostname**, not a Worker. With the workers.dev
route live, `onduudotke.onduu.workers.dev/go` reached the same dashboard code
**without passing Access at all**. The access token was the only thing standing
in front of it there. Removing the token as first asked would have left
enquirers' names and email addresses reachable by anyone who guessed the
workers.dev subdomain.

### Closed

- workers.dev disabled — the site is served on onduu.ke only.
- `"workers_dev": false` pinned in `wrangler.jsonc`, so a future deploy cannot
  silently reopen it. Verified: the deploy after the change did not re-enable
  it.
- `/go` now requires proof it came through Access: the Worker checks the
  headers Access sets on every request it authenticates, and returns 403
  without them. If Access is ever removed or reconfigured, the dashboard
  refuses rather than quietly serving personal data.
- The signed-in identity from Access is shown on the page.

### Removed

The token gate and the `DASHBOARD_TOKEN` secret, as requested. Nothing to
remember, nothing to rotate, and no password on a page that lists enquirers.

Tests now assert 403 for any request without Access headers, that a cookie or
bearer header cannot fake it, and that supplying a token is no longer a way in.

## v2.9.0 — 2139hrs:16th August2026

Private dashboard at `/go`, and first-party page views.

### First-party page views

Recorded **server-side** on HTML responses, so nothing runs in the visitor's
browser, nothing is stored on their device, no consent is needed and no ad
blocker can suppress it. Written after the response via `waitUntil`, so it
never delays a page.

Stored: path, referring host, country and device class. **Not stored:** IP
address or any hash of one, the user-agent string (read to skip bots, then
discarded), and any session or visitor id. Two views cannot be linked to the
same person — which means this cannot report unique visitors, and does not
claim to. Bots, assets, error pages and the dashboard itself are skipped.

### The dashboard

Enquiry totals, which source and landing page produced enquiries, the last 100
enquiries, most-read pages, referring sites, and daily views.

Built to fail closed, because it displays personal data:

- **503 with no `DASHBOARD_TOKEN` configured** — no window where it sits open
  on a live site. Verified in production before the secret existed.
- Constant-time token comparison.
- The session cookie carries an HMAC and expiry, never the token, and is
  HttpOnly, Secure, SameSite=Strict, 12 hours.
- A forged cookie is refused; noindex, and disallowed in robots.

Seven tests cover the closed state, the sign-in gate, wrong tokens, cookie
hardening, forged sessions, and what is excluded from recording.

### Privacy notice

Updated in the same release to describe server-side page-view counting and
what it deliberately does not hold.

**To switch the dashboard on:**
`npx wrangler secret put DASHBOARD_TOKEN --name onduudotke`

## v2.8.0 — 2128hrs:16th August2026

Expire the analytics cookies left behind by the previous site.

v8.8 ran Google Analytics, Microsoft Clarity and an Encharge snippet. Those
cookies were still sitting in the browser of anyone who visited before August
2026. The privacy notice says this site does not track you, which was true of
what the site sets and hollow while someone else's tracking cookies remained
on the domain.

- If a request arrives carrying one, the response expires it: `_ga`, `_gid`,
  `_gat`, any `_ga_*` / `_gac_*` / `_gcl_*`, `_clck`, `_clsk`,
  `encheventsnippet`, `unique_session_id` and `wai_from_id`.
- Each is expired in all three forms — host-only, `Domain=onduu.ke` and
  `Domain=.onduu.ke` — because a cookie is only deleted when the domain and
  path match how it was set.
- **Cloudflare's own functional cookies are never touched.** Expiring
  `__cf_bm` or `cf_clearance` would break bot protection and Turnstile.
- Self-limiting: once cleared the browser stops sending them, so the headers
  stop being added. Visitors who never had them see no Set-Cookie at all, and
  static assets are never touched.

### Verified live

A request carrying `_ga`, `_ga_HFJ4SF94RP`, `_clck` and `__cf_bm` came back
with nine expiry headers for the three stale cookies and **none for
`__cf_bm`**. A clean request received zero Set-Cookie headers.

In a real browser holding seven stale cookies, **one page load cleared all
seven** — `document.cookie` went from seven names to empty.

Six new tests cover detection, the Cloudflare exclusion, the domain forms and
the asset exemption.

## v2.7.0 — 2120hrs:16th August2026

Google Analytics, Tag Manager and the consent banner removed.

With Cloudflare Web Analytics covering traffic and performance for every
visitor, and first-party attribution covering every enquiry, GA4 was buying
nothing that was not already covered — while costing a consent banner in front
of the site, a transfer of personal data to Google, and several paragraphs of
privacy notice to defend.

### Removed

- `app/consent.tsx`, the layout hook, the footer "Cookie choices" control and
  the banner styles.
- The Google Tag Manager container and everything it loaded.
- The Google processor entry and the consent-based lawful basis for
  measurement from the privacy notice.

### The notice now says what is true

No advertising tags, no third-party tracking scripts, no cookie banner because
nothing needs one. Cloudflare Web Analytics runs cookielessly on every visit;
attribution is held in session storage until a form is submitted. The note
about stale Google Analytics cookies from the previous site is kept, since
returning visitors may still carry them.

### Verified live in a browser

Banner gone, cookie control gone, no Tag Manager script, no dataLayer. The
only third-party host the page contacts is
`static.cloudflareinsights.com`. Attribution still records the visit source.

Tests now assert the **absence** of Tag Manager, Google Analytics, Clarity and
a Meta pixel on every page, so a tracker cannot return without the privacy
notice changing in the same release. The form's consent checkbox is untouched:
that is data-processing consent, not cookies.

## v2.6.0 — 2113hrs:16th August2026

First-party enquiry attribution, closing the one gap Cloudflare Analytics
cannot fill.

### What it does

The first page of a visit records the referring site, the landing path and any
UTM parameters. That travels with the form submission and is stored beside the
enquiry in D1, tied to its reference number — so "which article produced this
enquiry" is answerable from our own data.

- Held in **sessionStorage, not a cookie**: it dies with the tab and cannot
  follow anyone between visits or sites.
- **No consent gate needed** and no third party involved, so it covers 100% of
  enquiries rather than only those who accept measurement.
- Internal referrers are ignored, so moving around the site does not overwrite
  the original source.
- Server-side length caps on every field; a malformed referrer is dropped
  rather than failing the visitor's form.

Migration `0002_attribution.sql` adds the columns and an index on
(utm_source, created_at).

### Verified live

Arrived at an article with UTM parameters, navigated internally to
/readiness, submitted. Row `ON-260816-BH09` stored landing_path
`/insights/ai-in-kenya-is-about-workflow`, submitted_from `/readiness`,
utm_source `linkedin` — the original source survived the internal navigation.
Test row deleted.

### Privacy notice

Updated in the same release: arrival details are listed in what is collected,
legitimate interest is recorded as the basis, and the session-storage
mechanism is described. Three new tests cover the caps, the malformed-referrer
case and that attribution is never required.

## v2.5.1 — 2051hrs:16th August2026

**Correction: Cloudflare Web Analytics was already running, and the privacy
notice said the site had no analytics.**

Asked to add Cloudflare Web Analytics, the dashboard showed onduu.ke had been
set up 8 days ago with automatic setup, reporting 96 page views in 24 hours.
A real browser confirms `static.cloudflareinsights.com/beacon.min.js` loads on
every page.

It was missed because automatic setup injects the beacon at Cloudflare's edge
rather than in the code, so grepping the repository found nothing — and curl
does not receive the injection either. **Only a real browser shows it.** That
is the third claim in this project written from a code check and disproved by
a browser, after the menu links and the consent banner.

- The cookies section now describes both: Cloudflare Web Analytics running on
  every visit, cookieless and therefore not gated, and Google Analytics
  loading only on consent.
- Cloudflare's processor entry now mentions Web Analytics.
- Added a note that a browser which visited before August 2026 may still hold
  analytics cookies from the previous site, which this site does not set.
- Added a regression test asserting the notice describes Web Analytics as
  running, and that the "no analytics" and "intended to be added" wordings
  cannot return.

Nothing was installed for this release: the analytics was already live. The
change is that the privacy notice is now true.

## v2.5.0 — 2041hrs:16th August2026

Consent-gated Google Analytics via Tag Manager (GTM-MSMMVVZ7).

### Deny by default

Nothing measuring the visitor loads until they accept. Verified on the live
site with a cleared browser: **zero requests to Google, no GTM script and no
dataLayer** before a choice is made, and the same after declining. On accept,
GTM loads and six Google requests follow.

- The choice is stored in localStorage rather than a cookie, so declining
  leaves nothing on the device.
- Withdrawal is real: a "Cookie choices" control in the footer reopens the
  banner, and withdrawing after accepting reloads the page so measurement
  stops immediately.
- The banner ships in the HTML but is hidden by CSS and revealed by the
  client, so it still works if JavaScript is slow and never flashes at
  visitors who already answered.

### Privacy notice updated in the same release

The notice no longer claims the site runs no analytics. It now states what
loads on accept, that Google receives data outside Kenya, what declining does,
and where to change the decision. Google is listed as a processor, and consent
is recorded as the lawful basis for measurement.

### Fixed during testing

The banner would never hide: a standalone `.consent{display:none}` sat before
the main `.consent` rule, which re-declared `display:grid` and won on source
order. Class and aria-hidden were updating correctly, so only a real browser
showed it. Hiding now lives in the base rule, revealed by `.is-visible`.

Cloudflare Web Analytics is still not installed — it needs enabling on the
Cloudflare side first.

## v2.4.0 — 1909hrs:16th August2026

Owner answers applied to the legal pages and About.

### Answered

- **Controller identity.** The contracting entity is **Ujiajiri Enterprises
  Limited**, trading as Onduu. Named in the privacy notice and corrected on
  Commercial Relationships, which had described Onduu as Wycliffe's personal
  practice.
- **ODPC registration.** Not registered. No registration claim is published in
  either direction.
- **Referral benefit.** None. Commercial Relationships now states plainly that
  Onduu receives no commission, fee, revenue share or other benefit for any
  supplier choice, with a note that the page changes in the same release if
  that ever changes.
- **Retention.** No automatic deletion. The notice previously claimed data was
  "kept for two years and then deleted" — **that was false**: the code stores a
  retain_until date but nothing acts on it, and the only scheduled job was
  removed with v8.8. The section now states that data is kept until deleted by
  hand and that deletion is honoured on request.
- **Response time.** None published, per the brief.
- **Role.** Managing Director for Kenya at HOSTAFRICA, as already published in
  his own article. Statutory-director status remains unanswered and no claim
  is made either way.
- **Registrar named.** EACdirectory.co.ke, founded 2005, run for seventeen
  years, **acquired by HOSTAFRICA in 2022** — which materially strengthens the
  disclosure, since the employer is also the acquirer of the company he built.

TO CONFIRM markers reduced from 42 to 24, all now genuinely blocked on facts
or professional review.

### Not yet applied

Cloudflare Web Analytics and Google Analytics via Tag Manager are both wanted
but not installed. The privacy notice still states truthfully that the site
runs no analytics, and carries a note that it will be updated in the same
release that enables any.

## v2.3.0 — 1832hrs:16th August2026

About page biography written, replacing the placeholder guide statement.

### Sourcing

Brief section 2 forbids publishing an unverified biography, and section 23
requires approved facts. **Every biographical claim on the page is taken from
Wycliffe's own published articles on this site**, already public under his
name. Nothing is inferred, rounded or embellished:

- ".ke domain registrar in 2005, ran it for seventeen years, acquired in 2022"
  — /insights/17-years-running-infrastructure
- "Managing Director for Kenya at HOSTAFRICA" — his own disclosure line in
  /insights/freelancers-guide-to-ethical-domain-management-in-kenya
- "in hosting since 2005" — repeated across three articles

An apparent contradiction was checked and resolved: "seventeen years" refers
to the registrar he ran from 2005 to 2022, and "since 2005" to the whole
period. Both are his wording and they agree. The page says "two decades" and
avoids computing a precise current figure, which would be a new claim.

Deliberately absent: the registrar's name, who acquired it, any
certification, award, client name or performance figure. None appear in the
source articles, so none are published.

### Changed

- The placeholder "Replace this with verified biography details" text is gone.
- The internal approval-gate notes are gone from the public page.
- The HOSTAFRICA disclosure is now stated directly rather than deferred, and
  points to the Commercial Relationships page for the full position.

## v2.2.0 — 0718hrs:16th August2026

The remaining three legal drafts written, completing brief section 25.

### Commercial Relationships (8 sections)

States the HOSTAFRICA relationship as a disclosure a client should have, and
separates what is contracted with Onduu from what is supplied by the
infrastructure provider. Confirms from the code that **this site forwards no
enquiry to any supplier** — there is no routing, integration or lead-sharing
mechanism, matching the routing rule in brief section 24.

Makes **no statement in either direction about commission or referral fees**,
because that is unresolved. Wycliffe's exact title and director status are
marked TO CONFIRM rather than asserted.

### Assessment Terms (11 sections)

Describes what an assessment observes (public DNS and pages, plus what you
declare) and what it explicitly never does: no penetration testing, no
vulnerability scanning, no login attempts, no production-form submission
without permission, no restore outside an agreed environment, no
certification. Carries the four evidence labels and states plainly that a
clean result does not prove a domain, mailbox or business is secure.

### Managed Service Terms (12 sections)

Opens by stating the service **is not yet contracted or priced** and that the
page creates no obligation. Support hours, response targets, pricing, incident
notification and offboarding terms are placeholders. The agent section records
the hard limits: no publishing, no customer contact, no DNS or production
changes, no irreversible action, and a defined way to stop it.

### Checks

No pricing appears on any page. No compliance, security or availability
guarantee is claimed. All four legal routes stay marked as drafts.
**Together the four pages carry 42 TO CONFIRM markers.**

## v2.1.0 — 0710hrs:16th August2026

Privacy notice draft written.

Fourteen sections covering everything brief section 25 requires: controller
identity, information collected, purpose and lawful basis, cookies and
analytics, the checker, processors, data locations and transfers, retention,
security, rights, consent withdrawal, complaints, and version.

**Every factual claim was checked against the code that runs the site**, not
assumed:

- the exact form fields, from worker/submissions.ts;
- 730-day retention, from the retain_until calculation;
- that logs carry only an event name, form type and reference;
- that the abuse counter stores a one-way hash of the connection address;
- that the endpoint refuses submissions when its spam check is unconfigured;
- that /check writes nothing to any database;
- that the site runs no analytics, no ad tags and no tracking cookies;
- that the ZeptoMail notification contains no personal data.

It states plainly that data may be processed outside Kenya, since the site
runs on a global network, and it makes no claim of compliance, security or
guarantee — all forbidden by section 2 of the brief.

**21 TO CONFIRM markers** flag what only the owner can supply: legal entity
details, ODPC registration, retention preference, response-time commitment
and the ODPC complaint route. The page remains marked as a draft.

## v2.0.0 — 0654hrs:16th August2026

**Publication gates lifted.** The owner reviewed and approved the previously
gated pages, so the whole site is now public.

### Published

- `/managed-website-operations`
- `/solutions/agent-workflow-pilot`
- `/infrastructure` and both child pages
- `/results`

For each: the internal "PREVIEW / APPROVAL GATE" banner removed, noindex
removed, robots disallow removed, added to the sitemap, and linked from
navigation. `GATED_ROUTES` is now empty.

### Changed

- Primary navigation restored to brief section 7, including Managed
  Operations.
- Footer expanded to the full brief structure: Managed Operations and Agent
  Workflow Pilot under Solutions; Kenyan Infrastructure, Buzz and Agent
  Collaboration and Results under Explore; all four legal routes under
  Company.
- `/legal/assessment-terms` and `/legal/managed-service-terms` are no longer
  orphans — they were in the sitemap but linked from nowhere.
- Homepage: the Managed Operations and Agent Workflow Pilot solution cards
  restored, and the evidence section links to /results again.

### Unchanged

- The four legal pages remain clearly marked as **drafts** awaiting
  professional review. Publication of the commercial pages does not change
  their status.
- Homepage section 07 stays removed, as requested separately.
- The About biography is still the generic guide statement; brief section 23
  requires approved facts before it is replaced.

Sitemap now lists 32 URLs. A crawl from the homepage reaches 33 pages, all
200 — every page on the site is now reachable by following links.

## v1.4.0 — 0648hrs:16th August2026

Removed the public "PREVIEW ONLY" badge from the homepage.

The badge marked homepage section 07, which described Managed Website
Operations — a gated offer. The brief allows unapproved commercial copy to be
either labelled as draft or hidden, so deleting the badge alone would have
left unmarked managed-agent copy in public, which is the one combination not
permitted. The whole section was removed instead, consistent with hiding the
Managed Operations route.

- Homepage section 07 (After launch / Managed Website Operations) removed.
- Remaining sections renumbered: Evidence 08 to 07, Your next step 09 to 08.
- No "PREVIEW ONLY" text, no gate-inline element and no managed-agent copy
  remain on the homepage. Verified on onduu.ke.

To restore it later, the section needs approved public-facing copy rather than
an internal review note. The Managed Website Operations page itself is
unchanged and still reachable for review at /managed-website-operations.

## v1.3.3 — 0614hrs:16th August2026

Collapsed the empty Turnstile gap on both forms.

Turnstile injects a wrapper with an explicit ~72px height even when it solves
invisibly and draws no iframe, leaving a blank band between the consent
checkbox and the submit button.

- `.turnstile-slot:not(:has(iframe)){display:none}` hides the slot only while
  there is nothing to show. If Turnstile ever draws a real challenge the
  iframe appears, the selector stops matching and the widget is displayed —
  a challenge can never be hidden from a visitor.
- The hidden token input still submits; `display:none` does not exclude a
  field from FormData.

Verified on onduu.ke: slot height 72px to 0, spacing now the ordinary 22px
grid gap, and a live submission through the hidden slot still succeeded
(reference ON-260816-QN3R, row confirmed then deleted).

## v1.3.2 — 0610hrs:16th August2026

Fixed form field alignment.

The required-field asterisk was rendered as a separate flex child of the
label, so it wrapped onto its own line and pushed that field's input down.
Because only some fields are required, inputs stopped lining up across the
two-column grid — Company sat lower than Role, and so on.

- Label text and the asterisk are now a single element, so the marker reads
  inline: "FULL NAME *".
- Controls are bottom-aligned within each label, so inputs line up across a
  row whatever the label length. Long labels that wrap to two or three lines
  no longer knock their row out of alignment.
- The consent checkbox aligns to the first line of its text rather than
  centring against the wrapped paragraph.

Verified on the production build and then on onduu.ke: full_name/business_email
and company/role each share an identical top edge. The checker form on /check
was checked too — input and button share a row at matching height.

## v1.3.1 — 0546hrs:16th August2026

Fixed: clicking any menu item did nothing.

### The fault

vinext's `<Link>` is broken in the **production build**. Clicking one threw
`TypeError: e is not a function` from inside its startTransition handler and
the navigation never happened. Every link in the header, footer, homepage and
article pages was inert for real visitors.

Direct URLs always worked, which is why the earlier link crawl passed — curl
tests server responses, not clicks. The dev server also worked, which is why
local testing missed it. **The bug only appears in the built output.**

Upgrading vinext 1.0.0-beta.2 → 1.0.0-beta.6 (with @vitejs/plugin-rsc 0.5.34)
did **not** fix it; the error simply moved. That upgrade was reverted.

### The fix

- `app/nav-link.tsx` — a plain `<a>` replaces `next/link` everywhere. Every
  click is now an ordinary page load, which cannot fail to navigate. The
  `link-*` chunk is gone from the build entirely.
- This also matches the brief's "minimal client JavaScript" requirement
  (section 28). If vinext fixes client navigation, reverting is one file.

### Verified

- Clicked through the live site, not just curl: How it works, Solutions,
  Insights and an article all load correctly on onduu.ke.
- Production build tested locally via `npm start` before deploying — the step
  that was missing when this bug shipped.
- Forms, checker, feeds and all 26 internal links still fine.

## v1.3.0 — 0006hrs:16th August2026

Page content built out against the brief, and the site-wide link audit.

### Added

- `app/pages-brief.ts` — exact approved copy from brief sections 10, 11, 12,
  13 and 25, merged over the prototype copy by `app/site-pages.ts`.
  `/readiness` and `/how-it-works` had no sections at all; they now carry the
  evidence labels, output list, process, stages, deliverables and boundaries
  the brief specifies.
- Legal routes now carry the coverage list from section 25, clearly marked as
  drafts awaiting professional review, with a direct route for data questions.
  No legal conclusions are invented.
- 301 redirects for `/email-security` and `/email-security/glossary`, the v8.8
  URLs still linked from two migrated articles and indexed by search engines.
  `/email-security` was the checker, so `/check` is its successor.

### Verified

- **Contact form end to end in production**: submitted, Turnstile passed,
  row written with all contact-specific fields, confirmation rendered,
  test row deleted. Both forms are now proven, not just the assessment one.
- **Every internal link on the site resolves** — 26 pages crawled, no
  non-200s. The only external non-200 is LinkedIn returning 999, which is
  its standard bot response, not a broken link.
- Gated routes remain reachable by direct URL for review but are noindex,
  robots-disallowed and unlinked.

## v1.2.0 — 2348hrs:15th August2026

Implements the outstanding items from the definitive brief
(ONDUU_DEFINITIVE_WEBSITE_CONTENT_AND_LLM_BUILD_BRIEF_2026_08_15.pdf).

### Added

- Working assessment and contact forms, replacing the non-submitting
  prototypes. Field lists and copy are taken from brief sections 10 and 24;
  confirmation and error wording from section 8.
- `POST /api/submit` with server-side schema validation, allowlists, field
  length limits, server-side Turnstile Siteverify, hourly per-client rate
  limiting, prepared D1 statements and a generic success response carrying a
  reference ID. **Fails closed** (503) when Turnstile is unconfigured.
- `onduu-leads` D1 database and migration `0001_leads.sql`. Consent is stored
  as text plus version and timestamp, not a bare boolean, with a
  `retain_until` column so retention can be enforced.
- `sitemap.xml`, `rss.xml` and `robots.txt` (brief section 26, and the
  minimum viable release). Canonical URLs and Open Graph tags on every page.
- 16 further tests covering validation, allowlists, references, feeds and the
  publication gates. 46 total.

### Changed

- Publication gates now **hide** rather than label: Managed Website
  Operations, Agent Workflow Pilot, Infrastructure and its two children, and
  Results are noindex, disallowed in robots, absent from the sitemap and
  removed from navigation and the homepage. Legal routes stay public as
  marked drafts because the forms must link to a privacy notice.
- Removed the orphaned 02:23 cron trigger. The Worker exports no scheduled
  handler, so every nightly run would have failed.

### Notes

- **The forms cannot accept submissions until a Turnstile widget exists.**
  Create one for onduu.ke, then set `TURNSTILE_SECRET` as a Worker secret and
  `NEXT_PUBLIC_TURNSTILE_SITE_KEY` at build time. Until then the form shows a
  notice and the endpoint returns 503 rather than accepting unprotected data.
- Email notification reuses the existing `ZEPTOMAIL_TOKEN` and needs
  `NOTIFY_EMAIL`. The notification carries only the reference and form type —
  no personal data.
- The brief states the site must not be publicly deployed until the approval
  gates are resolved. It is deployed, at the owner's direction.

## v1.1.0 — 2303hrs:15th August2026

Restored `/check`, the free email security checker, and corrected the deploy
configuration.

### Added

- `/check` — reads a domain's published SPF, DKIM, DMARC and MX records over
  DNS-over-HTTPS and grades them in plain language, with prioritised fixes.
  Public DNS only: no credentials, no mailbox access, nothing stored.
- `GET /api/check` handled in the Worker ahead of the app router; other methods
  return 405. Needs no bindings and no state.
- 21 offline tests over the analysers (`tests/email-check.test.mjs`) covering
  the SPF 10-lookup budget, recursive include expansion, include loops, dead
  includes, partial-pct DMARC and the provider-selector DKIM gap. 30 tests
  total across the suite.

### Changed

- `wrangler.jsonc` now names **`onduudotke`**, the Worker that actually serves
  onduu.ke. It previously named `onduu-ke`, so `wrangler deploy` created a
  second Worker on workers.dev and production never received the deploy.
  Workers Builds was unaffected — it deploys to the Worker it is bound to.

### Removed

- The stray `onduu-ke` Worker, created by the misnamed config. It held only
  three deployments from today and served no custom domain.

### Notes

- Workers Builds is **disconnected** — deleting and recreating the GitHub repo
  broke the link — so pushing to `main` no longer deploys. Until it is
  reconnected, releases are manual:
  `rm -rf dist .vinext && npm run build && npx wrangler deploy -c dist/server/wrangler.json`.
  The clean step matters: a stale `.vinext` cache silently produced a build
  with `/check` missing entirely.
- `/glossary`, `/tools` and `/domain-search` remain 404 by decision. They are
  not being rebuilt.

## v1.0.0 — 2140hrs:15th August2026

First release of the new codebase, versioned from scratch. It replaces the
previous Astro site: the 15 August 2026 website brief prototype becomes the
working site, and the only content carried over from the old build is the
Insights archive.

### Added

- Migrated all 11 live articles from `https://onduu.ke/insights/` into
  `app/insights-data.ts`. Prose was verified word for word against the source
  HTML; nothing was rewritten or summarised.
- `app/article.tsx` — article and insights-index renderers. Prose is stored as a
  block model (paragraph, h2/h3, ordered/unordered list, embed) and rendered as
  React elements, so no `dangerouslySetInnerHTML` is used anywhere.
- External article links now carry `rel="noopener noreferrer"`, `target="_blank"`
  and a screen-reader "opens in a new tab" note.
- `wrangler.jsonc` — single source of truth for Worker name, compatibility date
  and bindings, shared by `vite dev` and `wrangler deploy`.
- `IMAGES` binding, required by the `/_vinext/image` endpoint in
  `worker/index.ts`, which was previously undeclared.
- Real test suite in `tests/rendered-html.test.mjs`: renders through the built
  Worker and covers the homepage, insights index, article prose and metadata,
  the video embed, external-link safety and 404s.

### Changed

- Project moved from `onduu.ke/onduu-site/` to the repository root.
- `/insights` now lists the 11 real articles instead of the editorial-pillar
  shell.
- `vite.config.ts` reads bindings from `wrangler.jsonc` rather than an inline
  object, so dev and production cannot drift apart.

### Removed

- The three placeholder article shells (`developer-disappeared`,
  `contact-form-lead-leak`, `email-authentication-evidence`) from
  `app/site-data.ts`, superseded by the migrated articles.
- Unused starter scaffolding: `db/`, `drizzle/`, `.openai/`, `drizzle.config.ts`,
  `next.config.ts`, `app/chatgpt-auth.ts`, and the `drizzle-orm`, `drizzle-kit`
  and `@openai/sites-vite-plugin` dependencies. Nothing imported them.
- The starter's `_sites-preview` skeleton tests, which asserted against files
  deleted before this build and were already failing.
