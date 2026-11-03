// The plating card staff follow, in English or the reader's language (translated by Muse Spark from the approved text only).
import { Card, Chip, H2, Num, Row, color, font } from '@nomi/ui';
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

/** Tonight's reminders, each built from yesterday's plate facts. */
export function WatchList() {
  return (
    <Card style={{ backgroundColor: color.ink, gap: 12 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: font.bodyBold, fontSize: 12, color: color.saffron, letterSpacing: 1.1, textTransform: 'uppercase' }}>Watch tonight</Text>
        <AiTag model="Muse Spark" />
      </Row>
      {WATCH_LIST.map((w, i) => (
        <View key={w.dish} style={{ gap: 2 }}>
          <Text style={{ fontFamily: font.display, fontSize: 18, color: color.bg }}>{i + 1}. {w.dish}: {w.fix}</Text>
          <Text style={{ fontFamily: font.body, fontSize: 13, color: color.saffronSoft }}>Yesterday: {w.fact}</Text>
        </View>
      ))}
    </Card>
  );
}
