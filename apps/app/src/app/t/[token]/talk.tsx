// G5 · Just say it: hold to talk in any language. Muse Voice Transcribe writes down exactly what was said, Muse Spark
// tags it, and the guest sees both and removes any wrong tag. The words go with the feedback.
import { Button, Card, H1, Label, Row, Screen, SquishIn, Squishy, Sub, color, font } from '@nomi/ui';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { GuestHeader, useSend } from '@/components/guest';
import { AiTag, HoldToTalk, LiveWait, type VoiceNote } from '@/components/kit';
import { sendVoice, type Heard } from '@/lib/api';
import { useGuest } from '@/lib/guest-store';

const SAMPLE = { file: require('../../../../assets/audio/sample-guest.m4a'), says: 'बिरयानी बहुत टेस्टी थी… (Hindi)' };

export default function Talk() {
  const g = useGuest();
  const [typing, setTyping] = useState(false);
  const [hearing, setHearing] = useState(false);
  const [heard, setHeard] = useState<Heard | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [failed, setFailed] = useState<string | null>(null);
  const { send, sending, error } = useSend();

  const listen = async (note: VoiceNote) => {
    g.setVoice(note.uri);
    setHearing(true);
    setFailed(null);
    try {
      const h = await sendVoice(note.audio, 'feedback');
      if (!h.transcript) { setFailed("We couldn't hear any words. Try again a little closer to the phone, or type instead."); return; }
      setHeard(h);
      setTags(h.tags?.tags.map((t) => t.label) ?? []);
      g.setText([g.text, h.transcript].filter(Boolean).join('\n'));
    } catch (err) {
      setFailed(`We couldn't listen to that right now (${(err as Error).message}). You can type instead.`);
      setTyping(true);
    } finally {
      setHearing(false);
    }
  };

  return (
    <Screen scroll>
      <GuestHeader />
      <View>
        <H1>Tell us anything</H1>
        <Sub>Food, service, wait time, the place. Hindi, Hinglish, any language is perfect.</Sub>
      </View>

      <Card style={{ alignItems: 'center', gap: 14, paddingVertical: 24 }}>
        <HoldToTalk label={heard ? 'Hold to add more' : 'Hold to talk'} onDone={listen} disabled={hearing} sample={SAMPLE} />
      </Card>

      {hearing && (
        <LiveWait text="Writing down what you said" model="Voice Transcribe" typical="10–15 s" />
      )}
      {failed && <Text style={{ fontFamily: font.bodyBold, color: color.tomatoInk }}>{failed}</Text>}

      {heard && !hearing && (
        <SquishIn>
          <Card soft style={{ gap: 12 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Label>You said</Label>
              <AiTag model="Voice Transcribe" ms={heard.transcribe_ms} />
            </Row>
            <Text style={{ fontFamily: font.body, fontSize: 16, color: color.ink, lineHeight: 22 }}>“{heard.transcript}”</Text>
            {heard.tags && heard.tags.translation_en.trim() !== heard.transcript.trim() && (
              <Sub style={{ fontSize: 14 }}>In English: {heard.tags.translation_en}</Sub>
            )}
            {tags.length > 0 && (
              <>
                <Row style={{ justifyContent: 'space-between', marginTop: 4 }}>
                  <Label>Nomi heard</Label>
                  {heard.spark_ms !== undefined && <AiTag model="Muse Spark" ms={heard.spark_ms} />}
                </Row>
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
              </>
            )}
          </Card>
        </SquishIn>
      )}

      {typing ? (
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
        <Button kind="white" small title={heard ? 'Edit the words' : 'Type instead'} onPress={() => setTyping(true)} />
      )}

      {error && <Text style={{ color: color.tomatoInk, fontFamily: font.bodyBold }}>{error}</Text>}
      <Row>
        <Button title={sending ? 'Sending…' : 'Send'} style={{ flex: 1 }} disabled={sending || hearing} onPress={send} />
      </Row>
    </Screen>
  );
}
