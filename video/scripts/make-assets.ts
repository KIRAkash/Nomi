// npx tsx --env-file=.env video/scripts/make-assets.ts [--only <text>] [--sam-only] [--force]
// Makes the pitch video's plates and pass frames with Muse Image at full size (PNG, no downscale), then runs SAM 3.1 on the
// plates through the API and vision worker, so the breakdown and cutouts in the video use what the model actually found.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { MODELS, metaClient } from '../../packages/models/src/client.ts';
import { generateDishIcon } from '../../packages/models/src/tasks.ts';

const ROOT = new URL('../../', import.meta.url).pathname;
const OUT = join(ROOT, 'video/assets/generated');
const APP = join(ROOT, 'apps/app/assets/images/demo');
const API = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787';

const args = process.argv.slice(2);
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const samOnly = args.includes('--sam-only');
const force = args.includes('--force');

// Same nouns and colours as the app's Chicken Biryani parts in docs/demo-images.md.
const BIRYANI = [
  { name: 'Rice', prompt: 'rice', colour: '#4D9DE0' },
  { name: 'Chicken pieces', prompt: 'chicken pieces', colour: '#D93A2E' },
  { name: 'Fried onions', prompt: 'fried onions', colour: '#FFB627' },
  { name: 'Lemon wedge', prompt: 'lemon wedge', colour: '#FF7AB6' },
  { name: 'Raita bowl', prompt: 'bowl', colour: '#3BB273' },
];

const KEEP = 'Keep the camera, the surface and the light exactly the same.';
const KEEP_REST = `Keep everything else exactly as it is: every other component, count and position. ${KEEP}`;

type Shot = { path: string; from: string | null; prompt: string; sam: boolean };
const shots: Shot[] = [
  // The hero plate on the dark stage: the app's Golden Plate, only the counter and light changed.
  {
    path: 'hero/golden.png',
    from: join(APP, 'chicken-biryani/golden-1.jpg'),
    sam: true,
    prompt: `Keep the plate, the raita bowl, the food and every component, count and position exactly as they are, and keep the
      camera exactly the same. Change only the surface and the light: everything now sits on a dark charcoal matte slate
      surface, nearly black, with a fine stone texture. One soft warm key light from the top left, gentle falloff into
      darkness at the edges of the frame, a soft natural shadow under the plate rim. Fine-dining food photograph. No hands,
      no people, no cutlery, no text, no logos.`,
  },
  // The bottom layer of the plate breakdown: the same plate with nothing on it.
  {
    path: 'hero/empty.png', from: 'hero/golden.png', sam: false,
    prompt: `Remove all the food from the plate and remove the raita bowl completely, leaving only the clean, empty white plate
      in exactly the same place. ${KEEP}`,
  },
  // The table the printed menu lies on for the Menu Snap camera feed.
  {
    path: 'menu/table.png', from: null, sam: false,
    prompt: `Photorealistic photo taken straight down from directly above of an empty warm brown wooden restaurant table top,
      fine natural wood grain running left to right, soft even daylight, gentle falloff at the edges. Nothing on the table:
      no objects, no cutlery, no text, no logos, no people.`,
  },
  // The drift: each generation edits the one before, so the losses add up.
  { path: 'hero/drift-1.png', from: 'hero/golden.png', sam: true, prompt: `Remove only the lemon wedge from the plate rim. ${KEEP_REST}` },
  { path: 'hero/drift-2.png', from: 'hero/drift-1.png', sam: true, prompt: `Remove only the fried onions from the rice. ${KEEP_REST}` },
  {
    path: 'hero/drift-3.png', from: 'hero/drift-2.png', sam: true,
    prompt: `Change only the rice: the rice mound is clearly smaller, about a fifth less rice, so more white plate shows around it. ${KEEP_REST}`,
  },
  {
    path: 'hero/drift-4.png', from: 'hero/drift-3.png', sam: true,
    prompt: `Remove one chicken piece so exactly 3 pieces remain, remove the coriander leaves, and scatter a few grains of rice
      onto the plate rim. ${KEEP_REST}`,
  },
  // Pass camera frames for the Glimmer scene, edited from the pass photo the live recording uses.
  {
    path: 'pass/frame-empty.png', from: join(APP, 'chicken-biryani/pass-onions-missing.jpg'), sam: false,
    prompt: `Remove the plate and the raita bowl completely, leaving only the empty brushed stainless steel counter. ${KEEP}`,
  },
  {
    path: 'pass/frame-hands.png', from: join(APP, 'chicken-biryani/pass-onions-missing.jpg'), sam: false,
    prompt: `A cook's two hands, in a black chef jacket with rolled sleeves, slide this plate onto the counter from the bottom edge
      of the frame. The plate is only half inside the frame, near the bottom; the raita bowl is not there yet. Keep the food on
      the plate exactly as it is. ${KEEP} No face.`,
  },
  {
    path: 'pass/frame-face.png', from: join(APP, 'chicken-biryani/pass-onions-missing.jpg'), sam: false,
    prompt: `A cook in a black chef jacket and a black cap leans in over the pass at the top edge of the frame: head and shoulders
      seen from above, face partly visible, looking down at the plate. Keep the plate, the raita bowl and the food exactly as
      they are, in the same place. ${KEEP}`,
  },
];

const flat = (s: string) => s.replace(/\s+/g, ' ').trim();
const abs = (p: string) => (p.startsWith('/') ? p : join(OUT, p));

// Muse Image returns WebP; keep a lossless PNG at the size it was made.
function savePng(b64: string, file: string) {
  mkdirSync(dirname(file), { recursive: true });
  const tmp = `${file}.src`;
  writeFileSync(tmp, Buffer.from(b64, 'base64'));
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', tmp, file]);
  execFileSync('rm', [tmp]);
}

async function make(s: Shot) {
  const file = abs(s.path);
  if (existsSync(file) && !force) return false;
  let res;
  if (s.from === null) res = await metaClient().images.generate({ model: MODELS.image, prompt: flat(s.prompt), size: '1536x1024' });
  else {
    const from = abs(s.from);
    if (!existsSync(from)) throw new Error(`${s.path}: make ${s.from} first`);
    const type = from.endsWith('.png') ? 'image/png' : 'image/jpeg';
    res = await metaClient().images.edit({
      model: MODELS.image, image: new File([readFileSync(from)], `source.${type.split('/')[1]}`, { type }), prompt: flat(s.prompt), size: '1536x1024',
    });
  }
  const b64 = res.data?.[0]?.b64_json;
  if (!b64) throw new Error(`${s.path}: no image returned`);
  savePng(b64, file);
  return true;
}

async function sam(s: Shot) {
  const file = abs(s.path);
  const json = file.replace(/\.png$/, '.sam.json');
  if (!s.sam || !existsSync(file) || (existsSync(json) && !force && !samOnly)) return false;
  const photo = `data:image/png;base64,${readFileSync(file).toString('base64')}`;
  const res = await fetch(`${API}/golden/read`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ photos: [photo], parts: BIRYANI, plate: true }),
  });
  if (!res.ok) throw new Error(`${s.path}: API ${res.status} ${(await res.text()).slice(0, 200)}`);
  const { photos } = (await res.json()) as { photos: { id: string; ok: boolean; error?: string }[] };
  const { id: _id, ...read } = photos[0];
  if (!read.ok) throw new Error(`${s.path}: ${read.error}`);
  writeFileSync(json, JSON.stringify(read));
  return true;
}

// Shots that edit an earlier shot run in order; the rest could run in parallel, but the chain is short enough not to bother.
for (const s of shots.filter((x) => !only || x.path.includes(only))) {
  try {
    if (!samOnly && (await make(s))) console.log(`✓ made ${s.path}`);
    if (await sam(s)) console.log(`✓ SAM ${s.path}`);
  } catch (err) {
    console.log(`✗ ${(err as Error).message}`);
  }
}

// A camera-shake frame for the Glimmer scene: the hands frame with vertical motion blur, made locally (no model).
const blur = join(OUT, 'pass/frame-blur.png');
if (existsSync(join(OUT, 'pass/frame-hands.png')) && (!existsSync(blur) || force) && (!only || 'pass/frame-blur.png'.includes(only))) {
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', join(OUT, 'pass/frame-hands.png'), '-vf', 'dblur=angle=90:radius=30', blur]);
  console.log('✓ made pass/frame-blur.png');
}

// The dish icon at the size Muse Image draws it (the app keeps a 384 px copy).
const icon = join(OUT, 'icon/chicken-biryani.png');
if (!samOnly && (!existsSync(icon) || force) && (!only || 'icon/chicken-biryani.png'.includes(only))) {
  try {
    const img = await generateDishIcon({ purpose: 'video_icon' }, new Blob([readFileSync(join(APP, 'chicken-biryani/golden-1.jpg'))], { type: 'image/jpeg' }));
    if (!img?.b64_json) throw new Error('no image returned');
    savePng(img.b64_json, icon);
    console.log('✓ made icon/chicken-biryani.png');
  } catch (err) {
    console.log(`✗ icon: ${(err as Error).message}`);
  }
}
