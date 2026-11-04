// The Golden Plate (voiceover line 4). On the tablet: three photos through the live camera, then SAM 3.1 on all three.
// Beside it: the photos stacking up, the plate pulled apart into the parts SAM found as the voice names them, and how a
// chef fixes a part SAM missed.
import { AbsoluteFill, Audio, Img, interpolate, Sequence, staticFile, useCurrentFrame } from 'remotion';

import taps from '../../public/clips/golden.taps.json';
import { Clip, clipFrames, sceneFrame, type Piece } from '../kit/clip';
import { Device } from '../kit/device';
import { PlateExplode } from '../kit/explode';
import { ModelLockup, ModelRail } from '../kit/models';
import { Reveal, Stage, Words, inOut, ramp } from '../kit/motion';
import { VO_AT, voice } from '../kit/vo';
import { Sfx, tapFrames } from '../kit/sfx';
import { c, display, sec, type } from '../theme';

// The recording, cut to the voice: each photo as it's taken, SAM's wait sped up so its answer lands on "in all three".
const PIECES: Piece[] = [
  { from: 2.3, to: 4.0 }, { from: 8.6, to: 9.7 }, { from: 14.7, to: 17.3 },
  { from: 17.3, to: 31.0, rate: 2.84 }, { from: 31.0, to: 38.5 },
];
// vo-4's phrases: "Next," · "the chef takes three photos…" · "SAM three point one finds each part," · "from the rice" ·
// "to the raita," · "and keeps a part" · "only if it's in all three." · "That's the Golden Plate." · "When the cooks change," ·
// "the dish stays the same."
const V = voice(4);
export const GOLDEN = Math.min(clipFrames(PIECES), V.frames);
const T = { sam: V.at(2), rice: V.at(3), allThree: V.at(6, 1.0), taps: V.at(7), same: V.at(8) };
const SHOTS = taps.taps.slice(0, 3).map((t) => sceneFrame(PIECES, t.t));
// rice, chicken, onions, lemon, raita: named in turn from "rice" to "raita"
const NAMED = [V.at(3, 0.3), V.at(3, 0.6), V.at(3, 0.9), V.at(4), V.at(4, 0.45)];

export function Golden() {
  const f = useCurrentFrame();
  const enter = ramp(f, 0, 30);
  const stackOut = ramp(f, T.sam - 4, T.sam + 16, inOut);
  const apart = ramp(f, T.sam + 10, T.rice, inOut) * (1 - ramp(f, T.taps - 20, T.taps, inOut));
  return (
    <Stage>
      <Sequence from={VO_AT} layout="none"><Audio src={staticFile(V.file)} /></Sequence>
      <AbsoluteFill style={{ left: 56, top: 128 }}>
        <div style={{ transform: `translateX(${(1 - enter) * -120}px) translateY(${Math.sin(f / 52) * 9}px)`, opacity: enter }}>
          <Device kind="tablet" width={1000} rx={5 + Math.sin(f / 71) * 1.6} ry={interpolate(enter, [0, 1], [28, 14]) + Math.sin(f / 46) * 3.2}>
            <Clip name="golden" kind="tablet" pieces={PIECES} taps={taps as never} />
          </Device>
        </div>
      </AbsoluteFill>

      <div style={{ position: 'absolute', left: 1140, top: 120, width: 720 }}>
        <Words text="Three photos." at={8} out={T.sam - 8} size={type.title} />
        <Reveal at={20} out={T.sam - 8} style={{ marginTop: 18 }}>
          <span style={{ fontFamily: display, fontSize: type.line, fontWeight: 500, color: c.sub, letterSpacing: '-0.02em' }}>Same plate, same spot.</span>
        </Reveal>
      </div>
      <div style={{ position: 'absolute', left: 1180, top: 420, width: 600, height: 420, perspective: 1600, opacity: 1 - stackOut }}>
        {SHOTS.map((s, i) => {
          const p = ramp(f, s, s + 16);
          return (
            <Img key={i} src={staticFile(`media/golden-${i + 1}.jpg`)} style={{
              position: 'absolute', left: i * 46, top: i * 40, width: 470, height: 264, objectFit: 'cover', borderRadius: 18, boxShadow: '0 24px 50px rgba(70,50,10,0.24)',
              opacity: p, transform: `translateY(${(1 - p) * -60}px) rotateX(${(1 - p) * 30}deg) rotate(${(i - 1) * 3}deg) scale(${1.08 - 0.08 * p})`,
            }} />
          );
        })}
      </div>

      <div style={{ position: 'absolute', left: 1140, top: 120 }}>
        <ModelLockup model="sam" doing="Finding each part, in each photo" at={T.sam} out={T.allThree - 10} />
      </div>
      <div style={{ position: 'absolute', left: 1120, top: 120, width: 790 }}>
        <Words text="In all three." at={T.allThree} out={T.taps - 16} size={type.title} accent={['all', 'three']} style={{ position: 'absolute', top: 0, width: 790 }} />
        <Words text="That's the Golden Plate." at={T.taps} out={T.same - 14} size={type.title} accent={['Golden', 'Plate.']} style={{ position: 'absolute', top: 0, width: 790 }} />
        <Words text="Same dish, whoever cooks." at={T.same} size={type.title} accent={['whoever', 'cooks.']} style={{ position: 'absolute', top: 0, width: 790 }} />
      </div>
      <div style={{ position: 'absolute', left: 1120, top: 440, opacity: ramp(f, T.sam + 12, T.sam + 30) }}>
        <PlateExplode d={360} lift={0.12} p={apart} spin={-90 + f * 0.1} labelsAt={NAMED} checksAt={T.allThree} />
      </div>

      <ModelRail active={f >= T.sam ? ['sam'] : []} at={-200} idle="dim" />
      <Sfx name="pop" at={T.allThree + 6} />
      {tapFrames('golden', PIECES, { golden: taps as never }).map((at, i) => <Sfx key={i} name="tap" at={at} />)}
    </Stage>
  );
}
