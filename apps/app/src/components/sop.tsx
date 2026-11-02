// The plating card staff follow, in English or the reader's language (translated by Muse Spark from the approved text only).
import { Card, Chip, H2, Num, Row, color, font } from '@nomi/ui';
import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { AiTag } from '@/components/kit';
import { GOLDEN_PHOTO, SOP_CARDS, WATCH_LIST } from '@/lib/mock';

export function SopCard({ card, lang }: { card: (typeof SOP_CARDS)[number]; lang: 'en' | 'hi' }) {
  return (
    <Card style={{ gap: 10, padding: 12 }}>
      {card.dish === 'Chicken Biryani' && <Image source={GOLDEN_PHOTO} style={{ width: '100%', height: 170, borderRadius: 18 }} contentFit="cover" accessibilityLabel="Golden Plate photo" />}
      <Row style={{ justifyContent: 'space-between' }}>
        <H2 style={{ fontSize: 18 }}>{card.dish}</H2>
        <Chip tone="mint" label={`v${card.version}`} />
      </Row>
      {card.rules.map((r, i) => (
        <Row key={i} gap={10} style={{ alignItems: 'flex-start' }}>
          <View style={{ width: 28, height: 28, borderRadius: 10, backgroundColor: color.saffron, alignItems: 'center', justifyContent: 'center' }}><Num style={{ fontSize: 15 }}>{i + 1}</Num></View>
          <Text style={{ flex: 1, fontFamily: font.bodySemi, fontSize: 16, lineHeight: 22, color: color.ink }}>{lang === 'hi' ? r.hi : r.en}</Text>
        </Row>
      ))}
      <Row style={{ justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: font.bodySemi, fontSize: 12, color: color.ink2 }}>Approved {card.approvedAt} · {card.approvedBy}</Text>
        {lang === 'hi' && <AiTag model="Muse Spark" />}
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
