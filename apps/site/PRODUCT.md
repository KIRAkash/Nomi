# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vite + plain TypeScript + GSAP (ScrollTrigger), chosen by Akash on 2026-11-04. Served from the same Cloud Run service as the Expo web export of `apps/app`, so the landing sits at `/` and the app's routes (`/sign-in`, `/setup`, `/t/<token>`) sit beside it, all calling the live API.

## Users

First: Meta Global AI Developer Hackathon judges, who need the whole picture in a few minutes and then want to try the live app. Second: owners and head chefs of premium restaurants (the demo restaurant is Saffron House), who need to believe Nomi keeps their dish consistent and brings back honest guest feedback.

## Product Purpose

Nomi keeps every plate the way the chef meant it. The head chef sets a Golden Plate once (three photos, SAM 3.1 masks, rules said out loud); the pass camera checks plates against it before they leave; guests give feedback in about ten seconds from a table QR, in any language; each morning NIGHTSHIFT turns the night's facts into a briefing and tonight's watch list.

## Positioning

Checks every plate against the chef's own Golden Plate using six Meta models (Muse Wonder, Muse Spark, Muse Image, Muse Voice, Glimmer, SAM 3.1), and shows only what it can see, count or hear.

## Operating Context

Kitchen pass (tablet, mounted camera), the chef's phone, the dining table (guest's own phone, no app, no sign-in), the owner's morning. Android app and web app from one Expo codebase.

## Capabilities and Constraints

- Live today: guest dish recognition, Golden Plate calibrate/photos/SAM masks, pass check, NIGHTSHIFT briefing, pre-service watch list. Other staff screens run on seed data.
- Demo sign-in accepts any 10-digit number and the code shown on screen. Guest demo page: `/t/demo-table-7`.
- No database on the hosted API: demo tokens serve the seed restaurant and feedback is not saved.

## Brand Commitments

- Name `nomi`, tagline "Every plate, the way the chef meant it."
- Logo: the Golden Plate clay sticker (`design/logo/export/plate-clay.*`).
- App world: Clay Tiffin (`design/clay-tiffin.css`). Pitch film world (chosen by Akash): light "Paper" ground (#FFF0C2 top-left fading to white, fine still grain), ink #1B1B3A, saffron #D98E00, Inter Tight display, Fredoka for the wordmark. Premium restaurant, no mascot, no humour; intense motion.
- Real Meta / Muse marks on model mentions (`video/public/brand`).

## Evidence on Hand

- Plate cutouts with SAM part layers: `video/public/plates/` (golden + four drifted copies, `plates.json` counts).
- Real screen recordings of the app: `video/public/clips/*.mp4`. Pitch film: `video/out/nomi.mp4`.
- Live NIGHTSHIFT run counts (demo data): Chicken Biryani rice under the Golden Plate area on 6 of 39 plates; Paneer Tikka mint chutney missing on 3 of 24; Tandoori Prawns short on 2 of 18.
- No customers, testimonials, pricing or usage statistics exist. Never invent them.

## Product Principles

1. Facts only: what Nomi can see, count or hear. No guessed volumes, weights, rupees or predictions; links between facts are labelled "likely cause".
2. People approve every AI-proposed action.
3. Low confidence is shown, not hidden.
4. Kitchen-proof and calm: quiet nudges, never alarms.

## Accessibility & Inclusion

Motion respects reduced-motion; colour is never the only signal; guests speak any language (Hindi, Kannada, Bengali shown in demos).
