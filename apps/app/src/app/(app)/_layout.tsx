// Every staff tab lives here; the tab bar shows only the signed-in role's tabs (spec section 10).
import { Tabs } from 'expo-router';

import { ClayTabBar } from '@/components/tab-bar';

export default function StaffTabs() {
  return (
    <Tabs tabBar={(p) => <ClayTabBar {...p} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="today" options={{ title: 'Today' }} />
      <Tabs.Screen name="dishes" options={{ title: 'Dishes' }} />
      <Tabs.Screen name="pass" options={{ title: 'Pass' }} />
      <Tabs.Screen name="feedback" options={{ title: 'Feedback' }} />
      <Tabs.Screen name="kitchen" options={{ title: 'Kitchen' }} />
      <Tabs.Screen name="insights" options={{ title: 'Insights' }} />
      <Tabs.Screen name="larder" options={{ title: 'Larder' }} />
      <Tabs.Screen name="team" options={{ title: 'Team' }} />
      <Tabs.Screen name="check" options={{ title: 'Check' }} />
      <Tabs.Screen name="cards" options={{ title: 'Cards' }} />
      <Tabs.Screen name="handover" options={{ title: 'Handover' }} />
    </Tabs>
  );
}
