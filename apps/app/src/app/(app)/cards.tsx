// A23 · Staff cards: tonight's reminders and every plating card in the reader's language. Hindi is saved with the card;
// any other language is translated live by Muse Spark from the approved English. A cook can also ask by voice
// ("how many prawns?"): Muse Voice Transcribe hears it and Muse Wonder answers only from the approved cards.
import { Card, Label, Row, Screen, SquishIn, Squishy, Sub, color, font } from '@nomi/ui';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { AiTag, HoldToTalk, LiveWait, TopBar, type VoiceNote } from '@/components/kit';
import { SopCard, WatchList, type SopCardData } from '@/components/sop';
import { askNomi, sendVoice, translateCard } from '@/lib/api';
import { SOP_CARDS } from '@/lib/mock';

const LANGS = [
  { code: 'hi', label: 'हिन्दी', name: 'Hindi' },
  { code: 'en', label: 'English', name: 'English' },
  { code: 'ta', label: 'தமிழ்', name: 'Tamil' },
  { code: 'kn', label: 'ಕನ್ನಡ', name: 'Kannada' },
  { code: 'bn', label: 'বাংলা', name: 'Bengali' },
  { code: 'ne', label: 'नेपाली', name: 'Nepali' },
] as const;
type Code = (typeof LANGS)[number]['code'];

const CARDS: SopCardData[] = SOP_CARDS;
const SAMPLE = { file: require('../../../assets/audio/sample-ask.m4a'), says: 'तंदूरी प्रॉन्स में कितने प्रॉन्स… (Hindi)' };

/** One card in the chosen language: saved text when it exists, otherwise one live Muse Spark call, kept per language. */
const done: Record<string, { lines: string[]; ms: number } | 'failed'> = {};
function LiveCard({ card, lang }: { card: SopCardData; lang: Code }) {
  const key = `${lang}:${card.dishId}`;
  const saved = lang === 'en' || (lang === 'hi' && card.rules.every((r) => r.hi));
  const [t, setT] = useState(done[key]);
  const shown = done[key] ?? t;
  useEffect(() => {
    if (saved || done[key]) return;
    let on = true;
    translateCard({ title: card.dish, steps: card.rules.map((r) => r.en), watch: [] }, LANGS.find((l) => l.code === lang)!.name)
      .then((r) => { done[key] = { lines: r.steps, ms: r.ms }; }, () => { done[key] = 'failed'; })
      .then(() => on && setT(done[key]));
    return () => { on = false; };
  }, [key, saved, card, lang]);
  const busy = !saved && !shown;
  return (
    <View>
      {busy && <Row style={{ marginBottom: 6 }}><ActivityIndicator color={color.ink} /><Sub style={{ fontSize: 13 }}>Muse Spark is translating {card.dish}…</Sub></Row>}
      {shown === 'failed' && <Sub style={{ fontSize: 13, marginBottom: 6 }}>Couldn&apos;t translate right now; showing English.</Sub>}
      <SopCard card={card} lang={lang} lines={typeof shown === 'object' ? shown.lines : null} ms={typeof shown === 'object' ? shown.ms : undefined} />
    </View>
  );
}

function AskByVoice() {
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState<{ text: string; ms: number } | null>(null);
  const [a, setA] = useState<{ text: string; ms: number; refused: boolean; from: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ask = async (note: VoiceNote) => {
    setBusy(true);
    setError(null);
    setA(null);
    try {
      const h = await sendVoice(note.audio, 'plain');
      if (!h.transcript) { setError("Nomi couldn't hear a question. Try again closer to the phone."); return; }
      setQ({ text: h.transcript, ms: h.transcribe_ms });
      const facts = CARDS.flatMap((c) => c.rules.map((r, i) => ({ id: `${c.dish} rule ${i + 1}`, text: `${c.dish}: ${r.en}` })));
      const r = await askNomi(h.transcript, facts, 'cook');
      // Citations move out of the sentence into chips, so the answer reads cleanly at a glance.
      const from = [...new Set([...r.answer.matchAll(/\[([^\]]+)\]/g)].map((m) => m[1]).concat(r.facts.map((f) => f.source)))];
      setA({ text: r.answer.replace(/\s*\[[^\]]+\]/g, '').trim(), ms: r.ms, refused: r.refused, from });
    } catch (err) {
      setError(`Couldn't answer right now: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card style={{ gap: 12 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Label>Ask about a plate</Label>
        <AiTag model="Muse Wonder" />
      </Row>
      <HoldToTalk label="Hold and ask" bg={color.sky} onDone={ask} disabled={busy} sample={SAMPLE} />
      <Sub style={{ fontSize: 13, textAlign: 'center' }}>“How many prawns?” “Where does the lemon go?” Any language. Answers come only from Chef’s cards.</Sub>
      {busy && (
        <LiveWait text="Listening, then checking the cards" model="Muse Wonder" typical="15 s" />
      )}
      {error && <Text style={{ fontFamily: font.bodyBold, color: color.tomatoInk, textAlign: 'center' }}>{error}</Text>}
      {q && !busy && (
        <View style={{ gap: 4 }}>
          <Row style={{ justifyContent: 'space-between' }}><Sub style={{ fontSize: 13 }}>You asked</Sub><AiTag model="Voice Transcribe" ms={q.ms} /></Row>
          <Text style={{ fontFamily: font.body, fontSize: 15, color: color.ink }}>“{q.text}”</Text>
        </View>
      )}
      {a && (
        <SquishIn>
          <View style={{ gap: 6, backgroundColor: a.refused ? color.saffronSoft : color.mintSoft, borderRadius: 18, padding: 12 }}>
            <Text style={{ fontFamily: font.bodyBold, fontSize: 18, lineHeight: 25, color: color.ink }}>{a.text}</Text>
            {a.from.length > 0 && (
              <Row gap={6} style={{ flexWrap: 'wrap' }}>
                {a.from.slice(0, 4).map((f) => (
                  <View key={f} style={{ backgroundColor: color.card, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ fontFamily: font.bodyBold, fontSize: 11, color: color.ink2 }}>{f}</Text>
                  </View>
                ))}
              </Row>
            )}
            <AiTag model="Muse Wonder" ms={a.ms} />
          </View>
        </SquishIn>
      )}
    </Card>
  );
}

export default function Cards() {
  const [lang, setLang] = useState<Code>('hi');
  return (
    <Screen scroll style={{ paddingBottom: 120 }}>
      <TopBar sub="Friday dinner" title="Namaste, Ravi" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {LANGS.map((l) => (
          <Squishy key={l.code} accessibilityRole="radio" accessibilityState={{ selected: l.code === lang }} accessibilityLabel={l.name} onPress={() => setLang(l.code)}
            style={{ minHeight: 44, paddingHorizontal: 16, borderRadius: 16, justifyContent: 'center', backgroundColor: l.code === lang ? color.ink : color.card }}>
            <Text style={{ fontFamily: font.bodyBold, fontSize: 15, color: l.code === lang ? color.saffron : color.ink }}>{l.label}</Text>
          </Squishy>
        ))}
      </ScrollView>
      <SquishIn><AskByVoice /></SquishIn>
      <SquishIn index={1}><WatchList /></SquishIn>
      <Label>{lang === 'hi' ? 'प्लेटिंग कार्ड' : 'Plating cards'}</Label>
      {CARDS.map((c, i) => <SquishIn key={c.dishId} index={i + 2}><LiveCard key={lang} card={c} lang={lang} /></SquishIn>)}
      <Sub style={{ fontSize: 12, textAlign: 'center' }}>Cards change only when Chef Imran approves a new version. Translations never change a number.</Sub>
    </Screen>
  );
}
