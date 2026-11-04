// npx tsx scripts/drawn.ts
// Renders the landing page's drawn biryani (apps/site/src/art.ts) to PNG files in public/drawn/, so the film loads plain
// images instead of decoding large SVGs on every frame. One file per plate the film shows and per layer of the
// break-apart. Rerun when art.ts changes.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { chromium } from 'playwright';

import { DRIFTS, GOLDEN, dishUrl, layerUrl, type PlateSpec } from '../../apps/site/src/art';

const OUT = join(import.meta.dirname, '../public/drawn');
mkdirSync(OUT, { recursive: true });

const SIZE = 1200;
const jobs: { name: string; url: string }[] = [
  { name: 'golden-raita', url: dishUrl({ ...GOLDEN, raita: true }, 'full') },
  { name: 'golden', url: dishUrl({ ...GOLDEN, raita: false }, 'plate') },
  ...DRIFTS.map((d: PlateSpec, i: number) => ({ name: `drift-${i + 1}`, url: dishUrl({ ...d, raita: false }, 'plate') })),
  ...(['plate', 'rice', 'chicken', 'onions', 'lemon', 'raita'] as const).map((l) => ({ name: `layer-${l}`, url: layerUrl(l) })),
];

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();
for (const j of jobs) {
  const png = await page.evaluate(async ({ url, size }) => {
    const img = new Image();
    img.src = url;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = c.height = size;
    c.getContext('2d')!.drawImage(img, 0, 0, size, size);
    return c.toDataURL('image/png');
  }, { url: j.url, size: SIZE });
  writeFileSync(join(OUT, `${j.name}.png`), Buffer.from(png.split(',')[1], 'base64'));
  console.log(`✓ drawn/${j.name}.png`);
}
await browser.close();
