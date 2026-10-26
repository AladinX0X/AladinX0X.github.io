# DESIGN-SYSTEM.md – AYLOUL website

The homepage (approved in round 2) is the reference. Every other page is built from the same
building blocks listed here. Code: `src/components/sections/*` (markup + styles) and
`src/scripts/motion/*` (motion). Tokens: `src/styles/tokens.css`.

## 1. Foundations

| Token | Value | Use |
|---|---|---|
| Forest green `--farbe-gruen` | #052f24 | dark sections, header, footer |
| Deep green `--farbe-gruen-tief` | #03211a | image backdrops, gradients, featured scene |
| Ivory `--farbe-elfenbein` | #ffefdc | light sections, text on green (12.95:1) |
| Terracotta `--farbe-terrakotta` | #c15428 | large headings, lines, diamonds, icons only |
| Terracotta light | #e8875c | small accent text on green (5.6:1) |
| Terracotta dark | #9e3f1a | small accent text on ivory, solid buttons (5.9:1) |
| Font | Fustat Variable | one family, Arabic and Latin; Arabic body ≥ 17 px, line height ≥ 1.7 |
| Section radius `--radius-abschnitt` | clamp(1.75rem … 3.5rem) | rounded top edge of every following section |
| Image radius `--radius-bild` | 14 px | all image frames |

Motion tokens: `--dauer-kurz` 200 ms (colour, hover), `--dauer-mittel` 600 ms (header, frame line,
FLIP), `--dauer-lang` 1100 ms (reveals, hero); `--kurve-ein` cubic-bezier(0.22, 1, 0.36, 1) for every
entrance (GSAP: CustomEase "ein"); `--kurve-weich` for page cross-fades. Only `transform`,
`opacity`, `clip-path` are animated.

## 2. Section types (homepage order)

1. **Hero** (`sections/Hero.astro`, dark): full-bleed image, gradient measured behind the text,
   kicker pill with diamond, h1 revealed word by word, slogan, buttons, scroll hint. Variant
   `geteilt` (image on the inline-end half, text on green) for images that are too small for
   full-bleed.
2. **Statement scene** (`sections/WortSzene.astro`, light, pinned): section heading + one large
   sentence whose words go from dim to full while scrolling; link below.
3. **Card grid section** (`sections/Abschnitt.astro` + cards, dark/light): heading, intro line,
   3-column cards (image frame 4:5 or 4:3, icon circle, title, short text, keywords with
   diamonds, "more" link with arrow).
4. **Numbers** (`Kennzahlen.astro`, light): large counting numbers with diamonds, lines between.
5. **Image expand scene** (`sections/BildSzene.astro`, deep green, pinned): framed card on the
   inline-end side grows into a full-screen image (clip-path), title fades out, text and button
   fade in over a gradient.
6. **List section** (`LeistungenListe.astro`, light): rows with icon circle, title, text, arrow.
7. **Line scene** (`sections/LinienSzene.astro`, dark, pinned): steps on one dashed line,
   diamond travels, line fills in terracotta, steps light up.
8. **Statement + box** (`sections/Statement.astro`, dark): big sentence with diamond, framed
   box beside it (portfolio download).
9. **Contact call** (`Kontaktaufruf.astro`, light): heading, sentence, three buttons.
10. **Footer** (dark, rounded top edge).

Dark and light always alternate; every section after the first slides over the previous one
with a rounded top edge and a soft shadow (global rule in `global.css`).

## 3. Elements

- **Section heading** (`Abschnittskopf.astro`): diamond, terracotta title (uppercase only in
  English), fading line towards the line end, two-digit number at the end ("01").
- **Image frame** (`.bildrahmen`): 14 px radius, 1 px terracotta outline, green backdrop,
  image `object-fit: cover`, blurred placeholder underneath (LQIP), fade-in after load.
- **Cards**: project card (frame 4:3, area label, title with arrow, short text; hover/focus:
  image 1.04, terracotta frame line draws in, arrow moves in reading direction), discipline card
  (frame 4:5, icon circle, keywords).
- **Buttons**: pill shape; solid = terracotta dark with white text; outline = current colour.
  Arrows move 0.3 rem in reading direction on hover, button presses to 0.98.
- **Icons**: own SVG set, 1.6 stroke, inside circles (terracotta dark or outlined).

## 4. Motion patterns (`src/scripts/motion/*`)

| Pattern | Module | Where on the homepage |
|---|---|---|
| Hero reveal: image settles 1.08 → 1 (1.6 s), words/lines rise 24 px and fade in (CSS, no JS wait) | `global.css` + `motion/hero.ts` (scroll: parallax, darken, text fades) | hero |
| Word reveal (pinned on desktop, scrubbed on mobile) | `motion/wortszene.ts` | studio sentence |
| Image expand (pinned, clip-path) | `motion/bildszene.ts` | featured project |
| Line scene (pinned, diamond travels) | `motion/linienszene.ts` | working method |
| Reveal on scroll (fade + 24 px) | `module/einblenden.ts` | all blocks |
| Counters (once) | `module/zahlen.ts` | numbers |
| Card hover, button micro-interactions | CSS | cards, buttons |
| Page transitions (cross-fade, card image morphs into project hero) | Astro ClientRouter + `transition:name` | all links |
| Header (transparent over hero, compact, hides on scroll down) | `module/kopf.ts` | all |
| Lenis smooth scroll (desktop with mouse only) | `motion/index.ts` | all |

Rules: one "wow" per screen; pins only at ≥ 62 rem with a fine pointer; reduced motion loads no
GSAP/Lenis and shows everything static; without JS everything is visible; Arabic is animated
only as whole words or lines.

## 5. Page plans (round 3)

- **Studio** (`/about/`): Hero (full-bleed, villa interior entrance) → word-reveal statement
  (studio intro, pinned) → "A connected practice" chain on a line (line scene pattern, static
  steps) → disciplines as large image panels (panel scene: each discipline a full-width image
  panel with title and keywords; signature moment: panels slide up and the image scales
  1.08 → 1) → highlighted statement "we work with experienced engineers" + founded September
  2026 → contact call.
- **Working method** (`/approach/`): Hero (mosque square aerial) → intro statement (word reveal)
  → **stages scene** "من الفكرة إلى التجربة / From idea to experience" (pinned; six stages light
  up one after another: diamond glows, line fills to it, number/title/text fade in, image
  cross-fades, earlier stages stay dimmer, counter "03 / 06"; mobile: vertical timeline that
  lights up per stage; reduced motion: all lit) → contact call.
- **Services overview** (`/services/`): Hero → **sticky list** (titles on the line-start side,
  a large framed image on the other side that cross-fades to the service under the reading
  line; signature moment) → engineers statement → contact call.
- **Service detail** (`/services/<slug>/`): Hero (service image) → "what it includes" (text +
  aspects as cards) → process (line scene pattern for shop drawings, aspects otherwise) →
  related projects (same project cards) → other services list → contact call.
- **Projects overview**: Hero → filter + project cards (FLIP re-layout) → portfolio statement →
  contact call.
- **Project detail** (one template): Hero (full-bleed or split for small images; the card image
  morphs in) → key facts row (animates in) → description (word reveal) → materials (+ colour
  sample cards for interior projects only, unfolding on scroll) → cinematic gallery
  (alternating large/small, pinned horizontal strip on desktop with correct RTL direction,
  vertical on mobile; lightbox zooms from the thumbnail) → next/previous as large image
  teasers → contact call.
  - Shop drawings: drawing set (sheet cards with a title block, sheets slide in like stacked
    paper), lightbox with deep zoom (4096 px sources).
  - AYLOUL identity: case study chapters (concept, logo construction with the grid drawing
    itself and the marks building up, colours, typography, diamond, applications, production).
- **Contact**: Hero (split, map image) with the three direct contact buttons → details +
  social links + map → (no form).
- **404**: Hero in the homepage style with the 404 number and two buttons, both languages.
