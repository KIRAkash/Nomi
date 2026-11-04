// The landing: one drawn Chicken Biryani carried through the whole story. A load-time intro builds the plate; every
// scene after it is a pinned section whose timeline is scrubbed by the scroll, so scrolling back plays it in reverse.
import './style.css';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { AT, DRIFTS, GOLDEN, PARTS, dishUrl, layerUrl, maskPaths, qrSvg, type Part, type PlateSpec } from './art';

gsap.registerPlugin(ScrollTrigger);

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const narrow = () => innerWidth < 1024;
document.documentElement.classList.add('js');
if (reduced) document.documentElement.classList.add('still');

// The app lives on the same host in production; locally it is the Expo dev server.
const APP: string = import.meta.env.VITE_APP_URL ?? (import.meta.env.DEV ? 'http://localhost:8081' : '');
document.querySelectorAll<HTMLAnchorElement>('[data-app]').forEach((a) => (a.href = APP + a.dataset.app));

const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector(sel) as T;
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => Array.from(root.querySelectorAll(sel)) as T[];

// A drawn dish is ~1,000 SVG shapes. Painting it once into a bitmap keeps scaling and scrubbing on the compositor
// instead of re-rasterising vectors every frame.
// Rasters run one at a time in page order (the hero first), yielding a frame between each so nothing stalls.
const rasters = new Map<string, Promise<string>>();
let queue: Promise<unknown> = Promise.resolve();
function raster(src: string, px: number): Promise<string> {
  const key = `${px}:${src}`;
  let p = rasters.get(key);
  if (!p) {
    p = queue.then(() => new Promise<void>((r) => requestAnimationFrame(() => r()))).then(() => new Promise<string>((done) => {
      const im = new Image();
      im.onload = () => {
        const c = document.createElement('canvas');
        c.width = c.height = px;
        c.getContext('2d')!.drawImage(im, 0, 0, px, px);
        c.toBlob((b) => done(b ? URL.createObjectURL(b) : src), 'image/png');
      };
      im.onerror = () => done(src);
      im.src = src;
    }));
    queue = p;
    rasters.set(key, p);
  }
  return p;
}

const DPR = Math.min(1.5, devicePixelRatio || 1);
/** `px` asks for a cached bitmap at that size; without it the drawn SVG is used as is. */
function img(src: string, cls = '', px = 0): HTMLImageElement {
  const el = new Image();
  if (px) raster(src, Math.round(px * DPR)).then((u) => (el.src = u));
  else el.src = src;
  el.alt = '';
  el.decoding = 'async';
  if (cls) el.className = cls;
  el.draggable = false;
  return el;
}

const colour = (p: Part) => PARTS.find((x) => x.id === p)!.colour;

/** Outline + translucent fill for each part, on the shared 1000 grid. */
function masksMarkup(parts: Part[]): string {
  return parts
    .map(
      (p) =>
        `<g data-part="${p}">${maskPaths(p)
          .map((d) => `<path class="fill" d="${d}" fill="${colour(p)}" opacity="0" style="stroke:none"/><path class="edge" d="${d}" stroke="${colour(p)}"/>`)
          .join('')}</g>`,
    )
    .join('');
}

/** Ready a path to be drawn on: hidden by its own dash, returns the length. */
function prepDraw(path: SVGPathElement): number {
  const len = path.getTotalLength();
  path.style.strokeDasharray = `${len}`;
  path.style.strokeDashoffset = `${len}`;
  return len;
}

/** A transform origin at a point on the shared 1000 grid. */
const origin = ([x, y]: [number, number]) => `${x / 10}% ${y / 10}%`;

// ---------------------------------------------------------------- nav

const nav = $('#nav');
const onScroll = () => {
  nav.classList.toggle('solid', scrollY > 40);
  document.documentElement.classList.toggle('scrolled', scrollY > 40);
};
addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ---------------------------------------------------------------- hero

const PIECE_AT: [number, number][] = [
  [395, 385],
  [615, 400],
  [385, 615],
  [610, 615],
];

function buildHero() {
  const dish = $('#hero-dish');
  const raita = img(layerUrl('raita'));
  const plate = img(layerUrl('plate'));
  const rice = img(layerUrl('rice'));
  const pieces = PIECE_AT.map((_, i) => img(layerUrl(`chicken-${i}`)));
  const onions = img(layerUrl('onions'));
  const lemon = img(layerUrl('lemon'));
  dish.append(raita, plate, rice, ...pieces, onions, lemon);
  const masks = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  masks.setAttribute('viewBox', '0 0 1000 1000');
  masks.classList.add('masks');
  masks.innerHTML = masksMarkup(PARTS.map((p) => p.id));
  dish.append(masks);
  $$<SVGPathElement>('.edge', masks).forEach(prepDraw);

  const title = $$('.hero-title .ln');
  const rest = $$('.lede, .actions, .fine');

  if (reduced) return;

  const intro = gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.15 });
  intro
    .from(title, { yPercent: 60, opacity: 0, filter: 'blur(10px)', duration: 1.2, stagger: 0.09 }, 0)
    .from(rest, { y: 24, opacity: 0, duration: 1, stagger: 0.08 }, 0.35)
    .from(dish, { scale: 0.55, rotation: -50, opacity: 0, duration: 1.6 }, 0)
    .from(raita, { xPercent: -14, yPercent: 8, opacity: 0, duration: 1.1 }, 0.35)
    .fromTo(rice, { clipPath: 'circle(0% at 49% 51%)' }, { clipPath: 'circle(40% at 49% 51%)', duration: 1.2, ease: 'power3.out' }, 0.45)
    .from(pieces, { y: -70, scale: 1.35, opacity: 0, duration: 0.9, ease: 'back.out(2)', stagger: 0.11, transformOrigin: (i: number) => origin(PIECE_AT[i]) }, 0.75)
    .from(onions, { scale: 0.2, opacity: 0, rotation: -40, transformOrigin: origin(AT.onions), duration: 0.8, ease: 'back.out(2.4)' }, 1.15)
    .from(lemon, { xPercent: 10, yPercent: 8, rotation: 25, opacity: 0, transformOrigin: origin(AT.lemon), duration: 0.9, ease: 'back.out(1.8)' }, 1.25)
    .add(() => samLoop(dish, masks), 1.9);

  gsap.to(dish, { rotation: 4, duration: 7, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.8 });

  // the plate eases away as the story starts
  gsap.to('.hero-stage', {
    yPercent: 18,
    scale: 0.86,
    opacity: 0.4,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });
}

/** SAM 3.1 working on the hero plate: one part at a time traced, filled and labelled with its count. */
function samLoop(dish: HTMLElement, masks: SVGSVGElement) {
  const tag = $('#sam-tag');
  const stage = $('.hero-stage');
  const order: Part[] = ['chicken', 'rice', 'onions', 'lemon', 'raita'];
  let i = 0;
  const step = () => {
    const part = order[i % order.length];
    const info = PARTS.find((p) => p.id === part)!;
    const g = $(`[data-part="${part}"]`, masks);
    const edges = $$<SVGPathElement>('.edge', g);
    const fills = $$<SVGPathElement>('.fill', g);
    edges.forEach(prepDraw);

    const d = dish.getBoundingClientRect();
    const s = stage.getBoundingClientRect();
    const [ax, ay] = AT[part];
    const y = d.top - s.top + (ay / 1000) * d.height;
    tag.style.setProperty('--c', info.colour);
    $('.sam-part', tag).textContent = info.name;
    $('.sam-count', tag).textContent = `× ${info.count}`;
    // keep the whole tag on screen (the plate bleeds past the edge, the label must not)
    const room = Math.min(s.width, innerWidth - s.left) - tag.offsetWidth - 44;
    const x = Math.max(0, Math.min(d.left - s.left + (ax / 1000) * d.width, room));

    gsap
      .timeline({ onComplete: () => (i++, step()) })
      .to(edges, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut', stagger: 0.08 })
      .to(fills, { opacity: 0.22, duration: 0.5 }, 0.5)
      .fromTo(tag, { x: x + 24, y: y - 30, opacity: 0, scale: 0.8 }, { x: x + 34, y: y - 40, opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(2)' }, 0.55)
      .to([...edges, ...fills], { opacity: 0, duration: 0.5 }, 2.3)
      .to(tag, { opacity: 0, y: '-=12', duration: 0.4 }, 2.35)
      .add(() => {
        edges.forEach(prepDraw);
        gsap.set(edges, { opacity: 1 });
      }, 2.9);
  };
  step();
}

buildHero();

// ---------------------------------------------------------------- pinned scenes

function scene(id: string, length: number, build: (tl: gsap.core.Timeline, root: HTMLElement) => void) {
  const root = document.getElementById(id)!;
  const tl = gsap.timeline({ defaults: { ease: 'power2.inOut', duration: 1 }, paused: true });
  build(tl, root);
  if (reduced) {
    tl.progress(1);
    return;
  }
  ScrollTrigger.create({
    trigger: root,
    start: 'top top',
    end: () => `+=${innerHeight * (narrow() ? length * 0.8 : length)}`,
    pin: $('.pin', root),
    scrub: 0.7,
    animation: tl,
    invalidateOnRefresh: true,
  });
}

/** Swap the headline: the current line leaves upward, the next arrives from below. */
function say(tl: gsap.core.Timeline, root: HTMLElement, from: number, to: number, at: number) {
  const a = $(`[data-say="${from}"]`, root);
  const b = $(`[data-say="${to}"]`, root);
  tl.to(a, { autoAlpha: 0, y: -36, filter: 'blur(8px)', duration: 0.35, ease: 'power2.in' }, at).fromTo(
    b,
    { autoAlpha: 0, y: 36, filter: 'blur(8px)' },
    { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.45, ease: 'power3.out' },
    at + 0.3,
  );
}

// -- drift: one plate becomes a service of 21, and the copies drift

const VOICES = [
  { t: 'Naan was cold.', x: 4, y: 8 },
  { t: 'खाना ठंडा था', x: 62, y: 4, lang: 'hi' },
  { t: 'Less rice than last time?', x: 54, y: 84 },
  { t: 'ಈರುಳ್ಳಿ ಇರಲಿಲ್ಲ', x: 2, y: 80, lang: 'kn' },
  { t: 'পেঁয়াজ ছিল না', x: 78, y: 40, lang: 'bn' },
  { t: 'Not like the photo.', x: 26, y: 46 },
];

scene('drift', 3.2, (tl, root) => {
  const grid = $('#drift-grid');
  const CENTER = 10;
  const cells = Array.from({ length: 21 }, (_, i) => {
    const col = i % 7, row = Math.floor(i / 7);
    const dist = Math.hypot(col - 3, (row - 1) * 1.2);
    const spec: PlateSpec | null = i === CENTER ? null : DRIFTS[Math.min(3, Math.max(0, Math.round(dist * 0.9) - 1))];
    const el = document.createElement('div');
    el.className = 'cell';
    el.style.left = `${(col / 7) * 100}%`;
    el.style.top = `${row * (1.2 / 3.4) * 100}%`;
    const base: PlateSpec = { ...GOLDEN, raita: false };
    const drifted = spec ? img(dishUrl({ ...spec, raita: false }, 'plate'), '', 360) : null;
    const golden = img(dishUrl(base, 'plate'), 'golden', i === CENTER ? 0 : 360);
    if (drifted) el.append(drifted);
    el.append(golden);
    const misses: HTMLElement[] = [];
    if (spec) {
      (['onions', 'lemon'] as const).forEach((p) => {
        if (spec[p]) return;
        const m = document.createElement('i');
        m.className = 'miss';
        m.style.left = `${((AT[p][0] - 50) / 900) * 100 - 13}%`;
        m.style.top = `${((AT[p][1] - 50) / 900) * 100 - 13}%`;
        el.append(m);
        misses.push(m);
      });
    }
    grid.append(el);
    return { el, golden, misses, dist, rot: ((Math.sin(i * 12.9898) * 43758.5453) % 1) * 0.6 };
  });
  const others = cells.filter((_, i) => i !== CENTER);
  const voices = VOICES.map((v) => {
    const el = document.createElement('span');
    el.className = 'voice';
    el.textContent = v.t;
    if (v.lang) el.lang = v.lang;
    // on a phone the bubbles start no further right than the middle, so the longer ones stay on screen
    el.style.left = `${narrow() ? Math.min(v.x, 40) : v.x}%`;
    el.style.top = `${v.y}%`;
    $('#voices', root).append(el);
    return el;
  });

  const zoom = () => Math.min(5.2, ($('.drift-stage', root).clientHeight * 0.8) / (grid.clientWidth / 7));
  tl.fromTo(grid, { scale: zoom }, { scale: 1, duration: 1.4, ease: 'power3.inOut' }, 0.5)
    .from(others.map((c) => c.el), { opacity: 0, scale: 0.6, duration: 0.6, stagger: { each: 0.03, from: 'center' } }, 0.9)
    .to(cells.map((c) => c.el), { rotation: (i: number) => cells[i].rot * 40, duration: 1 }, 1.2);
  say(tl, root, 0, 1, 0.6);
  // drift: further from the chef, more drift
  const byDist = [...others].sort((a, b) => a.dist - b.dist);
  tl.to(byDist.map((c) => c.golden), { opacity: 0, duration: 0.5, stagger: 0.04 }, 2.3).to(
    byDist.flatMap((c) => c.misses),
    { opacity: 1, scale: 1, duration: 0.3, stagger: 0.03 },
    2.7,
  );
  say(tl, root, 1, 2, 2.3);
  tl.to(grid, { opacity: 0.5, scale: 0.94, duration: 0.8 }, 3.6);
  say(tl, root, 2, 3, 3.5);
  voices.forEach((v, i) => {
    const at = 3.7 + i * 0.18;
    tl.fromTo(v, { opacity: 0, y: 30, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'back.out(2)' }, at);
  });
  // they drift a little and never reach anyone: nobody can tell which plate they meant
  tl.to(voices, { y: -18, opacity: 0.85, duration: 1, ease: 'sine.inOut', stagger: 0.05 }, 5.0).to({}, { duration: 0.3 });
});

// -- golden: three photos, then SAM 3.1 pulls the plate apart

scene('golden', 3.4, (tl, root) => {
  const shots = $('#shots', root);
  const cards = [0, 1, 2].map((i) => {
    const c = document.createElement('div');
    c.className = 'shot-card';
    const d = img(dishUrl({ ...GOLDEN, raita: false }, 'full'));
    d.style.transform = `translate(${[0, 3, -2][i]}%, ${[0, -2, 2][i]}%) rotate(${[0, 7, -6][i]}deg)`;
    c.append(d);
    const n = document.createElement('span');
    n.className = 'n';
    n.textContent = `Photo ${i + 1} of 3`;
    c.append(n);
    shots.append(c);
    return c;
  });

  const explode = $('#explode', root);
  explode.style.perspective = '2200px';
  const stack = document.createElement('div');
  stack.className = 'stack';
  const order: ('plate' | Part)[] = ['plate', 'raita', 'rice', 'chicken', 'onions', 'lemon'];
  const lays = order.map((l) => {
    const lay = document.createElement('div');
    lay.className = 'lay';
    lay.append(img(layerUrl(l)));
    if (l !== 'plate') {
      const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      s.setAttribute('viewBox', '0 0 1000 1000');
      s.classList.add('masks');
      s.innerHTML = masksMarkup([l]);
      lay.append(s);
    }
    stack.append(lay);
    return { l, lay };
  });
  explode.append(stack);

  const list = $('#parts', root);
  PARTS.forEach((p) => {
    const li = document.createElement('li');
    li.style.setProperty('--c', p.colour);
    li.innerHTML = `<i></i><span>${p.name}${p.count > 1 ? ` × ${p.count}` : ''}</span><small>in 3 of 3</small>`;
    list.append(li);
  });

  const edges = $$<SVGPathElement>('.stack .edge', root);
  const lens = edges.map((e) => e.getTotalLength());
  edges.forEach((e, i) => {
    e.style.strokeDasharray = `${lens[i]}`;
    e.style.strokeDashoffset = `${lens[i]}`;
  });

  const gap = () => stack.clientWidth * (narrow() ? 0.09 : 0.11);
  const lifted = lays.filter((x) => x.l !== 'plate' && x.l !== 'raita');

  tl.from(cards, { y: 160, rotation: (i: number) => [-14, 10, -4][i], opacity: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out' }, 0.1)
    .fromTo($$('.n', shots), { opacity: 0 }, { opacity: 1, duration: 0.3, stagger: 0.08 }, 1.4)
    .to(cards, { xPercent: (i: number) => [-58, 0, 58][i], yPercent: (i: number) => [6, -4, 6][i], rotation: (i: number) => [-6, 0, 6][i], scale: 0.62, duration: 0.9 }, 0.9);
  say(tl, root, 0, 1, 0.8);
  tl.to(cards, { xPercent: 0, yPercent: 0, rotation: 0, scale: 0.9, opacity: 0, duration: 0.7, ease: 'power2.in' }, 1.9)
    .from(stack, { opacity: 0, scale: 0.9, duration: 0.5 }, 2.3)
    .to(stack, { rotationX: narrow() ? 52 : 58, rotationZ: -18, duration: 1, ease: 'power3.inOut' }, 2.6);
  say(tl, root, 1, 2, 2.4);
  lifted.forEach((x, i) => tl.to(x.lay, { z: () => gap() * (i + 1), duration: 1, ease: 'power3.inOut' }, 2.7 + i * 0.06));
  tl.to(edges, { strokeDashoffset: 0, duration: 0.8, stagger: 0.04, ease: 'power2.out' }, 3.2)
    .to($$('.stack .fill', root), { opacity: 0.2, duration: 0.5 }, 3.6)
    .to($$('li', list), { opacity: 1, x: 0, duration: 0.4, stagger: 0.1, ease: 'back.out(2)', startAt: { x: 30 } }, 3.4)
    .to({}, { duration: 0.6 });
});

// -- said: plays once as it scrolls in

function buildSaid() {
  const wave = $('#wave');
  const bars = Array.from({ length: 48 }, () => {
    const b = document.createElement('i');
    wave.append(b);
    return b;
  });
  const heard = $('#heard');
  const seg = new Intl.Segmenter('hi', { granularity: 'word' });
  heard.innerHTML = Array.from(seg.segment(heard.textContent ?? ''))
    .map((s) => (s.isWordLike ? `<span class="w">${s.segment}</span>` : s.segment))
    .join('');
  const words = $$('.w', heard);
  const checks = $$('#checks li');
  if (reduced) {
    gsap.set(bars, { scaleY: (i: number) => 0.2 + 0.7 * Math.abs(Math.sin(i * 0.7)) });
    return;
  }
  gsap.set(checks, { opacity: 0, x: 40 });
  gsap.set(words, { opacity: 0.08 });
  const tl = gsap.timeline({ paused: true });
  tl.to(bars, {
    scaleY: () => 0.15 + Math.random() * 0.85,
    duration: 0.18,
    ease: 'sine.inOut',
    stagger: { each: 0.02, repeat: 9, yoyo: true },
  })
    .to(words, { opacity: 1, duration: 0.25, stagger: 0.16 }, 0.2)
    .to(bars, { scaleY: (i: number) => 0.18 + 0.6 * Math.abs(Math.sin(i * 0.9) * Math.cos(i * 0.31)), duration: 0.5 }, '>-0.2')
    .to(checks, { opacity: 1, x: 0, duration: 0.6, ease: 'back.out(1.8)', stagger: 0.18 }, '>-0.1');
  ScrollTrigger.create({ trigger: '#said', start: 'top 62%', once: true, onEnter: () => tl.play() });
}

// -- pass: frames filtered on site, then two plates checked against the Golden Plate

function frameSvg(kind: 'empty' | 'hands' | 'blur' | 'plate'): string {
  const dish = kind === 'plate' || kind === 'blur' ? `<image href="${dishUrl({ ...GOLDEN, raita: false }, 'plate')}" x="${kind === 'blur' ? 30 : 34}" y="8" width="64" height="64" ${kind === 'blur' ? 'filter="url(#b)"' : ''}/>` : '';
  const hands =
    kind === 'hands'
      ? `<path d="M18 70 C22 46 40 40 52 46 C58 50 54 58 46 58 C40 70 30 78 18 78Z" fill="#C98E62"/><path d="M110 74 C104 50 88 44 76 50 C70 54 74 62 82 62 C88 72 98 80 110 80Z" fill="#B97E55"/>`
      : '';
  const face = kind === 'plate' ? `<circle cx="112" cy="16" r="15" fill="#B98563" filter="url(#b2)"/>` : '';
  return `<svg viewBox="0 0 128 96" preserveAspectRatio="xMidYMid slice"><defs><filter id="b"><feGaussianBlur stdDeviation="4"/></filter><filter id="b2"><feGaussianBlur stdDeviation="6"/></filter></defs><rect width="128" height="96" fill="#E5DCC8"/><path d="M0 60H128" stroke="#D3C7AE" stroke-width="2"/>${dish}${hands}${face}</svg>`;
}

scene('pass', 3.6, (tl, root) => {
  const strip = $('#strip', root);
  const FRAMES = [
    { k: 'empty', t: 'No plate · dropped' },
    { k: 'hands', t: 'Hands · dropped' },
    { k: 'blur', t: 'Blurred · dropped' },
    { k: 'plate', t: 'Plate · face blurred' },
  ] as const;
  const frames = FRAMES.map((f) => {
    const el = document.createElement('div');
    el.className = 'frame';
    el.innerHTML = `${frameSvg(f.k)}<b>${f.t}</b>`;
    strip.append(el);
    return el;
  });

  const a = $('#pass-a', root);
  a.append(img(dishUrl({ ...GOLDEN, raita: false })));
  const b = $('#pass-b', root);
  b.append(img(dishUrl({ ...GOLDEN, raita: false, onions: false })));
  const addOnions = img(layerUrl('onions'));
  b.append(addOnions);

  const masks = $<SVGSVGElement>('#pass-masks', root);
  const here: Part[] = ['rice', 'chicken', 'lemon'];
  masks.innerHTML = `<g class="ga">${masksMarkup(['rice', 'chicken', 'onions', 'lemon'])}</g><g class="gb">${masksMarkup(here)}</g><path class="ghost" d="${maskPaths('onions')[0]}" stroke="#D98E00" stroke-dasharray="14 12" fill="rgba(255,182,39,.18)"/>`;
  const ea = $$<SVGPathElement>('.ga .edge', masks);
  const eb = $$<SVGPathElement>('.gb .edge', masks);
  [...ea, ...eb].forEach(prepDraw);
  const ghost = $<SVGPathElement>('.ghost', masks);

  const nudge = $('#nudge', root), okA = $('#ok-a', root), okB = $('#ok-b', root);
  gsap.set([nudge, okA, okB], { xPercent: -50 });

  tl.from(frames, { y: 30, opacity: 0, duration: 0.4, stagger: 0.12, ease: 'back.out(2)' }, 0.1)
    .to(frames.slice(0, 3), { opacity: 0.38, scale: 0.94, duration: 0.3, stagger: 0.1 }, 0.9)
    .to(frames[3], { boxShadow: '0 0 0 3px #2E9A5F', duration: 0.3 }, 1.25);
  say(tl, root, 0, 1, 1.0);
  // plate A: matches
  tl.fromTo(a, { xPercent: -130, rotation: -40 }, { xPercent: 0, rotation: 0, duration: 0.8, ease: 'power3.out' }, 1.5)
    .to(ea, { strokeDashoffset: 0, duration: 0.5, stagger: 0.04 }, 2.1)
    .fromTo(okA, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3, ease: 'back.out(2)' }, 2.4)
    .to(a, { xPercent: 130, rotation: 30, duration: 0.7, ease: 'power3.in' }, 2.95)
    .to($('.ga', masks), { opacity: 0, duration: 0.3 }, 2.95)
    .to(okA, { opacity: 0, y: -10, duration: 0.25 }, 2.95)
    // plate B: onions missing
    .fromTo(b, { xPercent: -130, rotation: -40 }, { xPercent: 0, rotation: 0, duration: 0.8, ease: 'power3.out' }, 3.4)
    .to(eb, { strokeDashoffset: 0, duration: 0.5, stagger: 0.04 }, 4.0)
    .fromTo(ghost, { opacity: 0, scale: 1.3, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(2)' }, 4.35)
    .fromTo(nudge, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.35, ease: 'back.out(2)' }, 4.5);
  say(tl, root, 1, 2, 4.2);
  say(tl, root, 2, 3, 5.0);
  tl.fromTo(addOnions, { y: -90, scale: 1.25, opacity: 0, transformOrigin: origin(AT.onions) }, { y: 0, scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2)' }, 5.2)
    .to(ghost, { opacity: 0, duration: 0.3 }, 5.4)
    .to(nudge, { opacity: 0, y: -10, duration: 0.25 }, 5.5)
    .fromTo(okB, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.35, ease: 'back.out(2)' }, 5.6)
    .to({}, { duration: 0.6 });
});

// -- table: the guest's ten seconds on a drawn phone

scene('table', 3.4, (tl, root) => {
  $('#qr', root).innerHTML = qrSvg();
  $('#guest-dish', root).append(img(dishUrl({ ...GOLDEN, raita: false }, 'plate')));
  const gw = $('#guest-wave', root);
  const bars = Array.from({ length: 34 }, () => {
    const b = document.createElement('i');
    gw.append(b);
    return b;
  });
  const screens = $$('.scr', root);
  const steps = $$('#steps li', root);
  const setStep = (n: number) => steps.forEach((s, i) => s.classList.toggle('on', i === n));
  setStep(0);

  const swapTo = (n: number, at: number) => {
    tl.to(screens[n - 1], { opacity: 0, scale: 0.96, duration: 0.3 }, at).fromTo(screens[n], { opacity: 0, scale: 1.04 }, { opacity: 1, scale: 1, duration: 0.35 }, at + 0.15);
    tl.call(() => setStep(n), [], at + 0.2).call(() => setStep(n - 1), [], at + 0.19);
  };

  tl.from('#phone', { y: 80, rotation: 6, opacity: 0, duration: 0.6, ease: 'power3.out' }, 0)
    .fromTo($('.scanline', root), { top: '22%' }, { top: '74%', duration: 0.8, ease: 'sine.inOut' }, 0.4)
    .to($('.tent', root), { scale: 1.06, rotation: 0, duration: 0.6 }, 0.6);
  swapTo(1, 1.3);
  tl.from($('.shot-dish', root), { yPercent: 30, rotation: -20, duration: 0.6, ease: 'power3.out' }, 1.4).from(
    $('.named', root),
    { y: 30, opacity: 0, scale: 0.9, duration: 0.4, ease: 'back.out(2)' },
    1.9,
  );
  swapTo(2, 2.5);
  tl.fromTo(
    bars,
    { scaleY: 0.12 },
    { scaleY: (i: number) => 0.25 + 0.75 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.45)), duration: 0.3, stagger: { each: 0.012, from: 'center' } },
    2.75,
  ).from($('.said-line', root), { opacity: 0, y: 16, duration: 0.4 }, 3.0);
  swapTo(3, 3.6);
  tl.from($$('.tags li', root), { x: 40, opacity: 0, duration: 0.35, stagger: 0.12, ease: 'back.out(2)' }, 3.8)
    .from($('.send', root), { y: 20, opacity: 0, duration: 0.3 }, 4.2)
    .to({}, { duration: 0.6 });
});

// -- morning: NIGHTSHIFT fans out, then tonight's watch list

const ANALYSTS = [
  { name: 'Feedback', found: '4 findings from 6 facts' },
  { name: 'Plates', found: '4 findings from 25 facts' },
  { name: 'Stock', found: '2 findings from 5 facts' },
  { name: 'Closing round', found: '4 findings from 7 facts' },
];
const WATCH = [
  { dish: 'Chicken Biryani', fact: 'Rice under the Golden Plate area', n: 6, of: 39 },
  { dish: 'Paneer Tikka', fact: 'Mint chutney missing', n: 3, of: 24 },
  { dish: 'Tandoori Prawns', fact: 'Prawns short', n: 2, of: 18 },
];

scene('morning', 3.2, (tl, root) => {
  const g = $<SVGSVGElement>('#graph', root);
  // Wide: Wonder on the left fanning out to a column of analysts. Narrow: Wonder on top, analysts in a 2×2 grid, the
  // findings gathering into "Facts linked" underneath, on a smaller grid so the type stays readable on a phone.
  const wide = !narrow();
  g.setAttribute('viewBox', wide ? '0 0 640 520' : '0 0 340 470');
  const hub = wide ? { x: 20, y: 222, w: 190, h: 76 } : { x: 80, y: 0, w: 180, h: 64 };
  const nodes = ANALYSTS.map((a, i) =>
    wide ? { ...a, x: 400, y: 24 + i * 124, w: 230, h: 84 } : { ...a, x: (i % 2) * 175, y: 150 + Math.floor(i / 2) * 120, w: 165, h: 78 },
  );
  const link = wide ? { x: hub.x + 20, y: hub.y + hub.h + 14 } : { x: 95, y: 420 };
  const curve = (n: (typeof nodes)[number]) =>
    wide
      ? `M${hub.x + hub.w} ${hub.y + hub.h / 2} C ${hub.x + hub.w + 110} ${hub.y + hub.h / 2}, ${n.x - 110} ${n.y + n.h / 2}, ${n.x} ${n.y + n.h / 2}`
      : `M${hub.x + hub.w / 2} ${hub.y + hub.h} C ${hub.x + hub.w / 2} ${hub.y + hub.h + 50}, ${n.x + n.w / 2} ${n.y - 50}, ${n.x + n.w / 2} ${n.y}`;
  const back = (n: (typeof nodes)[number]) =>
    wide
      ? `M${n.x} ${n.y + n.h / 2 + 14} C ${n.x - 130} ${n.y + n.h / 2 + 14}, ${hub.x + hub.w + 90} ${hub.y + hub.h + 40}, ${hub.x + hub.w / 2 + 40} ${hub.y + hub.h + 2}`
      : `M${n.x + n.w / 2} ${n.y + n.h} C ${n.x + n.w / 2} ${n.y + n.h + 40}, ${link.x + 75} ${link.y - 40}, ${link.x + 75} ${link.y}`;
  g.innerHTML = `
    ${nodes.map((n) => `<path class="out" d="${curve(n)}" fill="none" stroke="#1B1B3A" stroke-opacity=".35" stroke-width="2.5"/>`).join('')}
    ${nodes.map((n) => `<path class="back" d="${back(n)}" fill="none" stroke="#D98E00" stroke-width="2.5"/>`).join('')}
    ${nodes.map(() => `<circle class="pk" r="6" fill="#D98E00"/>`).join('')}
    <g class="node hub"><rect x="${hub.x}" y="${hub.y}" width="${hub.w}" height="${hub.h}" rx="22"/>
      <image href="/site/muse.png" x="${hub.x + 16}" y="${hub.y + 20}" width="36" height="36"/>
      <text x="${hub.x + 62}" y="${hub.y + 34}" font-size="17" font-weight="800">Muse Wonder</text>
      <text x="${hub.x + 62}" y="${hub.y + 56}" font-size="13" font-weight="600" fill-opacity=".6">Plans the review</text></g>
    <g class="linked"><rect x="${link.x}" y="${link.y}" width="150" height="36" rx="14" fill="#DDF5E6"/>
      <text x="${link.x + 75}" y="${link.y + 23}" font-size="14" font-weight="800" fill="#14532D" text-anchor="middle">Facts linked</text></g>
    ${nodes
      .map(
        (n) => `<g class="node an"><rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="22"/>
      <image href="/site/muse.png" x="${n.x + 14}" y="${n.y + 14}" width="22" height="22"/>
      <text x="${n.x + 44}" y="${n.y + 31}" font-size="15" font-weight="800">${n.name}</text>
      <text class="found" x="${n.x + 16}" y="${n.y + 60}" font-size="${wide ? 13.5 : 11.5}" font-weight="700" fill="#2E7D4F">${n.found}</text></g>`,
      )
      .join('')}`;
  const outs = $$<SVGPathElement>('.out', g);
  const backs = $$<SVGPathElement>('.back', g);
  const pks = $$<SVGCircleElement>('.pk', g);
  outs.forEach(prepDraw);
  backs.forEach(prepDraw);
  const travel = { t: 0 };
  const placePackets = () =>
    pks.forEach((c, i) => {
      const p = outs[i].getPointAtLength(outs[i].getTotalLength() * travel.t);
      c.setAttribute('cx', `${p.x}`);
      c.setAttribute('cy', `${p.y}`);
      c.style.opacity = travel.t > 0.02 && travel.t < 0.98 ? '1' : '0';
    });
  placePackets();

  const watch = $('#watch', root);
  const cards = WATCH.map((w) => {
    const el = document.createElement('div');
    el.className = 'wl';
    el.innerHTML = `<div class="wl-top"><b>${w.dish}</b><span><span class="num">0</span> <small>of ${w.of} plates</small></span></div><p>${w.fact}</p><div class="dots">${Array.from(
      { length: w.of },
      (_, i) => `<i${i < w.n ? ' class="h"' : ''}></i>`,
    ).join('')}</div>`;
    watch.append(el);
    return el;
  });
  gsap.set(watch, { autoAlpha: 0 });

  tl.from($('.hub', g), { opacity: 0, scale: 0.8, transformOrigin: '20% 50%', duration: 0.5, ease: 'back.out(2)' }, 0.1)
    .to(outs, { strokeDashoffset: 0, duration: 0.7, stagger: 0.08 }, 0.7)
    .from($$('.an', g), { opacity: 0, x: 30, duration: 0.45, stagger: 0.08, ease: 'back.out(2)' }, 1.0)
    .to(travel, { t: 1, duration: 0.9, ease: 'power1.inOut', onUpdate: placePackets }, 0.9)
    .from($$('.found', g), { opacity: 0, y: 8, duration: 0.3, stagger: 0.1 }, 1.7)
    .to(backs, { strokeDashoffset: 0, duration: 0.6, stagger: 0.06 }, 2.0)
    .from($('.linked', g), { opacity: 0, scale: 0.6, transformOrigin: '50% 50%', duration: 0.35, ease: 'back.out(2.5)' }, 2.5);
  say(tl, root, 0, 1, 0.7);
  tl.to(g, { opacity: 0, scale: 0.9, filter: 'blur(6px)', duration: 0.5 }, 3.1).to(watch, { autoAlpha: 1, duration: 0.01 }, 3.3);
  say(tl, root, 1, 2, 3.1);
  cards.forEach((c, i) => {
    const at = 3.35 + i * 0.22;
    const num = $('.num', c);
    const w = WATCH[i];
    const counter = { v: 0 };
    tl.fromTo(c, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.4, ease: 'back.out(1.8)' }, at)
      .to(counter, { v: w.n, duration: 0.5, onUpdate: () => (num.textContent = `${Math.round(counter.v)}`) }, at + 0.2)
      .to($$('i.h', c), { backgroundColor: '#D93A2E', duration: 0.1, stagger: 0.05 }, at + 0.2);
  });
  tl.to({}, { duration: 0.6 });
});

// -- brigade: each model takes its station

function buildBrigade() {
  const rows = $$('#menu li');
  if (reduced) return;
  rows.forEach((li) => {
    gsap
      .timeline({ scrollTrigger: { trigger: li, start: 'top 88%', once: true } })
      .from($('b', li), { y: 40, opacity: 0, duration: 0.9, ease: 'expo.out' })
      .from($('.mk', li), { scale: 0, rotation: -90, duration: 0.7, ease: 'back.out(2.4)' }, 0)
      .from($(':scope > i', li), { scaleX: 0, duration: 0.9, ease: 'expo.out' }, 0.15)
      .from($(':scope > span:last-child', li), { opacity: 0, x: 20, duration: 0.7, ease: 'expo.out' }, 0.3);
  });
}

// -- creed: three lines that light word by word

scene('creed', 1.8, (tl, root) => {
  const lines = $$('[data-creed]', root);
  lines.forEach((p) => {
    const parts: string[] = [];
    p.childNodes.forEach((n) => {
      const words = (n.textContent ?? '').split(/(\s+)/);
      const wrap = (w: string) => (w.trim() ? `<span class="w">${w}</span>` : w);
      parts.push(n.nodeName === 'EM' ? `<em>${words.map(wrap).join('')}</em>` : words.map(wrap).join(''));
    });
    p.innerHTML = parts.join('');
  });
  tl.to($$('.w', root), { opacity: 1, duration: 0.3, stagger: 0.12, ease: 'none' });
  tl.to({}, { duration: 0.6 });
  if (reduced) gsap.set($$('.w', root), { opacity: 1 });
});

// -- close

function buildClose() {
  const d = $('#close-dish');
  d.append(img(dishUrl(GOLDEN)));
  if (reduced) return;
  gsap.to(d, { rotation: 360, duration: 90, ease: 'none', repeat: -1 });
  gsap.from(d, { scale: 0.7, opacity: 0, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '#try', start: 'top 75%', once: true } });
  gsap.from(['#try h2', ...$$('.ways li')], { y: 40, opacity: 0, duration: 1, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: '#try', start: 'top 70%', once: true } });
}

buildSaid();
buildBrigade();
buildClose();

// fonts and drawn images change heights; measure again once they have landed
document.fonts?.ready.then(() => ScrollTrigger.refresh());
addEventListener('load', () => ScrollTrigger.refresh());

if (import.meta.env.DEV) Object.assign(window, { gsap, ScrollTrigger });
