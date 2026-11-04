// The close (voiceover line 10). Nomi's two rules as large type, the chef's plate returning exactly as it was designed,
// then the end card: Nomi, built on Meta's six models, on the web and Android, and the team.
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from 'remotion';

import { CREDITS } from '../credits';
import { DrawnPlate, GOLDEN } from '../kit/drawn';
import { MODELS, Mark } from '../kit/models';
import { blur, Reveal, Stage, Words, inOut, ramp, useSpring } from '../kit/motion';
import { VO_AT, voice } from '../kit/vo';
import { Sfx } from '../kit/sfx';
import { brand, c, display, sec, type } from '../theme';

// vo-15's phrases: "Nomi reports only what it can see," · "count or hear," · "and a person approves…" · "Every plate," ·
// "the way the chef meant it."
const V = voice(15);
const T = { facts: V.at(0), people: V.at(2), plate: V.at(3) - 8, meant: V.at(4), card: V.end };
// Akash speaks once the whole card is on screen, and the film ends just after his line.
export const ME_AT = T.card + 34;
export const CLOSE = ME_AT + sec(CREDITS.clip.to - CREDITS.clip.from) + 8;

export function Close() {
  const f = useCurrentFrame();
  const plateIn = ramp(f, T.plate - 6, T.plate + 30);
  const toCard = ramp(f, T.card - 10, T.card + 20, inOut);
  const d = 520 - toCard * 280;
  const px = 960 + toCard * -620, py = 420;
  const pop = useSpring(T.card + 6, 14);
  const me = ramp(f, T.card + 14, T.card + 32);
  return (
    <Stage>
      <Sequence from={VO_AT} layout="none"><Audio src={staticFile(V.file)} /></Sequence>
      <Words text="It reports what it can see, count or hear." at={T.facts} out={T.people - 10} size={type.headline} style={{ position: 'absolute', left: 160, right: 160, top: 380, justifyContent: 'center', textAlign: 'center' }} />
      <Words text="A person approves every reply and order." at={T.people} out={T.plate - 12} size={type.headline} accent={['person']} style={{ position: 'absolute', left: 160, right: 160, top: 430, justifyContent: 'center' }} />

      {/* the chef's plate, back exactly as designed */}
      <DrawnPlate spec={GOLDEN} raita x={px} y={py} d={d} style={{
        opacity: plateIn * (1 - toCard), filter: blur((1 - plateIn) * 16),
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
        <Reveal at={T.card + 8} style={{ position: 'absolute', left: 170, top: 470 }}>
          <span style={{ fontFamily: display, fontSize: type.title, fontWeight: 800, color: c.text, letterSpacing: '-0.035em' }}>On the web and Android.</span>
        </Reveal>
        <Reveal at={T.card + 12} style={{ position: 'absolute', left: 170, top: 590, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[['Web', CREDITS.web], ['Android', CREDITS.apk]].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'baseline', gap: 20 }}>
              <span style={{ width: 170, fontFamily: display, fontSize: type.label + 4, fontWeight: 600, color: c.sub }}>{k}</span>
              <span style={{ fontFamily: display, fontSize: type.label + 10, fontWeight: 800, color: k === 'Web' ? c.saffron : c.text, letterSpacing: '-0.02em' }}>{v}</span>
            </div>
          ))}
        </Reveal>

        <Reveal at={T.card + 10} style={{ position: 'absolute', right: 80, top: 200, width: 690, display: 'flex', flexDirection: 'column', gap: 30 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Img src={staticFile('brand/meta.svg')} style={{ width: 96, height: 64, objectFit: 'contain' }} />
            <span style={{ fontFamily: display, fontSize: type.title, fontWeight: 800, color: c.text, letterSpacing: '-0.035em' }}>Built on Meta</span>
          </div>
          {MODELS.map((m, i) => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 18, opacity: ramp(f, T.card + 12 + i * 2, T.card + 22 + i * 2) }}>
              <Mark kind={m.mark} size={40} />
              <span style={{ fontFamily: display, fontSize: type.label + 6, fontWeight: 700, color: c.text }}>{m.name}</span>
            </div>
          ))}
        </Reveal>

        {/* Akash, in a circle in the corner: the circle lands with the card, and he speaks once everything is on screen */}
        <div style={{ position: 'absolute', left: 170, bottom: 80, display: 'flex', alignItems: 'center', gap: 34, opacity: me, transform: `translateY(${(1 - me) * 30}px)` }}>
          <div style={{ width: 220, height: 220, borderRadius: 110, overflow: 'hidden', border: `6px solid ${c.white}`, boxShadow: `0 0 0 4px ${c.saffron}, 0 24px 50px rgba(70,50,10,0.24)`, background: c.paper }}>
            <Sequence from={ME_AT} layout="none">
              <OffthreadVideo src={staticFile(CREDITS.clip.src)} startFrom={sec(CREDITS.clip.from)} style={{ width: 220, height: 220, objectFit: 'cover', objectPosition: '50% 30%' }} />
            </Sequence>
            {f < ME_AT && <Img src={staticFile('me/akash-still.jpg')} style={{ width: 220, height: 220, objectFit: 'cover', objectPosition: '50% 30%' }} />}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontFamily: display, fontSize: type.line, fontWeight: 800, color: c.text, letterSpacing: '-0.02em' }}>{CREDITS.project}</span>
            <span style={{ fontFamily: display, fontSize: type.label + 6, fontWeight: 600, color: c.sub }}>{CREDITS.by}</span>
          </div>
        </div>
      </AbsoluteFill>
      <Sfx name="card" at={T.card + 6} />
    </Stage>
  );
}
