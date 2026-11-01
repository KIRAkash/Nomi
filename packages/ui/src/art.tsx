// Drawn art: rating faces and the placeholder dish icons used until Muse Image generates each dish's own icon.
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

import { color } from './tokens';

const INK = color.ink;

export const FACE_MOUTHS = [
  'M12 29 Q20 20 28 29',
  'M13 28 Q20 24 27 28',
  'M13 26 L27 26',
  'M13 24 Q20 30 27 24',
  'M11 23 Q20 34 29 23',
] as const;
export const FACE_LABELS = ['Awful', 'Not great', 'Okay', 'Good', 'Loved it!'] as const;
export const FACE_FILLS = [color.tomatoSoft, '#FFD9B8', color.saffronSoft, color.mintSoft, color.saffron] as const;

export function Face({ level, size = 38 }: { level: 0 | 1 | 2 | 3 | 4 | null; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Ellipse cx={14} cy={16} rx={2.3} ry={2.9} fill={INK} />
      <Ellipse cx={26} cy={16} rx={2.3} ry={2.9} fill={INK} />
      <Path d={level === null ? 'M14 25 Q20 27 26 25' : FACE_MOUTHS[level]} fill="none" stroke={INK} strokeWidth={2.8} strokeLinecap="round" />
    </Svg>
  );
}

export type IconKey = 'biryani' | 'paneer' | 'dal' | 'curry' | 'naan' | 'dessert' | 'plate';

/** Placeholder icon in the locked house style; a dish with a generated icon_url shows that image instead. */
export function DishArt({ kind, size = 76 }: { kind: IconKey; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Circle cx={60} cy={62} r={50} fill="#FFFFFF" stroke={INK} strokeWidth={5} />
      {kind === 'biryani' && (
        <>
          <Path d="M28 66 C30 38 90 38 92 66 C90 82 30 82 28 66Z" fill="#FFE7B0" stroke={INK} strokeWidth={4} />
          <Ellipse cx={50} cy={58} rx={9} ry={6} fill="#C96A2B" stroke={INK} strokeWidth={3} />
          <Ellipse cx={70} cy={62} rx={9} ry={6} fill="#C96A2B" stroke={INK} strokeWidth={3} />
          <Path d="M76 40 q4-5 8 0 M82 46 q4-5 8 0" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
          <Path d="M22 44 A16 16 0 0 1 46 26 L36 40Z" fill={color.saffron} stroke={INK} strokeWidth={3} />
        </>
      )}
      {kind === 'paneer' && (
        <>
          <Path d="M24 86 L96 38" stroke={INK} strokeWidth={4} strokeLinecap="round" />
          <Rect x={30} y={64} width={20} height={20} rx={5} fill="#F4A259" stroke={INK} strokeWidth={3.5} />
          <Rect x={50} y={51} width={20} height={20} rx={5} fill="#E8742A" stroke={INK} strokeWidth={3.5} />
          <Rect x={70} y={38} width={20} height={20} rx={5} fill="#F4A259" stroke={INK} strokeWidth={3.5} />
          <Circle cx={84} cy={82} r={9} fill={color.mint} stroke={INK} strokeWidth={3} />
        </>
      )}
      {kind === 'dal' && (
        <>
          <Circle cx={60} cy={62} r={32} fill="#8B3A1A" stroke={INK} strokeWidth={4} />
          <Path d="M46 58 q14-12 28 0 q-10 10-20 4" fill="none" stroke={color.bg} strokeWidth={4} strokeLinecap="round" />
        </>
      )}
      {kind === 'curry' && (
        <>
          <Circle cx={60} cy={62} r={32} fill="#E8742A" stroke={INK} strokeWidth={4} />
          <Ellipse cx={50} cy={58} rx={8} ry={6} fill="#F8C27A" stroke={INK} strokeWidth={3} />
          <Ellipse cx={70} cy={66} rx={8} ry={6} fill="#F8C27A" stroke={INK} strokeWidth={3} />
          <Path d="M48 74 q12 6 24 -2" fill="none" stroke={color.bg} strokeWidth={4} strokeLinecap="round" />
        </>
      )}
      {kind === 'naan' && (
        <>
          <Path d="M26 66 C26 44 94 40 96 62 C98 82 30 88 26 66Z" fill="#F3D9A4" stroke={INK} strokeWidth={4} />
          <Circle cx={48} cy={60} r={4} fill="#C98B3E" />
          <Circle cx={70} cy={56} r={4} fill="#C98B3E" />
          <Circle cx={62} cy={72} r={4} fill="#C98B3E" />
        </>
      )}
      {kind === 'dessert' && (
        <>
          <Circle cx={60} cy={64} r={30} fill={color.bg} stroke={INK} strokeWidth={4} />
          <Circle cx={50} cy={64} r={11} fill="#7A2E12" stroke={INK} strokeWidth={3} />
          <Circle cx={72} cy={62} r={11} fill="#7A2E12" stroke={INK} strokeWidth={3} />
          <Circle cx={47} cy={60} r={3} fill="#FFFFFF" />
          <Circle cx={69} cy={58} r={3} fill="#FFFFFF" />
        </>
      )}
    </Svg>
  );
}

/** Picks a placeholder drawing from the dish name until the generated icon exists. */
export function guessIcon(name: string): IconKey {
  const n = name.toLowerCase();
  if (/biryani|pulao|rice/.test(n)) return 'biryani';
  if (/tikka|kebab|paneer/.test(n)) return 'paneer';
  if (/dal|daal/.test(n)) return 'dal';
  if (/naan|roti|paratha|kulcha/.test(n)) return 'naan';
  if (/jamun|kheer|halwa|kulfi|dessert/.test(n)) return 'dessert';
  if (/chicken|masala|curry|korma|butter/.test(n)) return 'curry';
  return 'plate';
}
