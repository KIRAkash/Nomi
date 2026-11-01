// One client for the Meta Model API and one for the local Glimmer server. Every call goes through call(), which retries and logs.
import OpenAI from 'openai';
import { z } from 'zod';

export const MODELS = {
  wonder: 'muse-wonder-1.0',
  spark: 'muse-spark-1.3',
  image: 'muse-image-1.0',
  voice: 'muse-voice-transcribe-1.0',
  sam: 'sam-3.1',
  glimmer: 'muse-glimmer',
} as const;
export type ModelName = (typeof MODELS)[keyof typeof MODELS];

export type CallLog = {
  restaurant_id: string | null;
  model: string;
  purpose: string;
  tokens_in: number | null;
  tokens_out: number | null;
  latency_ms: number;
  ok: boolean;
};

let logger: (row: CallLog) => void | Promise<void> = () => {};
/** The API sets this to write each call into model_calls. */
export const onModelCall = (fn: typeof logger) => void (logger = fn);

const env = (k: string) => (typeof process !== 'undefined' ? process.env[k] : undefined);
export const BASE_URL = env('MODEL_BASE_URL') ?? 'https://api.meta.ai/v1';

let meta: OpenAI | null = null;
let glimmer: OpenAI | null = null;
export function metaClient() {
  if (!meta) {
    const apiKey = env('MODEL_API_KEY');
    if (!apiKey) throw new Error('MODEL_API_KEY is not set');
    meta = new OpenAI({ apiKey, baseURL: BASE_URL, maxRetries: 2, timeout: 60_000 });
  }
  return meta;
}
export function glimmerClient() {
  if (!glimmer) glimmer = new OpenAI({ apiKey: 'local', baseURL: env('GLIMMER_BASE_URL') ?? 'http://localhost:8000/v1', timeout: 20_000 });
  return glimmer;
}

export type Ctx = { restaurant_id?: string | null; purpose: string };

export async function call<T>(model: string, ctx: Ctx, run: () => Promise<{ value: T; usage?: { input_tokens?: number; output_tokens?: number } | null }>): Promise<T> {
  const t0 = Date.now();
  try {
    const { value, usage } = await run();
    await logger({ restaurant_id: ctx.restaurant_id ?? null, model, purpose: ctx.purpose, tokens_in: usage?.input_tokens ?? null, tokens_out: usage?.output_tokens ?? null, latency_ms: Date.now() - t0, ok: true });
    return value;
  } catch (err) {
    await logger({ restaurant_id: ctx.restaurant_id ?? null, model, purpose: ctx.purpose, tokens_in: null, tokens_out: null, latency_ms: Date.now() - t0, ok: false });
    throw err;
  }
}

export type Part =
  | { type: 'input_text'; text: string }
  | { type: 'input_image'; image_url: string; detail: 'auto' | 'low' | 'high' };

export const text = (t: string): Part => ({ type: 'input_text', text: t });
export const image = (url: string): Part => ({ type: 'input_image', image_url: url, detail: 'auto' });

/** A Responses call whose output must match schema; anything else throws, so no unchecked model output reaches a screen. */
export async function structured<S extends z.ZodType>(model: string, ctx: Ctx, name: string, schema: S, instructions: string, parts: Part[]): Promise<z.infer<S>> {
  return call(model, ctx, async () => {
    const res = await metaClient().responses.create({
      model,
      instructions,
      input: [{ role: 'user', content: parts }],
      text: { format: { type: 'json_schema', name, schema: z.toJSONSchema(schema) as Record<string, unknown>, strict: true } },
    });
    return { value: schema.parse(JSON.parse(res.output_text)), usage: res.usage };
  });
}
