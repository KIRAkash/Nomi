// The model log (voiceover line 14). On the phone: the app's "Under the hood" screen after real calls from two screens,
// scrolling to the list of live calls. Beside it: those calls, each with its models and how long it took.
import { useCurrentFrame } from 'remotion';

import { type Piece } from '../kit/clip';
import { DemoScene, PANEL } from '../kit/demo';
import { Mark, type Model } from '../kit/models';
import { Words, ramp } from '../kit/motion';
import { VO_AT, voice } from '../kit/vo';
import { Sfx } from '../kit/sfx';
import { c, display, type } from '../theme';

const V = voice(14);
const PIECES: Piece[] = [{ from: 0.3, to: 8.2 }];
export const LOG = V.frames;

// The two live calls in the recording, as the app listed them.
const CALLS: { what: string; models: Model[]; names: string; s: string }[] = [
  { what: 'Answered a question from the facts', models: ['wonder'], names: 'Muse Wonder', s: '13.5 s' },
  { what: 'Wrote down a voice note and read it', models: ['voice', 'spark'], names: 'Muse Voice, Muse Spark', s: '19.8 s' },
];

export function Log() {
  const f = useCurrentFrame();
  const x = PANEL.phone;
  return (
    <DemoScene kind="phone" clip="models" pieces={PIECES} vo={14} voAt={VO_AT} active={() => ['wonder', 'voice', 'spark']}>
      <div style={{ position: 'absolute', left: x, top: 120, width: 1020 }}>
        <Words text="Every model call, listed." at={6} size={type.title} />
      </div>
      <div style={{ position: 'absolute', left: x, top: 340, width: 980, display: 'flex', flexDirection: 'column', gap: 26 }}>
        {CALLS.map((k, i) => {
          const p = ramp(f, 24 + i * 12, 42 + i * 12);
          return (
            <div key={k.what} style={{ display: 'flex', alignItems: 'center', gap: 26, padding: '28px 34px', borderRadius: 26, background: c.white, boxShadow: '0 20px 50px rgba(70,50,10,0.14)',
              opacity: p, transform: `translateX(${(1 - p) * 40}px)` }}>
              <div style={{ width: 16, height: 16, borderRadius: 8, background: c.mint }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: display, fontSize: type.label + 4, fontWeight: 700, color: c.text }}>{k.what}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
                  <Mark kind="muse" size={28} />
                  <span style={{ fontFamily: display, fontSize: type.label, fontWeight: 600, color: c.sub }}>{k.names}</span>
                </div>
              </div>
              <span style={{ fontFamily: display, fontSize: type.line, fontWeight: 800, color: c.text, fontVariantNumeric: 'tabular-nums' }}>{k.s}</span>
            </div>
          );
        })}
      </div>
      {CALLS.map((k, i) => <Sfx key={k.what} name="pop" at={26 + i * 12} volume={0.16} />)}
    </DemoScene>
  );
}
