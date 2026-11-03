// Voice notes from any screen: the phone records AAC (Android, iOS) or WebM (browsers), ffmpeg turns it into the 16 kHz
// mono WAV Muse Voice Transcribe accepts, then Muse Spark turns the words into what that screen needs. Every step is real.
import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { parseRules, summariseHandover, tagFeedback, transcribe } from '@nomi/models';
import { DEMO_GUEST_PAGE } from '@nomi/shared';
import { Hono } from 'hono';
import { z } from 'zod';

import { limited } from './limit';

/** 44-byte header for 16 kHz mono 16-bit PCM. ffmpeg can't fill in the sizes when it writes WAV to a pipe, and
 * Voice Transcribe then hears nothing, so ffmpeg outputs raw PCM and the header is written here. */
function wavHeader(bytes: number) {
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + bytes, 4); h.write('WAVE', 8);
  h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(16000, 24); h.writeUInt32LE(32000, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(bytes, 40);
  return h;
}

/** Any audio ffmpeg can read → 16 kHz mono 16-bit WAV. The input goes through a file: phone .m4a keeps its index at the end. */
async function toWav(audio: Buffer): Promise<Buffer> {
  const dir = await mkdtemp(join(tmpdir(), 'voice-'));
  const file = join(dir, 'in');
  await writeFile(file, audio);
  try {
    return await pcm(file);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function pcm(file: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const ff = spawn('ffmpeg', ['-loglevel', 'error', '-i', file, '-ar', '16000', '-ac', '1', '-f', 's16le', 'pipe:1']);
    const out: Buffer[] = [];
    const err: Buffer[] = [];
    ff.stdout.on('data', (d: Buffer) => out.push(d));
    ff.stderr.on('data', (d: Buffer) => err.push(d));
    ff.on('error', reject);
    ff.on('close', (code) => (code === 0 ? resolve(Buffer.concat([wavHeader(out.reduce((n, b) => n + b.length, 0)), ...out])) : reject(new Error(`ffmpeg ${code}: ${Buffer.concat(err).toString().slice(0, 200)}`))));
  });
}

const Body = z.object({
  audio: z.string().startsWith('data:').max(12_000_000),
  mode: z.enum(['feedback', 'rules', 'handover', 'plain']),
  components: z.array(z.string().max(60)).max(12).optional(),
});

export const voice = new Hono().post('/', async (c) => {
  if (limited(`voice:${c.req.header('x-forwarded-for')?.split(',')[0] ?? 'local'}`, 40, 60 * 60_000)) return c.json({ error: 'slow down' }, 429);
  const body = Body.safeParse(await c.req.json());
  if (!body.success) return c.json({ error: 'bad request' }, 400);
  const { audio, mode, components } = body.data;
  const t0 = Date.now();
  let wav: Buffer;
  try {
    wav = await toWav(Buffer.from(audio.slice(audio.indexOf(',') + 1), 'base64'));
  } catch (err) {
    return c.json({ error: `could not read the recording: ${(err as Error).message}` }, 400);
  }
  const ctx = { purpose: `voice_${mode}` };
  const heard = await transcribe(ctx, new Blob([new Uint8Array(wav)], { type: 'audio/wav' }));
  // Transcripts sometimes end with stream residue (".stream", "..").
  const transcript = heard.transcript.trim().replace(/\.?stream$/, '').replace(/([.।!?])[.]+$/, '$1').trim();
  const timing = { transcribe_ms: Date.now() - t0, audio_ms: heard.audioDurationMs };
  if (!transcript) return c.json({ transcript: '', ...timing });
  const t1 = Date.now();
  const extra =
    mode === 'feedback' ? { tags: await tagFeedback(ctx, transcript, DEMO_GUEST_PAGE.dishes.map(({ id, name }) => ({ id, name }))) }
    : mode === 'rules' ? { rules: await parseRules(ctx, transcript, components ?? []) }
    : mode === 'handover' ? { handover: await summariseHandover(ctx, transcript) }
    : {};
  return c.json({ transcript, turns: heard.turns, ...timing, spark_ms: mode === 'plain' ? 0 : Date.now() - t1, ...extra });
});
