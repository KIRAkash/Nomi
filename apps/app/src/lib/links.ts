// Where a table QR points. On the web it is the host the app is served from, so a QR shown on a laptop opens the live
// guest page on a phone; the Android app uses EXPO_PUBLIC_SITE_URL when set.
import { Platform } from 'react-native';

const SITE =
  process.env.EXPO_PUBLIC_SITE_URL ??
  (Platform.OS === 'web' && typeof location !== 'undefined' ? location.origin : 'https://nomi.app');

export const guestUrl = (token: string) => `${SITE}/t/${token}`;
