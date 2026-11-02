// Looks up the generated demo photos (docs/demo-images.md) and the SAM 3.1 run saved with each one.
import { DEMO_SHOTS, DISH_PARTS, type DemoPart } from './demo-media';
import { COMPONENTS } from './mock';

export const slug = (dish: string) => dish.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const shot = (key: string | null | undefined) => (key ? DEMO_SHOTS[key] ?? null : null);
/** The dish's Golden Plate photo, if it has been generated. */
export const goldenShot = (dish: string) => shot(`${slug(dish)}/golden-1`);
/** Demo photo keys under a folder, e.g. "chicken-biryani/pass-". */
export const shotsUnder = (...prefixes: string[]) => Object.keys(DEMO_SHOTS).filter((k) => prefixes.some((p) => k.startsWith(p)));

/** The parts SAM looks for on a dish: from the demo doc when it lists the dish, else the biryani set. */
export function partsFor(dish: string): DemoPart[] {
  return DISH_PARTS[dish] ?? COMPONENTS.map((c) => ({ name: c.name, prompt: c.prompt, colour: c.colour, role: c.role }));
}
export const rolesFor = (dish: string) => Object.fromEntries(partsFor(dish).map((p) => [p.name, p.role]));
