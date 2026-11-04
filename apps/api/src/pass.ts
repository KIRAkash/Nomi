// PASS check, one frame at a time: local Glimmer keeps the frame only if a plate is in it and blurs any face on site,
// the dish comes from the ticket (or Muse Spark names it), SAM 3.1 finds the plate and each part of the dish, and the
// vision worker scores the parts against the dish's Golden Plate signature. Each stage is emitted as it starts and ends,
// so the pass tablet can show what is happening.
import { readFileSync } from 'node:fs';

import { checkPassFrame, recogniseDish, segment } from '@nomi/models';
import { PassCheck, type PassComponent } from '@nomi/shared';

import { WORKER, workerAuth } from './golden';

type GoldenPlate = {
  name: string; version: number;
  parts: { name: string; prompt: string; colour: string; role: string }[];
  golden: { plate: { cx: number; cy: number; r: number }; parts: { name: string; found: boolean; count: number; share: number; centre: [number, number] | null }[] }[];
};
// Published Golden Plates, exported from the chef's saved golden photo reads (npm run golden:export -w @nomi/api).
const GOLDEN: Record<string, GoldenPlate> = JSON.parse(readFileSync(new URL('./golden-plates.json', import.meta.url), 'utf8'));
export const goldenPlate = (dishId: string) => GOLDEN[dishId] ?? null;

export type Emit = (event: Record<string, unknown>) => Promise<void>;

/** Recent pass checks, so tonight's NIGHTSHIFT reads the plates this tablet scored alongside the seed night. */
export type PassRow = { id: string; dish: string; shift: 'Lunch' | 'Dinner'; time: string; score: number; misses: { part: string; kind: NonNullable<PassComponent['kind']>; dir: 'less' | 'more' | null }[] };
export const passLog: PassRow[] = [];

const offline = (err: unknown) => /connect|ECONNREFUSED|fetch failed|ENOTFOUND/i.test(`${(err as Error).name} ${(err as Error).message}`);

async function worker<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${WORKER}${path}`, { method: 'POST', headers: { 'content-type': 'application/json', ...(await workerAuth()) }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`vision worker ${res.status}`);
  return res.json() as Promise<T>;
}

export async function checkPass({ frame, dish_id: ticket }: { frame: string; dish_id: string | null }, emit: Emit) {
  if (ticket && !goldenPlate(ticket)) throw new Error('This dish has no published Golden Plate yet');

  // 1. Glimmer, on site. When it is not running, say so and let SAM's plate search decide whether a plate is there.
  let t = Date.now();
  await emit({ type: 'stage', id: 'glimmer', state: 'run', text: 'Glimmer is checking the frame…' });
  const glimmer = { ran: false, plate: null as boolean | null, faces_blurred: 0, note: null as string | null };
  let sent = frame;
  try {
    const gate = await checkPassFrame({ purpose: 'pass_frame_filter' }, frame);
    glimmer.ran = true;
    glimmer.plate = gate.plate;
    if (!gate.plate) {
      await emit({ type: 'stage', id: 'glimmer', state: 'done', text: 'No plate in the frame: dropped on site', ms: Date.now() - t });
      return { dropped: true, reason: 'No plate in the frame', glimmer };
    }
    if (gate.faces.length) {
      sent = (await worker<{ frame: string }>('/frame/blur', { frame, boxes: gate.faces })).frame;
      glimmer.faces_blurred = gate.faces.length;
    }
    await emit({ type: 'stage', id: 'glimmer', state: 'done', ms: Date.now() - t,
      text: gate.faces.length ? `Plate in frame · ${gate.faces.length} face${gate.faces.length > 1 ? 's' : ''} blurred on site` : 'Plate in frame, frame kept' });
  } catch (err) {
    glimmer.note = offline(err) ? 'Glimmer is not running on this computer' : 'Glimmer could not read this frame';
    console.warn('pass glimmer:', (err as Error).message);
    await emit({ type: 'stage', id: 'glimmer', state: 'skip', text: `${glimmer.note}: SAM 3.1 checks for the plate`, ms: Date.now() - t });
  }

  // 2. The dish: from the ticket the cook tapped, or Muse Spark names it from the frame Glimmer kept.
  let dish_id = ticket;
  if (dish_id) await emit({ type: 'stage', id: 'dish', state: 'done', text: `Dish from ticket: ${GOLDEN[dish_id].name}` });
  else {
    t = Date.now();
    await emit({ type: 'stage', id: 'dish', state: 'run', text: 'Muse Spark is naming the dish…' });
    const menu = Object.entries(GOLDEN).map(([id, d]) => ({ id, name: d.name }));
    const seen = await recogniseDish({ purpose: 'pass_dish' }, sent, menu);
    dish_id = seen.is_food && seen.dish_id && GOLDEN[seen.dish_id] ? seen.dish_id : null;
    await emit({ type: 'stage', id: 'dish', state: dish_id ? 'done' : 'skip', ms: Date.now() - t,
      text: dish_id ? `Recognised: ${GOLDEN[dish_id].name}` : 'Not a dish with a Golden Plate: tap its ticket' });
    if (!dish_id) return { dropped: true, reason: 'Not a dish with a Golden Plate', glimmer };
  }
  const g = GOLDEN[dish_id];

  // 3. SAM 3.1: the plate and each part of the dish, all at once; each part is reported as it comes back.
  t = Date.now();
  await emit({ type: 'stage', id: 'sam', state: 'run', text: 'SAM 3.1 is finding the parts…', parts: g.parts.map((p) => p.name) });
  const ask = async (prompt: string, name: string | null) => {
    const { raw, objects } = await segment({ purpose: 'pass_check' }, sent, prompt);
    if (name) await emit({ type: 'part', name, objects: objects.length });
    return raw;
  };
  const [plate, ...outputs] = await Promise.all([ask('plate', null), ...g.parts.map((p) => ask(p.prompt, p.name))]);
  if (!plate.includes('<|box')) {
    await emit({ type: 'stage', id: 'sam', state: 'skip', text: 'No plate found in the frame', ms: Date.now() - t });
    return { dropped: true, reason: 'No plate in the frame', glimmer: { ...glimmer, plate: false } };
  }
  const found = outputs.filter((o) => o.includes('<|box')).length;
  await emit({ type: 'stage', id: 'sam', state: 'done', text: `SAM 3.1 found ${found} of ${g.parts.length} parts`, ms: Date.now() - t });

  // 4. The vision worker decodes the masks and checks each part against the Golden Plate signature.
  t = Date.now();
  await emit({ type: 'stage', id: 'score', state: 'run', text: `Comparing with Golden Plate v${g.version}…` });
  const scored = await worker<{ ok: boolean; error?: string } & Record<string, unknown>>('/pass/check', {
    golden: g.golden,
    roles: Object.fromEntries(g.parts.map((p) => [p.name, p.role])),
    plate_output: plate,
    parts: g.parts.map((p, i) => ({ name: p.name, colour: p.colour, output: outputs[i] })),
  });
  if (!scored.ok) throw new Error(scored.error ?? 'the vision worker could not read the frame');
  const result = PassCheck.parse({
    ...scored, dish_id, dish: g.name, golden_version: g.version, glimmer, frame: sent === frame ? null : sent,
  });
  await emit({ type: 'stage', id: 'score', state: 'done', text: `Scored against Golden Plate v${g.version}`, ms: Date.now() - t });

  const now = new Date();
  passLog.unshift({
    id: `live-${now.getTime().toString(36)}`, dish: g.name, shift: now.getHours() < 16 ? 'Lunch' : 'Dinner',
    time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`, score: result.score,
    misses: result.components.filter((c) => c.kind).map((c) => ({ part: c.name, kind: c.kind!, dir: c.kind === 'area' ? ((c.area_vs_golden ?? 0) < 0 ? 'less' : 'more') : null })),
  });
  passLog.splice(50);
  return result;
}
