# python3 record/feeds.py [name ...]
# Turns still photos into camera feeds that look like a real camera being pointed at them: the camera arrives and settles,
# autofocus hunts, exposure settles, the hand drifts, the sensor has grain. Chromium plays each feed as its webcam
# (--use-file-for-fake-video-capture), so the app's real camera mode takes its picture from the feed.
# Writes out/<name>.mjpeg and out/<name>.json (when each take is steady, so the recorder knows when to tap).
import json
import math
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

HERE = Path(__file__).parent
ROOT = HERE.parent.parent
DEMO = ROOT / 'apps/app/assets/images/demo'
GEN = HERE.parent / 'assets/generated'
OUT = HERE / 'out'
FPS = 30
W, H = 1280, 720

# A feed is a list of takes. Each take points the camera at one photo: it arrives (or is already there, for a mounted
# camera), holds for `hold` seconds, then leaves quickly before the next take.
FEEDS = {
    'menu': {
        'mount': 'hand',
        'table': True,
        'zoom': 1.04,
        'takes': [{'photo': DEMO / 'kitchen/menu-printed.jpg', 'hold': 40}],
    },
    'pass': {
        'mount': 'fixed',
        'slide': {'counter': GEN / 'pass/frame-empty.png', 'photo': DEMO / 'chicken-biryani/pass-onions-missing.jpg', 'at': 1.4, 'for': 0.9},
        'takes': [{'photo': DEMO / 'chicken-biryani/pass-onions-missing.jpg', 'hold': 45}],
    },
    # Phone feeds are portrait, as a phone camera held upright gives them.
    'guest': {
        'mount': 'hand',
        'size': (720, 1280),
        'zoom': 1.06,
        'takes': [{'photo': DEMO / 'chicken-biryani/guest-table-7.jpg', 'hold': 40}],
    },
    'larder': {
        'mount': 'hand',
        'size': (720, 1280),
        'zoom': 1.02,
        'takes': [{'photo': DEMO / 'larder/dry-store.jpg', 'hold': 40}],
    },
    'golden': {
        'mount': 'hand',
        'counter': GEN / 'pass/frame-empty.png',
        'takes': [
            {'photo': DEMO / 'chicken-biryani/golden-1.jpg', 'hold': 4.5},
            {'photo': DEMO / 'chicken-biryani/golden-2.jpg', 'hold': 4.5},
            {'photo': DEMO / 'chicken-biryani/golden-3.jpg', 'hold': 30},
        ],
    },
}

ARRIVE, LEAVE = 1.1, 0.45
ZOOM = 1.12  # how far in the settled camera sits, so the hand has room to move inside the photo


def ease(x):
    x = min(max(x, 0.0), 1.0)
    return 1 - (1 - x) ** 3


class Hand:
    """Smooth, slightly irregular drift: a few sines with random phases, like a hand trying to hold still."""

    def __init__(self, seed, amp):
        rng = np.random.default_rng(seed)
        self.parts = [(rng.uniform(0.15, 0.9), rng.uniform(0, 2 * math.pi), rng.uniform(0.4, 1.0)) for _ in range(4)]
        self.amp = amp

    def __call__(self, t):
        return self.amp * sum(a * math.sin(2 * math.pi * f * t + p) for f, p, a in self.parts) / 2.2


def camera(take_t, hold, hands, mount):
    """Where the camera points at take time t: offset (fraction of frame), zoom, roll (degrees), focus blur, exposure."""
    if mount == 'fixed':
        return 0.0, 0.0, ZOOM, 0.0, 0.0, 1.0
    a = ease(take_t / ARRIVE)
    leave = ease((take_t - ARRIVE - hold) / LEAVE) if take_t > ARRIVE + hold else 0.0
    # Leaving: the camera lifts and swings away, so the picture smears and loses focus; the crop never leaves the photo.
    dx = 0.09 * (1 - a) + hands[0](take_t) * 0.004 + leave * -0.12
    dy = -0.06 * (1 - a) + hands[1](take_t) * 0.004 + leave * 0.08
    zoom = ZOOM * (0.97 + 0.03 * a) + leave * 0.25
    roll = 1.6 * (1 - a) + hands[2](take_t) * 0.25
    # Autofocus: soft on arrival, a small hunt past focus, then sharp.
    if take_t < 0.55:
        focus = 7.0 * (1 - take_t / 0.55) + 1.0
    elif take_t < 0.9:
        focus = 2.2 * math.sin((take_t - 0.55) / 0.35 * math.pi)
    else:
        focus = 0.0
    focus += leave * 9
    exposure = 0.82 + 0.18 * ease(take_t / 0.8) + leave * 0.12
    return dx, dy, zoom, roll, focus, exposure


def render(src, dx, dy, zoom, roll):
    """Crop the photo through a virtual camera, with sub-pixel motion, and fill the frame."""
    sw, sh = src.size
    cover = max(W / sw, H / sh) * zoom
    # Keep the crop (with room for the roll) inside the photo, so no edge ever shows.
    r = math.radians(abs(roll))
    hw = (W / 2 * math.cos(r) + H / 2 * math.sin(r)) / cover
    hh = (W / 2 * math.sin(r) + H / 2 * math.cos(r)) / cover
    cx = min(max(sw / 2 + dx * W / cover, hw), sw - hw)
    cy = min(max(sh / 2 + dy * H / cover, hh), sh - hh)
    r = math.radians(roll)
    c, s = math.cos(r) / cover, math.sin(r) / cover
    # Output pixel (x, y) samples source (a*x + b*y + c0, d*x + e*y + f0).
    ox, oy = W / 2, H / 2
    coeffs = (c, s, cx - c * ox - s * oy, -s, c, cy + s * ox - c * oy)
    return src.transform((W, H), Image.AFFINE, coeffs, resample=Image.BICUBIC, fillcolor=(18, 18, 20))


def on_counter(photo, counter):
    """Places a tight photo in the middle of the matching empty counter with feathered edges, so the camera can pull back."""
    bg = Image.open(counter).convert('RGB')
    fg = photo.resize((round(photo.width * bg.width / 1920), round(photo.height * bg.width / 1920)), Image.LANCZOS)
    m = np.ones((fg.height, fg.width), np.float32)
    f = 70
    ramp = np.linspace(0, 1, f, dtype=np.float32)
    m[:, :f] *= ramp
    m[:, -f:] *= ramp[::-1]
    m[:f, :] *= ramp[:, None]
    m[-f:, :] *= ramp[::-1, None]
    mask = Image.fromarray((m * 255).astype(np.uint8))
    bg.paste(fg, ((bg.width - fg.width) // 2, (bg.height - fg.height) // 2), mask)
    return bg


def grade(px):
    """A tablet camera's preview, not a food photo: colour pulled back, blacks lifted a little, contrast softened, white
    balance a touch cool under kitchen LEDs."""
    lum = 0.299 * px[..., 0] + 0.587 * px[..., 1] + 0.114 * px[..., 2]
    px = lum[..., None] + (px - lum[..., None]) * 0.74
    px = 0.5 + (px - 0.5) * 0.9
    px = 0.035 + px * 0.95
    return px * np.array([0.985, 1.0, 1.025], np.float32)


def on_table(photo):
    """The printed page lifted off its photo and laid on a wider wooden table (Muse Image), with a soft shadow under it,
    so a landscape camera has table on both sides of a portrait menu."""
    px = np.asarray(photo.convert('L'), np.float32)
    rows, cols = np.where(px > 200)
    box = (int(np.percentile(cols, 0.5)), int(np.percentile(rows, 0.5)), int(np.percentile(cols, 99.5)), int(np.percentile(rows, 99.5)))
    card = photo.crop(box)
    ch = round(card.height * 1.42)
    cw = round(ch * 16 / 9)
    bg = Image.open(GEN / 'menu/table.png').convert('RGB').resize((cw, ch), Image.LANCZOS)
    x, y = (cw - card.width) // 2, (ch - card.height) // 2
    shadow = Image.new('L', (cw, ch), 0)
    shadow.paste(255, (x + 10, y + 16, x + card.width + 10, y + card.height + 16))
    shadow = shadow.filter(ImageFilter.GaussianBlur(22))
    bg = Image.composite(Image.new('RGB', (cw, ch), (40, 26, 16)), bg, shadow.point(lambda v: int(v * 0.55)))
    bg.paste(card, (x, y))
    return bg


def plate_mask(photo_file, size):
    """The plate and its bowl, from the SAM 3.1 outlines saved next to the photo."""
    import json, re
    from PIL import ImageDraw
    sam = json.loads(Path(str(photo_file).rsplit('.', 1)[0] + '.sam.json').read_text())
    k = size[0] / sam['size']['w']
    img = Image.new('L', size, 0)
    d = ImageDraw.Draw(img)
    paths = [sam['plate']['path']] + [x for p in sam['parts'] if p['name'] == 'Raita bowl' and p['found'] for x in p['paths']]
    for path in paths:
        for ring in re.findall(r'M[^M]+', path):
            pts = [(float(x) * k, float(y) * k) for x, y in re.findall(r'(-?[\d.]+)[ ,](-?[\d.]+)', ring)]
            if len(pts) > 2:
                d.polygon(pts, fill=255)
    return img.filter(ImageFilter.GaussianBlur(2))


def slide_frames(spec):
    """A mounted camera over an empty counter; the plate slides in from the bottom edge and settles. Returns a function
    from time to the frame's source image."""
    sl = spec['slide']
    photo = Image.open(sl['photo']).convert('RGB')
    bg = Image.open(sl['counter']).convert('RGB').resize(photo.size, Image.LANCZOS)
    mask = plate_mask(sl['photo'], photo.size)
    shadow = mask.filter(ImageFilter.GaussianBlur(18)).point(lambda v: int(v * 0.45))

    def at(t):
        p = ease((t - sl['at']) / sl['for'])
        if t < sl['at']:
            return bg
        dy = round((1 - p) * photo.height * 0.75)
        out = bg.copy()
        out.paste((30, 30, 34), (0, dy + 14), shadow)
        out.paste(photo, (0, dy), mask)
        if p < 1:
            out = out.filter(ImageFilter.BoxBlur(min(8, (1 - p) * 14)))
        return out
    return at


def vignette():
    y, x = np.mgrid[0:H, 0:W]
    d = np.sqrt(((x - W / 2) / (W / 2)) ** 2 + ((y - H / 2) / (H / 2)) ** 2)
    return (1 - 0.22 * np.clip(d - 0.35, 0, 1) ** 1.6)[..., None]


def make(name, spec):
    global W, H
    W, H = spec.get('size', (1280, 720))
    OUT.mkdir(exist_ok=True)
    rng = np.random.default_rng(7)
    vig = vignette()
    takes = spec['takes']
    mount = spec['mount']
    starts, t0 = [], 0.0
    for tk in takes:
        starts.append(t0)
        t0 += (0 if mount == 'fixed' else ARRIVE) + tk['hold'] + (0 if mount == 'fixed' else LEAVE)
    total = t0
    srcs = [Image.open(tk['photo']).convert('RGB') for tk in takes]
    if spec.get('counter'):
        srcs = [on_counter(x, spec['counter']) for x in srcs]
    if spec.get('table'):
        srcs = [on_table(x) for x in srcs]
    global ZOOM
    ZOOM = spec.get('zoom', 1.12 if mount == 'hand' else 1.02)
    slide = slide_frames(spec) if spec.get('slide') else None
    hands = [Hand(i + 1, 1.0) for i in range(3)]
    ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS),
                           '-i', '-', '-c:v', 'mjpeg', '-q:v', '3', '-pix_fmt', 'yuvj420p', str(OUT / f'{name}.mjpeg')], stdin=subprocess.PIPE)
    prev = None
    for n in range(int(total * FPS)):
        t = n / FPS
        k = max(i for i, s in enumerate(starts) if s <= t)
        tt = t - starts[k]
        dx, dy, zoom, roll, focus, exposure = camera(tt, takes[k]['hold'], hands, mount)
        frame = render(slide(t) if slide else srcs[k], dx, dy, zoom, roll)
        # Motion blur while the camera moves fast: blend with the previous position.
        if prev is not None:
            speed = math.hypot(dx - prev[0], dy - prev[1]) * W
            if speed > 6:
                frame = Image.blend(frame, render(srcs[k], (dx + prev[0]) / 2, (dy + prev[1]) / 2, zoom, roll), 0.5)
                frame = frame.filter(ImageFilter.BoxBlur(min(speed / 10, 6)))
        prev = (dx, dy)
        if focus > 0.2:
            frame = frame.filter(ImageFilter.GaussianBlur(focus))
        px = np.asarray(frame, dtype=np.float32) / 255
        px = grade(px * exposure * vig)
        px += rng.normal(0, 0.012, (H, W, 1)).astype(np.float32)  # sensor grain, luminance only
        ff.stdin.write((np.clip(px, 0, 1) * 255).astype(np.uint8).tobytes())
    ff.stdin.close()
    ff.wait()
    # When each take is settled and sharp: the recorder taps the shutter inside these windows.
    steady = [{'photo': tk['photo'].name, 'from': round(s + (0 if mount == 'fixed' else ARRIVE) + 0.3, 2),
               'to': round(s + (0 if mount == 'fixed' else ARRIVE) + tk['hold'], 2)} for s, tk in zip(starts, takes)]
    (OUT / f'{name}.json').write_text(json.dumps({'fps': FPS, 'size': [W, H], 'duration': round(total, 2), 'steady': steady}, indent=2))
    print(f'✓ {name}: {total:.1f}s, {len(takes)} takes')


for name in sys.argv[1:] or FEEDS:
    make(name, FEEDS[name])
