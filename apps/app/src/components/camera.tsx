// The live camera: a viewfinder inside the screen (Android and web), never a file picker. It asks for access in place,
// explains what it is for, and freezes on the shot it took so the person can see exactly what Nomi will look at.
// With the demo camera on (sign-in, role picker), it plays the generated demo photos instead, for mock runs.
import { Button, H2, Sub, color, font, shadow } from '@nomi/ui';
import { Asset } from 'expo-asset';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { useIsFocused } from 'expo-router';
import { useCallback, useEffect, useImperativeHandle, useRef, useState, useSyncExternalStore, type ReactNode, type Ref } from 'react';
import { ActivityIndicator, Linking, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Rect } from 'react-native-svg';

import { DEMO_SHOTS } from '@/lib/demo-media';
import { useSession } from '@/lib/session';

/** `demo` is the demo photo's key (e.g. "chicken-biryani/pass-good") when it came from the demo camera. */
export type Photo = { uri: string; dataUrl: string; width: number; height: number; demo?: string };
export type CameraHandle = { snap: () => Promise<Photo | null> };
type Guide = 'plate' | 'counter' | 'shelf' | 'menu' | 'none';

/** Framing marks drawn over the live view, so the shot is lined up the same way every time. */
function GuideMarks({ guide, tint }: { guide: Guide; tint: string }) {
  if (guide === 'none') return null;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width="100%" height="100%" viewBox="0 0 300 300" preserveAspectRatio="xMidYMid meet">
        {guide === 'plate' && <Circle cx={150} cy={150} r={112} fill="none" stroke={tint} strokeWidth={3} strokeDasharray="10 8" />}
        {guide === 'counter' && (
          <>
            <Rect x={18} y={34} width={264} height={232} rx={22} fill="none" stroke={tint} strokeWidth={3} strokeDasharray="10 8" />
            <Circle cx={150} cy={150} r={86} fill="none" stroke="rgba(255,244,214,0.5)" strokeWidth={2.5} />
          </>
        )}
        {guide === 'shelf' && <Rect x={14} y={40} width={272} height={220} rx={14} fill="none" stroke={tint} strokeWidth={3} strokeDasharray="10 8" />}
        {guide === 'menu' && <Rect x={52} y={14} width={196} height={272} rx={10} fill="none" stroke={tint} strokeWidth={3} strokeDasharray="10 8" />}
      </Svg>
    </View>
  );
}

/** The camera preview itself. Remounts fresh each time it appears, so "ready" can never be stale. */
function Viewfinder({ cam, guide, tint, onReady, onError }: {
  cam: Ref<CameraView>; guide: Guide; tint: string; onReady: (ready: boolean) => void; onError: (message: string) => void;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => () => onReady(false), [onReady]);
  return (
    <>
      <CameraView ref={cam} facing="back" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        onCameraReady={() => { setReady(true); onReady(true); }}
        onMountError={(e) => onError(e.message || 'The camera could not start. Close other apps using it and try again.')} />
      {ready ? <GuideMarks guide={guide} tint={tint} /> : <ActivityIndicator color={color.saffronSoft} style={{ position: 'absolute' }} />}
    </>
  );
}

const subscribe = () => () => {};

async function toDataUrl(uri: string) {
  const blob = await (await fetch(uri)).blob();
  return new Promise<string>((ok, fail) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result));
    r.onerror = () => fail(r.error);
    r.readAsDataURL(blob);
  });
}

/** Loads a demo photo the way the camera would hand over a real one. */
export async function demoPhoto(key: string): Promise<Photo> {
  const asset = Asset.fromModule(DEMO_SHOTS[key].image);
  await asset.downloadAsync();
  const uri = asset.localUri ?? asset.uri;
  return { uri, dataUrl: await toDataUrl(uri), width: asset.width ?? 1280, height: asset.height ?? 853, demo: key };
}

/** The demo camera: a gently drifting demo photo with a filmstrip to pick which one is "in front of the lens". */
function DemoFeed({ keys, current, onPick, guide, tint, onReady }: {
  keys: string[]; current: string; onPick: (k: string) => void; guide: Guide; tint: string; onReady: (ready: boolean) => void;
}) {
  const drift = useSharedValue(0);
  useEffect(() => {
    drift.value = withRepeat(withTiming(1, { duration: 2600 }), -1, true);
    onReady(true);
    return () => onReady(false);
  }, [drift, onReady]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: 1.02 + drift.value * 0.015 }, { translateX: (drift.value - 0.5) * 4 }] }));
  return (
    <>
      <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, style]}>
        <Image source={DEMO_SHOTS[current].image} style={{ width: '100%', height: '100%' }} contentFit="cover" accessibilityLabel={`Demo camera: ${DEMO_SHOTS[current].shows}`} />
      </Animated.View>
      <GuideMarks guide={guide} tint={tint} />
      <View style={{ position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(27,27,58,0.8)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 }}>
        <Text style={{ fontFamily: font.bodyBold, fontSize: 12, color: color.saffron }}>Demo camera</Text>
      </View>
      {keys.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ position: 'absolute', left: 0, right: 0, bottom: 10 }} contentContainerStyle={{ gap: 6, paddingHorizontal: 10 }}>
          {keys.map((k) => (
            <Pressable key={k} accessibilityRole="button" accessibilityLabel={`Show ${DEMO_SHOTS[k].shows}`} accessibilityState={{ selected: k === current }} onPress={() => onPick(k)}
              style={{ width: 48, height: 48, borderRadius: 12, overflow: 'hidden', borderWidth: 3, borderColor: k === current ? color.saffron : 'rgba(255,244,214,0.6)' }}>
              <Image source={DEMO_SHOTS[k].image} style={{ width: '100%', height: '100%' }} contentFit="cover" />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </>
  );
}

/** Live view with framing marks. Call `ref.current.snap()` to take a shot; pass `still` to freeze on a photo already taken. */
export function LiveCamera({ ref, height = 300, guide = 'plate', still, tint = color.saffron, children, onReady, demo = [] }: {
  ref?: Ref<CameraHandle>; height?: number | '100%'; guide?: Guide; still?: string | null; tint?: string; children?: ReactNode; onReady?: (ready: boolean) => void;
  /** Demo photo keys this camera may play when the demo camera is on, most likely first. */
  demo?: string[];
}) {
  const { demoCamera, setDemoCamera } = useSession();
  const feed = demo.filter((k) => DEMO_SHOTS[k]);
  const [pick, setPick] = useState<string | null>(null);
  const current = pick && feed.includes(pick) ? pick : feed[0];
  const playing = demoCamera && !!current;
  const [perm, ask] = useCameraPermissions();
  const focused = useIsFocused();
  const cam = useRef<CameraView>(null);
  const ready = useRef(false);
  // The server render has no camera; the viewfinder mounts on the client only.
  const client = useSyncExternalStore(subscribe, () => true, () => false);
  const [noCamera, setNoCamera] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const [refused, setRefused] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') CameraView.isAvailableAsync().then((ok) => setNoCamera(!ok)).catch(() => setNoCamera(true));
  }, []);

  const changed = useCallback((r: boolean) => { ready.current = r; onReady?.(r); }, [onReady]);

  useImperativeHandle(ref, () => ({
    snap: async () => {
      if (playing) return ready.current ? demoPhoto(current) : null;
      if (!cam.current || !ready.current) return null;
      const p = await cam.current.takePictureAsync({ quality: 0.7, base64: true, shutterSound: false });
      if (!p) return null;
      const dataUrl = p.uri.startsWith('data:') ? p.uri : `data:image/jpeg;base64,${p.base64}`;
      return { uri: p.uri, dataUrl, width: p.width, height: p.height };
    },
  }), [playing, current]);

  const demoButton = feed.length > 0 && <Button small kind="white" title="Use demo photos" onPress={() => setDemoCamera(true)} />;
  let body: ReactNode;
  if (still) body = <Image source={still} style={{ width: '100%', height: '100%' }} contentFit="cover" accessibilityLabel="The photo just taken" />;
  else if (playing) body = focused ? <DemoFeed keys={feed} current={current} onPick={setPick} guide={guide} tint={tint} onReady={changed} /> : null;
  else if (demoCamera && client) body = (
    <View style={{ alignItems: 'center', gap: 10, padding: 20, maxWidth: 320 }}>
      <H2 style={{ color: color.bg, textAlign: 'center' }}>No demo photos here yet</H2>
      <Sub style={{ color: color.saffronSoft, textAlign: 'center', fontSize: 14 }}>Generate them from docs/demo-images.md, or use the real camera.</Sub>
      <Button small kind="saffron" title="Use the real camera" onPress={() => setDemoCamera(false)} />
    </View>
  );
  else if (!client || !perm) body = <ActivityIndicator color={color.saffronSoft} />;
  else if (noCamera || failed) body = (
    <View style={{ alignItems: 'center', gap: 6, padding: 20 }}>
      <H2 style={{ color: color.bg, textAlign: 'center' }}>No camera found</H2>
      <Sub style={{ color: color.saffronSoft, textAlign: 'center', fontSize: 14 }}>{failed ?? 'Open Nomi on a phone or tablet with a camera.'}</Sub>
      {demoButton}
    </View>
  );
  else if (!perm.granted) body = (
    <View style={{ alignItems: 'center', gap: 10, padding: 20, maxWidth: 320 }}>
      <H2 style={{ color: color.bg, textAlign: 'center' }}>Nomi needs the camera</H2>
      <Sub style={{ color: color.saffronSoft, textAlign: 'center', fontSize: 14 }}>
        {refused ? 'The camera was not allowed. Allow it in the browser’s address bar or your phone settings, then try again.' : perm.canAskAgain ? 'Only for this photo. Nothing is recorded until you press the button.' : 'Camera access is turned off. Turn it on for Nomi in your settings.'}
      </Sub>
      {perm.canAskAgain
        ? <Button small kind="saffron" title="Allow camera" onPress={async () => { const r = await ask(); if (!r.granted) setRefused(true); }} />
        : Platform.OS !== 'web' && <Button small kind="saffron" title="Open settings" onPress={() => Linking.openSettings()} />}
      {demoButton}
    </View>
  );
  else if (focused) body = <Viewfinder cam={cam} guide={guide} tint={tint} onReady={changed} onError={setFailed} />;

  return (
    <View style={{ height, borderRadius: 26, overflow: 'hidden', backgroundColor: '#2A2440', alignItems: 'center', justifyContent: 'center' }}>
      {body}
      {children}
    </View>
  );
}

/** Round shutter button with its label underneath; disabled until the viewfinder is live. */
export function Shutter({ onPress, disabled, label = 'Take the photo', dark = false }: { onPress: () => void; disabled?: boolean; label?: string; dark?: boolean }) {
  return (
    <View style={{ alignItems: 'center', gap: 6 }}>
      <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
        style={({ pressed }) => ({ width: 76, height: 76, borderRadius: 38, padding: 5, borderWidth: 4, borderColor: dark ? color.bg : color.ink, opacity: disabled ? 0.35 : 1, transform: [{ scale: pressed ? 0.92 : 1 }] })}>
        <View style={{ flex: 1, borderRadius: 30, backgroundColor: color.saffron, ...shadow(1) }} />
      </Pressable>
      <Text style={{ fontFamily: font.bodyBold, fontSize: 13, color: dark ? color.saffronSoft : color.ink }}>{label}</Text>
    </View>
  );
}

/** Full-screen camera for one shot (a shelf, a menu page, a closing spot). Returns the photo to `onShot`. */
export function CameraSheet({ open, title, hint, guide = 'none', onShot, onClose, demo }: {
  open: boolean; title: string; hint?: string; guide?: Guide; onShot: (p: Photo) => void; onClose: () => void; demo?: string[];
}) {
  const cam = useRef<CameraHandle>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const shoot = async () => {
    setBusy(true);
    try {
      const p = await cam.current?.snap();
      if (p) onShot(p);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: color.ink, padding: 16, paddingTop: 28, gap: 14 }}>
        <View style={{ width: '100%', maxWidth: 640, alignSelf: 'center', gap: 4 }}>
          <H2 style={{ color: color.bg }}>{title}</H2>
          {hint ? <Text style={{ fontFamily: font.bodySemi, fontSize: 14, color: color.saffronSoft }}>{hint}</Text> : null}
        </View>
        <View style={{ flex: 1, width: '100%', maxWidth: 640, alignSelf: 'center' }}>
          {open && <LiveCamera ref={cam} guide={guide} height="100%" onReady={setReady} demo={demo} />}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 640, alignSelf: 'center' }}>
          <Button small kind="white" title="Cancel" onPress={onClose} />
          <Shutter dark onPress={shoot} disabled={!ready || busy} label="Take it" />
          <View style={{ width: 92 }} />
        </View>
      </View>
    </Modal>
  );
}

export type PhotoCheck = { measured: boolean; sharp: boolean; light: 'ok' | 'dark' | 'glare' };

/**
 * A real check of the shot before it is used: brightness and a Laplacian blur measure on a small copy of the image.
 * Runs in the browser; on Android the vision worker runs the same check, so the app reports it as not yet measured.
 */
export async function checkPhoto(p: Photo): Promise<PhotoCheck> {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return { measured: false, sharp: true, light: 'ok' };
  const img = new window.Image();
  img.src = p.dataUrl;
  await img.decode();
  const N = 128;
  const c = document.createElement('canvas');
  c.width = N;
  c.height = N;
  const g = c.getContext('2d', { willReadFrequently: true });
  if (!g) return { measured: false, sharp: true, light: 'ok' };
  g.drawImage(img, 0, 0, N, N);
  const d = g.getImageData(0, 0, N, N).data;
  const y = new Float32Array(N * N);
  let sum = 0;
  let blown = 0;
  for (let i = 0; i < N * N; i++) {
    y[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
    sum += y[i];
    if (y[i] > 250) blown++;
  }
  const mean = sum / (N * N);
  let lap = 0;
  let lap2 = 0;
  let n = 0;
  for (let r = 1; r < N - 1; r++) for (let k = 1; k < N - 1; k++) {
    const i = r * N + k;
    const v = 4 * y[i] - y[i - 1] - y[i + 1] - y[i - N] - y[i + N];
    lap += v;
    lap2 += v * v;
    n++;
  }
  const variance = lap2 / n - (lap / n) ** 2;
  const light = mean < 50 ? 'dark' : blown / (N * N) > 0.12 ? 'glare' : 'ok';
  // A dark frame has little detail anyway, so blur is only judged once the light is right.
  return { measured: true, sharp: light === 'dark' || variance > 18, light };
}
