// Owner insights: Menu Lab (what guests pick and how they rate it), lunch vs dinner, guest topics, and the AI activity log.
// Counts and averages only. No forecasts, no money.
import { Button, Card, Chip, H2, Label, Num, Row, Screen, SquishIn, Sub, color, font } from '@nomi/ui';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { DishIcon } from '@/components/dish-icon';
import { AiTag, Bars, DAYS, Segmented, Spark, TopBar, scoreTone } from '@/components/kit';
import { AI_LOG, DISH_STATS, PICKS } from '@/lib/mock';

const TOPICS = [
  { label: 'Portion', n: 8, tone: color.tomato },
  { label: 'Taste', n: 21, tone: color.mint },
  { label: 'Temperature', n: 5, tone: color.tomato },
  { label: 'Service', n: 9, tone: color.mint },
  { label: 'Wait time', n: 4, tone: color.saffron },
];

export default function Insights() {
  const [view, setView] = useState<'menu' | 'ai'>('menu');
  const maxTopic = Math.max(...TOPICS.map((t) => t.n));
  const calls = AI_LOG.length;
  const ok = AI_LOG.filter((c) => c.ok).length;

  return (
    <Screen scroll style={{ paddingBottom: 120 }}>
      <TopBar sub="Last 7 days" title="Insights" />
      <Segmented value={view} onChange={setView} options={[{ value: 'menu', label: 'Menu Lab' }, { value: 'ai', label: 'AI activity' }]} />

      {view === 'menu' && (
        <>
          <Row gap={8}>
            <View style={{ flex: 1, backgroundColor: color.card, borderRadius: 20, padding: 12 }}>
              <Num style={{ fontSize: 24 }}>224</Num>
              <Text style={{ fontFamily: font.bodySemi, fontSize: 12, color: color.ink2 }}>guest visits gave feedback</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: color.card, borderRadius: 20, padding: 12 }}>
              <Num style={{ fontSize: 24 }}>4.2</Num>
              <Text style={{ fontFamily: font.bodySemi, fontSize: 12, color: color.ink2 }}>average face, all dishes</Text>
            </View>
          </Row>

          <Label>Dishes · picks, faces, plates</Label>
          {DISH_STATS.map((d, i) => (
            <SquishIn key={d.id} index={i}>
              <Card soft style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <DishIcon name={d.name} url={null} size={44} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontFamily: font.bodyBold, fontSize: 15, color: color.ink }}>{d.name}</Text>
                  <Text style={{ fontFamily: font.bodySemi, fontSize: 12, color: color.ink2 }}>
                    {(PICKS[d.id] ?? []).reduce((a, b) => a + b, 0)} picks · face {d.guestAvg?.toFixed(1) ?? '–'}{d.scoreToday !== null ? ` · plates ${d.scoreToday}` : ' · no Golden Plate'}
                  </Text>
                </View>
                {d.trend.length ? <Spark values={d.trend} width={70} stroke={scoreTone(d.trend[d.trend.length - 1]) === 'tomato' ? color.tomato : color.ink} /> : <Chip tone="white" label="Not tracked" />}
              </Card>
            </SquishIn>
          ))}

          <Card style={{ gap: 10 }}>
            <H2 style={{ fontSize: 17 }}>Lunch vs dinner</H2>
            {DISH_STATS.filter((d) => d.byShift).map((d) => (
              <View key={d.id} style={{ gap: 4 }}>
                <Text style={{ fontFamily: font.bodyBold, fontSize: 13, color: color.ink }}>{d.name}</Text>
                {(['Lunch', 'Dinner'] as const).map((s) => (
                  <Row key={s} gap={8}>
                    <Text style={{ width: 52, fontFamily: font.bodySemi, fontSize: 12, color: color.ink2 }}>{s}</Text>
                    <View style={{ flex: 1, height: 12, borderRadius: 6, backgroundColor: color.bg, overflow: 'hidden' }}>
                      <View style={{ width: `${d.byShift![s]}%`, height: '100%', borderRadius: 6, backgroundColor: scoreTone(d.byShift![s]) === 'tomato' ? color.tomato : scoreTone(d.byShift![s]) === 'saffron' ? color.saffron : color.mint }} />
                    </View>
                    <Num style={{ width: 28, fontSize: 14, textAlign: 'right' }}>{d.byShift![s]}</Num>
                  </Row>
                ))}
              </View>
            ))}
          </Card>

          <Card style={{ gap: 10 }}>
            <Row style={{ justifyContent: 'space-between' }}><H2 style={{ fontSize: 17 }}>What guests talk about</H2><AiTag model="Muse Spark" /></Row>
            {TOPICS.map((t) => (
              <Row key={t.label} gap={8}>
                <Text style={{ width: 92, fontFamily: font.bodySemi, fontSize: 13, color: color.ink }}>{t.label}</Text>
                <View style={{ flex: 1, height: 14, borderRadius: 7, backgroundColor: color.bg, overflow: 'hidden' }}>
                  <View style={{ width: `${(t.n / maxTopic) * 100}%`, height: '100%', borderRadius: 7, backgroundColor: t.tone }} />
                </View>
                <Num style={{ width: 24, fontSize: 14, textAlign: 'right' }}>{t.n}</Num>
              </Row>
            ))}
            <Sub style={{ fontSize: 12 }}>Green: mostly praise. Red: mostly complaints. Amber: mixed.</Sub>
          </Card>

          <Card soft style={{ gap: 6 }}>
            <Label>Feedback per day</Label>
            <Bars values={[31, 28, 22, 25, 30, 41, 47]} labels={DAYS} width={300} fill={color.sky} />
          </Card>

          <Button kind="white" title="Studio: table tents and posters" onPress={() => router.push('/studio')} />
        </>
      )}

      {view === 'ai' && (
        <>
          <Sub style={{ fontSize: 14 }}>Every model call Nomi made, what it was for and how long it took. Glimmer runs on the laptop in your office, so guest text and empty frames stay on site.</Sub>
          <Row gap={8}>
            <View style={{ flex: 1, backgroundColor: color.card, borderRadius: 20, padding: 12 }}><Num style={{ fontSize: 24 }}>{calls}</Num><Text style={{ fontFamily: font.bodySemi, fontSize: 12, color: color.ink2 }}>calls since 21:00</Text></View>
            <View style={{ flex: 1, backgroundColor: color.card, borderRadius: 20, padding: 12 }}><Num style={{ fontSize: 24 }}>{ok}/{calls}</Num><Text style={{ fontFamily: font.bodySemi, fontSize: 12, color: color.ink2 }}>succeeded</Text></View>
          </Row>
          {AI_LOG.map((c, i) => (
            <SquishIn key={i} index={i}>
              <Card soft style={{ gap: 6 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <AiTag model={c.model} />
                  <Text style={{ fontFamily: font.bodySemi, fontSize: 12, color: color.ink2 }}>{c.when} · {(c.ms / 1000).toFixed(1)}s</Text>
                </Row>
                <Text style={{ fontFamily: font.bodyBold, fontSize: 14, color: color.ink }}>{c.purpose}</Text>
                {!c.ok && <Text style={{ fontFamily: font.bodySemi, fontSize: 12, color: color.tomatoInk }}>Failed. The guest was shown the menu to pick from instead.</Text>}
              </Card>
            </SquishIn>
          ))}
        </>
      )}
    </Screen>
  );
}
