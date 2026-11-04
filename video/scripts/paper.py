# python3 scripts/paper.py
# The film's background: light yellow in the top-left corner fading to white, under a fine still grain (the "Paper"
# option, texture 100%, yellow 100%). Writes public/bg/paper.png at 1920 x 1080.
from pathlib import Path

import numpy as np
from PIL import Image

W, H = 1920, 1080
YELLOW = np.array([255, 240, 194], float)

rng = np.random.default_rng(1)
x = np.arange(W)[None, :] / W
y = np.arange(H)[:, None] / H
g = np.clip(1 - x * 0.6 - y * 0.5, 0, 1)
g = g * g * (3 - 2 * g)
base = 255 + (YELLOW - 255)[None, None, :] * g[..., None]
n = (rng.random((H, W)) + rng.random((H, W)) + rng.random((H, W)) - 1.5) * 2 * 9
img = base + n[..., None] * np.array([1, 1, 1.08])
out = Path(__file__).resolve().parent.parent / 'public/bg/paper.png'
Image.fromarray(np.clip(np.round(img), 0, 255).astype(np.uint8)).save(out, optimize=True)
print(f'✓ paper → {out.relative_to(out.parents[2])}')
