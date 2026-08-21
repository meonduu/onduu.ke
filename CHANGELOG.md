# Changelog

CURRENT VERSION: v4.70.2 — 1447hrs:21st August2026

## v4.70.2 — 1447hrs:21st August2026

**"Reading public DNS and registry records…" no longer displays** on
`/kedomains`. Owner instruction.

The paragraph moves from `.check-note` to `.sr-only`, so it renders as a
clipped 1×1px box — confirmed absent from `document.body.innerText`
mid-search — while staying in the DOM as the `role="status"`
`aria-live="polite"` region. Deleting the text outright would have left
screen-reader users in silence during the wait: the visual affordance is
the progress bar above it, and a bar alone announces nothing. Sighted
users see the bar; assistive technology hears the sentence; neither is
worse off.

That paragraph held no other copy — it was empty except while loading —
so nothing else changed on the page.

**Left alone deliberately:** the two similar strings on `/scan`
("Reading public signals…" on the button, and the longer aria-live note).
That note also carries visible idle copy — "This reads public information
only. It touches nothing private and never asks you to log in." — which is
a reassurance worth keeping on screen, so it is a different case rather
than the same one twice. Say the word if it should go too.

Verified with a live search: phrase absent from the rendered page, results
still returned.

231 tests pass.

## v4.70.1 — 1428hrs:21st August2026

**Tighter copy on `/kedomains`**, owner instruction.

- Search button: "Search with the .ke twin" → **"Search"**. The twin
  behaviour is what the results demonstrate; the button only needs to say
  what pressing it does.
- Lede: the two-clause explanation of the mechanism becomes **"Owning one
  without the other leaves the door open to cybersquatting."** — the
  consequence rather than the method, which is what the headline above it
  is asking about. Lower-case "cybersquatting" per house style; it is a
  common noun, not a proper one.

The mechanism it dropped is not lost: the section immediately below still
explains that a search checks the pair, and `/legal/tool-limitations`
states it precisely.

231 tests pass.

## v4.70.0 — 1412hrs:21st August2026

**An available domain now routes to HOSTAFRICA's checkout**, not the panel
home page. Owner instruction, 21 August 2026. `REGISTER_URL` becomes
`panel.hostafrica.com/checkout/0`, keeping the same UTM attribution and
still carrying no affiliate parameter — the standing rules are unchanged
and still enforced by `tests/domains`.

Scope confirmed with the owner before implementing, because "redirected"
had two readings: the links change, the `/kedomains` tool stays. Redirecting
the page itself would have removed one of the three free tools the
18 August article is built around.

**The searched domain does not carry through**, and the result copy now
says so: "Confirm and register at HOSTAFRICA's checkout, where you enter
the name again." Four parameter names appeared to work
(`domain`, `query`, `search`, `sld`+`tld`) but a control test with a
nonsense parameter reflected identically — the checkout echoes any query
string into its own state without pre-filling the search. If HOSTAFRICA
publishes a real pre-fill parameter, adding it to `REGISTER_URL` is the
whole change; the comment there says so.

Guard: `tests/domains.test.mjs` now pins the checkout path as well as the
attribution rules. Both destinations are the approved host with identical
UTMs, so the difference is invisible in review and needs a test rather
than an eye.

Verified with a live search on the dev server: an available result renders
the checkout link, attribution intact.

231 tests pass.

## v4.69.0 — 1338hrs:21st August2026

**A contents list for the long legal pages.** `/legal/privacy` runs
fourteen sections and about 26 phone screens; finding "who else processes
it" meant thumbing through the whole notice. It and
`/legal/assessment-terms` (twelve sections) now open with a numbered
contents list, its numbers matching the ones each section already shows.

- **Real anchors, not just navigation.** Each section gains a readable id
  derived from its eyebrow, so a clause can be linked directly —
  `/legal/privacy#who-is-responsible` — which matters for a page a lawyer
  or a client may need to point at. Ids are de-duplicated, and generated
  from the same source as the list, so the two cannot drift apart.
- **Threshold, not a per-page flag**: eight sections or more. A page that
  grows past it gets a contents list without anyone remembering to ask,
  and the four short pages correctly do not have one.
- No JavaScript: plain anchors, `scroll-behavior` already sitewide, with
  `scroll-margin-top:18px` so a heading does not land flush to the
  viewport edge. Links are 34px tall — standalone navigation, so WCAG
  2.5.8's inline exception does not apply.
- Two columns on desktop via multi-column so entries read **down** each
  column as a contents list should, balancing automatically at eight
  entries or fourteen; one column on a phone, where all fourteen fit a
  single screen.

Caught in preview: globals.css carries a bare `nav{display:flex}` for the
header, which caught this nav too and stood the label beside its own list
until `.jump-list` was forced back to `display:block`.

Guard: `tests/jump-list.test.mjs` — every contents link resolves to a
section on the page, ids are unique, and short pages stay bare. Verified
by stripping the ids from the renderer, which fails it. Note that
renaming a section heading does **not** fail it, and should not: both
halves derive from one source, so the anchors follow the heading.

231 tests pass.

## v4.68.1 — 1246hrs:21st August2026

**Two mobile layout fixes on the legal pages**, from a 375px review of all
four.

- **The draft banner label was crushed.** `.gate` is a flex row, so
  "PREVIEW / APPROVAL GATE" was squeezed into **59px and wrapped over four
  lines** — it needs 222px to sit on one. This is the first thing a reader
  meets on the most sensitive pages, and it looked broken rather than
  deliberate. Below 620px the banner now stacks: label on one line, its
  explanation at full width beneath. Measured 59×54 (4 lines) → **323×14
  (1 line)**.
- **The heading hierarchy had collapsed.** H1 and H2 both bottomed out at
  their clamp minimums on mobile — 34px against 30px, a **1.13×** ratio
  where desktop has 1.27×. On a fourteen-section notice that difference is
  what tells a scrolling reader whether they are at the top of the
  document or the middle of it. The H2 minimum drops 30px → 26px, giving
  **1.31×**, with line-height nudged 1.1 → 1.12 for the smaller size.

The H2 change is sitewide and affects widths below ~937px: identical at
1100px and above, 28.8px instead of 30px at 900px, 26px below 812px. That
removes a hard floor in favour of continuous scaling, checked at 375, 768
and 1440.

Checked and left alone: no horizontal overflow on any of the four pages,
18px/30.6px body copy that reads well on a phone, and the single section
numbering from v4.68.0 holding.

Noted, not changed: `/legal/privacy` is 21,241px on mobile — about 26
screens. That is inherent to a thorough notice; a jump-list of its
fourteen sections would help navigation if the owner wants one.

228 tests pass.

## v4.68.0 — 1204hrs:21st August2026

**Four pages were printing their section numbers twice**, and the hero
scorecard carried 7.2px text. Both found by a mobile sweep of thirteen
routes, neither visible in the source alone.

- **Doubled numbering.** `StandardPage` prints the section index itself
  (`{i+1} / {eyebrow}`), and 33 eyebrows in the page data carried a
  hand-written number as well — so `/legal/tool-limitations` read
  "01 / 01 / EMAIL SECURITY CHECK", and `/legal/privacy`,
  `/legal/assessment-terms` and `/about` read "02 / 01 / …". It survived
  every review because the fault exists only in the rendered output: the
  data looks right in isolation, and so does the renderer. Numbering is
  the renderer's job; the data now supplies the label only.
- **7.2px in the scorecard.** `.priority-title` is 9px and its `<small>`
  child inherited the browser's 0.8em default, making "Evidence status"
  the smallest text on the site — inside the homepage's visual
  centrepiece. Now pinned to 9px. Note the tap-target guard's font-size
  sweep could not have caught this: 7.2px was never declared in the CSS,
  only computed.

Guard: `tests/docs-consistency.test.mjs` now fails if any eyebrow carries
its own index. It immediately earned its place — the first strip pass
matched only the quoted-key style in `pages-brief.ts` and missed five
unquoted entries in `pages-strategy.ts`, which the guard named.

Also verified across the same thirteen routes: **no horizontal overflow
anywhere** at 375px, and every other sub-11px string is the intentional
uppercase eyebrow/section-number label style.

228 tests pass.

## v4.67.2 — 1128hrs:21st August2026

**The six dimension cards no longer waste half their height.** Owner
review: each card held its number top-left, then 58px of nothing, then the
title — inside a 220px minimum — so "01" and "Control" sat a full empty
band apart and two-thirds of every card was blank.

Each card is now a small grid: number and title share the first row on a
common baseline, the question spans the second, and the card is as tall as
its text. `min-height:220px` and `h3{margin-top:58px}` are gone; the
number goes 9px → 10px with light tracking so it reads as a label beside
the 30px title rather than a speck above it; right padding keeps the
question clear of the corner arrow. Desktop cards 250px → **158px**, the
whole grid ~500px → **316px**. Verified at 1440px and 375px, no overflow.
No markup change.

227 tests pass.

## v4.67.1 — 1102hrs:21st August2026

**The interior pages had the hero's crowding one level down.** Checking
the v4.67.0 change across eight interior pages confirmed the 18px
eyebrow-to-H1 gap propagated everywhere — and found that every content
section repeats the original defect between its own pair: the
section-number ("01 / WHY THIS EXISTS") measured **0px** above its h2 on
every page checked.

`.section-number` gains `margin-bottom:12px` — 12 rather than the hero's
18 because section h2s run 30–46px against the hero's 64px, so the air
scales with the type it serves. Verified harmless in the two grid
contexts where the number sits beside content rather than above it (the
homepage section-intro and the stakes band): side-by-side placement is
set by grid columns, not by this margin.

Verified on the dev server at 1440px: content sections 0 → 12px, grids
intact. 227 tests pass.

## v4.67.0 — 1040hrs:21st August2026

**Hero typography: the eyebrow gets air, the H1 gets breathing room.**
Owner review of the desktop hero found the "01 · Digital fitness" kicker
sitting 6px above the 64px headline — the 28px bordered box practically
resting on the H1's ascenders, and tighter above the headline than the
14px below it, so the label looked more bonded to the H1 than the H1's
own lede did.

- Eyebrow gap 6px → **18px** on desktop, 12px below 620px (proportionate
  to the 38px mobile H1). Shared with the page-hero and article-head
  eyebrows, so every page benefits.
- H1 line-height 1.02 → **1.08**: the headline wraps to two lines, and at
  1.02 Georgia's long descenders ("digitally") nearly rested on the caps
  of "business?".
- H1 letter-spacing −.03em → **−.015em**: more tightening than Georgia
  tolerates, hardest at the 38px mobile size where serifs began to touch.
- Eyebrow 10px → **11px on desktop only**. Two scoping corrections found
  by looking rather than assuming: bumping the shared rule made the
  narrow section-number columns wrap ("02 / THE HIDDEN OPERATIONAL /
  GAP"), so section-numbers keep 10px; and 11px broke the mobile hero
  eyebrow onto two lines with "BUSINESSES" orphaned under the 01 box, so
  mobile keeps 10px too.

Georgia itself stays, deliberately: a webfont would buy a more
distinctive face with 30–60KB, layout shift and a new dependency, against
a site whose credibility partly is its performance discipline.

Verified with before/after screenshots at 1440px and 375px. 227 tests
pass.

## v4.66.4 — 0956hrs:21st August2026

**Sitewide tap-target sweep: 24 routes measured at 375px, one real defect
found.** The category is now closed rather than being discovered one page
at a time.

The one failure: the **article back-link** ("← All insights") was the 15px
line box of 10px text — standalone navigation, so WCAG 2.5.8's inline
exception does not cover it. Now `padding:6px 0` for 27px, with the bottom
margin reduced 34px → 28px so the article's opening rhythm is unchanged.

Also raised, though it was already compliant: the **consent checkbox**
22px → 24px. Its `<label>` wraps the input, so the activation target was
always the full 323×63 row; 24px means the exemption never has to be
argued. Worth correcting the record from v4.64.2, which called the
privacy-notice link "the genuine 2.5.8 failure" of that batch — it is
inline, inside the consent sentence, and therefore exempt. The header CTA
at 8px was the real defect there.

**Everything else measured clean.** The remaining sub-24px hits are all
covered by 2.5.8's Inline exception — prose links in articles, on /scan
and in the consent sentence, whose size is constrained by the line-height
of the text around them. No route overflows horizontally.

Method worth recording, since two attempts were wrong first: measuring
pages inside an offscreen iframe reported the hidden desktop nav as
visible (stylesheet not yet applied), and a same-origin iframe against
production is blocked outright by the site's own `X-Frame-Options: DENY`.
What worked was swapping each route's `<main>` into a real 375px viewport
that already had the stylesheet loaded, with a sanity assertion that the
desktop nav computed to `display:none` before trusting a single number.

Guard: `tests/tap-targets.test.mjs` pins the five CSS rules that set these
sizes, matching declarations individually because the build reorders them.
Verified by removing the footer padding and restoring the 8px CTA — both
failed, each naming its rule. It deliberately does not pin the exempt
cases; pinning them would invite someone to "fix" what is already correct.

227 tests pass.

## v4.66.3 — 0924hrs:21st August2026

**Footer links were the smallest tap targets on the site.** Found while
checking the footer change on a phone viewport: all seventeen navigation
links were the bare 18px line box of 12px text, separated by 12px — below
the 24px minimum in WCAG 2.5.8, and the Legal column stacks four of them,
so "Privacy" and "Assessment Terms" were a mis-tap apart.

`footer>div:not(.footer-brand) a` gains `padding:7px 0`, taking every link
to **32px** (50px for the three that wrap), and the column gap drops
12px → 2px so the extra height mostly absorbs into space that already
existed. Measured before and after at 375px: 17 links under 24px → **0**,
footer 799px → 839px. Desktop unchanged in kind (same 32px, no overflow).

This is the third tap-target defect found the same way this week, after
the mobile menu (v4.48.x) and the header CTA and privacy link (v4.64.2) —
each one invisible until someone looked at the real thing at 375px rather
than trusting the desktop layout.

225 tests pass.

## v4.66.2 — 0902hrs:21st August2026

**The HOSTAFRICA directorship comes out of the sitewide footer**, on the
owner's instruction. Removed: "Wycliffe is Managing Director of HOSTAFRICA
Kenya; HOSTAFRICA provides, bills and supports its own products. Material
commercial relationships are disclosed at the relevant decision point."
The footer keeps the operator identity — "Onduu is operated by Ujiajiri
Enterprises Limited" — which is the controller line the privacy notice
depends on.

This does not weaken the disclosure rule. CLAUDE.md requires the
relationship to be disclosed "at the decision point where they matter —
not only on a legal page", and a sitewide footer is the opposite of a
decision point: the place a repeated notice stops being read. Verified
still present where a reader is choosing to act:

- `/paths/hostafrica-infrastructure`, beside the outbound CTA
- `/kedomains`, beside the registration links
- `/about`, and in full on `/legal/commercial-relationships`
- inline in the two Insights articles that link to HOSTAFRICA

The first two are pinned by tests and were already; `tests/seo-and-gates`
had also asserted the footer copy, so it was narrowed to the operator
line, with the reasoning recorded beside it and a note that the owner may
restore the footer sentence without breaking a test. What must never
disappear is the decision-point disclosure, and that stays asserted
rather than assumed.

225 tests pass.

## v4.66.1 — 0842hrs:21st August2026

**A false sharing denial removed from the assessment page.** The owner
spotted it: `/digital-fitness` said "Nothing you enter here is shared with
Ujiajiri or anyone else" while the privacy notice names Ujiajiri
Enterprises Limited as the company that receives and answers every
enquiry — and the notification email now lands at info@ujiajiri.ke. The
sentence dated from before 20 August, when "Ujiajiri" on this site meant
only the partner-introduction pipeline; the controller decision made it
false and nobody swept this page (L4, on a visitor-facing legal claim).

The true promise — nothing reaches an independent provider or HOSTAFRICA
without your approval — is now said that way: "Your answers are seen only
inside Ujiajiri Enterprises Limited, which operates this site."

A sitewide sweep for absolute sharing denials found two more instances of
the same broken shorthand on `/contact` ("It reaches Onduu and nobody
else", "goes to Onduu only") — not false in context, since that page
correctly explains the operator two paragraphs earlier, but leaning on the
same Onduu-vs-Ujiajiri split; both now name the operator. The internal
processing register carried the same shorthand and is aligned. Checked
and left alone as accurate: the qualified report-delivery promise in the
assessment terms ("never sent … without asking you first"), the
introduction-procedure claims, the privacy notice's attribution line, and
the /go dashboard note.

Guard: the routing-promises test now fails if any copy on the assessment
page denies sharing with the operator, and requires the corrected
receiver statement.

225 tests pass.

## v4.66.0 — 0812hrs:21st August2026

**Migration 0009 applied to production; the `kind` shim retired.**

The owner applied `migrations/0009_kind_fitness.sql` at 04:56 UTC — the
safest moment it will ever have, with `submissions` at zero rows. Verified
directly afterwards: the constraint reads
`CHECK (kind IN ('fitness', 'contact', 'readiness'))`, all four indexes
were recreated, and a direct `'fitness'` insert succeeded and was removed.

With the database now speaking the site's vocabulary:

- **`storageKind()` is deleted**, as its own comment promised: it existed
  only to translate `fitness` back to `readiness` at the D1 boundary while
  the old constraint stood. New rows store `fitness`.
- `normaliseKind()` **stays**: a browser tab from before the rename still
  posts `readiness`, and the constraint deliberately keeps that value
  legal for exactly this reason.
- The terminology guard drops the storage-shim exemption; two shims
  remain (the wire-compat mapping and the psr-v1 dimension label).
- `tests/kind-schema.test.mjs` now checks the **final** constraint — the
  end state of a fully migrated database — rather than demanding every
  historical CHECK hold at once, which would forbid ever widening one.
  The rule that survives from the incident: a migration that widens a
  constraint ships to production in the same release as the code that
  relies on it, never merged and left pending.

Verified live end to end after deploy: one submission stored with
`kind='fitness'`, notification sent, light green, test row deleted.

225 tests pass.

## v4.65.6 — 0748hrs:21st August2026

**Notification incident closed: the light is green.** With `NOTIFY_TO`
corrected to a plain address, a live submission delivered end to end —
`sent`, no error code, 04:37 UTC. Root cause of the entire 20 August
failure: a malformed `NOTIFY_TO` value, hidden behind a `401` that reads
as an auth error.

`OPERATIONS.md`: the open incident section is closed, and the episode is
distilled into **L10** — one error code hid four causes; make the failing
system report its own state before theorising. Dashboard-pasted bindings
are hostile input: trim and shape-check every one at the point of use,
which `notify()` now does.

Docs only; no behaviour change. 225 tests pass.

## v4.65.5 — 0738hrs:21st August2026

**SM_113 survived the trim, so name the malformed binding.** The
malformation is more than whitespace, and it can sit in either address:
ZeptoMail's SM_113 covers the recipient fields too, while the light only
ever showed the sender's domain. Both `NOTIFY_EMAIL` and `NOTIFY_TO` are
now checked against the same shape rule the enquiry form uses, before any
send; a failure reads `bad address shape: NOTIFY_TO` on the light. Shape
only — no address is ever logged. A display name, a second address, or a
stray character all get called out by binding name instead of surfacing
as another anonymous TM_4001.

225 tests pass.

## v4.65.4 — 0728hrs:21st August2026

**Found it: `SM_113` — the `from` address itself was invalid.** The first
test after the sub_code capture shipped read
`401 TM_4001/SM_113 ujiajiri→ujiajiri.ke`. SM_113 is ZeptoMail's
"Mandatory Field 'from' has Invalid Value": not the token, not the domain,
not the account — the `NOTIFY_EMAIL` value is malformed, which a trailing
newline from a dashboard paste produces while remaining invisible on
screen.

The token was already trimmed (v4.65.1); the addresses were not.
`NOTIFY_EMAIL` and `NOTIFY_TO` are now trimmed at the same point, closing
the class rather than the instance: every pasted binding this path reads
is now whitespace-proof.

The evening in one line: one `401 TM_4001` hid four causes, and each
diagnostic release eliminated one — agent pairing (v4.65.0), token
whitespace (v4.65.1), sender domain (v4.65.2) — until capturing the
sub_code (v4.65.3) named the real one on the next attempt.

225 tests pass.

## v4.65.3 — 0034hrs:21st August2026

**Capture what ZeptoMail actually says.** With the pairing proven correct
— the light read `401 TM_4001 ujiajiri→ujiajiri.ke`, matching token and
sender — the sender explanation was disproven too, and the sub_code that
would settle it was not being captured.

TM_4001 carries four sub_codes meaning four unrelated things: sender
domain unverified (SM_111), invalid `from` value (SM_113), account not yet
approved (SM_128), or an invalid Sendmail token (SERR_157). Guessing
between them is what cost the evening.

The identifier is now matched wherever it appears in the body, falling
back to ZeptoMail's own message with any address redacted — the body can
echo `from` and `to`.

225 tests pass.

## v4.65.2 — 0025hrs:21st August2026

**`401 TM_4001` is a sender error, not an auth error.** Checked against
Zoho's own documentation instead of inferred from the HTTP status: TM_4001
with sub_code `SM_111` means *the sender address domain is not verified in
your Agent*. The 401 reads like a rejected credential, and was treated as
one for most of 20 August — including a token regeneration that was never
going to help.

ZeptoMail authenticates per Mail Agent and each agent sends only from its
own domain, so the token and `NOTIFY_EMAIL` are one setting in two places.
`Onduu_ke`+onduu.ke and `ujiajiriKE`+ujiajiri.ke are the only two valid
pairings here; any crossing gives this error.

The failure now records `sub_code`, the token's binding, and the sender's
**domain** — never the address — so the light reads
`401 TM_4001/SM_111 ujiajiri→onduu.ke`: both halves of the pairing that
must match, stated plainly, rather than an auth-shaped error to be guessed
at.

225 tests pass.

## v4.65.1 — 0012hrs:21st August2026

**Make the notification failure say which token it used.**

With the ujiajiri token in place as an encrypted secret and the sender on
the matching domain, the send still returned `401 TM_4001` — and ZeptoMail's
own agent view still showed 6 sent, unchanged, so the request never
authenticated. From outside there was no way to tell whether the new
binding was being read at all.

- The token is now `.trim()`ed. A value pasted with a trailing newline or
  space makes a malformed Authorization header and the very same
  `401 TM_4001` — a third cause behind one symptom, so the cheapest one is
  eliminated in code rather than by eye.
- The failure log now carries `tokenSource` (which binding supplied it),
  `tokenLength`, and whether the `Zoho-enczapikey` prefix is present —
  **never the token**. The health row records the source too, so `/go`
  shows `failed 401 TM_4001 (ujiajiri)` rather than leaving the question
  open.

225 tests pass.

## v4.65.0 — 2359hrs:20th August2026

**The enquiry notification path, diagnosed properly at last.**

ZeptoMail authenticates **per Mail Agent**, and each agent may send only
from the domain associated with it. This account has `Onduu_ke` (onduu.ke)
and `ujiajiriKE` (ujiajiri.ke). The token and `NOTIFY_EMAIL` must therefore
be chosen together — a token from one agent with a sender from the other
fails, whichever way round.

That is why the day's diagnosis kept missing: **an unusable token and a
mismatched sender return the identical `401 TM_4001`**. Testing two
different verified senders against the same token — both failing the same
way — is what finally separated them, because a sender problem would have
succeeded for one of the two.

- `notify()` now prefers `ZEPTOMAIL_UJIAJIRI_TOKEN`, falling back to
  `ZEPTOMAIL_TOKEN`, so moving the sender back to onduu.ke later needs no
  code change. Without this the new binding would have been ignored
  entirely: the Worker read only the old name.
- `OPERATIONS.md` item 6 gains an audit rule learned the hard way: check
  the binding **type**, not only the names. The token first arrived as a
  plain-text Variable — stored unencrypted and readable by anyone with
  dashboard access — and `wrangler secret list` does not show plain-text
  vars at all, so it cannot audit this on its own. Now corrected to an
  encrypted Secret, with no plain-text copy left behind.
- `CLAUDE.md` secrets list updated, including `NOTIFY_TO`, which it had
  never named.

225 tests pass.

## v4.64.3 — 2334hrs:20th August2026

**Incident: the assessment form returned 500 in production for about forty
minutes, and it was my regression.**

v4.64.0 changed the stored form kind from `readiness` to `fitness`. The
`submissions` table has carried `CHECK (kind IN ('readiness','contact'))`
since migration 0001, and the rename never widened it. Every assessment
insert therefore violated the constraint, the handler's only 500 path,
from the v4.64.0 deploy until now.

What was and was not lost: nothing. The table was empty, and the failure
was **visible** — the visitor saw "your information has not been submitted
successfully", not a silent success. Slack and email were never reached,
because the insert precedes them. The `/go` light stayed on the earlier
`401 TM_4001` throughout, which is exactly why a light showing the last
outcome is not the same as a light showing current health.

**The fix**: `storageKind()` writes the old vocabulary to D1 while every
visitor-facing surface keeps saying Fitness. The database's `kind` is
internal — no page, email or report shows it — so the stored word is not
worth rebuilding a live production table over. `migrations/0009` widens
the constraint properly and is committed but **not applied**; applying it
needs the owner, and once applied `storageKind()` becomes the identity
function and both it and this note can go.

**Why no test caught it**: `tests/submissions.test.mjs` calls `validate()`
directly, and nothing in the suite has ever exercised the insert. The
application accepted a value its own database forbade and the two halves
were never compared. `tests/kind-schema.test.mjs` now compares them — it
parses the CHECK out of every migration and asserts that everything the
form accepts is storable under **all** of them, not merely the newest,
because a migration applied locally is not necessarily applied to
production. Verified by reintroducing the exact v4.64.0 bug and watching
it fail.

225 tests pass.

## v4.64.2 — 2258hrs:20th August2026

**Three mobile fixes found by checking the live site at 375px.** All three
predate the rename; none was introduced by it.

- **The primary CTA rendered at 8px.** `@media(max-width:620px)` shrank
  `.button-small` to fit the old, longer label, leaving the site's single
  most important control as the smallest text on the page — 68px wide,
  wrapped over four lines. It is now 10px at `.03em` tracking, two lines,
  115×49, which also clears the 44px tap minimum. The wordmark gives up
  the width (24px → 18px below 620px) rather than the CTA.
- **The consent checkbox was 18px.** Now 22px. Worth stating plainly: the
  first report of this called it an accessibility defect, and that was
  wrong. The `<label>` wraps the input, so the tap target was always the
  full 323×63 row — tapping the sentence toggles the box. The 18px square
  was cosmetic, and the fix is cosmetic.
- **The privacy-notice link was 86×16.** That one was a real target-size
  failure: WCAG 2.5.8 asks for 24px minimum and 16px does not reach it, on
  a legal link inside the conversion path. Now 90×37, using negative
  margin to absorb the added padding so the sentence keeps its rhythm.

Verified at 375px on the live site before the change and on the dev server
after; the 620–1000px and desktop breakpoints are untouched (11px, `.08em`,
24px wordmark, one line). No horizontal overflow at any width. The mobile
menu was already correct — 44px summary, 47px rows — and is unchanged.

222 tests pass.

## v4.64.1 — 2238hrs:20th August2026

**The version numbers now agree, and a test keeps them agreeing.**
`package.json` said 4.62.0 and `package-lock.json` still said 3.0.0 —
unchanged since the Astro migration on 18 August, twenty-four releases
back. Both are now 4.64.0.

Nothing reads either value at runtime, which is precisely how they
drifted this far unnoticed. A version nobody checks is a version nobody
can trust at the moment it finally matters: during an incident, or a
rollback, when the question is which build is actually running. So the
fix is not the bump — it is the guard. `tests/docs-consistency.test.mjs`
now asserts that both files match the `CURRENT VERSION` line in this
changelog, which is the source of truth. Confirmed to fail on a
deliberately stale value before being trusted.

222 tests pass.

## v4.64.0 — 2152hrs:20th August2026

**Digital Readiness becomes Digital Fitness.** Owner instruction,
20 August 2026. The vocabulary is now: the **Digital Fitness Assessment**
is the product, the **Digital Fitness Score** is the result, **Evidence
Coverage** remains the supporting measure, **Check Your Digital Fitness**
is the single primary CTA, and **How digitally fit is your business?** is
the central customer question — now the homepage H1 and the assessment
page title. The sixth dimension is **Agent Fitness**; the other five and
all scoring logic are untouched.

Structural, beyond the wording:

- **`/digital-fitness` is the route**, with `/readiness` 301ing to it.
  That redirect is load-bearing: `/readiness` carried the primary CTA from
  launch, so every header, hero and footer link ever published points at
  it, as do the sitemap entries search engines already hold.
- **The form kind is `fitness`**, and `readiness` is still accepted and
  stored as `fitness`. A visitor whose tab predates the deploy would
  otherwise have a valid enquiry rejected for a reason they could neither
  see nor fix.
- **Rubric bumped psr-v1 → psr-v2** and the scan cache pinned to the
  current rubric. Renaming a dimension id changes the scoring vocabulary;
  without the pin, a cached v1 result would render `agent-readiness` raw
  on a visitor's results page. Weights and signals are identical, so the
  same domain scores the same under both.

Claims, per the instruction that no result be presented as a certification
or an absolute verdict: the assessment page now states plainly that the
score is not a certification and does not declare a business digitally
fit, and that it is always shown with its Evidence Coverage because a
score drawn from a thin slice of evidence says less than the same number
drawn from a full one.

The 18 August tools article was regenerated rather than word-patched. Its
prose now says "a public fitness scan" and "agent fitness", the link to
`/scan` reads "fitness scan", and a dated postscript records the rename —
matching the convention the article already used when the DNS checker
joined on 19 August. A published, dated article that quietly rewrites its
own history is worse than one that says what changed, so the retired term
survives in that postscript by intent; the terminology guard excludes the
file for that reason, and its comment now says so.

**Deliberately not renamed**, because these are records rather than copy:
this changelog, `docs/strategy/` (dated source documents the source-of-truth
order depends on) and `docs/specs/parity-baseline.json` (a dated snapshot
read by nothing).

Two things found in local review and fixed before shipping: `/scan` still
said a high score at low coverage does not mean "the business is ready",
which was the retired framing; and the claims guard was passing for the
wrong reason — it leaned on trailing punctuation rather than recognising a
denial, so "no score certifies that a business is digitally fit" passed by
accident. It now finds every claim and requires a negation in the eighty
characters before it, and was confirmed to fail on an injected violation
before being trusted.

New guard `tests/fitness-terminology.test.mjs`: the old vocabulary cannot
return to live code, no visitor-facing page may render it, the 301 must
hold, and no page may claim a certification or an absolute fitness verdict.
221 tests pass.

## v4.63.1 — 2118hrs:20th August2026

Test rows `ON-260820-7NJ6` and `ON-260820-KQ14` deleted from production
D1 at the owner's instruction; both were notification-routing tests
submitted from `me@onduu.ke` and labelled TEST. `submissions` is empty
again. `OPERATIONS.md` no longer lists them as pending — the open
incident above them still stands.

## v4.63.0 — 2112hrs:20th August2026

**Handoff notes written down instead of held in a session.**

Two things that existed only in conversation now live in the repo, so the
next session reads them from the files it already opens rather than being
told.

- `OPERATIONS.md` gains an **Open incident** section above the lessons
  register: the enquiry notification email failing `401 TM_4001` since
  ~17:30 UTC, why `NOTIFY_EMAIL` is the cause, why the token and code are
  not, that Slack has delivered throughout so nothing was missed, and the
  two test rows awaiting deletion.
- `docs/specs/processors-and-transfers.md` gains section 8, **What Ujiajiri
  Enterprises Limited must do** — the eight items onduu.ke now publishes
  that only Ujiajiri can honour, checked against the live ujiajiri.ke.
  Chief among them: onduu.ke names Ujiajiri as data controller while
  ujiajiri.ke publishes no privacy notice at all.

No behaviour changes. 214 tests pass.

## v4.62.0 — 2044hrs:20th August2026

Notification sender and recipient are separated, after pointing the single
address at an unverified domain took the email channel down in production.

`notify()` used `NOTIFY_EMAIL` as both the ZeptoMail sender and the
destination, so changing where notifications go also changed who they are
sent as. Setting it to an address on ujiajiri.ke — a domain ZeptoMail has
not verified, and whose DNS authorises Google and SparkPost but no Zoho
sender — made every send fail **401 TM_4001**. The dashboard light went
red within seconds with that exact code, which is what the v4.48.2/v4.49.0
work was for; Slack, being a separate channel, kept working throughout.

Now: `NOTIFY_EMAIL` is the **verified sender** and must stay on a domain
ZeptoMail accepts. The new optional `NOTIFY_TO` is the **destination**,
defaulting to the sender when unset, so notifications can be routed
anywhere without touching DNS, domain verification or a second ZeptoMail
token. The comments on both say so, and `OPERATIONS.md`’s secret
inventory records the distinction and the failure it prevents.

**Owner action, in this order**: set `NOTIFY_EMAIL` back to the verified
onduu.ke address (this restores email notifications immediately), then add
`NOTIFY_TO` = the ujiajiri address.

214 tests, lint clean.

## v4.61.0 — 2138hrs:20th August2026

The owner's enquiry and introduction policy is implemented, and it
required correcting a claim made earlier the same day.

**The claim.** The assessment terms said the report was "emailed to you by
Wycliffe, who is the only person who reads it. Onduu is one person, so
there is no wider internal access." The policy establishes that Ujiajiri
Enterprises Limited receives and answers enquiries and that others there
may see them, which makes the sole-reader sentence false. It now says the
report comes from Ujiajiri Enterprises Limited and is seen inside that
company only by the people who need it — and never goes to a provider,
HOSTAFRICA or anyone else without asking first.

**What the pages now say.** `/contact` gains "Who receives your enquiry":
enquiries are received and answered by Ujiajiri, nobody outside sees one
because it was sent, and an introduction names the provider and states
exactly what would be shared beforehand. The commercial-relationships page
gains the introductions policy in the owner's own words, including the
sentence that matters most commercially — **you may decline an
introduction without affecting your assessment or advice** — and both
pages state that a provider is copied only after that specific
introduction is approved. The privacy notice carries the same rule where
it lists third parties.

**What stayed internal.** The step-by-step procedure, the permission
wording naming provider, data and purpose, the record-keeping rule and
the requirement for written data-sharing terms with each regular provider
are recorded in `docs/specs/processors-and-transfers.md`, with the ODPC
consent guidance and the Data Protection Act cited. A template consent
sentence on a public page would be noise to a visitor and evidence to a
reviewer, so it lives where reviewers look.

**Caught before shipping**: the attempt to make `info@ujiajiri.ke` and the
contact-form reference clickable inserted raw HTML into strings that React
escapes — it would have printed the markup on the page. Reverted to plain
text; making them genuinely clickable needs a small inline-link renderer,
which is a separate change.

**Owner action**: `npx wrangler secret put NOTIFY_EMAIL` with the Ujiajiri
address, so notifications reach where the policy says enquiries are
received. ZeptoMail must accept that domain as a verified sender.

214 tests, lint clean.

## v4.60.0 — 2049hrs:20th August2026

The privacy notice stops speaking in internal vocabulary, and the L9 guard
that was supposed to prevent this is corrected.

Reading the live page found three framing lines the v4.59.0 sweep had
missed: the banner said items "need Wycliffe's input", the status section
said entries were "facts only the owner can supply", and the version note
waited on "the TO CONFIRM items". The guard written hours earlier did not
catch any of them — it matched a handful of owner phrasings and not the
ones actually on the page, which is worse than no guard, because it gave
false confidence. It now also matches "Wycliffe's input", "only the owner
can" and the phrase "TO CONFIRM" itself on public pages.

**The phrase "TO CONFIRM" is gone from visitor-facing copy entirely.** The
two genuinely open points — whether to pin the storage region and which
transfer safeguard to record, and whether to adopt a fixed retention
period — now read "Still to decide:", which says the same thing to a
reader who has never seen a project tracker. `ROADMAP.md`, `OPERATIONS.md`
and the processors register keep the internal term, which is what they are
for; the register notes the split so the difference is deliberate rather
than drift.

Checked while there: the notice points visitors at
`docs/specs/processors-and-transfers.md` "in the site's repository", and
the repository is in fact public, so that reference is real rather than
aspirational.

213 tests, lint clean.

## v4.59.0 — 2013hrs:20th August2026

Internal bookkeeping removed from copy visitors read, at the owner's
request after reading the live page.

The assessment terms ended a paragraph with "(owner, 20 August 2026)" — an
editorial note that belonged in the changelog, not in a client's terms.
Removing it turned up more of the same class: both legal gate banners
announced "Owner-approved copy" and "Owner-confirmed", and the status and
version sections spoke of what "the owner" had decided. A visitor does not
know who the owner is and does not need to; what they need is whether a
lawyer has checked the page. All of it now says that plainly instead.

This was the second occurrence — v4.28.1 removed a similar note from the
HOSTAFRICA disclosure — so it is recorded as lesson **L9** with an
executable guard: a test sweeps the public legal and form pages for
provenance markers and owner-vocabulary, and fails the suite if either
returns. It caught the gate banners within a minute of being written,
which is how the wider problem was found at all.

Code comments and the processors register keep their dated attributions,
which is where that information belongs.

213 tests, lint clean.

## v4.58.0 — 1947hrs:20th August2026

Ownership settled, and the assessment terms carry no owner questions at
all for the first time since they were written.

**Intellectual property**: the report and its findings are the client's,
to act on and to share with anyone helping them act on it. The scoring
method, the six dimensions, the evidence labels and any blank template
remain Onduu's — usable by the client for their own business, but not to
be repackaged, resold or built into a competing assessment. The page puts
it in one line: the findings about your business are yours, the machinery
that produced them is Onduu's.

**The page's own framing was corrected to match.** Its gate and status
section still said items marked TO CONFIRM needed the owner's input, when
none remained; both now say what is true — owner-confirmed, awaiting a
legal professional. A test pins the ownership split and fails if any owner
question reappears on the page.

Two small self-corrections while finishing: literal asterisks left in text
that renders as plain prose, and a sentence announcing "No TO CONFIRM
items remain" which was both internal jargon on a visitor-facing page and
the only thing tripping the new test. Reworded rather than worked around.

`ROADMAP.md` Phase 3's identity item is closed. What remains between these
pages and being final is the professional review, plus two decisions the
privacy notice keeps deliberately: whether to pin the storage region, and
whether to adopt a fixed retention period.

212 tests, lint clean.

## v4.57.0 — 1911hrs:20th August2026

Three placeholders removed at the owner's instruction, and the question
they left behind is answered with a policy.

**Removed**: the company registration number and registered address (the
controller is named and contactable, which is what the notice needs); the
ODPC's contact details, replaced by a line noting the regulator publishes
its own route — the **independent right to complain to it stays**, since
that is statutory; and any stated retention period for a sent report.

**Assessment terms gain section 08, "What may be published without
asking"** — the aggregate-only policy. Onduu may publish patterns across
assessments; a published figure covers **at least ten assessments** with
**no subdivision below five**, and identifying detail is omitted
regardless of the number: no sector-plus-town-plus-size combination, no
exact score, no date, no distinctive technical fingerprint. Anything
narrower than that — one client's findings, however carefully the name is
removed — requires written consent **against the exact wording proposed**,
shown before publication. The reasoning is stated on the page: in a market
this size an "anonymous" example is often recognisable to anyone who knows
the sector, so the standard is the client's permission rather than Onduu's
own judgement about identifiability. A test pins both thresholds.

Also corrected: v4.55.0's version note for these terms was written to the
commercial-relationships page instead (identical placeholder text, first
match) and was deleted with that page in v4.56.0. The terms are now at
draft 0.4 and the note records what happened rather than skipping a
version silently.

211 tests, lint clean.

## v4.56.0 — 1823hrs:20th August2026

The Commercial Relationships page is replaced with the owner's own copy,
supplied 20 August 2026, and the footer takes his short version. The page
is now organised as Onduu and Ujiajiri · HOSTAFRICA · Information and
choice · Questions, and is clearer than what it replaces on several
points: the introduction sequence (propose, identify, then share only
with permission), that the referral fee sits under a **written partner
agreement**, that an introduced provider is **not** thereby a HOSTAFRICA
employee, agent or partner, and that nobody must buy HOSTAFRICA products
to use Onduu.

The footer now also names the HOSTAFRICA relationship, which previously
appeared only on the pages — a disclosure improvement on every page of
the site.

Three deliberate changes from the copy it replaces, flagged to the owner
rather than reconciled silently:

- The **statutory directorship** confirmed hours earlier (v4.55.0) is not
  in this copy, which says "Managing Director". The stronger disclosure
  is therefore no longer published.
- The **shared-ownership point now sits at the top of the section** rather
  than beside the fee sentence, where v4.21.0 had deliberately placed it
  so a reader meets both facts together. Both facts remain in the same
  section; the test was updated to pin the substance rather than the old
  wording.
- The **company registration TO CONFIRM and the "no separate conflicts
  policy" statement** are not carried over.

New on the page: `info@ujiajiri.ke` for questions about introductions and
provider conduct — a role address, not a personal one. A note distinguishes
it from data requests about your own information, which still go through
the contact form so they reach Onduu only.

210 tests, lint clean.

## v4.55.0 — 1748hrs:20th August2026

Six of the nine outstanding legal facts answered by the owner and written
into the pages. Privacy notice to draft 0.5, assessment terms to 0.3;
draft markings stay until the professional review.

- **Controller identity.** Onduu is a brand, not a registered company;
  the accountable entity is **Ujiajiri Enterprises Limited**, a limited
  liability company registered in Kenya. Stated on both the privacy
  notice and the commercial-relationships page.
- **Statutory directorship.** Wycliffe is a statutory director of
  HOSTAFRICA Kenya, not only MD by title. The page said "no claim either
  way is made here until that is settled"; it now states the stronger
  relationship and why it matters — formal duties, not a job title.
- **Employment boundary.** Nothing Onduu offers is excluded; operating
  Onduu is permitted under his arrangement rather than tolerated. The
  site states the permission, not the commercial terms behind it.
- **Conflicts policy.** None exists as a separate document. The page now
  says so, rather than implying a policy withheld from the reader.
- **Complaints.** Handled by Ujiajiri Enterprises Limited through the
  contact form, which gains a **"complaint"** option in both the client
  and server allowlists so complaints arrive tagged. The independent
  right to complain to the ODPC is retained: a regulator route cannot run
  through the controller's own form, and omitting it would understate a
  statutory right. ODPC contact details remain outstanding.
- **Assessment reports.** Emailed by Wycliffe, who is the only reader
  because Onduu is one person — so the "who inside Onduu can access them"
  question has a simpler answer than the question assumed. The report is
  the client's to act on and to share with whoever helps them act on it.

Still outstanding: registration number and address, ODPC details, report
retention, anonymised findings as examples, and whether the scoring method
and blank templates remain Onduu's separately from the report. The
register at `docs/specs/processors-and-transfers.md` records all of it.

210 tests, lint clean.

## v4.54.0 — 1706hrs:20th August2026

The processors and transfers register is written, closing the second of
Phase 3's two open items. `docs/specs/processors-and-transfers.md` records
what is processed, by whom, where it sits, on what basis, for how long,
and which decisions remain — each tagged OWNER or LAWYER. It was written
by reading the running code and querying production, and every claim names
the command or file that proves it, so the professional review can be an
assessment rather than an investigation.

Two corrections fell out of writing it:

- **Slack was missing from the privacy notice.** v4.52.0 wired it as a
  second notification channel three hours earlier and did not update the
  notice, which named two processors while the code used three.
  REVIEW.md already required them to match; nothing enforced it. Now the
  notice names Slack, a test pins every processor against the notice, and
  the omission is recorded as lesson L8.
- **Where the data sits is now exact.** The notice said "many countries";
  `wrangler d1 info` shows the database runs in Cloudflare's **EEUR**
  region as a single copy with read replication disabled. The notice
  states that, and the open question narrows to the owner's decision
  (pin a region or not) and the lawyer's (which transfer safeguard to
  record).

Privacy notice at draft 0.4. 210 tests, lint clean.

## v4.53.0 — 1618hrs:20th August2026

Analytics Phase 2, second slice — and the thing it needed first.

**Nothing on the site was tagged.** The tracker fires only on elements
carrying `data-analytics-event`, and no element had one: three weeks of
data held `engagement`, `page_view` and `page_exit` and nothing else.
Building click and conversion panels first would have decorated a
switched-off feature, so the CTAs are tagged in the same change:
`Button` gains optional `event`/`label` props, and the three readiness
CTAs are marked — header (`readiness-cta-header`), standard-page hero
(`readiness-cta-hero`) and homepage (`readiness-cta-home`). Nothing else
is tagged; the tracker still counts only what is explicitly marked.
Outbound clicks to HOSTAFRICA and Ujiajiri are deliberately NOT
duplicated here — they are already counted server-side at `/go/routing`.

**Four new panels** on `/go/analytics`, each range-aware, CSV-exportable
and labelled with its basis:

- **Conversion and clicks** — by element and by originating page. Its
  empty state explains that only tagged elements count, names the
  tagging date so a thin history is not mistaken for low interest, and
  points at Routed clicks for outbound.
- **Engagement by page** — total time on screen and average per view,
  dividing by the tracker's own page views so both sides of the ratio
  come from one source rather than mixing client and server counts.
- **Entry and exit pages** — per-session first and last page, with the
  standing note that a session is one tab in one sitting and cannot
  follow anyone across visits or devices.

Every query is wrapped, so a database without the events table renders
the honest empty state rather than failing. 209 tests, lint clean;
panels and tagging verified against the built Worker.

## v4.52.1 — 1547hrs:20th August2026

Bookkeeping, docs only. The Slack notification channel is confirmed
working by the owner (test ON-260820-0T37 arrived in Slack; row deleted;
zero test rows remain). `VBOUT_API_KEY`, the last unexplained Worker
secret, is recorded in `OPERATIONS.md` as **parked by the owner** for a
future email-marketing-consent integration — with the standing warning
that wiring it in requires a privacy-notice change, because marketing is
a separate consent basis from the enquiry forms.

## v4.52.0 — 1519hrs:20th August2026

Enquiry notifications now also go to Slack. The `SLACK_WEBHOOK_URL`
secret has existed on the Worker since before this repo's records —
flagged as an orphan on 20 August until the owner explained it: Slack
notifications are why it exists. Nothing had ever used it; now
`notifySlack()` posts the same minimal message as the email (form type
and reference only, never submitted content) on every enquiry.

Design: email remains the primary, promised channel — the /go
notification light reports email alone. Slack is best-effort: a failure
logs `notify_slack_failed` with the status (no URL, no PII) and affects
nothing else. Both sends run in parallel inside the same `waitUntil`.

`OPERATIONS.md` item 6 moves the webhook from "unexplained" to expected,
leaving `VBOUT_API_KEY` as the one known orphan; `CLAUDE.md`'s secrets
list gains it. 209 tests, lint clean.

## v4.51.0 — 1502hrs:20th August2026

The owner's personal email address leaves every public page, replaced by
the contact form, on the owner's instruction after reading the privacy
notice. Twelve occurrences across nine files: the privacy notice's
deletion-request steps, consent-withdrawal route and questions note; the
complaints route; the commercial-relationships "ask and it will be put in
writing" line; the domain-owner opt-out on /scan, /kedomains and the tool
limitations page (now a real link to /contact on the scan page); and a
code comment in the do-not-scan module. The two dev-only "spam protection
not configured" fallbacks simply drop the email — in that state no form
works, so pointing at a form would be circular, and the state never
occurs in production.

The rights channels survive the change: deletion, consent withdrawal,
complaints and the domain opt-out all route through /contact, which
reaches Onduu only. A new test pins both properties — the email appears
on no public page, and the privacy notice still states a working channel.

Also checked at the owner's request: whether the notice over-describes
what is collected. It does not. The four tools genuinely store no
personal data and the notice says so; the two forms collect name,
business email, company and free-text answers into D1 with a consent
record — real personal data under the DPA, so the notice's sections
remain load-bearing. Zero real enquiries are stored today, but the
notice describes the mechanism, which is live.

209 tests, lint clean.

## v4.50.1 — 1437hrs:20th August2026

The four tool pages' closing sections are removed too, completing the
owner's v4.50.0 instruction: /email-security, /dns, /kedomains and /scan
no longer carry their "YOUR NEXT STEP" band; each ends at its result and
the footer. The now-orphaned `.final-cta` styles are gone from the sheet.

One self-inflicted break, caught by the build: the CSS cleanup regex
matched `.final-cta` mid-selector inside the SHARED dark-ground tint rule
(v4.42.0's accessibility fix) and severed it, which would have cost the
scorecard and stakes labels their WCAG tint. The build failed loudly,
the rule was restored without the final-cta selector, and the built
stylesheet was verified to carry it.

208 tests, lint clean; all four pages verified against the fresh build.

## v4.50.0 — 1327hrs:20th August2026

The "YOUR NEXT STEP / Start with the problem - not the supplier" closing
section is removed sitewide, on the owner's instruction. It appeared in
four sources: the shared `FinalCta` component (every standard page), the
homepage's section 09, and twice in the article renderer (Insights index
and article pages). All four are gone; the `route` prop that existed only
to stop `FinalCta` self-linking (v4.38.0) goes with it.

Deliberately kept: the four tool pages' own closing sections ("…one
layer. Readiness covers the rest." and the scan's variant) — same visual
pattern, different message, and each page's single CTA. Removing them too
is a one-line ask if wanted.

Each page now ends at its content (or its form) and the footer, which
also strengthens the one-primary-CTA rule: the hero already carries it.

Verified against the built Worker: zero occurrences across home, standard
pages, guides, both Insights views and the paths; tool closers intact;
the readiness form still renders. 208 tests, lint clean.

## v4.49.1 — 1302hrs:20th August2026

The Buzz guide is removed on the owner's instruction, a day after it was
published (v4.45.0). `/guides/buzz-workspaces` 301s to
`/guides/agents-on-vps` — the same successor as the Phase 1 removal of the
old Buzz pilot page — and leaves the guides index, the sitemap and the
tests. The guide's protocol section carried general Nostr statements that
had not been verified against the deployed Buzz build; the full text
remains in git history at v4.45.0 if ever wanted again. Buzz stays a
conditional content area under the strategy's rules; the pilot-assessment
gate in the "Not now / gated" list is unchanged.

Five guides remain. 208 tests (the guide's pins removed with it),
lint clean.

## v4.49.0 — 1216hrs:20th August2026

The system now tells on itself — the two guards the owner approved after
asking what would make things foolproof (the honest answer being: nothing,
but failures can be made loud instead of silent).

- **A weekly sentinel** (`.github/workflows/weekly-checks.yml`): every
  Monday, GitHub Actions runs lint, the full suite (built Worker in local
  workerd, no credentials) and `npm run check:live` against production.
  A failure makes GitHub email the owner — deliberately independent of
  the site's own email path, which is among the things being checked.
  Previously every check ran only while someone was actively working, so
  a quiet fortnight would have hidden a revoked token or an edge-injected
  script; the Cloudflare beacon went unnoticed for days for exactly this
  reason.
- **A notification status light** on the /go overview. Migration 0008
  adds a one-row `notify_health` table (outcome, provider code,
  timestamp — no personal data); every notify attempt records its
  outcome; the overview renders it green ("delivering — last sent …"),
  red ("failing since …, with the code, enquiries still stored"), or the
  honest in-between states (never attempted; migration not applied, with
  the command). Lesson L6's failure mode is now a red light on the
  dashboard the owner already opens, not a log line nobody reads.

**Owner action**: apply migration 0008 to production —
`npx wrangler d1 execute onduu-leads --remote --file=migrations/0008_notify_health.sql`
— until then the overview says exactly that. OPERATIONS.md gains checklist
item 0 ("glance at the lights") and L6 names the new guard. A test pins
the light rendering in every database state. 209 tests, lint clean.

## v4.48.7 — 1158hrs:20th August2026

The living documents are made consistent with each other and with the
site, and lesson L4 finally gets an executable guard. Owner-requested
("see that all the .md files communicate with each other"). Docs and
tests only; no site change.

Found by auditing every .md in the repo, judged by file class — the
changelog, specs and strategy papers are historical records and correctly
keep the paths of their moment; the living documents may not:

- **README.md described the pre-Phase-1 site**: Solutions/Managed
  Operations/Agent Pilot/Labs/Results as included routes, `/check` and
  `check.astro` (renamed 18 Aug), 11 articles (there are 12), three
  secrets (there are five), two islands (there are five), the scanner as
  "WIP" (live since 18 Aug), no tools, no analytics, no OPERATIONS.md.
  Rewritten to current reality, with `check:live` in the release checks.
- **CLAUDE.md** carried two dead vinext-era paths (insights-data,
  route-policy under the old app directory) and an incomplete secrets
  list. Fixed; the secrets line now points at OPERATIONS.md item 6 as the
  standing inventory.
- **REVIEW.md** now points at the OPERATIONS.md checklist from its
  operations section; **OPERATIONS.md** names CLAUDE.md and uses the full
  `scripts/check-live.mjs` path. All four governance files now reference
  each other, pinned by a test.

The guard: `tests/docs-consistency.test.mjs` fails the suite when a living
document names a file that does not exist, describes a retired route, or
drops a governance cross-reference. Its first two catches were its own
author's edits — the changelog wording and the L4 entry both tripped it
before shipping. 208 tests, lint clean.

## v4.48.6 — 1136hrs:20th August2026

`OPERATIONS.md` created, at the owner's request: one place for the two
things that had none. Documentation only.

- A **critical-function checklist** — seven items, each with the exact
  command or URL and what "good" looks like, run monthly and after any
  Cloudflare, secret or provider change: the production enquiry test,
  `check:live`, measurement recency, deploy currency, the four tools,
  the secrets inventory, and Access on /go. It exists because the site's
  most important function was silently broken from launch to 20 August
  and no routine would ever have noticed.
- A **lessons register** — seven entries covering this week's repeat
  offenders (silent critical-path failure, local-pass-vs-production,
  documentation understating reality, the returning flaky test, absence
  rendered as zero, the shared-checkout collision, single-data-point
  assertions), each closed by naming the guard now standing. The rule the
  file encodes: a lesson is not learned until it is a check that runs,
  and a defect that happens twice means the guard was missing — fix the
  guard, not the instance.

`CLAUDE.md` now points every session at the register in its required work
loop, so the file is read at the moment it can prevent a repeat.

## v4.48.5 — 1122hrs:20th August2026

`REVIEW.md` learns this week's two lessons — its first change since it was
written on 18 August, owner-approved. The principles stand; two spots
where the wording let a review pass on paper are sharpened:

- **End-to-end delivery testing now explicitly means production** when the
  behaviour depends on production (secrets, real Turnstile, email,
  Cloudflare settings). The enquiry notification was dead from launch
  until 20 August while every local test passed — blocker #6 was being
  satisfied locally against a requirement only production could satisfy.
- **No silent failure on a business-critical path**: a catch or unchecked
  response on enquiry delivery or data recording must log a structured,
  PII-free line. A critical path that fails without a symptom is treated
  as broken.
- Release checks now include `npm run check:live` against production,
  which sees edge-injected scripts and weakened headers no local test can.

Documentation only; no site change.

## v4.48.4 — 1107hrs:20th August2026

The flaky test fixture gets a real fix — test harness only, no site
change. The dashboard fixture had flaked three times on 20 August alone
(miniflare "Network connection lost", one test failing and passing on
re-run), despite the v4.29.2 startup-race fixes. A flaky suite trains its
readers to re-run on red, which is how a real failure eventually gets
dismissed.

Instrumenting the harness showed two distinct failure classes, needing two
layers:

- **A dropped request**: miniflare's proxy occasionally severs one
  established connection, surfacing as a rejected fetch or a 500 whose
  body says "Network connection lost". `fetchPath` now retries these a
  bounded number of times, logging each retry to stderr so flakes stay
  visible instead of hidden. A real response — any status — is never
  retried; an assertion failure stays a failure.
- **A dead child**: the retry's first outing showed attempts 2 and 3
  failing at the TCP level — the wrangler child itself had died mid-run,
  which no retry can fix. On persistent transport failure the harness now
  respawns the worker once, with the same configuration it was started
  with, shared across concurrent callers.

Four consecutive full-suite runs pass with no retries engaged. 205 tests,
lint clean.

Also recorded: the production enquiry path was verified end-to-end for the
first time today — three live test submissions (ON-260820-L9YL, -2RL4,
-36O8), root cause 401 TM_4001 fixed in v4.48.3, notification email
confirmed received by the owner. The full-site sweep the owner
commissioned came back clean: 36 routes, 42 links, all metadata and
banned-phrase checks passing, all four tools verified live.

## v4.48.3 — 1023hrs:20th August2026

The enquiry notification failure has a root cause: **ZeptoMail rejects the
API token — HTTP 401, code TM_4001** — caught by the v4.48.2 logging on
the second end-to-end test (ON-260820-2RL4) within the hour of shipping
it. Every notification since launch has died at this line; enquiries were
stored and no one was told.

ZeptoMail authenticates with `Zoho-enczapikey <key>`, prefix included, and
the code sent the secret exactly as stored — so a bare key produces
exactly this 401. The Authorization header now accepts either form,
prepending the prefix when the stored secret lacks it. The owner is
re-setting `ZEPTOMAIL_TOKEN` with the full value from ZeptoMail in
parallel, in case the token is also stale; a third end-to-end test
follows the deploy.

205 tests, lint clean.

## v4.48.2 — 1013hrs:20th August2026

Notification failures become visible. Found by the first end-to-end test
of the production enquiry path (reference ON-260820-L9YL, submitted with
the owner's approval): the enquiry passed real Turnstile and landed in D1,
and **no notification email arrived**. `notify()` never checked ZeptoMail's
response — fetch does not throw on a 4xx — and swallowed every exception,
so the sending leg could be dead indefinitely with no symptom. Both
secrets exist on the Worker, so the send is being attempted and rejected,
or delivered to an address nobody checks; the logs will now say which.

Every outcome short of a 2xx now logs a structured line: missing secrets
log `notify_skipped`; a non-2xx logs `notify_failed` with the HTTP status
and ZeptoMail's machine error code (e.g. TM_3601); a thrown fetch logs the
error name. No address, token or personal data is logged, per the repo's
no-PII logging rule. Submissions remain unaffected by any failure.

Also noted for the record: the Worker carries `SLACK_WEBHOOK_URL` and
`VBOUT_API_KEY` secrets that nothing in the current codebase references —
previous-site leftovers, parked for cleanup. And the flaky dashboard test
fixture (miniflare "Network connection lost", fixed once in v4.29.2) has
now flaked three times today; it deserves a revisit.

205 tests, lint clean.

## v4.48.1 — 0949hrs:20th August2026

The rest of the dashboard gets the resilience `/go/analytics` got in
v4.48.0, and two roadmap sections stop understating what exists.

**Every section now survives a database missing its tables.** The overview
and enquiries both threw on an unwrapped query and fell through to the
site's 404 page — the same failure fixed for analytics. The overview also
asserted its count query non-null (`counts!`), so a null result would have
thrown even with the query wrapped. A test now walks all nine sections and
fails if any renders the site 404.

**One rule for the overview cards: an unavailable source shows a dash,
never a zero.** Scans and routed clicks previously fell back to `0`, which
reads as "nothing happened" rather than "the table is missing" — and two
cards showing "0" beside two showing "—" for the identical condition would
have been worse than either alone.

**`ROADMAP.md` Phase 6 corrected** from `not started` to `in progress`. Its
measurement half is substantially built — page views, routed clicks, the
engagement tracker and the analytics section — while the case-evidence half
is untouched and blocked on customer consent. Each part is now listed with
its real state, including what is still to build.

**The current-state block no longer pins a version or a test count.** It
had gone stale twice in two days (v4.16.1 → corrected → v4.37.3 → stale
again at v4.48.0). `CHANGELOG.md` is now named as the only record, with a
note saying why.

205 tests, lint clean. Verified against a database with no application
tables: all nine sections render, and the overview reports "—" rather than
inventing zeros.

## v4.48.0 — 0906hrs:20th August2026

Analytics Phase 2, first slice: `/go/analytics` becomes range-aware and
states the basis of every number it shows.

- **Date ranges** — today, yesterday, 7 days, 30 days — as whole Nairobi
  days. Nairobi is UTC+3 with no daylight saving, so a fixed offset is
  exact and needs no timezone data. An unknown `range` falls back to 30
  days rather than reaching a query.
- **Comparison** against the immediately preceding window of identical
  length. The window is printed in full rather than as a rounded day
  count, which had rendered a 30-day range as "the 29-day period before
  it" because the range runs to now, not to end of day.
- **Summary cards, a daily sparkline** (inline SVG, no chart library) and
  the existing tables, all scoped to the range.
- **Coverage panel**: server-side views against client events, client
  coverage as a percentage, rejected events, and the most recent event —
  with a standing note that client events are always fewer, because
  blockers and disabled JavaScript suppress them. Before migration 0007 is
  applied it says so, and gives the command.
- **CSV export** per table, scoped to the range. An unknown `csv` key
  renders the page instead of exporting.
- **A definitions panel**, and a basis on every metric: exact,
  undercount, or estimated.

**Every number distinguishes "no data" from "no source".** A missing table
now renders "unavailable — the page_views table is missing", never a zero,
which would read as no traffic. This was found by the new tests: the
section previously threw on a missing table and took the whole page down
as a 404. Every query is now wrapped, so the section degrades to an honest
empty state instead.

The dashboard had never been exercised while authenticated — existing
tests only assert it refuses without Cloudflare Access headers. These
tests send the header, which is what surfaced the 404. `/go`, `/go/enquiries`
and `/go/overview` share the same latent fragility and are untouched here.

203 tests, lint clean. Verified both ways: against a database with data
(78 views, 26 events, 3 sessions) and one with no tables at all.

## v4.47.1 — 0824hrs:20th August2026

The analytics spec catches up with the owner's decision to switch
Cloudflare Web Analytics **off** rather than on, documentation only.

The spec still told a future session to enable Web Analytics, create a
least-privilege analytics-read API token, add `CLOUDFLARE_API_TOKEN` as a
Worker secret, and build GraphQL RUM/Core Web Vitals panels on top of the
beacon. All of that is now wrong, and left as written it would have led
someone to reintroduce exactly what was removed.

- **Phase 4 dropped**, with the reason recorded: the auto-injected beacon
  was refused by the content-security policy on every public page — so it
  measured nothing while logging a console error on every visit — and ran
  only on `/go`, which had no policy of its own until v4.47.0. Core Web
  Vitals, if ever wanted, should come from the site's own tracker.
- **Owner actions** reduced to two: apply the D1 migration, and approve
  each phase before it deploys. The three Cloudflare-side actions are
  struck through rather than deleted, so the decision stays legible.
- The status block at the top of the spec, which recorded "the owner will
  enable Cloudflare Web Analytics", now records the reversal.

`npm run check:live` (v4.47.0) is named in the spec as the way to verify no
Cloudflare-injected script returns.

## v4.47.0 — 0752hrs:20th August2026

The private dashboard gets a content-security policy, and a production check
now catches the class of problem that hid this one.

**`/go` had no CSP at all.** Public pages get theirs from Astro; the
dashboard is an endpoint that builds its own HTML, and
`worker/security-headers.ts` deliberately ships none. Cloudflare Web
Analytics' auto-injected beacon therefore ran on the dashboard while being
refused on every public page, and reported which dashboard pages were
opened — visible in the owner's Web Analytics as 13 page views, all on
`/go/*`. Corrected here: this page renders no JavaScript at all, so
`script-src` is `'none'` rather than an allow-list, with
`default-src 'none'`, `style-src 'unsafe-inline'` for the one static style
block, and `frame-ancestors 'none'`. Sent as a header, so frame-ancestors
applies, and attached to all three dashboard responses including the
fail-closed 403.

**`npm run check:live`** (`scripts/check-live.mjs`) checks what Cloudflare
actually serves: ten public pages plus `/go`, fetched with a browser
user-agent because Cloudflare only injects for browser-like requests — which
is why plain curl showed nothing while real visitors got the beacon. It
fails on any injected script (Web Analytics, Rocket Loader, Email
Obfuscation, Speed Brain speculation rules, Zaraz), any third-party script
host beyond Turnstile, a missing or weakened CSP, and any unauthenticated
request to `/go` that is not turned away.

No unit test could have caught the original problem: the suite runs against
a locally built Worker where Cloudflare's edge never runs. A local guard was
added too, but only to hold the code path — the comment says so explicitly,
so nobody mistakes it for production coverage.

Verified against production: 10 pages plus `/go` clean. Writing the checker
also corrected a wrong assumption of mine — `/go` returns 302 to the
Cloudflare Access login, not the Worker's 403, because Access intercepts
before the Worker runs. 200 tests, lint clean.

## v4.46.0 — 2127hrs:19th August2026

Analytics Phase 1 (spec: `docs/specs/analytics-dashboard.md`, owner
decisions recorded 19 Aug 2026: D1 not Analytics Engine, no browser/OS
dimension, new-vs-returning dropped, sessionStorage session id approved).

- `migrations/0007_analytics_events.sql`: `events`, `event_throttle` and
  `event_health` tables. No IP, no user-agent, no persistent identifier;
  session ids are tab-scoped and cannot link visits.
- `worker/events.ts`: allowlist validation, path/label/session
  sanitisation, engaged-time clamping, sliding-window rate limit
  (fail-open), batched recording, received/rejected counters. Rejected
  payloads are counted, never stored.
- `/api/event` (`src/pages/api/event.ts`): POST-only, same-origin,
  JSON-only, 8KB cap, bot-filtered, GPC/DNT acknowledged and dropped;
  recording via `waitUntil`, never blocking a response.
- `src/components/analytics.ts` + a plain Layout script: page views,
  engaged time (visibility-, focus- and idle-aware; heartbeats;
  sendBeacon exit with keepalive fallback; bfcache-aware dedupe), clicks
  only on elements carrying `data-analytics-event`. Never on `/go`;
  silent under GPC/DNT.
- Privacy notice bumped to draft 0.3: the cookies-and-analytics section
  now describes the measurement script, its tab-scoped label and the
  GPC/DNT behaviour. **Owner review of this copy is required before
  merge** (REVIEW.md: notice must match running code).
- Three further privacy-notice sections corrected, found in review after
  the session that wrote the tracker was stopped. Section 05 described the
  new script while the rest of the notice still described a site that had
  none, so the document contradicted itself:
  - **§02 "What is collected"** claimed "Nothing else about you is
    gathered as you browse", which the tracker makes false. Retitled from
    "Only what you type into a form" and rewritten to state the
    measurement and point at §05.
  - **§03 "Why, and on what basis"** states one basis per activity but had
    no entry for the measurement. A fifth card gives the legitimate
    interest relied on, and records that it stops under GPC/DNT.
  - **§08 "How long it is kept"** covered submissions only. It now covers
    the counted views and events, which nothing prunes on a timer and
    which accumulate with every visit rather than only when somebody
    writes in.
  Four assertions pin all of it, so §05 cannot drift away from the rest
  of the notice again.
- `tests/events.test.mjs`: the control-character fixture embedded a raw
  NUL byte in the source, so git classified the file as binary and would
  never have shown a textual diff of it. Escaped as `\u0000` — identical
  to the runtime, reviewable to a human.
- `worker/pageviews.ts`: BOT, deviceFrom and referrerHost exported for
  reuse; behaviour unchanged.
- Tests: 19 new in `tests/events.test.mjs` (sanitisation, batch
  validation, throttle window, engaged-time timer, endpoint behaviour
  against the real worker). Full suite 198 + 19; build and lint clean.

Verified in the built worker (wrangler dev + browser): page_view /
page_exit with engaged time and a stable per-tab session id across
pages, conversion click with label, rejected event counted in
`event_health`, mobile device classification, no new console errors.
Dashboard section, CTA wiring and GraphQL panels are Phases 2–4.

## v4.45.1 — 2113hrs:19th August2026

Paragraphs in content sections no longer run together. `.section-body > p`
set `margin-top: 0` and never restored a bottom margin, while the bundled
reset had already zeroed the browser default — so consecutive paragraphs
sat flush against each other with no separation at all. Insights escaped it
because `.article-prose p` carries its own `margin: 0 0 26px`.

Pre-existing and sitewide, not introduced by the Buzz guide; it surfaced
while checking that guide on a phone viewport, where its two-paragraph
limitations section read as one block. Measured on the live site before the
fix: 13 affected paragraph pairs on `/legal/privacy`, 4 on `/about`, 3 on
`/readiness`, 1 on the new guide. The privacy notice was the worst case,
which is the page where careful reading matters most.

The rule now uses `margin: 0 0 26px`, matching article prose, with
`:last-child` kept flush so a section's own padding is not doubled.
Verified at 375px and 1280px: eight paragraph gaps on the privacy notice
now measure 26px, and a section ending in a paragraph shows no extra slack.
179 tests, lint clean.

## v4.45.0 — 2050hrs:19th August2026

The Buzz guide, written as an educational piece on the owner's
instruction: `/guides/buzz-workspaces` — "Before your team and its agents
share one workspace." It is the sixth guide, linked from the index and in
the sitemap.

Sourcing, given this is content about a third-party evolving platform:

- Every product statement is the brief's own owner-approved wording
  (section 19 and section 9): what Buzz is, the ten things to examine, and
  the honest-limitations paragraph, all carried over close to verbatim.
- The service framing is gone. The brief's "What the assessment covers"
  becomes "What to test" — things the business proves for itself — and the
  CTA is the standard Check Your Digital Readiness, not the "Assess a Buzz
  pilot" offer retired in v4.0.0. Fit / Pilot / Not yet survive as honest
  conclusions a reader can reach, not as a service output.
- One section explains the architecture in protocol terms — key-pair
  identity with no administrator reset, signed events on independent
  relays, deletion as a request rather than a guarantee, and self-hosting
  moving backup and incident duties to a named person. **These are general
  Nostr statements, not verified against the deployed Buzz build**, which
  is why the guide tells the reader to prove behaviour against the deployed
  version rather than the description.

Two tests pin the framing: the retired CTA must not return, the readiness
CTA and the evolving-platform limitation must stay, and no compliance
guarantee or universal-replacement claim may appear. The first draft of
that test failed against my own copy — its regex matched the honest
limitation "not an unconditional replacement" as though it were the claim;
the assertion now distinguishes the negation. 179 tests, lint clean.

## v4.44.1 — 2038hrs:19th August2026

A misleading roadmap note corrected, raised by the owner asking what "the
Buzz guide" was. v4.44.0 recorded "Buzz has no guide — the one item from
the original list still unwritten", which framed it as a gap to fill.
Checking the sources shows that is wrong in a way that could cause real
damage: a future session could read "still unwritten" as a to-do and
rebuild content Phase 1 deliberately removed.

What the sources actually say:

- The Current Version strategy permits Buzz as a content area "presented
  responsibly", and puts its "Buzz Fit Lab" among programmes that "should
  be educational methods, controlled demonstrations or approved labs — not
  unsupported service promises".
- Phase 1 (v4.0.0) removed `/infrastructure/buzz-agent-collaboration`,
  whose CTA was "Assess a Buzz pilot" with a Fit / Pilot / Not yet verdict;
  it 301s to `/guides/agents-on-vps`.
- `CLAUDE.md` names Buzz among the things the site must not lead with, and
  the site's own "claims we will not make" includes "Every client needs
  Buzz or a new website".
- The guide list naming Buzz comes from the 15 August brief, which the
  18 August strategy supersedes where they conflict.

Phase 5 now describes Buzz as a conditional content area rather than a
missing guide, and the gated list gains the Buzz pilot-assessment offer so
the retired service framing cannot return unnoticed. Documentation only;
no site changes.

## v4.44.0 — 2031hrs:19th August2026

**The guides were unreachable.** `/guides` showed five cards, each printing
its guide's URL as plain `<small>` text above the title — a label, not a
link. Nothing on the page was clickable. Four of the five guides
(Domains and DNS, Email and trust, Kenyan VPS, Agents on a VPS) therefore
had no clickable route anywhere on the site; the fifth was reachable only
through the footer. All five were written, live and in the sitemap the
whole time, so search engines could reach them and visitors could not.

Cause: the card destinations were stored as `meta`, which `StandardPage`
renders as descriptive text. They are now a proper `href` on the card type,
and a card with one links from its heading. The heading link carries the
accessible name and the focus ring, while its `::after` stretches over the
tile so the whole card is clickable — verified by hit-testing the card's
corners and body area, not just the heading. Cards without an `href`
(contact, readiness) render exactly as before.

Also corrected: `ROADMAP.md` had Phase 5 as `not started` while five guides
were already published. It is now `in progress`, with the guide list ticked
off against what actually exists and Buzz recorded as the one guide from
the original list still unwritten.

A new test pins every guide as linked from the index, resolving with 200,
and the bare URLs as gone (178 tests). Lint clean. Verified at 375px and
1280px: two-column grid intact, whole card clickable at both widths.

## v4.43.1 — 2020hrs:19th August2026

The mobile menu control now meets the 44px touch-target guideline, found
when checking v4.43.0 on the live site: it measured 60×42, two pixels
short (it already passed the WCAG 2.2 AA minimum of 24px, so this is
comfort rather than conformance).

Vertical padding 12px → 13px with an explicit `min-height:44px`, so the
target does not depend on the font's line box; horizontal padding 4px →
8px. The summary becomes a flex row to centre its label and caret against
that min-height, and the caret's leading space moves into a `gap`, since
flex would collapse it. Measured 70×44 after the change.

Verified at 375px: the control fits the 72px header, the label stays on
one line, the menu still opens and the caret still flips; link targets
unchanged at 47px; no horizontal overflow. Desktop unaffected — the rule
lives inside the max-width:1000px query. 177 tests, lint clean.

## v4.43.0 — 2002hrs:19th August2026

Mobile navigation restored (owner decision on the v4.42.0 accessibility
finding: build it). Below 1000px the header now shows a "Menu" disclosure
— a native `<details>/<summary>` element, so it is keyboard-accessible and
announced as expanded/collapsed with **no client JavaScript**, preserving
the zero-JS content pages. It opens a full-width panel with the same five
links as the desktop nav (Paths, Guides, DNS Checker, Email Security,
Domain Search), styled to the letterhead identity: uppercase labels,
hairline separators, carbon bottom border, ▾/▴ state marker.

Verified in the emulated mobile viewport (menu opens with all five links;
single-line summary) and at desktop (disclosure hidden, inline nav
unchanged). Known limit of the no-JS pattern: the panel closes by toggling
the summary, not on outside-click or Escape. A new test pins the
disclosure and that every nav link appears in both navs (177 tests).

## v4.42.0 — 1941hrs:19th August2026

Accessibility pass over the important flows (ROADMAP Phase 3 item), with
three owner-approved fixes:

- **Tool results are now announced and keyboard focus is preserved** on all
  four tools (/email-security, /dns, /kedomains, /scan). Before: submitting
  disabled the button, dropping focus to the body, and when the result
  rendered nothing announced it — the polite live region reverted to the
  static helper line. Now the result (or error) container takes focus when
  it arrives, the same pattern the submission form already used for its
  error summary. Verified live in the browser: focus lands on
  `.check-result` after a check completes.
- **WCAG AA contrast**: `--copper` darkened `#B8643B` → `#A0522C` so copper
  text (eyebrows, section numbers, links, badges) and the white-on-copper
  buttons meet 4.5:1 on the ivory ground (measured 3.78:1 and 4.26:1
  before; 4.99:1 and 5.62:1 after). Copper labels sitting on dark grounds
  (carbon scorecard/stakes, green final CTA), where a dark copper cannot
  pass, use a new light tint `--copper-tint: #F2DCCB` (4.71:1 on green,
  13.5:1 on carbon; the old copper on green measured 1.46:1 — near
  invisible to low vision).
- The submission form's `<select>`s gain the `aria-describedby` error
  wiring their sibling inputs already had.

Found and recorded, not changed: the primary nav is hidden below 1000px
with no toggle — mobile users navigate via the CTA and footer only. Owner
decision pending (ROADMAP Phase 3). Audit positives recorded there too:
skip link, `:focus-visible`, reduced-motion, labelled fields, the form
error-summary pattern. 176 tests, lint clean.

## v4.41.0 — 1920hrs:19th August2026

The "Three free checks" launch article gains an owner-approved dated
postscript (the owner's decision on the outstanding Phase 4/5 content
question): a final italic paragraph, dated 19 August 2026, noting that a
fourth free check — the DNS Checker at /dns — has joined the three, with a
one-line description matching the tool limitations page and a single /dns
link. The historical prose above it is untouched. ROADMAP item and
decisions-table row closed.

## v4.40.0 — 1917hrs:19th August2026

`security.checkOrigin` enabled (owner-approved 19 Aug 2026), closing the
last Phase 0 deferral. It was disabled during the Astro migration for
behaviour parity with the vinext Worker; now a POST whose Origin header
does not match the site is refused with 403 before any route handler runs.

Nothing legitimate is affected: the site's own forms and tools all post
same-origin JSON, and the full suite — including the end-to-end form
submissions against the built Worker — passes unchanged. The one test that
pinned the old parity behaviour (bare POST to /api/check → 405) now pins
both layers: cross-origin POST → 403 from the hardening, same-origin
POST → 405 from the handler's method check. 176 tests, lint clean.

## v4.39.1 — 1909hrs:19th August2026

Two owner decisions recorded, no site changes:

- **Governance files signed off.** Explicit owner approval of `CLAUDE.md`,
  `ROADMAP.md` and `REVIEW.md` recorded; the decisions-table row that had
  been outstanding since 18 August closes.
- **Retention policy decided: deletion on request, no fixed period.**
  Submissions and stored tool results are kept until deleted, and deletion
  requests are honoured — which is what the privacy notice, the Assessment
  Terms 0.2 and the code already do, so nothing changes on the site. The
  `retain_until` column (found during this decision to be stamped two years
  from submission in `worker/submissions.ts`, unenforced — the likely
  origin of the false claim fixed in v4.39.0) is recorded as an advisory
  marker only. Adopting a fixed period later means changing both legal
  pages and building enforcement together.

## v4.39.0 — 1903hrs:19th August2026

Assessment Terms re-read against current behaviour (ROADMAP Phase 3 item)
and corrected to 0.2, with all six findings owner-approved:

- **The false retention claim is gone.** The terms said form submissions
  were "kept for two years and then deleted, as described in the privacy
  notice" — but the privacy notice states there is no automatic deletion
  schedule and no fixed retention period, and nothing in the code enforces
  two years. The terms now match the notice: kept until deleted, deletion
  honoured on request. When the Phase 3 retention decision sets a real
  period, both pages and the enforcement change together.
- **Scope narrowed to what the terms actually govern**: the human-reviewed
  assessment and separately agreed written work. The intro's stale
  "email security checker … or commission a review" framing (written when
  there was one tool) is replaced; the four free tools are pointed at the
  tool limitations page that already governs them, resolving the authority
  contradiction with the scan's any-domain model.
- **DKIM wording matches the code**: "for common selectors", not "where a
  selector can be guessed".
- Version section bumped to draft 0.2 with a "What changed" note, matching
  the sibling legal pages' convention. Still a draft; the TO CONFIRM items
  (report storage/access, anonymised examples, IP ownership) remain for
  professional review by the owner's decision.

A new test pins the retention consistency between the two pages, the
tool-limitations pointer and the DKIM wording (176 tests).

## v4.38.0 — 1853hrs:19th August2026

Phase 2 closed with owner sign-off. The owner reviewed every routing
decision point's destination, disclosure and consent wording (quoted
verbatim from the live site in the Phase 2 sign-off review document) and
approved all six: the Ujiajiri introduction path, the HOSTAFRICA path page,
the domain-search routing, the contact three-destination split, the
readiness after-score block and the sitewide footer disclosure. Two
owner-approved fixes shipped with the closure:

- **Contact hero** no longer says Onduu "will recommend a score, review,
  system, programme, pilot or 'not yet'" — "system, programme, pilot"
  echoed the superseded direct-delivery offers (Website Revenue System
  implementation, Agent Workflow Pilot) that Phase 1 removed everywhere
  else. It now uses the form's own approved formula: "…recommend the
  readiness assessment, a guide, an independent partner route, the official
  infrastructure route or 'not yet'." Overridden in the strategy layer
  (`pages-strategy.ts`), leaving the prototype copy as history.
- **Readiness after-score block** now discloses the referral fee's
  existence beside its "Request an Implementation Introduction" CTA — one
  sentence, no amount — so the disclosure sits at that decision point too,
  not only on the implementation path page.

Also fixed while touching the templates: the closing "See the
implementation path" link on `/paths/website-and-digital-marketing`
pointed at the page itself; it now points at the infrastructure path
instead (`StandardPage` passes the route through to `FinalCta`).

`ROADMAP.md` Phase 2 marked `done` with the approval recorded. New test
assertions pin the contact formula and the readiness fee disclosure
(175 tests total).

Documentation catch-up, no site changes. Found by a full-repo audit against
the live state; approved by the owner:

- `CLAUDE.md` stack section now states Astro 5 + `@astrojs/cloudflare` as the
  current stack (live since v3.0.0, 18 Aug). It still described vinext as
  current and the migration as a future direction, a day after the
  migration shipped.
- `ROADMAP.md` "Current website state" no longer pins a stale version
  (v4.16.1) — it points at `CHANGELOG.md` — and the test count is corrected
  from 154 to 174.
- Phase 0 marked `done` with owner approval: all items complete, acceptance
  criteria met. Its two deferred parity findings (homepage/`/check`
  canonical + Open Graph, 404 title) are struck through as fixed in v3.0.1;
  the `security.checkOrigin` hardening remains the one open thread.

Verified before this entry: clean build, 174/174 tests, lint clean,
production serving v4.37.3 copy, `wrangler.jsonc` name and `workers_dev`
correct.


## v4.37.3 — 1727hrs:19th August2026

A false claim removed from `/kedomains`, spotted by the owner: the
"appears available" note ended "Nothing you search here is stored." That
has been untrue since 18 August, when the v4.9.x decision started storing
the name searched and what was found (with no visitor identity). The
sentence predates that decision and was missed when the other tool pages
gained their storage disclosures.

It now reads "The name searched and what was found are kept; nothing
about you is." — the same one-line form as /email-security and /dns, and
matching what the privacy notice says about this tool.

Swept for sibling absolutes: the two remaining "never stored / nothing is
stored" phrases are both in the privacy notice and both are accurate (the
hashed connection address is never stored with a result; nothing is
stored on the visitor's device). 174 tests pass.


## v4.37.2 — 1717hrs:19th August2026

Invisible links fixed across the whole site, after the owner spotted a
second one in /kedomains prose ("run the free email security check").

The v4.37.1 rule only covered result cards; the same global reset was
hiding links inside body prose too. The affordance rule now also covers
`.section-body` (every content section on the tool pages, the legal pages
and every StandardPage) and `.check-headline`. Audited the rendered
output: all five inline prose links across the four tool pages now carry
it — the email-check links on /kedomains, /dns and /scan, the scan link
on /dns, and the article link on /email-security. Article prose already
had its own green underline and keeps it; buttons and .text-links style
themselves and are excluded.

Also fixed in that sentence: the link text began lowercase after a full
stop ("protect you. run the free…") — the sweep for that pattern could
not see it because the lowercase word sat inside the JSX link element,
split across lines. It reads "Run the free email security check." now.
174 tests pass.


## v4.37.1 — 1709hrs:19th August2026

The registrar link now looks like a link. It always was one — HOSTAFRICA
EAC opened the registrar's site in a new tab — but the global reset
(`a{color:inherit;text-decoration:none}`) left it identical to body text,
so the only clue was the arrow. Links inside result cards (excluding
buttons and .text-links, which style themselves) are now copper, bold and
underlined, with a carbon hover. One CSS rule, so it applies to every
tool's result cards, including the email-check cross-link on /dns
findings. 174 tests pass.


## v4.37.0 — 1702hrs:19th August2026

Two changes on `/kedomains`, on the owner's instruction after seeing
onduu.ke report its lock ON while onduu.co.ke, at the same registrar,
reported OFF.

**Transfer lock removed from the results.** The reading comes from RDAP
status codes, and KeNIC's publication of them has proven inconsistent
between domains, so the tool was stating as fact something the source
does not reliably support. All three branches went: ON, OFF with its
guidance, and the "not published" limitation. The page bullet, the page
title and the meta description stop advertising the lock too. The
`locked` field stays in the API and its worker tests remain, so the
display can return if the registry data ever firms up.

**Expiry reordered, days first:** "EXPIRES in (359 days): 14-08-2027."
The instruction's ".:" read as a typo and the punctuation is normalised.
The expired form ("EXPIRED: 78 DAYS AGO") already led with days and is
unchanged.

Verified against live lookups of onduu.ke and onduu.co.ke. 174 tests
pass.


## v4.36.3 — 1645hrs:19th August2026

The tool's name is "DNS Checker" everywhere, on the owner's decision:
footer link (was "DNS Check"), the /dns page title, and the private
dashboard's nav and section heading. The header already said it. The spec
file keeps its historical name; it records decisions, not live copy.
174 tests pass.


## v4.36.2 — 1638hrs:19th August2026

The nav's tool labels get their full names back: DNS Checker, Email
Security, Domain Search. The v4.36.0 short forms existed only because the
row did not fit at 1024px; removing the duplicate Readiness link in
v4.36.1 freed the width. Measured at 1024px: 67px clear on the left, 32px
on the right, no wrapping, no overflow. 174 tests pass.


## v4.36.1 — 1651hrs:19th August2026

The header linked /readiness twice: the nav's "Readiness" text link and
the "Check Your Digital Readiness" CTA, spotted by the owner. The pair
dates from the v4.0.0 repositioning, whose nav was specified with both;
it only became conspicuous once About and How It Works moved to the
footer and the tools came in, leaving "Readiness" as the nav's first word
beside a button ending in the same word.

The nav link is removed and the CTA keeps the job, per the one-primary-CTA
rule. The nav reads Paths, Guides, DNS, Email, Domains. /readiness stays
reachable from the CTA on every page and from the footer's Start column.
174 tests pass.


## v4.36.0 — 1621hrs:19th August2026

The three free tools join the primary navigation, which now reads
Readiness, Paths, Guides, DNS, Email, Domains, plus the readiness CTA.

Two decisions the instruction did not cover, both made from measurement
rather than taste:

**Short labels.** With the footer's names ("DNS Check", "Email Security",
"Domain Search") the nav needed 293px more than it had. At 1024px the
wordmark touched "Readiness" and "Domain Search" touched the CTA button,
with literally zero visual gap on both sides. "DNS", "Email" and
"Domains" fit and still read clearly in a row of six.

**Header spacing.** Even shortened, the last link still met the CTA at
1024px. The header's side padding grew as 5vw, so a wider viewport spent
its extra width on margins and starved the middle column. It now grows as
3.5vw with an explicit 32px column gap, so the three regions cannot touch.

Measured after: 1024px gives 108px left and 32px right; 1100px gives 143
and 50; 1280px gives 227 and 134. No wrapping, no horizontal overflow,
and the CTA text still fits its button at every width. The nav continues
to hide below 1000px, as before.

174 tests pass; lint clean.


## v4.35.0 — 1621hrs:19th August2026

"How it works" leaves the primary navigation for the footer's **Choose a
Path** column, on the owner's instruction. It sits first in that column,
ahead of Ujiajiri Introductions and HOSTAFRICA Infrastructure, since it
explains the choice those two links represent. It also leaves the Start
column, where it used to sit, so it appears once in the footer rather
than twice.

The header is now Readiness, Paths, Guides, plus the readiness CTA. The
page is unchanged, still returns 200 and stays in the sitemap; only its
promotion changed, as with About in v4.28.0.

174 tests pass; lint clean.


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
