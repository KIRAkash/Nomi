// A recording played on a device screen in pieces: each piece runs a stretch of a clip at its own speed (long model waits
// run fast, or are cut), with the recorded taps drawn where and when they happened. A piece can come from another clip,
// so one device can go from one screen's recording to the next.
import { OffthreadVideo, Sequence, staticFile, useCurrentFrame } from 'remotion';

import { FPS } from '../theme';
import { SCREENS, Taps, type Kind } from './device';

export type Piece = { from: number; to: number; rate?: number; clip?: string };
export type TapLog = { size: number[]; taps: { t: number; x: number; y: number; hold?: number }[] };

export const pieceFrames = (p: Piece) => Math.round(((p.to - p.from) / (p.rate ?? 1)) * FPS);
export const clipFrames = (pieces: Piece[]) => pieces.reduce((n, p) => n + pieceFrames(p), 0);

/** The piece showing at scene frame `f`, and the clip time (seconds) within it. */
function at(pieces: Piece[], f: number) {
  let start = 0;
  for (const p of pieces) {
    const n = pieceFrames(p);
    if (f < start + n) return { piece: p, t: p.from + ((f - start) / FPS) * (p.rate ?? 1) };
    start += n;
  }
  const last = pieces.at(-1)!;
  return { piece: last, t: last.to };
}
export const clipTime = (pieces: Piece[], f: number) => at(pieces, f).t;

/** Scene frame at which clip time `t` is shown (for timing animations to things that happen in the recording). */
export function sceneFrame(pieces: Piece[], t: number, clip?: string) {
  let start = 0;
  for (const p of pieces) {
    if ((clip === undefined || p.clip === clip) && t >= p.from && t <= p.to) return start + Math.round(((t - p.from) / (p.rate ?? 1)) * FPS);
    start += pieceFrames(p);
  }
  return start;
}

export function Clip({ name, kind, pieces, taps, more }: {
  name: string; kind: Kind; pieces: Piece[]; taps?: TapLog;
  /** Tap logs for the other clips the pieces use, by clip name. */
  more?: Record<string, TapLog>;
}) {
  const frame = useCurrentFrame();
  const s = SCREENS[kind];
  const now = at(pieces, frame);
  const log = now.piece.clip && now.piece.clip !== name ? more?.[now.piece.clip] : taps;
  let start = 0;
  return (
    <div style={{ position: 'absolute', inset: 0, width: s.w, height: s.h }}>
      {pieces.map((p, i) => {
        const n = pieceFrames(p);
        const seq = (
          <Sequence key={i} from={start} durationInFrames={n} layout="none">
            <OffthreadVideo src={staticFile(`clips/${p.clip ?? name}.mp4`)} muted startFrom={Math.round(p.from * FPS)} playbackRate={p.rate ?? 1}
              style={{ position: 'absolute', inset: 0, width: s.w, height: s.h }} />
          </Sequence>
        );
        start += n;
        return seq;
      })}
      {log && <Taps taps={log.taps} now={now.t} dpr={log.size[0] / s.w} />}
    </div>
  );
}

/**
 * A close-up of the same recording: the region [x, y, w, h] of the screen (in screen points) blown up to `width` px wide,
 * so a result on the phone can be read at film size. Plays in step with the device beside it.
 */
export function Zoom({ name, kind, pieces, region, width, style }: {
  name: string; kind: Kind; pieces: Piece[]; region: [number, number, number, number]; width: number; style?: React.CSSProperties;
}) {
  const [x, y, w, h] = region;
  const k = width / w;
  return (
    <div style={{ position: 'relative', width, height: h * k, overflow: 'hidden', borderRadius: 26, background: '#FFF7E6', boxShadow: '0 30px 70px rgba(70,50,10,0.22)', ...style }}>
      <div style={{ position: 'absolute', left: -x * k, top: -y * k, transform: `scale(${k})`, transformOrigin: '0 0' }}>
        <Clip name={name} kind={kind} pieces={pieces} />
      </div>
    </div>
  );
}
