// Plating cards (voiceover line 12). On the phone: a cook picks Kannada and Muse Spark translates the biryani card.
// Beside it: the six languages a card can be read in, then a close-up of the translated steps from the recording.
import { useCurrentFrame } from 'remotion';

import taps from '../../public/clips/cards.taps.json';
import { Zoom, type Piece } from '../kit/clip';
import { DemoScene, PANEL } from '../kit/demo';
import { ModelLockup } from '../kit/models';
import { ramp } from '../kit/motion';
import { VO_AT, voice } from '../kit/vo';
import { c, display, type } from '../theme';

const V = voice(12);
// The Kannada tap and the scroll to the card; the translation's wait sped up; the translated card.
const PIECES: Piece[] = [{ from: 2.4, to: 5.4 }, { from: 5.4, to: 22.2, rate: 14 }, { from: 22.2, to: 30 }];
export const CARDS = V.frames;
// vo-12's phrases: "Each cook reads the plating cards…" · "Here," · "Muse Spark translates one into Kannada."
const T = { spark: V.at(1) };

// The card's languages in the app, each in its own script.
const LANGS = ['हिन्दी', 'English', 'தமிழ்', 'ಕನ್ನಡ', 'বাংলা', 'नेपाली'];

export function Cards() {
  const f = useCurrentFrame();
  const x = PANEL.phone;
  const pick = ramp(f, T.spark - 6, T.spark + 8);
  return (
    <DemoScene kind="phone" clip="cards" pieces={PIECES} taps={taps} vo={12} voAt={VO_AT} active={(fr) => (fr >= T.spark ? ['spark'] : [])}>
      <div style={{ position: 'absolute', left: x, top: 120, width: 1020 }}>
        <ModelLockup model="spark" doing="The biryani card, in Kannada" at={T.spark - 4} />
      </div>
      <div style={{ position: 'absolute', left: x, top: 130, width: 1000, display: 'flex', flexWrap: 'wrap', gap: '18px 44px', opacity: ramp(f, 4, 18) * (1 - ramp(f, T.spark - 10, T.spark - 2)) }}>
        {LANGS.map((l, i) => (
          <span key={l} style={{ fontFamily: display, fontSize: type.title, fontWeight: 800, letterSpacing: '-0.02em', color: c.text, opacity: ramp(f, 6 + i * 4, 18 + i * 4) }}>{l}</span>
        ))}
      </div>
      <div style={{ position: 'absolute', left: x, top: 330, opacity: pick }}>
        <Zoom name="cards" kind="phone" pieces={PIECES} region={[16, 258, 380, 205]} width={980} />
      </div>
    </DemoScene>
  );
}
