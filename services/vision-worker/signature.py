"""Plate signatures from component masks, and scoring a plate against its Golden Plate.

Everything here is measured from 2D masks in a calibrated top-down view, so it detects drift
(less rice, garnish moved, part missing) rather than claiming true volume or weight.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Sequence

import numpy as np

MIN_PRESENT_SHARE = 0.002  # below this a mask is treated as noise, not a present component


@dataclass
class Plate:
    cx: float
    cy: float
    radius_px: float

    def area(self) -> float:
        return math.pi * self.radius_px ** 2


@dataclass
class Measure:
    present: bool
    area_share: float  # share of the plate's area
    angle_deg: float  # clock angle of the centroid, 0 = 12 o'clock, clockwise
    radius: float  # centroid distance from plate centre, 0..1 of plate radius
    count: Optional[int] = None


@dataclass
class ComponentSignature:
    name: str
    present: bool
    area_share: float
    angle_deg: float
    radius: float
    count: Optional[int]
    tolerance: Dict[str, float] = field(default_factory=dict)


def measure(mask: np.ndarray, plate: Plate, count: Optional[int] = None) -> Measure:
    ys, xs = np.nonzero(mask)
    share = float(len(xs)) / plate.area()
    if share < MIN_PRESENT_SHARE:
        return Measure(False, 0.0, 0.0, 0.0, 0 if count is not None else None)
    dx, dy = xs.mean() - plate.cx, ys.mean() - plate.cy
    angle = (math.degrees(math.atan2(dx, -dy)) + 360.0) % 360.0
    radius = min(math.hypot(dx, dy) / plate.radius_px, 1.5)
    return Measure(True, share, angle, radius, count)


def angle_diff(a: float, b: float) -> float:
    d = abs(a - b) % 360.0
    return min(d, 360.0 - d)


def clock(angle_deg: float) -> str:
    hour = round(angle_deg / 30.0) % 12
    return f"{12 if hour == 0 else hour} o'clock"


def signature(name: str, measures: Sequence[Measure]) -> ComponentSignature:
    """Averages the 3 golden photos; their spread (with a floor) becomes the allowed tolerance."""
    present = [m for m in measures if m.present]
    if len(present) < len(measures) / 2:
        return ComponentSignature(name, False, 0.0, 0.0, 0.0, None, {})
    shares = [m.area_share for m in present]
    # circular mean for the angle
    sx = sum(math.sin(math.radians(m.angle_deg)) for m in present)
    cy = sum(math.cos(math.radians(m.angle_deg)) for m in present)
    angle = (math.degrees(math.atan2(sx, cy)) + 360.0) % 360.0
    counts = [m.count for m in present if m.count is not None]
    mean_share = float(np.mean(shares))
    tol = {
        "area_share": max(float(np.ptp(shares)) * 1.5, mean_share * 0.10),
        "angle_deg": max(max(angle_diff(m.angle_deg, angle) for m in present) * 1.5, 25.0),
        "radius": max(float(np.ptp([m.radius for m in present])) * 1.5, 0.12),
    }
    return ComponentSignature(
        name, True, mean_share, angle, float(np.mean([m.radius for m in present])),
        int(round(float(np.median(counts)))) if counts else None, tol,
    )


def photos_agree(per_photo: Sequence[Dict[str, Measure]], limit: float = 0.10) -> List[str]:
    """Names of components whose area share differs by more than `limit` of the plate between golden photos."""
    names = set().union(*per_photo)
    bad = []
    for n in names:
        shares = [p[n].area_share for p in per_photo if n in p and p[n].present]
        if len(shares) >= 2 and max(shares) - min(shares) > limit:
            bad.append(n)
    return sorted(bad)


@dataclass
class Score:
    score: int
    reasons: List[str]


def score_plate(golden: Sequence[ComponentSignature], seen: Dict[str, Measure]) -> Score:
    """Presence and placement first, area share second (spec section 13): portion from 2D is a drift signal."""
    penalty = 0.0
    reasons: List[str] = []
    for g in golden:
        m = seen.get(g.name)
        if not g.present:
            continue
        if m is None or not m.present:
            penalty += 30
            reasons.append(f"{g.name} missing")
            continue
        if g.count is not None and m.count is not None and m.count < g.count:
            penalty += 10 * (g.count - m.count)
            reasons.append(f"{g.name}: {m.count} of {g.count}")
        off = angle_diff(m.angle_deg, g.angle_deg)
        if off > g.tolerance.get("angle_deg", 30):
            penalty += 12
            reasons.append(f"{g.name} at {clock(m.angle_deg)}, should be {clock(g.angle_deg)}")
        diff = m.area_share - g.area_share
        if abs(diff) > g.tolerance.get("area_share", 0.03):
            pct = round(100 * diff / g.area_share)
            penalty += min(25, abs(pct) * 0.8)
            reasons.append(f"{g.name} share {abs(pct)}% {'above' if pct > 0 else 'under'} golden")
    return Score(max(0, round(100 - penalty)), reasons)
