# Nomi pitch and demo video: plan

3:00, 1080p 16:9, 30 fps, built in Remotion (`@remotion/three` for 3D). Premium restaurant: Saffron House. No mascot, no
humour; intense motion graphics. Facts only, no invented statistics. Every model beat shows the real Meta logo.

## Format

From 0:28 to 2:50 the frame is split: the live recording plays inside a realistic phone or tablet on one side, and an
animation of what is happening underneath plays on the other, in sync. A model rail along the bottom lights the model
that is running. The end card says Nomi runs on the web and Android.

## Script

| Time | Recording | Under the hood | Voiceover |
|---|---|---|---|
| 0:00–0:22 | — | Hero plate in light, copies drift (`hero/drift-1..4`); guest comments dissolve | A head chef designs a dish once. Then other cooks make it hundreds of times, across shifts, new hires and busy nights. The plate drifts. Guests notice, but few say so. The ones who do write days later, and no one can tell which plate they meant. |
| 0:22–0:28 | — | Logo forms; six model logos fill the rail | Nomi keeps every plate the way the chef made it. It runs on six Meta models. |
| 0:28–0:38 | C1 menu capture → R1 menu review | Scan line, dishes lift into cards, parts list fills | The chef photographs the menu. Muse Wonder reads every dish. Muse Spark lists what goes on each plate. |
| 0:38–1:00 | C2 golden photos → masks, R2 tap-to-fix | 3 photos stack in 3D, SAM layers peel apart, "in all 3" locks | Then the chef plates the dish and takes three photos. SAM 3.1 finds each part: rice, chicken, onions, lemon, raita. A part counts only if it's in all three. If SAM misses one, the chef taps it. |
| 1:00–1:15 | R3 voice rules → SOP card | Waveform → text → rule chips → card renders | The chef says the rules out loud. Muse Voice writes them down, Spark turns them into checks, and Muse Image draws the card the line cooks follow. |
| 1:15–1:45 | C3 pass check | Glimmer frame stream (`pass/frame-*`), Golden Plate outline compare, missing part flares | At the pass, a camera checks each plate. Glimmer is built to run on the restaurant's own computer: it keeps only the frames with a plate, so faces never leave the kitchen. SAM 3.1 compares the plate with the Golden Plate. Fried onions missing. The cook gets a quiet nudge before it leaves. |
| 1:45–2:15 | C4 QR + plate photo → R4 voice note, tags | QR sweep, dish name lands, Hindi waveform → transcript → translation → tags | At the table, the guest scans a QR code and shows their plate. Spark names the dish. They can just talk, in any language. Muse Voice writes it down, Spark tags it and reads it back, so the guest can fix it before staff see it. |
| 2:15–2:40 | R5 inbox → reply → approve, R6 briefing | Note links to plate photo; Wonder fans out to 4 Spark analysts | The manager sees the note beside the guest's photo, with a reply drafted in the guest's language. Nothing goes out until they approve it. Each morning, Wonder plans a review of the night and Spark checks it four ways. Tonight's watch list: garnish missing on 3 of 21 plates. |
| 2:40–2:50 | R7 Ask Nomi, C5 larder, R8 translated cards | One model chip per cut | Ask Nomi answers from counts, not guesses. SAM counts the larder. Every cook reads the cards in their own language. |
| 2:50–3:00 | — | Three rules, perfect plate returns, "Built on Meta", web + Android | Nomi shows only what it can see, count or hear. People approve every action. Every plate, the way the chef meant it. |

## Recording: Claude records every clip

All clips are recorded from the **web app** in Chromium with Playwright, at two generic device sizes:
- **Phone:** 412×915 at 2.625× → 1081×2402 (20:9), portrait, touch and mobile emulation on.
- **Tablet:** 1280×800 at 2× → 2560×1600 (16:10), landscape, touch on.

Frames are captured over the Chrome DevTools screencast at full pixel density and rebuilt at a constant 30 fps (Playwright's
own recorder is too compressed). Each run also writes the time and position of every tap, which Remotion draws as fingertip
ripples. Steps wait on real UI states (a mask appearing, a reply arriving), never fixed sleeps, so every model call in a clip
is live.

### Realistic camera feed

The app's camera stays in **real-camera mode** (Demo camera off). Chromium is started with a generated video as its webcam
(`--use-file-for-fake-video-capture`), so the app opens the camera, shows the feed in its own viewfinder, takes the picture
from that feed and sends that frame to the models, exactly as on a device.

Each feed is made from our photos by `video/record/feeds` and looks like a handheld camera:
- the camera arrives: a short move in from off-centre and slightly too far, then settles inside the framing marks;
- autofocus: soft for a moment, a small focus hunt, then sharp;
- auto exposure: opens a little dark and settles;
- handheld drift: smoothed sub-pixel shake and a fraction of a degree of roll, motion blur when moving;
- sensor grain and a faint lens vignette;
- tablet-at-the-pass feeds are fixed (mounted camera): no drift, the plate slides in instead.

| Clip | Device | Feed | Notes |
|---|---|---|---|
| C1 Menu Snap | Tablet | Handheld over `kitchen/menu-printed.jpg` on its table | Menu re-made larger with Muse Image if text is soft at tablet size |
| C2 Golden Plate | Tablet | Calibrate on `calibration-empty-plate.jpg`, then `golden-1`, `golden-2`, `golden-3` | One feed with three takes; the camera lifts away and returns between them, taps timed to each take |
| C3 Pass check | Tablet | Fixed: empty counter, plate slides in (SAM cutout over `pass/frame-empty`), settles | Needs the live pass route |
| C4 Guest | Phone | 1) A table tent with the table's real QR on the dining table; 2) `guest-table-7.jpg` | See QR below |
| C5 Larder | Phone | Handheld across `dry-store.jpg` | 3–4 s |

Microphone input is a recorded sample from `apps/app/assets/audio/` fed in as a fake microphone
(`--use-file-for-fake-audio-capture`), so Muse Voice transcribes real audio.

**QR scan:** a guest's phone camera app is not part of Nomi, so a recording-only page plays the table-tent feed, finds the QR
with the browser's barcode detector, shows the "Open link" pill and opens `/t/demo-table-7`. The table tent comes from the
app's Studio screen (Muse Image) and is placed on the dining table photo with the real QR.

### Non-camera clips

| Clip | Device | What |
|---|---|---|
| R1 | Tablet | Menu review: dish cards, amber fields, parts list |
| R2 | Tablet | Tap-to-fix on a missed part |
| R3 | Tablet | Hold-to-talk rules → rules read back → SOP card and icon |
| R4 | Phone | Guest rating, chef's questions, Hindi voice note, tags read back, thank-you |
| R5 | Phone | Manager inbox → feedback detail → reply draft → approve |
| R6 | Tablet | Owner morning briefing and kitchen watch list |
| R7 | Phone | Ask Nomi declining a prediction |
| R8 | Phone | Staff cards in Hindi and Kannada |
| R9 | Tablet | Under the hood: the six models and the live call log |

### Temporary app changes for recording

All behind `EXPO_PUBLIC_RECORDING=1`, so normal builds are unchanged, and removed after the video is done:
- hide the "Use demo photos" button, the Demo camera label and other developer-only text;
- a shutter flash and a short freeze-frame when a photo is taken, as a phone camera does;
- no scrollbars, focus rings or hover states (touch only);
- the clock fixed to a dinner service (Friday 8:40 pm) so every timestamp in the clips agrees;
- the recording-only QR page above.

The web app is recorded from a production export (`expo export -p web`) against the local API and vision worker, so no
developer overlays appear.

## Device frames

Drawn in code, not stock art, so they can move in 3D:
- **Phone:** thin even bezels, punch-hole front camera, rounded corners matched to the screen, side buttons, a satin metal
  edge with a moving highlight.
- **Tablet:** even bezel, front camera on the long edge, the same edge finish.
- Built as 3D models in Three.js: the recording is a video texture on the screen, under glass that catches a light sweep.
  This gives real perspective, tilt, depth of field and shadows on the dark stage.
- A drawn status bar (time from the fixed clock, signal, battery) on every clip, since the web recordings have none.
- Generic design, no manufacturer branding.

## Assets

Made (in `video/assets/generated/`, by `video/scripts/make-assets.ts`): hero Golden Plate and 4 drift plates with SAM 3.1
masks, 4 pass frames, the biryani icon at 1600 px.

Still to make: the camera feeds, the table tent with QR, possibly a larger menu.

Still needed from Akash: Meta and model logo SVGs (Muse Wonder, Spark, Image, Voice, SAM 3.1, Glimmer) with any usage rules;
team names, web URL and APK link; music track; voiceover choice.
