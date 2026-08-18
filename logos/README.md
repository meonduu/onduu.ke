# Onduu logo studies — asset masters

SVG masters for the five identity studies presented in the "Five Marks for
Onduu" boards (18 August 2026). Nothing in the site references these yet;
they are working assets for the owner's decision.

Boards with rationale and trade-offs:
https://claude.ai/code/artifact/dddba188-435b-45c7-972c-10c83ee82ff7

## Recommendation

Study A (Dial) as the symbol + Study D (Letterhead) as the wordmark.
The Dial is the homepage scorecard's 62/100 gauge promoted to a mark, so the
identity and the product illustration become the same shape; the Letterhead is
the current header wordmark with widened tracking and a squared copper stop.
`study-a-dial/lockup-*.svg` shows the pairing assembled.

## Inventory

| File | What it is |
|---|---|
| `study-a-dial/dial-on-light.svg` | Dial symbol for ivory/light grounds |
| `study-a-dial/dial-on-dark.svg` | Dial symbol for carbon/dark grounds |
| `study-a-dial/favicon.svg` | Dial with heavier strokes, holds at 16px |
| `study-a-dial/lockup-on-light.svg` | Dial + ONDUU wordmark (recommended pairing) |
| `study-a-dial/lockup-on-dark.svg` | Same, dark grounds |
| `study-b-double-u/uu-on-light.svg` | "uu." monogram, light grounds |
| `study-b-double-u/uu-on-dark.svg` | Same, dark grounds |
| `study-c-byline/byline-on-light.svg` | "Onduu." Georgia serif wordmark |
| `study-c-byline/byline-on-dark.svg` | Same, dark grounds |
| `study-d-letterhead/wordmark-on-light.svg` | ONDUU caps + copper square stop |
| `study-d-letterhead/wordmark-on-dark.svg` | Same, dark grounds |
| `study-e-stamp/stamp.svg` | Copper block with uu cut-out (any ground) |
| `study-e-stamp/stamp-avatar.svg` | Full-bleed square crop for avatars/app icons |

## Colour tokens

Same palette as `src/styles/globals.css`:

- Carbon `#101820` (ink on light grounds)
- Ivory `#F5F1E8` (ink on dark grounds)
- Copper `#B8643B` — lifted to `#CD7A50` on dark grounds for contrast
- Mist track `#DDE3E1` (light) / `#28323C` (dark) — Dial only

## Production caveats

- The Dial's copper arc is 62% of circumference (`stroke-dasharray` of
  2·π·r), matching the homepage sample score. If the sample score ever
  changes, decide whether the logo tracks it or freezes at 62.
- Wordmark and byline files use **live `<text>`** (Arial bold / Georgia
  bold). They render correctly wherever those system fonts exist — fine for
  web use — but must be converted to outlines before print, sticker or
  merchandise use, and letter-spacing deserves optical tuning at final size.
- No raster exports here. Generate PNGs from the SVGs at need
  (e.g. 512/192/180/32/16 for icons, 1200×630 for OG cards).
