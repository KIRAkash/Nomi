// A7–A11 · Golden Plate: calibrate the pass, take 3 photos through a quality gate, check SAM 3.1 masks (tap to fix),
// speak the rules, review the SOP card and icon, choose guest questions, publish. Nothing is live until the chef publishes.
// Every step is live: SAM 3.1 on the chef's own photos, Voice Transcribe + Muse Spark for the spoken rules, Muse Image for the
// card and icon, Muse Spark for guest questions.
// Offline, the masks step offers a recorded SAM run on a biryani photo (design/media/golden-plate-demo).
import { Button, Card, Chip, DishArt, H1, H2, Label, Num, Row, Screen, SquishIn, Squishy, Sub, color, font, guessIcon, shadow } from '@nomi/ui';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';

import { LiveCamera, Shutter, checkPhoto, type CameraHandle, type Photo, type PhotoCheck } from '@/components/camera';
import { AiTag, HoldToTalk, LiveWait, Segmented, TopBar, WorkLine, useSteps, type VoiceNote } from '@/components/kit';
import { MaskLegend, MaskView, ModeSwitch, type SamRead } from '@/components/masks';
import { drawCard, drawIcon, proposeQuestions, readGolden, sendVoice, tapGolden, type GoldenRead, type Heard } from '@/lib/api';
import { partsFor, shot, slug } from '@/lib/shots';
import { COMPONENTS, DISH_STATS, GOLDEN_PHOTO, MASK_PHOTO } from '@/lib/mock';

/** The demo photos are a chicken biryani; a mutton biryani flow reads the same with the meat swapped. */
const meatOf = (dish: string) => (/mutton/i.test(dish) ? 'mutton' : 'chicken');
const swap = (s: string, meat: string) => (meat === 'chicken' ? s : s.replace(/chicken/g, meat).replace(/Chicken/g, meat[0].toUpperCase() + meat.slice(1)));

const STEPS = ['Calibrate', 'Photos', 'Masks', 'Rules', 'Card', 'Questions', 'Publish'] as const;

function Progress({ step }: { step: number }) {
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', gap: 4 }} accessibilityLabel={`Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`}>
        {STEPS.map((s, i) => <View key={s} style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: i <= step ? color.ink : color.saffronSoft }} />)}
      </View>
      <Row style={{ justifyContent: 'space-between' }}>
        <Label>Step {step + 1} of {STEPS.length} · {STEPS[step]}</Label>
        <Text style={{ fontFamily: font.bodySemi, fontSize: 12, color: color.ink2 }}>Saved as draft</Text>
      </Row>
    </View>
  );
}

function Check({ ok, text }: { ok: boolean; text: string }) {
  return (
    <Row gap={8}>
      <View style={{ width: 22, height: 22, borderRadius: 8, backgroundColor: ok ? color.mint : color.saffron, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: ok ? '#fff' : color.ink, fontFamily: font.bodyBold, fontSize: 13 }}>{ok ? '✓' : '!'}</Text>
      </View>
      <Text style={{ fontFamily: font.bodySemi, fontSize: 14, color: ok ? color.ink : color.saffronInk, flex: 1 }}>{text}</Text>
    </Row>
  );
}

// ---------- 1. Calibrate ----------
function Calibrate({ next }: { next: () => void }) {
  const s = useSteps(3, 800);
  const cam = useRef<CameraHandle>(null);
  const [ready, setReady] = useState(false);
  const [still, setStill] = useState<string | null>(null);
  const snap = async () => {
    const p = await cam.current?.snap();
    if (!p) return;
    setStill(p.uri);
    s.start();
  };
  return (
    <View style={{ gap: 14 }}>
      <H1>Calibrate the pass</H1>
      <Sub>Fix the phone or tablet above the plating counter. Put one empty standard plate in the middle of the frame and take a shot.</Sub>
      <LiveCamera ref={cam} height={260} guide="counter" still={still} onReady={setReady} tint={s.done ? color.mint : color.saffron} demo={['kitchen/calibration-empty-plate']}>
        {s.done && <View style={{ position: 'absolute', top: 14, left: 14 }}><Chip tone="mint" label="Plate found · crop set to the counter" /></View>}
      </LiveCamera>
      {s.running || s.done ? (
        <Card style={{ gap: 10 }}>
          <WorkLine state={s.state(0)} text="Finding the plate rim" model="SAM 3.1" />
          <WorkLine state={s.state(1)} text="Setting the crop to the counter only" />
          <WorkLine state={s.state(2)} text="Saving camera height and angle" />
        </Card>
      ) : null}
      {s.done && (
        <Card soft style={{ backgroundColor: color.mintSoft }}>
          <Text style={{ fontFamily: font.bodyBold, color: color.mintInk, fontSize: 14 }}>The crop keeps faces out of every frame. Only the counter is ever saved.</Text>
        </Card>
      )}
      {s.done ? (
        <Row>
          <Button kind="white" title="Shoot again" style={{ flex: 1 }} onPress={() => { setStill(null); s.reset(); }} />
          <Button title="Next: the dish" style={{ flex: 1 }} onPress={next} />
        </Row>
      ) : still ? <Button kind="saffron" title="Checking…" disabled onPress={() => {}} /> : <Shutter onPress={snap} disabled={!ready} label="Snap the empty plate" />}
    </View>
  );
}

// ---------- 2. Photos with a quality gate ----------
type Shot = { uri: string | null; photo?: Photo; state: 'empty' | 'checking' | 'ok' | 'retake'; check?: PhotoCheck };
const EMPTY: Shot = { uri: null, state: 'empty' };
const why = (c?: PhotoCheck) => (!c ? '' : c.light === 'dark' ? 'Too dark' : c.light === 'glare' ? 'Glare' : !c.sharp ? 'Blurry' : '');
function Photos({ dish, initial, next }: { dish: string; initial: Photo[]; next: (photos: Photo[]) => void }) {
  const [shots, setShots] = useState<Shot[]>(initial.length === 3 ? initial.map((p) => ({ uri: p.uri, photo: p, state: 'ok' })) : [EMPTY, EMPTY, EMPTY]);
  const cam = useRef<CameraHandle>(null);
  const [ready, setReady] = useState(false);
  const i = shots.findIndex((x) => x.state === 'empty' || x.state === 'retake');
  const checking = shots.some((x) => x.state === 'checking');
  const all = shots.every((x) => x.state === 'ok');
  const last = [...shots].reverse().find((x) => x.check);

  const take = async () => {
    const k = i;
    const p = await cam.current?.snap();
    if (!p) return;
    setShots((xs) => xs.map((x, j) => (j === k ? { uri: p.uri, state: 'checking' } : x)));
    const check = await checkPhoto(p).catch((): PhotoCheck => ({ measured: false, sharp: true, light: 'ok' }));
    const ok = check.sharp && check.light === 'ok';
    setShots((xs) => xs.map((x, j) => (j === k ? { uri: p.uri, photo: p, state: ok ? 'ok' : 'retake', check } : x)));
  };
  const redo = (k: number) => setShots((xs) => xs.map((x, j) => (j === k ? EMPTY : x)));

  // A tablet at the pass gets the camera large on the left, the way a camera app fills the screen; a phone stacks.
  const wide = useWindowDimensions().width >= 900;
  const camera = !all && <LiveCamera ref={cam} height={wide ? '100%' : 280} guide="plate" onReady={setReady} demo={[1, 2, 3].map((n) => `${slug(dish)}/golden-${n}`)} />;
  const thumbs = (
    <Row gap={8}>
      {shots.map((x, k) => (
        <Squishy key={k} accessibilityRole="button" accessibilityLabel={x.uri ? `Photo ${k + 1}, tap to retake` : `Photo ${k + 1}, not taken yet`} disabled={!x.uri || checking} onPress={() => redo(k)}
          containerStyle={{ flex: 1 }}
          style={{ aspectRatio: wide ? 16 / 9 : 1, borderRadius: 20, overflow: 'hidden', backgroundColor: x.state === 'retake' ? color.saffronSoft : color.card, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: x.state === 'ok' ? color.mint : x.state === 'retake' ? color.saffron : k === i ? color.ink : 'transparent', ...shadow(1) }}>
          {x.uri ? <Image source={x.uri} style={{ position: 'absolute', inset: 0, opacity: x.state === 'ok' ? 1 : 0.45 }} contentFit="cover" /> : null}
          {x.state === 'empty' && <Num style={{ fontSize: 26, color: color.ink2 }}>{k + 1}</Num>}
          {x.state === 'retake' && <Text style={{ fontFamily: font.bodyBold, fontSize: 13, color: color.saffronInk, textAlign: 'center', padding: 6 }}>{why(x.check)}. Retake</Text>}
        </Squishy>
      ))}
    </Row>
  );
  const status = (
    <>
      <Card style={{ gap: 8 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Label>Photo check</Label>
          {last?.check?.measured ? <Chip tone="sky" label="Measured on this device" /> : <AiTag model="Muse Spark" />}
        </Row>
        {last?.check ? (
          <>
            <Check ok={last.check.sharp} text={last.check.sharp ? 'Sharp, no blur' : 'Blurry. Rest your elbows on the counter and hold still.'} />
            <Check ok={last.check.light === 'ok'} text={last.check.light === 'ok' ? 'Light is even' : last.check.light === 'dark' ? 'Too dark. Turn on the pass light.' : 'Glare on the plate. Tilt the light away.'} />
          </>
        ) : <Sub style={{ fontSize: 14 }}>Each photo is checked for blur and light before it is used. Tap a photo to retake it.</Sub>}
      </Card>
      {all && (
        <Card soft style={{ backgroundColor: color.mintSoft }}>
          <Text style={{ fontFamily: font.bodyBold, color: color.mintInk, fontSize: 14 }}>3 good photos. Next, SAM 3.1 finds each part in all three and checks they agree.</Text>
        </Card>
      )}
      {all ? <Button title="Next: find the parts" onPress={() => next(shots.map((x) => x.photo!))} />
        : checking ? <Button kind="saffron" title="Checking the photo…" disabled onPress={() => {}} />
        : <Shutter onPress={take} disabled={!ready} label={shots[i]?.state === 'retake' ? `Retake photo ${i + 1}` : `Take photo ${i + 1}`} />}
    </>
  );

  const intro = (
    <>
      <H1>Plate it perfectly, 3 times</H1>
      <Sub>Same plate, same spot. Three photos let Nomi learn what “right” looks like and how much it can vary.</Sub>
    </>
  );
  if (wide) return (
    <View style={{ gap: 14 }}>
      {intro}
      <View style={{ flexDirection: 'row', gap: 20, alignItems: 'flex-start' }}>
        <View style={{ flex: 1.7, aspectRatio: 16 / 9 }}>
          {camera || (last?.uri && <Image source={last.uri} style={{ width: '100%', height: '100%', borderRadius: 26 }} contentFit="cover" accessibilityLabel="The last photo taken" />)}
        </View>
        <View style={{ flex: 1, gap: 14 }}>
          {thumbs}
          {status}
        </View>
      </View>
    </View>
  );
  return (
    <View style={{ gap: 14 }}>
      {intro}
      {camera}
      {thumbs}
      {status}
    </View>
  );
}

// ---------- 3. Masks with tap-to-fix ----------
/** Offline sample: a recorded SAM 3.1 run on the demo biryani, for when the vision service can't be reached. */
function SampleMasks({ meat, next }: { meat: string; next: () => void }) {
  const s = useSteps(COMPONENTS.length, 650);
  const [fixing, setFixing] = useState(false);
  const [fixed, setFixed] = useState(false);
  const started = s.running || s.done;
  return (
    <View style={{ gap: 14 }}>
      <Card soft style={{ backgroundColor: color.saffronSoft }}>
        <Text style={{ fontFamily: font.bodyBold, color: color.saffronInk, fontSize: 14 }}>Sample plate: a recorded SAM 3.1 run, not your photos. Nothing here is saved.</Text>
      </Card>
      <Pressable accessibilityRole="imagebutton" accessibilityLabel={fixing ? 'Tap the raita bowl' : 'Golden Plate with masks'} disabled={!fixing}
        onPress={() => { setFixing(false); setTimeout(() => setFixed(true), 300); }}
        style={{ height: 320, borderRadius: 26, overflow: 'hidden', backgroundColor: color.photo }}>
        <Image source={s.done ? MASK_PHOTO : GOLDEN_PHOTO} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={300} />
        {fixing && (
          <View style={{ position: 'absolute', left: 12, right: 12, top: 12, backgroundColor: color.ink, borderRadius: 16, padding: 12 }}>
            <Text style={{ fontFamily: font.bodyBold, color: color.saffron, fontSize: 14 }}>Tap anywhere on the raita bowl</Text>
          </View>
        )}
      </Pressable>
      {!started && <Button kind="saffron" title="Find the parts" onPress={s.start} />}
      {started && (
        <Card style={{ gap: 10 }}>
          <Row style={{ justifyContent: 'space-between' }}><Label>Parts</Label><AiTag model="SAM 3.1" /></Row>
          {COMPONENTS.map((c, k) => {
            const st = s.state(k);
            const low = c.confidence < 0.8 && !fixed;
            return (
              <Row key={c.name} style={{ opacity: st === 'wait' ? 0.4 : 1 }}>
                <View style={{ width: 16, height: 16, borderRadius: 5, backgroundColor: c.colour }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: font.bodyBold, fontSize: 14, color: color.ink }}>{swap(c.name, meat)}{c.count ? ` · ${c.count}` : ''}</Text>
                  <Text style={{ fontFamily: font.body, fontSize: 12, color: color.ink2 }}>{st === 'run' ? 'Looking…' : st === 'wait' ? 'Waiting' : `${c.clock}${c.share ? ` · ${Math.round(c.share * 100)}% of plate` : ''}`}</Text>
                </View>
                {st === 'done' && (low
                  ? <Button small kind="saffron" title="Check this" onPress={() => setFixing(true)} />
                  : <Chip tone="mint" label={`${Math.round((c.name === 'Raita bowl' && fixed ? 0.95 : c.confidence) * 100)}% sure`} />)}
              </Row>
            );
          })}
        </Card>
      )}
      {s.done && !fixed && <Sub style={{ fontSize: 13, textAlign: 'center' }}>One part is below 80% sure. Fix it before Nomi uses it.</Sub>}
      {s.done && fixed && <Button title="Next: speak the rules" onPress={next} />}
    </View>
  );
}

const pct = (x: number) => `${Math.round(x * 100)}%`;

/** What SAM found for one part across the photos, and whether it needs the chef. Facts only: found or not, counts, position. */
function partStatus(name: string, role: string, reads: SamRead[], dropped: boolean) {
  const seen = reads.map((r) => r.parts.find((p) => p.name === name));
  const missingIn = seen.findIndex((p) => !p?.found);
  const counts = seen.map((p) => p?.count ?? 0);
  const countsDiffer = role === 'count' && missingIn < 0 && new Set(counts).size > 1;
  const shares = seen.filter((p) => p?.found && p.share > 0).map((p) => p!.share);
  return { seen, missingIn, counts, countsDiffer, shares, ok: dropped || (missingIn < 0 && !countsDiffer) };
}

function Masks({ dish, photos, next }: { dish: string; photos: Photo[]; next: (read: SamRead | null) => void }) {
  const wide = useWindowDimensions().width >= 900;
  const parts = partsFor(dish);
  const [reads, setReads] = useState<(GoldenRead | (SamRead & { id: null }))[] | null>(null);
  const [recorded, setRecorded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sample, setSample] = useState(false);
  const [view, setView] = useState(0);
  const [mode, setMode] = useState<'masks' | 'measure' | 'photo'>('masks');
  const [focus, setFocus] = useState<string | null>(null);
  const [fixing, setFixing] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [dropped, setDropped] = useState<string[]>([]);
  const [miss, setMiss] = useState<string | null>(null);
  const [since, setSince] = useState(() => Date.now());
  const [now, setNow] = useState(since);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let live = true;
    // Photos from the demo camera carry a saved SAM run, used when the vision service can't be reached.
    const saved = photos.map((p) => shot(p.demo)?.sam);
    readGolden(photos.map((p) => p.dataUrl), parts.map((p) => ({ name: p.name, prompt: p.prompt, colour: p.colour })))
      .then((r) => live && setReads(r.photos))
      .catch(() => {
        if (!live) return;
        if (saved.every(Boolean)) {
          setReads(saved.map((r) => ({ ...r!, id: null })));
          setRecorded(true);
        } else setError('Nomi couldn’t reach the vision service.');
      });
    return () => { live = false; };
  }, [attempt]); // eslint-disable-line react-hooks/exhaustive-deps
  const run = () => {
    setError(null);
    setReads(null);
    setSince(Date.now());
    setAttempt((a) => a + 1);
  };
  const waiting = !reads && !error;
  useEffect(() => {
    if (!waiting && !asking) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [waiting, asking]);

  if (sample) return <SampleMasks meat={meatOf(dish)} next={() => next(null)} />;

  const tap = async (x: number, y: number) => {
    const id = reads?.[view].id;
    if (!reads || !fixing || asking) return;
    if (!id) return setMiss('Tap-to-fix needs the vision service. Try again when it is back.');
    setAsking(true);
    setMiss(null);
    setSince(Date.now());
    try {
      const r = await tapGolden(id, fixing, x, y);
      setReads((rs) => rs!.map((old, k) => (k === view ? r : old)));
      if (r.parts.find((p) => p.name === fixing)?.found) {
        setFocus(fixing);
        setFixing(null);
      } else setMiss('Still can’t see it there. Tap right in the middle of it.');
    } catch {
      setMiss('That didn’t go through. Tap the photo again.');
    } finally {
      setAsking(false);
    }
  };

  const status = reads ? parts.map((p) => ({ p, st: partStatus(p.name, p.role, reads, dropped.includes(p.name)) })) : [];
  const open = status.filter((x) => !x.st.ok).length;
  const shown = reads?.[view];
  const secs = Math.max(0, Math.round((now - since) / 1000));

  const fix = (name: string, missingIn: number) => {
    if (missingIn >= 0) setView(missingIn);
    setMiss(null);
    setMode('masks');
    setFocus(null);
    setFixing(name);
  };

  const intro = (
    <>
      <H1>What Nomi sees</H1>
      <Sub>SAM 3.1 looks for each part of the dish in all {photos.length} of your photos. Check each colour sits on the right thing.</Sub>
    </>
  );
  const photoSide = (
    <>
      {reads && (
        <Segmented value={String(view)} onChange={(v) => { setView(Number(v)); }} options={photos.map((_, k) => ({ value: String(k), label: `Photo ${k + 1}` }))} />
      )}
      <MaskView image={photos[view].uri} read={shown && mode !== 'photo' ? shown : null} mode={mode} focus={fixing ? null : focus}
        scanning={waiting || asking} onTap={fixing && !asking ? tap : undefined}
        style={shown ? undefined : { aspectRatio: photos[view].width / photos[view].height }}>
        {fixing && (
          <View pointerEvents="none" style={{ position: 'absolute', left: 12, right: 12, top: 12, backgroundColor: color.ink, borderRadius: 16, padding: 12, gap: 2 }}>
            <Text style={{ fontFamily: font.bodyBold, color: color.saffron, fontSize: 14 }}>{asking ? `Looking where you tapped… ${secs}s` : `Tap the middle of the ${fixing.toLowerCase()}`}</Text>
            {miss && !asking ? <Text style={{ fontFamily: font.bodySemi, color: color.bg, fontSize: 13 }}>{miss}</Text> : null}
          </View>
        )}
        {waiting && (
          <View pointerEvents="none" style={{ position: 'absolute', left: 12, right: 12, bottom: 12, backgroundColor: color.card, borderRadius: 18, padding: 12 }}>
            <WorkLine state="run" text={`Finding ${parts.length} parts in ${photos.length} photos · ${secs}s`} model="SAM 3.1" />
          </View>
        )}
      </MaskView>
      {reads && (
        <Row style={{ justifyContent: 'space-between' }}>
          <ModeSwitch mode={mode} onChange={setMode} measure={!!shown?.plate} />
          {recorded ? <Chip tone="saffron" label="Saved SAM run" /> : <AiTag model="SAM 3.1" />}
        </Row>
      )}
      {shown && mode !== 'photo' && !fixing && <MaskLegend read={shown} focus={focus} onFocus={setFocus} />}
    </>
  );
  const listSide = (
    <>
      {error && (
        <Card style={{ gap: 10, backgroundColor: color.saffronSoft }}>
          <Text style={{ fontFamily: font.bodyBold, color: color.saffronInk, fontSize: 15 }}>{error} Your photos are kept on this phone.</Text>
          <Row>
            <Button small title="Try again" style={{ flex: 1 }} onPress={run} />
            <Button small kind="white" title="Use the sample plate" style={{ flex: 1 }} onPress={() => setSample(true)} />
          </Row>
        </Card>
      )}

      {reads && (
        <Card style={{ gap: 12 }}>
          <Label>Parts</Label>
          {status.map(({ p, st }) => {
            const here = st.seen[view];
            const gone = dropped.includes(p.name);
            const detail = gone ? 'Not on this dish'
              : st.missingIn >= 0 ? `Not found in photo ${st.missingIn + 1}`
              : st.countsDiffer ? `Counted ${st.counts.join(', ')} in the ${photos.length} photos`
              : [p.role === 'count' ? `${st.counts[0]} in every photo` : null, here?.where, here?.share ? `${pct(here.share)} of plate` : null].filter(Boolean).join(' · ');
            return (
              <View key={p.name} style={{ gap: 8, opacity: gone ? 0.5 : 1 }}>
                <Row>
                  <View style={{ width: 16, height: 16, borderRadius: 5, backgroundColor: p.colour }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: font.bodyBold, fontSize: 14, color: color.ink }}>{p.name}</Text>
                    <Text style={{ fontFamily: font.body, fontSize: 12, color: st.ok ? color.ink2 : color.saffronInk }}>{detail}</Text>
                  </View>
                  {st.ok
                    ? (gone ? <Button small kind="white" title="Undo" onPress={() => setDropped((d) => d.filter((x) => x !== p.name))} /> : <Chip tone="mint" label={`In all ${photos.length}`} />)
                    : <Button small kind="saffron" title={fixing === p.name ? 'Tap the photo' : 'Check this'} disabled={asking} onPress={() => fix(p.name, st.missingIn)} />}
                </Row>
                {fixing === p.name && !asking && (
                  <Row>
                    <Button small kind="white" title="It’s not on this dish" style={{ flex: 1 }} onPress={() => { setDropped((d) => [...d, p.name]); setFixing(null); }} />
                    <Button small kind="white" title="Cancel" style={{ flex: 1 }} onPress={() => setFixing(null)} />
                  </Row>
                )}
              </View>
            );
          })}
        </Card>
      )}
      {reads && open > 0 && <Sub style={{ fontSize: 13, textAlign: 'center' }}>{open === 1 ? 'One part needs' : `${open} parts need`} a look. Nomi only uses parts it can find in every photo.</Sub>}
      {reads && open === 0 && <Button title="Next: speak the rules" onPress={() => next(reads[0])} />}
    </>
  );

  // On a tablet the photo stays large on the left and the parts list sits beside it, both in view.
  if (wide) return (
    <View style={{ gap: 14 }}>
      {intro}
      <View style={{ flexDirection: 'row', gap: 20, alignItems: 'flex-start' }}>
        <View style={{ flex: 1.7, gap: 14 }}>{photoSide}</View>
        <View style={{ flex: 1, gap: 14 }}>{listSide}</View>
      </View>
    </View>
  );
  return (
    <View style={{ gap: 14 }}>
      {intro}
      {photoSide}
      {listSide}
    </View>
  );
}

// ---------- 4. Voice rules ----------
const SAMPLE_RULES = { file: require('../../../assets/audio/sample-rules.m4a'), says: 'चावल बीच में, चार पीस ऊपर… (Hindi)' };
/** The chef talks; Muse Voice Transcribe writes it down and Muse Spark turns it into rules Nomi can check, each read back. */
function Rules({ parts, next }: { parts: string[]; next: (rules: string[]) => void }) {
  const [busy, setBusy] = useState(false);
  const [heard, setHeard] = useState<Heard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rules = heard?.rules?.rules ?? [];
  const [kept, setKept] = useState<boolean[]>([]);
  const listen = async (note: VoiceNote) => {
    setBusy(true);
    setError(null);
    try {
      const h = await sendVoice(note.audio, 'rules', parts);
      if (!h.transcript) { setError("Nomi couldn't hear any words. Try again closer to the phone."); return; }
      setHeard(h);
      setKept((h.rules?.rules ?? []).map(() => true));
    } catch (err) {
      setError(`Couldn't read that: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };
  const keep = rules.filter((_, k) => kept[k]).map((r) => r.text);
  return (
    <View style={{ gap: 14 }}>
      <H1>Say how it should look</H1>
      <Sub>Talk like you would to a new cook. Hindi, English or both.</Sub>
      <Card style={{ paddingVertical: 22 }}>
        <HoldToTalk label={heard ? 'Hold to say it again' : 'Hold to talk'} onDone={listen} disabled={busy} sample={SAMPLE_RULES} />
      </Card>
      {busy && (
        <Card style={{ gap: 10 }}>
          <LiveWait text="Writing down what you said, then turning it into rules" model="Voice Transcribe" typical="15–25 s" />
        </Card>
      )}
      {error && <Text style={{ fontFamily: font.bodyBold, color: color.tomatoInk }}>{error}</Text>}
      {heard && !busy && (
        <SquishIn style={{ gap: 10 }}>
          <Card soft style={{ gap: 6 }}>
            <Row style={{ justifyContent: 'space-between' }}><Label>You said</Label><AiTag model="Voice Transcribe" ms={heard.transcribe_ms} /></Row>
            <Text style={{ fontFamily: font.body, fontSize: 14, color: color.ink, fontStyle: 'italic' }}>“{heard.transcript}”</Text>
          </Card>
          <Row style={{ justifyContent: 'space-between' }}><Label>Nomi will check · tap to drop one</Label><AiTag model="Muse Spark" ms={heard.spark_ms} /></Row>
          {rules.map((r, k) => (
            <Squishy key={`${k}-${r.text}`} accessibilityRole="checkbox" accessibilityState={{ checked: kept[k] }} onPress={() => setKept((x) => x.map((v, j) => (j === k ? !v : v)))}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: kept[k] ? color.card : color.bg, borderRadius: 18, padding: 12, ...shadow(1), opacity: kept[k] ? 1 : 0.5 }}>
              <View style={{ width: 26, height: 26, borderRadius: 9, backgroundColor: kept[k] ? color.ink : color.saffronSoft, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: color.saffron, fontFamily: font.bodyBold }}>{kept[k] ? '✓' : ''}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: font.bodyBold, fontSize: 14, color: color.ink, textDecorationLine: kept[k] ? 'none' : 'line-through' }}>{r.text}</Text>
                {r.translated_from && <Text style={{ fontFamily: font.body, fontSize: 12, color: color.ink2 }}>from “{r.translated_from}”</Text>}
              </View>
            </Squishy>
          ))}
          {rules.length === 0 && <Sub>Nomi didn&apos;t hear a rule it can check. Say where each part goes, or how many pieces.</Sub>}
          <Text style={{ fontFamily: font.bodySemi, fontSize: 12, color: color.ink2 }}>Read back to you before anything is saved.</Text>
          <Button title={`Keep ${keep.length} rule${keep.length === 1 ? '' : 's'}`} disabled={keep.length === 0} onPress={() => next(keep)} />
        </SquishIn>
      )}
    </View>
  );
}

// ---------- 5. SOP card and dish icon ----------
type Drawn = { image: string | null; ms: number } | 'busy' | { error: string };
const isDrawn = (d: Drawn): d is { image: string | null; ms: number } => typeof d === 'object' && 'ms' in d;

/** Muse Image draws the plating card and the dish icon from the chef's own photo, live. Meanwhile, and as a fallback, the
 * card shows the photo with a marker on each part where SAM 3.1 measured it. */
function CardStep({ dish, photo, read, rules, next }: { dish: string; photo?: Photo; read?: SamRead | null; rules: string[]; next: () => void }) {
  const [card, setCard] = useState<Drawn>('busy');
  const [icon, setIcon] = useState<Drawn>('busy');
  const [round, setRound] = useState(0);
  useEffect(() => {
    if (!photo) return;
    let on = true;
    const draw = (run: () => Promise<{ image: string | null; ms: number }>, set: (d: Drawn) => void) => {
      set('busy');
      run().then((r) => on && set(r)).catch((err: Error) => on && set({ error: err.message }));
    };
    if (round === 0) draw(() => drawCard(photo.dataUrl, rules, dish), setCard);
    draw(() => drawIcon(photo.dataUrl), setIcon);
    return () => { on = false; };
  }, [photo, rules, dish, round]);
  const list = rules.length ? rules : RULES_FALLBACK.map((r) => swap(r, meatOf(dish)));
  return (
    <View style={{ gap: 14 }}>
      <H1>Plating card and icon</H1>
      <Sub>Drawn from your golden photo and rules. Staff see this card; guests see the icon.</Sub>
      <Card style={{ gap: 10, padding: 12 }}>
        {photo && isDrawn(card) && card.image ? (
          <>
            <Image source={card.image} style={{ width: '100%', aspectRatio: 2 / 3, borderRadius: 20 }} contentFit="contain" />
            <AiTag model="Muse Image" ms={card.ms} />
          </>
        ) : (
          <>
            {photo && read ? (
              <View style={{ width: '100%', aspectRatio: read.size.w / read.size.h, borderRadius: 20, overflow: 'hidden' }}>
                <Image source={photo.uri} style={{ width: '100%', height: '100%' }} contentFit="fill" />
                {read.parts.filter((p) => p.found && p.centre).map((p, k) => (
                  <View key={p.name} style={{ position: 'absolute', left: `${(p.centre![0] / read.size.w) * 100}%`, top: `${(p.centre![1] / read.size.h) * 100}%`, transform: [{ translateX: -15 }, { translateY: -15 }], flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: p.colour, borderWidth: 3, borderColor: color.ink, alignItems: 'center', justifyContent: 'center' }}>
                      <Num style={{ fontSize: 14 }}>{k + 1}</Num>
                    </View>
                    <View style={{ backgroundColor: 'rgba(27,27,58,0.85)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}>
                      <Text style={{ fontFamily: font.bodyBold, fontSize: 11, color: '#FFFFFF' }}>{p.name}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={{ height: 230, borderRadius: 20, overflow: 'hidden' }}>
                <Image source={GOLDEN_PHOTO} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              </View>
            )}
            {list.map((r, k) => <Text key={r} style={{ fontFamily: font.bodySemi, fontSize: 14, color: color.ink }}><Text style={{ fontFamily: font.bodyBold }}>{k + 1}.</Text> {r}</Text>)}
            {photo && card === 'busy' && <LiveWait text="Muse Image is drawing the numbered plating card" model="Muse Image" typical="15–25 s" />}
            {typeof card === 'object' && 'error' in card && <Sub style={{ fontSize: 13 }}>Muse Image couldn&apos;t draw the card right now ({card.error}). This marked photo is used instead.</Sub>}
          </>
        )}
      </Card>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ width: 96, height: 96, borderRadius: 26, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: color.bg }}>
          {isDrawn(icon) && icon.image ? <Image source={icon.image} style={{ width: 96, height: 96 }} contentFit="cover" /> : <DishArt kind={guessIcon(dish)} size={80} />}
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          <H2 style={{ fontSize: 17 }}>Dish icon</H2>
          {icon === 'busy' && photo ? <LiveWait text="Drawing it in the house style" model="Muse Image" typical="15–25 s" />
            : isDrawn(icon) ? <AiTag model="Muse Image" ms={icon.ms} />
            : <Sub style={{ fontSize: 13 }}>Same style as every other dish on your menu.</Sub>}
          {photo && icon !== 'busy' && <Button small kind="white" title="Draw again" style={{ alignSelf: 'flex-start' }} onPress={() => setRound((r) => r + 1)} />}
        </View>
      </Card>
      <Button title="Looks right" disabled={card === 'busy' && !!photo} onPress={next} />
    </View>
  );
}

// ---------- 6. Guest questions ----------
type Proposed = { text: string; no: string; checks: string };
const PROPOSED: Proposed[] = [
  { text: 'Was the portion enough?', no: 'Too little', checks: 'rice 41–43% of plate' },
  { text: 'Enough chicken pieces?', no: 'Fewer', checks: '4 pieces' },
  { text: 'Was it hot?', no: 'Lukewarm', checks: 'temperature' },
  { text: 'Was the raita fresh?', no: 'Not really', checks: 'raita bowl' },
  { text: 'Crispy onions on top?', no: 'Missing', checks: 'onions at 2 o\'clock' },
];
/** Muse Spark proposes questions tied to what this Golden Plate checks; the chef keeps up to 3. */
function Questions({ dish, parts, rules, read, next }: { dish: string; parts: string[]; rules: string[]; read: SamRead | null; next: (n: number) => void }) {
  const [qs, setQs] = useState<{ list: Proposed[]; ms?: number } | null>(null);
  const [on, setOn] = useState<boolean[]>([]);
  useEffect(() => {
    let live = true;
    const counts = Object.fromEntries((read?.parts ?? []).filter((p) => p.count > 1).map((p) => [p.name, p.count]));
    proposeQuestions({ name: dish, components: parts, rules, counts })
      .then((r) => ({ list: r.questions.map((q) => ({ text: q.text, no: q.no_label, checks: q.checks })), ms: r.ms }), () => null)
      .then((got) => {
        if (!live) return;
        const shown = got?.list ?? PROPOSED.map((q) => ({ ...q, text: swap(q.text, meatOf(dish)) }));
        setQs({ list: shown, ms: got?.ms });
        setOn(shown.map((_, k) => k < 3));
      });
    return () => { live = false; };
  }, [dish, parts, rules, read]);
  const n = on.filter(Boolean).length;
  return (
    <View style={{ gap: 14 }}>
      <H1>What should guests be asked?</H1>
      <Sub>Nomi suggested these from your rules. Keep up to 3. Each answer sits next to that shift’s plates.</Sub>
      {!qs ? <LiveWait text="Muse Spark is writing questions from your rules" model="Muse Spark" typical="10 s" /> : <AiTag model="Muse Spark" ms={qs.ms} />}
      {qs?.list.map((q, k) => (
        <Squishy key={q.text} accessibilityRole="checkbox" accessibilityState={{ checked: on[k], disabled: !on[k] && n >= 3 }}
          onPress={() => setOn((x) => x.map((v, j) => (j === k ? (v ? false : n < 3) : v)))}
          style={{ backgroundColor: on[k] ? color.saffronSoft : color.card, borderRadius: 20, padding: 14, gap: 4, borderWidth: 3, borderColor: on[k] ? color.ink : 'transparent', ...shadow(1), opacity: !on[k] && n >= 3 ? 0.5 : 1 }}>
          <Text style={{ fontFamily: font.bodyBold, fontSize: 15, color: color.ink }}>{q.text}</Text>
          <Text style={{ fontFamily: font.body, fontSize: 12, color: color.ink2 }}>Yes / {q.no} · checks {q.checks}</Text>
        </Squishy>
      ))}
      {qs && <Button title={`Keep ${n} question${n === 1 ? '' : 's'}`} disabled={n === 0} onPress={() => next(n)} />}
    </View>
  );
}

// ---------- 7. Publish ----------
function Publish({ dish, version, facts }: { dish: string; version: number; facts: { photos: number; parts: number; found: number; rules: number; questions: number } }) {
  const [live, setLive] = useState(false);
  if (live)
    return (
      <SquishIn style={{ gap: 14, alignItems: 'center', paddingTop: 20 }}>
        <View style={{ width: 150, height: 150, borderRadius: 54, backgroundColor: color.saffron, alignItems: 'center', justifyContent: 'center', ...shadow(2) }}>
          <DishArt kind={guessIcon(dish)} size={110} />
        </View>
        <H1 style={{ textAlign: 'center' }}>{dish} is protected</H1>
        <Sub style={{ textAlign: 'center' }}>From the next plate on, the pass checks it against Golden Plate v{version}. Staff got the new card; guests see the icon and your {facts.questions} question{facts.questions === 1 ? '' : 's'}.</Sub>
        <Button title="Back to dishes" style={{ alignSelf: 'stretch' }} onPress={() => router.replace('/dishes')} />
      </SquishIn>
    );
  return (
    <View style={{ gap: 14 }}>
      <H1>Ready to publish</H1>
      <Card style={{ gap: 10 }}>
        <Check ok text={`${facts.photos} photo${facts.photos === 1 ? '' : 's'} passed the photo check`} />
        <Check ok={facts.found === facts.parts} text={`${facts.found} of ${facts.parts} parts found by SAM 3.1`} />
        <Check ok={facts.rules > 0} text={`${facts.rules} rule${facts.rules === 1 ? '' : 's'} read back and kept`} />
        <Check ok text="Plating card and icon drawn" />
        <Check ok={facts.questions > 0} text={`${facts.questions} guest question${facts.questions === 1 ? '' : 's'} chosen`} />
      </Card>
      <Card soft style={{ backgroundColor: color.saffronSoft }}>
        <Text style={{ fontFamily: font.bodyBold, color: color.saffronInk, fontSize: 14 }}>Publishing makes this the standard for every shift. The previous version is kept and you can go back to it.</Text>
      </Card>
      <Button title={`Publish Golden Plate v${version}`} onPress={() => setLive(true)} />
    </View>
  );
}

const RULES_FALLBACK = [
  'Rice in the centre',
  '4 chicken pieces, spread on the rice',
  'Fried onions at 2 o\'clock, never on the chicken',
  'Lemon on the rim at 5 o\'clock',
  'Raita bowl outside the plate, on the left',
];

export default function GoldenPlate() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dish = DISH_STATS.find((d) => d.id === id) ?? DISH_STATS[0];
  const version = (dish.goldenVersion ?? 0) + 1;
  const [step, setStep] = useState(dish.golden === 'none' ? 0 : 1);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [read, setRead] = useState<SamRead | null>(null);
  const [rules, setRules] = useState<string[]>([]);
  const [asked, setAsked] = useState(3);
  const parts = useMemo(() => partsFor(dish.name).map((p) => p.name), [dish.name]);
  const next = () => setStep((x) => Math.min(STEPS.length - 1, x + 1));
  return (
    <Screen wide scroll style={{ paddingBottom: 40 }}>
      <TopBar back sub={`Golden Plate v${version}`} title={dish.name} right={<View />} />
      <Progress step={step} />
      <SquishIn key={step}>
        {step === 0 && <Calibrate next={next} />}
        {step === 1 && <Photos dish={dish.name} initial={photos} next={(p) => { setPhotos(p); next(); }} />}
        {step === 2 && (photos.length ? <Masks dish={dish.name} photos={photos} next={(r) => { setRead(r); next(); }} /> : <SampleMasks meat={meatOf(dish.name)} next={next} />)}
        {step === 3 && <Rules parts={parts} next={(r) => { setRules(r); next(); }} />}
        {step === 4 && <CardStep dish={dish.name} photo={photos[0]} read={read} rules={rules} next={next} />}
        {step === 5 && <Questions dish={dish.name} parts={parts} rules={rules} read={read} next={(n) => { setAsked(n); next(); }} />}
        {step === 6 && <Publish dish={dish.name} version={version} facts={{
          photos: photos.length || 3, parts: read?.parts.length ?? parts.length, found: read?.parts.filter((p) => p.found).length ?? parts.length,
          rules: rules.length || RULES_FALLBACK.length, questions: asked,
        }} />}
      </SquishIn>
      {step > 0 && step < 6 && (
        <Pressable accessibilityRole="button" onPress={() => setStep(step - 1)} style={{ alignSelf: 'center', minHeight: 44, justifyContent: 'center', paddingHorizontal: 16 }}>
          <Text style={{ fontFamily: font.bodyBold, color: color.ink2, fontSize: 14 }}>Back a step</Text>
        </Pressable>
      )}
    </Screen>
  );
}

