// The manager (voiceover line 8, first half). On the phone: the inbox, Table 7's note with the guest's plate scored
// against the Golden Plate, a reply Spark drafted in the guest's language, approved. Beside it: the note and the plate
// side by side, the reply writing itself, and the approval that lets it go.
import { Img, staticFile, useCurrentFrame } from 'remotion';

import taps from '../../public/clips/manager.taps.json';
import { clipFrames, type Piece } from '../kit/clip';
import { DemoScene, PANEL } from '../kit/demo';
import { ModelLockup } from '../kit/models';
import { Words, inOut, ramp } from '../kit/motion';
import { VO_AT, voice } from '../kit/vo';
import { Sfx } from '../kit/sfx';
import { c, display, sec, type } from '../theme';

const PIECES: Piece[] = [{ from: 0.8, to: 2.9 }, { from: 2.9, to: 7.9, rate: 1.1 }, { from: 7.9, to: 10.3 }];

// vo-8's phrases: "The manager sees the note…" · "Muse Spark drafts a reply…, and nothing is sent until…"
const V = voice(8);
export const MANAGER = V.frames;
const T = { reply: V.at(1), approve: V.at(1, 3.2) };

// From the note in the clip.
const SAID = '“Biryani ka taste toh mast tha, but portion bahut kam tha yaar.”';
const REPLY = 'Thank you for telling us! Aapne sahi kaha, aaj raat biryani ka portion standard se kam tha.';

export function Manager() {
  const f = useCurrentFrame();
  const x = PANEL.phone;
  const noteOut = ramp(f, T.reply - 8, T.reply + 8, inOut);
  const typed = ramp(f, T.reply + 14, T.approve - 6, (t) => t);
  const ok = ramp(f, T.approve + 12, T.approve + 28);
  return (
    <DemoScene kind="phone" clip="manager" pieces={PIECES} taps={taps} vo={8} voAt={VO_AT}
      active={(fr) => (fr >= T.reply && fr < T.approve ? ['spark'] : fr < T.reply ? ['voice', 'sam'] : [])}>
      <div style={{ position: 'absolute', left: x, top: 120, width: 1020 }}>
        <Words text="The note, beside the plate." at={6} out={T.reply - 10} size={type.title} />
        <div style={{ position: 'absolute', top: 0 }}><ModelLockup model="spark" doing="A reply in the guest's own words" at={T.reply} out={T.approve - 10} /></div>
        <Words text="Sent once approved." at={T.approve} size={type.title} accent={['approved.']} style={{ position: 'absolute', top: 0 }} />
      </div>

      <div style={{ position: 'absolute', left: x, top: 330, width: 1000, opacity: ramp(f, 14, 30) * (1 - noteOut) }}>
        <div style={{ fontFamily: display, fontSize: type.line - 4, fontWeight: 500, color: c.text, lineHeight: 1.3, marginBottom: 34 }}>{SAID}</div>
        <div style={{ display: 'flex', gap: 24 }}>
          {[['media/golden-ref.jpg', 'Golden Plate'], ['media/guest.jpg', 'Their plate · 50']].map(([src, label], i) => (
            <div key={src} style={{ opacity: ramp(f, 26 + i * 8, 42 + i * 8) }}>
              <Img src={staticFile(src)} style={{ width: 420, height: 280, objectFit: 'cover', borderRadius: 20, boxShadow: '0 30px 60px rgba(70,50,10,0.24)' }} />
              <div style={{ marginTop: 14, fontFamily: display, fontSize: type.label, fontWeight: 700, color: i ? c.saffron : c.text }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: 'absolute', left: x, top: 340, width: 980, opacity: ramp(f, T.reply, T.reply + 14) }}>
        <div style={{ fontFamily: display, fontSize: type.line, fontWeight: 600, color: c.text, lineHeight: 1.3, letterSpacing: '-0.02em', clipPath: `inset(0 0 ${100 - typed * 100}% 0)` }}>{REPLY}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 50, opacity: ok, transform: `translateY(${(1 - ok) * 20}px)` }}>
          <svg width={54} height={54} viewBox="0 0 34 34"><circle cx={17} cy={17} r={16} fill={c.mint} /><path d="M9 17.5l5 5 11-12" fill="none" stroke={c.white} strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span style={{ fontFamily: display, fontSize: type.line, fontWeight: 700, color: c.text }}>Approved by Arjun</span>
        </div>
      </div>
      <Sfx name="pop" at={T.approve + 14} />
    </DemoScene>
  );
}
