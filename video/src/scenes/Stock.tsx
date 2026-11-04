// Stock (voiceover line 10). On the phone: the manager photographs a shelf, SAM 3.1 boxes every whole item it can see, and
// the count lands in tonight's stock, where oil falls under its minimum and goes on a draft order. Beside it: the count
// drawn as boxes, then a close-up of the draft order from the recording.
import { useCurrentFrame } from 'remotion';

import taps from '../../public/clips/larder.taps.json';
import { Zoom, type Piece } from '../kit/clip';
import { DemoScene, PANEL } from '../kit/demo';
import { ModelLockup } from '../kit/models';
import { Words, ease, inOut, ramp } from '../kit/motion';
import { VO_AT, voice } from '../kit/vo';
import { Sfx } from '../kit/sfx';
import { c, display, type } from '../theme';

const V = voice(10);
// Camera, shot and Count; SAM's wait sped up; the boxes; then down to the draft order.
const PIECES: Piece[] = [{ from: 1.6, to: 5.4 }, { from: 5.4, to: 10.6, rate: 4 }, { from: 10.6, to: 14.0 }, { from: 14.0, to: 30.0 }];
export const STOCK = V.frames;
// vo-10's phrases: "Stock works the same way." · "From a shelf photo," · "SAM three point one puts a box on each item:" ·
// "two oil tins, and two bags of atta." · "Two tins is under the minimum of three," · "so oil goes on a draft order…"
const T = { sam: V.at(2), counts: V.at(3), order: V.at(4) };

// What SAM 3.1 counted on the shelf in the live run.
const COUNTED = [{ n: 2, item: 'oil tins', colour: c.sky }, { n: 2, item: 'atta bags', colour: c.saffron }];

export function Stock() {
  const f = useCurrentFrame();
  const x = PANEL.phone;
  const countsOut = ramp(f, T.order - 8, T.order + 8, inOut);
  return (
    <DemoScene kind="phone" clip="larder" pieces={PIECES} taps={taps} vo={10} voAt={VO_AT}
      active={(fr) => (fr >= T.sam && fr < T.order ? ['sam'] : [])}>
      <div style={{ position: 'absolute', left: x, top: 120, width: 1020 }}>
        <Words text="Stock, from one photo." at={6} out={T.sam - 8} size={type.title} />
        <div style={{ position: 'absolute', top: 0 }}><ModelLockup model="sam" doing="A box on each item it can see" at={T.sam} out={T.order - 10} /></div>
        <Words text="Oil is under its minimum." at={T.order} size={type.title} accent={['minimum.']} style={{ position: 'absolute', top: 0 }} />
      </div>

      {/* the count, drawn as the boxes SAM put on the shelf */}
      <div style={{ position: 'absolute', left: x, top: 380, display: 'flex', gap: 90, opacity: ramp(f, T.counts - 4, T.counts + 10) * (1 - countsOut) }}>
        {COUNTED.map((k, i) => (
          <div key={k.item} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <div style={{ display: 'flex', gap: 18 }}>
              {Array.from({ length: k.n }, (_, j) => {
                const p = ramp(f, T.counts + i * 10 + j * 6, T.counts + i * 10 + j * 6 + 16, ease);
                return (
                  <svg key={j} width={130} height={150} viewBox="0 0 130 150">
                    <rect x={4} y={4} width={122} height={142} rx={10} fill={`${k.colour}22`} stroke={k.colour} strokeWidth={5} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - p} />
                    <circle cx={24} cy={24} r={15} fill={k.colour} opacity={p} />
                    <text x={24} y={30} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={18} fill={c.white} opacity={p}>{j + 1}</text>
                  </svg>
                );
              })}
            </div>
            <div style={{ fontFamily: display, fontSize: type.line, fontWeight: 800, color: c.text, letterSpacing: '-0.02em', opacity: ramp(f, T.counts + 16 + i * 10, T.counts + 30 + i * 10) }}>
              {k.n} {k.item}
            </div>
          </div>
        ))}
      </div>

      {/* the draft order, read off the phone */}
      <div style={{ position: 'absolute', left: x, top: 330, opacity: ramp(f, T.order + 4, T.order + 18) }}>
        <Zoom name="larder" kind="phone" pieces={PIECES} region={[16, 422, 380, 196]} width={1000} />
        <div style={{ marginTop: 30, fontFamily: display, fontSize: type.label + 4, fontWeight: 600, color: c.sub }}>A draft: the manager approves it before it's sent.</div>
      </div>
      {COUNTED.flatMap((k, i) => Array.from({ length: k.n }, (_, j) => <Sfx key={`${i}${j}`} name="pop" at={T.counts + i * 10 + j * 6 + 6} volume={0.15} />))}
    </DemoScene>
  );
}
