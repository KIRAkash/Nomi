// Kitchen (Head Chef): tonight's watch list counted from last night's PASS plates by NIGHTSHIFT (shared with Today), the plating cards, the last handover and the closing round.
import { Button, Card, H2, Label, Row, Screen, SquishIn, Sub, color, font } from '@nomi/ui';
import { router } from 'expo-router';
import { Text } from 'react-native';

import { AiTag, TopBar } from '@/components/kit';
import { SopCard, WatchList } from '@/components/sop';
import { HANDOVERS, SOP_CARDS } from '@/lib/mock';
import { startNightshift, useNightshift } from '@/lib/nightshift';

export default function Kitchen() {
  const h = HANDOVERS[0];
  const night = useNightshift();
  return (
    <Screen scroll style={{ paddingBottom: 120 }}>
      <TopBar sub="Before service" title="Kitchen" />
      <SquishIn><WatchList live={night.result?.watch} running={night.status === 'running'} onRun={startNightshift} /></SquishIn>

      <SquishIn index={1}>
        <Card style={{ gap: 8 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <H2 style={{ fontSize: 17 }}>Last handover · {h.shift}</H2>
            <AiTag model="Voice Transcribe" />
          </Row>
          <Text style={{ fontFamily: font.bodyBold, fontSize: 13, color: color.tomatoInk }}>Problems: {h.summary.problems.join('; ')}</Text>
          <Text style={{ fontFamily: font.bodySemi, fontSize: 13, color: color.ink }}>Pending: {h.summary.pending.join('; ')}</Text>
          <Button small kind="white" title="Open handovers" onPress={() => router.push('/handover')} />
        </Card>
      </SquishIn>

      <Label>Plating cards</Label>
      {SOP_CARDS.map((c, i) => <SquishIn key={c.dishId} index={i + 2}><SopCard card={c} lang="en" /></SquishIn>)}

      <Card soft style={{ gap: 8 }}>
        <H2 style={{ fontSize: 17 }}>Closing round</H2>
        <Sub style={{ fontSize: 14 }}>2 of 6 spots done tonight.</Sub>
        <Button small kind="saffron" title="Continue the round" onPress={() => router.push('/closing')} />
      </Card>
    </Screen>
  );
}
