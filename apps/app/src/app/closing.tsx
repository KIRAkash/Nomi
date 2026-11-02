// A21 · Closing round: the same 6 spots every night, about 2 minutes. Nomi reports only what is visible: counted items and
// flags like a container without a lid. Staff fix a flag and take an after photo. No hygiene score.
import { Button, Card, Chip, H2, Label, Row, Screen, SquishIn, Squishy, Sub, color, font, shadow } from '@nomi/ui';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { CameraSheet, type Photo } from '@/components/camera';
import { MaskView } from '@/components/masks';
import { AiTag, TopBar } from '@/components/kit';
import { CLOSING_SPOTS, type Spot } from '@/lib/mock';
import { shot, shotsUnder } from '@/lib/shots';

// Demo camera photos for each spot (docs/demo-images.md, Closing round).
const FEED: Record<string, string> = { walkin: 'closing/walkin', dry: 'larder/dry-store', prep: 'closing/prep-counter', stove: 'closing/stove', floor: 'closing/floor', bins: 'closing/bins' };
const feed = (id: string, after: boolean) => shotsUnder(FEED[id] ?? '-').sort((a, b) => Number(b.endsWith('fixed') === after) - Number(a.endsWith('fixed') === after));

// What the demo "finds" at each spot not yet photographed.
const FOUND: Record<string, Pick<Spot, 'counts' | 'flags'>> = {
  prep: { counts: [{ item: 'Knives on the rack', n: 6 }, { item: 'Cutting boards', n: 3 }], flags: [{ flag: 'Item left out', where: 'Onion tray on the counter', fixed: false }] },
  stove: { counts: [{ item: 'Handis', n: 4 }], flags: [] },
  floor: { counts: [], flags: [{ flag: 'Spill', where: 'Near the drain, left', fixed: false }] },
  bins: { counts: [{ item: 'Bins with lids closed', n: 3 }], flags: [] },
};

export default function Closing() {
  const [spots, setSpots] = useState(CLOSING_SPOTS);
  const [busy, setBusy] = useState<string | null>(null);
  const [shooting, setShooting] = useState<{ id: string; flag?: number } | null>(null);
  const [photos, setPhotos] = useState<Record<string, Photo>>({});
  const done = spots.filter((s) => s.done).length;
  const open = spots.flatMap((s) => s.flags.filter((f) => !f.fixed)).length;
  const spotName = spots.find((s) => s.id === shooting?.id)?.name ?? '';

  const look = (id: string, demo?: string) => {
    setBusy(id);
    // A demo photo's saved SAM run gives the real counts; the flags stay from the demo script.
    const sam = shot(demo)?.sam;
    const found = FOUND[id] ?? { counts: [], flags: [] };
    const counts = sam ? sam.parts.filter((p) => p.found && p.count && p.boxes.length).map((p) => ({ item: p.name, n: p.count })) : found.counts;
    setTimeout(() => {
      setSpots((xs) => xs.map((s) => (s.id === id ? { ...s, done: true, flags: found.flags, counts } : s)));
      setBusy(null);
    }, 1000);
  };
  const fix = (id: string, k: number) => setSpots((xs) => xs.map((s) => (s.id === id ? { ...s, flags: s.flags.map((f, j) => (j === k ? { ...f, fixed: true } : f)) } : s)));
  const took = (p: Photo) => {
    if (!shooting) return;
    const { id, flag } = shooting;
    setShooting(null);
    if (flag === undefined) {
      setPhotos((x) => ({ ...x, [id]: p }));
      look(id, p.demo);
    } else {
      setPhotos((x) => ({ ...x, [`${id}:${flag}`]: p }));
      fix(id, flag);
    }
  };

  return (
    <Screen scroll style={{ paddingBottom: 40 }}>
      <TopBar back sub="Friday · closing" title="Closing round" right={<View />} />
      <Card style={{ gap: 8 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <H2>{done} of {spots.length} spots</H2>
          {open > 0 ? <Chip tone="saffron" label={`${open} to fix`} /> : done === spots.length ? <Chip tone="mint" label="All clear" /> : null}
        </Row>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {spots.map((s) => <View key={s.id} style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: s.done ? color.mint : color.saffronSoft }} />)}
        </View>
        <Row gap={6}><AiTag model="SAM 3.1" /><AiTag model="Muse Spark" /><Text style={{ fontFamily: font.bodySemi, fontSize: 12, color: color.ink2 }}>visible things only</Text></Row>
      </Card>

      {spots.map((s, i) => (
        <SquishIn key={s.id} index={i}>
          <Card style={{ gap: 10, backgroundColor: s.done ? color.card : color.bg }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <H2 style={{ fontSize: 17 }}>{i + 1}. {s.name}</H2>
              {s.done && s.flags.every((f) => f.fixed) && <Chip tone="mint" label="Done" />}
            </Row>
            {!s.done && (
              <Button small kind="saffron" title={busy === s.id ? 'Looking…' : 'Take the photo'} disabled={busy !== null} onPress={() => setShooting({ id: s.id })} />
            )}
            {photos[s.id] && (shot(photos[s.id].demo)?.sam
              ? <MaskView image={photos[s.id].uri} read={busy === s.id ? null : shot(photos[s.id].demo)!.sam} scanning={busy === s.id} />
              : <Image source={photos[s.id].uri} style={{ width: '100%', height: 150, borderRadius: 16 }} contentFit="cover" accessibilityLabel={`Closing photo of ${s.name}`} />)}
            {s.done && s.counts.length > 0 && (
              <Row gap={6} style={{ flexWrap: 'wrap' }}>
                {s.counts.map((c) => <Chip key={c.item} tone="sky" label={`${c.item}: ${c.n}`} />)}
              </Row>
            )}
            {s.flags.map((f, k) => (
              <View key={k} style={{ backgroundColor: f.fixed ? color.mintSoft : color.saffronSoft, borderRadius: 16, padding: 12, gap: 8 }}>
                <Text style={{ fontFamily: font.bodyBold, fontSize: 14, color: f.fixed ? color.mintInk : color.saffronInk }}>{f.flag} · {f.where}</Text>
                {f.fixed ? (
                  <Row gap={8}>
                    {photos[`${s.id}:${k}`] && <Image source={photos[`${s.id}:${k}`].uri} style={{ width: 48, height: 48, borderRadius: 10 }} contentFit="cover" accessibilityLabel="After photo" />}
                    <Text style={{ fontFamily: font.bodySemi, fontSize: 12, color: color.mintInk }}>Fixed, after photo saved</Text>
                  </Row>
                ) : (
                  <Squishy accessibilityRole="button" onPress={() => setShooting({ id: s.id, flag: k })} style={{ minHeight: 44, borderRadius: 14, backgroundColor: color.ink, alignItems: 'center', justifyContent: 'center', ...shadow(1) }}>
                    <Text style={{ fontFamily: font.bodyBold, fontSize: 14, color: color.bg }}>Fixed it · take after photo</Text>
                  </Squishy>
                )}
              </View>
            ))}
            {s.done && s.flags.length === 0 && s.counts.length === 0 && <Sub style={{ fontSize: 13 }}>Nothing flagged.</Sub>}
          </Card>
        </SquishIn>
      ))}
      <CameraSheet open={!!shooting} title={shooting?.flag === undefined ? spotName : `After photo · ${spotName}`}
        hint={shooting?.flag === undefined ? 'Stand at the same spot as last night and get the whole area in.' : 'Show the fixed spot from the same angle.'}
        onClose={() => setShooting(null)} onShot={took} demo={shooting ? feed(shooting.id, shooting.flag !== undefined) : []} />
      <Label>Over 7 nights, Nomi shows how often each flag repeats. It never gives a hygiene score.</Label>
    </Screen>
  );
}
