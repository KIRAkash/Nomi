import { DishArt, guessIcon } from '@nomi/ui';
import { Image } from 'expo-image';

/** The dish's generated icon when it has one, the house-style placeholder until then. */
export function DishIcon({ name, url, size = 76 }: { name: string; url: string | null; size?: number }) {
  if (url) return <Image source={url} style={{ width: size, height: size }} contentFit="contain" accessibilityIgnoresInvertColors />;
  return <DishArt kind={guessIcon(name)} size={size} />;
}
