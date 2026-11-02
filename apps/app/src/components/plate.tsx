// Plate visuals: the golden photo with SAM masks on demand, and a drawn plate diagram of what PASS measured on a capture.
import { Chip, Row, Squishy, Sub, color, font } from '@nomi/ui';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

import { AiTag } from '@/components/kit';
import { CompareSlider, MaskLegend, MaskView, ModeSwitch, comparePlates } from '@/components/masks';
import { COMPONENTS, GOLDEN_PHOTO, MASK_PHOTO } from '@/lib/mock';
import { goldenShot, rolesFor, shot } from '@/lib/shots';

/**
 * Golden photo with what SAM 3.1 found on it. With a generated demo photo the outlines, plate clock and measurements are
 * drawn from its saved SAM run; otherwise "Show masks" swaps in the recorded overlay of the sample biryani.
 */
export function GoldenPhoto({ dish = 'Chicken Biryani', height = 300, masks: start = false }: { dish?: string; height?: number; masks?: boolean }) {
  const g = goldenShot(dish);
  if (g?.sam) return <LiveGolden image={g.image} read={g.sam} start={start} />;
  return <SampleGolden height={height} start={start} />;
}

function LiveGolden({ image, read, start }: { image: number; read: NonNullable<ReturnType<typeof goldenShot>>['sam'] & object; start: boolean }) {
  const [mode, setMode] = useState<'masks' | 'measure' | 'photo'>(start ? 'masks' : 'photo');
  const [focus, setFocus] = useState<string | null>(null);
  return (
    <View style={{ gap: 10 }}>
      <MaskView image={image} read={mode === 'photo' ? null : read} mode={mode} focus={focus} />
      <Row style={{ justifyContent: 'space-between' }}>
        <ModeSwitch mode={mode} onChange={setMode} measure={!!read.plate} />
        <AiTag model="SAM 3.1" />
      </Row>
      {mode !== 'photo' && <MaskLegend read={read} focus={focus} onFocus={setFocus} />}
    </View>
  );
}

function SampleGolden({ height, start }: { height: number; start: boolean }) {
  const [masks, setMasks] = useState(start);
  return (
    <View style={{ gap: 10 }}>
      <View style={{ height, borderRadius: 26, overflow: 'hidden', backgroundColor: color.photo }}>
        <Image source={masks ? MASK_PHOTO : GOLDEN_PHOTO} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={180}
          accessibilityLabel={masks ? 'Golden Plate with each component coloured by SAM 3.1' : 'Golden Plate photo of Chicken Biryani'} />
        <Squishy accessibilityRole="switch" accessibilityState={{ checked: masks }} accessibilityLabel="Show what Nomi sees" onPress={() => setMasks(!masks)}
          containerStyle={{ position: 'absolute', right: 12, bottom: 12 }}
          style={{ minHeight: 40, paddingHorizontal: 14, borderRadius: 16, backgroundColor: masks ? color.ink : color.card, justifyContent: 'center' }}>
          <Text style={{ fontFamily: font.bodyBold, fontSize: 13, color: masks ? color.saffron : color.ink }}>{masks ? 'Hide masks' : 'Show what Nomi sees'}</Text>
        </Squishy>
      </View>
      {masks && (
        <View style={{ gap: 8 }}>
          <Row gap={6} style={{ flexWrap: 'wrap' }}>
            {COMPONENTS.map((c) => (
              <View key={c.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: color.card, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 }}>
                <View style={{ width: 12, height: 12, borderRadius: 4, backgroundColor: c.colour }} />
                <Text style={{ fontFamily: font.bodyBold, fontSize: 12, color: color.ink }}>{c.name}</Text>
              </View>
            ))}
          </Row>
          <AiTag model="SAM 3.1" />
        </View>
      )}
    </View>
  );
}

/**
 * A top-down drawing of one plate built from its measured signature: rice area, chicken count, garnish and lemon positions.
 * It draws only what PASS measured, so a missing part shows as a dashed outline where the Golden Plate expects it.
 */
export function PlateDiagram({ size = 140, rice = 1, pieces = 4, onions = true, lemon = true, label }: { size?: number; rice?: number; pieces?: number; onions?: boolean; lemon?: boolean; label?: string }) {
  const r = 34 * Math.sqrt(rice);
  const spots = [[50, 40], [66, 52], [42, 62], [60, 68]].slice(0, 4);
  return (
    <View style={{ alignItems: 'center', gap: 4 }} accessibilityLabel={label ?? `Plate diagram: rice ${Math.round(rice * 100)} percent of reference, ${pieces} pieces${onions ? '' : ', onions missing'}${lemon ? '' : ', lemon missing'}`}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Circle cx={50} cy={52} r={46} fill="#FFFFFF" stroke={color.ink} strokeWidth={2.5} />
        <Ellipse cx={52} cy={54} rx={34} ry={32} fill="none" stroke={color.sky} strokeWidth={1.2} strokeDasharray="3 3" opacity={0.7} />
        <Ellipse cx={52} cy={54} rx={r} ry={r * 0.94} fill="#FFE7B0" stroke={color.ink} strokeWidth={1.6} />
        {spots.map(([x, y], i) => (
          <G key={i}>
            {i < pieces
              ? <Ellipse cx={x} cy={y} rx={7} ry={5.5} fill="#C96A2B" stroke={color.ink} strokeWidth={1.4} />
              : <Ellipse cx={x} cy={y} rx={7} ry={5.5} fill="none" stroke={color.tomato} strokeWidth={1.6} strokeDasharray="2.5 2" />}
          </G>
        ))}
        {onions
          ? <Path d="M70 30 q4-4 8 0 M74 36 q4-4 8 0 M68 40 q4-4 8 0" stroke="#B5651D" strokeWidth={2.4} fill="none" strokeLinecap="round" />
          : <Circle cx={75} cy={35} r={9} fill="none" stroke={color.tomato} strokeWidth={1.6} strokeDasharray="2.5 2" />}
        {lemon
          ? <Path d="M78 80 a8 8 0 0 1 12 -8 z" fill="#FFE34D" stroke={color.ink} strokeWidth={1.4} />
          : <Circle cx={84} cy={78} r={7} fill="none" stroke={color.tomato} strokeWidth={1.6} strokeDasharray="2.5 2" />}
      </Svg>
      {label ? <Sub style={{ fontSize: 12, textAlign: 'center' }}>{label}</Sub> : null}
    </View>
  );
}

/**
 * Golden Plate next to a capture, with the reasons the score dropped. When the capture's demo photo and the Golden
 * Plate both have a saved SAM run, it is a drag-to-compare of the two photos and the score and reasons are measured.
 */
export function Compare({ score, reasons, when, rice = 1, pieces = 4, onions = true, lemon = true, dish = 'Chicken Biryani', shotKey }: {
  score: number; reasons: string[]; when: string; rice?: number; pieces?: number; onions?: boolean; lemon?: boolean; dish?: string; shotKey?: string;
}) {
  const g = goldenShot(dish);
  const c = shot(shotKey);
  if (g?.sam && c?.sam) {
    const m = comparePlates(g.sam, c.sam, rolesFor(dish));
    return (
      <View style={{ gap: 10 }}>
        <CompareSlider golden={{ image: g.image, read: g.sam }} plate={{ image: c.image, read: c.sam, label: `${when} · ${m.score}` }} height={260} />
        <Row style={{ justifyContent: 'space-between' }}>
          <Chip tone={m.score >= 85 ? 'mint' : m.score >= 70 ? 'saffron' : 'tomato'} label={`Measured score ${m.score}`} />
          <AiTag model="SAM 3.1" />
        </Row>
        {(m.reasons.length ? m.reasons : ['Matches the Golden Plate']).map((r) => (
          <Row key={r} gap={8}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: m.reasons.length ? color.tomato : color.mint }} />
            <Text style={{ fontFamily: font.bodyBold, fontSize: 14, color: color.ink, flex: 1 }}>{r}</Text>
          </Row>
        ))}
      </View>
    );
  }
  return (
    <View style={{ gap: 10 }}>
      <Row style={{ justifyContent: 'space-around', alignItems: 'flex-start' }}>
        <View style={{ alignItems: 'center', gap: 6 }}>
          <Chip tone="mint" label="Golden Plate" />
          <PlateDiagram size={120} label="Reference" />
        </View>
        <View style={{ alignItems: 'center', gap: 6 }}>
          <Chip tone={score >= 85 ? 'mint' : score >= 70 ? 'saffron' : 'tomato'} label={`${when} · ${score}`} />
          <PlateDiagram size={120} rice={rice} pieces={pieces} onions={onions} lemon={lemon} label="This plate" />
        </View>
      </Row>
      {reasons.map((r) => (
        <Row key={r} gap={8}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color.tomato }} />
          <Text style={{ fontFamily: font.bodyBold, fontSize: 14, color: color.ink, flex: 1 }}>{r}</Text>
        </Row>
      ))}
    </View>
  );
}

/** Parses capture reasons into the diagram's measured parts, so the drawing always matches the words. */
export function partsFromReasons(reasons: string[]) {
  const share = reasons.map((r) => /Rice share (\d+)% under/.exec(r)?.[1]).find(Boolean);
  const pieces = reasons.map((r) => /(\d+) chicken pieces/.exec(r)?.[1]).find(Boolean);
  return {
    rice: share ? 1 - Number(share) / 100 : 1,
    pieces: pieces ? Number(pieces) : 4,
    onions: !reasons.some((r) => /onions missing/i.test(r)),
    lemon: !reasons.some((r) => /lemon (missing|off)/i.test(r)),
  };
}
