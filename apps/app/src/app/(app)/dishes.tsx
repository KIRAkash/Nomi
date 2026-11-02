// A12 · Dish Performance: the chef's home, dishes sorted by what needs attention first.
import { Button, Card, Chip, H2, Label, Num, Row, Screen, SquishIn, Squishy, Sub, color, font, shadow } from '@nomi/ui';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { DishIcon } from '@/components/dish-icon';
import { Score, Spark, TopBar, scoreTone } from '@/components/kit';
import { COVERAGE, DISH_STATS, type DishStat } from '@/lib/mock';
import { can, useSession } from '@/lib/session';

const rank = (d: DishStat) => (d.scoreToday === null ? (d.golden === 'draft' ? 60 : 200) : d.scoreToday - d.flagged * 2);

function DishCard({ d, index }: { d: DishStat; index: number }) {
  const t = d.scoreToday !== null ? scoreTone(d.scoreToday) : null;
  return (
    <SquishIn index={index}>
      <Squishy accessibilityRole="button" accessibilityLabel={`${d.name}. ${d.scoreToday !== null ? `Score ${d.scoreToday}.` : 'No Golden Plate yet.'} ${d.attention ?? ''}`}
        onPress={() => router.push({ pathname: '/dish/[id]', params: { id: d.id } })}
        style={{ backgroundColor: color.card, borderRadius: 26, padding: 14, gap: 10, ...shadow(1) }}>
        <Row style={{ alignItems: 'center' }}>
          <DishIcon name={d.name} url={null} size={56} />
          <View style={{ flex: 1, gap: 2 }}>
            <H2 style={{ fontSize: 17 }}>{d.name}</H2>
            <Row gap={6}>
              {d.golden === 'published' && <Chip tone="mint" label={`Golden v${d.goldenVersion}`} />}
              {d.golden === 'draft' && <Chip tone="saffron" label="Draft" />}
              {d.golden === 'none' && <Chip tone="white" label="Not protected" />}
            </Row>
          </View>
          {d.scoreToday !== null ? <Score value={d.scoreToday} size={54} /> : null}
        </Row>
        {d.scoreToday !== null && (
          <Row style={{ justifyContent: 'space-between' }}>
            <View style={{ gap: 2 }}>
              <Label style={{ fontSize: 10 }}>7 days</Label>
              <Spark values={d.trend} stroke={t === 'tomato' ? color.tomato : color.ink} />
            </View>
            <View style={{ gap: 2, alignItems: 'center' }}>
              <Label style={{ fontSize: 10 }}>Plates</Label>
              <Num style={{ fontSize: 18 }}>{d.plates}</Num>
            </View>
            <View style={{ gap: 2, alignItems: 'center' }}>
              <Label style={{ fontSize: 10 }}>Flagged</Label>
              <Num style={{ fontSize: 18, color: d.flagged ? color.tomatoInk : color.ink }}>{d.flagged}</Num>
            </View>
            <View style={{ gap: 2, alignItems: 'center' }}>
              <Label style={{ fontSize: 10 }}>Guests</Label>
              <Num style={{ fontSize: 18 }}>{d.guestAvg?.toFixed(1) ?? '–'}</Num>
            </View>
          </Row>
        )}
        {d.attention && (
          <View style={{ backgroundColor: t === 'tomato' ? color.tomatoSoft : color.saffronSoft, borderRadius: 14, padding: 10 }}>
            <Text style={{ fontFamily: font.bodyBold, fontSize: 13, color: t === 'tomato' ? color.tomatoInk : color.saffronInk }}>{d.attention}</Text>
          </View>
        )}
        {d.golden === 'none' && (
          <Sub style={{ fontSize: 13 }}>Guests rate it {d.guestAvg?.toFixed(1)} from {d.guestCount}. Add a Golden Plate to start checking plates.</Sub>
        )}
      </Squishy>
    </SquishIn>
  );
}

export default function Dishes() {
  const { role } = useSession();
  const dishes = [...DISH_STATS].sort((a, b) => rank(a) - rank(b));
  const pct = COVERAGE.protected / COVERAGE.total;
  const needs = dishes.filter((d) => d.attention).length;

  return (
    <Screen scroll style={{ paddingBottom: 120 }}>
      <TopBar sub="Saffron House · Friday dinner" title={role === 'head_chef' ? 'Hi Chef Imran!' : 'Dishes'} />

      <SquishIn>
        <Card style={{ backgroundColor: color.saffron, gap: 10 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <H2>Golden Plates</H2>
            <Num style={{ fontSize: 24 }}>{COVERAGE.protected}<Text style={{ fontFamily: font.bodySemi, fontSize: 15, color: color.ink }}> of {COVERAGE.total} protected</Text></Num>
          </Row>
          <View accessibilityLabel={`${Math.round(pct * 100)} percent of dishes protected`} style={{ height: 10, borderRadius: 6, backgroundColor: color.bg, overflow: 'hidden' }}>
            <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: color.ink }} />
          </View>
          <Sub style={{ color: color.ink, fontSize: 13 }}>Start with your top sellers. Each one takes about 5 minutes.</Sub>
          {can(role, 'edit_menu') && (
            <Button small title="+ Add a Golden Plate" style={{ alignSelf: 'flex-start' }} onPress={() => router.push({ pathname: '/golden/[id]', params: { id: DISH_STATS.find((x) => x.name === 'Mutton Biryani')!.id } })} />
          )}
        </Card>
      </SquishIn>

      <Label>{needs ? `${needs} need a look first` : 'All dishes on standard'}</Label>
      {dishes.map((d, i) => <DishCard key={d.id} d={d} index={i + 1} />)}
      {can(role, 'edit_menu') && <Button kind="white" small title="Snap a new menu" onPress={() => router.push('/setup?step=menu')} />}
    </Screen>
  );
}
