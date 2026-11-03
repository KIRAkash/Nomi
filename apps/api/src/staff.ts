// Staff-side model calls, each one live: Muse Wonder reads menus and answers Ask Nomi, Muse Spark proposes components,
// guest questions and replies and translates plating cards, Muse Image draws dish icons and plating cards.
// Staff routes have no sign-in yet; they will sit behind the staff session once phone sign-in lands.
import {
  askNomi, draftReply, extractMenu, generateDishIcon, generateSopCard, proposeComponents, proposeGuestQuestions, translateCard,
} from '@nomi/models';
import { Hono, type Context } from 'hono';
import { z } from 'zod';

import { limited } from './limit';

const Photo = z.string().startsWith('data:image/').max(8_000_000);
const ip = (c: Context) => c.req.header('x-forwarded-for')?.split(',')[0] ?? 'local';
const blob = (dataUrl: string) => new Blob([Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64')], { type: dataUrl.slice(5, dataUrl.indexOf(';')) });
/** Muse Image returns WebP or PNG; the data URL says which. */
const png = (b64?: string) => (b64 ? `data:image/${b64.startsWith('UklGR') ? 'webp' : 'png'};base64,${b64}` : null);

/** Parses the body, applies the per-device limit, times the call and turns failures into a short error. */
function route<S extends z.ZodType, T>(name: string, max: number, schema: S, run: (body: z.infer<S>) => Promise<T>) {
  return async (c: Context) => {
    if (limited(`${name}:${ip(c)}`, max, 60 * 60_000)) return c.json({ error: 'slow down' }, 429);
    const body = schema.safeParse(await c.req.json());
    if (!body.success) return c.json({ error: 'bad request' }, 400);
    const t0 = Date.now();
    try {
      return c.json({ ...(await run(body.data)), ms: Date.now() - t0 });
    } catch (err) {
      console.warn(`${name} failed:`, (err as Error).message);
      return c.json({ error: (err as Error).message.slice(0, 200) }, 502);
    }
  };
}

export const staff = new Hono()
  .post('/menu', route('menu', 20, z.object({ photo: Photo }), async ({ photo }) => extractMenu({ purpose: 'menu_snap' }, photo)))
  .post('/components', route('components', 60, z.object({ name: z.string().max(80), description: z.string().max(400).nullable() }),
    async (dish) => proposeComponents({ purpose: 'dish_components' }, dish)))
  .post('/questions', route('questions', 40, z.object({
    name: z.string().max(80), components: z.array(z.string()).max(12), rules: z.array(z.string()).max(12), counts: z.record(z.string(), z.number()),
  }), async (dish) => proposeGuestQuestions({ purpose: 'guest_questions' }, dish)))
  .post('/reply', route('reply', 40, z.object({ feedback: z.string().max(2000), language: z.string().max(40), restaurant: z.string().max(80) }),
    async (input) => draftReply({ purpose: 'reply_draft' }, input)))
  .post('/translate', route('translate', 60, z.object({
    card: z.object({ title: z.string().max(120), steps: z.array(z.string().max(200)).max(12), watch: z.array(z.string().max(200)).max(8) }),
    language: z.string().max(40),
  }), async ({ card, language }) => translateCard({ purpose: 'card_translation' }, card, language)))
  .post('/ask', route('ask', 40, z.object({
    question: z.string().max(400), facts: z.array(z.object({ id: z.string(), text: z.string().max(400) })).max(80), who: z.enum(['owner', 'cook']).default('owner'),
  }), async ({ question, facts, who }) => askNomi({ purpose: `ask_nomi_${who}` }, question, facts, who === 'cook' ? 'a line cook at the pass, in short simple words' : undefined)))
  .post('/icon', route('icon', 10, z.object({ photo: Photo }), async ({ photo }) => {
    const img = await generateDishIcon({ purpose: 'dish_icon' }, blob(photo));
    return { image: png(img?.b64_json) };
  }))
  .post('/card', route('card', 10, z.object({ photo: Photo, rules: z.array(z.string().max(200)).max(8), dish: z.string().max(80) }), async ({ photo, rules, dish }) => {
    const img = await generateSopCard({ purpose: 'sop_card' }, blob(photo), rules, dish);
    return { image: png(img?.b64_json) };
  }));
