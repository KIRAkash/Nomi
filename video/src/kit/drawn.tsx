// The drawn Chicken Biryani from the landing page (apps/site/src/art.ts), so the film and the site show the same plate.
// Every part SAM 3.1 finds is its own layer on one 1000-unit grid: the plate centred at (500, 500), 440 across the rim's
// radius, the raita bowl off the plate at the bottom left.
import type { CSSProperties } from 'react';
import { Img } from 'remotion';

import { dishUrl, type PlateSpec } from '../../../apps/site/src/art';

export { AT, DRIFTS, GOLDEN, PARTS, dishUrl, layerUrl, type Part, type PlateSpec } from '../../../apps/site/src/art';

export const GRID = { cx: 500, cy: 500, r: 440 };

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
    <Img src={dishUrl({ ...spec, raita }, raita ? 'full' : 'plate')} style={{
      position: 'absolute', width: side, height: side, left: x - (GRID.cx - box.from) * k, top: y - (GRID.cy - box.from) * k,
      transformOrigin: `${(GRID.cx - box.from) * k}px ${(GRID.cy - box.from) * k}px`, transform: `rotate(${rot}deg)`, ...style,
    }} />
  );
}
