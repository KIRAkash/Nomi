// G1 · Choose your way: show the plate, pick dishes, or just talk.
import { Float, H1, H2, Ripple, Row, Screen, SquishIn, Squishy, Sub, color, shadow } from '@nomi/ui';
import { router } from 'expo-router';
import { type ReactNode } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { DishIcon } from '@/components/dish-icon';
import { GuestHeader } from '@/components/guest';
import { useGuest } from '@/lib/guest-store';

function Door({ bg, art, title, sub, onPress, index }: { bg: string; art: ReactNode; title: string; sub: string; onPress: () => void; index: number }) {
  return (
    <SquishIn index={index}>
      <Squishy accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={{ backgroundColor: bg, borderRadius: 26, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14, ...shadow(1) }}>
        <View style={{ width: 76, height: 76 }}>{art}</View>
        <View style={{ flex: 1 }}>
          <H2>{title}</H2>
          <Sub style={{ fontSize: 14 }}>{sub}</Sub>
        </View>
      </Squishy>
    </SquishIn>
  );
}

export default function ChooseYourWay() {
  const { token, page } = useGuest();
  const paths = { plate: '/t/[token]/plate', pick: '/t/[token]/pick', talk: '/t/[token]/talk' } as const;
  const go = (screen: keyof typeof paths) => router.push({ pathname: paths[screen], params: { token } });
  const sample = page.dishes.slice(0, 3);

  return (
    <Screen scroll>
      <GuestHeader back={false} />
      <SquishIn>
        <Row style={{ alignItems: 'flex-end' }}>
          <View style={{ flex: 1 }}>
            <H1 style={{ fontSize: 32, lineHeight: 36 }}>How was {page.shift?.toLowerCase() ?? 'your meal'}?</H1>
            <Sub>Tell us your way. About 10 seconds.</Sub>
          </View>
        </Row>
      </SquishIn>

      <Door index={1} bg={color.skySoft} title="Show us your plate" sub="Point your camera. Nomi knows the dish." onPress={() => go('plate')}
        art={
          <Float amount={4}>
            <View style={{ width: 76, height: 76, borderRadius: 26, backgroundColor: color.sky, alignItems: 'center', justifyContent: 'center' }}>
              <Svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M4 8h3l2-3h6l2 3h3v11H4z" />
                <Circle cx={12} cy={13} r={3.5} />
              </Svg>
            </View>
          </Float>
        } />

      <Door index={2} bg={color.saffronSoft} title="Pick what you ate" sub="Tap the dishes, answer 2 quick questions." onPress={() => go('pick')}
        art={
          <View style={{ width: 76, height: 76 }}>
            {sample.map((d, i) => (
              <Float key={d.id} delay={i * 400} amount={4} style={{ position: 'absolute', left: [0, 26, 12][i], top: [0, 8, 30][i] }}>
                <DishIcon name={d.name} url={d.icon_url} size={48} />
              </Float>
            ))}
          </View>
        } />

      <Door index={3} bg={color.tomatoSoft} title="Just say it" sub="Food, service, the vibe. Any language." onPress={() => go('talk')}
        art={
          <View style={{ width: 76, height: 76, borderRadius: 26, backgroundColor: color.tomato, alignItems: 'center', justifyContent: 'center' }}>
            <Ripple active color={color.tomato} radius={26} />
            <Svg width={38} height={38} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round">
              <Rect x={9} y={3} width={6} height={11} rx={3} />
              <Path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
            </Svg>
          </View>
        } />

      <Text style={{ textAlign: 'center', color: color.ink2, fontSize: 13, marginTop: 8 }}>No app, no sign-in. Your photo helps the chef keep every plate right.</Text>
    </Screen>
  );
}
