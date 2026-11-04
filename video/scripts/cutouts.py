# python3 scripts/cutouts.py
# Cuts plates and their parts out of the photos with the outlines SAM 3.1 returned (.sam.json next to each photo), so the
# video's plate breakdowns show what the model actually found. Writes transparent PNGs to public/plates/<name>/.
import json
import re
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
GEN = ROOT / 'assets/generated'
OUT = ROOT / 'public/plates'
SHORT = {'Rice': 'rice', 'Chicken pieces': 'chicken', 'Fried onions': 'onions', 'Lemon wedge': 'lemon', 'Raita bowl': 'raita'}

PHOTOS = {
    'golden': GEN / 'hero/golden.png',
    'drift-1': GEN / 'hero/drift-1.png',
    'drift-2': GEN / 'hero/drift-2.png',
    'drift-3': GEN / 'hero/drift-3.png',
    'drift-4': GEN / 'hero/drift-4.png',
}


def mask(paths, size, scale):
    """Solid fill of SVG M/L/Z paths: every ring is filled, so leaves on the rice and the raita inside its bowl stay in."""
    m = np.zeros((size[1], size[0]), bool)
    for d in paths:
        for ring in re.findall(r'M[^M]+', d):
            pts = [(float(x) * scale, float(y) * scale) for x, y in re.findall(r'(-?[\d.]+)[ ,](-?[\d.]+)', ring)]
            if len(pts) < 3:
                continue
            img = Image.new('1', size, 0)
            ImageDraw.Draw(img).polygon(pts, fill=1)
            m |= np.asarray(img, bool)
    return m


def save(photo, m, file):
    """A soft 1.5 px edge, then crop to the photo's full frame so every layer lines up when stacked."""
    a = Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.5))
    out = photo.copy()
    out.putalpha(a)
    out.save(file, optimize=True)


for name, file in PHOTOS.items():
    sam = json.loads(file.with_suffix('.sam.json').read_text())
    photo = Image.open(file).convert('RGB')
    scale = photo.width / sam['size']['w']
    (OUT / name).mkdir(parents=True, exist_ok=True)
    plate = mask([sam['plate']['path']], photo.size, scale)
    parts = {SHORT[p['name']]: mask(p['paths'], photo.size, scale) for p in sam['parts'] if p['found']}
    raita = parts.get('raita', np.zeros_like(plate))
    save(photo, plate | raita, OUT / name / 'dish.png')
    save(photo, plate, OUT / name / 'plate.png')
    if name == 'golden':
        food = np.zeros_like(plate)
        for k, m in parts.items():
            if k != 'raita':
                save(photo, m & ~food, OUT / name / f'{k}.png')
                food |= m
        save(photo, raita, OUT / name / 'raita.png')
        save(Image.open(GEN / 'hero/empty.png').convert('RGB').resize(photo.size), plate, OUT / name / 'empty.png')
    print(f'✓ {name}: {", ".join(parts)}')

# Where each part sits, for labels and highlight rings: centre and radius in photo pixels.
info = {}
for name, file in PHOTOS.items():
    sam = json.loads(file.with_suffix('.sam.json').read_text())
    s = Image.open(file).width / sam['size']['w']
    info[name] = {
        'size': [round(sam['size']['w'] * s), round(sam['size']['h'] * s)],
        'plate': {'cx': float(sam['plate']['cx']) * s, 'cy': float(sam['plate']['cy']) * s, 'r': float(sam['plate']['r']) * s},
        'parts': {SHORT[p['name']]: {'found': p['found'], 'count': p.get('count'), 'share': p.get('share'), 'centre': [c * s for c in p['centre']] if p.get('centre') else None}
                  for p in sam['parts']},
    }
(OUT / 'plates.json').write_text(json.dumps(info, indent=1))
