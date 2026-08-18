# Launch post — the three free tools

Status: DRAFT, owner to publish. Written 18 August 2026, updated same day
with the brand assets from v4.10.0/v4.11.0. Every factual claim below was
verified on the day of writing.

**Image:** attach `announcement-card.png` (in this folder) for the strongest
post. If you post the bare link instead, LinkedIn/WhatsApp/X now auto-render
the branded share card from onduu.ke — either way the post carries the Dial.

---

**Three free tools are now live on onduu.ke. The first thing I did was point
them at my own domain.**

They told me my domain had no HSTS, no automatic redirect to HTTPS, and —
worse — my transfer lock was off. All three were true. I fixed them before
writing this post.

That is the point. Most Kenyan businesses have never seen this layer of
their own operation, and most tools that show it are attached to someone
selling you something.

Three things you can check right now, free, without signing up:

**1. Can someone send email pretending to be your business?**
Reads your published SPF, DKIM, DMARC and MX records and explains, in plain
English, what they do — and what they do not prove. Over 100 parastatal
chief executives faced action over exactly these records.
→ onduu.ke/email-security

**2. Is your business name protected in .ke as well as .co.ke?**
Checks the extension you enter alongside its .ke twin. For a domain already
taken, it shows who the registrar is, whether the transfer lock is on, and
when it expires. One domain I checked expired 78 days ago and is still
unlocked.
→ onduu.ke/kedomains

**3. What does your domain show the public?**
A Public Signal Score across six dimensions — control, trust, speed,
conversion, resilience, agent readiness — with an honest Evidence Coverage
figure showing how much of the picture is actually visible from outside.
Anything that cannot be observed publicly is marked as such, and never
counts for or against you.
→ onduu.ke/scan

None of these prove your business is secure. They show what is visible and
what is missing, so you can decide what to fix first — and who should fix
it.

*Disclosure: registration links go to HOSTAFRICA, where I am Managing
Director of the Kenyan business. Onduu earns no commission on them.*

---

## Notes for the owner (not part of the post)

- The self-critical opening is the strongest asset: verifiably true and it
  earns more trust than any claim about the tools.
- The expired domain stays anonymous deliberately — the pattern teaches;
  naming a business reads as shaming.
- Deliberately absent: security guarantees, "nothing is stored" blankets
  (the scan and the lookups DO store results — the privacy notice discloses
  this), invented numbers or testimonials.
- The disclosure sits where the registration link is mentioned; if the
  domain tool moves up the post, the disclosure moves with it.
- Card master: `logos/announcement-card.svg`. Regenerate the PNG after any
  edit:
  `node -e "require('sharp')('logos/announcement-card.svg',{density:300}).resize(1200,630).png().toFile('docs/marketing/announcement-card.png')"`
