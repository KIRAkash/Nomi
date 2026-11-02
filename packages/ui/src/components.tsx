import { type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type PressableProps, type StyleProp, type TextProps, type TextStyle, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { spring } from './motion';
import { color, font, radius, shadow, space, tone, type, type Tone } from './tokens';

const make = (base: TextStyle) =>
  function T({ style, ...p }: TextProps) {
    return <Text {...p} style={[base, style]} />;
  };
export const H1 = make(type.h1);
export const H2 = make(type.h2);
export const Body = make(type.body);
export const Sub = make(type.sub);
export const Label = make(type.label);
export const Num = make(type.num);

export function Screen({ children, scroll = false, dark = false, style }: { children: ReactNode; scroll?: boolean; dark?: boolean; style?: StyleProp<ViewStyle> }) {
  const inner = [s.screenInner, style];
  return (
    <SafeAreaView style={[s.screen, dark && { backgroundColor: color.ink }]} edges={['top', 'left', 'right']}>
      {scroll ? <ScrollView contentContainerStyle={inner} showsVerticalScrollIndicator={false}>{children}</ScrollView> : <View style={[inner, { flex: 1 }]}>{children}</View>}
    </SafeAreaView>
  );
}

export function Card({ children, style, soft = false }: { children: ReactNode; style?: StyleProp<ViewStyle>; soft?: boolean }) {
  return <View style={[s.card, soft && s.soft, style]}>{children}</View>;
}

export function Row({ children, gap = space.s, style }: { children: ReactNode; gap?: number; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

/** Pressable that squishes down while held and springs back. containerStyle sizes the touch area in its parent (flex, width). */
export function Squishy({ style, containerStyle, children, ...p }: PressableProps & { style?: StyleProp<ViewStyle>; containerStyle?: StyleProp<ViewStyle>; children: ReactNode }) {
  const sc = useSharedValue(1);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }));
  return (
    <Pressable
      {...p}
      style={containerStyle}
      onPressIn={(e) => { sc.value = withSpring(0.95, spring.squish); p.onPressIn?.(e); }}
      onPressOut={(e) => { sc.value = withSpring(1, spring.squish); p.onPressOut?.(e); }}
    >
      <Animated.View style={[style, a]}>{children}</Animated.View>
    </Pressable>
  );
}

type ButtonKind = 'ink' | 'tomato' | 'saffron' | 'white';
const buttonColours: Record<ButtonKind, { bg: string; fg: string }> = {
  ink: { bg: color.ink, fg: color.bg },
  tomato: { bg: color.tomato, fg: '#FFFFFF' },
  saffron: { bg: color.saffron, fg: color.ink },
  white: { bg: color.card, fg: color.ink },
};
export function Button({ title, kind = 'ink', small = false, icon, style, ...p }: PressableProps & { title: string; kind?: ButtonKind; small?: boolean; icon?: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = buttonColours[kind];
  // flex and alignSelf size the touch area in the parent row, so they belong on the Pressable, not the inner view.
  const flat = StyleSheet.flatten(style) ?? {};
  const outer = flat.flex !== undefined || flat.alignSelf !== undefined ? { flex: flat.flex, alignSelf: flat.alignSelf } : undefined;
  return (
    <Squishy accessibilityRole="button" {...p} containerStyle={outer} style={[s.button, small && s.buttonSmall, { backgroundColor: c.bg }, kind !== 'white' ? shadow(2) : shadow(1), p.disabled && { opacity: 0.45 }, style]}>
      {icon}
      <Text style={[s.buttonText, small && { fontSize: 15 }, { color: c.fg }]}>{title}</Text>
    </Squishy>
  );
}

export function Chip({ label, tone: t = 'white', style }: { label: string; tone?: Tone; style?: StyleProp<ViewStyle> }) {
  const c = tone[t];
  return (
    <View style={[s.chip, { backgroundColor: c.bg }, t === 'white' && shadow(1), style]}>
      <Text style={[s.chipText, { color: c.fg }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  screenInner: { paddingHorizontal: space.l, paddingTop: space.m, paddingBottom: space.l, gap: space.m },
  card: { backgroundColor: color.card, borderRadius: radius.card, padding: 16, ...shadow(1) },
  soft: { borderRadius: 22, padding: 14 },
  button: { minHeight: 60, paddingHorizontal: 20, borderRadius: radius.button, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  buttonSmall: { minHeight: 44, borderRadius: 18, paddingHorizontal: 14 },
  buttonText: { fontFamily: font.display, fontSize: 18 },
  chip: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.chip },
  chipText: { fontFamily: font.bodyBold, fontSize: 13 },
});
