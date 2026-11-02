// A15 + A17 · Feedback: the live inbox of guest notes (urgent first), and Issues, the clusters Nomi grouped them into.
import { Card, Chip, Face, H2, Row, Screen, SquishIn, Squishy, Sub, color, font, shadow } from '@nomi/ui';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { AiTag, Bars, DAYS, Empty, FilterChips, Segmented, TopBar, scoreTone } from '@/components/kit';
import { ISSUES, NOTES, type Note } from '@/lib/mock';
import { can, useSession } from '@/lib/session';

type Filter = 'all' | 'reply' | 'urgent' | 'biryani' | 'done';

const KIND_LABEL: Record<Note['kind'], string> = { voice: 'Voice', text: 'Typed', taps: 'Taps only' };

function NoteCard({ n, index }: { n: Note; index: number }) {
  const urgent = n.severity === 'high';
  return (
    <SquishIn index={index}>
      <Squishy accessibilityRole="button" accessibilityLabel={`${urgent ? 'Urgent. ' : ''}${n.table}, ${n.ago}. ${n.translation ?? n.original ?? n.tags.map((t) => t.label).join(', ')}`}
        onPress={() => router.push({ pathname: '/note/[id]', params: { id: n.id } })}
        style={{ backgroundColor: urgent ? color.tomatoSoft : color.card, borderRadius: 24, padding: 14, gap: 8, ...shadow(1) }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Row gap={8}>
            {n.status === 'new' && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: urgent ? color.tomato : color.sky }} accessibilityLabel="New" />}
            <Text style={{ fontFamily: font.bodyBold, fontSize: 14, color: color.ink }}>{n.table} · {n.shift}</Text>
          </Row>
          <Text style={{ fontFamily: font.bodySemi, fontSize: 12, color: color.ink2 }}>{n.ago}</Text>
        </Row>
        {urgent && <Chip tone="tomato" label="Urgent · guest mentioned an allergy" />}
        {(n.translation || n.original) && (
          <Text style={{ fontFamily: font.body, fontSize: 15, lineHeight: 21, color: color.ink }} numberOfLines={3}>“{n.translation ?? n.original}”</Text>
        )}
        <Row gap={6} style={{ flexWrap: 'wrap' }}>
          {n.tags.map((t) => <Chip key={t.label} tone={t.sentiment === 'negative' ? 'tomato' : t.sentiment === 'positive' ? 'mint' : 'white'} label={t.label} />)}
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <Row gap={6}>
            {n.faces.map((f) => <Face key={f.dish} level={(f.value - 1) as 0 | 1 | 2 | 3 | 4} size={24} />)}
            <Text style={{ fontFamily: font.bodySemi, fontSize: 12, color: color.ink2 }}>{KIND_LABEL[n.kind]}{n.language !== 'English' ? ` · ${n.language}` : ''}{n.photo ? ' · photo' : ''}</Text>
          </Row>
          {n.photo && <Chip tone={scoreTone(n.photo.score)} label={`Plate ${n.photo.score}`} />}
          {n.status === 'replied' && <Chip tone="mint" label="Replied" />}
          {n.status === 'resolved' && <Chip tone="white" label="Resolved" />}
        </Row>
      </Squishy>
    </SquishIn>
  );
}

export default function Feedback() {
  const { role } = useSession();
  const [view, setView] = useState<'notes' | 'issues'>('notes');
  const [f, setF] = useState<Filter>('all');
  const chefOnly = role === 'head_chef';
  const base = chefOnly ? NOTES.filter((n) => n.faces.length > 0) : NOTES;
  const sorted = [...base].sort((a, b) => (b.severity === 'high' ? 1 : 0) - (a.severity === 'high' ? 1 : 0));
  const shown = sorted.filter((n) =>
    f === 'all' ? n.status !== 'resolved' : f === 'reply' ? n.status === 'new' && !!n.reply : f === 'urgent' ? n.severity === 'high' : f === 'biryani' ? n.faces.some((x) => x.dish === 'Chicken Biryani') : n.status === 'resolved');

  return (
    <Screen scroll style={{ paddingBottom: 120 }}>
      <TopBar sub={chefOnly ? 'Notes about your dishes' : 'Saffron House · live'} title="Feedback" />
      <Segmented value={view} onChange={setView} options={[{ value: 'notes', label: `Notes · ${base.filter((n) => n.status === 'new').length} new` }, { value: 'issues', label: `Issues · ${ISSUES.filter((i) => i.status === 'open').length}` }]} />

      {view === 'notes' && (
        <>
          <FilterChips value={f} onChange={setF} options={[
            { value: 'all', label: 'Open' },
            ...(can(role, 'approve_reply') ? [{ value: 'reply' as Filter, label: 'Needs reply', count: base.filter((n) => n.status === 'new' && n.reply).length }] : []),
            { value: 'urgent', label: 'Urgent', count: base.filter((n) => n.severity === 'high').length },
            { value: 'biryani', label: 'Biryani' },
            { value: 'done', label: 'Resolved' },
          ]} />
          <Row gap={6}><AiTag model="Voice Transcribe" /><AiTag model="Muse Spark" /><Text style={{ fontFamily: font.bodySemi, fontSize: 12, color: color.ink2 }}>transcribed, translated, tagged</Text></Row>
          {shown.length ? shown.map((n, i) => <NoteCard key={n.id} n={n} index={i} />) : <Empty title="Nothing here" sub="Notes from table QR codes arrive here live, translated into English." />}
        </>
      )}

      {view === 'issues' && (
        <>
          <Sub style={{ fontSize: 14 }}>Notes that say the same thing are grouped, so one problem shows once with its count.</Sub>
          {ISSUES.map((iss, i) => (
            <SquishIn key={iss.id} index={i}>
              <Card style={{ gap: 10, opacity: iss.status === 'resolved' ? 0.6 : 1 }}>
                <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <H2 style={{ fontSize: 17 }}>{iss.title}</H2>
                    <Sub style={{ fontSize: 13 }}>{iss.count} reports since {iss.since}{iss.dish ? ` · ${iss.dish}` : ''}</Sub>
                  </View>
                  <Chip tone={iss.status === 'open' ? 'tomato' : 'mint'} label={iss.status === 'open' ? 'Open' : 'Resolved'} />
                </Row>
                <Bars values={iss.perDay} labels={DAYS} width={280} fill={iss.status === 'open' ? color.tomato : color.mint} />
              </Card>
            </SquishIn>
          ))}
        </>
      )}
    </Screen>
  );
}
