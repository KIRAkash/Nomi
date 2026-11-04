// The menu (voiceover line 3). On the tablet: the chef photographs the printed menu, Muse Wonder types it up, Muse Spark
// lists each plate's parts. Beside it: a scan passes down the page and each dish lifts off it; then one dish splits into
// the plain nouns SAM 3.1 will look for.
import { Img, staticFile, useCurrentFrame } from 'remotion';

import taps from '../../public/clips/menu.taps.json';
import { clipFrames, type Piece } from '../kit/clip';
import { DemoScene, PANEL } from '../kit/demo';
import { ModelLockup } from '../kit/models';
import { blur, Words, inOut, ramp } from '../kit/motion';
import { VO_AT, voice } from '../kit/vo';
import { c, display, sec, type } from '../theme';

const PIECES: Piece[] = [
  { from: 1.4, to: 3.2 }, { from: 3.2, to: 46.8, rate: 22 }, { from: 46.8, to: 50.4 },
  { from: 51.0, to: 51.6 }, { from: 51.6, to: 66.6, rate: 9 }, { from: 66.6, to: 69.0 },
];

// vo-3's phrases: "Setup starts…" · "Muse Wonder reads all thirteen dishes…" · "Muse Spark lists…"
const V = voice(3);
export const MENU = Math.min(clipFrames(PIECES), V.frames);
const T = { wonder: V.at(1), spark: V.at(2) };

// What Wonder read off this menu (the live run in the clip): six of its 13 dishes, and the one it marked to check.
const DISHES = [
  { name: 'Paneer Tikka', price: '₹289' }, { name: 'Tandoori Prawns', price: '₹549' }, { name: 'Hara Bhara Kebab', price: '₹ ?', check: true },
  { name: 'Chicken Biryani', price: '₹349' }, { name: 'Lamb Shank Rogan Josh', price: '₹699' }, { name: 'Dal Makhani', price: '₹259' },
];
const PARTS = [{ t: 'rice', c: c.sky }, { t: 'chicken pieces', c: c.tomato }, { t: 'fried onions', c: c.saffron }, { t: 'lemon wedge', c: c.pink }, { t: 'bowl', c: c.mint }];

export function Menu() {
  const f = useCurrentFrame();
  const x = PANEL.tablet;
  const scan = ramp(f, T.wonder, T.wonder + 70, inOut);
  const toSpark = ramp(f, T.spark - 10, T.spark + 10, inOut);
  return (
    <DemoScene kind="tablet" clip="menu" pieces={PIECES} taps={taps} vo={3} voAt={VO_AT} active={(fr) => (fr >= T.spark ? ['spark'] : fr >= T.wonder ? ['wonder'] : [])}>
      <div style={{ position: 'absolute', left: x, top: 120, width: 740 }}>
        <Words text="One photo of the menu." at={6} out={T.wonder - 10} size={type.title} />
        <div style={{ position: 'absolute', top: 0 }}><ModelLockup model="wonder" doing="Reading every dish and price" at={T.wonder} out={T.spark - 12} /></div>
        <div style={{ position: 'absolute', top: 0 }}><ModelLockup model="spark" doing="Listing what's on each plate" at={T.spark} /></div>
      </div>

      {/* the page, with Wonder's scan running down it */}
      <div style={{ position: 'absolute', left: x, top: 330, width: 300, height: 450, opacity: ramp(f, 20, 40) * (1 - toSpark), transform: `perspective(1400px) rotateY(${18 - toSpark * 10}deg)` }}>
        <Img src={staticFile('media/menu.jpg')} style={{ width: 300, height: 450, objectFit: 'cover', borderRadius: 8, boxShadow: '0 30px 60px rgba(70,50,10,0.24)' }} />
        <div style={{ position: 'absolute', left: -10, right: -10, top: 450 * scan - 3, height: 6, background: c.saffron, boxShadow: `0 0 30px 8px ${c.saffron}`, opacity: scan > 0 && scan < 1 ? 1 : 0 }} />
      </div>
      {DISHES.map((d, i) => {
        const a = T.wonder + 10 + i * 9;
        const p = ramp(f, a, a + 18);
        return (
          <div key={d.name} style={{ position: 'absolute', left: x + 350, top: 350 + i * 66, width: 400, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            fontFamily: display, fontSize: type.label, fontWeight: 700, color: d.check ? c.saffron : c.text, letterSpacing: '-0.02em',
            opacity: p * (1 - toSpark), transform: `translateX(${(1 - p) * -140}px)`, filter: blur((1 - p) * 10) }}>
            <span>{d.name}</span><span style={{ fontWeight: 500, color: d.check ? c.saffron : c.sub }}>{d.price}</span>
          </div>
        );
      })}

      {/* one dish into the parts SAM will look for */}
      <div style={{ position: 'absolute', left: x, top: 340, opacity: toSpark }}>
        <div style={{ fontFamily: display, fontSize: type.title, fontWeight: 800, color: c.text, letterSpacing: '-0.035em' }}>Chicken Biryani</div>
        {PARTS.map((p, i) => {
          const q = ramp(f, T.spark + 14 + i * 7, T.spark + 32 + i * 7);
          return (
            <div key={p.t} style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: i ? 14 : 28, opacity: q, transform: `translateX(${(1 - q) * 60}px)` }}>
              <div style={{ width: 54, height: 4, borderRadius: 2, background: p.c }} />
              <span style={{ fontFamily: display, fontSize: type.line, fontWeight: 600, color: c.text, letterSpacing: '-0.02em' }}>{p.t}</span>
            </div>
          );
        })}
      </div>
    </DemoScene>
  );
}
