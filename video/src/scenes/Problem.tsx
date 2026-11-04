// The problem (voiceover line 1). The chef's drawn plate; it multiplies into service, and the copies change (each loses
// what SAM 3.1 found missing in a demo photo). Then the guests: comments in many languages that fade before reaching anyone.
import { AbsoluteFill, Audio, Img, interpolate, random, Sequence, staticFile, useCurrentFrame } from 'remotion';

import { AT, DRIFTS, DrawnPlate, GOLDEN, GRID, type PlateSpec } from '../kit/drawn';
import { blur, Stage, Words, inOut, ramp } from '../kit/motion';
import { VO_AT, voice } from '../kit/vo';
import { c, display, type } from '../theme';

// vo-1's phrases: "A head chef plans…" · "Then other cooks…" · "Over the weeks, the lemon…, and the fried onions…" ·
// "Guests notice," · "but the few…" · "and nobody knows which plate they got."
const V = voice(1);
const T = { designed: V.at(0), grid: V.at(1) - 6, made: V.at(1), drifts: V.at(2, 0.9), onions: V.at(2, 2.5), guests: V.at(3), which: V.at(5), end: V.frames };
export const PROBLEM = T.end;

// The chef's plate, then the four ways the copies came out (from the demo photos: lemon gone, onions left off, both).
const VARIANTS: PlateSpec[] = [GOLDEN, ...DRIFTS];

const COLS = 7, CELL = 214;
const cells = Array.from({ length: COLS * 3 }, (_, i) => {
  const col = i % COLS, row = Math.floor(i / COLS);
  const dist = Math.hypot(col - 3, row - 1);
  return {
    x: 960 + (col - 3) * 246, y: 640 + (row - 1) * 240, rot: random(`r${i}`) * 50 - 25,
    // Further from the chef's plate in the middle, more drift.
    level: i === 10 ? 0 : Math.min(4, Math.max(1, Math.round(dist * 1.1 + random(`lvl${i}`) * 1.6))),
    delay: dist * 4 + random(`d${i}`) * 5,
  };
});

const COMMENTS = [
  { t: 'Naan was cold.', x: 200, y: 250 },
  { t: 'खाना ठंडा था', x: 1300, y: 210 },
  { t: 'Less rice than last time?', x: 1100, y: 800 },
  { t: 'ಈರುಳ್ಳಿ ಇರಲಿಲ್ಲ', x: 260, y: 780 },
  { t: 'পেঁয়াজ ছিল না', x: 1480, y: 330 },
  { t: 'Not like the photo.', x: 620, y: 300 },
];

export function Problem() {
  const f = useCurrentFrame();
  const arrive = ramp(f, 0, 50);
  const toGrid = ramp(f, T.grid, T.grid + 46, inOut);
  const hero = cells[10];
  const heroX = interpolate(toGrid, [0, 1], [1300, hero.x]);
  const heroY = interpolate(toGrid, [0, 1], [560, hero.y]);
  const heroD = interpolate(toGrid, [0, 1], [700, CELL]);
  // The raita bowl turns out to the right of the hero plate, away from the headline.
  const heroRot = interpolate(toGrid, [0, 1], [-90, hero.rot]) + f * 0.03;
  const sweep = interpolate(f, [24, 110], [-0.4, 1.4], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const pull = interpolate(f, [T.grid, T.guests], [1.1, 1], { easing: inOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const fade = ramp(f, T.guests - 12, T.guests + 24, inOut);

  return (
    <Stage>
      <Sequence from={VO_AT} layout="none"><Audio src={staticFile(V.file)} /></Sequence>
      <AbsoluteFill style={{ transform: `scale(${pull - fade * 0.08})`, opacity: 1 - fade * 0.9 }}>
        {cells.map((cell, i) => {
          if (i === 10) return null;
          const turn = (f - T.grid) * 0.08 * (i % 2 ? 1 : -1);
          const p = ramp(f, T.grid + 12 + cell.delay, T.grid + 36 + cell.delay);
          const drift = ramp(f, T.drifts + cell.delay * 1.2, T.drifts + 18 + cell.delay * 1.2);
          return (
            <div key={i} style={{ opacity: p, transform: `scale(${0.85 + 0.15 * p})`, transformOrigin: `${cell.x}px ${cell.y}px` }}>
              <DrawnPlate spec={GOLDEN} x={cell.x} y={cell.y} d={CELL} rot={cell.rot + turn} />
              <DrawnPlate spec={VARIANTS[cell.level]} x={cell.x} y={cell.y} d={CELL} rot={cell.rot + turn} style={{ opacity: drift }} />
              <Missing cell={{ ...cell, rot: cell.rot + turn }} at={{ lemon: T.drifts + 10 + cell.delay * 1.2, onions: T.onions + 6 + cell.delay * 1.2 }} />
            </div>
          );
        })}
        <DrawnPlate spec={GOLDEN} raita={toGrid < 0.5} x={heroX} y={heroY} d={heroD} rot={heroRot}
          style={{ opacity: arrive, filter: [blur((1 - arrive) * 18), `drop-shadow(0 ${30 - toGrid * 22}px ${60 - toGrid * 40}px rgba(70,50,10,0.24))`].filter(Boolean).join(' ') }} />
        <div style={{ position: 'absolute', left: heroX - heroD / 2, top: heroY - heroD / 2, width: heroD, height: heroD, borderRadius: '50%', opacity: 1 - toGrid,
          background: `linear-gradient(110deg, transparent ${sweep * 100 - 14}%, rgba(255,236,190,0.28) ${sweep * 100}%, transparent ${sweep * 100 + 14}%)`, mixBlendMode: 'screen' }} />
      </AbsoluteFill>

      <Words text="Planned once." at={T.designed} out={T.grid - 6} size={type.hero} style={{ position: 'absolute', left: 120, top: 330, width: 640 }} />
      <Words text="Made hundreds of times." at={T.made} out={T.drifts - 14} size={type.headline} style={{ position: 'absolute', left: 120, top: 92 }} />
      <Words text="The lemon goes missing." at={T.drifts} out={T.onions - 8} size={type.headline} accent={['missing.']} style={{ position: 'absolute', left: 120, top: 92 }} />
      <Words text="The onions get left off." at={T.onions} out={T.guests - 14} size={type.headline} accent={['left', 'off.']} style={{ position: 'absolute', left: 120, top: 92 }} />

      {COMMENTS.map((m, i) => {
        const a = T.guests + 6 + i * 10;
        const p = ramp(f, a, a + 20);
        const gone = ramp(f, a + 44 + random(`g${i}`) * 26, a + 76 + random(`g${i}`) * 26, inOut);
        return (
          <div key={i} style={{ position: 'absolute', left: m.x, top: m.y - (f - a) * 0.5, fontFamily: display, fontSize: type.line, fontWeight: 500, color: c.text,
            opacity: p * (1 - gone) * 0.85, filter: blur((1 - p) * 8 + gone * 14), letterSpacing: '-0.02em' }}>{m.t}</div>
        );
      })}
      <Words text="Guests notice. Few say so." at={T.guests} out={T.which - 14} size={type.headline} style={{ position: 'absolute', left: 120, right: 120, top: 470, justifyContent: 'center' }} />
      <Words text="Nobody knows which plate they got." at={T.which} out={T.end - 12} size={type.headline} accent={['which', 'plate']} style={{ position: 'absolute', left: 200, right: 200, top: 360, justifyContent: 'center', textAlign: 'center' }} />
    </Stage>
  );
}

/** Saffron rings opening where a part used to be, on a plate that has lost it. */
function Missing({ cell, at: when }: { cell: { x: number; y: number; level: number; rot: number }; at: Record<'lemon' | 'onions', number> }) {
  const f = useCurrentFrame();
  const k = CELL / (2 * GRID.r);
  const r0 = (cell.rot * Math.PI) / 180;
  const spec = VARIANTS[cell.level];
  return (
    <>
      {(['lemon', 'onions'] as const).filter((part) => !spec[part]).map((part) => {
        const a = when[part];
        const p = ramp(f, a, a + 18);
        const q = ramp(f, a + 60, a + 90);
        const [px, py] = AT[part];
        const dx = (px - GRID.cx) * k, dy = (py - GRID.cy) * k;
        const x = cell.x + dx * Math.cos(r0) - dy * Math.sin(r0), y = cell.y + dx * Math.sin(r0) + dy * Math.cos(r0);
        const r = 24 + p * 6;
        return <div key={part} style={{ position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: '50%', border: `4px solid ${c.saffron}`, opacity: p * (1 - q * 0.6), boxShadow: `0 0 24px ${c.saffron}` }} />;
      })}
    </>
  );
}
