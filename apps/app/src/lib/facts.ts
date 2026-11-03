// Everything Nomi has seen, counted or heard, as short facts with ids. Ask Nomi sends these to Muse Wonder, which may
// answer only from them and cites the ids it used.
import { CAPTURES, CLOSING_SPOTS, DISH_STATS, NOTES, PICKS, STOCK } from './mock';

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
