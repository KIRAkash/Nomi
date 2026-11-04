# python3 scripts/music.py
# The film's score, synthesised: a light, happy groove in D major at 112 BPM. Marimba chords and a soft bass under the
# problem, a glockenspiel flourish on the Nomi reveal, then claps, shaker and a bouncing bass through the demo with a
# short melody every few bars, and a warm final chord on the end card. No risers or impacts; the sound effects are their
# own files (scripts/sfx.py) placed in the scenes. Cut to the scene times below. Writes public/music.wav.
import wave
from pathlib import Path

import numpy as np

SR = 48000
BPM = 112
BEAT = 60 / BPM
BAR = BEAT * 4
# Scene starts in the film (seconds). Regenerate when the timeline changes.
REVEAL, DEMO, CLOSE, CARD, END = 15.97, 24.34, 165.48, 175.95, 179.7

rng = np.random.default_rng(5)
n = int((END + 3) * SR)
L = np.zeros(n)
R = np.zeros(n)


def t_(sec):
    return np.arange(int(sec * SR)) / SR


def hz(m):
    return 440 * 2 ** ((m - 69) / 12)


def add(sig, at, pan=0.0, gain=1.0):
    i = int(at * SR)
    if i >= n:
        return
    sig = sig[: n - i]
    L[i:i + len(sig)] += sig * gain * np.sqrt(0.5 * (1 - pan))
    R[i:i + len(sig)] += sig * gain * np.sqrt(0.5 * (1 + pan))


def fftconv(x, h):
    m = len(x) + len(h) - 1
    k = 1 << (m - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, k) * np.fft.rfft(h, k), k)[:m]


def lowpass(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    return fftconv(x, (1 - a) * a ** np.arange(int(SR * 0.04)))[: len(x)]


def marimba(m, length=0.7, gain=0.2):
    t = t_(length)
    f = hz(m)
    x = np.sin(2 * np.pi * f * t) * np.exp(-t * 5.5) + 0.35 * np.sin(2 * np.pi * f * 3.93 * t) * np.exp(-t * 22)
    x += 0.12 * np.sin(2 * np.pi * f * 9.2 * t) * np.exp(-t * 60)
    return x * gain


def glock(m, length=1.4, gain=0.12):
    t = t_(length)
    f = hz(m)
    x = np.sin(2 * np.pi * f * t) * np.exp(-t * 3.2) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 7)
    x += 0.15 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 14)
    return x * np.minimum(1, t / 0.002) * gain


def bass(m, length, gain=0.2):
    t = t_(length)
    f = hz(m)
    x = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t)
    return x * np.minimum(1, t / 0.005) * np.exp(-t * 3) * np.minimum(1, (length - t) / 0.03) * gain


def pad(midis, length, gain=0.05):
    t = t_(length)
    x = sum(np.sin(2 * np.pi * hz(m + d) * t) for m in midis for d in (-0.05, 0.05)) / (2 * len(midis))
    env = np.minimum(1, t / 0.6) * np.minimum(1, (length - t) / 0.8)
    return x * env * gain


def kick(gain=0.32):
    t = t_(0.3)
    return np.sin(2 * np.pi * np.cumsum(50 + 70 * np.exp(-t * 30)) / SR) * np.exp(-t * 11) * gain


def clap(gain=0.11):
    t = t_(0.18)
    x = rng.normal(0, 1, len(t))
    x = x - lowpass(x, 900)
    env = sum(np.exp(-np.maximum(0, t - d) * 60) * (t >= d) for d in (0, 0.011, 0.022))
    return x * env * gain / 3


def shaker(gain=0.035):
    t = t_(0.07)
    x = rng.normal(0, 1, len(t))
    x = x - lowpass(x, 5000)
    return x * np.sin(np.pi * t / 0.07) ** 2 * gain


# I–V–vi–IV: D, A, Bm, G, one bar each. Chord tones for the marimba, roots for the bass.
CHORDS = [[62, 66, 69], [61, 64, 69], [59, 62, 66], [59, 62, 67]]
ROOTS = [38, 33, 35, 31]
# A short, happy glockenspiel phrase over four bars (beats from the first bar's start, MIDI notes), D major pentatonic.
MELODY = [(0, 74), (0.5, 76), (1, 78), (2, 81), (3, 78), (4, 76), (4.5, 78), (5, 74), (6, 71), (8, 74), (8.5, 76), (9, 78),
          (10, 81), (11, 83), (12, 81), (13, 78), (14, 76), (15, 74)]


def bar_at(k, start):
    return start + k * BAR


# The problem: soft marimba chords on the beat and a quiet bass, no drums.
k = 0
while bar_at(k, 0) < REVEAL - 0.2:
    at = bar_at(k, 0)
    ch = k % 4
    for b in range(4):
        add(marimba(CHORDS[ch][b % 3] - 12 if b % 2 else CHORDS[ch][b % 3], 0.8, 0.15), at + b * BEAT, pan=-0.2 + 0.13 * b)
    add(bass(ROOTS[ch], BEAT * 1.8, 0.14), at)
    add(pad(CHORDS[ch], BAR * 1.05, 0.04), at)
    k += 1

# The reveal: the chord rings and a light marimba pulse waits for the demo; the bells themselves are sfx/reveal.wav.
add(pad([62, 66, 69, 74], DEMO - REVEAL + 0.5, 0.06), REVEAL)
for b in range(int((DEMO - REVEAL) / BEAT)):
    add(marimba(CHORDS[0][b % 3] + 12, 0.6, 0.1), REVEAL + 1.2 + b * BEAT, pan=0.25 if b % 2 else -0.25)

# The demo: the groove. Kick on 1 and 3, claps on 2 and 4, swung shaker, bouncing bass, marimba off-beats, and the
# melody every other four bars.
k = 0
while bar_at(k, DEMO) < CLOSE - 0.1:
    at = bar_at(k, DEMO)
    ch = k % 4
    for b in range(4):
        if b in (0, 2):
            add(kick(), at + b * BEAT)
        else:
            add(clap(), at + b * BEAT, pan=0.1)
        for s in range(4):
            add(shaker(0.03 if s % 2 else 0.042), at + b * BEAT + s * BEAT / 4 + (0.018 if s % 2 else 0), pan=0.45)
        add(bass(ROOTS[ch] + (7 if b == 3 else 0), BEAT * 0.8), at + b * BEAT)
        add(marimba(CHORDS[ch][(b + 1) % 3], 0.5, 0.11), at + b * BEAT + BEAT / 2, pan=-0.35)
    add(pad(CHORDS[ch], BAR * 1.02, 0.035), at)
    if (k // 4) % 2 == 1 and k % 4 == 0:
        for beat, m in MELODY:
            if at + beat * BEAT < CLOSE:
                add(glock(m, 1.0, 0.075), at + beat * BEAT, pan=0.2)
    k += 1

# The close: drums drop out, marimba and pad carry the last lines; a bright chord rings under the end card.
k = 0
while bar_at(k, CLOSE) < CARD:
    at = bar_at(k, CLOSE)
    ch = k % 4
    for b in range(4):
        add(marimba(CHORDS[ch][b % 3], 0.8, 0.12), at + b * BEAT, pan=-0.2 + 0.13 * b)
    add(bass(ROOTS[ch], BEAT * 2, 0.12), at)
    add(pad(CHORDS[ch], BAR * 1.05, 0.05), at)
    k += 1
add(pad([50, 62, 66, 69, 74, 78], END - CARD + 1.5, 0.09), CARD)
for i, m in enumerate([62, 66, 69, 74]):
    add(marimba(m, 1.6, 0.16), CARD + i * 0.03)

# A small room, then level it.
ir = rng.normal(0, 1, int(SR * 1.6)) * np.exp(-np.arange(int(SR * 1.6)) / SR * 3.6) * 0.015
L = L + fftconv(L, ir)[:n] * 0.5
R = R + fftconv(R, ir[::-1].copy())[:n] * 0.5
out = np.stack([L, R], 1)[: int((END + 1) * SR)]
fade = np.ones(len(out))
fade[-SR * 2:] = np.linspace(1, 0, SR * 2)
out *= fade[:, None]
out = out / np.max(np.abs(out)) * 0.89

path = Path(__file__).resolve().parent.parent / 'public/music.wav'
with wave.open(str(path), 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((out * 32767).astype('<i2').tobytes())
print(f'✓ music: {len(out) / SR:.1f}s → public/music.wav')
