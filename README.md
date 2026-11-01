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

The guest page and chef home render from seed data without the API. To run the full stack:

```bash
supabase start                # needs Docker; copy the service_role and anon keys into .env
supabase db reset             # applies migrations and seed
npm run api                   # http://localhost:8787
npm run smoke -w @nomi/models # one cheap call to prove the model key works
```

Android: `npm run app:android` with a device or emulator connected.

Vision worker tests:

```bash
cd services/vision-worker && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt && .venv/bin/python -m pytest
```

## Rules

- Every model call goes through `packages/models`; every output that drives UI is validated with zod.
- Nomi shows only what it can see, count or hear, with evidence. No guessed volumes, weights, money or predictions.
- Every AI-proposed action waits for a human approval.

## Open-source libraries

Expo, React Native, Expo Router, Reanimated, react-native-svg, Hono, Supabase, zod, the OpenAI-compatible SDK, FastAPI, NumPy. Fonts: Fredoka and Nunito (Google Fonts). Logo animation made with fun-isometric by Kelvin Adithya.
