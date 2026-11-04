// The handover (voiceover line 11). On the phone: a cook holds to talk at the end of the shift; Muse Voice writes it down
// and Muse Spark sorts it for the next shift. Beside it: what the live run sorted it into.
import { useCurrentFrame } from 'remotion';

import taps from '../../public/clips/handover.taps.json';
import { type Piece } from '../kit/clip';
import { DemoScene, PANEL } from '../kit/demo';
import { ModelLockup } from '../kit/models';
import { Words, ramp } from '../kit/motion';
import { VO_AT, voice } from '../kit/vo';
import { Sfx } from '../kit/sfx';
import { c, display, type } from '../theme';

const V = voice(11);
// Holding to talk; the rest of the 14 s note and the model's wait run fast; the new handover card.
const PIECES: Piece[] = [{ from: 1.6, to: 4.6 }, { from: 4.6, to: 15.9, rate: 8 }, { from: 15.9, to: 43.4, rate: 9 }, { from: 43.4, to: 50.6 }];
export const HANDOVER = V.frames;
// vo-11's phrases: "At the end of a shift," · "the team records a spoken handover." · "Muse Voice writes it down, and Muse
// Spark sorts it into" · "done, pending and problems."
const T = { voice: V.at(2), spark: V.at(2, 1.7), sorted: V.at(3) };

// The live run's sorting of the recorded handover.
const SORTED = [
  { head: 'Done', tone: c.mint, items: ['Lunch shift done', 'Marinade ready, two trays'] },
  { head: 'Pending', tone: c.saffron, items: ['Handi three is on dum', 'Grind fresh mint chutney'] },
  { head: 'Problems', tone: c.tomato, items: ['Out of mint chutney', 'Gas pressure was low'] },
];

export function Handover() {
  const f = useCurrentFrame();
  const x = PANEL.phone;
  return (
    <DemoScene kind="phone" clip="handover" pieces={PIECES} taps={taps} vo={11} voAt={VO_AT}
      active={(fr) => (fr >= T.spark ? ['spark'] : fr >= T.voice ? ['voice'] : [])}>
      <div style={{ position: 'absolute', left: x, top: 120, width: 1020 }}>
        <Words text="End of shift." at={6} out={T.voice - 8} size={type.title} />
        <div style={{ position: 'absolute', top: 0 }}><ModelLockup model="voice" doing="Writing the handover down" at={T.voice} out={T.spark - 10} /></div>
        <div style={{ position: 'absolute', top: 0 }}><ModelLockup model="spark" doing="Sorting it for the next shift" at={T.spark} /></div>
      </div>
      <div style={{ position: 'absolute', left: x, top: 380, display: 'flex', gap: 56 }}>
        {SORTED.map((col, i) => {
          const p = ramp(f, T.sorted - 6 + i * 8, T.sorted + 12 + i * 8);
          return (
            <div key={col.head} style={{ width: 300, opacity: p, transform: `translateY(${(1 - p) * 30}px)` }}>
              <div style={{ height: 6, width: 70, borderRadius: 3, background: col.tone, marginBottom: 18 }} />
              <div style={{ fontFamily: display, fontSize: type.line, fontWeight: 800, color: c.text, letterSpacing: '-0.02em', marginBottom: 16 }}>{col.head}</div>
              {col.items.map((t) => (
                <div key={t} style={{ fontFamily: display, fontSize: type.label, fontWeight: 600, color: c.sub, lineHeight: 1.25, marginBottom: 14 }}>{t}</div>
              ))}
            </div>
          );
        })}
      </div>
      <Sfx name="pop" at={T.sorted} />
    </DemoScene>
  );
}
