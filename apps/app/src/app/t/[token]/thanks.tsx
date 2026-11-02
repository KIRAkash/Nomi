// G6 · Thank you: sums up what was sent, and offers an optional reply on WhatsApp in the guest's language.
// The number is consented, stored hashed for counting and encrypted for the reply only, and never shown in analytics.
import { Button, Card, Face, H1, H2, Label, Row, Screen, SquishIn, Sub, color, font, shadow } from '@nomi/ui';
import { useState } from 'react';
import { Text, TextInput } from 'react-native';

import { useGuest } from '@/lib/guest-store';

export default function Thanks() {
  const g = useGuest();
  const [phone, setPhone] = useState('');
  const [saved, setSaved] = useState(false);
  const answered = Object.keys(g.answers).length;
  const rated = Object.keys(g.ratings).length;
  const lines = [
    rated && `${rated} ${rated === 1 ? 'dish' : 'dishes'} rated`,
    answered && `${answered} quick ${answered === 1 ? 'answer' : 'answers'}`,
    g.voiceUri && '1 voice note',
    g.text && '1 written note',
    g.photoDishId && '1 plate photo',
  ].filter(Boolean) as string[];
  const digits = phone.replace(/\D/g, '');

  return (
    <Screen scroll style={{ backgroundColor: color.saffron, alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
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
      <SquishIn index={4} style={{ alignSelf: 'stretch' }}>
        <Card style={{ gap: 10 }}>
          {saved ? (
            <>
              <H2 style={{ fontSize: 18 }}>We’ll reply on WhatsApp</H2>
              <Sub style={{ fontSize: 14 }}>In your language, once the manager has read your note. Your number is used for this reply only.</Sub>
            </>
          ) : (
            <>
              <H2 style={{ fontSize: 18 }}>Want a reply?</H2>
              <Sub style={{ fontSize: 14 }}>Optional. Leave your number for a WhatsApp reply, or come back to this page later.</Sub>
              <TextInput accessibilityLabel="Phone number for a reply, optional" keyboardType="phone-pad" value={phone} onChangeText={setPhone} placeholder="+91 98765 43210" placeholderTextColor={color.ink2}
                style={{ minHeight: 56, borderRadius: 20, backgroundColor: color.bg, paddingHorizontal: 16, fontFamily: font.bodyBold, fontSize: 18, color: color.ink, ...shadow(1) }} />
              <Button small title="Reply to me" disabled={digits.length < 10} onPress={() => setSaved(true)} />
              <Text style={{ fontFamily: font.body, fontSize: 12, color: color.ink2 }}>Staff see your note, never your number. No marketing messages.</Text>
            </>
          )}
        </Card>
      </SquishIn>
    </Screen>
  );
}
