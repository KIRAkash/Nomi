// A23 · Staff cards: tonight's reminders and every plating card, in the reader's language. Big text for a glance across the pass.
import { Label, Screen, SquishIn, Sub } from '@nomi/ui';
import { useState } from 'react';

import { Segmented, TopBar } from '@/components/kit';
import { SopCard, WatchList } from '@/components/sop';
import { SOP_CARDS } from '@/lib/mock';

export default function Cards() {
  const [lang, setLang] = useState<'en' | 'hi'>('hi');
  return (
    <Screen scroll style={{ paddingBottom: 120 }}>
      <TopBar sub="Friday dinner" title="Namaste, Ravi" />
      <Segmented value={lang} onChange={setLang} options={[{ value: 'hi', label: 'हिन्दी' }, { value: 'en', label: 'English' }]} />
      <SquishIn><WatchList /></SquishIn>
      <Label>{lang === 'hi' ? 'प्लेटिंग कार्ड' : 'Plating cards'}</Label>
      {SOP_CARDS.map((c, i) => <SquishIn key={c.dishId} index={i + 1}><SopCard card={c} lang={lang} /></SquishIn>)}
      <Sub style={{ fontSize: 12, textAlign: 'center' }}>Cards change only when Chef Imran approves a new version.</Sub>
    </Screen>
  );
}
