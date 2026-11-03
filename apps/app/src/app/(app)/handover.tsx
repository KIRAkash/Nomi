// A22 · Spoken handover: at shift end the team holds to talk. Muse Voice Transcribe writes it down, Muse Spark sorts it
// into done / pending / problems, and the next shift reads it here. A new handover is recorded and read live.
import { Card, Chip, H2, Label, Row, Screen, SquishIn, Sub, color, font } from '@nomi/ui';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { AiTag, HoldToTalk, LiveWait, TopBar, type VoiceNote } from '@/components/kit';
import { sendVoice } from '@/lib/api';
import { HANDOVERS } from '@/lib/mock';

type HandoverNote = {
  id: string; shift: string; when: string;
  turns?: { speaker: string; text: string }[]; transcript?: string; ms?: { transcribe: number; spark: number };
  summary: { done: string[]; pending: string[]; problems: string[] };
};

const SPEAKER_TONE: Record<string, string> = { Ravi: color.skySoft, Meena: color.pinkSoft };

function HandoverCard({ h }: { h: HandoverNote }) {
  return (
    <Card style={{ gap: 12 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <View>
          <H2 style={{ fontSize: 17 }}>{h.shift}</H2>
          <Sub style={{ fontSize: 12 }}>{h.when}</Sub>
        </View>
        <AiTag model="Muse Spark" ms={h.ms?.spark} />
      </Row>
      {([['Done', h.summary.done, 'mint'], ['Pending', h.summary.pending, 'saffron'], ['Problems', h.summary.problems, 'tomato']] as const).map(([t, xs, tn]) => xs.length > 0 && (
        <View key={t} style={{ gap: 4 }}>
          <Chip tone={tn} label={t} />
          {xs.map((x) => <Text key={x} style={{ fontFamily: font.bodySemi, fontSize: 15, color: color.ink }}>• {x}</Text>)}
        </View>
      ))}
      {h.transcript && (
        <>
          <Row style={{ justifyContent: 'space-between' }}><Label>What was said</Label><AiTag model="Voice Transcribe" ms={h.ms?.transcribe} /></Row>
          <View style={{ backgroundColor: color.bg, borderRadius: 16, padding: 10 }}>
            <Text style={{ fontFamily: font.body, fontSize: 14, color: color.ink }}>“{h.transcript}”</Text>
          </View>
        </>
      )}
      {h.turns && <Label>Who said what</Label>}
      {h.turns?.map((t, i) => (
        <View key={i} style={{ backgroundColor: SPEAKER_TONE[t.speaker] ?? color.bg, borderRadius: 16, padding: 10 }}>
          <Text style={{ fontFamily: font.bodyBold, fontSize: 12, color: color.ink2 }}>{t.speaker}</Text>
          <Text style={{ fontFamily: font.body, fontSize: 14, color: color.ink }}>{t.text}</Text>
        </View>
      ))}
    </Card>
  );
}

const SAMPLE = { file: require('../../../assets/audio/sample-handover.m4a'), says: 'Lunch shift done. Biryani handi two is finished…' };

const now = () => new Intl.DateTimeFormat('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date());

export default function Handover() {
  const [mine, setMine] = useState<HandoverNote[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const record = async (note: VoiceNote) => {
    setBusy(true);
    setError(null);
    try {
      const h = await sendVoice(note.audio, 'handover');
      const summary = h.handover;
      if (!h.transcript || !summary) { setError("Nomi couldn't hear any words. Try again closer to the phone."); return; }
      setMine((m) => [{
        id: `live-${Date.now()}`, shift: 'Just now', when: now(), transcript: h.transcript,
        ms: { transcribe: h.transcribe_ms, spark: h.spark_ms ?? 0 }, summary,
      }, ...m]);
    } catch (err) {
      setError(`Couldn't read the handover: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };
  const list: HandoverNote[] = [...mine, ...HANDOVERS];
  return (
    <Screen scroll style={{ paddingBottom: 120 }}>
      <TopBar sub="End of shift" title="Handover" />
      <Card style={{ gap: 14, paddingVertical: 22 }}>
        <HoldToTalk label="Hold to hand over" onDone={record} disabled={busy} sample={SAMPLE} />
        <Sub style={{ textAlign: 'center', fontSize: 13 }}>Say what is done, what is left and what went wrong. Any language.</Sub>
        {busy && (
          <LiveWait text="Writing it down, then sorting into done, pending, problems" model="Voice Transcribe" typical="15–25 s" />
        )}
        {error && <Text style={{ fontFamily: font.bodyBold, color: color.tomatoInk, textAlign: 'center' }}>{error}</Text>}
      </Card>
      {list.map((h, i) => <SquishIn key={h.id} index={i}><HandoverCard h={h} /></SquishIn>)}
    </Screen>
  );
}
