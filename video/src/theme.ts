// The film's look: ink type on a light-yellow paper stage with fine grain, saffron for the one word that matters, and the
// app's own Clay Tiffin colours for anything that comes from Nomi.
import { loadFont as loadFredoka } from '@remotion/google-fonts/Fredoka';
import { loadFont as loadInterTight } from '@remotion/google-fonts/InterTight';

export const FPS = 30;
export const W = 1920;
export const H = 1080;

export const c = {
  paper: '#FFFBEF',
  text: '#1B1B3A',
  sub: 'rgba(27,27,58,0.62)',
  line: 'rgba(27,27,58,0.2)',
  white: '#FFFFFF',
  night: '#08080F',
  ink: '#1B1B3A',
  saffron: '#D98E00',
  tomato: '#D93A2E',
  mint: '#2E9A5F',
  sky: '#3F8FD6',
  pink: '#E8559A',
};
/** A soft warm shadow for anything that sits on the paper. */
export const shadow = (y: number, blur: number, a = 0.22) => `0 ${y}px ${blur}px rgba(70,50,10,${a})`;

export const display = loadInterTight('normal', { weights: ['500', '700', '800'], subsets: ['latin'] }).fontFamily;
export const brand = loadFredoka('normal', { weights: ['600'], subsets: ['latin'] }).fontFamily;

/** Type scale. Headlines are never smaller than `title`; nothing on screen is smaller than `label`. */
export const type = {
  hero: 168,
  headline: 120,
  title: 84,
  line: 52,
  label: 34,
};

export const sec = (s: number) => Math.round(s * FPS);
