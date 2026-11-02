// A14 · PASS: the tablet over the plating counter. Glimmer keeps only frames with a plate, the dish comes from a ticket tap
// (or Muse Spark when nobody taps), SAM 3.1 + the worker score it, and a low score shows a quiet amber nudge. No sound, no blame.
// The live camera watches the counter; "Check this plate" takes the frame. Demo build: the score comes from recorded scenes.
import { Button, Chip, H1, H2, Label, Num, Row, Screen, SquishIn, Squishy, color, font } from '@nomi/ui';
import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';

import { LiveCamera, type CameraHandle } from '@/components/camera';
import { CompareSlider, MaskView, comparePlates, type SamRead } from '@/components/masks';
import { AiTag, Score, WorkLine, useSteps } from '@/components/kit';
import { PlateDiagram, partsFromReasons } from '@/components/plate';
import { DISH_STATS, GOLDEN_PHOTO } from '@/lib/mock';
import { goldenShot, rolesFor, shot, shotsUnder, slug } from '@/lib/shots';

const SCENES = [
  { dish: 'Chicken Biryani', score: 93, reasons: [] as string[], ticket: true },
  { dish: 'Chicken Biryani', score: 58, reasons: ['Rice share 21% under reference', 'Fried onions missing'], ticket: true },
  { dish: 'Chicken Biryani', score: 66, reasons: ['3 chicken pieces, reference is 4'], ticket: false },
];
const TICKETS = DISH_STATS.filter((d) => d.golden === 'published').map((d) => d.name);
// Demo camera: the pass photos of each dish on the ticket rail, the good ones first.
const FEED = shotsUnder(...TICKETS.map((t) => `${slug(t)}/pass-`)).sort((a, b) => Number(b.endsWith('-good')) - Number(a.endsWith('-good')));
type Measured = { dish: string; score: number; reasons: string[]; ticket: boolean; read: SamRead; golden: { image: number; read: SamRead } };

export default function Pass() {
  const { width } = useWindowDimensions();
  const wide = width >= 820;
  const [k, setK] = useState(-1);
  const [ticket, setTicket] = useState<string | null>(null);
  const [log, setLog] = useState<{ score: number; dish: string; time: string }[]>([
    { score: 91, dish: 'Butter Chicken', time: '21:38' }, { score: 88, dish: 'Dal Makhani', time: '21:36' }, { score: 79, dish: 'Paneer Tikka', time: '21:31' },
  ]);
  const [dropped, setDropped] = useState(41);
  const s = useSteps(3, 650);
  const [measured, setMeasured] = useState<Measured | null>(null);
  const scene = measured ?? (k >= 0 ? SCENES[k % SCENES.length] : null);
  const nudge = s.done && scene && scene.score < 75;

  const cam = useRef<CameraHandle>(null);
  const [ready, setReady] = useState(false);
  const [frame, setFrame] = useState<string | null>(null);

  const slide = async () => {
    const p = await cam.current?.snap();
    if (!p) return;
    setFrame(p.uri);
    const nk = k + 1;
    setK(nk);
    // A demo-camera frame has a saved SAM run: score it against its Golden Plate's run with the worker's rules.
    const c = shot(p.demo);
    const g = c ? goldenShot(c.dish) : null;
    if (c?.sam && g?.sam) {
      const m = comparePlates(g.sam, c.sam, rolesFor(c.dish));
      setMeasured({ dish: c.dish, ...m, ticket: true, read: c.sam, golden: { image: g.image, read: g.sam } });
      setTicket(c.dish);
    } else {
      setMeasured(null);
      setTicket(SCENES[nk % SCENES.length].ticket ? 'Chicken Biryani' : null);
    }
    setDropped((x) => x + 3 + (nk % 4));
    s.reset();
    setTimeout(() => s.start(), 30);
  };
  const clear = () => {
    if (scene) setLog((l) => [{ score: scene.score, dish: scene.dish, time: `21:${44 + (k % 10)}` }, ...l].slice(0, 6));
    setFrame(null);
    setMeasured(null);
    s.reset();
  };

  const camera = (
    <View style={{ flex: wide ? 1.2 : undefined, minHeight: 300 }}>
      {frame && measured ? (
        <MaskView image={frame} read={s.done ? measured.read : null} scanning={s.running} style={{ height: wide ? '100%' : 300, aspectRatio: 'auto' }}
          ghost={s.done ? { read: measured.golden.read, names: measured.reasons.filter((r) => r.endsWith(' missing')).map((r) => r.replace(/ missing$/, '')) } : undefined}>
          <View style={{ position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(27,27,58,0.8)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color.saffron }} />
            <Text style={{ fontFamily: font.bodyBold, fontSize: 12, color: color.bg }}>{s.running ? 'SAM 3.1 is looking…' : 'Frame kept · counter only'}</Text>
          </View>
        </MaskView>
      ) : (
      <LiveCamera ref={cam} height={wide ? '100%' : 300} guide="counter" still={frame} onReady={setReady} demo={FEED}>
        <View style={{ position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(27,27,58,0.8)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: frame ? color.saffron : color.mint }} />
          <Text style={{ fontFamily: font.bodyBold, fontSize: 12, color: color.bg }}>{frame ? 'Frame kept · counter only' : 'Live · counter only'}</Text>
        </View>
        {!frame && ready && <Text style={{ position: 'absolute', bottom: 16, fontFamily: font.bodyBold, color: color.saffronSoft, fontSize: 14 }}>Waiting for a plate</Text>}
      </LiveCamera>
      )}
    </View>
  );

  const panel = (
    <View style={{ flex: wide ? 1 : undefined, gap: 12 }}>
      {!scene || (!s.running && !s.done) ? (
        <View style={{ backgroundColor: '#2A2440', borderRadius: 24, padding: 16, gap: 10 }}>
          <Label style={{ color: color.saffronSoft }}>On the ticket</Label>
          <Row gap={8} style={{ flexWrap: 'wrap' }}>
            {TICKETS.map((t) => (
              <Squishy key={t} accessibilityRole="button" accessibilityState={{ selected: ticket === t }} onPress={() => setTicket(t)}
                style={{ minHeight: 44, paddingHorizontal: 14, borderRadius: 16, justifyContent: 'center', backgroundColor: ticket === t ? color.saffron : 'rgba(255,244,214,0.12)' }}>
                <Text style={{ fontFamily: font.bodyBold, fontSize: 14, color: ticket === t ? color.ink : color.bg }}>{t}</Text>
              </Squishy>
            ))}
          </Row>
          <Text style={{ fontFamily: font.body, fontSize: 13, color: color.saffronSoft }}>No tap? Nomi recognises the dish from the frame.</Text>
        </View>
      ) : (
        <View style={{ backgroundColor: '#2A2440', borderRadius: 24, padding: 16, gap: 10 }}>
          <WorkLine dark state={s.state(0)} text="Plate in frame, frame kept" model="Glimmer (on site)" />
          <WorkLine dark state={s.state(1)} text={scene.ticket ? `Dish from ticket: ${scene.dish}` : `Recognised: ${scene.dish}`} model={scene.ticket ? undefined : 'Muse Spark'} />
          <WorkLine dark state={s.state(2)} text="Comparing with Golden Plate v2" model="SAM 3.1" />
        </View>
      )}

      {s.done && scene && !nudge && (
        <SquishIn>
          <View style={{ backgroundColor: color.mintSoft, borderRadius: 24, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Score value={scene.score} size={64} />
            <View style={{ flex: 1 }}>
              <H2>Matches the Golden Plate</H2>
              <Text style={{ fontFamily: font.bodySemi, color: color.mintInk }}>Good to go.</Text>
            </View>
          </View>
        </SquishIn>
      )}

      {nudge && scene && (
        <SquishIn>
          <View accessibilityLiveRegion="polite" style={{ backgroundColor: color.saffron, borderRadius: 24, padding: 16, gap: 12 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <H2>Quick look before it goes</H2>
              <Num style={{ fontSize: 26 }}>{scene.score}</Num>
            </Row>
            {measured && frame ? (
              <CompareSlider golden={measured.golden} plate={{ image: frame, read: measured.read, label: 'This plate' }} height={240} />
            ) : (
            <Row gap={10}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontFamily: font.bodyBold, fontSize: 12, color: color.saffronInk }}>Golden Plate</Text>
                <Image source={GOLDEN_PHOTO} style={{ width: '100%', aspectRatio: 1, borderRadius: 16 }} contentFit="cover" />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontFamily: font.bodyBold, fontSize: 12, color: color.saffronInk }}>This plate</Text>
                {frame ? <Image source={frame} style={{ width: '100%', aspectRatio: 1, borderRadius: 16 }} contentFit="cover" accessibilityLabel="The frame just taken" /> : (
                  <View style={{ width: '100%', aspectRatio: 1, borderRadius: 16, backgroundColor: color.bg, alignItems: 'center', justifyContent: 'center' }}>
                    <PlateDiagram size={120} {...partsFromReasons(scene.reasons)} />
                  </View>
                )}
              </View>
            </Row>
            )}
            {scene.reasons.map((r) => <Text key={r} style={{ fontFamily: font.bodyBold, fontSize: 16, color: color.ink }}>• {r}</Text>)}
            <AiTag model="SAM 3.1" />
            <Row>
              <Button small kind="ink" title="Fixed, check again" style={{ flex: 1 }} onPress={() => { s.reset(); setFrame(null); setMeasured(null); setK((x) => x - (x % SCENES.length) - 1); }} />
              <Button small kind="white" title="Send as is" style={{ flex: 1 }} onPress={clear} />
            </Row>
          </View>
        </SquishIn>
      )}

      {!nudge && <Button kind="saffron" title={s.running ? 'Checking…' : s.done ? 'Next plate' : 'Check this plate'} disabled={s.running || (!s.done && !ready)} onPress={() => (s.done ? clear() : slide())} />}
    </View>
  );

  return (
    <Screen dark scroll style={{ paddingBottom: 120 }}>
      <View style={{ gap: 6 }}>
        <Text style={{ fontFamily: font.body, fontSize: 13, color: color.saffronSoft }}>Friday dinner · Pass tablet</Text>
        <H1 style={{ color: color.bg }}>The pass</H1>
        <Chip tone="mint" label={`${dropped} empty frames never left the kitchen`} />
      </View>

      {wide ? <Row style={{ alignItems: 'stretch', gap: 16 }}>{camera}{panel}</Row> : <>{camera}{panel}</>}

      <Label style={{ color: color.saffronSoft }}>Last plates</Label>
      <Row gap={8} style={{ flexWrap: 'wrap' }}>
        {log.map((l, i) => (
          <View key={i} style={{ backgroundColor: '#2A2440', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Num style={{ fontSize: 16, color: l.score >= 85 ? color.mint : l.score >= 70 ? color.saffron : '#FF8A80' }}>{l.score}</Num>
            <Text style={{ fontFamily: font.bodySemi, fontSize: 12, color: color.bg }}>{l.dish} · {l.time}</Text>
          </View>
        ))}
      </Row>
    </Screen>
  );
}
