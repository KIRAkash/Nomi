// A2–A4 · Set up a restaurant: the basics, Menu Snap (Muse Wonder reads a photo of the printed menu, live), a review where
// unclear fields are amber, and components per dish proposed live by Muse Spark. Then on to the first Golden Plate.
import { Button, Card, Chip, H1, H2, Label, Row, Screen, SquishIn, Squishy, Sub, color, font, shadow } from '@nomi/ui';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Text, TextInput, View, useWindowDimensions } from 'react-native';

import { LiveCamera, Shutter, type CameraHandle } from '@/components/camera';
import { DishIcon } from '@/components/dish-icon';
import { AiTag, LiveWait, TopBar, WorkLine } from '@/components/kit';
import { proposeParts, readMenu } from '@/lib/api';
import { DISH_STATS, MENU_SNAP } from '@/lib/mock';
import { useSession } from '@/lib/session';

const field = { minHeight: 54, borderRadius: 18, backgroundColor: color.card, paddingHorizontal: 16, fontFamily: font.bodySemi, fontSize: 16, color: color.ink, ...shadow(1) } as const;
const PROPOSED: Record<string, string[]> = {
  'Chicken Biryani': ['rice', 'chicken pieces', 'fried onions', 'lemon wedge', 'bowl'],
  'Paneer Tikka': ['paneer cubes', 'green chutney', 'onion rings'],
  'Butter Chicken': ['bowl', 'chicken pieces', 'cream swirl'],
};

function Basics({ next }: { next: () => void }) {
  const [name, setName] = useState('Saffron House');
  const [tables, setTables] = useState('14');
  return (
    <View style={{ gap: 12 }}>
      <H1>Your restaurant</H1>
      <Sub>Two minutes. You can change all of it later.</Sub>
      <Label>Name</Label>
      <TextInput accessibilityLabel="Restaurant name" value={name} onChangeText={setName} style={field} />
      <Row>
        <View style={{ flex: 1, gap: 6 }}><Label>Cuisine</Label><TextInput accessibilityLabel="Cuisine" defaultValue="North Indian" style={field} /></View>
        <View style={{ flex: 1, gap: 6 }}><Label>City</Label><TextInput accessibilityLabel="City" defaultValue="Bengaluru" style={field} /></View>
      </Row>
      <Label>Tables</Label>
      <TextInput accessibilityLabel="Number of tables" keyboardType="number-pad" value={tables} onChangeText={setTables} style={field} />
      <Label>Shifts</Label>
      <Row gap={8}>
        <Chip tone="saffron" label="Lunch 12:00–15:30" />
        <Chip tone="saffron" label="Dinner 19:00–23:30" />
      </Row>
      <Button title="Next: your menu" disabled={!name.trim() || !Number(tables)} onPress={next} />
    </View>
  );
}

type MenuRow = { name: string; category: string; price: number | null; veg: boolean | null; unclear: string[] };

/** Muse Wonder reads the photographed menu, live. Anything it could not read comes back amber for the owner to fix. */
function Snap({ next }: { next: (dishes: MenuRow[]) => void }) {
  const [shown, setShown] = useState(0);
  const cam = useRef<CameraHandle>(null);
  const [ready, setReady] = useState(false);
  const [page, setPage] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ dishes: MenuRow[]; ms?: number; offline?: boolean } | null>(null);
  const snap = async () => {
    const p = await cam.current?.snap();
    if (!p) return;
    setPage(p.uri);
    try {
      const r = await readMenu(p.dataUrl);
      setMenu({ dishes: r.dishes.map((d) => ({ ...d, category: d.category[0] + d.category.slice(1).toLowerCase() })), ms: r.ms });
    } catch {
      setMenu({ dishes: MENU_SNAP, offline: true });
    }
  };
  const total = menu?.dishes.length ?? 0;
  useEffect(() => {
    if (!menu || shown >= total) return;
    const t = setTimeout(() => setShown((n) => n + 1), 120);
    return () => clearTimeout(t);
  }, [menu, shown, total]);
  const unclear = menu?.dishes.filter((d) => d.unclear.length || d.price === null).length ?? 0;
  // A tablet keeps the menu photo large on the left and fills the dishes in beside it; a phone stacks.
  const wide = useWindowDimensions().width >= 900;
  const camera = <LiveCamera ref={cam} height={wide ? 560 : menu ? 180 : 380} guide="menu" still={page} onReady={setReady} demo={['kitchen/menu-printed']} />;
  const shutter = !page && (
    <>
      <Shutter onPress={snap} disabled={!ready} label="Photograph the menu" />
      <Sub style={{ fontSize: 13, textAlign: 'center' }}>Flat, well lit, all four corners inside the frame</Sub>
    </>
  );
  const results = (
    <>
      {page && !menu && (
        <Card style={{ gap: 8 }}>
          <LiveWait text="Reading every dish and price, marking anything it can't read" model="Muse Wonder" typical="20 s" />
        </Card>
      )}
      <View style={wide ? { flexDirection: 'row', flexWrap: 'wrap', gap: 10 } : { gap: 12 }}>
        {menu?.dishes.slice(0, shown).map((d, i) => {
          const unsure = d.unclear.length > 0 || d.price === null;
          return (
            <SquishIn key={`${i}-${d.name}`} style={wide ? { width: '48.5%' } : undefined}>
              <Card soft style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: unsure ? color.saffronSoft : color.card }}>
                <View style={{ width: 12, height: 12, borderRadius: 3, borderWidth: 2, borderColor: d.veg === null ? color.ink2 : d.veg ? color.mint : color.tomato }} accessibilityLabel={d.veg === null ? 'Veg or not unclear' : d.veg ? 'Veg' : 'Non-veg'} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: font.bodyBold, fontSize: 15, color: d.name ? color.ink : color.saffronInk }}>{d.name || 'Name not readable'}</Text>
                  <Text style={{ fontFamily: font.bodySemi, fontSize: 12, color: unsure ? color.saffronInk : color.ink2 }}>{d.category}{unsure ? ` · check the ${(d.unclear.length ? d.unclear : ['price']).join(', ')}` : ''}</Text>
                </View>
                <Text style={{ fontFamily: font.bodyBold, fontSize: 15, color: d.price === null ? color.saffronInk : color.ink }}>{d.price === null ? '₹ ?' : `₹${d.price}`}</Text>
              </Card>
            </SquishIn>
          );
        })}
      </View>
      {menu && shown >= total && (
        <SquishIn style={{ gap: 10 }}>
          <Row gap={6}>
            <AiTag model="Muse Wonder" ms={menu.ms} />
            <Text style={{ fontFamily: font.bodySemi, fontSize: 13, color: color.ink2 }}>{total} dishes · {unclear} to check{menu.offline ? ' · offline sample' : ''}</Text>
          </Row>
          <Button title="Next: what's on each plate" onPress={() => next(menu.dishes)} />
        </SquishIn>
      )}
    </>
  );
  const intro = (
    <>
      <H1>Snap your menu</H1>
      <Sub>Hold the phone over the printed menu. Nomi types it up; you fix anything it is unsure about.</Sub>
    </>
  );
  if (wide) return (
    <View style={{ gap: 12 }}>
      {intro}
      <View style={{ flexDirection: 'row', gap: 20, alignItems: 'flex-start' }}>
        <View style={{ flex: 0.8, gap: 12 }}>{camera}{shutter}</View>
        <View style={{ flex: 1.2, gap: 12 }}>{results}</View>
      </View>
    </View>
  );
  return (
    <View style={{ gap: 12 }}>
      {intro}
      {camera}
      {shutter}
      {results}
    </View>
  );
}

/** Muse Spark proposes the separately visible parts of each dish as plain nouns SAM 3.1 can find, live. */
function Components({ dishes, next }: { dishes: MenuRow[]; next: () => void }) {
  const pick = dishes.slice(0, 4).map((d) => d.name);
  const [parts, setParts] = useState<Record<string, string[] | null>>(() => Object.fromEntries(pick.map((d) => [d, null])));
  const [ms, setMs] = useState<number | undefined>();
  useEffect(() => {
    let on = true;
    for (const d of pick) {
      proposeParts(d, null)
        .then((r) => { if (on) { setParts((s) => ({ ...s, [d]: r.components.map((c) => c.sam_prompt) })); setMs(r.ms); } })
        .catch(() => on && setParts((s) => ({ ...s, [d]: PROPOSED[d] ?? [] })));
    }
    return () => { on = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const wide = useWindowDimensions().width >= 900;
  return (
    <View style={{ gap: 12 }}>
      <H1>What’s on each plate</H1>
      <Sub>Nomi suggested the parts it will look for. Tap one to remove it. Plain words work best: “fried onions”, not “birista”.</Sub>
      <AiTag model="Muse Spark" ms={ms} />
      <View style={wide ? { flexDirection: 'row', flexWrap: 'wrap', gap: 12 } : { gap: 12 }}>
      {Object.entries(parts).map(([dish, xs], i) => (
        <SquishIn key={dish} index={i} style={wide ? { width: '49%' } : undefined}>
          <Card style={{ gap: 10 }}>
            <Row><DishIcon name={dish} url={null} size={44} /><H2 style={{ fontSize: 17, flex: 1 }}>{dish}</H2></Row>
            {!xs ? <WorkLine state="run" text="Listing the parts SAM 3.1 will look for" model="Muse Spark" /> : (
              <Row gap={8} style={{ flexWrap: 'wrap' }}>
                {xs.map((p) => (
                  <Squishy key={p} accessibilityRole="button" accessibilityLabel={`Remove ${p}`} onPress={() => setParts((s) => ({ ...s, [dish]: (s[dish] ?? []).filter((x) => x !== p) }))}
                    style={{ minHeight: 40, paddingHorizontal: 12, borderRadius: 14, backgroundColor: color.skySoft, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontFamily: font.bodyBold, fontSize: 13, color: color.skyInk }}>{p}</Text>
                    <Text style={{ fontFamily: font.bodyBold, fontSize: 13, color: color.skyInk }}>×</Text>
                  </Squishy>
                ))}
              </Row>
            )}
          </Card>
        </SquishIn>
      ))}
      </View>
      <Button title="Save the menu" onPress={next} />
    </View>
  );
}

function Done() {
  const { setRole } = useSession();
  return (
    <SquishIn style={{ gap: 12 }}>
      <H1>Menu saved</H1>
      <Sub>{MENU_SNAP.length} dishes are in. Protect your top sellers first: each Golden Plate takes about 5 minutes.</Sub>
      <Card style={{ gap: 8 }}>
        <Label>Your top sellers</Label>
        {['Mutton Biryani', 'Butter Chicken', 'Paneer Tikka'].map((d) => <Text key={d} style={{ fontFamily: font.bodyBold, fontSize: 15, color: color.ink }}>• {d}</Text>)}
      </Card>
      <Button title="Create the first Golden Plate" onPress={() => { setRole('head_chef'); router.replace({ pathname: '/golden/[id]', params: { id: DISH_STATS.find((x) => x.name === 'Mutton Biryani')!.id } }); }} />
      <Button kind="white" title="Invite the team first" onPress={() => { setRole('manager'); router.replace('/team'); }} />
    </SquishIn>
  );
}

export default function Setup() {
  const params = useLocalSearchParams<{ step?: string }>();
  const [step, setStep] = useState(params.step === 'menu' ? 1 : 0);
  const [dishes, setDishes] = useState<MenuRow[]>(MENU_SNAP);
  const next = () => setStep((x) => x + 1);
  return (
    <Screen wide scroll style={{ paddingBottom: 40 }}>
      <TopBar back sub={`Step ${Math.min(step + 1, 3)} of 3`} title="Set up Nomi" right={<View />} />
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {[0, 1, 2].map((i) => <View key={i} style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: i <= step ? color.ink : color.saffronSoft }} />)}
      </View>
      <SquishIn key={step}>
        {step === 0 && <Basics next={next} />}
        {step === 1 && <Snap next={(d) => { setDishes(d); next(); }} />}
        {step === 2 && <Components dishes={dishes} next={next} />}
        {step === 3 && <Done />}
      </SquishIn>
    </Screen>
  );
}
