// The drawn Chicken Biryani from the landing page (apps/site/src/art.ts), so the film and the site show the same plate.
// Every part SAM 3.1 finds is its own layer on one 1000-unit grid: the plate centred at (500, 500), 440 across the rim's
// radius, the raita bowl off the plate at the bottom left. The film shows them as PNGs rendered by scripts/drawn.ts:
// decoding the SVGs on every frame made Chrome drop or garble frames.
import type { CSSProperties } from 'react';
import { Img, staticFile } from 'remotion';

import { DRIFTS, GOLDEN, type PlateSpec } from '../../../apps/site/src/art';

export { AT, DRIFTS, GOLDEN, PARTS, type Part, type PlateSpec } from '../../../apps/site/src/art';

export const GRID = { cx: 500, cy: 500, r: 440 };

/** The rendered file for a plate: the chef's own, or one of the four drifted copies. */
function file(spec: PlateSpec, raita: boolean) {
  if (raita) return 'drawn/golden-raita.png';
  const i = DRIFTS.findIndex((d) => JSON.stringify(d) === JSON.stringify(spec));
  return i < 0 || JSON.stringify(spec) === JSON.stringify(GOLDEN) ? 'drawn/golden.png' : `drawn/drift-${i + 1}.png`;
}

/** One layer of the break-apart, on the full grid. */
export const layerFile = (layer: 'plate' | 'rice' | 'chicken' | 'onions' | 'lemon' | 'raita') => staticFile(`drawn/layer-${layer}.png`);

/**
 * The drawn dish placed so the plate's centre sits at (x, y) and the plate is `d` px across. `raita` keeps the bowl beside
 * it (the full grid); without it only the plate is drawn.
 */
export function DrawnPlate({ spec, raita = false, x, y, d, rot = 0, style }: {
  spec: PlateSpec; raita?: boolean; x: number; y: number; d: number; rot?: number; style?: CSSProperties;
}) {
  const k = d / (2 * GRID.r);
  const box = raita ? { from: 0, size: 1000 } : { from: 50, size: 900 };
  const side = box.size * k;
  return (
    <Img src={staticFile(file(spec, raita))} style={{
      position: 'absolute', width: side, height: side, left: x - (GRID.cx - box.from) * k, top: y - (GRID.cy - box.from) * k,
      transformOrigin: `${(GRID.cx - box.from) * k}px ${(GRID.cy - box.from) * k}px`, transform: `rotate(${rot}deg)`, ...style,
    }} />
  );
}
