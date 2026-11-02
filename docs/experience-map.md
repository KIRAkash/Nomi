# Nomi experience map

Every role's journey, every AI feature, and the UI rules the app follows. Written Nov 2, 2026, against the spec doc and the code on `main`. Status: **live** (real model call wired), **demo** (screen built on seed data, model call mocked), **planned**.

## 1. Product rules (apply to every screen)

1. **Facts only.** Nomi shows what it can see, count or hear. No guessed volumes, weights, rupees or predictions. A link between facts is labelled "Likely cause" and opens its evidence.
2. **Every AI output is labelled and explainable.** A small `AI · <model>` tag sits on anything a model produced; one tap on "Why?" shows the photos, quotes and counts behind it.
3. **Humans approve, Nomi drafts.** Replies, SOP changes, orders and published Golden Plates stay drafts until a named person approves them. Approvals show who approved and when.
4. **Low confidence is shown, not hidden.** Anything below the confidence bar is amber with "Check this", never silently kept.
5. **Kitchen-proof UI.** Touch targets ≥ 44 pt (primary buttons 60 pt), hold-to-talk instead of typing, high contrast ink on butter, no sound or red alarms at the pass, works one-handed.
6. **Accessible.** Every control has a role and label, colour is never the only signal (score + word + icon), motion respects reduced-motion, text scales.
7. **Privacy by design.** Guests are anonymous; a phone number is optional, consented and never shown in analytics. The pass camera crops out faces. Glimmer redacts phone numbers and emails on site.
8. **Live camera, never a file picker.** Every photo (guest plate, Golden Plate, pass, shelves, menu, closing) is taken in an in-app viewfinder with framing marks, so the shot is lined up the same way each time and can't be an old photo.
9. **Calm states everywhere.** Each list has an empty state that says what fills it, each model call has a loading line that says what is happening ("SAM 3.1 is finding the rice…"), each failure says what to do next.

## 2. Journeys by role

### Guest (web, no sign-in) — ~10 seconds

| Step | Screen | AI | Status |
| --- | --- | --- | --- |
| Scan table QR | G1 Choose your way | — | demo |
| Show your plate | G2 | Muse Spark names the dish; photo quality and "is this food" check | live |
| Pick what you ate | G3 | Dish icons drawn by Muse Image from each Golden Plate | demo |
| Rate + chef's questions | G4 | Questions proposed by Muse Spark, chosen by the chef | demo |
| Just say it | G5 | Muse Voice Transcribe, then **tags read back** ("Naan · cold") that the guest can remove | demo |
| Thank you | G6 | Optional phone for a reply in their language; urgent notes (allergy, hygiene) promise a manager call-back | demo |

### Head Chef (Android phone + tablet at the pass)

| Step | Screen | AI | Status |
| --- | --- | --- | --- |
| Sign in, set up restaurant | A1, A2 | — | demo |
| Menu Snap → review | A3, A4 | Muse Wonder reads the menu; unclear fields amber; Muse Spark proposes components per dish | demo |
| Golden Plate: calibrate → 3 photos → masks → tap-to-fix → voice rules → SOP card + icon → guest questions → publish | A7–A11 | Photo quality gate (measured on device), SAM 3.1 masks on the chef's own 3 photos with found-in-all-3 and count agreement, tap-to-fix with a box and point prompt, Voice Transcribe + Spark rules read back, Muse Image SOP card and icon, Spark questions | calibrate, photos and masks live; later steps demo |
| Dish Performance home | A12 | Consistency score from PASS, guest faces, flagged plates | demo |
| Dish detail timeline | A13 | Guest photo vs Golden Plate, translated comments, version history | demo |
| PASS camera | A14 | Glimmer frame filter on site, SAM 3.1 + worker score, quiet amber nudge | demo |
| Kitchen | A23 | **Pre-service watch list** built from yesterday's facts | demo |

### Owner

| Step | Screen | AI | Status |
| --- | --- | --- | --- |
| Today briefing | A18 | NIGHTSHIFT: Muse Wonder plans, 4 Muse Spark analysts in parallel, evidence chain, proposed actions | demo |
| Ask Nomi | A19 | Answers with evidence chips; declines predictions and says what it can count instead | demo |
| Insights | — | **Menu Lab** (weekly picks, faces, consistency per dish), shift comparison, **AI activity log** (every model call, purpose, latency) | demo |
| Studio | A5, A24 | Muse Image table tents with each table's QR | demo |

### Manager

| Step | Screen | AI | Status |
| --- | --- | --- | --- |
| Today | A18 | Urgent alerts first, then approvals | demo |
| Feedback inbox → detail | A15, A16 | Transcript, translation, tags, guest photo scored vs Golden Plate, reply drafted in the guest's language | demo |
| Issues | A17 | Clusters with counts per day | demo |
| Larder | A20 | SAM 3.1 counts whole items only; reorder list waits for approval | demo |
| Closing round | A21 | Visible flags only (no lid, spill, clutter), fix + after photo | demo |
| Team & tables | A6 | Rotate a table's QR token | demo |

### Staff

| Step | Screen | AI | Status |
| --- | --- | --- | --- |
| Cards | A23 | SOP cards, **translated into the staff member's language** (Muse Spark) | demo |
| Handover | A22 | Voice Transcribe with diarization → done / pending / problems | demo |
| Closing round | A21 | as above | demo |

## 3. AI features added in this pass (not in the first spec)

| Feature | Why it matters | Model | Rule check |
| --- | --- | --- | --- |
| Photo quality gate (guest + golden) | Blurry or cropped photos would poison scores | Muse Spark / Glimmer | Reports sharpness, framing, light — facts about the photo |
| 3-photo agreement check | Golden Plate must be repeatable before it is trusted | Vision worker | Spread across 3 photos, shown per component |
| Tags read back to the guest | Guest corrects Nomi before staff see it | Spark | Guest removes wrong tags |
| Urgent-note detection | Allergy or hygiene notes reach a manager in minutes | Spark severity | Shown as "Guest mentioned …", quoted |
| Pre-service watch list | Turns yesterday's misses into tonight's 3 reminders | Spark over PASS facts | Counts only ("garnish missing on 3 of 21 plates") |
| SOP card translation | Kitchen staff read in Hindi, Kannada, Bengali | Spark | Translation of approved text only |
| Menu Lab (weekly) | Which dishes guests pick and how they rate them | Wonder | Counts and averages, no forecasts |
| AI activity log | Owner sees every model call, purpose and latency | model_calls | Transparency for owner and judges |
| Ask Nomi guardrail | Refuses "how much will we sell" and offers what it can count | Wonder | Enforces rule 1 in conversation |
| Return-visit reply loop | Guest sees the approved reply on the same table page | Spark draft + manager approval | Nothing sent without approval |

## 4. Still planned (after this pass)

- Real API wiring for staff screens (`/feedback`, `/briefings/latest`, `/actions/:id/approve`) and Supabase Realtime for the inbox.
- Phone OTP sign-in with Supabase Auth (the demo sign-in accepts any number).
- Continuous frame capture on the pass (the PASS screen takes one frame per press today), and the photo check on Android (it runs in the browser now).
- WhatsApp channel for guest replies and the owner briefing.
- Guest page in Hindi as well as English.
