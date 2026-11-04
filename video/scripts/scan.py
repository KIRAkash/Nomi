# python3 scripts/scan.py out/nomi-raw.mp4 [--fix]
# Finds frames Chrome painted badly while rendering (part of the picture missing or tiled for one frame): a frame far from
# both neighbours while the neighbours match each other. With --fix, re-renders each one on its own with remotion still and
# swaps it into the video.
import subprocess, sys, tempfile
from pathlib import Path

import numpy as np

f, W, H = sys.argv[1], 160, 90
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-vf', f'scale={W}:{H},format=gray', '-f', 'rawvideo', '-'], capture_output=True).stdout
v = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.int16)
bad = []
for i in range(1, len(v) - 1):
    a = np.abs(v[i] - v[i - 1]).mean(); b = np.abs(v[i] - v[i + 1]).mean(); c = np.abs(v[i - 1] - v[i + 1]).mean()
    if a > 4 and b > 4 and c < 0.5 * min(a, b):
        bad.append(i)
print(f'{len(v)} frames; {len(bad)} bad at', [round(i / 30, 2) for i in bad])

if '--fix' in sys.argv and bad:
    tmp = Path(tempfile.mkdtemp())
    for i in bad:
        subprocess.run(['npx', 'remotion', 'still', 'build', 'Nomi', str(tmp / f'{i}.png'), f'--frame={i}', '--log=error'], check=True)
    # Lay each re-rendered frame over the video on exactly its frame, then re-encode once.
    inputs, chain, last = ['-i', f], [], '0:v'
    for k, i in enumerate(bad):
        inputs += ['-i', str(tmp / f'{i}.png')]
        chain.append(f"[{last}][{k + 1}:v]overlay=enable='eq(n\\,{i})'[v{k}]")
        last = f'v{k}'
    out = str(Path(f).with_suffix('.fixed.mp4'))
    subprocess.run(['ffmpeg', '-v', 'error', '-y', *inputs, '-filter_complex', ';'.join(chain), '-map', f'[{last}]', '-map', '0:a',
                    '-c:v', 'libx264', '-crf', '14', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-c:a', 'copy', out], check=True)
    Path(out).replace(f)
    print(f'✓ re-rendered {len(bad)} frames into {f}')
