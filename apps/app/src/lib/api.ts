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
