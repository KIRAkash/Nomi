# Nomi

Every plate, the way the chef meant it. One Expo codebase for the Android app and the web app (the guest QR page included), built for the Meta Global AI Developer Hackathon (Oct 26 – Nov 4, 2026). All code in this repository was written during the event.

## Layout

```text
apps/
  app/             Expo (SDK 58) app: staff tabs + guest route /t/[token]; exports Android and web
  api/             Hono API: guest routes (token-scoped, rate-limited), later staff routes
packages/
  shared/          Row types and zod schemas for every model output
  models/          Meta Model API router (Wonder, Spark, Image, Voice, SAM) + local Glimmer client
  ui/              Clay Tiffin tokens, motion presets, components, dish and face art
services/
  vision-worker/   Python FastAPI: plate signatures from SAM masks, plate scoring
supabase/          Migrations (schema + RLS) and demo seed
design/            Logo stickers (fun-isometric) and the Clay Tiffin stylesheet
```

## Run it

```bash
cp .env.example .env          # add MODEL_API_KEY
npm install
npm run app:web               # http://localhost:8081, guest page at /t/demo-table-7
```

The guest page and every staff screen render from seed data without the API. Sign in with any 10-digit number and the code shown on screen, then pick a role (Head Chef, Owner, Manager, Staff); tap the avatar at the top right to switch roles. Model calls on staff screens are timed mocks until their API routes land, and each is labelled with the model that will make it. [docs/experience-map.md](docs/experience-map.md) lists every journey, AI feature and UI rule.

To run the full stack:

```bash
supabase start                # needs Docker; copy the service_role and anon keys into .env
supabase db reset             # applies migrations and seed
npm run api                   # http://localhost:8787
npm run smoke -w @nomi/models # one cheap call to prove the model key works
```

Android: `npm run app:android` with a device or emulator connected.

Hosted backend for remote testers: `deploy/gcp.sh` builds the API and vision worker with Cloud Build and runs them on Cloud
Run (project `genai-hack-project-nexus`, region `asia-south1`; override with `GCP_PROJECT` and `GCP_REGION`). The model key
goes from `.env` into Secret Manager. The API is public and rate limited per device; the worker only accepts the API. With no
database configured, demo table tokens serve the seed restaurant and feedback is not saved. Both keep one warm instance, so
scale them to zero after judging.

Android APK to install on any phone (built in the cloud with EAS, no Android Studio needed):

```bash
cd apps/app && npx eas-cli@latest login     # once, with a free Expo account
npx eas-cli@latest env:set --environment preview --name EXPO_PUBLIC_API_URL --value <hosted API URL> --visibility plaintext
npm run app:apk                             # from the repo root; first run links the project and creates the signing key
```

Open the link or QR code it prints on the phone to install. The API address is baked in at build time; it is set to the
hosted API, so the APK works anywhere. Change it with `env:set` and build again.
`.easignore` keeps `design/`, `docs/`, `services/` and `supabase/` out of the upload.

Vision worker (decodes and measures SAM 3.1 masks for the Golden Plate masks step; the API calls it on port 8001):

```bash
cd services/vision-worker && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn app:app --port 8001   # run it
.venv/bin/python -m pytest              # test it
```

Without the API or the worker, the masks step says so and offers a recorded sample plate instead.

Demo photos for a mock run (Golden Plates, good and off-standard plates, guest photos, shelves, the closing round, the menu)
are listed with their prompts in [docs/demo-images.md](docs/demo-images.md). `npm run demo:media -w @nomi/models` makes the
missing ones with Muse Image and saves a real SAM 3.1 run next to each. Turn on **Demo camera** in the role picker (tap your
avatar) and every camera in the app plays them instead of the device camera.

## Rules

- Every model call goes through `packages/models`; every output that drives UI is validated with zod.
- Nomi shows only what it can see, count or hear, with evidence. No guessed volumes, weights, money or predictions.
- Every AI-proposed action waits for a human approval.

## Open-source libraries

Expo, React Native, Expo Router, Reanimated, react-native-svg, Hono, Supabase, zod, the OpenAI-compatible SDK, FastAPI, NumPy. Fonts: Fredoka and Nunito (Google Fonts). Logo animation made with fun-isometric by Kelvin Adithya.
