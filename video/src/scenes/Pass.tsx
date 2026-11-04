// The pass (voiceover line 6). On the tablet: the mounted camera sees a plate arrive, the cook taps the ticket, and the
// live check runs (SAM 3.1, then the score against the Golden Plate) to the amber nudge. Beside it: Glimmer's job, frames
// passing a gate where only plates go through and faces are blurred; then the plate against its Golden Plate, and the
// missing part.
import { Img, interpolate, staticFile, useCurrentFrame } from 'remotion';

import taps from '../../public/clips/pass.taps.json';
import { clipFrames, type Piece } from '../kit/clip';
import { DemoScene, PANEL } from '../kit/demo';
import { ModelLockup } from '../kit/models';
import { Reveal, Words, inOut, ramp } from '../kit/motion';
import { VO_AT, voice } from '../kit/vo';
import { c, display, sec, type } from '../theme';

// The plate arriving; the check running a little slower than life so its answer lands on "the fried onions are missing".
const PIECES: Piece[] = [{ from: 0.9, to: 3.4 }, { from: 3.4, to: 12.5, rate: 0.82 }, { from: 12.5, to: 17.8 }];

// vo-6's phrases: "During service," · "a camera at the pass…" · "Glimmer is built to run…" · "keeping only frames…" ·
// "so faces stay…" · "SAM three point one compares…" · "The fried onions are missing," · "so the cook gets a reminder…"
const V = voice(6);
export const PASS = Math.min(clipFrames(PIECES), V.frames);
const T = { glimmer: V.at(2), offline: V.at(3, 0.6), sam: V.at(5), missing: V.at(6), nudge: V.at(7) };

const FRAMES = [
  { src: 'frame-empty', keep: false },
  { src: 'frame-hands', keep: false },
  { src: 'frame-blur', keep: false },
  { src: 'frame-face', keep: true, face: true },
];
// The onions in the Golden Plate photo (from its SAM 3.1 run), in a 1280 × 853 frame.
const ONIONS = [770, 210];

export function Pass() {
  const f = useCurrentFrame();
  const x = PANEL.tablet;
  const gateOut = ramp(f, T.sam - 10, T.sam + 8, inOut);
  return (
    <DemoScene kind="tablet" clip="pass" pieces={PIECES} taps={taps} vo={6} voAt={VO_AT}
      active={(fr) => (fr >= T.sam ? ['sam'] : fr >= T.glimmer ? ['glimmer'] : [])}>
      <div style={{ position: 'absolute', left: x, top: 120, width: 760 }}>
        <Words text="Every plate, checked." at={6} out={T.glimmer - 10} size={type.title} />
        <div style={{ position: 'absolute', top: 0 }}><ModelLockup model="glimmer" doing="Keeps only frames with a plate" at={T.glimmer} out={T.sam - 10} /></div>
        <div style={{ position: 'absolute', top: 0 }}><ModelLockup model="sam" doing="Against the Golden Plate" at={T.sam} out={T.missing - 8} /></div>
        <Words text="No fried onions." at={T.missing} size={type.title} accent={['onions.']} style={{ width: 700 }} />
        <Reveal at={T.offline} out={T.sam - 10} style={{ position: 'absolute', top: 690, width: 760 }}>
          <span style={{ fontFamily: display, fontSize: type.line, fontWeight: 500, color: c.sub, letterSpacing: '-0.02em' }}>It isn't running on this laptop.</span>
        </Reveal>
        <Reveal at={T.nudge} style={{ position: 'absolute', top: 690, width: 760 }}>
          <span style={{ fontFamily: display, fontSize: type.line, fontWeight: 500, color: c.sub, letterSpacing: '-0.02em' }}>The cook sees it before the plate goes out.</span>
        </Reveal>
      </div>

      {/* Glimmer's gate: frames slide in; empty, busy and blurred ones drop away, the plate goes through with faces blurred */}
      <div style={{ position: 'absolute', left: x, top: 360, width: 740, height: 420, opacity: ramp(f, T.glimmer, T.glimmer + 16) * (1 - gateOut) }}>
        <div style={{ position: 'absolute', left: 360, top: 0, bottom: 40, width: 4, borderRadius: 2, background: c.saffron, boxShadow: `0 0 24px ${c.saffron}` }} />
        {FRAMES.map((fr, i) => {
          const start = T.glimmer + 10 + i * 42;
          const move = ramp(f, start, start + 30, inOut);
          const drop = fr.keep ? 0 : ramp(f, start + 30, start + 46, inOut);
          const through = fr.keep ? ramp(f, start + 30, start + 56, inOut) : 0;
          const blur = fr.face ? ramp(f, start + 26, start + 40) : 0; // the pre-blurred face fades in over the sharp one
          return (
            <div key={fr.src} style={{ position: 'absolute', left: interpolate(move, [0, 1], [-60, 150]) + through * 330, top: 40 + drop * 260, width: 300, height: 200,
              opacity: (move > 0 ? 1 : 0) * (1 - drop) * (1 - ramp(f, start + 90, start + 110)), transform: `rotate(${drop * 8}deg)` }}>
              <Img src={staticFile(`media/${fr.src}.jpg`)} style={{ width: 300, height: 200, objectFit: 'cover', borderRadius: 14, boxShadow: '0 20px 40px rgba(70,50,10,0.24)',
                outline: through > 0 ? `4px solid ${c.mint}` : 'none' }} />
              {/* the face, blurred where it sits in the frame (top right) */}
              {fr.face && <Img src={staticFile('media/frame-face-blurred.jpg')} style={{ position: 'absolute', inset: 0, width: 300, height: 200, objectFit: 'cover', borderRadius: 14, opacity: blur, clipPath: 'inset(0 0 134px 150px round 0 14px 30px 30px)' }} />}
            </div>
          );
        })}
      </div>

      {/* the plate against its Golden Plate: a divider wipes between them, then the missing part lights up */}
      <Compare at={T.sam} missing={T.missing} style={{ position: 'absolute', left: x, top: 380 }} />
    </DemoScene>
  );
}

function Compare({ at: a, missing, style }: { at: number; missing: number; style: React.CSSProperties }) {
  const f = useCurrentFrame();
  const w = 600, h = 380;
  const p = ramp(f, a, a + 18);
  const wipe = interpolate(f, [a + 10, a + 50, a + 80], [1, 0, 0.5], { easing: inOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const ring = ramp(f, missing, missing + 16);
  const k = w / 1280;
  const ox = ONIONS[0] * k, oy = ONIONS[1] * k - (853 * k - h) / 2;
  return (
    <div style={{ ...style, width: w, height: h, borderRadius: 22, overflow: 'hidden', opacity: p, boxShadow: '0 30px 70px rgba(70,50,10,0.24)', transform: `scale(${0.96 + 0.04 * p})` }}>
      <Img src={staticFile('media/pass-plate.jpg')} style={{ position: 'absolute', width: w, height: h, objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)` }}>
        <Img src={staticFile('media/golden-ref.jpg')} style={{ position: 'absolute', width: w, height: h, objectFit: 'cover' }} />
      </div>
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: wipe * w - 2, width: 4, background: c.white, opacity: wipe > 0.01 && wipe < 0.99 ? 1 : 0 }} />
      <span style={{ position: 'absolute', left: 22, top: 18, fontFamily: display, fontSize: type.label, fontWeight: 700, color: c.white, textShadow: '0 2px 12px rgba(0,0,0,0.7)', opacity: wipe > 0.15 ? 1 : 0 }}>Golden Plate</span>
      <span style={{ position: 'absolute', right: 22, top: 18, fontFamily: display, fontSize: type.label, fontWeight: 700, color: c.white, textShadow: '0 2px 12px rgba(0,0,0,0.7)', opacity: wipe < 0.85 ? 1 : 0 }}>This plate</span>
      <div style={{ position: 'absolute', left: ox - 50 - ring * 8, top: oy - 50 - ring * 8, width: 100 + ring * 16, height: 100 + ring * 16, borderRadius: '50%',
        border: `5px dashed ${c.saffron}`, opacity: ring, boxShadow: `0 0 30px ${c.saffron}` }} />
    </div>
  );
}
