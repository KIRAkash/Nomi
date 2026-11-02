// Golden Plate capture: SAM 3.1 finds each part on the chef's own photos, the vision worker decodes and measures the
// masks and returns their outlines, and a tap on a part the model missed re-asks SAM with a box and point around the tap.
// Staff routes have no sign-in yet; they will sit behind the staff session once phone sign-in lands.
import { segment } from '@nomi/models';
import { Hono } from 'hono';
import { z } from 'zod';

const WORKER = process.env.VISION_WORKER_URL ?? 'http://localhost:8001';

type Part = { name: string; prompt: string; colour: string };
type Read = {
  ok: boolean; error?: string; size: { w: number; h: number }; plate: { cx: number; cy: number; r: number; path: string } | null;
  parts: { name: string; colour: string; found: boolean; count: number; share: number; where: string | null; centre: [number, number] | null; paths: string[]; boxes: number[][] }[];
};
type Session = { photo: string; plate: string; parts: Part[]; outputs: Record<string, string>; size: { w: number; h: number } | null; at: number };

// Raw SAM output per photo, kept so a tap re-reads one part without asking SAM about the rest again.
const sessions = new Map<string, Session>();
function keep(id: string, s: Session) {
  sessions.set(id, s);
  const old = Date.now() - 60 * 60_000;
  for (const [k, v] of sessions) if (v.at < old) sessions.delete(k);
}

/** Runs tasks at most `n` at a time, keeping their order. */
async function pool<T>(tasks: (() => Promise<T>)[], n = 9): Promise<T[]> {
  const out: T[] = new Array(tasks.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(n, tasks.length) }, async () => {
    while (next < tasks.length) {
      const i = next++;
      out[i] = await tasks[i]();
    }
  }));
  return out;
}

async function read(s: Session): Promise<Read> {
  const res = await fetch(`${WORKER}/sam/read`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ plate_output: s.plate || null, parts: s.parts.map((p) => ({ name: p.name, colour: p.colour, output: s.outputs[p.name] ?? '' })) }),
  });
  if (!res.ok) throw new Error(`vision worker ${res.status}`);
  return res.json() as Promise<Read>;
}

const Photo = z.string().startsWith('data:image/').max(8_000_000);
const PartIn = z.object({ name: z.string().max(60), prompt: z.string().max(60), colour: z.string().regex(/^#[0-9a-fA-F]{6}$/) });
const ctx = { purpose: 'golden_masks' };

export const golden = new Hono()
  .post('/read', async (c) => {
    const body = z.object({ photos: z.array(Photo).min(1).max(3), parts: z.array(PartIn).max(8), plate: z.boolean().default(true) }).safeParse(await c.req.json());
    if (!body.success) return c.json({ error: 'bad request', issues: body.error.issues }, 400);
    const { photos, parts, plate } = body.data;
    if (!plate && !parts.length) return c.json({ error: 'nothing to look for' }, 400);
    // One SAM call per prompt per photo, plus "plate" so every part on a dish is measured against the plate.
    // Shelves and closing spots have no plate: parts are found and counted only.
    const prompts = [...(plate ? ['plate'] : []), ...parts.map((p) => p.prompt)];
    const raw = await pool(photos.flatMap((photo) => prompts.map((prompt) => async () => (await segment(ctx, photo, prompt)).raw)));
    const results = await Promise.all(photos.map(async (photo, k) => {
      const row = raw.slice(k * prompts.length, (k + 1) * prompts.length);
      const skip = plate ? 1 : 0;
      const s: Session = { photo, plate: plate ? row[0] : '', parts, outputs: Object.fromEntries(parts.map((p, j) => [p.name, row[j + skip]])), size: null, at: Date.now() };
      const r = await read(s);
      const id = crypto.randomUUID();
      keep(id, { ...s, size: r.size ?? null });
      return { id, ...r };
    }));
    return c.json({ photos: results });
  })
  .post('/tap', async (c) => {
    const body = z.object({ id: z.guid(), part: z.string().max(60), x: z.number().min(0).max(1), y: z.number().min(0).max(1) }).safeParse(await c.req.json());
    if (!body.success) return c.json({ error: 'bad request' }, 400);
    const s = sessions.get(body.data.id);
    if (!s || !s.size) return c.json({ error: 'photo expired, read it again' }, 404);
    if (!s.parts.some((p) => p.name === body.data.part)) return c.json({ error: 'unknown part' }, 400);
    // A point alone picks out one small piece (one cucumber in the raita); a box round the tap gets the whole part.
    const { w, h } = s.size;
    const px = Math.round(body.data.x * (w - 1));
    const py = Math.round(body.data.y * (h - 1));
    const r = Math.round(Math.min(w, h) * 0.12);
    const box = `x1=${Math.max(0, px - r)};y1=${Math.max(0, py - r)};x2=${Math.min(w - 1, px + r)};y2=${Math.min(h - 1, py + r)};w=${w};h=${h}`;
    const prompt = `<0f>1<|box;${box}|><|point;x=${px};y=${py};w=${w};h=${h}|>`;
    const { raw } = await segment({ purpose: 'golden_tap_fix' }, s.photo, prompt);
    s.outputs[body.data.part] = raw;
    s.at = Date.now();
    return c.json({ id: body.data.id, ...(await read(s)) });
  });
