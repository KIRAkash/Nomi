// A22 · Spoken handover: at shift end the team holds to talk. Voice Transcribe labels who said what, Muse Spark sorts it
// into done / pending / problems, and the next shift reads it here.
import { Card, Chip, H2, Label, Row, Screen, SquishIn, Sub, color, font } from '@nomi/ui';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { AiTag, HoldToTalk, TopBar, WorkLine, useSteps } from '@/components/kit';
import { HANDOVERS } from '@/lib/mock';

const NEW = {
  id: 'h2', shift: 'Dinner → Close', when: 'Fri 23:20', durationS: 0,
  turns: [
    { speaker: 'Ravi', text: 'Biryani finished at ten forty, last two orders we said no.' },
    { speaker: 'Meena', text: 'Tandoor cleaned, naan dough for tomorrow in the walk-in, top shelf.' },
  ],
  summary: { done: ['Tandoor cleaned', 'Naan dough for tomorrow in the walk-in, top shelf'], pending: [] as string[], problems: ['Biryani ran out at 22:40; 2 orders turned away'] },
};

const SPEAKER_TONE: Record<string, string> = { Ravi: color.skySoft, Meena: color.pinkSoft };

function HandoverCard({ h }: { h: typeof NEW }) {
  return (
    <Card style={{ gap: 12 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <View>
          <H2 style={{ fontSize: 17 }}>{h.shift}</H2>
          <Sub style={{ fontSize: 12 }}>{h.when}</Sub>
        </View>
        <AiTag model="Muse Spark" />
      </Row>
      {([['Done', h.summary.done, 'mint'], ['Pending', h.summary.pending, 'saffron'], ['Problems', h.summary.problems, 'tomato']] as const).map(([t, xs, tn]) => xs.length > 0 && (
        <View key={t} style={{ gap: 4 }}>
          <Chip tone={tn} label={t} />
          {xs.map((x) => <Text key={x} style={{ fontFamily: font.bodySemi, fontSize: 15, color: color.ink }}>• {x}</Text>)}
        </View>
      ))}
      <Label>Who said what</Label>
      {h.turns.map((t, i) => (
        <View key={i} style={{ backgroundColor: SPEAKER_TONE[t.speaker] ?? color.bg, borderRadius: 16, padding: 10 }}>
          <Text style={{ fontFamily: font.bodyBold, fontSize: 12, color: color.ink2 }}>{t.speaker}</Text>
          <Text style={{ fontFamily: font.body, fontSize: 14, color: color.ink }}>{t.text}</Text>
        </View>
      ))}
    </Card>
  );
}

export default function Handover() {
  const [recorded, setRecorded] = useState(false);
  const s = useSteps(3, 800);
  const list = s.done ? [NEW, ...HANDOVERS] : HANDOVERS;
  return (
    <Screen scroll style={{ paddingBottom: 120 }}>
      <TopBar sub="End of shift" title="Handover" />
      {!s.done && (
        <Card style={{ gap: 14, paddingVertical: 22 }}>
          <HoldToTalk label="Hold to hand over" onDone={() => { setRecorded(true); s.start(); }} />
          <Sub style={{ textAlign: 'center', fontSize: 13 }}>Everyone can talk. Any language. Nomi works out who said what.</Sub>
          {recorded && (
            <View style={{ gap: 8 }}>
              <WorkLine state={s.state(0)} text="Writing it down" model="Voice Transcribe" />
              <WorkLine state={s.state(1)} text="Working out who spoke" model="Voice Transcribe" />
              <WorkLine state={s.state(2)} text="Sorting into done, pending, problems" model="Muse Spark" />
            </View>
          )}
        </Card>
      )}
      {list.map((h, i) => <SquishIn key={h.id} index={i}><HandoverCard h={h} /></SquishIn>)}
    </Screen>
  );
}
