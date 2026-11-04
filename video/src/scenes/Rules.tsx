// The rules (voiceover line 5). On the tablet: the chef holds to talk in Hindi, Muse Voice writes it down, Spark turns it
// into checks, Muse Image draws the plating card. Beside it: the voice as a waveform, the words it became, the checks,
// and the card assembling from the Golden Plate photo and those checks.
import { Img, random, staticFile, useCurrentFrame } from 'remotion';

import taps from '../../public/clips/rules.taps.json';
import { clipFrames, type Piece } from '../kit/clip';
import { DemoScene, PANEL } from '../kit/demo';
import { ModelLockup } from '../kit/models';
import { Words, inOut, ramp } from '../kit/motion';
import { VO_AT, voice } from '../kit/vo';
import { c, display, sec, type } from '../theme';

// Holding to talk, the transcription and rules arriving (waits cut), Keep, the card arriving.
const PIECES: Piece[] = [
  { from: 1.2, to: 3.6 }, { from: 13.1, to: 34.0, rate: 25 }, { from: 34.0, to: 36.6 },
  { from: 38.2, to: 38.9 }, { from: 38.9, to: 51.6, rate: 12 }, { from: 51.6, to: 55.6 },
];

// vo-5's phrases: "The chef says the plating rules out loud," · "in Hindi." · "Muse Voice writes them down," ·
// "Muse Spark turns them into eight checks," · "and Muse Image draws the card…"
const V = voice(5);
// The scene ends about half a second after its voice.
export const RULES = Math.min(clipFrames(PIECES), V.frames);
const T = { voice: V.at(2), spark: V.at(3), image: V.at(4) };

// What the live run heard and made of it (shown in the clip).
const HEARD = 'चावल बीच में रखो, चार पीस ऊपर फैला के…';
const CHECKS = ['Rice in the middle', 'Four chicken pieces on top', 'Onions at 2 o’clock', 'Lemon on the rim, 5 o’clock'];

export function Rules() {
  const f = useCurrentFrame();
  const x = PANEL.tablet;
  const toCard = ramp(f, T.image - 6, T.image + 18, inOut);
  return (
    <DemoScene kind="tablet" clip="rules" pieces={PIECES} taps={taps} vo={5} voAt={VO_AT}
      active={(fr) => (fr >= T.image ? ['image'] : fr >= T.spark ? ['spark'] : fr >= T.voice ? ['voice'] : [])}>
      <div style={{ position: 'absolute', left: x, top: 120, width: 740 }}>
        <Words text="Said out loud." at={6} out={T.voice - 10} size={type.title} />
        <div style={{ position: 'absolute', top: 0 }}><ModelLockup model="voice" doing="Writing down what the chef said" at={T.voice} out={T.spark - 10} /></div>
        <div style={{ position: 'absolute', top: 0 }}><ModelLockup model="spark" doing="Turning it into checks" at={T.spark} out={T.image - 10} /></div>
        <div style={{ position: 'absolute', top: 0 }}><ModelLockup model="image" doing="Drawing the plating card" at={T.image} /></div>
      </div>

      {/* the voice: bars that move while the chef talks, then settle into the words */}
      <div style={{ position: 'absolute', left: x, top: 380, display: 'flex', alignItems: 'center', gap: 7, height: 140, opacity: 1 - ramp(f, T.spark - 8, T.spark + 6) }}>
        {Array.from({ length: 46 }, (_, i) => {
          const live = 1 - ramp(f, T.voice, T.voice + 20);
          const h = 14 + live * Math.abs(Math.sin(f / 4 + i * 0.7) * Math.sin(f / 9 + i * 0.31)) * 120 * (0.4 + random(`b${i}`) * 0.6);
          return <div key={i} style={{ width: 8, height: h, borderRadius: 4, background: i / 46 < ramp(f, 4, T.voice) ? c.tomato : c.line }} />;
        })}
      </div>
      <div style={{ position: 'absolute', left: x, top: 560, width: 740, fontFamily: display, fontSize: type.line - 6, fontWeight: 500, color: c.text, lineHeight: 1.3,
        opacity: ramp(f, T.voice + 6, T.voice + 24) * (1 - ramp(f, T.spark - 8, T.spark + 6)), clipPath: `inset(0 ${100 - ramp(f, T.voice + 6, T.voice + 40) * 100}% 0 0)` }}>
        “{HEARD}”
      </div>

      {/* the checks */}
      <div style={{ position: 'absolute', left: x, top: 350, opacity: 1 - toCard }}>
        {CHECKS.map((t, i) => {
          const q = ramp(f, T.spark + 6 + i * 6, T.spark + 22 + i * 6);
          return (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24, opacity: q, transform: `translateX(${(1 - q) * 60}px)` }}>
              <svg width={40} height={40} viewBox="0 0 34 34"><path d="M8 18l6 6 12-14" fill="none" stroke={c.mint} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={40} strokeDashoffset={40 * (1 - q)} /></svg>
              <span style={{ fontFamily: display, fontSize: type.line - 4, fontWeight: 600, color: c.text, letterSpacing: '-0.02em' }}>{t}</span>
            </div>
          );
        })}
      </div>

      {/* the card: the Golden Plate photo drops in, the checks become its numbered steps */}
      <div style={{ position: 'absolute', left: x + 40, top: 320, width: 560, padding: 28, borderRadius: 26, background: c.white, opacity: toCard,
        transform: `perspective(1600px) rotateY(${(1 - toCard) * -30 - 6}deg) translateY(${(1 - toCard) * 40}px)`, boxShadow: '0 40px 80px rgba(70,50,10,0.24)' }}>
        <Img src={staticFile('media/golden-1.jpg')} style={{ width: '100%', height: 230, objectFit: 'cover', borderRadius: 16, opacity: ramp(f, T.image + 8, T.image + 22) }} />
        {CHECKS.map((t, i) => {
          const q = ramp(f, T.image + 18 + i * 5, T.image + 30 + i * 5);
          return (
            <div key={t} style={{ display: 'flex', gap: 16, alignItems: 'baseline', marginTop: 14, opacity: q }}>
              <span style={{ fontFamily: display, fontSize: type.label, fontWeight: 800, color: c.saffron }}>{i + 1}</span>
              <span style={{ fontFamily: display, fontSize: type.label, fontWeight: 600, color: c.ink, letterSpacing: '-0.02em' }}>{t}</span>
            </div>
          );
        })}
      </div>
    </DemoScene>
  );
}
