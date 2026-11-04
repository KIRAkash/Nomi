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


def place(angle_deg: float, radius: float) -> str:
    """Plain words for a position on the plate, the same words the Golden Plate masks step uses."""
    if radius < 0.3:
        return "centre"
    if radius > 1.0:
        return f"outside the plate, {clock(angle_deg)}"
    if radius > 0.75:
        return f"rim, {clock(angle_deg)}"
    return clock(angle_deg)


def read_measure(part: Dict, plate: Dict) -> Measure:
    """A part as the SAM read reports it (found, count, share of the plate, centre in pixels) → a Measure on that plate."""
    if not part.get("found") or not part.get("centre"):
        return Measure(False, 0.0, 0.0, 0.0, 0)
    dx, dy = part["centre"][0] - plate["cx"], part["centre"][1] - plate["cy"]
    angle = (math.degrees(math.atan2(dx, -dy)) + 360.0) % 360.0
    return Measure(True, float(part.get("share", 0.0)), angle, min(math.hypot(dx, dy) / plate["r"], 1.5), int(part.get("count", 0)))


def golden_signature(reads: Sequence[Dict]) -> List[ComponentSignature]:
    """The Golden Plate signature from the chef's saved photo reads: each part averaged, its spread becoming its tolerance."""
    names = list(dict.fromkeys(p["name"] for r in reads for p in r["parts"]))
    return [signature(n, [read_measure(p, r["plate"]) for r in reads for p in r["parts"] if p["name"] == n]) for n in names]


AREA_CHECK_MIN_SHARE = 0.04  # garnish smaller than this varies too much between plates to compare by area


@dataclass
class PassRow:
    name: str
    role: str
    found: bool
    count: int
    golden_count: Optional[int]
    share: float
    golden_share: float
    area_vs_golden: Optional[int]
    where: Optional[str]
    golden_where: Optional[str]
    ok: bool
    reason: Optional[str]
    kind: Optional[str]
    penalty: float = 0.0
    reasons: List[str] = field(default_factory=list)


def pass_checks(golden: Sequence[ComponentSignature], seen: Dict[str, Measure], roles: Dict[str, str]) -> List[PassRow]:
    """One row per Golden Plate part: found or not, pieces against the reference, position for placed garnish, plate area
    against the Golden Plate. Area from a 2D mask is a drift signal, never a weight or volume."""
    rows: List[PassRow] = []
    for g in golden:
        if not g.present:
            continue
        role = roles.get(g.name, "main")
        m = seen.get(g.name) or Measure(False, 0.0, 0.0, 0.0, 0)
        gw = place(g.angle_deg, g.radius)
        row = PassRow(g.name, role, m.present, m.count or 0, g.count if role == "count" else None, round(m.area_share, 3),
                      round(g.area_share, 3), None, place(m.angle_deg, m.radius) if m.present else None, gw, True, None, None)
        rows.append(row)

        def miss(kind: str, reason: str, penalty: float):
            row.ok = False
            row.penalty += penalty
            row.reasons.append(reason)
            if row.kind is None:
                row.kind, row.reason = kind, reason

        if not m.present:
            miss("missing", f"{g.name}: not found", 30)
            continue
        if role == "count" and g.count and (m.count or 0) < g.count:
            miss("count", f"{g.name}: {m.count} of {g.count}", 10 * (g.count - (m.count or 0)))
        if role == "placement" and g.radius >= 0.3:
            off = angle_diff(m.angle_deg, g.angle_deg) > g.tolerance.get("angle_deg", 30)
            drift = abs(m.radius - g.radius) > g.tolerance.get("radius", 0.12)
            if off or drift:
                miss("position", f"{g.name}: {row.where}, Golden Plate has it at {gw}", 12)
        if g.area_share > AREA_CHECK_MIN_SHARE:
            pct = round(100 * (m.area_share - g.area_share) / g.area_share)
            row.area_vs_golden = pct
            if abs(m.area_share - g.area_share) > g.tolerance.get("area_share", 0.1 * g.area_share):
                miss("area", f"{g.name}: {abs(pct)}% {'more' if pct > 0 else 'less'} plate area than the Golden Plate", min(25, abs(pct) * 0.8))
    return rows


def pass_score(rows: Sequence[PassRow]) -> int:
    return max(0, round(100 - sum(r.penalty for r in rows)))
