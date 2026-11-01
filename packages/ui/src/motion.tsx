// Motion presets: squish in on arrival, gentle float when idle, ripple while listening, pop on select.
import { useEffect, type ReactNode } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing, FadeInDown, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';

export const spring = { squish: { damping: 11, stiffness: 180, mass: 0.8 }, pop: { damping: 7, stiffness: 320 } } as const;

/** Arrives with a soft squish. Stagger siblings with index. */
export function SquishIn({ index = 0, style, children }: { index?: number; style?: StyleProp<ViewStyle>; children: ReactNode }) {
  return (
    <Animated.View entering={FadeInDown.delay(60 + index * 70).springify().damping(13).stiffness(170)} style={style}>
      {children}
    </Animated.View>
  );
}

/** A slow 6px float, for mascots and icons that should feel alive while the screen is still. */
export function Float({ amount = 6, delay = 0, style, children }: { amount?: number; delay?: number; style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const reduce = useReducedMotion();
  const y = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    y.value = withDelay(delay, withRepeat(withSequence(withTiming(-amount, { duration: 1500, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.quad) })), -1));
  }, [reduce, amount, delay, y]);
  const a = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={[style, a]}>{children}</Animated.View>;
}

/** A ring that grows and fades behind a button while it is active (recording, listening). */
export function Ripple({ active, color, radius, style }: { active: boolean; color: string; radius: number; style?: StyleProp<ViewStyle> }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = active ? withRepeat(withTiming(1, { duration: 1300, easing: Easing.out(Easing.quad) }), -1, false) : withTiming(0, { duration: 150 });
  }, [active, t]);
  const a = useAnimatedStyle(() => ({ opacity: active ? 0.5 * (1 - t.value) : 0, transform: [{ scale: 1 + 0.7 * t.value }] }));
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: radius, backgroundColor: color }, style, a]} />;
}

/** Returns a style that pops (overshoots, settles) every time `on` becomes true. */
export function usePop(on: boolean, to = 1.12) {
  const s = useSharedValue(1);
  useEffect(() => {
    // An underdamped spring overshoots and settles by itself, which is the pop.
    s.value = withSpring(on ? to : 1, spring.pop);
  }, [on, to, s]);
  return useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
}
