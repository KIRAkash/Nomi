// G2 · Show your plate: the guest photographs the dish, Muse Spark names it, the guest confirms.
import { Button, Card, H1, H2, Row, Screen, SquishIn, Sub, color, font } from '@nomi/ui';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { DishIcon } from '@/components/dish-icon';
import { GuestHeader } from '@/components/guest';
import { recognise } from '@/lib/api';
import { useGuest } from '@/lib/guest-store';

type State =
  | { kind: 'idle' }
  | { kind: 'looking'; uri: string }
  | { kind: 'found'; uri: string; dishId: string }
  | { kind: 'unsure'; uri: string; reason: string };

export default function Plate() {
  const g = useGuest();
  const [s, setS] = useState<State>({ kind: 'idle' });
  const toPick = () => router.replace({ pathname: '/t/[token]/pick', params: { token: g.token } });

  const snap = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted && perm.canAskAgain === false) return setS({ kind: 'unsure', uri: '', reason: 'Camera access is off. You can pick your dish from the menu instead.' });
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], base64: true, quality: 0.6 });
    if (res.canceled || !res.assets?.[0]) return;
    const a = res.assets[0];
    setS({ kind: 'looking', uri: a.uri });
    try {
      const dataUrl = a.uri.startsWith('data:') ? a.uri : `data:${a.mimeType ?? 'image/jpeg'};base64,${a.base64}`;
      const r = await recognise(g.token, dataUrl);
      if (!r.is_food) setS({ kind: 'unsure', uri: a.uri, reason: "That doesn't look like a dish. Try again, or pick from the menu." });
      else if (r.dish_id && r.confidence >= 0.6) setS({ kind: 'found', uri: a.uri, dishId: r.dish_id });
      else setS({ kind: 'unsure', uri: a.uri, reason: "We couldn't tell which dish this is. Pick it from the menu." });
    } catch {
      setS({ kind: 'unsure', uri: a.uri, reason: "We couldn't check the photo right now. Pick your dish from the menu." });
    }
  };

  const found = s.kind === 'found' ? g.page.dishes.find((d) => d.id === s.dishId) : undefined;

  return (
    <Screen scroll>
      <GuestHeader />
      <View>
        <H1>Show us your plate</H1>
        <Sub>Fit the whole plate in the photo.</Sub>
      </View>

      <View style={{ height: 360, borderRadius: 26, backgroundColor: color.photo, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
        {s.kind !== 'idle' && s.uri ? <Image source={s.uri} style={{ width: '100%', height: '100%' }} contentFit="cover" /> : (
          <View style={{ width: 260, height: 260, borderRadius: 130, borderWidth: 4, borderStyle: 'dashed', borderColor: color.saffron }} />
        )}
        {s.kind === 'looking' && (
          <View style={{ position: 'absolute', bottom: 14, left: 14, right: 14, backgroundColor: color.card, borderRadius: 22, padding: 14, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <ActivityIndicator color={color.ink} />
            <Text style={{ fontFamily: font.bodyBold, color: color.ink }}>Looking at your plate…</Text>
          </View>
        )}
      </View>

      {found && (
        <SquishIn>
          <Card style={{ gap: 12 }}>
            <Row>
              <DishIcon name={found.name} url={found.icon_url} size={60} />
              <View style={{ flex: 1 }}>
                <Sub style={{ fontSize: 13 }}>Looks like</Sub>
                <H2>{found.name}</H2>
              </View>
            </Row>
            <Row>
              <Button small kind="white" title="Not this" style={{ flex: 1 }} onPress={toPick} />
              <Button small title="That's it" style={{ flex: 1 }} onPress={() => { g.setPhotoDish(found.id); router.push({ pathname: '/t/[token]/questions', params: { token: g.token } }); }} />
            </Row>
          </Card>
        </SquishIn>
      )}
      {s.kind === 'unsure' && (
        <Card soft style={{ gap: 10, backgroundColor: color.saffronSoft }}>
          <Text style={{ fontFamily: font.bodyBold, color: color.saffronInk, fontSize: 15 }}>{s.reason}</Text>
          <Button small title="Pick from the menu" onPress={toPick} />
        </Card>
      )}

      {(s.kind === 'idle' || s.kind === 'unsure') && <Button kind="saffron" title={s.kind === 'idle' ? 'Take the photo' : 'Try another photo'} onPress={snap} />}
    </Screen>
  );
}
