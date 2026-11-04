// Staff-app building blocks: the top bar, AI labels with their evidence, scores, small charts and the hold-to-talk button.
import { Button, Chip, H1, H2, Label, Num, Ripple, Row, Squishy, Sub, color, font, shadow, tone, type Tone } from '@nomi/ui';
import { Asset } from 'expo-asset';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Path, Polyline, Rect } from 'react-native-svg';

import { toDataUrl } from '@/components/camera';
import { RESTAURANT } from '@/lib/brand';
import type { EvidenceItem, Model } from '@/lib/mock';
import { ROLE_LABEL, ROLE_PERSON, useSession } from '@/lib/session';
import { useVoiceNote } from '@/lib/voice';

export type VoiceNote = { audio: string; uri: string; seconds: number };

export function IconButton({ label, onPress, children, bg = color.card }: { label: string; onPress: () => void; children: ReactNode; bg?: string }) {
  return (
    <Squishy accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', ...shadow(1) }}>
      {children}
    </Squishy>
  );
}

export const BackIcon = ({ c = color.ink }: { c?: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round"><Path d="M15 5l-7 7 7 7" /></Svg>
);

/** Screen title with the restaurant line and the signed-in person; the avatar opens the role switcher. */
export function TopBar({ title, sub, back = false, right }: { title: string; sub?: string; back?: boolean; right?: ReactNode }) {
  const { role } = useSession();
  const p = ROLE_PERSON[role];
  return (
    <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
      <Row style={{ flex: 1 }}>
        {back ? <IconButton label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}><BackIcon /></IconButton>
          : <Image source={RESTAURANT.logo} accessibilityLabel={`${RESTAURANT.name} logo`} style={{ width: 44, height: 44, borderRadius: 14 }} contentFit="cover" />}
        <View style={{ flex: 1 }}>
          {sub ? <Sub style={{ fontSize: 13 }} numberOfLines={1}>{back ? sub : `${RESTAURANT.name} · ${sub}`}</Sub> : <Sub style={{ fontSize: 13 }}>{RESTAURANT.name}</Sub>}
          <H1 numberOfLines={2}>{title}</H1>
        </View>
      </Row>
      {right ?? (
        <Squishy accessibilityRole="button" accessibilityLabel={`${p.name}, ${ROLE_LABEL[role]}. Switch role`} onPress={() => router.push('/sign-in?step=role')}
          style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: color.ink, alignItems: 'center', justifyContent: 'center' }}>
          <Num style={{ color: color.saffron, fontSize: 15 }}>{p.initials}</Num>
        </Squishy>
      )}
    </Row>
  );
}

const SparkleIcon = ({ c, size = 12 }: { c: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" fill={c} /></Svg>
);

/** Marks anything a model produced. Rule: no unlabelled AI output on any screen. */
/** Which model made this. With `ms` it was a live call just now, and says how long it took. */
export function AiTag({ model, ms, style }: { model: Model; ms?: number; style?: StyleProp<ViewStyle> }) {
  const live = ms !== undefined;
  return (
    <View accessibilityLabel={live ? `Made live by ${model} in ${(ms / 1000).toFixed(1)} seconds` : `Made by ${model}`}
      style={[{ flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: color.pinkSoft, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 }, style]}>
      <SparkleIcon c="#7A1F4C" />
      <Text style={{ fontFamily: font.bodyBold, fontSize: 11, color: '#7A1F4C' }}>{model}</Text>
      {live && (
        <>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color.mint, marginLeft: 2 }} />
          <Text style={{ fontFamily: font.bodyBold, fontSize: 11, color: '#7A1F4C' }}>live · {(ms / 1000).toFixed(1)} s</Text>
        </>
      )}
    </View>
  );
}

const evidenceGlyph: Record<EvidenceItem['kind'], string> = { quote: '“', plate: '◎', count: '#', photo: '▣' };

/** "Why?" opens the facts behind an AI result. Every AI claim is one tap from its evidence. */
export function Why({ title, items, label = 'Why?' }: { title: string; items: EvidenceItem[]; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Squishy accessibilityRole="button" accessibilityLabel={`${label} Show evidence for ${title}`} onPress={() => setOpen(true)}
        style={{ minHeight: 32, paddingHorizontal: 12, borderRadius: 12, backgroundColor: color.skySoft, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' }}>
        <Text style={{ fontFamily: font.bodyBold, fontSize: 13, color: color.skyInk }}>{label}</Text>
      </Squishy>
      <Sheet open={open} onClose={() => setOpen(false)} title="The evidence" sub={title}>
        {items.map((e, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 12, backgroundColor: color.bg, borderRadius: 18, padding: 12 }}>
            <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: tone[e.tone ?? 'sky'].bg, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: font.displayBold, fontSize: 18, color: tone[e.tone ?? 'sky'].fg }}>{evidenceGlyph[e.kind]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: font.bodyBold, fontSize: 14, color: color.ink }}>{e.title}</Text>
              <Sub style={{ fontSize: 14 }}>{e.detail}</Sub>
            </View>
          </View>
        ))}
      </Sheet>
    </>
  );
}

/** Bottom sheet over a dimmed screen. Works the same on Android and web. */
export function Sheet({ open, onClose, title, sub, children }: { open: boolean; onClose: () => void; title: string; sub?: string; children: ReactNode }) {
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable accessibilityLabel="Close" onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(27,27,58,0.45)' }} />
      <View style={{ backgroundColor: color.card, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, paddingBottom: 34, gap: 12, maxHeight: '80%', width: '100%', maxWidth: 640, alignSelf: 'center' }}>
        <View style={{ alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: color.saffronSoft }} />
        <View>
          <H2>{title}</H2>
          {sub ? <Sub style={{ fontSize: 14 }}>{sub}</Sub> : null}
        </View>
        <ScrollView contentContainerStyle={{ gap: 10 }}>{children}</ScrollView>
        <Button small kind="white" title="Close" onPress={onClose} />
      </View>
    </Modal>
  );
}

export const scoreTone = (s: number): Tone => (s >= 85 ? 'mint' : s >= 70 ? 'saffron' : 'tomato');
export const scoreWord = (s: number) => (s >= 85 ? 'On standard' : s >= 70 ? 'Drifting' : 'Off standard');

/** A score is always number + word + colour, never colour alone. */
export function Score({ value, size = 56, word = false }: { value: number; size?: number; word?: boolean }) {
  const t = tone[scoreTone(value)];
  const r = size / 2 - 4;
  const c = 2 * Math.PI * r;
  return (
    <View style={{ alignItems: 'center', gap: 2 }} accessibilityLabel={`Score ${value} of 100, ${scoreWord(value)}`}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size} style={{ position: 'absolute' }}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={t.bg} strokeWidth={6} fill="none" />
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={t.solid} strokeWidth={6} fill="none" strokeLinecap="round"
            strokeDasharray={`${(c * value) / 100} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
        </Svg>
        <Num style={{ fontSize: size * 0.34 }}>{value}</Num>
      </View>
      {word && <Text style={{ fontFamily: font.bodyBold, fontSize: 11, color: t.fg }}>{scoreWord(value)}</Text>}
    </View>
  );
}

export function Spark({ values, width = 90, height = 30, stroke = color.ink, min, max }: { values: number[]; width?: number; height?: number; stroke?: string; min?: number; max?: number }) {
  if (values.length < 2) return <View style={{ width, height }} />;
  const lo = min ?? Math.min(...values) - 4;
  const hi = max ?? Math.max(...values) + 4;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * (width - 6) + 3},${height - 3 - ((v - lo) / (hi - lo || 1)) * (height - 6)}`);
  const last = pts[pts.length - 1].split(',').map(Number);
  return (
    <Svg width={width} height={height} accessibilityLabel={`Last ${values.length} days: ${values.join(', ')}`}>
      <Polyline points={pts.join(' ')} fill="none" stroke={stroke} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      <Circle cx={last[0]} cy={last[1]} r={4} fill={stroke} />
    </Svg>
  );
}

/** Small bar chart for counts per day (whole numbers only). */
export function Bars({ values, labels, width = 160, height = 44, fill = color.tomato }: { values: number[]; labels?: string[]; width?: number; height?: number; fill?: string }) {
  const max = Math.max(1, ...values);
  const bw = width / values.length;
  return (
    <View accessibilityLabel={`Per day: ${values.join(', ')}`}>
      <Svg width={width} height={height}>
        {values.map((v, i) => (
          <Rect key={i} x={i * bw + 3} y={height - Math.max(3, (v / max) * height)} width={bw - 6} height={Math.max(3, (v / max) * height)} rx={4} fill={v ? fill : color.saffronSoft} />
        ))}
      </Svg>
      {labels && (
        <View style={{ flexDirection: 'row', width }}>
          {labels.map((l, i) => <Text key={i} style={{ width: bw, textAlign: 'center', fontFamily: font.bodySemi, fontSize: 10, color: color.ink2 }}>{l}</Text>)}
        </View>
      )}
    </View>
  );
}

export const DAYS = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <View accessibilityRole="tablist" style={{ flexDirection: 'row', backgroundColor: color.saffronSoft, borderRadius: 20, padding: 4, gap: 4 }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable key={o.value} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => onChange(o.value)}
            style={{ flex: 1, minHeight: 40, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? color.ink : 'transparent' }}>
            <Text style={{ fontFamily: font.bodyBold, fontSize: 14, color: on ? color.bg : color.ink }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Horizontal filter chips that can be toggled. */
export function FilterChips<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string; count?: number }[]; onChange: (v: T) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable key={o.value} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => onChange(o.value)}
            style={{ minHeight: 40, paddingHorizontal: 14, borderRadius: 16, flexDirection: 'row', gap: 6, alignItems: 'center', backgroundColor: on ? color.ink : color.card, ...shadow(1) }}>
            <Text style={{ fontFamily: font.bodyBold, fontSize: 14, color: on ? color.bg : color.ink }}>{o.label}</Text>
            {o.count !== undefined && <Text style={{ fontFamily: font.bodyBold, fontSize: 12, color: on ? color.saffron : color.ink2 }}>{o.count}</Text>}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function Stat({ value, label, t = 'white' }: { value: string | number; label: string; t?: Tone }) {
  return (
    <View style={{ flex: 1, backgroundColor: tone[t].bg, borderRadius: 20, padding: 12, gap: 2, ...(t === 'white' ? shadow(1) : {}) }}>
      <Num style={{ fontSize: 24, color: t === 'white' ? color.ink : tone[t].fg }}>{value}</Num>
      <Text style={{ fontFamily: font.bodySemi, fontSize: 12, color: t === 'white' ? color.ink2 : tone[t].fg }}>{label}</Text>
    </View>
  );
}

export function Empty({ title, sub, art }: { title: string; sub: string; art?: ReactNode }) {
  return (
    <View style={{ alignItems: 'center', gap: 8, paddingVertical: 28, paddingHorizontal: 20 }}>
      {art}
      <H2 style={{ textAlign: 'center' }}>{title}</H2>
      <Sub style={{ textAlign: 'center', fontSize: 14 }}>{sub}</Sub>
    </View>
  );
}

/** A labelled step that a model is working on: spinner dot while running, tick when done. */
/** One step of a model chain. "skip" (amber) means it could not run and the line says what happened instead; "fail" is tomato. */
export function WorkLine({ state, text, model, dark = false, ms }: { state: 'wait' | 'run' | 'done' | 'skip' | 'fail'; text: string; model?: Model; dark?: boolean; ms?: number }) {
  const bg = state === 'done' ? color.mint : state === 'run' || state === 'skip' ? color.saffron : state === 'fail' ? color.tomato : color.saffronSoft;
  return (
    <Row style={{ opacity: state === 'wait' ? 0.45 : 1 }}>
      <View style={{ width: 26, height: 26, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: bg }}>
        {state === 'done' ? <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round"><Path d="M5 12l5 5 9-10" /></Svg>
          : state === 'skip' || state === 'fail' ? <Text style={{ fontFamily: font.bodyBold, fontSize: 15, color: state === 'fail' ? '#fff' : color.ink }}>!</Text>
          : <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color.ink }} />}
      </View>
      <Text style={{ flex: 1, fontFamily: state === 'run' ? font.bodyBold : font.bodySemi, fontSize: 14, color: dark ? color.bg : color.ink }}>{text}</Text>
      {model && <AiTag model={model} ms={state === 'done' ? ms : undefined} />}
    </Row>
  );
}

/** Advances through n steps on a timer once started; mocks a chain of model calls until the API routes exist. */
export function useSteps(n: number, ms = 900) {
  const [i, setI] = useState(-1);
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (i < 0 || i >= n) return;
    t.current = setTimeout(() => setI((x) => x + 1), ms);
    return () => { if (t.current) clearTimeout(t.current); };
  }, [i, n, ms]);
  return { step: i, start: () => setI(0), reset: () => setI(-1), done: i >= n, running: i >= 0 && i < n, state: (k: number) => (i > k ? 'done' : i === k ? 'run' : 'wait') as 'wait' | 'run' | 'done' };
}

/** Seconds since this mounted, ticking once a second. */
export function useElapsed() {
  const [start] = useState(() => Date.now());
  const [now, setNow] = useState(start);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return Math.round((now - start) / 1000);
}

/** A live model call in progress: what it is doing, a running seconds count and how long it usually takes. */
export function LiveWait({ text, model, typical }: { text: string; model?: Model; typical: string }) {
  const secs = useElapsed();
  return <WorkLine state="run" text={`${text} · ${secs} s (usually ${typical})`} model={model} />;
}

export const MicIcon = ({ c = '#FFFFFF', size = 38 }: { c?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2.4} strokeLinecap="round">
    <Rect x={9} y={3} width={6} height={11} rx={3} />
    <Path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </Svg>
);

/**
 * Hold to talk, made for wet hands: one big target, no typing. A quick tap also works (tap to start, tap again to stop)
 * for anyone who can't press and hold. Records with expo-audio and hands the note to the screen, which sends it to
 * Muse Voice Transcribe through the API.
 */
export function HoldToTalk({ onDone, label = 'Hold to talk', bg = color.tomato, disabled, sample }: {
  onDone: (note: VoiceNote) => void; label?: string; bg?: string; disabled?: boolean;
  /** A bundled voice note (require of an .m4a) for laptops without a mic; it goes through the same live models. */
  sample?: { file: number; says: string };
}) {
  const v = useVoiceNote();
  const started = useRef<number | null>(null);
  const [mode, setMode] = useState<'off' | 'hold' | 'tap'>('off');
  const [short, setShort] = useState(false);
  const finish = async () => {
    started.current = null;
    setMode('off');
    const note = await v.stop();
    setShort(!note);
    if (note) onDone(note);
  };
  return (
    <View style={{ alignItems: 'center', gap: 10, opacity: disabled ? 0.5 : 1 }}>
      <Pressable accessibilityRole="button" accessibilityLabel={mode === 'off' ? `${label}, or tap to start` : 'Recording. Tap to stop'} disabled={disabled}
        onPressIn={async () => {
          if (started.current !== null) return finish();
          started.current = Date.now();
          setShort(false);
          if (await v.start()) setMode('hold');
          else started.current = null;
        }}
        onPressOut={() => {
          if (started.current === null) return;
          if (Date.now() - started.current > 500) finish();
          else setMode('tap');
        }}
        style={{ width: 112, height: 112, borderRadius: 40, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        <Ripple active={v.recording} color={bg} radius={40} />
        <MicIcon />
      </Pressable>
      <H2>{v.recording ? `Listening… 0:${String(v.seconds).padStart(2, '0')}` : label}</H2>
      {mode === 'tap' && <Sub style={{ fontSize: 13 }}>Tap again when you are done</Sub>}
      {short && <Sub style={{ fontSize: 13 }}>That was too short. Hold and speak, then let go.</Sub>}
      {v.denied && <Text style={{ fontFamily: font.bodyBold, color: color.tomatoInk, textAlign: 'center' }}>Microphone is off. Allow it in the phone settings.</Text>}
      {sample && !v.recording && !recording() && (
        <Pressable accessibilityRole="button" disabled={disabled} onPress={async () => onDone(await sampleNote(sample.file))}
          style={{ minHeight: 40, paddingHorizontal: 14, borderRadius: 14, backgroundColor: color.skySoft, justifyContent: 'center' }}>
          <Text style={{ fontFamily: font.bodyBold, fontSize: 13, color: color.skyInk, textAlign: 'center' }}>No mic? Play a sample voice note</Text>
          <Text style={{ fontFamily: font.body, fontSize: 12, color: color.skyInk, textAlign: 'center' }}>“{sample.says}”</Text>
        </Pressable>
      )}
    </View>
  );
}

/** Set by the pitch video's recorder (video/record), which plays real audio into the mic: hides the no-mic fallback. */
const recording = () => {
  try {
    return globalThis.localStorage?.getItem('nomi.recording') === '1';
  } catch {
    return false;
  }
};

async function sampleNote(file: number): Promise<VoiceNote> {
  const asset = Asset.fromModule(file);
  await asset.downloadAsync();
  const uri = asset.localUri ?? asset.uri;
  return { audio: await toDataUrl(uri), uri, seconds: 0 };
}

export function SectionTitle({ children, right }: { children: string; right?: ReactNode }) {
  return (
    <Row style={{ justifyContent: 'space-between', marginTop: 4 }}>
      <Label>{children}</Label>
      {right}
    </Row>
  );
}

export function Pill({ label, t = 'white' }: { label: string; t?: Tone }) {
  return <Chip label={label} tone={t} />;
}
