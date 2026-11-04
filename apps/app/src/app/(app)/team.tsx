// A6 · Team and tables: invite people by phone and role, and manage each table's QR (rotate a token if a code leaks).
import { Button, Card, Chip, H2, Label, Row, Screen, SquishIn, Squishy, Sub, color, font, shadow } from '@nomi/ui';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { QR } from '@/components/qr';
import { guestUrl } from '@/lib/links';
import { Segmented, Sheet, TopBar } from '@/components/kit';
import { TABLES, TEAM } from '@/lib/mock';

const ROLES = ['Owner', 'Head Chef', 'Manager', 'Staff'];
const notes = (n: number) => `${n} note${n === 1 ? '' : 's'}`;

export default function Team() {
  const [view, setView] = useState<'people' | 'tables'>('people');
  const [inviting, setInviting] = useState(false);
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Staff');
  const [people, setPeople] = useState(TEAM);
  const [tables, setTables] = useState(TABLES);
  const [table, setTable] = useState<(typeof TABLES)[number] | null>(null);

  const rotate = (label: string) => {
    const t = Math.random().toString(36).slice(2, 10);
    setTables((xs) => xs.map((x) => (x.label === label ? { ...x, token: t } : x)));
    setTable((x) => (x && x.label === label ? { ...x, token: t } : x));
  };

  return (
    <Screen scroll style={{ paddingBottom: 120 }}>
      <TopBar sub="Saffron House" title="Team & tables" />
      <Segmented value={view} onChange={setView} options={[{ value: 'people', label: `People · ${people.length}` }, { value: 'tables', label: `Tables · ${tables.length}` }]} />

      {view === 'people' && (
        <>
          {people.map((p, i) => (
            <SquishIn key={p.name} index={i}>
              <Card soft style={{ flexDirection: 'row', alignItems: 'center', gap: 12, opacity: p.active ? 1 : 0.6 }}>
                <View style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: color.ink, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontFamily: font.displayBold, color: color.saffron, fontSize: 15 }}>{p.name.split(' ').map((w) => w[0]).join('')}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: font.bodyBold, fontSize: 15, color: color.ink }}>{p.name}</Text>
                  <Text style={{ fontFamily: font.bodySemi, fontSize: 12, color: color.ink2 }}>{p.phone} · reads in {p.language}</Text>
                </View>
                {p.active ? <Chip tone="saffron" label={p.roles.join(', ')} /> : <Chip tone="white" label="Invited" />}
              </Card>
            </SquishIn>
          ))}
          <Button title="Invite someone" onPress={() => setInviting(true)} />
          <Sheet open={inviting} onClose={() => setInviting(false)} title="Invite by phone" sub="They get a text with a sign-in link. No passwords.">
            <TextInput accessibilityLabel="Phone number" keyboardType="phone-pad" value={phone} onChangeText={setPhone} placeholder="+91 98765 43210" placeholderTextColor={color.ink2}
              style={{ minHeight: 56, borderRadius: 20, backgroundColor: color.bg, paddingHorizontal: 16, fontFamily: font.bodyBold, fontSize: 18, color: color.ink }} />
            <Label>Role</Label>
            <Row gap={8} style={{ flexWrap: 'wrap' }}>
              {ROLES.map((r) => (
                <Squishy key={r} accessibilityRole="radio" accessibilityState={{ selected: role === r }} onPress={() => setRole(r)}
                  style={{ minHeight: 44, paddingHorizontal: 14, borderRadius: 16, justifyContent: 'center', backgroundColor: role === r ? color.ink : color.bg }}>
                  <Text style={{ fontFamily: font.bodyBold, fontSize: 14, color: role === r ? color.bg : color.ink }}>{r}</Text>
                </Squishy>
              ))}
            </Row>
            <Button title="Send invite" disabled={phone.replace(/\D/g, '').length < 10} onPress={() => {
              setPeople((p) => [...p, { name: `New ${role.toLowerCase()}`, roles: [role], phone: phone.replace(/(\d{2})\d+(\d{4})$/, '$1•••• $2'), language: 'English', active: false }]);
              setPhone('');
              setInviting(false);
            }} />
          </Sheet>
        </>
      )}

      {view === 'tables' && (
        <>
          <Sub style={{ fontSize: 14 }}>Each table has its own QR. Notes from it arrive tagged with the table and the shift.</Sub>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {tables.map((t) => (
              <Squishy key={t.label} accessibilityRole="button" accessibilityLabel={`${t.label}, ${notes(t.notes)} this week`} onPress={() => setTable(t)} containerStyle={{ width: '31%' }}
                style={{ backgroundColor: color.card, borderRadius: 20, padding: 10, alignItems: 'center', gap: 4, ...shadow(1) }}>
                <QR value={guestUrl(t.token)} size={64} />
                <Text style={{ fontFamily: font.bodyBold, fontSize: 13, color: color.ink }}>{t.label}</Text>
                <Text style={{ fontFamily: font.bodySemi, fontSize: 11, color: color.ink2 }}>{notes(t.notes)}</Text>
              </Squishy>
            ))}
          </View>
          <Button kind="saffron" title="Print table tents in Studio" onPress={() => router.push('/studio')} />
          <Sheet open={!!table} onClose={() => setTable(null)} title={table?.label ?? ''} sub={table ? guestUrl(table.token).replace(/^https?:\/\//, '') : ''}>
            {table && (
              <View style={{ alignItems: 'center', gap: 12 }}>
                <QR value={guestUrl(table.token)} size={200} />
                <H2 style={{ fontSize: 16 }}>{notes(table.notes)} this week</H2>
                <Button small kind="white" title="Rotate this QR" onPress={() => rotate(table.label)} />
                <Sub style={{ fontSize: 12, textAlign: 'center' }}>Rotating makes the old printed code stop working. Print the new tent before you rotate.</Sub>
              </View>
            )}
          </Sheet>
        </>
      )}
    </Screen>
  );
}
