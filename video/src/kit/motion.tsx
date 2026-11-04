// Shared motion: the paper stage, kinetic headlines, and the easing every scene uses.
import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

import { c, display, type } from '../theme';

export const ease = Easing.bezier(0.16, 1, 0.3, 1);
export const inOut = Easing.bezier(0.65, 0, 0.35, 1);

/** 0→1 between two frames with the house ease; clamps outside. */
export const ramp = (f: number, from: number, to: number, e = ease) =>
  interpolate(f, [from, to], [0, 1], { easing: e, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

export function useSpring(delay = 0, damping = 18, mass = 0.8) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping, mass, stiffness: 140 } });
}

/**
 * The stage: the Paper background (light yellow fading to white under a fine still grain, scripts/paper.py) and a slow
 * camera push on everything in front of it, so no frame ever sits completely still.
 */
export function Stage({ children }: { children?: ReactNode }) {
  const frame = useCurrentFrame();
  const push = Math.min(0.036, (frame / 30) * 0.0019);
  const sway = Math.sin(frame / 110) * 6;
  return (
    <AbsoluteFill style={{ backgroundColor: c.paper, overflow: 'hidden' }}>
      <Img src={staticFile('bg/paper.png')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      <AbsoluteFill style={{ transform: `translateX(${sway}px) scale(${1 + push})`, transformOrigin: '50% 46%' }}>
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

/**
 * A headline that arrives word by word: each word rises, sharpens out of a blur and settles. `at` is when it starts,
 * `out` when it leaves (it lifts and blurs away).
 */
export function Words({ text, at = 0, out, size = type.headline, weight = 800, color = c.text, stagger = 3, style, accent }: {
  text: string; at?: number; out?: number; size?: number; weight?: number; color?: string; stagger?: number; style?: CSSProperties;
  /** Words to colour saffron. */
  accent?: string[];
}) {
  const frame = useCurrentFrame();
  const words = text.split(' ');
  const leave = out === undefined ? 0 : ramp(frame, out, out + 14, inOut);
  return (
    <div style={{ fontFamily: display, fontSize: size, fontWeight: weight, lineHeight: 1.02, letterSpacing: '-0.035em', color, display: 'flex', flexWrap: 'wrap', columnGap: '0.24em', ...style }}>
      {words.map((w, i) => {
        const p = ramp(frame, at + i * stagger, at + i * stagger + 22);
        return (
          <span key={i} style={{
            display: 'inline-block',
            opacity: p * (1 - leave),
            transform: `translateY(${(1 - p) * 0.42 * size - leave * 0.25 * size}px)`,
            filter: `blur(${(1 - p) * 14 + leave * 16}px)`,
            color: accent?.includes(w.replace(/[.,]/g, '')) ? c.saffron : undefined,
          }}>{w}</span>
        );
      })}
    </div>
  );
}

/** Fades a whole block in and out with a little scale, for anything that isn't a headline. */
export function Reveal({ at = 0, out, children, style, rise = 30 }: { at?: number; out?: number; children: ReactNode; style?: CSSProperties; rise?: number }) {
  const frame = useCurrentFrame();
  const p = ramp(frame, at, at + 24);
  const q = out === undefined ? 0 : ramp(frame, out, out + 16, inOut);
  return (
    <div style={{ opacity: p * (1 - q), transform: `translateY(${(1 - p) * rise}px) scale(${0.98 + 0.02 * p - 0.02 * q})`, filter: `blur(${(1 - p) * 8 + q * 10}px)`, ...style }}>
      {children}
    </div>
  );
}
