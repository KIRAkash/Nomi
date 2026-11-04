// NIGHTSHIFT, run for real: Muse Wonder plans the review of the night's facts, four Muse Spark analysts (feedback, plate,
// stock, closing) read their own facts in parallel, and Muse Wonder links what they found into the morning briefing. Every
// finding and action must cite fact ids it was given; anything citing nothing real is dropped. The pre-service watch list
// is counted here from PASS rows, never by a model; Muse Spark only words the reminder. Every action waits for a human.
import { type AnalystName, type NightFact, mergeBriefing, planNightshift, runAnalyst, writeReminders } from '@nomi/models';
import { NightshiftResult, type Finding, type WatchItem } from '@nomi/shared';
import { z } from 'zod';

import { passLog, type Emit } from './pass';

const Fact = z.object({ id: z.string().max(80), text: z.string().max(600) });
const Miss = z.object({ part: z.string().max(60), kind: z.enum(['missing', 'count', 'area', 'position']), dir: z.enum(['less', 'more']).nullable() });
export const NightInput = z.object({
  night: z.string().max(60),
  plates: z.array(z.object({ id: z.string().max(80), dish: z.string().max(80), shift: z.enum(['Lunch', 'Dinner']), time: z.string().max(10), score: z.number(), misses: z.array(Miss).max(8) })).max(600),
  notes: z.array(Fact.extend({ photo: z.boolean().default(false) })).max(120),
  stock: z.array(Fact).max(40),
  closing: z.array(Fact).max(20),
  cards: z.record(z.string(), z.array(z.string().max(200)).max(8)).default({}),
});
type Night = z.infer<typeof NightInput>;
type Plate = Night['plates'][number];

const ANALYSTS: AnalystName[] = ['feedback', 'plate', 'stock', 'closing'];
const PHRASE = { missing: 'missing', count: 'short of pieces', position: 'out of place', area: 'under the Golden Plate area' } as const;
const phrase = (m: z.infer<typeof Miss>) => (m.kind === 'area' && m.dir === 'more' ? 'over the Golden Plate area' : PHRASE[m.kind]);

/** Per-dish counts and the plates that missed, as facts the plate analyst can cite. */
function plateFacts(plates: Plate[]): NightFact[] {
  const byDish = new Map<string, Plate[]>();
  for (const p of plates) byDish.set(p.dish, [...(byDish.get(p.dish) ?? []), p]);
  const facts: NightFact[] = [];
  for (const [dish, rows] of byDish) {
    const misses = new Map<string, number>();
    for (const r of rows) for (const m of new Set(r.misses.map((x) => `${x.part} ${phrase(x)}`))) misses.set(m, (misses.get(m) ?? 0) + 1);
    const shifts = (['Lunch', 'Dinner'] as const).map((s) => [s, rows.filter((r) => r.shift === s)] as const).filter(([, r]) => r.length);
    const mean = (r: readonly Plate[]) => Math.round(r.reduce((n, x) => n + x.score, 0) / r.length);
    facts.push({
      id: `dish:${dish}`,
      text: `${dish}: ${rows.length} plates checked at the pass, mean score ${mean(rows)} (${shifts.map(([s, r]) => `${s.toLowerCase()} ${r.length} plates, mean ${mean(r)}`).join('; ')}). ${
        misses.size ? [...misses].sort((a, b) => b[1] - a[1]).map(([m, n]) => `${m} on ${n} of ${rows.length}`).join('; ') : 'Every plate on standard'}.`,
    });
  }
  const flagged = plates.filter((p) => p.misses.length).sort((a, b) => a.score - b.score).slice(0, 30);
  for (const p of flagged) facts.push({ id: `plate:${p.id}`, text: `${p.dish}, ${p.shift.toLowerCase()} ${p.time}, score ${p.score}: ${p.misses.map((m) => `${m.part} ${phrase(m)}`).join(', ')}.` });
  return facts;
}

/** The three most frequent misses by share of that dish's plates, with the counts behind them. */
function watchList(plates: Plate[]): Omit<WatchItem, 'reminder'>[] {
  const tally = new Map<string, Omit<WatchItem, 'reminder' | 'fact' | 'of' | 'n'> & { plates: Set<string> }>();
  for (const p of plates) for (const m of p.misses) {
    const key = `${p.dish}|${m.part}|${m.kind}`;
    if (!tally.has(key)) tally.set(key, { id: `w${tally.size + 1}`, dish: p.dish, part: m.part, kind: m.kind, plate_ids: [], plates: new Set() });
    tally.get(key)!.plates.add(p.id);
  }
  const total = (dish: string) => plates.filter((p) => p.dish === dish).length;
  return [...tally.values()]
    .map(({ plates: ids, ...w }) => {
      const of = total(w.dish);
      const dir = plates.find((p) => ids.has(p.id))!.misses.find((m) => m.part === w.part && m.kind === w.kind)!;
      return { ...w, n: ids.size, of, plate_ids: [...ids].slice(0, 12), fact: `${w.part} ${phrase(dir)} on ${ids.size} of ${of} plates` };
    })
    .sort((a, b) => b.n / b.of - a.n / a.of || b.n - a.n)
    .slice(0, 3);
}

const clean = (ids: string[], known: Set<string>) => [...new Set(ids.filter((id) => known.has(id)))];

export async function runNightshift(input: Night, emit: Emit) {
  const plates = [...passLog, ...input.plates];
  const facts: Record<AnalystName, NightFact[]> = {
    feedback: input.notes.map(({ id, text }) => ({ id, text })),
    plate: plateFacts(plates),
    stock: input.stock,
    closing: input.closing,
  };
  const all = new Map(ANALYSTS.flatMap((a) => facts[a].map((f) => [f.id, f] as const)));
  const known = new Set(all.keys());
  const sizes = Object.fromEntries(ANALYSTS.map((a) => [a, facts[a].length])) as Record<AnalystName, number>;
  const stats = { notes: input.notes.length, plates: plates.length, photos: input.notes.filter((n) => n.photo).length, stock: input.stock.length, closing: input.closing.length };
  await emit({ type: 'facts', stats, sizes });

  // 1. Muse Wonder plans: one question per analyst, from the headline facts.
  let t = Date.now();
  await emit({ type: 'stage', id: 'plan', state: 'run' });
  const headlines = ANALYSTS.flatMap((a) => facts[a].slice(0, a === 'plate' ? 8 : 6));
  const planned = await planNightshift({ purpose: 'nightshift_plan' }, input.night, sizes, headlines);
  const plan = { focus: ANALYSTS.map((a) => planned.focus.find((f) => f.analyst === a) ?? { analyst: a, question: 'What stands out tonight, good or bad?' }) };
  await emit({ type: 'plan', plan });
  await emit({ type: 'stage', id: 'plan', state: 'done', ms: Date.now() - t });

  // 2. Four Muse Spark analysts in parallel, plus the watch list reminders. A failed analyst is reported, not fatal.
  const watch = watchList(plates);
  const reminders = watch.length
    ? writeReminders({ purpose: 'watch_list' }, watch.map(({ id, dish, fact }) => ({ id, dish, fact })), input.cards).catch((err) => {
      console.warn('watch reminders failed:', (err as Error).message);
      return { reminders: [] };
    })
    : Promise.resolve({ reminders: [] });
  const analysts = await Promise.all(plan.focus.map(async ({ analyst, question }) => {
    const t0 = Date.now();
    await emit({ type: 'stage', id: analyst, state: 'run', text: question, facts: facts[analyst].length });
    if (!facts[analyst].length) {
      await emit({ type: 'stage', id: analyst, state: 'skip', text: 'Nothing recorded tonight', ms: 0 });
      return { analyst, findings: [] as Finding[], facts: 0, ms: 0 };
    }
    try {
      const own = new Set(facts[analyst].map((f) => f.id));
      const report = await runAnalyst({ purpose: `nightshift_${analyst}` }, analyst, question, facts[analyst]);
      const findings = report.findings.map((f) => ({ analyst, fact: f.fact, evidence_ids: clean(f.evidence_ids, own) })).filter((f) => f.evidence_ids.length).slice(0, 4);
      const ms = Date.now() - t0;
      await emit({ type: 'stage', id: analyst, state: 'done', ms, findings: findings.length });
      return { analyst, findings, facts: facts[analyst].length, ms };
    } catch (err) {
      console.warn(`nightshift ${analyst} failed:`, (err as Error).message);
      await emit({ type: 'stage', id: analyst, state: 'fail', text: 'This analyst did not answer; the briefing goes ahead without it', ms: Date.now() - t0 });
      return { analyst, findings: [] as Finding[], facts: facts[analyst].length, ms: Date.now() - t0 };
    }
  }));

  // 3. Muse Wonder links findings across analysts into issues, likely causes and actions for a human to approve.
  t = Date.now();
  await emit({ type: 'stage', id: 'merge', state: 'run' });
  const findings = analysts.flatMap((a) => a.findings);
  if (!findings.length) throw new Error('No analyst found anything to report');
  const cited = [...new Set(findings.flatMap((f) => f.evidence_ids))].map((id) => all.get(id)!);
  const merged = await mergeBriefing({ purpose: 'nightshift_merge' }, findings, cited);
  const briefing = {
    issues: merged.issues.slice(0, 3).map((i) => ({
      ...i,
      facts: i.facts.map((f) => ({ ...f, evidence_ids: clean(f.evidence_ids, known) })).filter((f) => f.evidence_ids.length),
      actions: i.actions.map((a) => ({ ...a, evidence_ids: clean(a.evidence_ids, known) })).filter((a) => a.evidence_ids.length).slice(0, 2),
    })).filter((i) => i.facts.length),
    wins: merged.wins.map((w) => ({ ...w, evidence_ids: clean(w.evidence_ids, known) })).filter((w) => w.evidence_ids.length).slice(0, 3),
  };
  await emit({ type: 'stage', id: 'merge', state: 'done', ms: Date.now() - t });

  const words = new Map((await reminders).reminders.map((r) => [r.id, r.reminder]));
  // The text behind every id the briefing cites, so each "Why?" opens real evidence.
  const ids = new Set([...analysts.flatMap((a) => a.findings), ...briefing.issues.flatMap((i) => [...i.facts, ...i.actions]), ...briefing.wins].flatMap((x) => x.evidence_ids));
  const evidence = Object.fromEntries([...ids].map((id) => [id, all.get(id)!.text]));
  return NightshiftResult.parse({ plan, analysts, briefing, watch: watch.map((w) => ({ ...w, reminder: words.get(w.id) ?? null })), stats, evidence });
}
