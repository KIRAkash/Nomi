// npm run demo:media -w @nomi/models [-- --only <text>] [--sam-only] [--force]
// Reads docs/demo-images.md, makes each missing image with Muse Image (edits keep the plate, counter and light identical),
// runs SAM 3.1 on it through the API and vision worker, and writes the app's manifest of demo photos and their masks.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { MODELS, metaClient } from './client.ts';
import { generateDishIcon } from './tasks.ts';

const ROOT = new URL('../../../', import.meta.url).pathname;
const DOC = join(ROOT, 'docs/demo-images.md');
const OUT = join(ROOT, 'apps/app/assets/images/demo');
const MANIFEST = join(ROOT, 'apps/app/src/lib/demo-media.ts');
const API = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787';

const args = process.argv.slice(2);
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const samOnly = args.includes('--sam-only');
const force = args.includes('--force');

type Part = { name: string; prompt: string; colour: string; role: string };
type Shot = { path: string; key: string; dish: string; make: string; size: string; style: string; shows: string; prompt: string; parts: Part[]; plate: boolean; sam: boolean };

// ---------- read the doc ----------
const doc = readFileSync(DOC, 'utf8');
const styles = Object.fromEntries([...doc.matchAll(/```style (\w+)\n([\s\S]*?)```/g)].map((m) => [m[1], m[2].trim().replace(/\s+/g, ' ')]));
const shots: Shot[] = [];
const dishParts: Record<string, Part[]> = {};
for (const section of doc.split(/^## /m).slice(1)) {
  const dish = section.split('\n')[0].trim();
  const table = section.match(/```parts\n([\s\S]*?)```/)?.[1] ?? '';
  const parts = table.trim().split('\n').filter(Boolean).map((l) => {
    const [name, prompt, colour, role] = l.split('|').map((x) => x.trim());
    return { name, prompt, colour, role };
  });
  if (parts.length) dishParts[dish] = parts;
  for (const block of section.split(/^### /m).slice(1)) {
    const path = block.split('\n')[0].trim();
    const field = (k: string) => block.match(new RegExp(`- \\*\\*${k}:\\*\\* (.+)`))?.[1].trim() ?? '';
    const style = field('Style');
    const only = field('SAM parts');
    const none = /^none/.test(only);
    const picked = only && !none ? only.split(',').map((x) => x.trim()) : null;
    shots.push({
      path, key: path.replace(/\.\w+$/, ''), dish, make: field('Make'), size: field('Size') || '1024x1024', style, shows: field('Shows'),
      prompt: block.match(/```prompt\n([\s\S]*?)```/)?.[1].trim().replace(/\s+/g, ' ') ?? '',
      parts: none ? [] : picked ? parts.filter((p) => picked.includes(p.name)) : parts,
      plate: style === 'pass' || style === 'guest',
      sam: style !== 'print' && style !== 'none' && (style === 'pass' || !none),
    });
  }
}
const todo = shots.filter((s) => !only || s.path.includes(only));
console.log(`${shots.length} images in the doc, ${todo.length} selected`);

// ---------- make images ----------
async function make(s: Shot) {
  const file = join(OUT, s.path);
  if (existsSync(file) && !force) return false;
  const prompt = s.style === 'none' ? s.prompt : `${styles[s.style]} ${s.prompt}`;
  const size = s.size as '1536x1024' | '1024x1536' | '1024x1024';
  const client = metaClient();
  let b64: string | undefined;
  if (s.make.startsWith('edit ')) {
    const from = join(OUT, s.make.slice(5).trim());
    if (!existsSync(from)) throw new Error(`${s.path}: make ${s.make.slice(5)} first`);
    const res = await client.images.edit({ model: MODELS.image, image: new File([readFileSync(from)], 'source.jpg', { type: 'image/jpeg' }), prompt, size });
    b64 = res.data?.[0]?.b64_json;
  } else {
    const res = await client.images.generate({ model: MODELS.image, prompt, size });
    b64 = res.data?.[0]?.b64_json;
  }
  if (!b64) throw new Error(`${s.path}: no image returned`);
  mkdirSync(dirname(file), { recursive: true });
  const tmp = `${file}.png`;
  writeFileSync(tmp, Buffer.from(b64, 'base64'));
  // macOS sips: JPEG, longest side 1280, so the app bundle stays small.
  execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '82', '-Z', '1280', tmp, '--out', file], { stdio: 'ignore' });
  execFileSync('rm', [tmp]);
  return true;
}

// ---------- run SAM ----------
async function sam(s: Shot) {
  const file = join(OUT, s.path);
  if (!s.sam || !existsSync(file)) return false;
  if (existsSync(file.replace(/\.\w+$/, '.sam.json')) && !force && !samOnly) return false;
  const photo = `data:image/jpeg;base64,${readFileSync(file).toString('base64')}`;
  const res = await fetch(`${API}/golden/read`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ photos: [photo], parts: s.parts.map(({ name, prompt, colour }) => ({ name, prompt, colour })), plate: s.plate }),
  });
  if (!res.ok) throw new Error(`${s.path}: API ${res.status} ${(await res.text()).slice(0, 200)}`);
  const { photos } = (await res.json()) as { photos: { id: string; ok: boolean; error?: string }[] };
  const { id: _id, ...read } = photos[0];
  if (!read.ok) throw new Error(`${s.path}: ${read.error}`);
  writeFileSync(file.replace(/\.\w+$/, '.sam.json'), JSON.stringify(read));
  return true;
}

for (const s of todo) {
  try {
    if (!samOnly && (await make(s))) console.log(`✓ made ${s.path}`);
    if (await sam(s)) console.log(`✓ SAM ${s.path}`);
  } catch (err) {
    console.log(`✗ ${(err as Error).message}`);
  }
}

// ---------- dish icons ----------
// Muse Image draws each dish's icon from its Golden Plate photo in the house style, as the Golden Plate flow does live.
const slugOf = (dish: string) => dish.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const iconDishes = Object.keys(dishParts).filter((d) => existsSync(join(OUT, slugOf(d), 'golden-1.jpg')));
await Promise.all(iconDishes.filter((d) => !only || slugOf(d).includes(only)).map(async (d) => {
  const file = join(OUT, 'icons', `${slugOf(d)}.png`);
  if (existsSync(file) && !force) return;
  try {
    const img = await generateDishIcon({ purpose: 'demo_icon' }, new Blob([readFileSync(join(OUT, slugOf(d), 'golden-1.jpg'))], { type: 'image/jpeg' }));
    if (!img?.b64_json) throw new Error('no image returned');
    mkdirSync(dirname(file), { recursive: true });
    const tmp = `${file}.src`;
    writeFileSync(tmp, Buffer.from(img.b64_json, 'base64'));
    // Muse Image returns WebP; ffmpeg makes a small PNG for the app bundle.
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', tmp, '-vf', 'scale=384:384', file]);
    execFileSync('rm', [tmp]);
    console.log(`✓ icon ${d}`);
  } catch (err) {
    console.log(`✗ icon ${d}: ${(err as Error).message}`);
  }
}));

// ---------- manifest ----------
const rel = (p: string) => `../../assets/images/demo/${p}`;
const lines = shots.filter((s) => existsSync(join(OUT, s.path))).map((s) => {
  const json = s.path.replace(/\.\w+$/, '.sam.json');
  const samReq = existsSync(join(OUT, json)) ? `require('${rel(json)}')` : 'null';
  return `  '${s.key}': { dish: ${JSON.stringify(s.dish)}, shows: ${JSON.stringify(s.shows)}, image: require('${rel(s.path)}'), sam: ${samReq} },`;
});
writeFileSync(MANIFEST, `// Generated by \`npm run demo:media -w @nomi/models\` from docs/demo-images.md. Do not edit by hand.
import type { GoldenRead } from './api';

export type DemoPart = { name: string; prompt: string; colour: string; role: string };
export type DemoShot = { dish: string; shows: string; image: number; sam: Omit<GoldenRead, 'id'> | null };

export const DEMO_SHOTS: Record<string, DemoShot> = {
${lines.join('\n')}
};

export const DISH_PARTS: Record<string, DemoPart[]> = ${JSON.stringify(dishParts, null, 2).replace(/"(\w+)":/g, '$1:')};

/** Each dish's icon, drawn by Muse Image from its Golden Plate photo. */
export const DISH_ICONS: Record<string, number> = {
${iconDishes.filter((d) => existsSync(join(OUT, 'icons', `${slugOf(d)}.png`))).map((d) => `  ${JSON.stringify(d)}: require('${rel(`icons/${slugOf(d)}.png`)}'),`).join('\n')}
};
`);
console.log(`manifest: ${lines.length} images in apps/app/src/lib/demo-media.ts`);
