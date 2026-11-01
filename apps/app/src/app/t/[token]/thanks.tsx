// G6 · Thank you: sums up what was sent.
import { Card, Face, H1, Label, Row, Screen, SquishIn, Sub, color, font } from '@nomi/ui';
import { Text } from 'react-native';

import { useGuest } from '@/lib/guest-store';

export default function Thanks() {
  const g = useGuest();
  const answered = Object.keys(g.answers).length;
  const rated = Object.keys(g.ratings).length;
  const lines = [
    rated && `${rated} ${rated === 1 ? 'dish' : 'dishes'} rated`,
    answered && `${answered} quick ${answered === 1 ? 'answer' : 'answers'}`,
    g.voiceUri && '1 voice note',
    g.text && '1 written note',
    g.photoDishId && '1 plate photo',
  ].filter(Boolean) as string[];

  return (
    <Screen style={{ backgroundColor: color.saffron, alignItems: 'center', justifyContent: 'center' }}>
      <SquishIn>
        <Card style={{ width: 140, height: 140, borderRadius: 50, alignItems: 'center', justifyContent: 'center', backgroundColor: color.bg }}>
          <Face level={4} size={92} />
        </Card>
      </SquishIn>
      <SquishIn index={1}><H1 style={{ fontSize: 36, lineHeight: 42, textAlign: 'center' }}>Thank you!{'\n'}धन्यवाद</H1></SquishIn>
      <SquishIn index={2}><Sub style={{ color: color.ink, textAlign: 'center' }}>Straight to the kitchen. The chef reads every note.</Sub></SquishIn>
      {lines.length > 0 && (
        <SquishIn index={3} style={{ alignSelf: 'stretch' }}>
          <Card style={{ gap: 8 }}>
            <Label>You sent</Label>
            {lines.map((l) => (
              <Row key={l}><Text style={{ fontFamily: font.bodySemi, fontSize: 15, color: color.ink }}>• {l}</Text></Row>
            ))}
          </Card>
        </SquishIn>
      )}
    </Screen>
  );
}
