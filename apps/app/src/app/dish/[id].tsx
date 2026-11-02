// A13 · Dish detail: the Golden Plate, how plates compare by shift, what guests answered, and a timeline of evidence.
import { Button, Card, Chip, Face, H2, Label, Num, Row, Screen, SquishIn, Sub, color, font } from '@nomi/ui';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { DishIcon } from '@/components/dish-icon';
import { AiTag, Bars, DAYS, Empty, Score, Segmented, Spark, TopBar, Why, scoreTone } from '@/components/kit';
import { Compare, GoldenPhoto, partsFromReasons } from '@/components/plate';
import { ANSWER_STATS, CAPTURES, DISH_STATS, NOTES, PICKS, SOP_CARDS } from '@/lib/mock';
import { can, useSession } from '@/lib/session';

export default function DishDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { role } = useSession();
  const d = DISH_STATS.find((x) => x.id === id) ?? DISH_STATS[0];
  const [tab, setTab] = useState<'plates' | 'guests' | 'versions'>('plates');
  const caps = CAPTURES.filter((c) => c.dishId === d.id);
  const notes = NOTES.filter((n) => n.faces.some((f) => f.dish === d.name));
  const sop = SOP_CARDS.find((s) => s.dishId === d.id);
  const byQ = ANSWER_STATS[d.id] ?? [];

  if (d.golden === 'none')
    return (
      <Screen scroll>
        <TopBar back sub={d.category} title={d.name} />
        <Card style={{ alignItems: 'center', gap: 10 }}>
          <DishIcon name={d.name} url={null} size={110} />
          <Empty title="No Golden Plate yet" sub={`Guests rate it ${d.guestAvg?.toFixed(1)} from ${d.guestCount} visits. Plate it once, perfectly, and Nomi will check every plate after that.`} />
          {can(role, 'edit_menu') && <Button title="Create the Golden Plate" style={{ alignSelf: 'stretch' }} onPress={() => router.push({ pathname: '/golden/[id]', params: { id: d.id } })} />}
        </Card>
      </Screen>
    );

  return (
    <Screen scroll style={{ paddingBottom: 40 }}>
      <TopBar back sub={`${d.category} · Golden Plate v${d.goldenVersion ?? 1}`} title={d.name} right={<DishIcon name={d.name} url={null} size={52} />} />

      <SquishIn>
        <GoldenPhoto dish={d.name} height={260} />
      </SquishIn>

      {d.scoreToday !== null && (
        <SquishIn index={1}>
          <Card style={{ gap: 12 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <View style={{ gap: 2 }}>
                <Label>Consistency today</Label>
                <Sub style={{ fontSize: 13 }}>{d.plates} plates scored at the pass</Sub>
              </View>
              <Score value={d.scoreToday} size={64} word />
            </Row>
            {d.byShift && (
              <Row>
                {(['Lunch', 'Dinner'] as const).map((s) => (
                  <View key={s} style={{ flex: 1, backgroundColor: color.bg, borderRadius: 16, padding: 10, gap: 2 }}>
                    <Text style={{ fontFamily: font.bodyBold, fontSize: 12, color: color.ink2 }}>{s}</Text>
                    <Num style={{ fontSize: 22, color: scoreTone(d.byShift![s]) === 'tomato' ? color.tomatoInk : color.ink }}>{d.byShift![s]}</Num>
                  </View>
                ))}
                <View style={{ flex: 1.4, backgroundColor: color.bg, borderRadius: 16, padding: 10, gap: 4 }}>
                  <Text style={{ fontFamily: font.bodyBold, fontSize: 12, color: color.ink2 }}>Last 7 days</Text>
                  <Spark values={d.trend} width={110} stroke={scoreTone(d.scoreToday) === 'tomato' ? color.tomato : color.ink} />
                </View>
              </Row>
            )}
            {d.attention && (
              <View style={{ backgroundColor: color.tomatoSoft, borderRadius: 14, padding: 10, gap: 8 }}>
                <Text style={{ fontFamily: font.bodyBold, fontSize: 14, color: color.tomatoInk }}>{d.attention}</Text>
                <Why title={d.attention} items={[
                  { kind: 'count', title: 'PASS captures', detail: `${d.flagged} of ${d.plates} plates under the nudge line today`, tone: 'tomato' },
                  ...caps.slice(0, 2).map((c) => ({ kind: 'plate' as const, title: `${c.day} ${c.time} · ${c.shift} · score ${c.score}`, detail: c.reasons.join(', ') || 'On standard', tone: 'tomato' as const })),
                  ...notes.slice(0, 2).filter((n) => n.translation).map((n) => ({ kind: 'quote' as const, title: `${n.table} · ${n.language}`, detail: `"${n.translation}"`, tone: 'saffron' as const })),
                ]} />
              </View>
            )}
          </Card>
        </SquishIn>
      )}

      {byQ.length > 0 && (
        <SquishIn index={2}>
          <Card style={{ gap: 10 }}>
            <Label>Guests answered this week</Label>
            {byQ.map((q) => (
              <View key={q.q} style={{ gap: 6 }}>
                <Text style={{ fontFamily: font.bodyBold, fontSize: 14, color: color.ink }}>{q.q}</Text>
                <View style={{ flexDirection: 'row', height: 14, borderRadius: 7, overflow: 'hidden' }} accessibilityLabel={`${q.yes} yes, ${q.no} ${q.noLabel}`}>
                  <View style={{ flex: q.yes, backgroundColor: color.mint }} />
                  <View style={{ flex: q.no, backgroundColor: color.tomato }} />
                </View>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: font.bodySemi, fontSize: 12, color: color.mintInk }}>{q.yes} yes</Text>
                  <Text style={{ fontFamily: font.bodySemi, fontSize: 12, color: color.tomatoInk }}>{q.no} {q.noLabel.toLowerCase()}</Text>
                </Row>
              </View>
            ))}
          </Card>
        </SquishIn>
      )}

      <Segmented value={tab} onChange={setTab} options={[{ value: 'plates', label: 'Plates' }, { value: 'guests', label: 'Guests' }, { value: 'versions', label: 'Versions' }]} />

      {tab === 'plates' && (caps.length ? caps.map((c, i) => (
        <SquishIn key={c.id} index={i}>
          <Card style={{ gap: 10 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <H2 style={{ fontSize: 16 }}>{c.day} {c.shift} · {c.time}</H2>
              <AiTag model="SAM 3.1" />
            </Row>
            {c.reasons.length ? <Compare score={c.score} reasons={c.reasons} when={c.time} dish={d.name} shotKey={c.shot} {...partsFromReasons(c.reasons)} /> : (
              <Row><Score value={c.score} size={44} /><Sub style={{ fontSize: 14 }}>Matched the Golden Plate.</Sub></Row>
            )}
          </Card>
        </SquishIn>
      )) : <Empty title="No plates scored yet" sub="Plates appear here once the pass camera sees this dish." />)}

      {tab === 'guests' && (notes.length ? notes.map((n, i) => (
        <SquishIn key={n.id} index={i}>
          <Card soft style={{ gap: 8 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: font.bodyBold, fontSize: 14, color: color.ink }}>{n.table} · {n.day} {n.shift}</Text>
              <Row gap={4}>{n.faces.filter((f) => f.dish === d.name).map((f) => <Face key={f.dish} level={(f.value - 1) as 0 | 1 | 2 | 3 | 4} size={26} />)}</Row>
            </Row>
            {n.translation || n.original ? <Text style={{ fontFamily: font.body, fontSize: 15, color: color.ink }}>“{n.translation ?? n.original}”</Text> : null}
            {n.photo && <Chip tone={scoreTone(n.photo.score)} label={`Guest photo scored ${n.photo.score}`} />}
          </Card>
        </SquishIn>
      )) : <Empty title="No guest notes yet" sub="Notes that mention this dish land here, translated." />)}

      {tab === 'versions' && (
        <View style={{ gap: 10 }}>
          {[{ v: d.goldenVersion ?? 1, when: 'Wed 29 Oct', why: 'Raita moved off the plate; lemon on the rim', live: true }, ...(d.goldenVersion === 2 ? [{ v: 1, when: 'Mon 27 Oct', why: 'First Golden Plate', live: false }] : [])].map((x) => (
            <Card key={x.v} soft style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Num style={{ fontSize: 22 }}>v{x.v}</Num>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: font.bodyBold, fontSize: 14, color: color.ink }}>{x.why}</Text>
                <Sub style={{ fontSize: 13 }}>Published {x.when} by Chef Imran</Sub>
              </View>
              {x.live && <Chip tone="mint" label="Live" />}
            </Card>
          ))}
        </View>
      )}

      {sop && (
        <Card style={{ gap: 8 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <H2 style={{ fontSize: 17 }}>Plating card v{sop.version}</H2>
            <AiTag model="Muse Image" />
          </Row>
          {sop.rules.map((r, i) => (
            <Row key={i} gap={10} style={{ alignItems: 'flex-start' }}>
              <View style={{ width: 24, height: 24, borderRadius: 8, backgroundColor: color.saffron, alignItems: 'center', justifyContent: 'center' }}><Num style={{ fontSize: 13 }}>{i + 1}</Num></View>
              <Text style={{ flex: 1, fontFamily: font.bodySemi, fontSize: 14, color: color.ink }}>{r.en}</Text>
            </Row>
          ))}
          <Sub style={{ fontSize: 12 }}>Approved {sop.approvedAt} by {sop.approvedBy}</Sub>
        </Card>
      )}

      <Card soft style={{ gap: 4 }}>
        <Label>Guest picks per day</Label>
        <Bars values={PICKS[d.id] ?? []} labels={DAYS} width={300} fill={color.sky} />
      </Card>

      {can(role, 'edit_menu') && <Button kind="white" title="Update the Golden Plate" onPress={() => router.push({ pathname: '/golden/[id]', params: { id: d.id } })} />}
    </Screen>
  );
}
