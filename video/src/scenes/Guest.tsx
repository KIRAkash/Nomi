// The guest (voiceover line 7). On the phone: the table's page, a photo of the plate, Spark naming it, a rating, a voice
// note in Hindi, and the tags read back. Beside it: the table card's QR being scanned, the dish named on the photo, the
// voice becoming words and then tags.
import QRCode from 'qrcode';
import { Img, random, staticFile, useCurrentFrame } from 'remotion';

import taps from '../../public/clips/guest.taps.json';
import { clipFrames, type Piece } from '../kit/clip';
import { DemoScene, PANEL } from '../kit/demo';
import { ModelLockup } from '../kit/models';
import { Words, inOut, ramp } from '../kit/motion';
import { VO_AT, voice } from '../kit/vo';
import { c, display, sec, type } from '../theme';

// Waits cut; the hold-to-talk runs at 3×. The tap that removed a tag is left out.
const PIECES: Piece[] = [
  { from: 3.6, to: 5.2 }, { from: 6.0, to: 8.4 }, { from: 8.4, to: 15.3, rate: 15 }, { from: 15.3, to: 17.9 },
  { from: 19.5, to: 20.0 }, { from: 20.8, to: 21.4 }, { from: 22.9, to: 28.6, rate: 3 }, { from: 28.6, to: 42.9, rate: 20 },
  { from: 42.9, to: 45.9, rate: 1.6 }, { from: 47.4, to: 50.2 },
];

// vo-7's phrases: "At the table," · "the guest scans…" · "Muse Spark names the dish." · "Then they just talk," ·
// "in any language." · "Muse Voice writes it down," · "Muse Spark turns it into tags," · "and the guest can fix them…"
const V = voice(7);
// The scene ends about half a second after its voice.
export const GUEST = Math.min(clipFrames(PIECES), V.frames);
const T = { named: V.at(2), talk: V.at(3), voice: V.at(5), tags: V.at(6) };

const QR = QRCode.create('https://nomi.app/t/demo-table-7', { errorCorrectionLevel: 'M' }).modules;
const HEARD = 'बिरयानी बहुत टेस्टी थी, लेकिन पोर्शन थोड़ा कम था और नान ठंडा आया।';
const TAGS = [{ t: 'very tasty biryani', c: c.mint }, { t: 'portion a bit small', c: c.saffron }, { t: 'naan came cold', c: c.sky }];

export function Guest() {
  const f = useCurrentFrame();
  const x = PANEL.phone;
  const qrOut = ramp(f, T.named - 10, T.named + 6, inOut);
  const photoOut = ramp(f, T.talk - 8, T.talk + 8, inOut);
  const words = ramp(f, T.tags - 8, T.tags + 8, inOut);
  return (
    <DemoScene kind="phone" clip="guest" pieces={PIECES} taps={taps} vo={7} voAt={VO_AT}
      active={(fr) => (fr >= T.tags ? ['spark'] : fr >= T.talk ? ['voice'] : fr >= T.named ? ['spark'] : [])}>
      <div style={{ position: 'absolute', left: x, top: 120, width: 1020 }}>
        <Words text="Scan the table. Show the plate." at={6} out={T.named - 10} size={type.title} />
        <div style={{ position: 'absolute', top: 0 }}><ModelLockup model="spark" doing="Naming the dish from the photo" at={T.named} out={T.talk - 10} /></div>
        <Words text="Any language." at={T.talk} out={T.voice - 10} size={type.title} style={{ position: 'absolute', top: 0 }} />
        <div style={{ position: 'absolute', top: 0 }}><ModelLockup model="voice" doing="Writing down what the guest said" at={T.voice} out={T.tags - 10} /></div>
        <div style={{ position: 'absolute', top: 0 }}><ModelLockup model="spark" doing="Tags, read back to the guest" at={T.tags} /></div>
      </div>

      {/* the table card and its QR, scanned */}
      <div style={{ position: 'absolute', left: x, top: 330, display: 'flex', gap: 60, alignItems: 'center', opacity: ramp(f, 10, 26) * (1 - qrOut) }}>
        <div style={{ position: 'relative', width: 380, height: 380, padding: 26, borderRadius: 26, background: c.white, transform: 'perspective(1400px) rotateY(-14deg) rotateX(8deg)', boxShadow: '0 40px 80px rgba(70,50,10,0.24)' }}>
          <svg width={328} height={328} viewBox={`0 0 ${QR.size} ${QR.size}`} shapeRendering="crispEdges">
            {Array.from({ length: QR.size * QR.size }, (_, i) => QR.data[i] ? <rect key={i} x={i % QR.size} y={Math.floor(i / QR.size)} width={1} height={1} fill={c.ink} /> : null)}
          </svg>
          <div style={{ position: 'absolute', left: 16, right: 16, top: 16 + ramp(f, 24, 60, inOut) * 340, height: 4, background: c.saffron, boxShadow: `0 0 24px 6px ${c.saffron}`, opacity: f < 64 ? 1 : 0 }} />
        </div>
        <div style={{ opacity: ramp(f, 58, 74) }}>
          <div style={{ fontFamily: display, fontSize: type.title, fontWeight: 800, color: c.text, letterSpacing: '-0.035em' }}>Table 7</div>
          <div style={{ fontFamily: display, fontSize: type.line, fontWeight: 500, color: c.sub, marginTop: 8 }}>Nothing to install</div>
        </div>
      </div>

      {/* the plate photo, and the dish's name landing on it */}
      <div style={{ position: 'absolute', left: x, top: 320, width: 640, height: 480, borderRadius: 24, overflow: 'hidden', opacity: ramp(f, T.named - 6, T.named + 10) * (1 - photoOut), boxShadow: '0 40px 80px rgba(70,50,10,0.24)' }}>
        <Img src={staticFile('media/guest.jpg')} style={{ width: 640, height: 480, objectFit: 'cover', objectPosition: '50% 60%' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '60px 30px 26px', background: 'linear-gradient(transparent, rgba(8,8,15,0.85))' }}>
          <Words text="Chicken Biryani" at={T.named + 10} size={type.title} color={c.white} />
        </div>
      </div>

      {/* the voice, then its words */}
      <div style={{ position: 'absolute', left: x, top: 360, width: 1000, opacity: ramp(f, T.talk, T.talk + 12) * (1 - words) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, height: 140 }}>
          {Array.from({ length: 60 }, (_, i) => {
            const live = 1 - ramp(f, T.voice, T.voice + 20);
            const h = 14 + live * Math.abs(Math.sin(f / 4 + i * 0.7) * Math.sin(f / 9 + i * 0.31)) * 120 * (0.4 + random(`g${i}`) * 0.6);
            return <div key={i} style={{ width: 8, height: h, borderRadius: 4, background: c.tomato, opacity: 0.4 + 0.6 * live }} />;
          })}
        </div>
        <div style={{ marginTop: 40, fontFamily: display, fontSize: type.line - 4, fontWeight: 500, color: c.text, lineHeight: 1.35, opacity: ramp(f, T.voice + 6, T.voice + 20), clipPath: `inset(0 ${100 - ramp(f, T.voice + 6, T.voice + 44) * 100}% 0 0)` }}>“{HEARD}”</div>
      </div>

      {/* the tags, read back */}
      <div style={{ position: 'absolute', left: x, top: 340, opacity: words }}>
        <div style={{ fontFamily: display, fontSize: type.line - 6, fontWeight: 500, color: c.sub, marginBottom: 34, width: 1000, lineHeight: 1.3 }}>The biryani was very tasty, but the portion was a bit small and the naan came cold.</div>
        {TAGS.map((t, i) => {
          const q = ramp(f, T.tags + 14 + i * 7, T.tags + 30 + i * 7);
          return (
            <div key={t.t} style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 22, opacity: q, transform: `translateX(${(1 - q) * 60}px)` }}>
              <div style={{ width: 54, height: 4, borderRadius: 2, background: t.c }} />
              <span style={{ fontFamily: display, fontSize: type.line, fontWeight: 700, color: c.text, letterSpacing: '-0.02em' }}>{t.t}</span>
            </div>
          );
        })}
      </div>
    </DemoScene>
  );
}
