"""Vision worker: turns SAM 3.1 masks into plate signatures and scores. Masks arrive already decoded
to 0/1 arrays (run-length or PNG decoding lives in decode.py once the SAM 3.1 encoding is confirmed)."""
from __future__ import annotations

from dataclasses import asdict
from typing import Dict, List, Optional

import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel

from signature import ComponentSignature, Plate, measure, photos_agree, score_plate, signature

app = FastAPI(title="nomi vision worker")


class PlateIn(BaseModel):
    cx: float
    cy: float
    radius_px: float


class MaskIn(BaseModel):
    component: str
    width: int
    height: int
    rle: List[int]  # alternating run lengths of 0s and 1s, row-major, starting with 0s
    count: Optional[int] = None


class PhotoIn(BaseModel):
    masks: List[MaskIn]


def decode(m: MaskIn) -> np.ndarray:
    flat = np.zeros(m.width * m.height, dtype=bool)
    pos, val = 0, False
    for run in m.rle:
        if val:
            flat[pos:pos + run] = True
        pos += run
        val = not val
    return flat.reshape(m.height, m.width)


def measures(photo: PhotoIn, plate: Plate):
    return {m.component: measure(decode(m), plate, m.count) for m in photo.masks}


class GoldenIn(BaseModel):
    plate: PlateIn
    photos: List[PhotoIn]


@app.post("/golden/signature")
def golden_signature(body: GoldenIn):
    plate = Plate(**body.plate.model_dump())
    per_photo = [measures(p, plate) for p in body.photos]
    disagree = photos_agree(per_photo)
    names = sorted(set().union(*per_photo))
    sig = [signature(n, [p[n] for p in per_photo if n in p]) for n in names]
    # A disagreement means a retake, never a save.
    return {"ok": not disagree, "retake": disagree, "signature": [asdict(s) for s in sig]}


class ScoreIn(BaseModel):
    plate: PlateIn
    golden: List[Dict]
    photo: PhotoIn


@app.post("/plate/score")
def plate_score(body: ScoreIn):
    plate = Plate(**body.plate.model_dump())
    golden = [ComponentSignature(**g) for g in body.golden]
    result = score_plate(golden, measures(body.photo, plate))
    return asdict(result)


@app.get("/health")
def health():
    return {"ok": True}
