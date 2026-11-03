// A19 · Ask Nomi: the owner asks anything in plain words, typed or spoken. Muse Wonder answers live, only from the facts
// Nomi has seen, counted or heard, and cites them; asks for predictions are declined with what Nomi can count instead.
import { Button, Row, Screen, SquishIn, Squishy, Sub, color, font, shadow } from '@nomi/ui';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { AiTag, HoldToTalk, TopBar, WorkLine, type VoiceNote } from '@/components/kit';
import { askNomi, sendVoice } from '@/lib/api';
import { restaurantFacts } from '@/lib/facts';
import { ASK_ANSWERS, ASK_SUGGESTIONS } from '@/lib/mock';

type Answer = { text: string; evidence: string[]; declined?: boolean; ms?: number; heardMs?: number };
type Turn = { q: string; a?: Answer };

const FALLBACK = {
  text: 'I can only answer from what Nomi has seen, counted or heard: guest notes, plate scores, shelf counts and closing photos. Try asking about a dish, a shift or a table.',
  evidence: [] as string[],
};

export default function Ask() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState('');
  const thinking = turns.length > 0 && !turns[turns.length - 1].a;

  const [listening, setListening] = useState(false);
  const answer = (a: Answer) => setTurns((t) => t.map((x, i) => (i === t.length - 1 ? { ...x, a } : x)));
  const ask = async (q: string, heardMs?: number) => {
    if (!q.trim() || thinking) return;
    setDraft('');
    setTurns((t) => [...t, { q }]);
    try {
      const r = await askNomi(q, restaurantFacts());
      answer({ text: r.answer, evidence: [...new Set(r.facts.map((f) => f.source.replace(/^\w+:/, '')))].slice(0, 4), declined: r.refused, ms: r.ms, heardMs });
    } catch {
      // Offline: the prepared answers for the suggested questions, so the screen still shows how Nomi answers.
      answer(ASK_ANSWERS[q] ?? FALLBACK);
    }
  };
  const spoken = async (note: VoiceNote) => {
    setListening(true);
    try {
      const h = await sendVoice(note.audio, 'plain');
      if (h.transcript) await ask(h.transcript, h.transcribe_ms);
    } finally {
      setListening(false);
    }
  };

  return (
    <Screen scroll style={{ paddingBottom: 40 }}>
      <TopBar back sub="Answers from your own data" title="Ask Nomi" right={<View />} />

      {turns.length === 0 && (
        <SquishIn style={{ gap: 10 }}>
          <Sub>Ask about dishes, shifts, tables or stock. Every answer shows where it came from.</Sub>
          {ASK_SUGGESTIONS.map((s, i) => (
            <SquishIn key={s} index={i}>
              <Squishy accessibilityRole="button" onPress={() => ask(s)} style={{ backgroundColor: color.card, borderRadius: 20, padding: 14, ...shadow(1) }}>
                <Text style={{ fontFamily: font.bodyBold, fontSize: 15, color: color.ink }}>{s}</Text>
              </Squishy>
            </SquishIn>
          ))}
        </SquishIn>
      )}

      {turns.map((t, i) => (
        <View key={i} style={{ gap: 10 }}>
          <View style={{ alignSelf: 'flex-end', maxWidth: '85%', backgroundColor: color.ink, borderRadius: 22, borderBottomRightRadius: 6, padding: 14 }}>
            <Text style={{ fontFamily: font.bodySemi, fontSize: 15, color: color.bg }}>{t.q}</Text>
          </View>
          {t.a ? (
            <SquishIn>
              <View style={{ alignSelf: 'flex-start', maxWidth: '92%', backgroundColor: t.a.declined ? color.saffronSoft : color.card, borderRadius: 22, borderBottomLeftRadius: 6, padding: 14, gap: 10, ...shadow(1) }}>
                {t.a.declined && <Text style={{ fontFamily: font.bodyBold, fontSize: 12, color: color.saffronInk, letterSpacing: 1, textTransform: 'uppercase' }}>No guesses</Text>}
                <Text style={{ fontFamily: font.body, fontSize: 15, lineHeight: 22, color: color.ink }}>{t.a.text}</Text>
                {t.a.evidence.length > 0 && (
                  <Row gap={6} style={{ flexWrap: 'wrap' }}>
                    {t.a.evidence.map((e) => (
                      <View key={e} style={{ backgroundColor: color.skySoft, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 }}>
                        <Text style={{ fontFamily: font.bodyBold, fontSize: 12, color: color.skyInk }}>{e}</Text>
                      </View>
                    ))}
                  </Row>
                )}
                <Row gap={6} style={{ flexWrap: 'wrap' }}>
                  {t.a.heardMs !== undefined && <AiTag model="Voice Transcribe" ms={t.a.heardMs} />}
                  <AiTag model="Muse Wonder" ms={t.a.ms} />
                </Row>
              </View>
            </SquishIn>
          ) : (
            <View style={{ backgroundColor: color.card, borderRadius: 22, padding: 14, gap: 8, alignSelf: 'flex-start', ...shadow(1) }}>
              <WorkLine state="run" text="Reading notes, plates and counts" model="Muse Wonder" />
            </View>
          )}
        </View>
      ))}

      {turns.length > 0 && !thinking && (
        <Row gap={8} style={{ flexWrap: 'wrap' }}>
          {ASK_SUGGESTIONS.filter((s) => !turns.some((t) => t.q === s)).slice(0, 2).map((s) => (
            <Squishy key={s} accessibilityRole="button" onPress={() => ask(s)} style={{ backgroundColor: color.saffronSoft, borderRadius: 16, paddingHorizontal: 12, minHeight: 40, justifyContent: 'center' }}>
              <Text style={{ fontFamily: font.bodyBold, fontSize: 13, color: color.saffronInk }}>{s}</Text>
            </Squishy>
          ))}
        </Row>
      )}

      <Row style={{ marginTop: 6 }}>
        <TextInput accessibilityLabel="Your question" value={draft} onChangeText={setDraft} onSubmitEditing={() => ask(draft)} placeholder="Ask about a dish, shift or table" placeholderTextColor={color.ink2}
          style={{ flex: 1, minHeight: 56, borderRadius: 22, backgroundColor: color.card, paddingHorizontal: 16, fontFamily: font.body, fontSize: 16, color: color.ink, ...shadow(1) }} />
      </Row>
      {draft.trim().length > 0 && <Button small title="Ask" onPress={() => ask(draft)} />}
      <View style={{ marginTop: 6 }}>
        <HoldToTalk label={listening ? 'Listening…' : 'Or hold and ask'} bg={color.sky} onDone={spoken} disabled={listening || thinking} />
      </View>
    </Screen>
  );
}
