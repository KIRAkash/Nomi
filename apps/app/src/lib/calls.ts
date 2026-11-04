// Every live model call this app made since it opened: which Meta model, for what, how long. The Models screen shows it.
import { useSyncExternalStore } from 'react';

import type { Model } from './mock';

export type LiveCall = { models: Model[]; what: string; ms: number; ok: boolean; at: number };

const ROUTES: [RegExp, Model[], string][] = [
  [/^\/golden\/read/, ['SAM 3.1'], 'Found every part on a plate photo'],
  [/^\/golden\/tap/, ['SAM 3.1'], 'Re-read one part around a tap'],
  [/^\/t\/[^/]+\/recognise/, ['Muse Spark'], 'Named the dish in a guest photo'],
  [/^\/voice/, ['Voice Transcribe', 'Muse Spark'], 'Wrote down a voice note and read it'],
  [/^\/staff\/menu/, ['Muse Wonder'], 'Read a printed menu'],
  [/^\/staff\/components/, ['Muse Spark'], 'Listed the parts of a dish for SAM'],
  [/^\/staff\/questions/, ['Muse Spark'], 'Wrote guest questions from the rules'],
  [/^\/staff\/reply/, ['Muse Spark'], 'Drafted a reply in the guest’s language'],
  [/^\/staff\/translate/, ['Muse Spark'], 'Translated a plating card'],
  [/^\/staff\/ask/, ['Muse Wonder'], 'Answered a question from the facts'],
  [/^\/staff\/icon/, ['Muse Image'], 'Drew a dish icon from the Golden Plate'],
  [/^\/staff\/card/, ['Muse Image'], 'Drew a numbered plating card'],
  [/^\/staff\/pass/, ['SAM 3.1'], 'Checked a pass plate against its Golden Plate'],
  [/^\/staff\/nightshift/, ['Muse Wonder', 'Muse Spark'], 'Ran NIGHTSHIFT: plan, 4 analysts, briefing'],
];

let calls: LiveCall[] = [];
const listeners = new Set<() => void>();

export function recordCall(path: string, ms: number, ok: boolean) {
  const route = ROUTES.find(([re]) => re.test(path));
  if (!route) return;
  calls = [{ models: route[1], what: route[2], ms, ok, at: Date.now() }, ...calls].slice(0, 100);
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
export const useLiveCalls = () => useSyncExternalStore(subscribe, () => calls, () => calls);
