import {
  DEMO_GUEST_PAGE, NightshiftResult, PassCheck, type AskAnswer, type CardTranslation, type ComponentProposal, type DishRecognition, type FeedbackTags, type GuestFeedbackInput,
  type GuestPage, type GuestQuestionProposal, type HandoverSummary, type MenuExtraction, type PlatingRules, type ReplyDraft,
} from '@nomi/shared';

import { recordCall } from './calls';

const API = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787';

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  const t0 = Date.now();
  const res = await fetch(`${API}${path}`, { ...init, headers: { 'content-type': 'application/json', ...init?.headers } })
    .catch((err: Error) => { if (init?.method === 'POST') recordCall(path, Date.now() - t0, false); throw err; });
  if (init?.method === 'POST') recordCall(path, Date.now() - t0, res.ok);
  if (!res.ok) {
    const body = await res.json().catch(() => null) as { error?: string } | null;
    throw new Error(res.status === 429 ? 'Too many tries for now. Wait a few minutes.' : body?.error ?? `${path} ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/** Demo tokens fall back to seed data so the page works offline; real tokens surface the error. */
export async function loadGuestPage(token: string): Promise<GuestPage> {
  try {
    return await json<GuestPage>(`/t/${encodeURIComponent(token)}`);
  } catch (err) {
    if (token.startsWith('demo')) return DEMO_GUEST_PAGE;
    throw err;
  }
}

export const sendFeedback = (token: string, body: Omit<GuestFeedbackInput, 'audio_upload_id' | 'photo_upload_id'> & { photo_dish_id?: string | null }) =>
  json<{ id: string }>(`/t/${encodeURIComponent(token)}/feedback`, { method: 'POST', body: JSON.stringify(body) });

export const recognise = (token: string, photoDataUrl: string) =>
  json<DishRecognition>(`/t/${encodeURIComponent(token)}/recognise`, { method: 'POST', body: JSON.stringify({ photo: photoDataUrl }) });

/** One part as SAM 3.1 found it. Coordinates and outlines (SVG path data) are in the photo's w×h pixel grid. */
export type GoldenPart = {
  name: string; colour: string; found: boolean; count: number; share: number; where: string | null;
  centre: [number, number] | null; paths: string[]; boxes: number[][];
};
export type PlateRim = { cx: number; cy: number; r: number; path: string };
export type GoldenRead = { id: string; ok: boolean; error?: string; size: { w: number; h: number }; plate: PlateRim | null; parts: GoldenPart[] };

/** SAM 3.1 finds each part on the chef's photos; the vision worker measures them and draws the overlay. */
export const readGolden = (photos: string[], parts: { name: string; prompt: string; colour: string }[], plate = true) =>
  json<{ photos: GoldenRead[] }>('/golden/read', { method: 'POST', body: JSON.stringify({ photos, parts, plate }) });

/** Re-asks SAM for one part around the spot the chef tapped (x, y are 0–1 across the photo). */
export const tapGolden = (id: string, part: string, x: number, y: number) =>
  json<GoldenRead>('/golden/tap', { method: 'POST', body: JSON.stringify({ id, part, x, y }) });

/** What Muse Voice Transcribe heard, timed, plus what Muse Spark made of it for this screen. */
export type Heard = {
  transcript: string; transcribe_ms: number; audio_ms: number; spark_ms?: number;
  tags?: FeedbackTags; rules?: PlatingRules; handover?: HandoverSummary;
};
export const sendVoice = (audio: string, mode: 'feedback' | 'rules' | 'handover' | 'plain', components?: string[]) =>
  json<Heard>('/voice', { method: 'POST', body: JSON.stringify({ audio, mode, components }) });

type Timed = { ms: number };
const post = <T,>(path: string, body: unknown) => json<T & Timed>(path, { method: 'POST', body: JSON.stringify(body) });

/** Muse Wonder reads a printed menu photo. */
export const readMenu = (photo: string) => post<MenuExtraction>('/staff/menu', { photo });
/** Muse Spark lists the separately visible parts of a dish, as SAM 3.1 prompts. */
export const proposeParts = (name: string, description: string | null) => post<ComponentProposal>('/staff/components', { name, description });
/** Muse Spark suggests one-tap guest questions tied to what the Golden Plate checks. */
export const proposeQuestions = (dish: { name: string; components: string[]; rules: string[]; counts: Record<string, number> }) =>
  post<GuestQuestionProposal>('/staff/questions', dish);
/** Muse Spark drafts a reply in the guest's language; a manager approves it. */
export const draftReply = (feedback: string, language: string, restaurant: string) => post<ReplyDraft>('/staff/reply', { feedback, language, restaurant });
/** Muse Spark translates a plating card, keeping numbers and clock positions. */
export const translateCard = (card: { title: string; steps: string[]; watch: string[] }, language: string) =>
  post<CardTranslation>('/staff/translate', { card, language });
/** Muse Wonder answers from the facts given, and refuses forecasts. */
export const askNomi = (question: string, facts: { id: string; text: string }[], who: 'owner' | 'cook' = 'owner') => post<AskAnswer>('/staff/ask', { question, facts, who });
/** Muse Image draws the dish's icon from the Golden Plate photo. */
export const drawIcon = (photo: string) => post<{ image: string | null }>('/staff/icon', { photo });
/** Muse Image draws a numbered plating card from the Golden Plate photo and rules. */
export const drawCard = (photo: string, rules: string[], dish: string) => post<{ image: string | null }>('/staff/card', { photo, rules, dish });

/** One line of a staged call: a stage starting or ending, or a partial result such as a part SAM 3.1 just found. */
export type StageEvent = { type: string; id?: string; state?: 'run' | 'done' | 'skip' | 'fail'; text?: string; ms?: number; [k: string]: unknown };

/**
 * Posts and reads the reply line by line as the API streams it, so each stage shows as it happens. Where the platform's
 * fetch cannot stream (Android), the lines arrive together at the end. The final result is checked with its zod schema.
 */
async function staged<T>(path: string, body: unknown, onEvent: (e: StageEvent) => void, parse: (r: unknown) => T): Promise<T & Timed> {
  const t0 = Date.now();
  const res = await fetch(`${API}${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    .catch((err: Error) => { recordCall(path, Date.now() - t0, false); throw err; });
  if (!res.ok) {
    recordCall(path, Date.now() - t0, false);
    const b = await res.json().catch(() => null) as { error?: string } | null;
    throw new Error(res.status === 429 ? 'Too many tries for now. Wait a few minutes.' : b?.error ?? `${path} ${res.status}`);
  }
  let out: (T & Timed) | null = null;
  let failed: string | null = null;
  const line = (l: string) => {
    if (!l.trim()) return;
    const e = JSON.parse(l) as StageEvent;
    if (e.type === 'result') out = { ...parse(e.result), ms: e.ms ?? Date.now() - t0 };
    else if (e.type === 'error') failed = String(e.error);
    else onEvent(e);
  };
  const reader = res.body?.getReader?.();
  if (reader) {
    const dec = new TextDecoder();
    let buf = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() ?? '';
      lines.forEach(line);
    }
    line(buf);
  } else (await res.text()).split('\n').forEach(line);
  recordCall(path, Date.now() - t0, !!out);
  if (!out) throw new Error(failed ?? 'The check stopped before it finished');
  return out;
}

/** A frame Glimmer or SAM 3.1 found no plate in: it is dropped and never scored. */
export type Dropped = { dropped: true; reason: string; glimmer: PassCheck['glimmer'] };
/** Glimmer on site, the dish from the ticket (or Muse Spark), then SAM 3.1, then the vision worker against the dish's Golden Plate; stages arrive through onEvent. */
export const checkPass = (frame: string, dishId: string | null, onEvent: (e: StageEvent) => void) =>
  staged<PassCheck | Dropped>('/staff/pass', { frame, dish_id: dishId }, onEvent,
    (r) => ((r as Dropped).dropped ? (r as Dropped) : PassCheck.parse(r)));

export type NightInput = {
  night: string;
  plates: { id: string; dish: string; shift: 'Lunch' | 'Dinner'; time: string; score: number; misses: { part: string; kind: 'missing' | 'count' | 'area' | 'position'; dir: 'less' | 'more' | null }[] }[];
  notes: { id: string; text: string; photo: boolean }[];
  stock: { id: string; text: string }[];
  closing: { id: string; text: string }[];
  cards: Record<string, string[]>;
};
/** NIGHTSHIFT: Muse Wonder plans, four Muse Spark analysts read in parallel, Muse Wonder merges; stages arrive through onEvent. */
export const runNightshift = (input: NightInput, onEvent: (e: StageEvent) => void) =>
  staged('/staff/nightshift', input, onEvent, (r) => NightshiftResult.parse(r));
