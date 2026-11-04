// Everything Nomi has seen, counted or heard, as short facts with ids. Ask Nomi sends these to Muse Wonder, which may
// answer only from them and cites the ids it used.
import type { NightInput } from './api';
import { slug } from './shots';
import { BRIEFING, CAPTURES, CLOSING_SPOTS, DISH_STATS, HANDOVERS, NOTES, PICKS, SOP_CARDS, STOCK } from './mock';

export function restaurantFacts() {
  const dishes = DISH_STATS.map((d) => ({
    id: `dish:${d.name}`,
    text: [
      `${d.name} (${d.category}), Golden Plate ${d.golden}${d.goldenVersion ? ` v${d.goldenVersion}` : ''}.`,
      d.scoreToday !== null ? `Mean plate score today ${d.scoreToday} from ${d.plates} plates, ${d.flagged} below the nudge line.` : 'Not scored at the pass yet.',
      d.byShift ? `Lunch ${d.byShift.Lunch}, dinner ${d.byShift.Dinner}.` : '',
      d.trend.length ? `Last 7 days: ${d.trend.join(', ')}.` : '',
      d.guestAvg !== null ? `Guests rate it ${d.guestAvg} of 5 from ${d.guestCount} visits this week.` : '',
      d.topTheme ? `Most mentioned: ${d.topTheme.label} (${d.topTheme.n}).` : '',
      PICKS[d.id] ? `Guest picks per day this week: ${PICKS[d.id].join(', ')}.` : '',
    ].filter(Boolean).join(' '),
  }));
  const plates = CAPTURES.map((c) => ({
    id: `plate:${c.id}`,
    text: `${DISH_STATS.find((d) => d.id === c.dishId)?.name} plate at ${c.day} ${c.time} (${c.shift}) scored ${c.score}${c.reasons.length ? `: ${c.reasons.join(', ')}` : ', on standard'}.`,
  }));
  const notes = NOTES.map((n) => ({
    id: `note:${n.id}`,
    text: `${n.table}, ${n.day} ${n.shift}, ${n.language}: "${n.translation ?? n.original ?? ''}" Tags: ${n.tags.map((t) => t.label).join(', ')}.`,
  }));
  const stock = STOCK.map((s) => ({ id: `stock:${s.name}`, text: `${s.name}: counted ${s.counts.at(-1)} ${s.unit}s at ${s.lastScan}, minimum ${s.min}. Last 7 counts ${s.counts.join(', ')}.` }));
  const closing = CLOSING_SPOTS.filter((s) => s.done).map((s) => ({
    id: `closing:${s.name}`,
    text: `Closing photo of ${s.name}: ${s.counts.map((c) => `${c.n} ${c.item.toLowerCase()}`).join(', ') || 'nothing counted'}. ${s.flags.map((f) => `${f.flag} (${f.where})${f.fixed ? ', fixed' : ''}`).join('; ')}`,
  }));
  return [...dishes, ...plates, ...notes, ...stock, ...closing].slice(0, 80);
}

type Miss = NightInput['plates'][number]['misses'][number];
/** A PASS reason line as the seed writes it → what was off, by which part. */
function misses(reasons: string[]): Miss[] {
  return reasons.flatMap((r): Miss[] => {
    let m: RegExpMatchArray | null;
    if ((m = r.match(/^(.+) missing$/))) return [{ part: m[1], kind: 'missing', dir: null }];
    if ((m = r.match(/^\d+ (.+), reference is \d+$/))) return [{ part: m[1][0].toUpperCase() + m[1].slice(1), kind: 'count', dir: null }];
    if ((m = r.match(/^(.+) share \d+% (under|over) reference$/))) return [{ part: m[1], kind: 'area', dir: m[2] === 'under' ? 'less' : 'more' }];
    if ((m = r.match(/^(.+?) off the rim$/))) return [{ part: m[1], kind: 'position', dir: null }];
    return [];
  });
}

/**
 * Last night's PASS rows from the seed: every dish's scored plates (DISH_STATS counts), the recorded captures with their
 * real reasons, and the rest of the flagged plates repeating those captures' reasons in turn. Seed data, not a model's.
 */
export function nightPlates(): NightInput['plates'] {
  return DISH_STATS.filter((d) => d.golden === 'published' && d.plates > 0).flatMap((d) => {
    // A capture's photo names its dish; some seed captures carry another dish's id, so the photo wins.
    const caps = CAPTURES.filter((c) => (c.shot ? c.shot.startsWith(`${slug(d.name)}/`) : c.dishId === d.id));
    const bad = caps.filter((c) => c.reasons.length);
    const good = caps.filter((c) => !c.reasons.length);
    const flagged = Array.from({ length: bad.length ? Math.max(d.flagged, bad.length) : 0 }, (_, i) => {
      const c = bad[i % bad.length];
      return { id: i < bad.length ? c.id : `${c.id}-${i}`, dish: d.name, shift: c.shift, time: c.time, score: c.score, misses: misses(c.reasons) };
    });
    const fine = Array.from({ length: Math.max(0, d.plates - flagged.length) }, (_, i) => {
      const c = good[i];
      const shift = c?.shift ?? (i % 5 < 2 ? 'Lunch' : 'Dinner');
      return { id: c?.id ?? `${d.id.slice(-4)}-ok-${i}`, dish: d.name, shift, time: c?.time ?? (shift === 'Lunch' ? '13:30' : '20:30'), score: c?.score ?? 86 + ((i * 7) % 10), misses: [] };
    });
    return [...flagged, ...fine];
  });
}

/** Everything NIGHTSHIFT reads for one night: PASS rows, guest notes, shelf counts, the closing round and the handover. */
export function nightInput(): NightInput {
  const notes = NOTES.map((n) => ({
    id: `note:${n.id}`,
    photo: !!n.photo,
    text: [
      `${n.table}, ${n.day} ${n.shift.toLowerCase()}, ${n.kind === 'taps' ? 'taps only' : `${n.language} ${n.kind}`}${n.translation ?? n.original ? `: "${n.translation ?? n.original}"` : ''}.`,
      n.faces.length ? `Faces: ${n.faces.map((f) => `${f.dish} ${f.value} of 5`).join(', ')}.` : '',
      n.answers.length ? `Answers: ${n.answers.map((a) => `${a.q} ${a.a}`).join('; ')}.` : '',
      n.photo ? `Guest photo of ${DISH_STATS.find((d) => d.id === n.photo!.dishId)?.name} scored ${n.photo.score} against its Golden Plate${n.photo.reasons.length ? `: ${n.photo.reasons.join(', ')}` : ''}.` : '',
      n.severity === 'high' ? 'Marked urgent.' : '',
    ].filter(Boolean).join(' '),
  }));
  const stock = STOCK.map((s) => ({ id: `stock:${s.name}`, text: `${s.name}: ${s.counts.at(-1)} ${s.unit}s counted at ${s.lastScan}, minimum ${s.min}. Counts over the last 7 nights: ${s.counts.join(', ')}.` }));
  const closing = [
    ...CLOSING_SPOTS.map((s) => ({
      id: `closing:${s.id}`,
      text: s.done
        ? `Closing photo of ${s.name}: ${s.counts.map((c) => `${c.n} ${c.item.toLowerCase()}`).join(', ') || 'nothing counted'}. ${s.flags.length ? s.flags.map((f) => `Flag: ${f.flag.toLowerCase()} (${f.where})${f.fixed ? ', fixed with an after photo' : ''}`).join('; ') : 'No flags'}.`
        : `${s.name}: not photographed in the closing round.`,
    })),
    ...HANDOVERS.map((h) => ({ id: `handover:${h.id}`, text: `Shift handover ${h.shift}, ${h.when}. Problems said aloud: ${h.summary.problems.join('; ') || 'none'}. Pending: ${h.summary.pending.join('; ') || 'none'}.` })),
  ];
  return {
    night: BRIEFING.date,
    plates: nightPlates(),
    notes,
    stock,
    closing,
    cards: Object.fromEntries(SOP_CARDS.map((c) => [c.dish, c.rules.map((r) => r.en)])),
  };
}
