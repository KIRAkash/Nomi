// The Clay Tiffin floating ink nav: one pill per tab, saffron when active.
import { color, font, shadow, Squishy } from '@nomi/ui';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

const ICONS: Record<string, (c: string) => React.ReactNode> = {
  dishes: (c) => <><Circle cx={12} cy={13} r={8} stroke={c} /><Circle cx={12} cy={13} r={4} stroke={c} /></>,
  pass: (c) => <><Path d="M4 8h3l2-3h6l2 3h3v11H4z" stroke={c} /><Circle cx={12} cy={13} r={3.5} stroke={c} /></>,
  feedback: (c) => <Path d="M4 5h16v11H9l-5 4z" stroke={c} />,
  kitchen: (c) => <><Path d="M7 14a4 4 0 1 1 1.5-7.7A4.5 4.5 0 0 1 16.6 6 4 4 0 1 1 17 14" stroke={c} /><Path d="M7 14v6h10v-6" stroke={c} /></>,
};

export function ClayTabBar({ state, descriptors, navigateToTab, insets }: BottomTabBarProps) {
  return (
    <View style={{ position: 'absolute', left: 16, right: 16, bottom: Math.max(insets.bottom, 12), backgroundColor: color.ink, borderRadius: 30, padding: 8, flexDirection: 'row', gap: 4, ...shadow(2) }}>
      {state.routes.map((route, i) => {
        const on = state.index === i;
        const title = descriptors[route.key].options.title ?? route.name;
        const fg = on ? color.ink : color.saffronSoft;
        return (
          <Squishy
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={title}
            onPress={() => { if (!on) navigateToTab(route.key); }}
            containerStyle={{ flex: 1 }}
            style={{ minHeight: 52, borderRadius: 22, alignItems: 'center', justifyContent: 'center', gap: 2, backgroundColor: on ? color.saffron : 'transparent' }}
          >
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">{ICONS[route.name]?.(fg)}</Svg>
            <Text style={{ fontFamily: font.bodyBold, fontSize: 12, color: fg }}>{title}</Text>
          </Squishy>
        );
      })}
    </View>
  );
}
