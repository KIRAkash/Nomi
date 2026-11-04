// The layout every demo scene shares: the live recording on a device on the left, turning slightly toward the right half
// where the animation of what's happening underneath plays, the voice line, and the model rail along the bottom.
import type { ReactNode } from 'react';
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame } from 'remotion';

import { Clip, type Piece, type TapLog } from './clip';
import { Device, deviceSize, type Kind } from './device';
import { ModelRail, type Model } from './models';
import { Stage, ramp } from './motion';
import { Sfx, tapFrames } from './sfx';

export function DemoScene({ kind, clip, pieces, taps, more, vo, voAt, voFrom = 0, active, children }: {
  kind: Kind; clip: string; pieces: Piece[]; taps?: TapLog; more?: Record<string, TapLog>;
  /** Voiceover file number, the frame it starts, and how far into the file (seconds) it starts from. */
  vo: number; voAt: number; voFrom?: number;
  /** Which models are lit in the rail at each frame. */
  active: (f: number) => Model[];
  children: ReactNode;
}) {
  const f = useCurrentFrame();
  const enter = ramp(f, 0, 30);
  const tablet = kind === 'tablet';
  const width = tablet ? 1000 : 400;
  const { height } = deviceSize(kind, width);
  return (
    <Stage>
      <Sequence from={voAt} layout="none"><Audio src={staticFile(`vo/vo-${vo}.mp3`)} startFrom={Math.round(voFrom * 30)} /></Sequence>
      <AbsoluteFill style={{ left: tablet ? 56 : 230, top: tablet ? 128 : (960 - height) / 2 }}>
        <div style={{ transform: `translateX(${(1 - enter) * -120}px) translateY(${Math.sin(f / 52) * 9}px)`, opacity: enter }}>
          <Device kind={kind} width={width} rx={(tablet ? 5 : 3) + Math.sin(f / 71) * 1.6} ry={interpolate(enter, [0, 1], [28, tablet ? 14 : 12]) + Math.sin(f / 46) * 3.2}>
            <Clip name={clip} kind={kind} pieces={pieces} taps={taps} more={more} />
          </Device>
        </div>
      </AbsoluteFill>
      {tapFrames(clip, pieces, { [clip]: taps, ...more }).map((at, i) => <Sfx key={i} name="tap" at={at} />)}
      {children}
      <ModelRail active={active(f)} at={-200} idle="dim" />
    </Stage>
  );
}

/** The right half's left edge, for each device. */
export const PANEL = { tablet: 1140, phone: 800 } as const;
