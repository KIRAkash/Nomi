// Clay Tiffin: Soft Clay shapes and motion with Pop Tiffin colours. Mirrors design/clay-tiffin.css.
import { Platform, type ViewStyle } from 'react-native';

export const color = {
  bg: '#FFF4D6',
  card: '#FFFFFF',
  ink: '#1B1B3A',
  ink2: '#4A4A6A',
  saffron: '#FFB627',
  saffronSoft: '#FFE7B0',
  saffronInk: '#6E4A00',
  tomato: '#D93A2E',
  tomatoSoft: '#FDE2DF',
  tomatoInk: '#8F1D1D',
  mint: '#3BB273',
  mintSoft: '#DDF5E6',
  mintInk: '#14532D',
  sky: '#4D9DE0',
  skySoft: '#DDEEFB',
  skyInk: '#1D4E7A',
  pink: '#FF7AB6',
  pinkSoft: '#FFE1EF',
  photo: '#5A4632',
} as const;

export const radius = { card: 26, button: 24, chip: 16, small: 16 } as const;
export const space = { xs: 6, s: 10, m: 14, l: 20, xl: 28 } as const;

// Font family names are the @expo-google-fonts export names, loaded in the app's root layout.
export const font = {
  display: 'Fredoka_600SemiBold',
  displayBold: 'Fredoka_700Bold',
  body: 'Nunito_400Regular',
  bodySemi: 'Nunito_600SemiBold',
  bodyBold: 'Nunito_800ExtraBold',
} as const;

export const type = {
  h1: { fontFamily: font.display, fontSize: 28, lineHeight: 31, color: color.ink },
  h2: { fontFamily: font.display, fontSize: 20, lineHeight: 23, color: color.ink },
  body: { fontFamily: font.body, fontSize: 15, lineHeight: 21, color: color.ink },
  sub: { fontFamily: font.body, fontSize: 15, lineHeight: 21, color: color.ink2 },
  label: { fontFamily: font.bodyBold, fontSize: 12, letterSpacing: 1.1, textTransform: 'uppercase' as const, color: color.ink2 },
  num: { fontFamily: font.displayBold, color: color.ink },
} as const;

// Soft ink-tinted shadow; Android uses elevation, web and iOS use the shadow props.
export const shadow = (level: 1 | 2 = 1): ViewStyle =>
  Platform.select<ViewStyle>({
    android: { elevation: level === 1 ? 4 : 8, shadowColor: color.ink },
    default: { shadowColor: color.ink, shadowOpacity: level === 1 ? 0.1 : 0.18, shadowRadius: level === 1 ? 14 : 22, shadowOffset: { width: 0, height: level === 1 ? 10 : 14 } },
  })!;

export type Tone = 'saffron' | 'tomato' | 'mint' | 'sky' | 'pink' | 'ink' | 'white';
export const tone: Record<Tone, { bg: string; fg: string; solid: string }> = {
  saffron: { bg: color.saffronSoft, fg: color.saffronInk, solid: color.saffron },
  tomato: { bg: color.tomatoSoft, fg: color.tomatoInk, solid: color.tomato },
  mint: { bg: color.mintSoft, fg: color.mintInk, solid: color.mint },
  sky: { bg: color.skySoft, fg: color.skyInk, solid: color.sky },
  pink: { bg: color.pinkSoft, fg: '#7A1F4C', solid: color.pink },
  ink: { bg: color.ink, fg: color.bg, solid: color.ink },
  white: { bg: color.card, fg: color.ink, solid: color.card },
};
