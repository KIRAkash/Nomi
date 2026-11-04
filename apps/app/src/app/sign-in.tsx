// A1 · Sign in with a phone number and a one-time code, then pick which role to open (one person may hold several).
// Demo build: any 10-digit number works and the code is shown on screen; Supabase phone OTP replaces this.
import type { Role } from '@nomi/shared';
import { Button, Card, H1, H2, Row, Screen, SquishIn, Squishy, Sub, color, font, shadow } from '@nomi/ui';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useState } from 'react';
import { Linking, Platform, Text, TextInput, View } from 'react-native';

import { BackIcon, IconButton } from '@/components/kit';
import { APK_URL, WEB_URL, apkReady } from '@/lib/links';
import { ROLE_LABEL, ROLE_PERSON, ROLE_TABS, useSession } from '@/lib/session';

const ROLE_BLURB: Record<Role, string> = {
  head_chef: 'Golden Plates, the pass and how every dish is doing',
  owner: 'The morning briefing, approvals and Ask Nomi',
  manager: 'Guest notes, replies, stock and the closing round',
  staff: 'Check a plate before it leaves, cards in your language, voice handover',
};
const ROLE_BG: Record<Role, string> = { head_chef: color.saffron, owner: color.skySoft, manager: color.mintSoft, staff: color.pinkSoft };

// On the web, after the code, people choose the Android app or the web. Nomi is built around a handheld camera, so a
// computer gets a note before it carries on.
const onWeb = Platform.OS === 'web';
const handheld = () => typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches;

const input = { minHeight: 60, borderRadius: 22, backgroundColor: color.card, paddingHorizontal: 18, fontFamily: font.bodyBold, fontSize: 20, color: color.ink, ...shadow(1) } as const;

export default function SignIn() {
  const params = useLocalSearchParams<{ step?: string }>();
  const { setRole, role: current, signedIn, demoCamera, setDemoCamera } = useSession();
  const [step, setStep] = useState<'phone' | 'code' | 'how' | 'desk' | 'role'>(params.step === 'role' && signedIn ? 'role' : 'phone');
  const [apkSoon, setApkSoon] = useState(false);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const digits = phone.replace(/\D/g, '');

  const open = (r: Role) => {
    setRole(r);
    router.replace(`/${ROLE_TABS[r][0]}` as Href);
  };

  return (
    <Screen scroll>
      <Row>
        <IconButton label="Back" onPress={() => (step === 'code' ? setStep('phone') : step === 'how' ? setStep('code') : step === 'desk' ? setStep('how') : router.canGoBack() ? router.back() : router.replace('/'))}><BackIcon /></IconButton>
      </Row>

      {step === 'phone' && (
        <SquishIn style={{ gap: 14 }}>
          <H1>Your phone number</H1>
          <Sub>We send a 6-digit code. No passwords to remember in a busy kitchen.</Sub>
          <Row>
            <View style={[input, { justifyContent: 'center' }]}><Text style={{ fontFamily: font.bodyBold, fontSize: 20, color: color.ink }}>+91</Text></View>
            <TextInput accessibilityLabel="Phone number" keyboardType="phone-pad" autoFocus value={phone} onChangeText={setPhone} placeholder="98765 43210" placeholderTextColor={color.ink2} maxLength={14} style={[input, { flex: 1 }]} />
          </Row>
          <Button title="Send code" disabled={digits.length < 10} onPress={() => setStep('code')} />
          <Sub style={{ fontSize: 13, textAlign: 'center' }}>Demo: any 10-digit number works.</Sub>
        </SquishIn>
      )}

      {step === 'code' && (
        <SquishIn style={{ gap: 14 }}>
          <H1>Enter the code</H1>
          <Sub>Sent to +91 {phone}. Demo code: 246810.</Sub>
          <TextInput accessibilityLabel="6-digit code" keyboardType="number-pad" autoFocus value={code} onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))} placeholder="••••••" placeholderTextColor={color.ink2}
            style={[input, { textAlign: 'center', letterSpacing: 12, fontSize: 28 }]} />
          <Button title="Verify" disabled={code.length !== 6} onPress={() => setStep(onWeb ? 'how' : 'role')} />
        </SquishIn>
      )}

      {step === 'how' && (
        <SquishIn style={{ gap: 14 }}>
          <H1>How do you want to use Nomi?</H1>
          <Sub>Both run the same live models on the same restaurant.</Sub>
          <Card style={{ gap: 10 }}>
            <H2 style={{ fontSize: 19 }}>The Android app</H2>
            <Sub style={{ fontSize: 14 }}>Best in a kitchen: the phone or tablet camera, hold-to-talk and big buttons for wet hands.</Sub>
            <Button title="Download the APK" onPress={() => (apkReady ? Linking.openURL(APK_URL) : setApkSoon(true))} />
            {apkSoon && <Sub style={{ fontSize: 13, color: color.saffronInk }}>The download link is coming soon. You can use Nomi on the web until then.</Sub>}
            <Sub style={{ fontSize: 12 }}>After downloading, open the file and allow installs from your browser when Android asks.</Sub>
          </Card>
          <Card style={{ gap: 10 }}>
            <H2 style={{ fontSize: 19 }}>On the web</H2>
            <Sub style={{ fontSize: 14 }}>Nothing to install. Works in the browser on a phone or tablet.</Sub>
            <Button kind="white" title="Continue on the web" onPress={() => setStep(handheld() ? 'role' : 'desk')} />
          </Card>
        </SquishIn>
      )}

      {step === 'desk' && (
        <SquishIn style={{ gap: 14 }}>
          <H1>Nomi is made for a phone or tablet</H1>
          <Sub>It uses the camera to photograph plates, shelves and the menu, and you hold to talk. On a computer, open {WEB_URL.replace('https://', '')} on your phone instead, or carry on here with the demo camera, which plays the demo photos.</Sub>
          <Card soft style={{ backgroundColor: color.saffronSoft }}>
            <Text style={{ fontFamily: font.displayBold, fontSize: 22, color: color.ink }}>{WEB_URL.replace('https://', '')}</Text>
            <Sub style={{ fontSize: 13, color: color.saffronInk }}>Type this into your phone's browser.</Sub>
          </Card>
          <Button title="Continue here with the demo camera" onPress={() => { setDemoCamera(true); setStep('role'); }} />
          <Button kind="white" title="Continue here with this computer's camera" onPress={() => setStep('role')} />
        </SquishIn>
      )}

      {step === 'role' && (
        <SquishIn style={{ gap: 12 }}>
          <View>
            <Sub style={{ fontSize: 14 }}>Saffron House · Bengaluru</Sub>
            <H1>Open Nomi as</H1>
          </View>
          {(Object.keys(ROLE_TABS) as Role[]).map((r, i) => (
            <SquishIn key={r} index={i}>
              <Squishy accessibilityRole="button" accessibilityLabel={`${ROLE_LABEL[r]}: ${ROLE_BLURB[r]}`} accessibilityState={{ selected: signedIn && r === current }} onPress={() => open(r)}
                style={{ backgroundColor: ROLE_BG[r], borderRadius: 24, padding: 16, flexDirection: 'row', gap: 14, alignItems: 'center', borderWidth: 3, borderColor: signedIn && r === current ? color.ink : 'transparent', ...shadow(1) }}>
                <View style={{ width: 48, height: 48, borderRadius: 18, backgroundColor: color.ink, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontFamily: font.displayBold, fontSize: 16, color: color.saffron }}>{ROLE_PERSON[r].initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <H2 style={{ fontSize: 18 }}>{ROLE_LABEL[r]} <Text style={{ fontFamily: font.body, fontSize: 14, color: color.ink2 }}>· {ROLE_PERSON[r].name}</Text></H2>
                  <Sub style={{ fontSize: 13 }}>{ROLE_BLURB[r]}</Sub>
                </View>
              </Squishy>
            </SquishIn>
          ))}
          <Card soft style={{ backgroundColor: color.saffronSoft }}>
            <Sub style={{ fontSize: 13, color: color.saffronInk }}>In a real restaurant your roles come from the team invite. The demo lets you try each one.</Sub>
          </Card>
          <Squishy accessibilityRole="switch" accessibilityState={{ checked: demoCamera }} onPress={() => setDemoCamera(!demoCamera)}
            style={{ backgroundColor: color.card, borderRadius: 22, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, ...shadow(1) }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: font.bodyBold, fontSize: 15, color: color.ink }}>Demo camera</Text>
              <Sub style={{ fontSize: 13 }}>The camera plays the demo dish, shelf and kitchen photos, so you can run every flow without a real plate.</Sub>
            </View>
            <View style={{ width: 52, height: 30, borderRadius: 15, padding: 3, backgroundColor: demoCamera ? color.mint : color.saffronSoft, alignItems: demoCamera ? 'flex-end' : 'flex-start' }}>
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: color.card, ...shadow(1) }} />
            </View>
          </Squishy>
          <Squishy accessibilityRole="button" onPress={() => router.push('/models')}
            style={{ backgroundColor: color.ink, borderRadius: 22, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, ...shadow(1) }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: font.bodyBold, fontSize: 15, color: color.saffron }}>Under the hood</Text>
              <Sub style={{ fontSize: 13, color: color.saffronSoft }}>The six Meta models inside Nomi, where to try each one, and every live call this phone makes.</Sub>
            </View>
            <Text style={{ fontFamily: font.bodyBold, fontSize: 22, color: color.saffron }}>›</Text>
          </Squishy>
        </SquishIn>
      )}
    </Screen>
  );
}
