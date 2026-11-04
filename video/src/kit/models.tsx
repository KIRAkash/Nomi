// The six Meta models: their marks, the rail along the bottom that lights whichever is working, and the large lockup
// shown when a model starts a job. Muse models use the Muse mark; SAM 3.1 uses the Meta symbol with its name set in type.
import { Img, interpolate, staticFile, useCurrentFrame } from 'remotion';

import { c, display, type } from '../theme';
import { ramp } from './motion';

export type Model = 'wonder' | 'spark' | 'image' | 'voice' | 'glimmer' | 'sam';
export const MODELS: { id: Model; name: string; mark: 'muse' | 'meta' }[] = [
  { id: 'wonder', name: 'Muse Wonder', mark: 'muse' },
  { id: 'spark', name: 'Muse Spark', mark: 'muse' },
  { id: 'image', name: 'Muse Image', mark: 'muse' },
  { id: 'voice', name: 'Muse Voice', mark: 'muse' },
  { id: 'glimmer', name: 'Glimmer', mark: 'muse' },
  { id: 'sam', name: 'SAM 3.1', mark: 'meta' },
];
const byId = Object.fromEntries(MODELS.map((m) => [m.id, m]));

export function Mark({ kind, size }: { kind: 'muse' | 'meta'; size: number }) {
  return kind === 'muse'
    ? <Img src={staticFile('brand/muse.png')} style={{ width: size, height: size, objectFit: 'contain' }} />
    : <Img src={staticFile('brand/meta.svg')} style={{ width: size * 1.5, height: size, objectFit: 'contain' }} />;
}

/**
 * The rail: all six models in a row at the bottom of the frame. `active` lights one (or several) at full strength with a
 * saffron rule under it; the rest sit back. `at` is when the rail itself arrives, each model landing in turn.
 */
export function ModelRail({ active = [], at = 0, out, landing = 5, idle = 'lit' }: { active?: Model[]; at?: number; out?: number; landing?: number; /** With nothing active: all lit (the reveal) or all dimmed (mid-demo). */ idle?: 'lit' | 'dim' }) {
  const frame = useCurrentFrame();
  const leave = out === undefined ? 0 : ramp(frame, out, out + 14);
  return (
    <div style={{ position: 'absolute', left: 120, right: 120, bottom: 64, display: 'flex', justifyContent: 'space-between', opacity: 1 - leave }}>
      {MODELS.map((m, i) => {
        const p = ramp(frame, at + i * landing, at + i * landing + 18);
        const on = active.includes(m.id);
        return (
          <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, opacity: p * (on || (active.length === 0 && idle === 'lit') ? 1 : 0.32), transform: `translateY(${(1 - p) * 24}px)` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Mark kind={m.mark} size={36} />
              <span style={{ fontFamily: display, fontSize: type.label, fontWeight: 700, color: c.text, letterSpacing: '-0.02em' }}>{m.name}</span>
            </div>
            <div style={{ height: 4, borderRadius: 2, width: on ? '100%' : 0, backgroundColor: c.saffron, transition: 'none' }} />
          </div>
        );
      })}
    </div>
  );
}

/** A model starting a job: its mark large, its name, and one plain line saying what it is doing right now. */
export function ModelLockup({ model, doing, at = 0, out, align = 'left' }: { model: Model; doing: string; at?: number; out?: number; align?: 'left' | 'center' }) {
  const frame = useCurrentFrame();
  const m = byId[model];
  const p = ramp(frame, at, at + 22);
  const q = out === undefined ? 0 : ramp(frame, out, out + 12);
  const line = ramp(frame, at + 8, at + 30);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: align === 'center' ? 'center' : 'flex-start', gap: 18, opacity: p * (1 - q), filter: `blur(${(1 - p) * 10 + q * 10}px)` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 22, transform: `translateX(${(1 - p) * -30}px)` }}>
        <Mark kind={m.mark} size={64} />
        <span style={{ fontFamily: display, fontSize: type.title, fontWeight: 800, color: c.text, letterSpacing: '-0.035em' }}>{m.name}</span>
      </div>
      <span style={{ fontFamily: display, fontSize: type.line, fontWeight: 500, color: c.sub, letterSpacing: '-0.02em', opacity: line, transform: `translateY(${interpolate(line, [0, 1], [16, 0])}px)` }}>{doing}</span>
    </div>
  );
}
