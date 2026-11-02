// G2 · Show your plate: the guest lines the plate up in the live camera, Muse Spark names it, the guest confirms.
import { Button, Card, H1, H2, Row, Screen, SquishIn, Sub, color, font } from '@nomi/ui';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { LiveCamera, Shutter, type CameraHandle } from '@/components/camera';
import { DishIcon } from '@/components/dish-icon';
import { GuestHeader } from '@/components/guest';
import { recognise } from '@/lib/api';
import { useGuest } from '@/lib/guest-store';
import { shotsUnder } from '@/lib/shots';

const FEED = [...shotsUnder('').filter((k) => k.includes('/guest-')), ...shotsUnder('').filter((k) => k.endsWith('/golden-1'))];

type State =
  | { kind: 'idle' }
  | { kind: 'looking'; uri: string }
  | { kind: 'found'; uri: string; dishId: string }
  | { kind: 'unsure'; uri: string; reason: string };

export default function Plate() {
  const g = useGuest();
  const [s, setS] = useState<State>({ kind: 'idle' });
  const toPick = () => router.replace({ pathname: '/t/[token]/pick', params: { token: g.token } });

  const cam = useRef<CameraHandle>(null);
  const [ready, setReady] = useState(false);

  const snap = async () => {
    const a = await cam.current?.snap();
    if (!a) return;
    setS({ kind: 'looking', uri: a.uri });
    try {
      const r = await recognise(g.token, a.dataUrl);
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
        <Sub>Fit the whole plate inside the circle.</Sub>
      </View>

      <LiveCamera ref={cam} height={360} guide="plate" still={s.kind === 'idle' ? null : s.uri || null} onReady={setReady} demo={FEED}>
        {s.kind === 'looking' && (
          <View style={{ position: 'absolute', bottom: 14, left: 14, right: 14, backgroundColor: color.card, borderRadius: 22, padding: 14, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <ActivityIndicator color={color.ink} />
            <Text style={{ fontFamily: font.bodyBold, color: color.ink }}>Looking at your plate…</Text>
          </View>
        )}
      </LiveCamera>

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

      {s.kind === 'idle' && <Shutter onPress={snap} disabled={!ready} label="Take the photo of your plate" />}
      {s.kind === 'idle' && <Button small kind="white" title="Pick from the menu instead" onPress={toPick} />}
      {s.kind === 'unsure' && <Button kind="saffron" title="Try another photo" onPress={() => setS({ kind: 'idle' })} />}
    </Screen>
  );
}
