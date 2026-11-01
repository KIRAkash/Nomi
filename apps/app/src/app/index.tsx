// Entry: until phone OTP sign-in lands, pick a role to open its tabs, or open the guest page.
import { Button, Card, H1, H2, Screen, SquishIn, Sub } from '@nomi/ui';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { View } from 'react-native';

const logo = require('../../assets/images/nomi-plate.gif');

export default function Home() {
  return (
    <Screen scroll>
      <SquishIn style={{ alignItems: 'center', marginTop: 20 }}>
        <Image source={logo} style={{ width: 180, height: 180 }} accessibilityLabel="Nomi logo" />
        <H1 style={{ fontSize: 34, lineHeight: 38 }}>nomi</H1>
        <Sub>Every plate, the way the chef meant it.</Sub>
      </SquishIn>
      <SquishIn index={1}>
        <Card style={{ gap: 10 }}>
          <H2>Open as</H2>
          <Button title="Head Chef" onPress={() => router.push('/dishes')} />
          <Sub style={{ fontSize: 13 }}>Owner, Manager and Staff tabs arrive with their slices.</Sub>
        </Card>
      </SquishIn>
      <SquishIn index={2}>
        <Card soft style={{ gap: 10 }}>
          <H2>Guest page</H2>
          <Sub style={{ fontSize: 14 }}>What a diner sees after scanning the Table 7 QR.</Sub>
          <View><Button kind="saffron" title="Open nomi.app/t/demo-table-7" onPress={() => router.push({ pathname: '/t/[token]', params: { token: 'demo-table-7' } })} /></View>
        </Card>
      </SquishIn>
    </Screen>
  );
}
