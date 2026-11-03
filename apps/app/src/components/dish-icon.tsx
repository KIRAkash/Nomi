import { DishArt, guessIcon } from '@nomi/ui';
import { Image } from 'expo-image';

import { DISH_ICONS } from '@/lib/demo-media';

/** The dish's icon, drawn by Muse Image from its Golden Plate photo; the house-style placeholder until it has one. */
export function DishIcon({ name, url, size = 76 }: { name: string; url: string | null; size?: number }) {
  const icon = url ?? DISH_ICONS[name];
  if (icon) return <Image source={icon} style={{ width: size, height: size, borderRadius: size * 0.28 }} contentFit="cover" accessibilityLabel={`${name}, icon drawn by Muse Image`} />;
  return <DishArt kind={guessIcon(name)} size={size} />;
}
