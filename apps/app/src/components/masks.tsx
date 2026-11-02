// What SAM 3.1 saw, drawn over the photo: each part's outline revealed one by one, a scan sweep while the model works,
// the plate clock with measured positions, counted boxes for shelves, outlines of parts missing from a plate, and a
// drag-to-compare view against the Golden Plate. Everything drawn comes from SAM output; nothing is invented.
import { color, font } from '@nomi/ui';
import { Image, type ImageSource } from 'expo-image';
import { useEffect, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { PanResponder, Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import type { GoldenPart, GoldenRead } from '@/lib/api';

export type SamRead = Omit<GoldenRead, 'id'>;
type Mode = 'masks' | 'measure' | 'photo';
const STEP_MS = 420;

const ANGLE = (p: GoldenPart, plate: NonNullable<SamRead['plate']>) =>
  p.centre ? ((Math.atan2(p.centre[0] - plate.cx, -(p.centre[1] - plate.cy)) * 180) / Math.PI + 360) % 360 : 0;
const clock = (deg: number) => `${Math.round(deg / 30) % 12 || 12} o’clock`;

/** Counted boxes for shelves and closing spots: each item gets its number as the count runs. */
function Boxes({ parts, progress, size }: { parts: GoldenPart[]; progress: SharedValue<number>; size: SamRead['size'] }) {
  const items = parts.flatMap((p) => p.boxes.map((b, k) => ({ p, b, k })));
  return (
    <>
      {items.map(({ p, b, k }, i) => <Counted key={`${p.name}-${k}`} i={i} progress={progress} size={size} box={b} colour={p.colour} n={k + 1} />)}
    </>
  );
}
function Counted({ i, progress, size, box, colour, n }: { i: number; progress: SharedValue<number>; size: SamRead['size']; box: number[]; colour: string; n: number }) {
  const style = useAnimatedStyle(() => {
    const t = Math.min(1, Math.max(0, (progress.value - i * 0.35) * 2));
    return { opacity: t, transform: [{ scale: 0.8 + 0.2 * t }] };
  });
  const [l, t, r, b] = box;
  const sw = size.w / 260;
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, style]}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${size.w} ${size.h}`} preserveAspectRatio="xMidYMid slice">
        <Rect x={l} y={t} width={r - l} height={b - t} rx={sw * 3} fill={`${colour}33`} stroke={colour} strokeWidth={sw} />
        <Circle cx={l + sw * 8} cy={t + sw * 8} r={sw * 7} fill={colour} stroke="#FFFFFF" strokeWidth={sw * 0.8} />
        <SvgText x={l + sw * 8} y={t + sw * 10.6} fontSize={sw * 8} fontFamily={font.displayBold} fill="#1B1B3A" textAnchor="middle">{n}</SvgText>
      </Svg>
    </Animated.View>
  );
}

/** A bright line sweeping down the photo while SAM 3.1 is looking. */
function Scan() {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withRepeat(withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [y]);
  const style = useAnimatedStyle(() => ({ top: `${y.value * 100}%` }));
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', backgroundColor: 'rgba(27,27,58,0.18)' }}>
      <Animated.View style={[{ position: 'absolute', left: 0, right: 0, height: 3, backgroundColor: color.saffron, shadowColor: color.saffron, shadowOpacity: 0.9, shadowRadius: 12 }, style]} />
    </View>
  );
}

/** The plate clock: rim, hour ticks, and a pin with the measured position and share at each part's centre. */
function Measure({ read, focus }: { read: SamRead; focus: string | null }) {
  const { plate, size } = read;
  const sw = size.w / 300;
  return (
    <Svg pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} width="100%" height="100%" viewBox={`0 0 ${size.w} ${size.h}`} preserveAspectRatio="xMidYMid slice">
      {plate && (
        <G>
          <Circle cx={plate.cx} cy={plate.cy} r={plate.r} fill="none" stroke="#FFFFFF" strokeWidth={sw * 1.4} strokeDasharray={`${sw * 6} ${sw * 5}`} />
          {Array.from({ length: 12 }, (_, h) => {
            const a = (h * 30 * Math.PI) / 180;
            const [x1, y1, x2, y2] = [plate.cx + Math.sin(a) * plate.r * 0.9, plate.cy - Math.cos(a) * plate.r * 0.9, plate.cx + Math.sin(a) * plate.r, plate.cy - Math.cos(a) * plate.r];
            return <Line key={h} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FFFFFF" strokeWidth={h % 3 ? sw : sw * 2.4} strokeLinecap="round" />;
          })}
          {[12, 3, 6, 9].map((h) => {
            const a = (h * 30 * Math.PI) / 180;
            return (
              <SvgText key={h} x={plate.cx + Math.sin(a) * plate.r * 1.1} y={plate.cy - Math.cos(a) * plate.r * 1.1 + sw * 4} fontSize={sw * 13} fontFamily={font.displayBold}
                fill="#FFFFFF" stroke="#1B1B3A" strokeWidth={sw * 0.8} textAnchor="middle">{h}</SvgText>
            );
          })}
          <Circle cx={plate.cx} cy={plate.cy} r={sw * 2.5} fill="#FFFFFF" />
        </G>
      )}
      {read.parts.filter((p) => p.found && p.centre && (!focus || focus === p.name)).map((p) => {
        const [x, y] = p.centre!;
        return (
          <G key={p.name}>
            {plate && <Line x1={plate.cx} y1={plate.cy} x2={x} y2={y} stroke={p.colour} strokeWidth={sw * 1.2} strokeDasharray={`${sw * 3} ${sw * 3}`} />}
            <Circle cx={x} cy={y} r={sw * 6} fill={p.colour} stroke="#FFFFFF" strokeWidth={sw * 1.6} />
          </G>
        );
      })}
    </Svg>
  );
}

/** Readable labels for the measure view, placed over each pin and pushed apart so none overlap. */
function Pins({ read, focus, box }: { read: SamRead; focus: string | null; box: { w: number; h: number } }) {
  const { size } = read;
  const k = Math.max(box.w / size.w, box.h / size.h);
  const ox = (box.w - size.w * k) / 2;
  const oy = (box.h - size.h * k) / 2;
  const placed: { x: number; y: number; w: number }[] = [];
  const items = read.parts.filter((p) => p.found && p.centre && (!focus || focus === p.name)).sort((a, b) => a.centre![1] - b.centre![1]).map((p) => {
    const text = [p.name, p.count > 1 ? `×${p.count}` : null, p.share ? `${Math.round(p.share * 100)}%` : null].filter(Boolean).join(' · ');
    const w = text.length * 6.4 + 18;
    const x = Math.min(box.w - w - 4, Math.max(4, p.centre![0] * k + ox - w / 2));
    let y = p.centre![1] * k + oy - 34;
    while (placed.some((q) => Math.abs(q.y - y) < 24 && x < q.x + q.w && q.x < x + w)) y += 26;
    placed.push({ x, y, w });
    return { p, text, x, y: Math.max(2, Math.min(box.h - 26, y)) };
  });
  return (
    <>
      {items.map(({ p, text, x, y }) => (
        <View key={p.name} pointerEvents="none" style={{ position: 'absolute', left: x, top: y, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(27,27,58,0.86)', borderRadius: 9, paddingHorizontal: 7, height: 22 }}>
          <View style={{ width: 8, height: 8, borderRadius: 3, backgroundColor: p.colour }} />
          <Text numberOfLines={1} style={{ fontFamily: font.bodyBold, fontSize: 11, color: '#FFFFFF' }}>{text}</Text>
        </View>
      ))}
    </>
  );
}

/**
 * The photo with SAM's outlines over it. Parts reveal one after another when `read` arrives; `scanning` shows the sweep
 * while SAM works. `ghost` draws the Golden Plate's outline of each part this plate is missing, placed by aligning the
 * two plates' rims. `onTap` gets the tap as 0–1 across the photo (tap-to-fix).
 */
export function MaskView({ image, read, mode = 'masks', scanning = false, focus = null, ghost, onTap, fill = false, style, children }: {
  image: ImageSource | string | number; read?: SamRead | null; mode?: Mode; scanning?: boolean; focus?: string | null;
  /** Fill the parent (cropping like a cover photo) instead of sizing to the photo's own shape. */
  fill?: boolean;
  ghost?: { read: SamRead; names: string[] }; onTap?: (x: number, y: number) => void; style?: StyleProp<ViewStyle>; children?: ReactNode;
}) {
  const reduce = useReducedMotion();
  const progress = useSharedValue(0);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const frame = useRef<ComponentRef<typeof View>>(null);
  const parts = read?.parts.filter((p) => p.found) ?? [];
  const counting = !!read && !read.plate;
  const total = counting ? parts.reduce((n, p) => n + p.boxes.length, 0) * 0.35 + 1 : parts.length + 1;
  const key = read ? read.parts.map((p) => `${p.name}${p.found}${p.count}`).join() : '';

  useEffect(() => {
    if (!read) return;
    progress.value = 0;
    progress.value = reduce ? total : withTiming(total, { duration: total * STEP_MS, easing: Easing.out(Easing.quad) });
  }, [key, read, total, reduce, progress]);

  const tap = (pageX: number, pageY: number) => frame.current?.measure((_x, _y, w, h, left, top) => {
    const x = (pageX - left) / w;
    const y = (pageY - top) / h;
    if (Number.isFinite(x) && Number.isFinite(y)) onTap?.(Math.min(1, Math.max(0, x)), Math.min(1, Math.max(0, y)));
  });

  const size = read?.size ?? { w: 1, h: 1 };
  const sw = size.w / 260;
  const align = ghost?.read.plate && read?.plate
    ? { s: read.plate.r / ghost.read.plate.r, tx: read.plate.cx, ty: read.plate.cy, gx: ghost.read.plate.cx, gy: ghost.read.plate.cy }
    : null;

  return (
    <Pressable ref={frame} disabled={!onTap} onPress={(e) => tap(e.nativeEvent.pageX, e.nativeEvent.pageY)}
      onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      accessibilityRole={onTap ? 'imagebutton' : 'image'}
      accessibilityLabel={read ? `Photo with ${parts.length} parts found by SAM 3.1: ${parts.map((p) => p.name).join(', ')}` : 'Photo'}
      style={[fill
        ? { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', backgroundColor: color.photo }
        : { width: '100%', aspectRatio: read ? size.w / size.h : 4 / 3, borderRadius: 26, overflow: 'hidden', backgroundColor: color.photo }, style]}>
      <Image source={image} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} contentFit="cover" pointerEvents="none" />
      {read && mode !== 'photo' && (counting
        ? <Boxes parts={parts} progress={progress} size={size} />
        : parts.map((p, i) => (
          <PartLayer key={p.name} part={p} i={i} progress={progress} dim={!!focus && focus !== p.name} size={size} />
        )))}
      {align && ghost && (
        <Svg pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} width="100%" height="100%" viewBox={`0 0 ${size.w} ${size.h}`} preserveAspectRatio="xMidYMid slice">
          <G transform={`translate(${align.tx} ${align.ty}) scale(${align.s}) translate(${-align.gx} ${-align.gy})`}>
            {ghost.read.parts.filter((p) => ghost.names.includes(p.name)).map((p) => (
              <G key={p.name}>
                {p.paths.map((d, k) => <Path key={k} d={d} fill="none" stroke={p.colour} strokeWidth={sw * 2 / align.s} strokeDasharray={`${sw * 5} ${sw * 4}`} fillRule="evenodd" />)}
                {p.centre && (
                  <SvgText x={p.centre[0]} y={p.centre[1]} fontSize={(sw * 11) / align.s} fontFamily={font.displayBold} fill="#FFFFFF" stroke="#1B1B3A" strokeWidth={(sw * 0.6) / align.s} textAnchor="middle">
                    {p.name} missing
                  </SvgText>
                )}
              </G>
            ))}
          </G>
        </Svg>
      )}
      {read && mode === 'measure' && <Measure read={read} focus={focus} />}
      {read && mode === 'measure' && box.w > 0 && <Pins read={read} focus={focus} box={box} />}
      {scanning && <Scan />}
      {children}
    </Pressable>
  );
}

/** One part's outlines, fading and settling in when the reveal reaches it. */
function PartLayer({ part, i, progress, dim, size }: { part: GoldenPart; i: number; progress: SharedValue<number>; dim: boolean; size: SamRead['size'] }) {
  const style = useAnimatedStyle(() => {
    const t = Math.min(1, Math.max(0, progress.value - i));
    return { opacity: t * (dim ? 0.12 : 1), transform: [{ scale: 0.97 + 0.03 * t }] };
  });
  const sw = size.w / 260;
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, style]}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${size.w} ${size.h}`} preserveAspectRatio="xMidYMid slice">
        {part.paths.map((d, k) => <Path key={k} d={d} fill={`${part.colour}70`} stroke={part.colour} strokeWidth={sw} strokeLinejoin="round" fillRule="evenodd" />)}
      </Svg>
    </Animated.View>
  );
}

/** Colour key under a MaskView; tap a part to show it alone. */
export function MaskLegend({ read, focus, onFocus }: { read: SamRead; focus: string | null; onFocus: (name: string | null) => void }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {read.parts.map((p) => {
        const on = focus === p.name;
        return (
          <Pressable key={p.name} accessibilityRole="button" accessibilityState={{ selected: on, disabled: !p.found }} disabled={!p.found} onPress={() => onFocus(on ? null : p.name)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36, paddingHorizontal: 10, borderRadius: 12, backgroundColor: on ? color.ink : color.card, opacity: p.found ? 1 : 0.5 }}>
            <View style={{ width: 12, height: 12, borderRadius: 4, backgroundColor: p.colour }} />
            <Text style={{ fontFamily: font.bodyBold, fontSize: 12, color: on ? color.bg : color.ink }}>{p.name}{p.count > 1 ? ` ×${p.count}` : ''}{p.found ? '' : ' · not found'}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Masks / measurements / plain photo, as three small buttons. */
export function ModeSwitch({ mode, onChange, measure = true }: { mode: Mode; onChange: (m: Mode) => void; measure?: boolean }) {
  const opts: [Mode, string][] = [['masks', 'Parts'], ...(measure ? [['measure', 'Measure'] as [Mode, string]] : []), ['photo', 'Photo']];
  return (
    <View style={{ flexDirection: 'row', backgroundColor: color.card, borderRadius: 14, padding: 3, gap: 2 }}>
      {opts.map(([m, label]) => (
        <Pressable key={m} accessibilityRole="button" accessibilityState={{ selected: mode === m }} onPress={() => onChange(m)}
          style={{ minHeight: 34, paddingHorizontal: 12, borderRadius: 11, justifyContent: 'center', backgroundColor: mode === m ? color.ink : 'transparent' }}>
          <Text style={{ fontFamily: font.bodyBold, fontSize: 12, color: mode === m ? color.bg : color.ink }}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Golden Plate on the left, this plate on the right; drag the handle to wipe between them. */
export function CompareSlider({ golden, plate, height = 300, ghost = true }: {
  golden: { image: ImageSource | number | string; read: SamRead | null };
  plate: { image: ImageSource | number | string; read: SamRead | null; label: string };
  height?: number; ghost?: boolean;
}) {
  const [width, setWidth] = useState(0);
  const [pos, setPos] = useState(0.5);
  const start = useRef(0.5);
  const posRef = useRef(pos);
  const widthRef = useRef(width);
  useEffect(() => { posRef.current = pos; widthRef.current = width; }, [pos, width]);
  const missing = golden.read && plate.read
    ? golden.read.parts.filter((g) => g.found && !plate.read!.parts.find((p) => p.name === g.name)?.found).map((g) => g.name)
    : [];
  // The refs are read inside the gesture callbacks, not during render.
  // eslint-disable-next-line react-hooks/refs
  const [pan] = useState(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => { start.current = posRef.current; },
    onPanResponderMove: (_e, g) => setPos(Math.min(0.95, Math.max(0.05, start.current + g.dx / Math.max(1, widthRef.current)))),
  }));

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height, borderRadius: 26, overflow: 'hidden', backgroundColor: color.photo, userSelect: 'none' }}
      accessibilityLabel={`Golden Plate compared with ${plate.label}. Drag to compare.`}>
      <MaskView image={plate.image} read={plate.read} fill
        ghost={ghost && golden.read && missing.length ? { read: golden.read, names: missing } : undefined} />
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: width * pos, overflow: 'hidden' }}>
        <View style={{ width, height }}>
          <MaskView image={golden.image} read={golden.read} fill />
        </View>
      </View>
      <View {...pan.panHandlers} accessibilityRole="adjustable" accessibilityLabel="Drag to compare"
        style={{ position: 'absolute', top: 0, bottom: 0, left: width * pos - 22, width: 44, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ position: 'absolute', top: 0, bottom: 0, width: 3, backgroundColor: '#FFFFFF' }} />
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: font.bodyBold, fontSize: 14, color: color.ink }}>⇆</Text>
        </View>
      </View>
      <Tag text="Golden Plate" style={{ left: 10 }} />
      <Tag text={plate.label} style={{ right: 10 }} />
    </View>
  );
}
function Tag({ text, style }: { text: string; style: StyleProp<ViewStyle> }) {
  return (
    <View pointerEvents="none" style={[{ position: 'absolute', top: 10, backgroundColor: 'rgba(27,27,58,0.82)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 }, style]}>
      <Text style={{ fontFamily: font.bodyBold, fontSize: 12, color: color.bg }}>{text}</Text>
    </View>
  );
}

/**
 * This plate against its Golden Plate, from SAM measurements only, with the same rules and weights as the vision
 * worker's score_plate: missing part 30, each missing piece 10, moved 12, area share off by more than 10% up to 25.
 */
export function comparePlates(golden: SamRead, plate: SamRead, roles: Record<string, string>) {
  let penalty = 0;
  const reasons: string[] = [];
  for (const g of golden.parts) {
    if (!g.found) continue;
    const m = plate.parts.find((p) => p.name === g.name);
    if (!m?.found) {
      penalty += 30;
      reasons.push(`${g.name} missing`);
      continue;
    }
    if (roles[g.name] === 'count' && m.count < g.count) {
      penalty += 10 * (g.count - m.count);
      reasons.push(`${m.count} ${g.name.toLowerCase()}, reference is ${g.count}`);
    }
    if (roles[g.name] === 'placement' && golden.plate && plate.plate) {
      const a = ANGLE(m, plate.plate);
      const b = ANGLE(g, golden.plate);
      const off = Math.min(Math.abs(a - b) % 360, 360 - (Math.abs(a - b) % 360));
      if (off > 30) {
        penalty += 12;
        reasons.push(`${g.name} at ${clock(a)}, reference ${clock(b)}`);
      }
    }
    if (g.share > 0.04 && m.share > 0) {
      const pct = Math.round((100 * (m.share - g.share)) / g.share);
      if (Math.abs(pct) > 10) {
        penalty += Math.min(25, Math.abs(pct) * 0.8);
        reasons.push(`${g.name} share ${Math.abs(pct)}% ${pct > 0 ? 'over' : 'under'} reference`);
      }
    }
  }
  return { score: Math.max(0, Math.round(100 - penalty)), reasons };
}
