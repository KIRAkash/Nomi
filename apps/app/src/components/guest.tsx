// Pieces shared by the guest screens.
import { Face, FACE_FILLS, FACE_LABELS, Label, Num, Row, Squishy, Sub, color, font, shadow, usePop } from '@nomi/ui';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { sendFeedback } from '@/lib/api';
import { useGuest } from '@/lib/guest-store';

export function GuestHeader({ back = true }: { back?: boolean }) {
  const { page } = useGuest();
  const initials = page.restaurant.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <Row style={{ justifyContent: 'space-between' }}>
      <Row>
        {back && (
          <Squishy accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: color.card, alignItems: 'center', justifyContent: 'center', ...shadow(1) }}>
            <Text style={{ fontFamily: font.bodyBold, fontSize: 20, color: color.ink }}>‹</Text>
          </Squishy>
        )}
        <View style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: color.tomato, alignItems: 'center', justifyContent: 'center' }}>
          <Num style={{ color: '#FFFFFF', fontSize: 17 }}>{initials}</Num>
        </View>
        <View>
          <Text style={{ fontFamily: font.bodyBold, fontSize: 15, color: color.ink }}>{page.restaurant.name}</Text>
          <Sub style={{ fontSize: 13 }}>{[page.table.label, page.shift].filter(Boolean).join(' · ')}</Sub>
        </View>
      </Row>
    </Row>
  );
}

function FaceButton({ i, on, onPress, size }: { i: 0 | 1 | 2 | 3 | 4; on: boolean; onPress: () => void; size: number }) {
  const pop = usePop(on, 1.15);
  return (
    <Squishy accessibilityRole="button" accessibilityLabel={FACE_LABELS[i]} accessibilityState={{ selected: on }} onPress={onPress}>
      <Animated.View style={[{ width: size, height: size, borderRadius: size * 0.38, backgroundColor: on ? FACE_FILLS[i] : color.bg, alignItems: 'center', justifyContent: 'center' }, pop]}>
        <Face level={i} size={size * 0.62} />
      </Animated.View>
    </Squishy>
  );
}

/** Five faces in a puffy card; value is 1..5. */
export function FaceRow({ value, onChange, size = 54 }: { value: number | undefined; onChange: (v: 1 | 2 | 3 | 4 | 5) => void; size?: number }) {
  return (
    <View style={{ backgroundColor: color.card, borderRadius: 30, padding: 10, flexDirection: 'row', justifyContent: 'space-between', ...shadow(1) }}>
      {([0, 1, 2, 3, 4] as const).map((i) => (
        <FaceButton key={i} i={i} size={size} on={value === i + 1} onPress={() => onChange((i + 1) as 1 | 2 | 3 | 4 | 5)} />
      ))}
    </View>
  );
}

export function StepLabel({ children }: { children: string }) {
  return <Label>{children}</Label>;
}

/** Sends the visit and moves to the thank-you screen; returns the button state. */
export function useSend() {
  const g = useGuest();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const send = async () => {
    setSending(true);
    setError(null);
    try {
      // Voice notes upload once the storage endpoint lands; for now the visit is sent without audio.
      await sendFeedback(g.token, { dish_ids: g.picked.filter((id) => id.length === 36), ratings: g.ratings, answers: g.answers, text: g.text || undefined, photo_dish_id: g.photoDishId });
      router.replace({ pathname: '/t/[token]/thanks', params: { token: g.token } });
    } catch {
      if (g.token.startsWith('demo')) router.replace({ pathname: '/t/[token]/thanks', params: { token: g.token } });
      else setError('Could not send. Check your connection and try again.');
    } finally {
      setSending(false);
    }
  };
  return { send, sending, error };
}
