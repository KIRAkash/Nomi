// G5 · Just say it: hold to talk in any language, then Nomi reads back the tags it heard and the guest removes any wrong one.
// Muse Voice Transcribe + Muse Spark run on the server; the demo table shows prepared tags so the page works offline.
import { Button, Card, Chip, H1, H2, Label, Ripple, Row, Screen, SquishIn, Squishy, Sub, color, font } from '@nomi/ui';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { GuestHeader, useSend } from '@/components/guest';
import { useGuest } from '@/lib/guest-store';

const DEMO_TAGS = ['Biryani · small portion', 'Biryani · tasty', 'Service · friendly'];

export default function Talk() {
  const g = useGuest();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const state = useAudioRecorderState(recorder);
  const [denied, setDenied] = useState(false);
  const [typing, setTyping] = useState(false);
  const [hearing, setHearing] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const { send, sending, error } = useSend();

  const start = async () => {
    const perm = await AudioModule.requestRecordingPermissionsAsync();
    if (!perm.granted) return setDenied(true);
    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
  };
  const stop = async () => {
    if (!state.isRecording) return;
    await recorder.stop();
    g.setVoice(recorder.uri);
    // Server returns tags from Voice Transcribe + Spark; the demo table reads back prepared ones.
    if (g.token.startsWith('demo')) setHearing(true);
  };

  useEffect(() => {
    if (!hearing) return;
    const t = setTimeout(() => { setTags(DEMO_TAGS); setHearing(false); }, 1300);
    return () => clearTimeout(t);
  }, [hearing]);

  const secs = Math.round((state.durationMillis ?? 0) / 1000);
  const label = state.isRecording ? `Listening… 0:${String(secs).padStart(2, '0')}` : g.voiceUri ? 'Got it! Hold to record again' : 'Hold to talk';

  return (
    <Screen scroll>
      <GuestHeader />
      <View>
        <H1>Tell us anything</H1>
        <Sub>Food, service, wait time, the place. Hinglish is perfect.</Sub>
      </View>

      <Card style={{ alignItems: 'center', gap: 14, paddingVertical: 24 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Hold to record a voice note" onPressIn={start} onPressOut={stop}
          style={{ width: 116, height: 116, borderRadius: 42, backgroundColor: color.tomato, alignItems: 'center', justifyContent: 'center' }}>
          <Ripple active={state.isRecording} color={color.tomato} radius={42} />
          <Svg width={42} height={42} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round">
            <Rect x={9} y={3} width={6} height={11} rx={3} />
            <Path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
          </Svg>
        </Pressable>
        <H2>{label}</H2>
        {denied && <Text style={{ fontFamily: font.bodyBold, color: color.tomatoInk, textAlign: 'center' }}>Microphone is off. You can type instead.</Text>}
      </Card>

      {hearing && (
        <Row style={{ justifyContent: 'center' }}>
          <ActivityIndicator color={color.ink} />
          <Text style={{ fontFamily: font.bodyBold, color: color.ink, fontSize: 15 }}>Listening back…</Text>
        </Row>
      )}

      {tags.length > 0 && !hearing && (
        <SquishIn>
          <Card soft style={{ gap: 10 }}>
            <Label>Nomi heard</Label>
            <Row gap={8} style={{ flexWrap: 'wrap' }}>
              {tags.map((t) => (
                <Squishy key={t} accessibilityRole="button" accessibilityLabel={`Remove ${t}`} onPress={() => setTags((x) => x.filter((y) => y !== t))}
                  style={{ minHeight: 40, paddingHorizontal: 12, borderRadius: 14, backgroundColor: color.saffronSoft, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontFamily: font.bodyBold, fontSize: 14, color: color.saffronInk }}>{t}</Text>
                  <Text style={{ fontFamily: font.bodyBold, fontSize: 15, color: color.saffronInk }}>×</Text>
                </Squishy>
              ))}
            </Row>
            <Sub style={{ fontSize: 13 }}>Wrong one? Tap it to remove it.</Sub>
          </Card>
        </SquishIn>
      )}
      {g.voiceUri && !state.isRecording && !hearing && tags.length === 0 && <Chip tone="mint" label="Voice note added" />}

      {typing || denied ? (
        <TextInput
          accessibilityLabel="Your feedback"
          multiline
          placeholder="Type here…"
          placeholderTextColor={color.ink2}
          value={g.text}
          onChangeText={g.setText}
          style={{ minHeight: 110, borderRadius: 22, backgroundColor: color.card, padding: 16, fontFamily: font.body, fontSize: 16, color: color.ink, textAlignVertical: 'top' }}
        />
      ) : (
        <Button kind="white" small title="Type instead" onPress={() => setTyping(true)} />
      )}

      {error && <Text style={{ color: color.tomatoInk, fontFamily: font.bodyBold }}>{error}</Text>}
      <Row>
        <Button title={sending ? 'Sending…' : 'Send'} style={{ flex: 1 }} disabled={sending || state.isRecording || hearing} onPress={send} />
      </Row>
    </Screen>
  );
}
