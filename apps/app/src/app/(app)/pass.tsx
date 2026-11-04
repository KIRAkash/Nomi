// A14 · PASS: the tablet over the plating counter. "Check this plate" sends the frame to the API, which streams each stage
// as it happens: Glimmer on site keeps the frame only if a plate is in it (faces blurred), the dish comes from the ticket
// tap (or Muse Spark names it), SAM 3.1 finds every part, and the vision worker scores them against the dish's Golden Plate
// signature. Anything off shows a quiet amber nudge. No sound, no blame.
import type { PassCheck, PassComponent } from '@nomi/shared';
import { Button, Chip, H1, H2, Label, Num, Row, Screen, SquishIn, Squishy, color, font } from '@nomi/ui';
import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';

import { LiveCamera, type CameraHandle, type Photo } from '@/components/camera';
import { CompareSlider, MaskView } from '@/components/masks';
import { AiTag, Score, WorkLine } from '@/components/kit';
import { checkPass, type StageEvent } from '@/lib/api';
import { DISH_STATS } from '@/lib/mock';
import type { Stage } from '@/lib/nightshift';
import { goldenShot, shotsUnder, slug } from '@/lib/shots';

const TICKETS = DISH_STATS.filter((d) => d.golden === 'published').map((d) => d.name);
// Demo camera: the pass photos of each dish on the ticket rail, the good ones first.
const FEED = shotsUnder(...TICKETS.map((t) => `${slug(t)}/pass-`)).sort((a, b) => Number(b.endsWith('-good')) - Number(a.endsWith('-good')));
const STAGES = [
  { id: 'glimmer', wait: 'Glimmer checks the frame on site', model: 'Glimmer (on site)' as const },
  { id: 'dish', wait: 'Which dish', model: undefined },
  { id: 'sam', wait: 'SAM 3.1 finds each part', model: 'SAM 3.1' as const },
  { id: 'score', wait: 'Compare with the Golden Plate', model: undefined },
];
const NUDGE_BELOW = 80;

/** One part's line under the result: found or not, pieces, position, plate area against the Golden Plate. */
function partText(c: PassComponent) {
  if (!c.found) return 'not found';
  const bits = [];
  if (c.golden_count !== null) bits.push(`${c.count} of ${c.golden_count}`);
  if (c.kind === 'position') bits.push(c.where ?? 'moved');
  if (c.area_vs_golden !== null) bits.push(`${c.area_vs_golden > 0 ? '+' : c.area_vs_golden < 0 ? '−' : '±'}${Math.abs(c.area_vs_golden)}% area`);
  return bits.join(' · ') || (c.where ?? 'there');
}

function Parts({ result }: { result: PassCheck }) {
  return (
    <View style={{ gap: 6 }}>
      {result.components.map((c) => (
        <Row key={c.name} gap={8}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c.colour }} />
          <Text style={{ flex: 1, fontFamily: font.bodySemi, fontSize: 14, color: color.ink }}>{c.name}</Text>
          <Text style={{ fontFamily: font.bodyBold, fontSize: 13, color: c.ok ? color.mintInk : color.ink }}>{c.ok ? '✓ ' : ''}{partText(c)}</Text>
        </Row>
      ))}
    </View>
  );
}

export default function Pass() {
  const { width } = useWindowDimensions();
  const wide = width >= 820;
  const [ticket, setTicket] = useState<string | null>(null);
  const [log, setLog] = useState<{ score: number; dish: string; time: string }[]>([
    { score: 91, dish: 'Butter Chicken', time: '21:38' }, { score: 88, dish: 'Dal Makhani', time: '21:36' }, { score: 79, dish: 'Paneer Tikka', time: '21:31' },
  ]);
  const [dropped, setDropped] = useState(41);

  const cam = useRef<CameraHandle>(null);
  const [ready, setReady] = useState(false);
  const [frame, setFrame] = useState<Photo | null>(null);
  const [phase, setPhase] = useState<'idle' | 'running' | 'done' | 'dropped' | 'error'>('idle');
  const [stages, setStages] = useState<Record<string, Stage>>({});
  const [parts, setParts] = useState<{ names: string[]; seen: Record<string, number> }>({ names: [], seen: {} });
  const [result, setResult] = useState<(PassCheck & { ms: number }) | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const onEvent = (e: StageEvent) => {
    if (e.type === 'stage' && e.id && e.state) {
      setStages((s) => ({ ...s, [e.id!]: { state: e.state!, text: e.text ?? s[e.id!]?.text, ms: e.ms } }));
      if (e.id === 'sam' && Array.isArray(e.parts)) setParts({ names: e.parts as string[], seen: {} });
    } else if (e.type === 'part') setParts((p) => ({ ...p, seen: { ...p.seen, [e.name as string]: e.objects as number } }));
  };

  const check = async () => {
    const p = await cam.current?.snap();
    if (!p) return;
    setFrame(p);
    setPhase('running');
    setStages({});
    setParts({ names: [], seen: {} });
    setResult(null);
    setNote(null);
    try {
      const r = await checkPass(p.dataUrl, ticket ? DISH_STATS.find((d) => d.name === ticket)!.id : null, onEvent);
      if ('dropped' in r) {
        setDropped((x) => x + 1);
        setNote(`${r.reason}: the frame was dropped and not scored.`);
        setPhase('dropped');
      } else {
        setResult(r);
        setTicket(r.dish);
        setPhase('done');
      }
    } catch (err) {
      setNote((err as Error).message);
      setPhase('error');
    }
  };
  const clear = () => {
    if (result) {
      const now = new Date();
      setLog((l) => [{ score: result.score, dish: result.dish, time: `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}` }, ...l].slice(0, 6));
    }
    setFrame(null);
    setResult(null);
    setTicket(null);
    setStages({});
    setPhase('idle');
  };

  const golden = result ? goldenShot(result.dish) : null;
  const missing = result?.components.filter((c) => c.kind === 'missing').map((c) => c.name) ?? [];
  const nudge = !!result && (result.score < NUDGE_BELOW || missing.length > 0);
  const shownFrame = result?.frame ?? frame?.uri ?? null;
  const read = result ? { ok: true, ...result.read } : null;
  const tags = result && (
    <Row gap={6} style={{ flexWrap: 'wrap' }}>
      {result.glimmer.ran && <AiTag model="Glimmer (on site)" ms={stages.glimmer?.ms} />}
      {stages.dish?.ms !== undefined && <AiTag model="Muse Spark" ms={stages.dish.ms} />}
      <AiTag model="SAM 3.1" ms={stages.sam?.ms} />
    </Row>
  );

  const camera = (
    <View style={{ flex: wide ? 1.2 : undefined, minHeight: 300 }}>
      {shownFrame && (phase === 'running' || phase === 'done') ? (
        <MaskView image={shownFrame} read={read} scanning={phase === 'running'} style={{ height: wide ? 440 : 300, aspectRatio: 'auto' }}
          ghost={result && golden?.sam ? { read: golden.sam, names: missing } : undefined}>
          <View style={{ position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(27,27,58,0.8)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color.saffron }} />
            <Text style={{ fontFamily: font.bodyBold, fontSize: 12, color: color.bg }}>
              {phase === 'running' ? (stages.sam?.state === 'run' ? 'SAM 3.1 is looking…' : 'Checking the frame…') : result?.frame ? 'Faces blurred · counter only' : 'Frame kept · counter only'}
            </Text>
          </View>
        </MaskView>
      ) : (
        <LiveCamera ref={cam} height={wide ? '100%' : 300} guide="counter" still={phase === 'dropped' ? frame?.uri : null} onReady={setReady} demo={FEED}>
          <View style={{ position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(27,27,58,0.8)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color.mint }} />
            <Text style={{ fontFamily: font.bodyBold, fontSize: 12, color: color.bg }}>Live · counter only</Text>
          </View>
          {ready && <Text style={{ position: 'absolute', bottom: 16, fontFamily: font.bodyBold, color: color.saffronSoft, fontSize: 14 }}>Waiting for a plate</Text>}
        </LiveCamera>
      )}
    </View>
  );

  const panel = (
    <View style={{ flex: wide ? 1 : undefined, gap: 12 }}>
      {phase === 'idle' || phase === 'dropped' || phase === 'error' ? (
        <View style={{ backgroundColor: '#2A2440', borderRadius: 24, padding: 16, gap: 10 }}>
          <Label style={{ color: color.saffronSoft }}>On the ticket</Label>
          <Row gap={8} style={{ flexWrap: 'wrap' }}>
            {TICKETS.map((t) => (
              <Squishy key={t} accessibilityRole="button" accessibilityState={{ selected: ticket === t }} onPress={() => setTicket(ticket === t ? null : t)}
                style={{ minHeight: 44, paddingHorizontal: 14, borderRadius: 16, justifyContent: 'center', backgroundColor: ticket === t ? color.saffron : 'rgba(255,244,214,0.12)' }}>
                <Text style={{ fontFamily: font.bodyBold, fontSize: 14, color: ticket === t ? color.ink : color.bg }}>{t}</Text>
              </Squishy>
            ))}
          </Row>
          <Text style={{ fontFamily: font.body, fontSize: 13, color: color.saffronSoft }}>No tap? Muse Spark names the dish from the frame.</Text>
          {note && <Text accessibilityLiveRegion="polite" style={{ fontFamily: font.bodySemi, fontSize: 14, color: color.saffron }}>{note}</Text>}
        </View>
      ) : (
        <View style={{ backgroundColor: '#2A2440', borderRadius: 24, padding: 16, gap: 10 }}>
          {STAGES.map((st) => {
            const s = stages[st.id];
            return (
              <View key={st.id} style={{ gap: 6 }}>
                <WorkLine dark state={s?.state ?? 'wait'} text={s?.text ?? st.wait} ms={s?.ms}
                  model={st.id === 'dish' ? (s?.ms !== undefined || s?.state === 'run' ? 'Muse Spark' : undefined) : st.model} />
                {st.id === 'sam' && parts.names.length > 0 && (
                  <Row gap={6} style={{ flexWrap: 'wrap', paddingLeft: 34 }}>
                    {parts.names.map((n) => {
                      const k = parts.seen[n];
                      return (
                        <View key={n} style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, backgroundColor: k === undefined ? 'rgba(255,244,214,0.12)' : k ? color.mintSoft : color.saffron }}>
                          <Text style={{ fontFamily: font.bodyBold, fontSize: 12, color: k === undefined ? color.saffronSoft : color.ink }}>
                            {n}{k === undefined ? '…' : k ? (k > 1 ? ` ×${k}` : ' ✓') : ': none'}
                          </Text>
                        </View>
                      );
                    })}
                  </Row>
                )}
              </View>
            );
          })}
        </View>
      )}

      {result && !nudge && (
        <SquishIn>
          <View style={{ backgroundColor: color.mintSoft, borderRadius: 24, padding: 16, gap: 12 }}>
            <Row gap={14}>
              <Score value={result.score} size={64} />
              <View style={{ flex: 1 }}>
                <H2>{result.reasons.length ? 'Close to the Golden Plate' : 'Matches the Golden Plate'}</H2>
                <Text style={{ fontFamily: font.bodySemi, color: color.mintInk }}>Good to go.</Text>
              </View>
            </Row>
            <Parts result={result} />
            {tags}
          </View>
        </SquishIn>
      )}

      {result && nudge && (
        <SquishIn>
          <View accessibilityLiveRegion="polite" style={{ backgroundColor: color.saffron, borderRadius: 24, padding: 16, gap: 12 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <H2>Quick look before it goes</H2>
              <Num style={{ fontSize: 26 }}>{result.score}</Num>
            </Row>
            {golden?.sam && shownFrame ? (
              <CompareSlider golden={{ image: golden.image, read: golden.sam }} plate={{ image: shownFrame, read, label: 'This plate' }} height={240} />
            ) : (
              <Row gap={10}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ fontFamily: font.bodyBold, fontSize: 12, color: color.saffronInk }}>Golden Plate</Text>
                  {golden && <Image source={golden.image} style={{ width: '100%', aspectRatio: 1, borderRadius: 16 }} contentFit="cover" />}
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ fontFamily: font.bodyBold, fontSize: 12, color: color.saffronInk }}>This plate</Text>
                  {shownFrame && <Image source={shownFrame} style={{ width: '100%', aspectRatio: 1, borderRadius: 16 }} contentFit="cover" accessibilityLabel="The frame just checked" />}
                </View>
              </Row>
            )}
            {[...result.reasons].sort((a, b) => Number(b.endsWith(': not found')) - Number(a.endsWith(': not found'))).map((r) => <Text key={r} style={{ fontFamily: font.bodyBold, fontSize: 16, color: color.ink }}>• {r}</Text>)}
            <View style={{ backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 16, padding: 10 }}><Parts result={result} /></View>
            {tags}
            <Row>
              <Button small kind="ink" title="Fixed, check again" style={{ flex: 1 }} onPress={() => { setFrame(null); setResult(null); setStages({}); setPhase('idle'); }} />
              <Button small kind="white" title="Send as is" style={{ flex: 1 }} onPress={clear} />
            </Row>
          </View>
        </SquishIn>
      )}

      {!nudge && (
        <Button kind="saffron" title={phase === 'running' ? 'Checking…' : phase === 'done' ? 'Next plate' : 'Check this plate'}
          disabled={phase === 'running' || (phase !== 'done' && !ready)} onPress={() => (phase === 'done' ? clear() : check())} />
      )}
    </View>
  );

  return (
    <Screen wide dark scroll style={{ paddingBottom: 120 }}>
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
