# python3 scripts/vo.py
# Reads every voiceover line in public/vo and writes src/vo.json: each file's length and the start of each spoken phrase
# (speech after a pause of 0.18 s or more), so scenes time their animations to the words. Rerun when the audio changes.
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
out = {}
for f in sorted((ROOT / 'public/vo').glob('vo-*.mp3'), key=lambda p: int(p.stem[3:])):
    n = int(f.stem[3:])
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(f)],
                               capture_output=True, text=True).stdout)
    log = subprocess.run(['ffmpeg', '-hide_banner', '-i', str(f), '-af', 'silencedetect=noise=-35dB:d=0.18', '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
    ends = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', log)]
    first = re.findall(r'silence_start: ([\d.]+)', log)
    starts = [0.0 if not first or float(first[0]) > 0.05 else None] + ends
    starts = [round(s, 2) for s in starts if s is not None and s < dur - 0.1]
    out[n] = {'duration': round(dur, 2), 'starts': starts}
(ROOT / 'src/vo.json').write_text(json.dumps(out, indent=1))
for n, v in out.items():
    print(f'vo-{n}: {v["duration"]:5.2f}s  phrases at {v["starts"]}')
