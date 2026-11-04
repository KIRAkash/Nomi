# python3 scripts/sfx.py
# The film's few sound effects, synthesised to sit under the voice: a soft fingertip tap for every recorded touch, a light
# pop when a result lands, and two bell chimes (the Nomi reveal and the end card). Writes public/sfx/*.wav.
import wave
from pathlib import Path

import numpy as np

SR = 48000
rng = np.random.default_rng(9)
OUT = Path(__file__).resolve().parent.parent / 'public/sfx'
OUT.mkdir(exist_ok=True)


def t_(sec):
    return np.arange(int(sec * SR)) / SR


def hz(m):
    return 440 * 2 ** ((m - 69) / 12)


def bell(m, length, gain):
    t = t_(length)
    f = hz(m)
    x = np.sin(2 * np.pi * f * t) * np.exp(-t * 2.4) + 0.45 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 5.5)
    x += 0.18 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 11)
    return x * np.minimum(1, t / 0.002) * gain


def place(parts, length):
    y = np.zeros(int(length * SR))
    for at, sig in parts:
        i = int(at * SR)
        y[i:i + len(sig)] += sig[: len(y) - i]
    return y


def save(name, y):
    y = y / np.max(np.abs(y)) * 0.8
    with wave.open(str(OUT / f'{name}.wav'), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((y * 32767).astype('<i2').tobytes())
    print(f'✓ sfx/{name}.wav {len(y) / SR:.2f}s')


# A fingertip on glass: a very short soft knock, mostly low-mid, no click.
t = t_(0.06)
knock = np.sin(2 * np.pi * np.cumsum(420 - 180 * t / 0.06) / SR) * np.exp(-t * 90)
save('tap', knock + rng.normal(0, 0.02, len(t)) * np.exp(-t * 200))

# A result landing: a round pop that rises a fifth.
t = t_(0.16)
pop = np.sin(2 * np.pi * np.cumsum(hz(74) + (hz(81) - hz(74)) * np.minimum(1, t / 0.05)) / SR) * np.exp(-t * 28)
save('pop', pop * np.minimum(1, t / 0.003))

# The reveal: four bells rising through D major, then a high sparkle.
save('reveal', place([(i * 0.09, bell(m, 2.4, 0.5)) for i, m in enumerate([74, 78, 81, 86])] + [(0.42, bell(93, 1.6, 0.18))], 2.9))

# The end card: one warm chord of bells.
save('card', place([(i * 0.025, bell(m, 3.2, 0.4)) for i, m in enumerate([62, 69, 74, 78])], 3.4))
