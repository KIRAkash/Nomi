// G3 · Pick what you ate: dish icons from the Golden Plates, tap to select.
import { Button, Chip, H1, Row, Screen, SquishIn, Squishy, Sub, color, font, shadow, usePop } from '@nomi/ui';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { DishIcon } from '@/components/dish-icon';
import { GuestHeader } from '@/components/guest';
import { useGuest } from '@/lib/guest-store';

function DishTile({ id, name, url, on, index }: { id: string; name: string; url: string | null; on: boolean; index: number }) {
  const { toggle } = useGuest();
  const pop = usePop(on, 1.04);
  return (
    <SquishIn index={index} style={{ width: '31%' }}>
      <Squishy containerStyle={{ flex: 1 }} accessibilityRole="button" accessibilityLabel={name} accessibilityState={{ selected: on }} onPress={() => toggle(id)}>
        <Animated.View style={[{ alignItems: 'center', gap: 4, paddingVertical: 12, paddingHorizontal: 6, borderRadius: 24, backgroundColor: on ? color.saffronSoft : color.card, borderWidth: 3, borderColor: on ? color.ink : 'transparent' }, shadow(1), pop]}>
          <DishIcon name={name} url={url} size={72} />
          <Text style={{ fontFamily: font.bodyBold, fontSize: 13, textAlign: 'center', color: color.ink }}>{name}</Text>
        </Animated.View>
      </Squishy>
    </SquishIn>
  );
}

export default function Pick() {
  const { page, picked, token } = useGuest();
  return (
    <Screen scroll>
      <GuestHeader />
      <Row style={{ justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <H1>What did you have?</H1>
          <Sub>Tap every dish you ate.</Sub>
        </View>
        <Chip tone="ink" label={picked.length ? `${picked.length} picked` : 'None yet'} />
      </Row>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' }}>
        {page.dishes.map((d, i) => <DishTile key={d.id} index={i} id={d.id} name={d.name} url={d.icon_url} on={picked.includes(d.id)} />)}
      </View>
      <Button title="Next" disabled={!picked.length} onPress={() => router.push({ pathname: '/t/[token]/questions', params: { token } })} />
    </Screen>
  );
}
