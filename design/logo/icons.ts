// Nomi logo stickers: four directions for the animated mark, drawn in the fun-isometric house style.
import { VIEWS, arc, ellipse, line, onFace, pill, poly, rect, spark } from './fun'
import { erase, hop, impact, latch, look, sparkle, twinkle, wobble } from './motions'
import type { Icon, Layer, Motion, Shape, Vec } from './fun'

const LINE = 5
const { tilt: FACE, extrude: EXT } = VIEWS.right

// a white sparkle riding a parent, popped by whatever motion it is given
const glow = (parent: string, p: Vec, r: number, m: Motion | ReadonlyArray<Motion>, extra: { ip?: number; op?: number } = {}): Layer => ({
  parent,
  a: p,
  p,
  m,
  ...extra,
  shapes: [{ d: spark(p[0], p[1], r), fill: 'white' }],
})

// the Nomi n, an arch standing on a baseline at y 44: the food on the plate is the letter
const N = (k = 1, dy = 0) => {
  const [o, i, b, t] = [62 * k, 26 * k, 44 * k + dy, -6 * k + dy]
  return `M${-o} ${b}L${-o} ${t}A${o} ${o} 0 0 1 ${o} ${t}L${o} ${b}L${i} ${b}L${i} ${t}A${i} ${i} 0 0 0 ${-i} ${t}L${-i} ${b}Z`
}
const LEAF = 'M58 -96Q92 -128 122 -112Q104 -78 58 -96Z'

/** A: the Golden Plate. A plate whose food is the n, hopping like a reward, sparkles on the slam. */
export const nomiPlate: Icon = {
  name: 'nomiPlate',
  frames: 123,
  line: LINE,
  extrude: EXT,
  still: 100,
  layers: [
    { id: 'plate', p: [250, 262], m: hop, shapes: [] },
    {
      parent: 'plate',
      tilt: FACE,
      shapes: [
        { d: ellipse(0, 0, 150), fill: 'white', depth: 1 },
        { d: ellipse(0, 0, 112), fill: 'tint' },
        { d: N(1.15), fill: 'gold', depth: 0.6 },
        { d: LEAF, fill: 'ok', depth: 0.3, round: true },
      ],
    },
    glow('plate', [150, -108], 28, twinkle(0, true), { op: 30 }),
    glow('plate', [150, -108], 28, twinkle(54), { ip: 54 }),
    glow('plate', [-160, 30], 18, twinkle(6, true), { op: 36 }),
    glow('plate', [-160, 30], 18, twinkle(60), { ip: 60 }),
  ],
}

// a cloche seen from the front, one silhouette on a lightly leaned plane
const DOME = 'M-128 24C-126 -56 -72 -104 0 -104C72 -104 126 -56 128 24Z'
const LID_TILT: Vec = [-8, 18]
const LIFT: Vec = [11.5, 64]

/** B: the Reveal. The lid hovers to show the n, slams shut, the plate takes the hit, then it pops open again. */
export const nomiCloche: Icon = {
  name: 'nomiCloche',
  frames: 180,
  line: LINE,
  extrude: EXT,
  still: 0,
  layers: [
    {
      id: 'base',
      p: [250, 330],
      m: impact([4, 8]),
      shapes: [],
    },
    {
      parent: 'base',
      tilt: FACE,
      shapes: [
        { d: ellipse(0, 0, 158), fill: 'white', depth: 1 },
        { d: ellipse(0, 0, 124), fill: 'tint' },
        { d: N(1.05), fill: 'gold', depth: 0.6 },
      ],
    },
    {
      id: 'lid',
      p: [250 - LIFT[0], 300 - LIFT[1]],
      m: latch(LIFT),
      shapes: [],
    },
    {
      parent: 'lid',
      tilt: LID_TILT,
      shapes: [
        { d: ellipse(0, -118, 22, 18), fill: 'gold', depth: 0.6 },
        { d: DOME, fill: 'main', depth: 1 },
        { d: pill(-140, 14, 280, 24), fill: 'deep', depth: 0.6 },
        { d: arc(0, 18, 92, 200, 245) },
      ],
    },
    glow('lid', [-150, -100], 26, twinkle(0, true), { op: 30 }),
    glow('lid', [-150, -100], 26, twinkle(150), { ip: 150 }),
    glow('lid', [156, -60], 18, twinkle(6, true), { op: 36 }),
    glow('lid', [156, -60], 18, twinkle(156), { ip: 156 }),
  ],
}

const BUBBLE = poly([[-132, -96], [132, -96], [132, 74], [-36, 74], [-96, 120], [-80, 74], [-132, 74]], [30, 30, 30, 4, 6, 4, 30])
const BOT: Vec = [-16, 30]
const ROCK = onFace(BOT, [0, 74])
const HAT: ReadonlyArray<Shape> = [
  { d: ellipse(-50, -150, 36), fill: 'white', depth: 0.6 },
  { d: ellipse(50, -150, 36), fill: 'white', depth: 0.6 },
  { d: ellipse(0, -168, 44), fill: 'white', depth: 0.6 },
  { d: rect(-62, -138, 124, 46, 10), fill: 'white', depth: 0.6 },
  { d: line([-30, -132], [-30, -100]) },
  { d: line([30, -132], [30, -100]) },
]

/** C: the Mascot. A chat bubble in a chef's hat: it listens to guests, glances about, never quite still. */
export const nomiMascot: Icon = {
  name: 'nomiMascot',
  frames: 168,
  line: LINE,
  extrude: EXT,
  still: 0,
  layers: [
    { id: 'bot', a: ROCK, p: [252 + ROCK[0], 262 + ROCK[1]], m: wobble, shapes: [] },
    {
      id: 'face',
      parent: 'bot',
      tilt: BOT,
      shapes: [...HAT, { d: BUBBLE, fill: 'main', depth: 1 }, { d: rect(-104, -70, 208, 118, 26), fill: 'tint' }, { d: arc(0, 4, 30, 25, 155) }],
    },
    { id: 'eyeL', parent: 'face', shapes: [{ d: ellipse(-46, -20, 26, 30), fill: 'white' }] },
    { id: 'eyeR', parent: 'face', shapes: [{ d: ellipse(46, -20, 26, 30), fill: 'white' }] },
    { parent: 'face', clip: 'eyeL', m: { ...look, k: 1.6 }, shapes: [{ d: ellipse(-40, -14, 15), fill: 'ink', line: false }] },
    { parent: 'face', clip: 'eyeR', m: { ...look, k: 1.6 }, shapes: [{ d: ellipse(52, -14, 15), fill: 'ink', line: false }] },
    { parent: 'face', shapes: [{ d: ellipse(-78, 22, 14, 9), fill: 'hot', line: false }, { d: ellipse(78, 22, 14, 9), fill: 'hot', line: false }] },
    glow('bot', [158, -96], 24, sparkle(16)),
    glow('bot', [-160, -40], 16, sparkle(92)),
  ],
}

// a bowl from the front, rice heaped high, the n on its belly, steam drawn and erased above it
const BOWL = 'M-144 -30L144 -30C140 50 84 104 0 104C-84 104 -140 50 -144 -30Z'
const STEAM = (x: number) => `M${x} -128C${x - 22} -150 ${x + 22} -170 ${x} -196C${x - 18} -214 ${x + 10} -230 ${x} -244`

/** D: the Bowl. A steaming bowl with the n on its belly, hopping as the steam writes itself out. */
export const nomiBowl: Icon = {
  name: 'nomiBowl',
  frames: 160,
  line: LINE,
  extrude: EXT,
  still: 100,
  layers: [
    { id: 'bowl', p: [250, 300], m: hop, shapes: [] },
    {
      parent: 'bowl',
      tilt: [-10, 20],
      shapes: [
        { d: 'M-124 -30C-116 -104 116 -104 124 -30Z', fill: 'white', depth: 0.5 },
        { d: BOWL, fill: 'deep', depth: 1 },
        { d: pill(-156, -44, 312, 28), fill: 'gold', depth: 0.6 },
        { d: N(0.55, 40), fill: 'gold', depth: 0.3 },
      ],
    },
    { parent: 'bowl', shapes: [{ d: STEAM(-56), trim: erase(70, 100), round: true }] },
    { parent: 'bowl', shapes: [{ d: STEAM(0), trim: erase(75, 105), round: true }] },
    { parent: 'bowl', shapes: [{ d: STEAM(56), trim: erase(80, 110), round: true }] },
    glow('bowl', [168, -80], 24, twinkle(0, true), { op: 30 }),
    glow('bowl', [168, -80], 24, twinkle(54), { ip: 54 }),
  ],
}

export const logos = [nomiPlate, nomiCloche, nomiMascot, nomiBowl]

// each board direction's colours mapped onto the palette slots
export const THEMES = {
  pop: { main: '#E8483B', gold: '#FFB627', tint: '#FFF4D6', ok: '#3BB273', hot: '#FF7AB6', deep: '#1B1B3A' },
  clay: { main: '#8C7BFF', gold: '#FFD66B', tint: '#F1EEFF', ok: '#5CCFAE', hot: '#FF9F7A', deep: '#6A57F0' },
  night: { main: '#C8F03C', gold: '#FFB020', tint: '#2A2F35', ok: '#4CC9F0', hot: '#FF5D5D', deep: '#181B1F' },
  herb: { main: '#1F7A4D', gold: '#E9A23B', tint: '#E6F2EB', ok: '#5BAF7E', hot: '#D9472B', deep: '#18241D' },
}
