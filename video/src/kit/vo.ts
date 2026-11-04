// The voiceover lines' timing (src/vo.json, written by scripts/vo.py from the audio), so a scene's animations land on the
// phrases it speaks and the scene ends just after its line.
import data from '../vo.json';
import { sec } from '../theme';

/** Every line starts this many frames into its scene. */
export const VO_AT = 6;

export function voice(n: number) {
  const v = (data as Record<string, { duration: number; starts: number[] }>)[n];
  return {
    file: `vo/vo-${n}.mp3`,
    /** Frame (from the scene's start) where phrase `i` of the line begins. */
    at: (i: number, offset = 0) => VO_AT + sec(v.starts[Math.min(i, v.starts.length - 1)] + offset),
    /** Frame where the line ends. */
    end: VO_AT + sec(v.duration),
    /** The scene's length: the line plus a breath. */
    frames: VO_AT + sec(v.duration + 0.25),
  };
}
