// The plating card staff follow, in English or the reader's language (translated by Muse Spark from the approved text only).
import type { WatchItem } from '@nomi/shared';
import { Button, Card, Chip, H2, Num, Row, color, font } from '@nomi/ui';
import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { AiTag } from '@/components/kit';
import { GOLDEN_PHOTO, WATCH_LIST } from '@/lib/mock';
import { goldenShot } from '@/lib/shots';

export type SopCardData = { dishId: string; dish: string; version: number; approvedBy: string; approvedAt: string; rules: { en: string; hi?: string }[] };

/** One plating card: the dish's Golden Plate photo and its numbered rules, in English, saved Hindi, or a live translation. */
export function SopCard({ card, lang, lines, ms }: { card: SopCardData; lang: 'en' | 'hi' | string; lines?: string[] | null; ms?: number }) {
  const photo = goldenShot(card.dish)?.image ?? (card.dish === 'Chicken Biryani' ? GOLDEN_PHOTO : null);
  const text = (i: number) => lines?.[i] ?? (lang === 'hi' ? card.rules[i].hi : undefined) ?? card.rules[i].en;
  const translated = lang !== 'en' && (lines || card.rules.every((r) => r.hi));
  return (
    <Card style={{ gap: 10, padding: 12 }}>
      {photo && <Image source={photo} style={{ width: '100%', height: 170, borderRadius: 18 }} contentFit="cover" accessibilityLabel={`Golden Plate photo of ${card.dish}`} />}
      <Row style={{ justifyContent: 'space-between' }}>
        <H2 style={{ fontSize: 18, flex: 1 }}>{card.dish}</H2>
        <Chip tone="mint" label={`v${card.version}`} />
      </Row>
      {card.rules.map((_, i) => (
        <Row key={i} gap={10} style={{ alignItems: 'flex-start' }}>
          <View style={{ width: 28, height: 28, borderRadius: 10, backgroundColor: color.saffron, alignItems: 'center', justifyContent: 'center' }}><Num style={{ fontSize: 15 }}>{i + 1}</Num></View>
          <Text style={{ flex: 1, fontFamily: font.bodySemi, fontSize: 17, lineHeight: 24, color: color.ink }}>{text(i)}</Text>
        </Row>
      ))}
      <Row style={{ justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: font.bodySemi, fontSize: 12, color: color.ink2 }}>Approved {card.approvedAt} · {card.approvedBy}</Text>
        {translated && <AiTag model="Muse Spark" ms={ms} />}
      </Row>
    </Card>
  );
}

/**
 * Tonight's reminders, each built from last night's PASS rows. Live, the counts are computed by the API from the plates
 * themselves and Muse Spark only words the reminder; before a run, the seed list shows.
 */
export function WatchList({ live, running = false, onRun }: { live?: WatchItem[] | null; running?: boolean; onRun?: () => void }) {
  const items = live
    ? live.map((w) => ({ dish: w.dish, fix: w.reminder ?? `Check the ${w.part.toLowerCase()} on every plate`, fact: w.fact }))
    : WATCH_LIST;
  return (
    <Card style={{ backgroundColor: color.ink, gap: 12 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: font.bodyBold, fontSize: 12, color: color.saffron, letterSpacing: 1.1, textTransform: 'uppercase' }}>Watch tonight</Text>
        <AiTag model="Muse Spark" />
      </Row>
      {running && !live ? (
        <Text style={{ fontFamily: font.bodySemi, fontSize: 14, color: color.saffronSoft }}>Counting last night&apos;s PASS plates…</Text>
      ) : items.map((w, i) => (
        <View key={`${w.dish}-${i}`} style={{ gap: 2 }}>
          <Text style={{ fontFamily: font.display, fontSize: 18, color: color.bg }}>{i + 1}. {w.dish}: {w.fix}</Text>
          <Text style={{ fontFamily: font.body, fontSize: 13, color: color.saffronSoft }}>Last night: {w.fact}</Text>
        </View>
      ))}
      <Text style={{ fontFamily: font.body, fontSize: 12, color: color.saffronSoft }}>
        {live ? 'Counts come straight from the PASS checks; Muse Spark words the reminder.' : 'Seed list. Build it from last night\'s plates to count them live.'}
      </Text>
      {onRun && <Button small kind="saffron" title={running ? 'Counting…' : live ? 'Count again' : 'Build from last night'} disabled={running} onPress={onRun} />}
    </Card>
  );
}
