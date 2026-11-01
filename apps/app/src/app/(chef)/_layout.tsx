import { Tabs } from 'expo-router';

import { ClayTabBar } from '@/components/tab-bar';

export default function ChefTabs() {
  return (
    <Tabs tabBar={(p) => <ClayTabBar {...p} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="dishes" options={{ title: 'Dishes' }} />
      <Tabs.Screen name="pass" options={{ title: 'Pass' }} />
      <Tabs.Screen name="feedback" options={{ title: 'Feedback' }} />
      <Tabs.Screen name="kitchen" options={{ title: 'Kitchen' }} />
    </Tabs>
  );
}
