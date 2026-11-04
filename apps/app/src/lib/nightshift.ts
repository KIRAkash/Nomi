// The NIGHTSHIFT run this app last started, shared by Today (the briefing) and Kitchen (the watch list), so a run on one
// screen shows on the other. Stage states arrive live from the API.
import type { NightshiftPlan, NightshiftResult } from '@nomi/shared';
import { useSyncExternalStore } from 'react';

import { runNightshift, type StageEvent } from './api';
import { nightInput } from './facts';

export type StageState = 'wait' | 'run' | 'done' | 'skip' | 'fail';
export type Stage = { state: StageState; text?: string; ms?: number; findings?: number; facts?: number };
export type Night = {
  status: 'idle' | 'running' | 'done' | 'error';
  stages: Record<string, Stage>;
  plan: NightshiftPlan | null;
  result: (NightshiftResult & { ms: number }) | null;
  error: string | null;
  startedAt: number | null;
};

const IDLE: Night = { status: 'idle', stages: {}, plan: null, result: null, error: null, startedAt: null };
let night = IDLE;
const listeners = new Set<() => void>();
const set = (n: Partial<Night>) => {
  night = { ...night, ...n };
  listeners.forEach((l) => l());
};

function onEvent(e: StageEvent) {
  if (e.type === 'stage' && e.id && e.state) {
    const prev = night.stages[e.id] ?? { state: 'wait' };
    set({ stages: { ...night.stages, [e.id]: { ...prev, state: e.state, text: e.text ?? prev.text, ms: e.ms ?? prev.ms, findings: (e.findings as number) ?? prev.findings, facts: (e.facts as number) ?? prev.facts } } });
  } else if (e.type === 'plan') set({ plan: e.plan as NightshiftPlan });
  else if (e.type === 'facts') {
    const sizes = e.sizes as Record<string, number>;
    set({ stages: { ...night.stages, ...Object.fromEntries(Object.entries(sizes).map(([k, n]) => [k, { ...(night.stages[k] ?? { state: 'wait' as const }), facts: n }])) } });
  }
}

export async function startNightshift() {
  if (night.status === 'running') return;
  set({ ...IDLE, status: 'running', startedAt: Date.now(), result: night.result });
  try {
    const result = await runNightshift(nightInput(), onEvent);
    set({ status: 'done', result });
  } catch (err) {
    set({ status: 'error', error: (err as Error).message });
  }
}

const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
export const useNightshift = () => useSyncExternalStore(subscribe, () => night, () => night);
