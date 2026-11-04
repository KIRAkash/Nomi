// node docs/readme/render.mjs [name ...]
// Renders each docs/readme/src/<name>.html to docs/readme/<name>.png: the page's .card, at 1.6x (1920 px wide), on a
// transparent page so the rounded corners sit on GitHub's light and dark themes alike. No names renders every page.
// Playwright comes from the video workspace (cd video && npm install); the fonts from the root node_modules.
import { readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const HERE = new URL('.', import.meta.url).pathname;
const { chromium } = createRequire(join(HERE, '../../video/package.json'))('playwright');
const SRC = join(HERE, 'src');
const names = process.argv.slice(2).length
  ? process.argv.slice(2)
  : readdirSync(SRC).filter((f) => f.endsWith('.html')).map((f) => f.replace(/\.html$/, ''));

// mask-image reads the SAM layer PNGs, which Chrome blocks across file:// URLs unless told otherwise.
const browser = await chromium.launch({ channel: 'chrome', args: ['--allow-file-access-from-files'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 1.6 });
for (const name of names) {
  await page.goto(pathToFileURL(join(SRC, `${name}.html`)).href, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const out = join(HERE, `${name}.png`);
  await page.locator('.card').screenshot({ path: out, omitBackground: true });
  console.log(out);
}
await browser.close();
