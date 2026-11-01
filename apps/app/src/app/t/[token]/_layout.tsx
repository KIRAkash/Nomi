import type { GuestPage } from '@nomi/shared';
import { Body, Button, H1, Screen, color } from '@nomi/ui';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { loadGuestPage } from '@/lib/api';
import { GuestProvider } from '@/lib/guest-store';

export default function GuestLayout() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [page, setPage] = useState<GuestPage | null>(null);
  const [failed, setFailed] = useState(false);

  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    loadGuestPage(token).then((p) => alive && setPage(p), () => alive && setFailed(true));
    return () => { alive = false; };
  }, [token, attempt]);
  const retry = () => { setFailed(false); setAttempt((n) => n + 1); };

  if (failed)
    return (
      <Screen style={{ justifyContent: 'center' }}>
        <H1>We couldn&apos;t open this table</H1>
        <Body>Check your connection, or ask a member of staff for a fresh QR code.</Body>
        <Button title="Try again" onPress={retry} />
      </Screen>
    );
  if (!page)
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.bg }}>
        <ActivityIndicator color={color.ink} size="large" />
      </View>
    );

  return (
    <GuestProvider token={token} page={page}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.bg }, animation: 'slide_from_right' }} />
    </GuestProvider>
  );
}
