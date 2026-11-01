// G4 · Questions per dish: five faces, then the chef's own 2–3 questions, one dish at a time.
import { Button, Card, Float, H1, Label, Row, Screen, SquishIn, Squishy, Sub, color, font, usePop } from '@nomi/ui';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { DishIcon } from '@/components/dish-icon';
import { FaceRow, GuestHeader, useSend } from '@/components/guest';
import { useGuest } from '@/lib/guest-store';

function Pill({ label, on, good, onPress }: { label: string; on: boolean; good: boolean; onPress: () => void }) {
  const pop = usePop(on, 1.06);
  return (
    <Squishy accessibilityRole="button" accessibilityState={{ selected: on }} onPress={onPress}>
      <Animated.View style={[{ minHeight: 44, paddingHorizontal: 16, borderRadius: 18, justifyContent: 'center', backgroundColor: on ? (good ? color.mint : color.tomato) : color.bg }, pop]}>
        <Text style={{ fontFamily: font.bodyBold, fontSize: 14, color: on ? '#FFFFFF' : color.ink }}>{label}</Text>
      </Animated.View>
    </Squishy>
  );
}

export default function Questions() {
  const g = useGuest();
  const dishes = g.page.dishes.filter((d) => g.picked.includes(d.id));
  const [step, setStep] = useState(0);
  const { send, sending, error } = useSend();
  const dish = dishes[step];
  if (!dish) return null;
  const last = step === dishes.length - 1;

  return (
    <Screen scroll>
      <GuestHeader />
      <View style={{ flexDirection: 'row', gap: 6 }} accessibilityLabel={`Dish ${step + 1} of ${dishes.length}`}>
        {dishes.map((d, i) => <View key={d.id} style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: i <= step ? color.ink : color.saffronSoft }} />)}
      </View>

      <SquishIn key={dish.id}>
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Float amount={4}><DishIcon name={dish.name} url={dish.icon_url} size={84} /></Float>
          <View style={{ flex: 1 }}>
            <Sub style={{ fontSize: 13 }}>Dish {step + 1} of {dishes.length}</Sub>
            <H1 style={{ fontSize: 26 }}>{dish.name}</H1>
          </View>
        </Card>
      </SquishIn>

      <FaceRow value={g.ratings[dish.id]} onChange={(v) => g.rate(dish.id, v)} />

      {dish.guest_questions.length > 0 && <Label>The chef wants to know</Label>}
      {dish.guest_questions.map((q, i) => (
        <SquishIn key={q.id} index={i + 1}>
          <Card soft style={{ gap: 10 }}>
            <Text style={{ fontFamily: font.bodyBold, fontSize: 16, color: color.ink }}>{q.text}</Text>
            <Row>
              <Pill label={q.yes_label} good on={g.answers[q.id] === 'yes'} onPress={() => g.answer(q.id, 'yes')} />
              <Pill label={q.no_label} good={false} on={g.answers[q.id] === 'no'} onPress={() => g.answer(q.id, 'no')} />
            </Row>
          </Card>
        </SquishIn>
      ))}

      {error && <Text style={{ color: color.tomatoInk, fontFamily: font.bodyBold }}>{error}</Text>}
      {last ? (
        <>
          <Button title="Add a voice note or photo" onPress={() => router.push({ pathname: '/t/[token]/talk', params: { token: g.token } })} />
          <Button title={sending ? 'Sending…' : 'Done, send it'} kind="white" disabled={sending} onPress={send} />
        </>
      ) : (
        <Button title="Next dish" onPress={() => setStep(step + 1)} />
      )}
    </Screen>
  );
}
