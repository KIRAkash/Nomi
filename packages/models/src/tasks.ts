// One typed function per row of the spec's model usage map (section 8). Screens never call the API directly.
import {
  AskAnswer, CardTranslation, ClosingCheck, HandoverSummary, ComponentProposal, DishRecognition, FeedbackTags, GuestQuestionProposal, MenuExtraction, PlatingRules, ReplyDraft,
} from '@nomi/shared';
import { BASE_URL, MODELS, call, glimmerClient, image, metaClient, structured, text, type Ctx } from './client';

const FACTS_ONLY = 'Report only what is directly visible or stated. Never estimate volume, weight, money or future events.';

/** Menu Snap: printed menu photo → dish list. */
export const extractMenu = (ctx: Ctx, menuImage: string) =>
  structured(MODELS.wonder, ctx, 'menu', MenuExtraction,
    'Extract every dish on this restaurant menu. Keep names exactly as printed. If a price or name is hard to read, set it to null or list it in "unclear" rather than guessing.',
    [image(menuImage)]);

/** Dish enrichment: description → components that become SAM prompts. */
export const proposeComponents = (ctx: Ctx, dish: { name: string; description: string | null }) =>
  structured(MODELS.spark, ctx, 'components', ComponentProposal,
    // SAM 3.1 finds plain everyday nouns ("fried onions", "bowl", "lemon wedge") and misses dish words or
    // descriptive phrases ("raita", "fried onion garnish"): checked on a real biryani photo, Nov 2.
    'List the separately visible parts of this plated dish as seen from above. sam_prompt must be 1–2 plain everyday English words describing what the part looks like, not its dish name: "fried onions" not "birista garnish", "bowl" not "raita", "lemon wedge", "chicken pieces". role: main for the base, count for pieces worth counting, placement for garnish whose position matters, side for bowls and accompaniments.',
    [text(`${dish.name}\n${dish.description ?? ''}`)]);

/** Chef voice spec: transcript → plating rules, each read back to the chef before it is saved. */
export const parseRules = (ctx: Ctx, transcript: string, components: string[]) =>
  structured(MODELS.spark, ctx, 'rules', PlatingRules,
    `Turn the chef's spoken plating instructions into checkable rules. Components: ${components.join(', ')}. Use clock positions as said. If the chef spoke Hindi or Hinglish, write text in English and set translated_from.`,
    [text(transcript)]);

/** Guest questions: components + rules → up to 5 suggestions; the chef keeps up to 3. */
export const proposeGuestQuestions = async (ctx: Ctx, dish: { name: string; components: string[]; rules: string[]; counts: Record<string, number> }) => {
  const r = await structured(MODELS.spark, ctx, 'questions', GuestQuestionProposal,
    'Suggest short yes/no questions a diner can answer in one tap from their own experience of this dish: was the portion enough, were there enough pieces, was it hot, was a key side or garnish there, was it tasty. Never ask about plating positions or anything only a chef would judge. Each question ties to one thing the Golden Plate checks; say which in "checks" in a few plain words. No more than 7 words each. no_label is the short negative answer a guest would tap ("Too little", "Fewer", "Lukewarm", "Missing"), never just "No". Friendly tone.',
    [text(JSON.stringify(dish))]);
  return { questions: r.questions.slice(0, 5) };
};

/** Guest photo → which menu dish it is. */
export const recogniseDish = (ctx: Ctx, photo: string, menu: { id: string; name: string }[]) =>
  structured(MODELS.spark, ctx, 'dish', DishRecognition,
    `Which of these dishes is in the photo? Answer with its id, or null if none matches. Set is_food false if the photo is not food. Menu: ${JSON.stringify(menu)}`,
    [image(photo)]);

/** Feedback text or transcript → translation and tags. */
export const tagFeedback = (ctx: Ctx, feedback: string, dishes: { id: string; name: string }[]) =>
  structured(MODELS.spark, ctx, 'tags', FeedbackTags,
    `Translate this restaurant feedback to English and tag each point. Dishes on the menu: ${JSON.stringify(dishes)}. Severity is high only for hygiene, safety or allergy problems.`,
    [text(feedback)]);

/** Personal reply in the guest's language; a manager approves it before anything is sent. */
export const draftReply = (ctx: Ctx, input: { feedback: string; language: string; restaurant: string }) =>
  structured(MODELS.spark, ctx, 'reply', ReplyDraft,
    `Write a short, warm reply from ${input.restaurant} in ${input.language}. Acknowledge the specific point. Offer something only if the problem was real. Also give an English version.`,
    [text(input.feedback)]);

/** Closing photo of one spot → visible counts and flags. */
export const checkClosingPhoto = (ctx: Ctx, photo: string, spot: string, items: string[]) =>
  structured(MODELS.spark, ctx, 'closing', ClosingCheck,
    `${FACTS_ONLY} This is the "${spot}" at closing time. Count whole, separately visible items among: ${items.join(', ')}. Flag only things you can see: containers without lids, spills, clutter, items left out, open doors. A partly used container counts as 1; never say how full it is.`,
    [image(photo)]);

/** Shift handover transcript → what is done, what is pending and what went wrong, in the words people used. */
export const summariseHandover = (ctx: Ctx, transcript: string) =>
  structured(MODELS.spark, ctx, 'handover', HandoverSummary,
    `${FACTS_ONLY} This is a restaurant kitchen shift handover, spoken aloud, possibly in Hindi or Hinglish. Split it into short English lines: done, pending, problems. Keep names, counts and dishes exactly as said. Leave a list empty rather than inventing items.`,
    [text(transcript)]);

/** A plating card in the staff member's language, keeping numbers, counts and clock positions exact. */
export const translateCard = (ctx: Ctx, card: { title: string; steps: string[]; watch: string[] }, language: string) =>
  structured(MODELS.spark, ctx, 'card', CardTranslation,
    `Translate this kitchen plating card into ${language}, in the script native speakers use, in simple words a line cook reads at a glance. Keep every number, count and clock position exactly. Keep dish names as they are commonly said in that language.`,
    [text(JSON.stringify(card))]);

/** Ask Nomi: an owner's question answered only from the facts given; predictions and money guesses are refused. */
export const askNomi = (ctx: Ctx, question: string, facts: { id: string; text: string }[], who = 'a restaurant owner') =>
  structured(MODELS.wonder, ctx, 'answer', AskAnswer,
    `${FACTS_ONLY} You are Nomi, answering ${who}, in the language and script the question was asked in. Answer only from these facts, citing their ids as source. If the question needs a forecast, a money estimate or anything the facts do not contain, set refused true and say plainly what you can count instead. Two or three short sentences. Facts: ${JSON.stringify(facts)}`,
    [text(question)]);

export type Transcript = { transcript: string; audioDurationMs: number; turns: { speaker?: string; text: string }[] };

/**
 * Audio → transcript with Muse Voice Transcribe. Multipart with a JSON `request` part and an `audio` part.
 * Only WAV is accepted (checked Nov 2: M4A, AAC and WebM/Opus are rejected), so the API converts phone
 * and browser recordings to 16 kHz mono WAV before calling this.
 */
export async function transcribe(ctx: Ctx, wav: Blob, opts: { diarize?: boolean } = {}) {
  return call(MODELS.voice, ctx, async () => {
    const form = new FormData();
    const request = { model: MODELS.voice, audioEncoding: 'WAV', ...(opts.diarize ? { diarization: true } : {}) };
    form.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }));
    form.append('audio', wav, 'audio.wav');
    const res = await fetch(`${BASE_URL}/asr/transcribe`, { method: 'POST', headers: { Authorization: `Bearer ${process.env.MODEL_API_KEY}` }, body: form });
    const body = await res.json();
    if (!res.ok || body.error) throw new Error(`transcribe ${res.status}: ${body.error?.message ?? 'failed'}`);
    return { value: body as Transcript };
  });
}

export type SamBox = { x1: number; y1: number; x2: number; y2: number; w: number; h: number; c?: number };
export type SamObject = { box: SamBox; mask: string };

/**
 * SAM 3.1 returns compact text, one record per object:
 *   <|box;x1=..;y1=..;x2=..;y2=..;w=1600;h=1600[;c=..]|><|mask;x=0;y=0;data=H,W,<enc><payload>|>
 * Box coordinates are on the w×h grid given in the record. The mask payload is decoded by the vision
 * worker with Meta's meta-sam-parser; here we keep boxes (enough for presence and position) and the raw mask token.
 */
export function parseSam(outputText: string): SamObject[] {
  const objects: SamObject[] = [];
  const re = /<\|box;([^|]*)\|>\s*(<\|mask;[^|]*\|>)?/g;
  for (const m of outputText.matchAll(re)) {
    const f = Object.fromEntries(m[1].split(';').map((kv) => kv.split('=')).map(([k, v]) => [k, Number(v)]));
    objects.push({ box: f as SamBox, mask: m[2] ?? '' });
  }
  return objects;
}

/** SAM 3.1 segmentation of one component prompt on one photo. The Model API takes text prompts only. */
export async function segment(ctx: Ctx, photo: string, prompt: string) {
  return call(MODELS.sam, ctx, async () => {
    const res = await metaClient().responses.create({ model: MODELS.sam, input: [{ role: 'user', content: [image(photo), text(prompt)] }] });
    return { value: { objects: parseSam(res.output_text), raw: res.output_text }, usage: null };
  });
}

// The locked house style: every dish icon uses exactly this prompt so the menu reads as one family.
export const ICON_STYLE =
  'Flat sticker illustration of this exact dish seen from directly above on a round white plate. Thick dark ink outline (#1B1B3A), flat colours, no gradients, no text, no shadows, centred on a plain flat white background (never a checkerboard). Keep the real components and their positions.';

/** Golden photo → the dish's icon in the house style. */
export const generateDishIcon = (ctx: Ctx, goldenPhoto: Blob) =>
  call(MODELS.image, ctx, async () => {
    const res = await metaClient().images.edit({ model: MODELS.image, image: new File([goldenPhoto], 'golden.png'), prompt: ICON_STYLE, size: '1024x1024' });
    return { value: res.data?.[0] ?? null };
  });

/** Golden photo + rules → a numbered plating card for staff. */
export const generateSopCard = (ctx: Ctx, goldenPhoto: Blob, rules: string[], dish: string) =>
  call(MODELS.image, ctx, async () => {
    const res = await metaClient().images.edit({
      model: MODELS.image,
      image: new File([goldenPhoto], 'golden.png'),
      prompt: `A kitchen plating card titled "${dish}". Keep the dish photo exactly as it is. Add small numbered markers on the plate and a numbered list below with only these rules, word for word: ${rules.map((r, i) => `${i + 1}. ${r}`).join(' ')}. Add no other text, descriptions or claims. Large readable labels, clean flat layout.`,
      size: '1024x1536',
    });
    return { value: res.data?.[0] ?? null };
  });

/** Local Glimmer: keep a pass frame only if a plate is in it. */
export const frameHasPlate = (ctx: Ctx, frame: string) =>
  call(MODELS.glimmer, ctx, async () => {
    const res = await glimmerClient().chat.completions.create({
      model: MODELS.glimmer,
      messages: [{ role: 'user', content: [{ type: 'text', text: 'Is there a plated dish fully inside this frame? Answer yes or no.' }, { type: 'image_url', image_url: { url: frame } }] }],
      max_tokens: 3,
    });
    return { value: /yes/i.test(res.choices[0]?.message.content ?? ''), usage: null };
  });

/** Local Glimmer: strip phone numbers and emails from guest text before it leaves the restaurant. */
export const redact = (ctx: Ctx, guestText: string) =>
  call(MODELS.glimmer, ctx, async () => {
    const res = await glimmerClient().chat.completions.create({
      model: MODELS.glimmer,
      messages: [{ role: 'system', content: 'Replace every phone number and email address with [redacted]. Change nothing else. Output only the text.' }, { role: 'user', content: guestText }],
    });
    return { value: res.choices[0]?.message.content ?? guestText, usage: null };
  });
