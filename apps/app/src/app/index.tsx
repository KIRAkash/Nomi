// Welcome: sign in to the staff app, set up a new restaurant, or open the guest page a diner sees.
import { Button, Card, Float, H1, H2, Row, Screen, SquishIn, Sub, color, font } from '@nomi/ui';
import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { Text, View } from 'react-native';

import { useSession } from '@/lib/session';

const logo = require('../../assets/images/nomi-plate.gif');

const PROMISES = [
  { t: 'Golden Plates', s: 'The chef sets the standard once. Every plate is checked against it.', bg: color.saffronSoft },
  { t: '10-second feedback', s: 'Guests scan, tap or talk in any language. No app, no sign-in.', bg: color.skySoft },
  { t: 'One morning briefing', s: 'Nomi links what guests said, what plates showed and what ran out.', bg: color.mintSoft },
];

export default function Welcome() {
  const { signedIn, home } = useSession();
  if (signedIn) return <Redirect href={home()} />;

  return (
    <Screen scroll>
      <SquishIn style={{ alignItems: 'center', marginTop: 12 }}>
        <Float><Image source={logo} style={{ width: 168, height: 168 }} accessibilityLabel="Nomi logo, a golden plate" /></Float>
        <H1 style={{ fontSize: 40, lineHeight: 44 }}>nomi</H1>
        <Sub style={{ textAlign: 'center' }}>Every plate, the way the chef meant it.</Sub>
      </SquishIn>

      {PROMISES.map((p, i) => (
        <SquishIn key={p.t} index={i + 1}>
          <View style={{ backgroundColor: p.bg, borderRadius: 22, padding: 14 }}>
            <H2 style={{ fontSize: 17 }}>{p.t}</H2>
            <Sub style={{ fontSize: 14 }}>{p.s}</Sub>
          </View>
        </SquishIn>
      ))}

      <SquishIn index={4} style={{ gap: 10 }}>
        <Button title="Sign in with phone" onPress={() => router.push('/sign-in')} />
        <Button kind="white" title="Set up a new restaurant" onPress={() => router.push('/setup')} />
      </SquishIn>

      <SquishIn index={5}>
        <Card soft style={{ gap: 8 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <H2 style={{ fontSize: 17 }}>See it as a guest</H2>
            <Text style={{ fontFamily: font.bodyBold, fontSize: 12, color: color.ink2 }}>Table 7 QR</Text>
          </Row>
          <Sub style={{ fontSize: 14 }}>The page a diner opens after scanning the table tent.</Sub>
          <Button small kind="saffron" title="Open the guest page" onPress={() => router.push({ pathname: '/t/[token]', params: { token: 'demo-table-7' } })} />
        </Card>
      </SquishIn>
    </Screen>
  );
}
