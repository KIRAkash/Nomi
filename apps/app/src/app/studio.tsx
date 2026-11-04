// A5 + A24 · Studio: Muse Image draws table tents in the restaurant's style; each one carries that table's real QR code.
import { Button, Card, Chip, DishArt, H2, Label, Row, Screen, SquishIn, Sub, color, font, shadow } from '@nomi/ui';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { AiTag, Segmented, TopBar, WorkLine, useSteps } from '@/components/kit';
import { QR } from '@/components/qr';
import { guestUrl } from '@/lib/links';
import { TABLES } from '@/lib/mock';

const STYLES = [
  { id: 'warm', label: 'Warm brass', bg: color.saffron, fg: color.ink },
  { id: 'ink', label: 'Night', bg: color.ink, fg: color.bg },
  { id: 'fresh', label: 'Fresh mint', bg: color.mintSoft, fg: color.mintInk },
] as const;

function Tent({ table, token, s }: { table: string; token: string; s: (typeof STYLES)[number] }) {
  return (
    <View style={{ width: 210, backgroundColor: s.bg, borderRadius: 24, padding: 16, gap: 10, alignItems: 'center', ...shadow(1) }}>
      <Row gap={6}>
        <DishArt kind="biryani" size={30} />
        <Text style={{ fontFamily: font.displayBold, fontSize: 18, color: s.fg }}>Saffron House</Text>
      </Row>
      <Text style={{ fontFamily: font.display, fontSize: 20, color: s.fg, textAlign: 'center' }}>How was your meal?</Text>
      <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 8 }}><QR value={guestUrl(token)} size={130} /></View>
      <Text style={{ fontFamily: font.bodyBold, fontSize: 13, color: s.fg, textAlign: 'center' }}>Scan · tap · talk. 10 seconds.{'\n'}स्कैन करें, बोलें। 10 सेकंड।</Text>
      <Text style={{ fontFamily: font.bodySemi, fontSize: 12, color: s.fg, opacity: 0.8 }}>{table}</Text>
    </View>
  );
}

export default function Studio() {
  const [style, setStyle] = useState<(typeof STYLES)[number]['id']>('warm');
  const gen = useSteps(2, 1000);
  const s = STYLES.find((x) => x.id === style)!;
  return (
    <Screen scroll style={{ paddingBottom: 40 }}>
      <TopBar back sub="Brand kit" title="Studio" right={<View />} />
      <Segmented value={style} onChange={(v) => { setStyle(v); gen.reset(); }} options={STYLES.map((x) => ({ value: x.id, label: x.label }))} />

      {!gen.done ? (
        <Card style={{ gap: 12 }}>
          <H2 style={{ fontSize: 17 }}>Table tents for all {TABLES.length} tables</H2>
          <Sub style={{ fontSize: 14 }}>Drawn from your logo and the photos of your dining room, in one consistent style.</Sub>
          {gen.running && (
            <View style={{ gap: 8 }}>
              <WorkLine state={gen.state(0)} text="Matching your logo and colours" model="Muse Image" />
              <WorkLine state={gen.state(1)} text={`Laying out ${TABLES.length} tents with their QR codes`} />
            </View>
          )}
          <Button kind="saffron" title={gen.running ? 'Drawing…' : 'Draw the tents'} disabled={gen.running} onPress={gen.start} />
        </Card>
      ) : (
        <SquishIn style={{ gap: 12 }}>
          <Row style={{ justifyContent: 'space-between' }}><Label>{TABLES.length} tents · print-ready</Label><AiTag model="Muse Image" /></Row>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 8, paddingHorizontal: 2 }}>
            {TABLES.slice(0, 6).map((t) => <Tent key={t.label} table={t.label} token={t.token} s={s} />)}
          </ScrollView>
          <Chip tone="mint" label="Each QR opens only its own table" />
          <Button title="Print the tents" onPress={() => (globalThis as { print?: () => void }).print?.()} />
          <Sub style={{ fontSize: 12, textAlign: 'center' }}>A4, 2 tents per page, fold line marked.</Sub>
        </SquishIn>
      )}

      <Card soft style={{ gap: 6 }}>
        <H2 style={{ fontSize: 16 }}>Coming next in Studio</H2>
        <Sub style={{ fontSize: 13 }}>Menu cards and dish posters that use your Golden Plate photo as the reference, so the picture matches what you serve.</Sub>
      </Card>
    </Screen>
  );
}
