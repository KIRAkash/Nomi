// A16 · One guest note: what they said and in which language, the English, the tags, their plate photo against the
// Golden Plate, and a reply drafted in their language that a manager approves, edits or skips. Nothing is sent without approval.
import { Button, Card, Chip, Face, H2, Label, Row, Screen, SquishIn, Squishy, Sub, color, font, shadow } from '@nomi/ui';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { AiTag, Segmented, TopBar } from '@/components/kit';
import { Compare, partsFromReasons } from '@/components/plate';
import { draftReply } from '@/lib/api';
import { RESTAURANT } from '@/lib/brand';
import { NOTES } from '@/lib/mock';
import { can, useSession } from '@/lib/session';

const OFFERS = ['Dessert on next visit', 'Biryani on next visit', '10% off next bill'];

export default function NoteDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { role } = useSession();
  const n = NOTES.find((x) => x.id === id) ?? NOTES[0];
  const [lang, setLang] = useState<'guest' | 'en'>('guest');
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(n.reply?.text ?? '');
  const [offer, setOffer] = useState<string | null>(n.reply?.offer ?? null);
  const [status, setStatus] = useState(n.status);
  const [en, setEn] = useState(n.reply?.en ?? '');
  const [drafting, setDrafting] = useState(false);
  const [draftMs, setDraftMs] = useState<number | undefined>();
  // Muse Spark writes a fresh reply in the guest's language from what they actually said; the manager still approves it.
  const redraft = async () => {
    setDrafting(true);
    try {
      const r = await draftReply(n.original ?? n.translation ?? '', n.language, RESTAURANT.name);
      setText(r.reply);
      setEn(r.reply_en);
      setOffer(r.offer && OFFERS.includes(r.offer) ? r.offer : offer);
      setDraftMs(r.ms);
      setEditing(false);
    } catch {
      // Keeps the current draft.
    } finally {
      setDrafting(false);
    }
  };
  const [called, setCalled] = useState(false);
  const urgent = n.severity === 'high';
  const mayReply = can(role, 'approve_reply');

  return (
    <Screen scroll style={{ paddingBottom: 40 }}>
      <TopBar back sub={`${n.day} ${n.shift} · ${n.ago}`} title={n.table} right={<View />} />

      {urgent && (
        <SquishIn>
          <Card style={{ backgroundColor: color.tomato, gap: 10 }}>
            <H2 style={{ color: '#fff' }}>Urgent: allergy mentioned</H2>
            <Text style={{ fontFamily: font.bodySemi, color: '#fff', fontSize: 14 }}>Arjun and Priya were alerted at {n.ago}. The guest left a phone number for a call back.</Text>
            {mayReply && (called
              ? <Chip tone="mint" label="Marked as called" />
              : <Button small kind="white" title="I've called the guest" onPress={() => setCalled(true)} />)}
          </Card>
        </SquishIn>
      )}

      {(n.original || n.translation) && (
        <SquishIn index={1}>
          <Card style={{ gap: 10 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Label>{n.kind === 'voice' ? `Voice note · ${n.durationS}s · ${n.language}` : `Typed · ${n.language}`}</Label>
              {n.kind === 'voice' && <AiTag model="Voice Transcribe" />}
            </Row>
            {n.kind === 'voice' && (
              <Squishy accessibilityRole="button" accessibilityLabel="Play voice note" onPress={() => {}} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: color.bg, borderRadius: 16, padding: 10 }}>
                <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: color.ink, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: color.saffron, fontSize: 14 }}>▶</Text></View>
                <View style={{ flex: 1, flexDirection: 'row', gap: 3, alignItems: 'center', height: 28 }}>
                  {Array.from({ length: 28 }, (_, i) => <View key={i} style={{ flex: 1, height: 6 + ((i * 37) % 22), borderRadius: 2, backgroundColor: color.ink2, opacity: 0.6 }} />)}
                </View>
              </Squishy>
            )}
            <Text style={{ fontFamily: font.body, fontSize: 16, lineHeight: 23, color: color.ink }}>“{n.original}”</Text>
            {n.translation && (
              <View style={{ backgroundColor: color.skySoft, borderRadius: 16, padding: 12, gap: 6 }}>
                <Row style={{ justifyContent: 'space-between' }}><Text style={{ fontFamily: font.bodyBold, fontSize: 12, color: color.skyInk }}>In English</Text><AiTag model="Muse Spark" /></Row>
                <Text style={{ fontFamily: font.bodySemi, fontSize: 15, lineHeight: 21, color: color.ink }}>{n.translation}</Text>
              </View>
            )}
            <Row gap={6} style={{ flexWrap: 'wrap' }}>
              {n.tags.map((t) => <Chip key={t.label} tone={t.sentiment === 'negative' ? 'tomato' : t.sentiment === 'positive' ? 'mint' : 'white'} label={t.label} />)}
            </Row>
            <Text style={{ fontFamily: font.bodySemi, fontSize: 12, color: color.ink2 }}>The guest saw these tags and kept them.</Text>
          </Card>
        </SquishIn>
      )}

      {(n.faces.length > 0 || n.answers.length > 0) && (
        <SquishIn index={2}>
          <Card style={{ gap: 10 }}>
            <Label>Taps</Label>
            {n.faces.map((f) => (
              <Row key={f.dish} style={{ justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: font.bodyBold, fontSize: 15, color: color.ink }}>{f.dish}</Text>
                <Face level={(f.value - 1) as 0 | 1 | 2 | 3 | 4} size={30} />
              </Row>
            ))}
            {n.answers.map((a) => (
              <Row key={a.q} style={{ justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: font.body, fontSize: 14, color: color.ink, flex: 1 }}>{a.q}</Text>
                <Chip tone={a.good ? 'mint' : 'tomato'} label={a.a} />
              </Row>
            ))}
          </Card>
        </SquishIn>
      )}

      {n.photo && (
        <SquishIn index={3}>
          <Card style={{ gap: 10 }}>
            <Row style={{ justifyContent: 'space-between' }}><Label>Guest’s plate vs Golden Plate</Label><AiTag model="SAM 3.1" /></Row>
            <Compare score={n.photo.score} reasons={n.photo.reasons} when="Guest photo" shotKey={n.photo.shot} {...partsFromReasons(n.photo.reasons)} />
            <Sub style={{ fontSize: 12 }}>The guest never sees this score.</Sub>
          </Card>
        </SquishIn>
      )}

      {n.reply && mayReply && (
        <SquishIn index={4}>
          <Card style={{ gap: 12 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Label>Reply draft</Label>
              <AiTag model="Muse Spark" ms={draftMs} />
            </Row>
            {n.language !== 'English' && <Segmented value={lang} onChange={setLang} options={[{ value: 'guest', label: n.language }, { value: 'en', label: 'English' }]} />}
            {editing ? (
              <TextInput accessibilityLabel="Edit reply" multiline value={text} onChangeText={(t) => { setText(t); setEn(''); }}
                style={{ minHeight: 110, borderRadius: 18, backgroundColor: color.bg, padding: 14, fontFamily: font.body, fontSize: 15, color: color.ink, textAlignVertical: 'top' }} />
            ) : (
              <View style={{ backgroundColor: color.bg, borderRadius: 18, padding: 14 }}>
                <Text style={{ fontFamily: font.body, fontSize: 15, lineHeight: 22, color: color.ink }}>{lang === 'en' && en ? en : text}</Text>
              </View>
            )}
            <Label>Offer</Label>
            <Row gap={8} style={{ flexWrap: 'wrap' }}>
              {[null, ...OFFERS].map((o) => (
                <Squishy key={o ?? 'none'} accessibilityRole="radio" accessibilityState={{ selected: offer === o }} onPress={() => setOffer(o)}
                  style={{ minHeight: 40, paddingHorizontal: 12, borderRadius: 14, justifyContent: 'center', backgroundColor: offer === o ? color.ink : color.card, ...shadow(1) }}>
                  <Text style={{ fontFamily: font.bodyBold, fontSize: 13, color: offer === o ? color.bg : color.ink }}>{o ?? 'No offer'}</Text>
                </Squishy>
              ))}
            </Row>
            <Text style={{ fontFamily: font.bodySemi, fontSize: 12, color: color.ink2 }}>{n.phone ? 'Goes to the guest on WhatsApp.' : 'Shows on their table page if they come back to it.'}</Text>
            {status === 'new' ? (
              <>
                <Button title="Approve and send" onPress={() => setStatus('replied')} />
                <Row>
                  <Button small kind="white" title={editing ? 'Done editing' : 'Edit'} style={{ flex: 1 }} onPress={() => setEditing(!editing)} />
                  <Button small kind="white" title="Resolve, no reply" style={{ flex: 1 }} onPress={() => setStatus('resolved')} />
                </Row>
                <Button small kind="saffron" title={drafting ? 'Muse Spark is writing…' : 'Write a new draft'} disabled={drafting} onPress={redraft} />
              </>
            ) : (
              <SquishIn>
                <View style={{ backgroundColor: color.mintSoft, borderRadius: 18, padding: 12, gap: 6 }}>
                  <Text style={{ fontFamily: font.bodyBold, color: color.mintInk, fontSize: 15 }}>{status === 'replied' ? `Sent, approved by ${role === 'owner' ? 'Priya' : 'Arjun'}` : 'Resolved without a reply'}</Text>
                  <Button small kind="white" title="Back to the inbox" onPress={() => router.back()} />
                </View>
              </SquishIn>
            )}
          </Card>
        </SquishIn>
      )}

      {!mayReply && <Sub style={{ fontSize: 13, textAlign: 'center' }}>Replies are approved by the manager or owner.</Sub>}
    </Screen>
  );
}
