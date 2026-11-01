// C6 · Dish Performance: the chef's home, dishes sorted by what needs attention.
// Scores come from PASS captures once Golden Plates are published; until then the list shows coverage only.
import { Button, Card, Chip, Float, H1, H2, Label, Num, Row, Screen, SquishIn, Sub, color } from '@nomi/ui';
import { Image } from 'expo-image';
import { View } from 'react-native';

import { DishIcon } from '@/components/dish-icon';
import { DEMO_GUEST_PAGE } from '@/lib/demo';

const logo = require('../../../assets/images/nomi-plate.gif');

export default function Dishes() {
  const dishes = DEMO_GUEST_PAGE.dishes;
  const protectedCount = 0;

  return (
    <Screen scroll style={{ paddingBottom: 120 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <View>
          <Sub style={{ fontSize: 14 }}>{DEMO_GUEST_PAGE.restaurant.name}</Sub>
          <H1>Hi Chef!</H1>
        </View>
        <Float><Image source={logo} style={{ width: 64, height: 64 }} accessibilityLabel="Nomi" /></Float>
      </Row>

      <SquishIn>
        <Card style={{ backgroundColor: color.saffron, gap: 10 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <H2>Golden Plates</H2>
            <Num style={{ fontSize: 24 }}>{protectedCount}<Sub style={{ color: color.ink }}> of {dishes.length} protected</Sub></Num>
          </Row>
          <View style={{ height: 10, borderRadius: 6, backgroundColor: color.bg, overflow: 'hidden' }}>
            <View style={{ width: `${(protectedCount / dishes.length) * 100}%`, height: '100%', backgroundColor: color.ink }} />
          </View>
          <Button small title="+ Add a Golden Plate" style={{ alignSelf: 'flex-start' }} />
        </Card>
      </SquishIn>

      <Label>Your menu</Label>
      {dishes.map((d, i) => (
        <SquishIn key={d.id} index={i + 1}>
          <Card soft style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <DishIcon name={d.name} url={d.icon_url} size={56} />
            <View style={{ flex: 1 }}>
              <H2 style={{ fontSize: 17 }}>{d.name}</H2>
              <Sub style={{ fontSize: 13 }}>{d.category}</Sub>
            </View>
            <Chip tone="saffron" label="Set up" />
          </Card>
        </SquishIn>
      ))}
    </Screen>
  );
}
