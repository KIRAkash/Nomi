// The Clay Tiffin floating ink nav: one pill per tab of the signed-in role, saffron when active.
import { color, font, shadow, Squishy } from '@nomi/ui';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { NOTES } from '@/lib/mock';
import { ROLE_TABS, useSession } from '@/lib/session';

const ICONS: Record<string, (c: string) => React.ReactNode> = {
  today: (c) => <><Circle cx={12} cy={12} r={4} stroke={c} /><Path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" stroke={c} /></>,
  dishes: (c) => <><Circle cx={12} cy={13} r={8} stroke={c} /><Circle cx={12} cy={13} r={4} stroke={c} /></>,
  pass: (c) => <><Path d="M4 8h3l2-3h6l2 3h3v11H4z" stroke={c} /><Circle cx={12} cy={13} r={3.5} stroke={c} /></>,
  feedback: (c) => <Path d="M4 5h16v11H9l-5 4z" stroke={c} />,
  kitchen: (c) => <><Path d="M7 14a4 4 0 1 1 1.5-7.7A4.5 4.5 0 0 1 16.6 6 4 4 0 1 1 17 14" stroke={c} /><Path d="M7 14v6h10v-6" stroke={c} /></>,
  insights: (c) => <Path d="M4 20V10M10 20V4M16 20v-7M22 20H2" stroke={c} />,
  larder: (c) => <><Rect x={4} y={3} width={16} height={18} rx={2} stroke={c} /><Path d="M4 9h16M4 15h16" stroke={c} /></>,
  team: (c) => <><Circle cx={9} cy={8} r={3.5} stroke={c} /><Path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6M16 4.5a3.5 3.5 0 0 1 0 7M18 14c2 .7 3 2.8 3 6" stroke={c} /></>,
  cards: (c) => <><Rect x={3} y={6} width={14} height={15} rx={2} stroke={c} /><Path d="M7 3h12a2 2 0 0 1 2 2v12" stroke={c} /></>,
  handover: (c) => <><Rect x={9} y={3} width={6} height={11} rx={3} stroke={c} /><Path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke={c} /></>,
};

const unread = NOTES.filter((n) => n.status === 'new').length;

export function ClayTabBar({ state, descriptors, navigateToTab, insets }: BottomTabBarProps) {
  const { role } = useSession();
  const allowed = ROLE_TABS[role];
  const routes = allowed.map((name) => state.routes.find((r) => r.name === name)).filter((r) => r !== undefined);
  const active = state.routes[state.index]?.key;
  return (
    <View accessibilityRole="tablist" style={{ position: 'absolute', left: 16, right: 16, bottom: Math.max(insets.bottom, 12), maxWidth: 560, alignSelf: 'center', marginHorizontal: 'auto', backgroundColor: color.ink, borderRadius: 30, padding: 8, flexDirection: 'row', gap: 4, ...shadow(2) }}>
      {routes.map((route) => {
        const on = route.key === active;
        const title = descriptors[route.key].options.title ?? route.name;
        const fg = on ? color.ink : color.saffronSoft;
        const badge = route.name === 'feedback' && unread > 0 ? unread : 0;
        return (
          <Squishy
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={badge ? `${title}, ${badge} new` : title}
            onPress={() => { if (!on) navigateToTab(route.key); }}
            containerStyle={{ flex: 1 }}
            style={{ minHeight: 52, borderRadius: 22, alignItems: 'center', justifyContent: 'center', gap: 2, backgroundColor: on ? color.saffron : 'transparent' }}
          >
            <View>
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">{ICONS[route.name]?.(fg)}</Svg>
              {badge > 0 && (
                <View style={{ position: 'absolute', top: -6, right: -10, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: color.tomato, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
                  <Text style={{ fontFamily: font.bodyBold, fontSize: 11, color: '#fff' }}>{badge}</Text>
                </View>
              )}
            </View>
            <Text style={{ fontFamily: font.bodyBold, fontSize: 12, color: fg }}>{title}</Text>
          </Squishy>
        );
      })}
    </View>
  );
}
