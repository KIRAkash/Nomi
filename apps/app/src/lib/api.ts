import type { DishRecognition, GuestFeedbackInput, GuestPage } from '@nomi/shared';

import { DEMO_GUEST_PAGE } from './demo';

const API = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787';

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, { ...init, headers: { 'content-type': 'application/json', ...init?.headers } });
  if (!res.ok) throw new Error(`${path} ${res.status}`);
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
export const readGolden = (photos: string[], parts: { name: string; prompt: string; colour: string }[]) =>
  json<{ photos: GoldenRead[] }>('/golden/read', { method: 'POST', body: JSON.stringify({ photos, parts }) });

/** Re-asks SAM for one part around the spot the chef tapped (x, y are 0–1 across the photo). */
export const tapGolden = (id: string, part: string, x: number, y: number) =>
  json<GoldenRead>('/golden/tap', { method: 'POST', body: JSON.stringify({ id, part, x, y }) });
