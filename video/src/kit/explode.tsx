// The drawn plate pulled apart into the parts SAM 3.1 found: the empty plate at the bottom, each part lifted to its own height in
// 3D, each named beside it. `p` runs 0 (stacked, a normal plate) → 1 (apart).
import { Img, useCurrentFrame } from 'remotion';

import { c, display, type } from '../theme';
import { GRID, layerFile } from './drawn';
import { ramp } from './motion';

export const LAYERS = [
  { file: 'rice', name: 'Rice', colour: c.sky },
  { file: 'chicken', name: 'Chicken', colour: c.tomato },
  { file: 'onions', name: 'Fried onions', colour: c.saffron },
  { file: 'lemon', name: 'Lemon', colour: c.pink },
  { file: 'raita', name: 'Raita', colour: c.mint },
] as const;

export function PlateExplode({ d, p, tilt = 58, spin = 0, lift = 0.2, labelsAt, checksAt }: {
  /** Plate diameter on screen; `lift` is the height between layers, as a share of it. */
  d: number; p: number; tilt?: number; spin?: number; lift?: number;
  /** Frame each layer's name appears (one per layer, in LAYERS order); omit for no names. */
  labelsAt?: number[];
  /** Frame a check lands beside every name. */
  checksAt?: number;
}) {
  const f = useCurrentFrame();
  const k = d / (2 * GRID.r);
  const w = 1000 * k, h = 1000 * k;
  const gap = d * lift;
  const layer = (file: 'plate' | (typeof LAYERS)[number]['file'], z: number) => (
    <Img src={layerFile(file)} style={{ position: 'absolute', left: -GRID.cx * k, top: -GRID.cy * k, width: w, height: h, transform: `translateZ(${z}px)`,
      filter: z > 0 ? `drop-shadow(0 ${8 + z * 0.05}px ${10 + z * 0.08}px rgba(70,50,10,0.24))` : undefined }} />
  );
  return (
    <div style={{ position: 'relative', width: d, height: d, perspective: 2400 }}>
      <div style={{ position: 'absolute', left: d / 2, top: d / 2, transformStyle: 'preserve-3d', transform: `rotateX(${tilt * Math.min(1, p * 1.4)}deg) rotateZ(${spin}deg)` }}>
        {layer('plate', 0)}
        {LAYERS.map((l, i) => layer(l.file, l.file === 'raita' ? 0 : gap * (i + 1) * p))}
      </div>
      {labelsAt !== undefined && LAYERS.map((l, i) => {
        const q = ramp(f, labelsAt[i], labelsAt[i] + 14);
        const ok = checksAt === undefined ? 0 : ramp(f, checksAt + i * 4, checksAt + i * 4 + 12);
        // A fixed row for each name, top layer highest, raita on its own below; the names go as the plate closes up.
        const y = l.file === 'raita' ? d * 0.84 : d * 0.56 - i * 58;
        return (
          <div key={l.file} style={{ position: 'absolute', left: d * 1.14, top: y - 30, display: 'flex', alignItems: 'center', gap: 18, opacity: q * Math.min(1, p * 2.5), transform: `translateX(${(1 - q) * 24}px)`, whiteSpace: 'nowrap' }}>
            <div style={{ width: 54, height: 4, background: l.colour, borderRadius: 2 }} />
            <span style={{ fontFamily: display, fontSize: type.label + 6, fontWeight: 700, color: c.text, letterSpacing: '-0.02em' }}>{l.name}</span>
            <svg width={34} height={34} viewBox="0 0 34 34" style={{ opacity: ok, transform: `scale(${0.6 + 0.4 * ok})` }}>
              <path d="M8 18l6 6 12-14" fill="none" stroke={c.mint} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        );
      })}
    </div>
  );
}
