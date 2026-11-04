// The close (voiceover line 10). Nomi's two rules as large type, the chef's plate returning exactly as it was designed,
// then the end card: Nomi, built on Meta's six models, on the web and Android, and the team.
import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame } from 'remotion';

import { CREDITS } from '../credits';
import { DrawnPlate, GOLDEN } from '../kit/drawn';
import { MODELS, Mark } from '../kit/models';
import { Reveal, Stage, Words, inOut, ramp, useSpring } from '../kit/motion';
import { VO_AT, voice } from '../kit/vo';
import { Sfx } from '../kit/sfx';
import { brand, c, display, sec, type } from '../theme';

// vo-15's phrases: "Nomi reports only what it can see," · "count or hear," · "and a person approves…" · "Every plate," ·
// "the way the chef meant it."
const V = voice(15);
const T = { facts: V.at(0), people: V.at(2), plate: V.at(3) - 8, meant: V.at(4), card: V.end + 6 };
export const CLOSE = T.card + sec(3.2);

export function Close() {
  const f = useCurrentFrame();
  const plateIn = ramp(f, T.plate - 6, T.plate + 30);
  const toCard = ramp(f, T.card - 10, T.card + 20, inOut);
  const d = 520 - toCard * 280;
  const px = 960 + toCard * -620, py = 420;
  const pop = useSpring(T.card + 6, 14);
  return (
    <Stage>
      <Sequence from={VO_AT} layout="none"><Audio src={staticFile(V.file)} /></Sequence>
      <Words text="It reports what it can see, count or hear." at={T.facts} out={T.people - 10} size={type.headline} style={{ position: 'absolute', left: 160, right: 160, top: 380, justifyContent: 'center', textAlign: 'center' }} />
      <Words text="A person approves every reply and order." at={T.people} out={T.plate - 12} size={type.headline} accent={['person']} style={{ position: 'absolute', left: 160, right: 160, top: 430, justifyContent: 'center' }} />

      {/* the chef's plate, back exactly as designed */}
      <DrawnPlate spec={GOLDEN} raita x={px} y={py} d={d} style={{
        opacity: plateIn * (1 - toCard), filter: `blur(${(1 - plateIn) * 16}px)`,
        transform: `scale(${1.15 - plateIn * 0.15}) rotate(${-90 + f * 0.04}deg)`,
      }} />
      <Words text="Every plate," at={T.plate + 6} out={T.card - 12} size={type.headline} style={{ position: 'absolute', left: 0, right: 0, top: 780, justifyContent: 'center' }} />
      <Words text="the way the chef meant it." at={T.meant} out={T.card - 12} size={type.headline} accent={['meant']} style={{ position: 'absolute', left: 0, right: 0, top: 900, justifyContent: 'center' }} />

      {/* the end card */}
      <AbsoluteFill style={{ opacity: toCard }}>
        <div style={{ position: 'absolute', left: 170, top: 190, display: 'flex', alignItems: 'center', gap: 34 }}>
          <Img src={staticFile('brand/nomi.png')} style={{ width: 220, height: 220, transform: `scale(${pop})` }} />
          <span style={{ fontFamily: brand, fontWeight: 600, fontSize: 200, color: c.text, lineHeight: 1 }}>Nomi</span>
        </div>
        <Reveal at={T.card + 14} style={{ position: 'absolute', left: 170, top: 470 }}>
          <span style={{ fontFamily: display, fontSize: type.title, fontWeight: 800, color: c.text, letterSpacing: '-0.035em' }}>On the web and Android.</span>
        </Reveal>
        <Reveal at={T.card + 20} style={{ position: 'absolute', left: 170, top: 590, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ fontFamily: display, fontSize: type.label + 4, fontWeight: 600, color: c.sub }}>{CREDITS.web}</span>
          <span style={{ fontFamily: display, fontSize: type.label + 4, fontWeight: 600, color: c.sub }}>{CREDITS.apk}</span>
        </Reveal>

        <Reveal at={T.card + 26} style={{ position: 'absolute', right: 80, top: 200, width: 690, display: 'flex', flexDirection: 'column', gap: 30 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Img src={staticFile('brand/meta.svg')} style={{ width: 96, height: 64, objectFit: 'contain' }} />
            <span style={{ fontFamily: display, fontSize: type.title, fontWeight: 800, color: c.text, letterSpacing: '-0.035em' }}>Built on Meta</span>
          </div>
          {MODELS.map((m, i) => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 18, opacity: ramp(f, T.card + 32 + i * 4, T.card + 46 + i * 4) }}>
              <Mark kind={m.mark} size={40} />
              <span style={{ fontFamily: display, fontSize: type.label + 6, fontWeight: 700, color: c.text }}>{m.name}</span>
            </div>
          ))}
        </Reveal>

        <Reveal at={T.card + 40} style={{ position: 'absolute', left: 170, bottom: 120, display: 'flex', alignItems: 'center', gap: 26 }}>
          <span style={{ fontFamily: display, fontSize: type.label + 6, fontWeight: 700, color: c.saffron }}>{CREDITS.team}</span>
          {CREDITS.people.map((p) => (
            <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {p.photo
                ? <Img src={staticFile(p.photo)} style={{ width: 72, height: 72, borderRadius: 36, objectFit: 'cover' }} />
                : <div style={{ width: 72, height: 72, borderRadius: 36, background: c.ink, border: `3px solid ${c.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: display, fontSize: 30, fontWeight: 800, color: c.white }}>{p.name[0]}</div>}
              <span style={{ fontFamily: display, fontSize: type.label + 6, fontWeight: 600, color: c.text }}>{p.name}</span>
            </div>
          ))}
        </Reveal>
      </AbsoluteFill>
      <Sfx name="card" at={T.card + 6} />
    </Stage>
  );
}
