// npm run golden:export -w @nomi/api: writes src/golden-plates.json, the published Golden Plates the pass checks against,
// from the parts tables in docs/demo-images.md and the SAM 3.1 reads saved with each dish's golden photos.
// Only what scoring needs is kept (plate circle, and per part: found, count, share, centre); the outlines stay in the app.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { DEMO_GUEST_PAGE } from '@nomi/shared';

const ROOT = new URL('../../../', import.meta.url).pathname;
const DEMO = join(ROOT, 'apps/app/assets/images/demo');
const slug = (dish: string) => dish.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

type Read = { plate: { cx: number; cy: number; r: number } | null; parts: { name: string; found: boolean; count: number; share: number; centre: [number, number] | null }[] };
const doc = readFileSync(join(ROOT, 'docs/demo-images.md'), 'utf8');
const out: Record<string, unknown> = {};
for (const section of doc.split(/^## /m).slice(1)) {
  const name = section.split('\n')[0].trim();
  const dish = DEMO_GUEST_PAGE.dishes.find((d) => d.name === name);
  const table = section.match(/```parts\n([\s\S]*?)```/)?.[1];
  if (!dish || !table) continue;
  const parts = table.trim().split('\n').filter(Boolean).map((l) => {
    const [part, prompt, colour, role] = l.split('|').map((x) => x.trim());
    return { name: part, prompt, colour, role };
  });
  const golden = [1, 2, 3].map((i) => join(DEMO, slug(name), `golden-${i}.sam.json`)).filter(existsSync)
    .map((f) => JSON.parse(readFileSync(f, 'utf8')) as Read)
    .filter((r) => r.plate)
    .map((r) => ({ plate: { cx: r.plate!.cx, cy: r.plate!.cy, r: r.plate!.r }, parts: r.parts.map(({ name: n, found, count, share, centre }) => ({ name: n, found, count, share, centre })) }));
  if (!golden.length) continue;
  out[dish.id] = { name, version: name === 'Chicken Biryani' ? 2 : 1, parts, golden };
}
writeFileSync(join(ROOT, 'apps/api/src/golden-plates.json'), `${JSON.stringify(out, null, 1)}\n`);
console.log(`${Object.keys(out).length} Golden Plates: ${Object.values(out).map((d) => (d as { name: string }).name).join(', ')}`);
