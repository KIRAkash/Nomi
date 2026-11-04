// The film and each of its scenes as its own composition, so every scene can be previewed and rendered alone.
import { Audio, Composition, interpolate, Series, staticFile } from 'remotion';

import { ASK, Ask } from './scenes/Ask';
import { BRIEFING, Briefing } from './scenes/Briefing';
import { CARDS, Cards } from './scenes/Cards';
import { CLOSE, Close, ME_AT } from './scenes/Close';
import { GOLDEN, Golden } from './scenes/Golden';
import { GUEST, Guest } from './scenes/Guest';
import { HANDOVER, Handover } from './scenes/Handover';
import { LOG, Log } from './scenes/Log';
import { MANAGER, Manager } from './scenes/Manager';
import { MENU, Menu } from './scenes/Menu';
import { PASS, Pass } from './scenes/Pass';
import { PROBLEM, Problem } from './scenes/Problem';
import { REVEAL, Reveal } from './scenes/Reveal';
import { RULES, Rules } from './scenes/Rules';
import { STOCK, Stock } from './scenes/Stock';
import { FPS, H, W } from './theme';

const SCENES = [
  { id: 'Problem', component: Problem, frames: PROBLEM },
  { id: 'Reveal', component: Reveal, frames: REVEAL },
  { id: 'Menu', component: Menu, frames: MENU },
  { id: 'Golden', component: Golden, frames: GOLDEN },
  { id: 'Rules', component: Rules, frames: RULES },
  { id: 'Pass', component: Pass, frames: PASS },
  { id: 'Guest', component: Guest, frames: GUEST },
  { id: 'Manager', component: Manager, frames: MANAGER },
  { id: 'Briefing', component: Briefing, frames: BRIEFING },
  { id: 'Stock', component: Stock, frames: STOCK },
  { id: 'Handover', component: Handover, frames: HANDOVER },
  { id: 'Cards', component: Cards, frames: CARDS },
  { id: 'Ask', component: Ask, frames: ASK },
  { id: 'Log', component: Log, frames: LOG },
  { id: 'Close', component: Close, frames: CLOSE },
];

// The score sits under the voice, and comes up where there is none: the reveal and the end card.
const TOTAL = SCENES.reduce((n, s) => n + s.frames, 0);
const REVEAL_AT = PROBLEM, DEMO_AT = PROBLEM + REVEAL;
// Akash's clip on the end card, from the film's start; the score dips under his voice.
const ME = TOTAL - CLOSE + ME_AT, CARD_AT = ME - 34;
const music = (f: number) => interpolate(f, [0, 20, REVEAL_AT - 6, REVEAL_AT + 9, DEMO_AT - 14, DEMO_AT + 6, CARD_AT - 18, CARD_AT, ME - 8, ME, TOTAL - 6, TOTAL],
  [0, 0.3, 0.3, 0.45, 0.45, 0.24, 0.24, 0.5, 0.5, 0.1, 0.1, 0], { extrapolateRight: 'clamp' });

function Film() {
  return (
    <>
    <Audio src={staticFile('music.wav')} volume={music} />
    <Series>
      {SCENES.map((s) => (
        <Series.Sequence key={s.id} durationInFrames={s.frames}>
          <s.component />
        </Series.Sequence>
      ))}
    </Series>
    </>
  );
}

export function Root() {
  return (
    <>
      <Composition id="Nomi" component={Film} durationInFrames={TOTAL} fps={FPS} width={W} height={H} />
      {SCENES.map((s) => <Composition key={s.id} id={s.id} component={s.component} durationInFrames={s.frames} fps={FPS} width={W} height={H} />)}
    </>
  );
}
