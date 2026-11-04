// The morning (voiceover line 8, second half). On the tablet: the owner runs NIGHTSHIFT live (Muse Wonder plans, four
// Muse Spark analysts, Wonder links the facts), then the chef's watch list for tonight. Beside it: Wonder fanning the night
// out to the four analysts and drawing their findings back together, then the watch list with last night's counts.
import { useCurrentFrame } from 'remotion';

import briefing from '../../public/clips/briefing.taps.json';
import watch from '../../public/clips/watch.taps.json';
import { clipFrames, type Piece } from '../kit/clip';
import { DemoScene, PANEL } from '../kit/demo';
import { Mark, ModelLockup } from '../kit/models';
import { Words, inOut, ramp } from '../kit/motion';
import { VO_AT, voice } from '../kit/vo';
import { Sfx } from '../kit/sfx';
import { c, display, sec, type } from '../theme';

const PIECES: Piece[] = [
  { from: 1.6, to: 2.9 }, { from: 2.9, to: 24.0, rate: 5 }, { from: 24.0, to: 46.8, rate: 10 }, { from: 46.8, to: 48.8 },
  { clip: 'watch', from: 1.6, to: 2.6 }, { clip: 'watch', from: 2.6, to: 44.4, rate: 40 }, { clip: 'watch', from: 44.4, to: 49.4 },
];

// vo-9's phrases: "After closing," · "the owner runs Nightshift." · "Muse Wonder plans the review, and four Muse Spark
// agents check…" · "The kitchen gets a watch list of counts," · "like mint chutney missing…"
const V = voice(9);
// The scene ends about half a second after its voice.
export const BRIEFING = Math.min(clipFrames(PIECES), V.frames);
const T = { wonder: V.at(2), spark: V.at(2, 1.9), linked: V.at(2, 5.2), watch: V.at(3) };

// The four analysts and what each found in the live run.
const ANALYSTS = [
  { name: 'Feedback', found: '4 findings from 6 facts' },
  { name: 'Plates', found: '4 findings from 25 facts' },
  { name: 'Stock', found: '2 findings from 5 facts' },
  { name: 'Closing round', found: '4 findings from 7 facts' },
];
// Tonight's watch list as the live run counted it.
const WATCH = [
  { dish: 'Chicken Biryani', fact: 'Rice under the Golden Plate area on 6 of 39 plates', n: 6, of: 39 },
  { dish: 'Paneer Tikka', fact: 'Mint chutney missing on 3 of 24 plates', n: 3, of: 24 },
  { dish: 'Tandoori Prawns', fact: 'Prawns short on 2 of 18 plates', n: 2, of: 18 },
];

export function Briefing() {
  const f = useCurrentFrame();
  const x = PANEL.tablet;
  const graphOut = ramp(f, T.watch - 8, T.watch + 10, inOut);
  const hub = { x: 90, y: 250 };
  return (
    <DemoScene kind="tablet" clip="briefing" pieces={PIECES} taps={briefing} more={{ watch }} vo={9} voAt={VO_AT}
      active={(fr) => (fr >= T.watch ? ['spark'] : fr >= T.linked ? ['wonder'] : fr >= T.spark ? ['spark'] : fr >= T.wonder ? ['wonder'] : [])}>
      <div style={{ position: 'absolute', left: x, top: 120, width: 760 }}>
        <Words text="After closing." at={4} out={T.wonder - 8} size={type.title} />
        <div style={{ position: 'absolute', top: 0 }}><ModelLockup model="wonder" doing="Plans a review of last night" at={T.wonder} out={T.spark - 6} /></div>
        <div style={{ position: 'absolute', top: 0 }}><ModelLockup model="spark" doing="Four agents, at the same time" at={T.spark} out={T.watch - 10} /></div>
        <Words text="The watch list." at={T.watch} size={type.title} style={{ position: 'absolute', top: 0 }} />
      </div>

      {/* Wonder at the hub, lines out to the four analysts and back */}
      <div style={{ position: 'absolute', left: x, top: 330, width: 760, height: 520, opacity: ramp(f, T.wonder, T.wonder + 14) * (1 - graphOut) }}>
        <svg width={760} height={520} style={{ position: 'absolute', inset: 0 }}>
          {ANALYSTS.map((a, i) => {
            const y = 40 + i * 130;
            const out = ramp(f, T.wonder + 8 + i * 4, T.spark + 4 + i * 4, inOut);
            const back = ramp(f, T.linked - 6 + i * 3, T.linked + 10 + i * 3, inOut);
            const d = `M ${hub.x + 60} ${hub.y} C ${hub.x + 200} ${hub.y}, 230 ${y + 30}, 330 ${y + 30}`;
            return (
              <g key={a.name}>
                <path d={d} fill="none" stroke={c.line} strokeWidth={3} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - out} />
                <path d={d} fill="none" stroke={c.saffron} strokeWidth={4} pathLength={1} strokeDasharray="0.14 1" strokeDashoffset={-back * 1.1} opacity={back > 0 && back < 1 ? 1 : 0} />
              </g>
            );
          })}
        </svg>
        <div style={{ position: 'absolute', left: hub.x - 50, top: hub.y - 50, width: 110, height: 110, borderRadius: 55, background: c.ink, display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 ${30 + ramp(f, T.linked, T.linked + 20) * 40}px rgba(255,182,39,${0.25 + ramp(f, T.linked, T.linked + 20) * 0.4})` }}>
          <Mark kind="muse" size={56} />
        </div>
        {ANALYSTS.map((a, i) => {
          const y = 40 + i * 130;
          const p = ramp(f, T.spark + i * 5, T.spark + 16 + i * 5);
          const done = ramp(f, T.spark + 22 + i * 7, T.spark + 34 + i * 7);
          return (
            <div key={a.name} style={{ position: 'absolute', left: 344, top: y, opacity: p, transform: `translateX(${(1 - p) * 30}px)` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Mark kind="muse" size={30} />
                <span style={{ fontFamily: display, fontSize: type.label + 4, fontWeight: 700, color: c.text }}>{a.name}</span>
              </div>
              <div style={{ fontFamily: display, fontSize: type.label - 2, fontWeight: 500, color: c.mint, marginTop: 6, marginLeft: 44, opacity: done }}>{a.found}</div>
            </div>
          );
        })}
      </div>

      {/* the watch list, with the counts it came from */}
      <div style={{ position: 'absolute', left: x, top: 340, width: 760, opacity: ramp(f, T.watch + 4, T.watch + 18) }}>
        {WATCH.map((w, i) => {
          const q = ramp(f, T.watch + 16 + i * 10, T.watch + 34 + i * 10);
          // each count drawn as plates: one mark per plate checked, the short ones filling in saffron
          const fill = ramp(f, T.watch + 30 + i * 12, T.watch + 30 + i * 12 + w.of * 1.2);
          return (
            <div key={w.dish} style={{ display: 'flex', gap: 24, marginBottom: 40, opacity: q, transform: `translateX(${(1 - q) * 50}px)` }}>
              <span style={{ fontFamily: display, fontSize: type.title - 10, fontWeight: 800, color: c.saffron, lineHeight: 1 }}>{i + 1}</span>
              <div>
                <div style={{ fontFamily: display, fontSize: type.line - 4, fontWeight: 700, color: c.text, letterSpacing: '-0.02em' }}>{w.dish}</div>
                <div style={{ fontFamily: display, fontSize: type.label, fontWeight: 500, color: c.sub, marginTop: 6 }}>{w.fact}</div>
                <div style={{ display: 'flex', gap: 5, marginTop: 14 }}>
                  {Array.from({ length: w.of }, (_, j) => {
                    const on = fill * w.of > j;
                    return <span key={j} style={{ width: 12, height: 22, borderRadius: 3, background: on ? (j < w.n ? c.saffron : c.line) : 'transparent',
                      transform: `scaleY(${on ? 1 : 0.4})` }} />;
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {WATCH.map((w, i) => <Sfx key={w.dish} name="pop" at={T.watch + 18 + i * 10} volume={0.16} />)}
    </DemoScene>
  );
}
