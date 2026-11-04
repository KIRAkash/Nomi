// Where a table QR points. On the web it is the host the app is served from, so a QR shown on a laptop opens the live
// guest page on a phone; the Android app uses EXPO_PUBLIC_SITE_URL when set.
import { Platform } from 'react-native';

const SITE =
  process.env.EXPO_PUBLIC_SITE_URL ??
  (Platform.OS === 'web' && typeof location !== 'undefined' ? location.origin : 'https://nomi.app');

export const guestUrl = (token: string) => `${SITE}/t/${token}`;

// The public links people are given. The APK's short link isn't made yet: APK_URL is a placeholder until it is, and the
// sign-in screen says the download is coming instead of opening it.
export const WEB_URL = 'https://bit.ly/try-nomi';
export const APK_URL = '#apk-link-coming-soon';
export const apkReady = !APK_URL.startsWith('#');
