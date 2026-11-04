// The film's sound effects (scripts/sfx.py): a soft tap under every recorded touch, a pop when a result lands, and the
// bells on the reveal and the end card. Each is placed at a frame of its scene.
import { Audio, Sequence, staticFile } from 'remotion';

import { pieceFrames, type Piece, type TapLog } from './clip';

const LEVEL = { tap: 0.3, pop: 0.22, reveal: 0.55, card: 0.5 } as const;

export function Sfx({ name, at, volume }: { name: keyof typeof LEVEL; at: number; volume?: number }) {
  return (
    <Sequence from={Math.max(0, Math.round(at))} layout="none">
      <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume ?? LEVEL[name]} />
    </Sequence>
  );
}

/** Scene frames of every recorded tap the pieces actually show (a tap in a cut-out stretch makes no sound). */
export function tapFrames(clip: string, pieces: Piece[], logs: Record<string, TapLog | undefined>): number[] {
  const out: number[] = [];
  let start = 0;
  for (const p of pieces) {
    const log = logs[p.clip ?? clip];
    for (const t of log?.taps ?? []) if (t.t >= p.from && t.t < p.to) out.push(start + ((t.t - p.from) / (p.rate ?? 1)) * 30);
    start += pieceFrames(p);
  }
  return out;
}
