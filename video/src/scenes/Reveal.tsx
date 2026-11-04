// 0:22–0:28 · Nomi. Points of light gather into the Golden Plate mark, the name lands, and the six models take their
// places in the rail that stays with the film from here.
import { AbsoluteFill, Audio, Img, interpolate, random, Sequence, staticFile, useCurrentFrame } from 'remotion';

import { ModelRail } from '../kit/models';
import { blur, Stage, Words, ease, ramp, useSpring } from '../kit/motion';
import { VO_AT, voice } from '../kit/vo';
import { Sfx } from '../kit/sfx';
import { brand, c, display, type } from '../theme';

// vo-2's phrases: "Presenting Nomi." · "It keeps every plate…" · "using six Meta models." · "What follows is the live app."
const V = voice(2);
export const REVEAL = V.frames;
// "Presenting Nomi.": the mark lands on the name.
const NAME = V.at(0, 0.72);

const SPARKS = Array.from({ length: 90 }, (_, i) => ({
  x: random(`x${i}`) * 1920, y: random(`y${i}`) * 1080, s: 3 + random(`s${i}`) * 5, d: random(`d${i}`) * 14,
}));
// The mark and the name sit as one group centred on the frame (measured: the name runs about 500 px past the mark).
const LOGO = { x: 521, y: 400, size: 300 };

export function Reveal() {
  const f = useCurrentFrame();
  const pop = useSpring(NAME, 12, 0.9);
  const flash = ramp(f, NAME - 2, NAME + 4) * (1 - ramp(f, NAME + 4, NAME + 30));
  const lead = ramp(f, 0, 12) * (1 - ramp(f, NAME + 30, NAME + 44));
  return (
    <Stage>
      {SPARKS.map((p, i) => {
        const t = ramp(f, p.d, NAME + p.d * 0.3, ease);
        const x = interpolate(t, [0, 1], [p.x, LOGO.x + LOGO.size / 2]);
        const y = interpolate(t, [0, 1], [p.y, LOGO.y + LOGO.size / 2]);
        return <div key={i} style={{ position: 'absolute', left: x, top: y, width: p.s, height: p.s, borderRadius: '50%', background: c.saffron, opacity: (1 - ramp(f, NAME - 2, NAME + 6)) * 0.9, boxShadow: `0 0 12px ${c.saffron}` }} />;
      })}
      <AbsoluteFill style={{ background: `radial-gradient(30% 30% at 50% 45%, rgba(255,214,140,${flash * 0.5}), transparent 70%)` }} />
      <Img src={staticFile('brand/nomi.png')} style={{ position: 'absolute', left: LOGO.x, top: LOGO.y, width: LOGO.size, height: LOGO.size, transform: `translateY(${Math.sin(f / 34) * 7}px) scale(${pop * (1 + Math.sin(f / 40) * 0.015)}) rotate(${(1 - pop) * -30 + Math.sin(f / 52) * 3}deg)` }} />
      <div style={{ position: 'absolute', left: LOGO.x + LOGO.size + 30, top: LOGO.y + 20, fontFamily: brand, fontWeight: 600, fontSize: 230, color: c.text, letterSpacing: '-0.02em', lineHeight: 1,
        opacity: ramp(f, NAME + 8, NAME + 26), transform: `translateX(${(1 - ramp(f, NAME + 8, NAME + 30)) * -40}px)`, filter: blur((1 - ramp(f, NAME + 8, NAME + 26)) * 12) }}>Nomi</div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 250, textAlign: 'center', fontFamily: display, fontSize: type.title, fontWeight: 700, color: c.sub, letterSpacing: '-0.03em', opacity: lead, transform: `translateY(${(1 - lead) * 20}px)` }}>Presenting</div>
      <Sequence from={VO_AT} layout="none"><Audio src={staticFile(V.file)} /></Sequence>
      <Words text="Every plate, the way the chef meant it." at={V.at(1)} size={type.line} weight={500} color={c.sub} stagger={2} style={{ position: 'absolute', left: 0, right: 0, top: 760, justifyContent: 'center' }} />
      <ModelRail at={V.at(2)} landing={6} />
      <Sfx name="reveal" at={NAME - 2} />
    </Stage>
  );
}
