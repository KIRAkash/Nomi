// One typed function per row of the spec's model usage map (section 8). Screens never call the API directly.
import {
  ClosingCheck, ComponentProposal, DishRecognition, FeedbackTags, GuestQuestionProposal, MenuExtraction, PlatingRules, ReplyDraft,
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
    'List the separately visible parts of this plated dish as seen from above. sam_prompt is a short noun phrase a segmentation model can find ("fried onion garnish"). role: main for the base, count for pieces worth counting, placement for garnish whose position matters, side for bowls and accompaniments.',
    [text(`${dish.name}\n${dish.description ?? ''}`)]);

/** Chef voice spec: transcript → plating rules, each read back to the chef before it is saved. */
export const parseRules = (ctx: Ctx, transcript: string, components: string[]) =>
  structured(MODELS.spark, ctx, 'rules', PlatingRules,
    `Turn the chef's spoken plating instructions into checkable rules. Components: ${components.join(', ')}. Use clock positions as said. If the chef spoke Hindi or Hinglish, write text in English and set translated_from.`,
    [text(transcript)]);

/** Guest questions: components + rules → up to 5 suggestions; the chef keeps up to 3. */
export const proposeGuestQuestions = (ctx: Ctx, dish: { name: string; components: string[]; rules: string[]; counts: Record<string, number> }) =>
  structured(MODELS.spark, ctx, 'questions', GuestQuestionProposal,
    'Suggest short yes/no questions a diner can answer in one tap about this dish, each tied to something the Golden Plate checks (portion, piece counts, temperature, a key component). No more than 8 words each. Friendly tone.',
    [text(JSON.stringify(dish))]);

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

/** Audio → transcript, using Muse Voice Transcribe (Muse Spark's own audio input is not fully supported). */
export async function transcribe(ctx: Ctx, audio: Blob, opts: { diarize?: boolean } = {}) {
  return call(MODELS.voice, ctx, async () => {
    const form = new FormData();
    form.append('model', MODELS.voice);
    form.append('file', audio, 'audio.m4a');
    if (opts.diarize) form.append('diarization', 'true');
    const res = await fetch(`${BASE_URL}/asr/transcribe`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.MODEL_API_KEY}` },
      body: form,
    });
    if (!res.ok) throw new Error(`transcribe ${res.status}: ${await res.text()}`);
    return { value: (await res.json()) as { text: string; language?: string; segments?: { speaker?: string; text: string }[] } };
  });
}

/**
 * SAM 3.1 segmentation for one component prompt (text) or a tap (point) on one photo.
 * The mask encoding is still an open question in the spec: this returns the raw response for the
 * vision worker to parse until it is confirmed against the media segmentation docs.
 */
export async function segment(ctx: Ctx, photo: string, prompt: { text: string } | { point: [number, number] }) {
  return call(MODELS.sam, ctx, async () => {
    const res = await metaClient().responses.create({
      model: MODELS.sam,
      input: [{ role: 'user', content: [image(photo), text('text' in prompt ? prompt.text : `point:${prompt.point.join(',')}`)] }],
    });
    return { value: res, usage: res.usage };
  });
}

// The locked house style: every dish icon uses exactly this prompt so the menu reads as one family.
export const ICON_STYLE =
  'Flat sticker illustration of this exact dish seen from directly above on a round white plate. Thick dark ink outline (#1B1B3A), flat colours, no gradients, no text, no shadows, centred on a transparent background. Keep the real components and their positions.';

/** Golden photo → the dish's icon in the house style. */
export const generateDishIcon = (ctx: Ctx, goldenPhoto: Blob) =>
  call(MODELS.image, ctx, async () => {
    const res = await metaClient().images.edit({ model: MODELS.image, image: new File([goldenPhoto], 'golden.png'), prompt: ICON_STYLE, size: '1024x1024' });
    return { value: res.data?.[0] ?? null };
  });

/** Golden photo + rules → a numbered plating card for staff. */
export const generateSopCard = (ctx: Ctx, goldenPhoto: Blob, rules: string[]) =>
  call(MODELS.image, ctx, async () => {
    const res = await metaClient().images.edit({
      model: MODELS.image,
      image: new File([goldenPhoto], 'golden.png'),
      prompt: `Clean kitchen plating card. Keep the dish photo, add small numbered markers for: ${rules.map((r, i) => `${i + 1}. ${r}`).join(' ')}. Large readable labels.`,
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
