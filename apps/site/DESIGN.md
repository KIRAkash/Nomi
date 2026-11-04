---
name: Nomi landing
description: Every plate, the way the chef meant it. One drawn Chicken Biryani carried through a pinned, scroll-scrubbed story.
colors:
  paper: "#fffbef"
  paper-warm: "#fff0c2"
  white: "#ffffff"
  cream: "#fff4d6"
  counter: "#ece4d2"
  ink: "#1b1b3a"
  ink-sub: "rgba(27, 27, 58, 0.68)"
  ink-faint: "rgba(27, 27, 58, 0.64)"
  ink-line: "rgba(27, 27, 58, 0.14)"
  saffron: "#d98e00"
  saffron-soft: "#ffe7b0"
  amber: "#ffb627"
  part-rice-sky: "#3f8fd6"
  part-chicken-tomato: "#d93a2e"
  part-onions-saffron: "#d98e00"
  part-lemon-pink: "#e8559a"
  part-raita-mint: "#2e9a5f"
  mint-soft: "#ddf5e6"
typography:
  display:
    fontFamily: "'Inter Tight Variable', 'Inter Tight', system-ui, sans-serif"
    fontSize: "clamp(3rem, 5.4vw, 5.4rem)"
    fontWeight: 850
    lineHeight: 0.95
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "'Inter Tight Variable', 'Inter Tight', system-ui, sans-serif"
    fontSize: "clamp(2.1rem, 4.6vw, 4.1rem)"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.035em"
  title:
    fontFamily: "'Inter Tight Variable', 'Inter Tight', system-ui, sans-serif"
    fontSize: "clamp(1.3rem, 2.2vw, 1.8rem)"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  body:
    fontFamily: "'Inter Tight Variable', 'Inter Tight', system-ui, sans-serif"
    fontSize: "clamp(1rem, 1.25vw, 1.12rem)"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  label:
    fontFamily: "'Inter Tight Variable', 'Inter Tight', system-ui, sans-serif"
    fontSize: "0.85rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "normal"
    fontFeature: "'tnum'"
  wordmark:
    fontFamily: "'Fredoka', system-ui, sans-serif"
    fontSize: "1.7rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.01em"
rounded:
  label: "8px"
  tab: "12px"
  link: "14px"
  button-small: "16px"
  chip: "18px"
  button: "20px"
  nudge: "22px"
  card: "26px"
  stage: "34px"
  device: "48px"
spacing:
  gutter: "clamp(16px, 4vw, 56px)"
  xs: "6px"
  sm: "12px"
  md: "18px"
  lg: "26px"
components:
  button-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.cream}"
    typography: "{typography.label}"
    rounded: "{rounded.button}"
    padding: "0 26px"
    height: "56px"
  button-line:
    backgroundColor: "rgba(255, 255, 255, 0.7)"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    padding: "0 26px"
    height: "56px"
  button-line-hover:
    backgroundColor: "{colors.white}"
  button-small:
    rounded: "{rounded.button-small}"
    padding: "0 18px"
    height: "44px"
  nav-link:
    textColor: "{colors.ink-sub}"
    rounded: "{rounded.link}"
    padding: "10px 14px"
  nav-link-hover:
    backgroundColor: "rgba(27, 27, 58, 0.05)"
    textColor: "{colors.ink}"
  chip-part:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.chip}"
    padding: "10px 16px 10px 12px"
  card-sheet:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.card}"
    padding: "20px 22px"
  card-stage:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.stage}"
    padding: "clamp(24px, 3vw, 44px)"
  nudge-warn:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.ink}"
    rounded: "{rounded.nudge}"
    padding: "14px 22px 14px 16px"
  nudge-ok:
    backgroundColor: "{colors.mint-soft}"
    textColor: "#14532d"
    rounded: "{rounded.nudge}"
    padding: "14px 22px 14px 16px"
---

# Design System: Nomi landing

## Overview

**Creative North Star: "The Paper Stage"**

The landing is the pitch film's stage, made scrollable. A warm butter light (paper-warm) bleeds from the top-left corner into white, a fine still grain sits over everything, and on that paper one drawn Chicken Biryani plays the protagonist from the first viewport to the last. Heavy, tightly tracked ink type carries the story; one saffron word in each headline carries the point. Everything Nomi itself produces (mask outlines, part chips, nudges, the drawn phone) wears Clay Tiffin: puffy rounded white sheets, warm brown soft shadows, and the five SAM part colours.

Density is low and theatrical: each idea gets a full pinned viewport, copy in a narrow left column (0.8fr) and the drawn stage on the right (1.2fr). The scroll is the playhead: every scene is a scrubbed timeline, so scrolling back plays it in reverse. Nothing is photographed. The dish, the plate copies, the camera frames, the phone, the QR tent and the brand mark are all drawn in SVG from a seeded random source, so they come out identical on every load. The only rasters are the real Meta and Muse marks.

Confirmed rejections: photographs and screen recordings of dishes or the app (Akash, 2026-11-04), a mascot, humour, and the category's phone-mockup feature grid with a stats bar.

**Key Characteristics:**
- Butter-to-white paper ground under fixed multiply grain.
- Ink Inter Tight at 800 to 850 weight, tracked -0.035em to -0.04em; saffron marks one word per headline.
- Fredoka is the voice of the brand name and of the drawn app, never of the page.
- Five SAM part colours, each bound to one part of the dish everywhere it appears.
- Puffy white chips and sheets with warm brown, diffuse shadows.
- Seeded SVG drawings for every image; pinned, scroll-scrubbed scenes for every idea.

## Colors

A warm, low-chroma paper world with one dark ink, one gold accent, and a reserved five-colour set that only ever names parts of the dish.

### Primary
- **Saffron** (saffron): the one word that matters in each headline (set as `em`, no italics), the active step number, the focus ring, the selection tint (saffron-soft), the arrow tile and title on hover in the closing list, and the NIGHTSHIFT return paths. It also marks the fried onions, which is the same saffron by design.
- **Amber Nudge** (amber): the warning nudge at the pass, the scanline on the drawn phone, and the face of the brand coin. Amber means "look again, quietly"; it is never an error red.

### Tertiary: the SAM part colours
- **Rice Sky** (part-rice-sky), **Chicken Tomato** (part-chicken-tomato), **Onion Saffron** (part-onions-saffron), **Lemon Pink** (part-lemon-pink), **Raita Mint** (part-raita-mint): mask outlines (6 to 7px round-joined strokes), fills at 0.2 to 0.22 opacity, the swatch dot or bar inside a part chip, and the tag dots on the drawn phone. Mint also carries the "found" counts and the check marks; tomato carries the dashed "missing" circles in the drift grid and the missed-plate dots on the watch list.
- **Mint Soft** (mint-soft): the ground of the "all found" nudge, with deep green (#14532d) text.

### Neutral
- **Paper** (paper): page ground, the checklist rows inside the voice card, and the solid nav bar at 94% opacity.
- **Paper Warm** (paper-warm): the light that bleeds from the top-left (a 120% by 90% radial at 0 0, gone by 64%).
- **White** (white): every Clay Tiffin sheet and chip.
- **Cream** (cream): text on ink buttons, the drawn phone's screen, the QR tent, and arrow glyphs on ink tiles. It replaces pure white on ink so ink surfaces stay warm.
- **Counter** (counter): the drawn pass counter, the finder and the phone's photo well; the shot cards and camera frames use near neighbours of it (#f1ebde, #e9e1cf).
- **Ink** (ink): all headline and body-strong text, primary buttons, the phone body, the camera corner brackets, waveform bars.
- **Ink Sub** (ink-sub) and **Ink Faint** (ink-faint): secondary copy and small captions. They now sit four points of alpha apart, so treat them as one quiet tier.
- **Ink Line** (ink-line): hairline dividers in the menu and closing list, the nav's bottom edge, and the finder's inner ring.

### Named Rules
**The One Word Rule.** Each headline carries exactly one saffron phrase, and it is the phrase the scene proves ("meant", "drifts", "every part", "out loud"). Saffron is never a background fill on the page.

**The Part Colour Rule.** Sky is rice, tomato is chicken, saffron is fried onions, pink is lemon, mint is raita, in every scene, chip, mask and tag. A part colour never decorates anything that is not that part, or a fact about it.

## Typography

**Display Font:** Inter Tight Variable (with Inter Tight, system-ui)
**Wordmark Font:** Fredoka 600 (with system-ui)

**Character:** One grotesque does all the talking, pushed to 800 and 850 weight with tight negative tracking so headlines read as a heavy title card from the film. Fredoka's round shapes appear only as a name: the `nomi` wordmark, and the type inside the drawn app (the table tent's name, the dish name, screen titles and app buttons), where the page shows Nomi's own interface.

### Hierarchy
- **Display** (850, clamp(3rem, 5.4vw, 5.4rem), 0.95): the hero headline only, set as three block lines. The creed lines share the weight and tracking at clamp(2rem, 5.6vw, 5.4rem), line-height 1.
- **Headline** (800, clamp(2.1rem, 4.6vw, 4.1rem), 1.02, balanced): every scene headline, including the swapped lines. The closing headline goes up to clamp(2.4rem, 5.4vw, 5rem).
- **Title** (800, clamp(1.3rem, 2.2vw, 1.8rem), -0.03em): the closing ways list. The models menu runs larger, clamp(1.6rem, 3.4vw, 3rem) at line-height 1. Watch-list dish names use 800 at 1.15rem.
- **Body** (400, clamp(1rem, 1.25vw, 1.12rem), 1.55, pretty wrap, max 34rem) in ink-sub. The hero lede is one step up (clamp(1.05rem, 1.35vw, 1.22rem), max 32rem). The page base is 17px.
- **Label** (700, 0.78 to 0.95rem, tabular numerals for counts): chip text, frame captions, the SAM model name, step numbers, footer and source lines. Labels are sentence case; there is no uppercase tracked label in the system.
- **Wordmark** (Fredoka 600, 1.7rem in the nav, 1.3rem in the footer, line-height 1).

### Named Rules
**The Heavy Ink Rule.** Headlines are 800 or heavier with -0.03em or tighter tracking. Weight, not size jumps or colour, carries hierarchy; secondary text is quieter by alpha, not by a lighter typeface.

**The Fredoka Is a Name Rule.** Fredoka sets the word `nomi` and the drawn app's own interface. Page headlines, body and labels never use it.

## Layout

The page is a vertical sequence of full-viewport scenes. The hero is a two-column grid (1fr / 1fr) at 100svh with the drawn plate's stage bleeding off the right edge (negative margin of the gutter plus 6vw), the plate up to min(84svh, 58vw) tall. Each pinned scene is a 100svh grid of copy (0.8fr) and stage (1.2fr) with a 3vw gap, 90px top padding to clear the fixed nav, and overflow hidden. Unpinned sections (the voice card, the models menu, the close) use the same 0.8fr / 1.2fr or 1fr / 1fr split with generous clamp-based vertical padding (about 80 to 180px). Content caps at 1320px (menu) and 1440px (close).

Horizontal rhythm comes from one gutter, clamp(16px, 4vw, 56px), used for the nav, every section and the footer. Inside, gaps step through 6, 10 to 12, 18, and 24 to 26px; copy stacks use 26px between headline, body and controls.

**Responsive (at 1023px and below):** every grid collapses to one column. The nav links hide and the small ink button moves to the right. The hero puts the plate first (46svh, bleeding 12vw past both edges), then the headline at clamp(2.6rem, 11vw, 4.4rem), and both actions go full width. Pinned scenes stack copy above a stage row (auto / minmax(0, 1fr)) with 80px top padding and a 14px gap, the scene headline drops to clamp(1.8rem, 7.4vw, 2.6rem), and the body clamps to four lines at 0.92rem. Part chips move from a right-hand column to a wrapping row along the bottom. The step list shows only the active step. Pin lengths shorten to 0.8 of desktop. The scroll cue hides.

## Elevation & Depth

Depth is soft and warm, as if each sheet sits a few millimetres above paper under kitchen light. The shared shadow is a two-layer brown ambient; ink objects cast ink-tinted shadows; the drawn dish casts its own blurred brown shadow inside the SVG. There are no grey shadows, no hard offset shadows and no glassy blur.

### Shadow Vocabulary
- **Warm sheet** (`box-shadow: 0 30px 60px -24px rgba(70, 50, 10, 0.32), 0 8px 18px -8px rgba(70, 50, 10, 0.18)`): every floating white chip, sheet, shot card, voice bubble and the voice card.
- **Ink lift** (`box-shadow: 0 16px 30px -12px rgba(27, 27, 58, 0.55), inset 0 -4px 0 rgba(0, 0, 0, 0.25)`): the ink button; the inset bottom edge is the clay lip that makes it feel pressable. On hover the drop deepens to `0 22px 36px -12px rgba(27, 27, 58, 0.6)`.
- **Device** (`box-shadow: 0 50px 90px -30px rgba(27, 27, 58, 0.55), inset 0 0 0 2px #34345a`): the drawn phone.
- **Nudge glow** (`box-shadow: 0 20px 40px -14px rgba(217, 142, 0, 0.6)`; mint version `rgba(46, 154, 95, 0.45)`): nudges glow in their own colour.
- **In-screen card** (`box-shadow: 0 10px 22px rgba(27, 27, 58, 0.1)`): cards inside the drawn phone.
- **Drawn lift** (SVG `feDropShadow dx 3, dy 6, blur 5, #46320A at 0.32`; graph nodes `drop-shadow(0 14px 22px rgba(70, 50, 10, 0.18))`): food pieces and graph nodes inside SVG.

### Named Rules
**The Warm Shadow Rule.** Shadows are tinted brown (70, 50, 10) on paper and ink-tinted under ink objects, always large-blur with negative spread. A shadow with no blur, or a neutral grey one, is not part of this world.

## Shapes

Everything is puffy and rounded, with radius growing with the object: 8px on frame captions, 12px on number tabs and the QR, 14px on nav links and camera frames, 16px on small buttons and arrow tiles, 18px on part chips and tags, 20px on buttons, checklist rows and voice bubbles, 22px on nudges, 26px on cards and shot cards, 30 to 34px on the finder and the voice card, 48px on the phone. Swatch squares are rounded squares (4 to 5px on 10 to 14px), never circles; part bars inside chips are 34 by 6px pills. Voice bubbles have one tight corner (20px 20px 20px 6px) to point at their speaker. Camera brackets are 4px ink strokes with a 12px rounded outer corner. Hairlines (1px ink-line) divide list rows; the closing list opens with a 2px ink rule.

## Components

### Buttons
Tactile and heavy, like a pressed clay tile.
- **Shape:** gently puffy (20px radius; 16px for the small size), 56px tall (44px small).
- **Ink (primary):** ink ground, cream label, 700 weight at 1rem, ink-lift shadow with the clay lip. One per view, for opening the live app.
- **Line (secondary):** 70% white ground with a 2px inset ink ring, ink label; goes full white on hover.
- **Hover / Focus:** both rise 2px over 0.4s on the expo-out curve. Focus is a 3px saffron outline offset 3px with a 10px radius, site-wide.

### Chips (part chips)
- **Style:** white, 18px radius, warm sheet shadow, 700 label, a part-colour swatch (12px rounded square, or 34 by 6px bar in a list) leading, a count in tabular numerals trailing (ink-sub, or mint for "in 3 of 3").
- **Behaviour:** chips arrive with a back-out pop and point at the part they name; the hero chip follows each traced part.

### Cards / Containers
- **Corner Style:** 26px for sheets and shot cards, 34px for the voice card.
- **Background:** white on paper; checklist rows inside a white card use paper.
- **Shadow Strategy:** warm sheet (see Elevation & Depth).
- **Border:** none; the finder alone takes a 1px ink-line inner ring.
- **Internal Padding:** 20px 22px for sheets; clamp(24px, 3vw, 44px) for the voice card.

### Navigation
Fixed, transparent over the hero, then a 94% paper bar with a 1px ink-line bottom edge once scrolled. Brand coin (a drawn amber disc with a darker lip) plus the Fredoka wordmark at left; four section links in ink-sub, 600 at 0.95rem with a 14px-radius 5% ink hover wash; a small ink button at right. Below 1024px the links hide.

### Nudges
The pass's quiet verdict pill: 22px radius, 750 weight, a 22px masked glyph leading. Warning is amber with an ink exclamation; found is mint-soft with a mint check and deep green text. Nudges rise in with a back-out pop and glow in their own colour.

### SAM Trace (signature)
Each part's mask is drawn as a 6px (7px at the pass) round-joined outline in its part colour that traces itself in by stroke-dash offset (0.9s, power2.inOut, staggered 0.08s), then a 0.22-opacity fill, then the part chip pops in beside it. On the hero this cycles through chicken, rice, onions, lemon and raita forever; in the Golden Plate scene the dish's layers lift apart in 3D (rotateX about 58deg, rotateZ -18deg) and every part traces at once.

### The Drawn Dish (signature)
The Chicken Biryani is five SVG layers on one 1000 by 1000 grid, one per SAM part (rice, chicken, fried onions, lemon, raita) over a plate layer, built from a seeded random generator. Stacking the layers rebuilds the dish; lifting or removing a layer explains or drifts it. Drifted copies are the same generator with a different plate spec. At runtime each drawing is painted once to a bitmap for smooth scrubbing; the source of truth stays vector.

### Motion grammar
- **Load intro:** expo-out (0.16, 1, 0.3, 1). Headline lines rise 60% from a 10px blur, staggered 0.09s; the plate spins in from -50deg at 0.55 scale; the rice reveals by a growing circular clip; the chicken pieces drop in with back-out(2). The plate then sways ±4deg on a 7s sine loop.
- **Pinned scenes:** each scene is one timeline pinned for a multiple of the viewport height and scrubbed with a 0.7s lag, so it reverses on scroll-up.
- **Headline swap:** the current line leaves up 36px into an 8px blur (0.35s, power2.in); the next arrives from 36px below out of the blur (0.45s, power3.out), overlapping by 0.05s, in a single stacked grid cell.
- **Pops:** anything Nomi produces (chips, tags, nudges, checks, bubbles) enters with back-out between 1.8 and 2.4.
- **Reduced motion:** no pins, every swapped line shown stacked, every scene shown at its finished state, the scroll cue stops.

## Do's and Don'ts

### Do:
- **Do** draw every dish, plate copy, device, QR and camera frame in seeded SVG; keep the real Meta and Muse marks as the only rasters.
- **Do** keep each SAM part in its part colour in every appearance (sky rice, tomato chicken, saffron onions, pink lemon, mint raita).
- **Do** set headlines in Inter Tight at 800 to 850 with -0.035em to -0.04em tracking, with exactly one saffron phrase.
- **Do** float Nomi's outputs on white Clay Tiffin sheets (18px chips, 26px cards) with the warm brown two-layer shadow.
- **Do** tell each idea as a pinned, scroll-scrubbed scene that plays backward on scroll-up, and give the reduced-motion reader the finished frame.
- **Do** use cream, not pure white, for text and glyphs on ink.

### Don't:
- **Don't** use photographs or screen recordings of dishes or of the app.
- **Don't** use Fredoka for page headlines, body or labels.
- **Don't** use a part colour as decoration, or saffron as a page background.
- **Don't** use grey or hard-offset shadows.
- **Don't** add a mascot, a stats bar, or a phone-mockup feature grid.
