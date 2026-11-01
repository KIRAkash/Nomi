// npm run probe -w @nomi/models -- <outDir>: one real call per model, raw responses saved for inspection.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { BASE_URL, MODELS, metaClient } from './client.ts';

const out = process.argv[2] ?? 'probe-out';
mkdirSync(out, { recursive: true });
const save = (name: string, data: unknown) => writeFileSync(join(out, name), typeof data === 'string' ? data : JSON.stringify(data, null, 2));
const client = metaClient();

async function step(name: string, fn: () => Promise<void>) {
  const t0 = Date.now();
  try {
    await fn();
    console.log(`✓ ${name} (${Date.now() - t0} ms)`);
  } catch (err) {
    const e = err as { status?: number; message?: string; error?: unknown };
    console.log(`✗ ${name}: ${e.status ?? ''} ${e.message ?? err}`);
    save(`${name}.error.json`, { status: e.status, message: e.message, error: e.error });
  }
}

// 1. Muse Image: a test plate photo for the vision steps
let photo: string | null = null;
await step('image', async () => {
  const res = await client.images.generate({ model: MODELS.image, prompt: 'Realistic overhead photo of chicken biryani on a round white plate on a wooden counter: rice mound, 4 chicken pieces, fried onions at the top right, a small bowl of raita, a lemon wedge on the rim. Even daylight.', size: '1024x1024' });
  save('image.meta.json', { ...res, data: res.data?.map((d) => ({ ...d, b64_json: d.b64_json ? `<${d.b64_json.length} chars>` : undefined })) });
  const d = res.data?.[0];
  if (d?.b64_json) {
    writeFileSync(join(out, 'plate.png'), Buffer.from(d.b64_json, 'base64'));
    photo = `data:image/png;base64,${d.b64_json}`;
  } else if (d?.url) photo = d.url;
});
if (!photo) photo = `data:image/png;base64,${readFileSync(new URL('../../../design/logo/export/plate-clay.png', import.meta.url)).toString('base64')}`;

// 2. Muse Spark: structured output
await step('spark-structured', async () => {
  const res = await client.responses.create({
    model: MODELS.spark,
    input: 'Give two components of chicken biryani.',
    text: { format: { type: 'json_schema', name: 'c', strict: true, schema: { type: 'object', additionalProperties: false, required: ['components'], properties: { components: { type: 'array', items: { type: 'string' } } } } } },
  });
  save('spark-structured.json', res);
});

// 3. Muse Spark: image understanding
await step('spark-vision', async () => {
  const res = await client.responses.create({ model: MODELS.spark, input: [{ role: 'user', content: [{ type: 'input_image', image_url: photo!, detail: 'auto' }, { type: 'input_text', text: 'Which dish is this? One line.' }] }] });
  save('spark-vision.json', res);
});

// 4. Muse Wonder: plain text
await step('wonder', async () => {
  const res = await client.responses.create({ model: MODELS.wonder, input: 'Reply with the single word: ready' });
  save('wonder.json', res);
});

// 5. SAM 3.1: segment "rice" on the test photo
await step('sam', async () => {
  const res = await client.responses.create({ model: MODELS.sam, input: [{ role: 'user', content: [{ type: 'input_image', image_url: photo!, detail: 'auto' }, { type: 'input_text', text: 'rice' }] }] });
  save('sam.json', res);
});

// 6. Muse Voice Transcribe: a spoken plating rule made with macOS `say`
await step('voice', async () => {
  const aiff = join(out, 'rule.aiff');
  execFileSync('say', ['-o', aiff, 'Garnish at two o clock, never on the rice. Lemon on the rim.']);
  const form = new FormData();
  form.append('model', MODELS.voice);
  form.append('file', new Blob([readFileSync(aiff)], { type: 'audio/aiff' }), 'rule.aiff');
  const res = await fetch(`${BASE_URL}/asr/transcribe`, { method: 'POST', headers: { Authorization: `Bearer ${process.env.MODEL_API_KEY}` }, body: form });
  const body = await res.text();
  save('voice.json', body);
  if (!res.ok) throw Object.assign(new Error(body.slice(0, 300)), { status: res.status });
});

console.log(`raw responses in ${out}`);
