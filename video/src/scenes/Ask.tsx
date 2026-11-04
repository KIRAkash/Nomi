// Ask Nomi (voiceover line 13). On the phone: the owner asks how much biryani will sell on Saturday; Muse Wonder declines
// to forecast and gives the counts it has. Beside it: the question, the refusal, and those daily counts as bars.
import { useCurrentFrame } from 'remotion';

import taps from '../../public/clips/ask.taps.json';
import { type Piece } from '../kit/clip';
import { DemoScene, PANEL } from '../kit/demo';
import { Words, ease, inOut, ramp } from '../kit/motion';
import { VO_AT, voice } from '../kit/vo';
import { c, display, type } from '../theme';

const V = voice(13);
// Typing the question and Ask; the wait sped up; the answer.
const PIECES: Piece[] = [{ from: 3.0, to: 5.6 }, { from: 5.6, to: 16.6, rate: 16 }, { from: 16.6, to: 30 }];
export const ASK = V.frames;
// vo-13's phrases: "Asked how much biryani will sell on Saturday," · "Ask Nomi says it can't forecast that," · "and shows…"
const T = { asked: V.at(0), refused: V.at(1), counts: V.at(2) };

// Chicken Biryani picks per day this week, as the live answer gave them.
const PICKS = [5, 6, 4, 6, 5, 6, 9];

export function Ask() {
  const f = useCurrentFrame();
  const x = PANEL.phone;
  const qOut = ramp(f, T.counts - 8, T.counts + 8, inOut);
  return (
    <DemoScene kind="phone" clip="ask" pieces={PIECES} taps={taps} vo={13} voAt={VO_AT} active={(fr) => (fr >= T.asked ? ['wonder'] : [])}>
      <div style={{ position: 'absolute', left: x, top: 120, width: 1020 }}>
        <Words text="It won't guess." at={6} size={type.title} accent={['guess.']} />
      </div>
      <div style={{ position: 'absolute', left: x, top: 330, width: 980, opacity: ramp(f, T.asked - 4, T.asked + 10) * (1 - qOut) }}>
        <div style={{ display: 'inline-block', background: c.ink, color: c.white, borderRadius: 30, padding: '26px 34px', fontFamily: display, fontSize: type.line - 6, fontWeight: 600, letterSpacing: '-0.02em' }}>
          How much biryani will we sell on Saturday?
        </div>
        <div style={{ marginTop: 40, fontFamily: display, fontSize: type.line, fontWeight: 700, color: c.text, opacity: ramp(f, T.refused, T.refused + 14) }}>
          It can't forecast a future sale.
        </div>
      </div>
      <div style={{ position: 'absolute', left: x, top: 330, width: 980, opacity: ramp(f, T.counts, T.counts + 12) }}>
        <div style={{ fontFamily: display, fontSize: type.line - 6, fontWeight: 700, color: c.text, marginBottom: 30 }}>Chicken Biryani picks, each day this week</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 26, height: 300 }}>
          {PICKS.map((n, i) => {
            const p = ramp(f, T.counts + 6 + i * 4, T.counts + 26 + i * 4, ease);
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <span style={{ fontFamily: display, fontSize: type.label + 4, fontWeight: 800, color: c.text, opacity: p }}>{n}</span>
                <div style={{ width: 90, height: n * 28 * p, borderRadius: 12, background: i === PICKS.length - 1 ? c.saffron : c.line }} />
              </div>
            );
          })}
        </div>
      </div>
    </DemoScene>
  );
}
