# python3 scripts/tighten.py
# Copies the ElevenLabs lines (assets/audio/p1–p15.mp3) to public/vo/vo-N.mp3 with long pauses inside a line shortened to
# 0.38 s, so the film fits in three minutes without speeding the voice up. The close (p15) keeps its pauses. Then rerun
# scripts/vo.py.
import re
import subprocess
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SR, KEEP, FADE = 44100, 0.34, int(0.012 * 44100)
UNTOUCHED = {15}

for n in range(1, 16):
    src, dst = ROOT / f'assets/audio/p{n}.mp3', ROOT / f'public/vo/vo-{n}.mp3'
    pcm = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', str(src), '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'],
                                       capture_output=True).stdout, dtype=np.float32).copy()
    log = subprocess.run(['ffmpeg', '-hide_banner', '-i', str(src), '-af', 'silencedetect=noise=-35dB:d=0.3', '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
    gaps = list(zip(map(float, re.findall(r'silence_start: ([\d.]+)', log)), map(float, re.findall(r'silence_end: ([\d.]+)', log))))
    dur = len(pcm) / SR
    out, pos, cut = [], 0, 0.0
    if n not in UNTOUCHED:
        for s, e in gaps:
            if s < 0.05 or e > dur - 0.05 or e - s <= KEEP:
                continue
            # keep the pause's first and last halves of KEEP; drop the middle, with a short fade either side
            a, b = int((s + KEEP / 2) * SR), int((e - KEEP / 2) * SR)
            seg = pcm[pos:a].copy()
            seg[-FADE:] *= np.linspace(1, 0, FADE)
            out.append(seg)
            pos = b
            cut += (b - a) / SR
    tail = pcm[pos:].copy()
    if out:
        tail[:FADE] *= np.linspace(0, 1, FADE)
    out.append(tail)
    y = np.concatenate(out)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-c:a', 'libmp3lame', '-b:a', '192k', str(dst)],
                   input=y.astype(np.float32).tobytes(), check=True)
    print(f'vo-{n}: {dur:5.2f}s → {len(y) / SR:5.2f}s (cut {cut:.2f}s)')
