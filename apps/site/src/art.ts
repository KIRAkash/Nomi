// The drawn Chicken Biryani: every part SAM 3.1 finds on the real plate (rice, chicken, fried onions, lemon, raita) is its
// own layer, drawn from a seeded random source so the same plate comes out the same on every load. Layers share one
// 1000×1000 grid with the plate centred, so stacking them rebuilds the dish and lifting them apart explains it.

export type Part = 'rice' | 'chicken' | 'onions' | 'lemon' | 'raita';

export const PARTS: { id: Part; name: string; colour: string; count: number }[] = [
  { id: 'rice', name: 'Rice', colour: '#3F8FD6', count: 1 },
  { id: 'chicken', name: 'Chicken', colour: '#D93A2E', count: 4 },
  { id: 'onions', name: 'Fried onions', colour: '#D98E00', count: 1 },
  { id: 'lemon', name: 'Lemon', colour: '#E8559A', count: 1 },
  { id: 'raita', name: 'Raita', colour: '#2E9A5F', count: 1 },
];

/** Where each part sits on the grid; labels and nudges point here. */
export const AT: Record<Part, [number, number]> = {
  rice: [470, 560], chicken: [500, 470], onions: [640, 245], lemon: [770, 735], raita: [128, 872],
};

type Rng = () => number;
function rng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const f1 = (n: number) => n.toFixed(1);
const pick = <T,>(r: Rng, xs: T[]) => xs[Math.floor(r() * xs.length)];

/** A closed smooth path through points (Catmull-Rom as cubic Béziers). */
function smooth(pts: [number, number][]): string {
  const n = pts.length;
  let d = `M${f1(pts[0][0])} ${f1(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f1(c1[0])} ${f1(c1[1])} ${f1(c2[0])} ${f1(c2[1])} ${f1(p2[0])} ${f1(p2[1])}`;
  }
  return d + 'Z';
}

/** A wobbly ring of points around (cx, cy). */
function blob(r: Rng, cx: number, cy: number, rx: number, ry: number, wobble: number, n = 14, rot = 0, taper = 0): [number, number][] {
  const phase = r() * Math.PI * 2;
  return Array.from({ length: n }, (_, i) => {
    const t = (i / n) * Math.PI * 2;
    const k = 1 + wobble * (Math.sin(t * 3 + phase) * 0.6 + (r() - 0.5) * 0.8);
    // taper narrows the shape toward t = π, which turns an oval into a drumstick
    const y = Math.sin(t) * ry * k * (1 - taper * (1 - (1 + Math.cos(t)) / 2));
    const x = Math.cos(t) * rx * k;
    const c = Math.cos(rot), s = Math.sin(rot);
    return [cx + x * c - y * s, cy + x * s + y * c];
  });
}

const RICE_C: [number, number] = [488, 512];
const riceEdge = blob(rng(7), RICE_C[0], RICE_C[1], 272, 262, 0.07, 22);

// ---------------------------------------------------------------- layers

const DEFS = `
<radialGradient id="pl" cx="46%" cy="42%" r="60%"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".72" stop-color="#FBF8F2"/><stop offset="1" stop-color="#EDE6D8"/></radialGradient>
<radialGradient id="well" cx="50%" cy="50%" r="50%"><stop offset=".86" stop-color="#FFFFFF" stop-opacity="0"/><stop offset="1" stop-color="#E6DDCB" stop-opacity=".9"/></radialGradient>
<radialGradient id="mound" cx="45%" cy="40%" r="62%"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".35"/><stop offset=".55" stop-color="#FFFFFF" stop-opacity="0"/><stop offset="1" stop-color="#8A5A12" stop-opacity=".22"/></radialGradient>
<radialGradient id="meat" cx="44%" cy="38%" r="68%"><stop offset="0" stop-color="#E8813F"/><stop offset=".5" stop-color="#C5501F"/><stop offset=".85" stop-color="#93321A"/><stop offset="1" stop-color="#6A2410"/></radialGradient>
<radialGradient id="bowl" cx="40%" cy="36%" r="70%"><stop offset="0" stop-color="#8FAE77"/><stop offset="1" stop-color="#4E6B3E"/></radialGradient>
<radialGradient id="curd" cx="44%" cy="40%" r="60%"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#ECE6D3"/></radialGradient>
<filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="18"/></filter>
<filter id="lift" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="3" dy="6" stdDeviation="5" flood-color="#46320A" flood-opacity=".32"/></filter>`;

function plateLayer(): string {
  return `<ellipse cx="520" cy="540" rx="440" ry="430" fill="#46320A" opacity=".22" filter="url(#soft)"/>
<circle cx="500" cy="500" r="440" fill="url(#pl)"/>
<circle cx="500" cy="500" r="438" fill="none" stroke="#E2D9C6" stroke-width="3"/>
<circle cx="500" cy="500" r="338" fill="url(#well)"/>
<circle cx="500" cy="500" r="338" fill="none" stroke="#EAE2D2" stroke-width="2.5"/>
<path d="M170 330 A360 360 0 0 1 330 150" fill="none" stroke="#FFFFFF" stroke-width="16" stroke-linecap="round" opacity=".9"/>`;
}

function leaf(r: Rng, x: number, y: number, s: number): string {
  const a = r() * 360;
  const g = pick(r, ['#3E8E3A', '#4F9E43', '#2F7A33']);
  return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(a)}) scale(${f1(s)})"><path d="M0 0C-9-6-14-17-6-22C-2-26 3-24 4-18C9-23 17-19 14-11C21-9 21 1 12 3C10 8 3 7 0 0Z" fill="${g}"/><path d="M0 0L6-13" stroke="#1F5A24" stroke-width="1.2" opacity=".5"/></g>`;
}

function riceLayer(): string {
  const r = rng(11);
  let out = `<path d="${smooth(riceEdge)}" fill="#F3E7C9"/>`;
  const colours = ['#FFFDF6', '#FBF4E2', '#F6EBD0', '#FFFDF6', '#F2B630', '#E9952B', '#F7CF5A', '#FFFDF6', '#FBF4E2'];
  // Grains are capsules batched into one path per colour: ~760 grains, a handful of elements to paint.
  const byColour = new Map<string, string[]>();
  for (let i = 0; i < 760; i++) {
    const t = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * 0.97;
    const e = riceEdge[Math.floor((t / (Math.PI * 2)) * riceEdge.length) % riceEdge.length];
    const edge = Math.hypot(e[0] - RICE_C[0], e[1] - RICE_C[1]);
    const x = RICE_C[0] + Math.cos(t) * d * edge, y = RICE_C[1] + Math.sin(t) * d * edge;
    // saffron streaks cluster on one side, the way the rice is layered
    const c = Math.sin(t * 2 + 1) > 0.35 && r() < 0.7 ? pick(r, ['#F2B630', '#E9952B', '#F7CF5A']) : pick(r, colours);
    const a = r() * Math.PI, L = 7 + r() * 3, w = 2.7 + r() * 0.9;
    const ca = Math.cos(a), sa = Math.sin(a);
    const p = (u: number, v: number) => `${f1(x + u * ca - v * sa)} ${f1(y + u * sa + v * ca)}`;
    const cap = `M${p(-L, -w)}L${p(L, -w)}A${f1(w)} ${f1(w)} 0 0 1 ${p(L, w)}L${p(-L, w)}A${f1(w)} ${f1(w)} 0 0 1 ${p(-L, -w)}Z`;
    if (!byColour.has(c)) byColour.set(c, []);
    byColour.get(c)!.push(cap);
  }
  const all = [...byColour.values()].flat().join('');
  out += `<path d="${all}" fill="none" stroke="#D9C69C" stroke-width="1.4"/>`;
  byColour.forEach((caps, c) => (out += `<path d="${caps.join('')}" fill="${c}"/>`));
  out += `<path d="${smooth(riceEdge)}" fill="url(#mound)"/>`;
  for (let i = 0; i < 14; i++) {
    const t = r() * Math.PI * 2, d = 40 + r() * 190;
    out += leaf(r, RICE_C[0] + Math.cos(t) * d, RICE_C[1] + Math.sin(t) * d, 0.8 + r() * 0.5);
  }
  return out;
}

const PIECES: { x: number; y: number; rot: number; drum: boolean }[] = [
  { x: 395, y: 385, rot: -0.5, drum: false },
  { x: 615, y: 400, rot: 0.6, drum: true },
  { x: 385, y: 615, rot: 2.3, drum: true },
  { x: 610, y: 615, rot: -2.6, drum: false },
];

/** A drumstick is a meaty bulb that narrows to a neck (the bone is drawn separately); a thigh is a lumpy kidney. */
export function chickenPath(i: number): string {
  const p = PIECES[i];
  return p.drum
    ? smooth(blob(rng(30 + i), p.x + Math.cos(p.rot) * 10, p.y + Math.sin(p.rot) * 10, 104, 66, 0.07, 20, p.rot, 0.62))
    : smooth(blob(rng(30 + i), p.x, p.y, 94, 74, 0.14, 18, p.rot, 0.15));
}

function chickenPiece(i: number): string {
  const p = PIECES[i];
  const r = rng(50 + i);
  const d = chickenPath(i);
  const deg = (p.rot * 180) / Math.PI;
  // local → grid
  const at = (lx: number, ly: number): [number, number] => [
    p.x + lx * Math.cos(p.rot) - ly * Math.sin(p.rot),
    p.y + lx * Math.sin(p.rot) + ly * Math.cos(p.rot),
  ];
  let bone = '';
  if (p.drum) {
    const [bx, by] = at(-112, 0);
    bone = `<g transform="translate(${f1(bx)} ${f1(by)}) rotate(${f1(deg)})"><rect x="-30" y="-9" width="56" height="18" rx="9" fill="#F4EAD6" stroke="#C9B48E" stroke-width="2"/><circle cx="-30" cy="-10" r="12" fill="#FAF3E4" stroke="#C9B48E" stroke-width="2"/><circle cx="-30" cy="10" r="12" fill="#EFE3CB" stroke="#C9B48E" stroke-width="2"/><rect x="-24" y="-7" width="20" height="14" fill="#F4EAD6"/></g>`;
  }
  let tex = '';
  // grill char: short dark arcs across the grain of the meat
  for (let k = 0; k < 7; k++) {
    const [x1, y1] = at(-70 + k * 22 + (r() - 0.5) * 10, -50 + r() * 20);
    const [x2, y2] = at(-60 + k * 22 + (r() - 0.5) * 10, 50 - r() * 20);
    const [mx, my] = at(-65 + k * 22 + (r() - 0.5) * 30, (r() - 0.5) * 20);
    tex += `<path d="M${f1(x1)} ${f1(y1)}Q${f1(mx)} ${f1(my)} ${f1(x2)} ${f1(y2)}" stroke="#3A1206" stroke-width="${f1(5 + r() * 7)}" stroke-linecap="round" fill="none" opacity="${f1(0.22 + r() * 0.3)}"/>`;
  }
  // masala and oil sheen
  for (let k = 0; k < 46; k++) {
    const [x, y] = at((r() - 0.5) * 190, (r() - 0.5) * 140);
    tex += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(1.2 + r() * 2.4)}" fill="${pick(r, ['#3E1307', '#5C1F0A', '#8E3313', '#F0A25A'])}" opacity="${f1(0.5 + r() * 0.4)}"/>`;
  }
  for (let k = 0; k < 4; k++) {
    const [x, y] = at(-30 + r() * 60, -38 + r() * 20);
    tex += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(14 + r() * 16)}" ry="${f1(4 + r() * 3)}" transform="rotate(${f1(deg + (r() - 0.5) * 30)} ${f1(x)} ${f1(y)})" fill="#FFD3A0" opacity=".35"/>`;
  }
  return `<clipPath id="cp${i}"><path d="${d}"/></clipPath>
<g filter="url(#lift)">${bone}<path d="${d}" fill="url(#meat)"/></g>
<g clip-path="url(#cp${i})">${tex}</g>
<path d="${d}" fill="none" stroke="#4A160A" stroke-width="5" opacity=".45"/>${leaf(r, ...at(20, 8), 0.9)}`;
}

function chickenLayer(n = 4): string {
  return PIECES.slice(0, n).map((_, i) => chickenPiece(i)).join('');
}

const ONION_C: [number, number] = [640, 245];
export const onionEdge = blob(rng(91), ONION_C[0], ONION_C[1], 82, 58, 0.12, 14, 0.5);

function onionsLayer(): string {
  const r = rng(77);
  let out = '';
  for (let i = 0; i < 46; i++) {
    const t = r() * Math.PI * 2, d = Math.sqrt(r());
    const x = ONION_C[0] + Math.cos(t) * d * 70, y = ONION_C[1] + Math.sin(t) * d * 48;
    const a = r() * Math.PI * 2, len = 22 + r() * 30, bend = (r() - 0.5) * 50;
    const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
    const mx = (x + x2) / 2 - Math.sin(a) * bend, my = (y + y2) / 2 + Math.cos(a) * bend;
    const c = pick(r, ['#7B3F12', '#9A5419', '#B8702A', '#CF8F3E', '#6A3210']);
    out += `<path d="M${f1(x)} ${f1(y)}Q${f1(mx)} ${f1(my)} ${f1(x2)} ${f1(y2)}" fill="none" stroke="${c}" stroke-width="${f1(4.5 + r() * 3.5)}" stroke-linecap="round"/>`;
  }
  return `<g filter="url(#lift)">${out}</g>`;
}

const LEMON: { x: number; y: number; rot: number } = { x: 770, y: 735, rot: -38 };
export const lemonPath = `M-70 0A70 70 0 0 0 70 0Q0 -22 -70 0Z`;

function lemonLayer(): string {
  const { x, y, rot } = LEMON;
  let seg = '';
  for (let i = 1; i < 6; i++) {
    const t = Math.PI * (i / 6);
    seg += `<path d="M0 -6L${f1(-Math.cos(t) * 54)} ${f1(Math.sin(t) * 54 - 4)}" stroke="#FFF4C2" stroke-width="3" stroke-linecap="round"/>`;
  }
  return `<g transform="translate(${x} ${y}) rotate(${rot})" filter="url(#lift)">
<path d="M-74 -2A74 74 0 0 0 74 -2Q0 -26 -74 -2Z" fill="#E9B321"/>
<path d="M-64 -1A64 64 0 0 0 64 -1Q0 -20 -64 -1Z" fill="#FFF3C4"/>
<path d="M-58 0A58 58 0 0 0 58 0Q0 -17 -58 0Z" fill="#F8D64E"/>${seg}
<path d="M-40 18Q-10 34 26 24" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" opacity=".5" fill="none"/></g>`;
}

/** The raita bowl sits off the plate, bottom left, inside the same grid. */
function raitaLayer(): string {
  const r = rng(201);
  const [cx, cy] = AT.raita;
  let bits = '';
  for (let i = 0; i < 16; i++) {
    const t = r() * Math.PI * 2, d = Math.sqrt(r()) * 72;
    const x = cx + Math.cos(t) * d, y = cy + Math.sin(t) * d, s = 9 + r() * 6;
    bits += `<rect x="${f1(x - s / 2)}" y="${f1(y - s / 2)}" width="${f1(s)}" height="${f1(s)}" rx="3" transform="rotate(${f1(r() * 90)} ${f1(x)} ${f1(y)})" fill="#CFE3A9" stroke="#8DB25E" stroke-width="1.5"/>`;
  }
  for (let i = 0; i < 30; i++) {
    const t = r() * Math.PI * 2, d = Math.sqrt(r()) * 80;
    bits += `<ellipse cx="${f1(cx + Math.cos(t) * d)}" cy="${f1(cy + Math.sin(t) * d)}" rx="3" ry="1.4" fill="#7A5A2A" opacity=".55"/>`;
  }
  for (let i = 0; i < 4; i++) bits += leaf(r, cx + (r() - 0.5) * 90, cy + (r() - 0.5) * 90, 0.9);
  return `<ellipse cx="${cx + 14}" cy="${cy + 18}" rx="122" ry="116" fill="#46320A" opacity=".25" filter="url(#soft)"/>
<circle cx="${cx}" cy="${cy}" r="118" fill="url(#bowl)"/><circle cx="${cx}" cy="${cy}" r="100" fill="#3D5631" opacity=".35"/>
<circle cx="${cx}" cy="${cy}" r="96" fill="url(#curd)"/>${bits}`;
}

// ---------------------------------------------------------------- composition

export type PlateSpec = { rice?: boolean; chicken?: number; onions?: boolean; lemon?: boolean; raita?: boolean };
export const GOLDEN: PlateSpec = { rice: true, chicken: 4, onions: true, lemon: true, raita: true };
/** Four drifted copies, as SAM 3.1 found them in the demo photos. */
export const DRIFTS: PlateSpec[] = [
  { ...GOLDEN, lemon: false },
  { ...GOLDEN, onions: false, lemon: false },
  { ...GOLDEN, onions: false },
  { ...GOLDEN, onions: false, lemon: false, chicken: 3 },
];

const svg = (body: string, box = '0 0 1000 1000') => {
  const side = box.split(' ')[2];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box}" width="${side}" height="${side}"><defs>${DEFS}</defs>${body}</svg>`;
};

const url = (s: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(s)}`;

const cache = new Map<string, string>();
function once(key: string, make: () => string) {
  let v = cache.get(key);
  if (!v) cache.set(key, (v = url(make())));
  return v;
}

/** The whole dish as one image. `box` frames it: the full grid, or just the plate. */
export function dishUrl(spec: PlateSpec = GOLDEN, box: 'full' | 'plate' = 'full'): string {
  return once(`dish:${JSON.stringify(spec)}:${box}`, () =>
    svg(
      [
        spec.raita && box === 'full' ? raitaLayer() : '',
        plateLayer(),
        spec.rice ? riceLayer() : '',
        chickenLayer(spec.chicken ?? 0),
        spec.onions ? onionsLayer() : '',
        spec.lemon ? lemonLayer() : '',
      ].join(''),
      box === 'full' ? '0 0 1000 1000' : '50 50 900 900',
    ),
  );
}

/** One layer alone, on the shared grid, for stacking and pulling apart. */
export function layerUrl(layer: 'plate' | Part | `chicken-${number}`): string {
  return once(`layer:${layer}`, () => {
    if (layer === 'plate') return svg(plateLayer());
    if (layer === 'rice') return svg(riceLayer());
    if (layer === 'chicken') return svg(chickenLayer());
    if (layer.startsWith('chicken-')) return svg(chickenPiece(Number(layer.slice(8))));
    if (layer === 'onions') return svg(onionsLayer());
    if (layer === 'lemon') return svg(lemonLayer());
    return svg(raitaLayer());
  });
}

/** The outline SAM 3.1 would return for a part, as SVG path data on the shared grid. */
export function maskPaths(part: Part): string[] {
  if (part === 'rice') return [smooth(riceEdge)];
  if (part === 'chicken') return PIECES.map((_, i) => chickenPath(i));
  if (part === 'onions') return [smooth(onionEdge)];
  if (part === 'raita') return [`M${AT.raita[0] - 104} ${AT.raita[1]}a104 104 0 1 0 208 0a104 104 0 1 0 -208 0Z`];
  const { x, y, rot } = LEMON;
  const c = Math.cos((rot * Math.PI) / 180), s = Math.sin((rot * Math.PI) / 180);
  const pts: [number, number][] = [];
  for (let i = 0; i <= 12; i++) {
    const t = Math.PI * (i / 12);
    pts.push([-Math.cos(t) * 80, Math.sin(t) * 80 - 2]);
  }
  pts.push([40, -16], [0, -24], [-40, -16]);
  return [smooth(pts.map(([px, py]) => [x + px * c - py * s, y + px * s + py * c]))];
}

/** A QR-like block pattern for the table tent (drawn, not scannable; the real one lives in the app). */
export function qrSvg(seed = 7, n = 25): string {
  const r = rng(seed);
  let cells = '';
  const finder = (x: number, y: number) =>
    `<rect x="${x}" y="${y}" width="7" height="7" fill="#1B1B3A"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3" fill="#1B1B3A"/>`;
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const inFinder = (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
      if (!inFinder && r() < 0.48) cells += `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="#1B1B3A"/>`;
    }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1 -1 ${n + 2} ${n + 2}" shape-rendering="crispEdges">${cells}${finder(0, 0)}${finder(n - 7, 0)}${finder(0, n - 7)}</svg>`;
}
