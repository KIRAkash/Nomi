// Staff · Check my plate: before a plate leaves, the cook photographs it. SAM 3.1 finds every part live, Nomi measures it
// against the dish's Golden Plate and says exactly what to fix: a missing part, a piece short, something in the wrong place.
import { Button, Card, H1, H2, Label, Row, Screen, SquishIn, Squishy, Sub, color, font } from '@nomi/ui';
import { useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { LiveCamera, Shutter, type CameraHandle, type Photo } from '@/components/camera';
import { AiTag, LiveWait, Segmented, TopBar } from '@/components/kit';
import { CompareSlider, MaskLegend, MaskView, comparePlates, type SamRead } from '@/components/masks';
import { readGolden } from '@/lib/api';
import { DISH_STATS } from '@/lib/mock';
import { goldenShot, partsFor, rolesFor, shot, shotsUnder, slug } from '@/lib/shots';

const DISHES = DISH_STATS.filter((d) => d.golden === 'published' && goldenShot(d.name)?.sam);

type Result = { photo: Photo; read: SamRead; ms?: number; saved?: boolean };

const Mark = ({ ok, size = 22 }: { ok: boolean; size?: number }) => (
  <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: ok ? color.mint : color.tomato, alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ fontFamily: font.bodyBold, fontSize: size * 0.6, lineHeight: size * 0.8, color: '#FFFFFF' }}>{ok ? '✓' : '✕'}</Text>
  </View>
);

/** The result: a big tick or cross on the photo, what each colour is, every check with the Golden Plate's value next to
 * this plate's, and a drag-to-compare against the Golden Plate. Everything shown comes from the two SAM reads. */
function Verdict({ dish, result, onAgain }: { dish: string; result: Result; onAgain: () => void }) {
  const golden = goldenShot(dish)!;
  const [view, setView] = useState<'plate' | 'compare'>('plate');
  const [focus, setFocus] = useState<string | null>(null);
  const { score, checks } = comparePlates(golden.sam!, result.read, rolesFor(dish));
  const failed = checks.filter((c) => !c.ok);
  const good = failed.length === 0;
  const missing = checks.filter((c) => c.check === 'On the plate' && !c.ok).map((c) => c.part);
  const parts = [...new Set(checks.map((c) => c.part))];
  const version = DISH_STATS.find((d) => d.name === dish)?.goldenVersion ?? 1;
  return (
    <SquishIn style={{ gap: 12 }}>
      <Card style={{ gap: 12, padding: 12, backgroundColor: good ? color.mintSoft : color.tomatoSoft }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <H1 style={{ fontSize: 26 }}>{good ? 'Ready to go' : 'Fix before it goes'}</H1>
            <Sub style={{ fontSize: 13 }}>{checks.length - failed.length} of {checks.length} checks passed · score {score}</Sub>
          </View>
        </Row>
        <Segmented value={view} onChange={setView} options={[{ value: 'plate', label: 'This plate' }, { value: 'compare', label: 'vs Golden Plate' }]} />
        {view === 'plate' ? (
          <MaskView image={result.photo.uri} read={result.read} focus={focus} ghost={missing.length ? { read: golden.sam!, names: missing } : undefined}>
            <View pointerEvents="none" style={{ position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: good ? color.mint : color.tomato, borderRadius: 30, paddingLeft: 4, paddingRight: 12, paddingVertical: 4, borderWidth: 2, borderColor: '#FFFFFF' }}>
              <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: font.bodyBold, fontSize: 22, lineHeight: 26, color: good ? color.mint : color.tomato }}>{good ? '✓' : '✕'}</Text>
              </View>
              <Text style={{ fontFamily: font.displayBold, fontSize: 17, color: '#FFFFFF' }}>{good ? 'Good' : `${failed.length} to fix`}</Text>
            </View>
          </MaskView>
        ) : (
          <CompareSlider golden={{ image: golden.image, read: golden.sam! }} plate={{ image: result.photo.uri, read: result.read, label: 'This plate' }} height={280} />
        )}
        <View style={{ gap: 6 }}>
          <Label>What the colours are · tap one to see it alone</Label>
          <MaskLegend read={result.read} focus={focus} onFocus={(f) => { setFocus(f); setView('plate'); }} />
          {missing.length > 0 && (
            <Row gap={8}>
              <View style={{ width: 22, height: 0, borderTopWidth: 3, borderStyle: 'dashed', borderColor: color.tomato }} />
              <Text style={{ fontFamily: font.bodySemi, fontSize: 12, color: color.ink }}>Dashed outline: where the Golden Plate has it, missing on this plate</Text>
            </Row>
          )}
        </View>
        <Row style={{ justifyContent: 'space-between' }}>
          <AiTag model="SAM 3.1" ms={result.ms} />
          {result.saved && <Sub style={{ fontSize: 12 }}>Offline: saved SAM run for this photo</Sub>}
        </Row>
      </Card>

      <Label>Every check · Golden Plate v{version} vs this plate</Label>
      {parts.map((part) => {
        const rows = checks.filter((c) => c.part === part);
        const ok = rows.every((c) => c.ok);
        return (
          <Card key={part} soft style={{ gap: 8, borderWidth: ok ? 0 : 3, borderColor: color.tomato }}>
            <Row gap={10}>
              <View style={{ width: 16, height: 16, borderRadius: 5, backgroundColor: rows[0].colour, borderWidth: 2, borderColor: color.ink }} />
              <H2 style={{ fontSize: 17, flex: 1 }}>{part}</H2>
              <Mark ok={ok} size={26} />
            </Row>
            {rows.map((c) => (
              <Row key={c.check} gap={10}>
                <Mark ok={c.ok} />
                <Text style={{ fontFamily: font.bodyBold, fontSize: 14, color: color.ink, width: 92 }}>{c.check}</Text>
                <Text style={{ flex: 1, fontFamily: font.bodySemi, fontSize: 13, color: c.ok ? color.ink2 : color.tomatoInk }}>
                  Golden: {c.golden} · This plate: {c.plate}
                </Text>
              </Row>
            ))}
          </Card>
        );
      })}
      <Button title="Check another plate" onPress={onAgain} />
    </SquishIn>
  );
}

export default function CheckPlate() {
  const [dish, setDish] = useState(DISHES[0]?.name ?? 'Chicken Biryani');
  const cam = useRef<CameraHandle>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState<Photo | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const check = async () => {
    const photo = await cam.current?.snap();
    if (!photo) return;
    setBusy(photo);
    setError(null);
    const t0 = Date.now();
    try {
      const { photos } = await readGolden([photo.dataUrl], partsFor(dish).map(({ name, prompt, colour }) => ({ name, prompt, colour })));
      const r = photos[0];
      if (!r.ok) throw new Error(r.error ?? 'SAM could not read the photo');
      setResult({ photo, read: r, ms: Date.now() - t0 });
    } catch (err) {
      // A demo photo has a saved SAM run, so the check still works when the network does not.
      const saved = shot(photo.demo)?.sam;
      if (saved) setResult({ photo, read: saved, saved: true });
      else setError(`Couldn't check the plate: ${(err as Error).message}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen scroll style={{ paddingBottom: 120 }}>
      <TopBar sub="Before it leaves" title="Check my plate" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {DISHES.map((d) => (
          <Squishy key={d.id} accessibilityRole="radio" accessibilityState={{ selected: d.name === dish }} onPress={() => { setDish(d.name); setResult(null); }}
            style={{ minHeight: 40, paddingHorizontal: 14, borderRadius: 14, justifyContent: 'center', backgroundColor: d.name === dish ? color.ink : color.card }}>
            <Text style={{ fontFamily: font.bodyBold, fontSize: 14, color: d.name === dish ? color.saffron : color.ink }}>{d.name}</Text>
          </Squishy>
        ))}
      </ScrollView>

      {!result ? (
        <Card style={{ gap: 12, padding: 12 }}>
          {busy ? (
            <MaskView image={busy.uri} scanning />
          ) : (
            <LiveCamera ref={cam} height={300} guide="plate" onReady={setReady}
              demo={[...shotsUnder(`${slug(dish)}/pass-`), `${slug(dish)}/golden-1`]} />
          )}
          {busy
            ? <LiveWait text="SAM 3.1 is finding every part" model="SAM 3.1" typical="10–20 s" />
            : <Shutter label="Check this plate" disabled={!ready} onPress={check} />}
          {error && <Text style={{ fontFamily: font.bodyBold, color: color.tomatoInk, textAlign: 'center' }}>{error}</Text>}
          <Sub style={{ fontSize: 13, textAlign: 'center' }}>Hold the phone flat over the plate, like the pass camera.</Sub>
        </Card>
      ) : (
        <Verdict dish={dish} result={result} onAgain={() => setResult(null)} />
      )}
    </Screen>
  );
}
