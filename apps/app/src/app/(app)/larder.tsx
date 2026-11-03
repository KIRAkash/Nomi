// A20 · Larder: photograph the shelves, SAM 3.1 counts whole items (sacks, tins, packets), and a reorder list is drafted
// for anything under its minimum. An open container counts as one item; Nomi never says how full it is.
import { Button, Card, Chip, H2, Label, Num, Row, Screen, SquishIn, Sub, color, font } from '@nomi/ui';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { CameraSheet, type Photo } from '@/components/camera';
import { MaskView, type SamRead } from '@/components/masks';
import { AiTag, Bars, DAYS, LiveWait, TopBar } from '@/components/kit';
import { readGolden } from '@/lib/api';
import { DISH_PARTS } from '@/lib/demo-media';
import { STOCK } from '@/lib/mock';
import { shot, shotsUnder } from '@/lib/shots';

const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'}`;

/** A drawn shelf with a box round every counted item, so the count can be checked by eye. */
function ShelfScan() {
  const items = [
    ...[0].map((i) => ({ x: 14 + i * 64, y: 24, w: 56, h: 60, c: color.saffron })),
    ...[0, 1, 2, 3].map((i) => ({ x: 150 + i * 40, y: 36, w: 32, h: 48, c: color.sky })),
    ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({ x: 14 + i * 36, y: 110, w: 28, h: 34, c: color.mint })),
  ];
  return (
    <View style={{ height: 180, borderRadius: 22, backgroundColor: color.photo, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={320} height={160} viewBox="0 0 320 160">
        <Rect x={4} y={88} width={312} height={6} fill="#8B6B4A" />
        <Rect x={4} y={148} width={312} height={6} fill="#8B6B4A" />
        {items.map((it, i) => (
          <Rect key={i} x={it.x} y={it.y} width={it.w} height={it.h} rx={6} fill={`${it.c}55`} stroke={it.c} strokeWidth={2.5} />
        ))}
      </Svg>
    </View>
  );
}

const SHELF_PARTS = (DISH_PARTS.Larder ?? []).map(({ name, prompt, colour }) => ({ name, prompt, colour }));

export default function Larder() {
  const [ordered, setOrdered] = useState(false);
  const [shots, setShots] = useState<Photo[]>([]);
  // SAM 3.1 counts every photo live; a demo photo falls back to its saved run if the network is down.
  const [reads, setReads] = useState<{ list: (SamRead | null)[]; ms?: number } | 'busy' | null>(null);
  const count = async () => {
    setReads('busy');
    const t0 = Date.now();
    try {
      const { photos } = await readGolden(shots.map((p) => p.dataUrl), SHELF_PARTS, false);
      setReads({ list: photos.map((r) => (r.ok ? r : null)), ms: Date.now() - t0 });
    } catch {
      setReads({ list: shots.map((p) => shot(p.demo)?.sam ?? null) });
    }
  };
  const scan = { running: reads === 'busy', done: !!reads && reads !== 'busy' };
  const saved = reads && reads !== 'busy' ? reads.list : [];
  const real = scan.done && saved.some(Boolean);
  const totals = real ? saved.flatMap((r) => r?.parts ?? []).reduce<Record<string, number>>((t, p) => ({ ...t, [p.name]: (t[p.name] ?? 0) + p.count }), {}) : {};
  const [shooting, setShooting] = useState(false);
  const low = STOCK.filter((s) => s.counts[s.counts.length - 1] < s.min);

  return (
    <Screen scroll style={{ paddingBottom: 120 }}>
      <TopBar sub={`Last shelf scan ${STOCK[0].lastScan}`} title="Larder" />

      <Card style={{ gap: 12 }}>
        <Row style={{ justifyContent: 'space-between' }}><H2 style={{ fontSize: 17 }}>Shelf scan</H2><AiTag model="SAM 3.1" ms={reads && reads !== 'busy' ? reads.ms : undefined} /></Row>
        {shots.length > 0 && (scan.running || real)
          ? shots.map((p, i) => <MaskView key={i} image={p.uri} read={scan.done ? saved[i] : null} scanning={scan.running} />)
          : scan.done ? <ShelfScan /> : <Sub style={{ fontSize: 14 }}>Take 3–4 photos of the dry store and walk-in. Nomi counts the whole items it can see.</Sub>}
        {shots.length > 0 && !(scan.running || real) && (
          <Row gap={8}>
            {shots.map((p, i) => <Image key={i} source={p.uri} style={{ flex: 1, maxWidth: 90, aspectRatio: 1, borderRadius: 14 }} contentFit="cover" accessibilityLabel={`Shelf photo ${i + 1}`} />)}
          </Row>
        )}
        {scan.running && <LiveWait text={`Counting ${SHELF_PARTS.map((p) => p.name.toLowerCase()).join(', ')}`} model="SAM 3.1" typical="10–25 s" />}
        {scan.done ? (
          <Chip tone="mint" label={real ? `${Object.entries(totals).filter(([, n]) => n).map(([k, n]) => `${n} ${(n === 1 ? k.replace(/s$/, '') : k).toLowerCase()}`).join(' · ') || 'Nothing'} counted` : '1 sack · 4 tins · 8 packets counted'} />
        ) : !scan.running && (
          <Row>
            <Button small kind={shots.length ? 'white' : 'saffron'} title={shots.length ? `Photo ${shots.length + 1}` : 'Photograph the shelves'} disabled={shots.length >= 4} style={{ flex: 1 }} onPress={() => setShooting(true)} />
            {shots.length > 0 && <Button small kind="saffron" title={`Count from ${shots.length}`} style={{ flex: 1 }} onPress={count} />}
          </Row>
        )}
        {scan.running && <Button small kind="saffron" title="Counting…" disabled onPress={() => {}} />}
        <CameraSheet open={shooting} title={`Shelf photo ${shots.length + 1}`} hint="One shelf at a time, labels facing you." guide="shelf"
          onClose={() => setShooting(false)} onShot={(p) => { setShots((x) => [...x, p]); setShooting(false); }} demo={shotsUnder('larder/')} />
      </Card>

      {low.length > 0 && (
        <SquishIn>
          <Card style={{ backgroundColor: color.saffronSoft, gap: 10 }}>
            <H2 style={{ fontSize: 17 }}>Reorder list · draft</H2>
            {low.map((s) => (
              <Row key={s.id} style={{ justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: font.bodyBold, fontSize: 15, color: color.ink }}>{s.name}</Text>
                <Text style={{ fontFamily: font.bodySemi, fontSize: 14, color: color.saffronInk }}>{plural(s.counts[s.counts.length - 1], s.unit)} · min {s.min} → order {s.min - s.counts[s.counts.length - 1]}</Text>
              </Row>
            ))}
            {ordered ? <Chip tone="mint" label="Approved by Arjun · sent to Sri Lakshmi Traders" /> : <Button small title="Approve and send order" onPress={() => setOrdered(true)} />}
          </Card>
        </SquishIn>
      )}

      <Label>Whole items at close · last 7 nights</Label>
      {STOCK.map((s, i) => {
        const now = s.counts[s.counts.length - 1];
        const under = now < s.min;
        return (
          <SquishIn key={s.id} index={i}>
            <Card soft style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ fontFamily: font.bodyBold, fontSize: 15, color: color.ink }}>{s.name}</Text>
                <Text style={{ fontFamily: font.bodySemi, fontSize: 12, color: under ? color.tomatoInk : color.ink2 }}>Minimum {plural(s.min, s.unit)}{under ? ' · under' : ''}</Text>
              </View>
              <Bars values={s.counts} width={98} height={30} fill={under ? color.tomato : color.mint} />
              <Num style={{ fontSize: 22, width: 36, textAlign: 'right', color: under ? color.tomatoInk : color.ink }}>{now}</Num>
            </Card>
          </SquishIn>
        );
      })}
      <Text style={{ fontFamily: font.bodySemi, fontSize: 12, color: color.ink2 }}>Days: {DAYS.join(' · ')}. An open container counts as 1; Nomi does not guess how full it is.</Text>

      <Button kind="white" title="Tonight's closing round" onPress={() => router.push('/closing')} />
    </Screen>
  );
}
