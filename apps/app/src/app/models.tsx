// The Meta models inside Nomi: what each one does here, where to try it, and every live call this phone made since the app
// opened. Made so anyone can see which results are live model calls and how long they took.
import { Card, Chip, H1, H2, Label, Row, Screen, SquishIn, Squishy, Sub, color, font, shadow } from '@nomi/ui';
import { router, type Href } from 'expo-router';
import { Text, View } from 'react-native';

import { AiTag, TopBar } from '@/components/kit';
import { useLiveCalls } from '@/lib/calls';
import type { Model } from '@/lib/mock';
import { useSession } from '@/lib/session';
import type { Role } from '@nomi/shared';

type Try = { label: string; href: Href; role?: Role };
const MODELS: { model: Model; job: string; uses: string[]; tries: Try[]; live: boolean }[] = [
  {
    model: 'SAM 3.1', live: true,
    job: 'Finds every part of a plate, a shelf or a counter, pixel by pixel. Nomi measures shares, counts and clock positions from its masks.',
    uses: ['Golden Plate masks and tap-to-fix', 'Check my plate before it leaves', 'The pass camera score', 'Larder and closing counts'],
    tries: [{ label: 'Check my plate', href: '/check', role: 'staff' }, { label: 'New Golden Plate', href: '/golden/00000000-0000-0000-0000-0000000d0007', role: 'head_chef' }],
  },
  {
    model: 'Muse Spark', live: true,
    job: 'Reads photos and words: names the dish in a guest photo, tags feedback, turns a chef’s words into rules, writes guest questions and replies, translates cards.',
    uses: ['Guest “show us your plate”', 'Feedback tags from a voice note', 'Spoken plating rules', 'Plating cards in 6 languages', 'Reply drafts'],
    tries: [{ label: 'Guest page', href: '/t/demo-table-7' }, { label: 'Cards in Tamil', href: '/cards', role: 'staff' }],
  },
  {
    model: 'Muse Wonder', live: true,
    job: 'The deeper reasoner: reads a whole printed menu, and answers questions only from what Nomi saw, counted or heard. It refuses forecasts.',
    uses: ['Menu Snap at setup', 'Ask Nomi for the owner', 'Ask by voice for cooks'],
    tries: [{ label: 'Ask Nomi', href: '/ask', role: 'owner' }, { label: 'Menu Snap', href: '/setup?step=menu' }],
  },
  {
    model: 'Muse Image', live: true,
    job: 'Draws from the chef’s own Golden Plate photo: the numbered plating card staff follow and the dish icon guests tap. It also made every demo photo and the logo here.',
    uses: ['Plating card from your photo', 'Dish icons across the menu', 'The 45 demo photos and the Saffron House logo'],
    tries: [{ label: 'Golden Plate card', href: '/golden/00000000-0000-0000-0000-0000000d0007', role: 'head_chef' }],
  },
  {
    model: 'Voice Transcribe', live: true,
    job: 'Writes down speech in Hindi, Hinglish, English and more, so nobody in a kitchen has to type with wet hands.',
    uses: ['Guest voice notes', 'Chef speaks the plating rules', 'Shift handover', 'Ask by voice'],
    tries: [{ label: 'Handover', href: '/handover', role: 'staff' }, { label: 'Guest voice note', href: '/t/demo-table-7/talk' }],
  },
  {
    model: 'Glimmer (on site)', live: false,
    job: 'A small model that runs on the restaurant’s own machine: keeps only pass frames with a plate in them and removes phone numbers from guest notes before anything leaves the building.',
    uses: ['Pass frame filter', 'Privacy redaction'],
    tries: [],
  },
];

const ago = (at: number) => {
  const s = Math.round((Date.now() - at) / 1000);
  return s < 60 ? `${s}s ago` : `${Math.round(s / 60)} min ago`;
};

export default function Models() {
  const calls = useLiveCalls();
  const { setRole } = useSession();
  const go = (t: Try) => { if (t.role) setRole(t.role); router.push(t.href); };
  return (
    <Screen scroll style={{ paddingBottom: 40 }}>
      <TopBar back sub="Meta models inside Nomi" title="Under the hood" right={<View />} />
      <Sub>Six Meta models, each doing one job. Every result in the app carries the model’s name; a green dot means it was a live call just now.</Sub>

      <Card style={{ backgroundColor: color.ink, gap: 6 }}>
        <Text style={{ fontFamily: font.bodyBold, fontSize: 12, color: color.saffron, letterSpacing: 1.1, textTransform: 'uppercase' }}>Live on this phone</Text>
        <H1 style={{ color: color.bg, fontSize: 30 }}>{calls.length} model call{calls.length === 1 ? '' : 's'}</H1>
        <Sub style={{ color: color.saffronSoft, fontSize: 13 }}>Since the app opened. Try any screen below and watch this count.</Sub>
      </Card>

      {MODELS.map((m, i) => {
        const mine = calls.filter((c) => c.models.includes(m.model));
        const avg = mine.length ? mine.reduce((a, c) => a + c.ms, 0) / mine.length : 0;
        return (
          <SquishIn key={m.model} index={i}>
            <Card style={{ gap: 10 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <H2 style={{ fontSize: 19 }}>{m.model}</H2>
                {m.live ? <Chip tone={mine.length ? 'mint' : 'white'} label={mine.length ? `${mine.length} live · ${(avg / 1000).toFixed(1)} s avg` : 'Live'} /> : <Chip tone="saffron" label="On site only" />}
              </Row>
              <Text style={{ fontFamily: font.body, fontSize: 14, lineHeight: 20, color: color.ink }}>{m.job}</Text>
              <View style={{ gap: 3 }}>
                {m.uses.map((u) => <Text key={u} style={{ fontFamily: font.bodySemi, fontSize: 13, color: color.ink2 }}>• {u}</Text>)}
              </View>
              {m.tries.length > 0 && (
                <Row gap={8} style={{ flexWrap: 'wrap' }}>
                  {m.tries.map((t) => (
                    <Squishy key={t.label} accessibilityRole="button" onPress={() => go(t)}
                      style={{ minHeight: 40, paddingHorizontal: 14, borderRadius: 14, backgroundColor: color.saffronSoft, justifyContent: 'center', ...shadow(1) }}>
                      <Text style={{ fontFamily: font.bodyBold, fontSize: 13, color: color.saffronInk }}>Try: {t.label} ›</Text>
                    </Squishy>
                  ))}
                </Row>
              )}
              {!m.live && <Sub style={{ fontSize: 12 }}>Not part of this hosted demo: it needs the restaurant’s own device.</Sub>}
            </Card>
          </SquishIn>
        );
      })}

      <Label>Live calls</Label>
      {calls.length === 0 && <Sub style={{ fontSize: 13 }}>No live calls yet. Take a photo, record a voice note or ask a question anywhere in the app.</Sub>}
      {calls.map((c) => (
        <Row key={c.at} gap={10} style={{ backgroundColor: color.card, borderRadius: 16, padding: 10 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.ok ? color.mint : color.tomato }} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ fontFamily: font.bodyBold, fontSize: 14, color: color.ink }}>{c.what}</Text>
            <Row gap={6} style={{ flexWrap: 'wrap' }}>{c.models.map((m) => <AiTag key={m} model={m} />)}</Row>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontFamily: font.bodyBold, fontSize: 13, color: color.ink }}>{(c.ms / 1000).toFixed(1)} s</Text>
            <Text style={{ fontFamily: font.body, fontSize: 11, color: color.ink2 }}>{ago(c.at)}</Text>
          </View>
        </Row>
      ))}
    </Screen>
  );
}
