"""Vision worker: turns SAM 3.1 masks into plate signatures and scores. Masks arrive already decoded
to 0/1 arrays (run-length or PNG decoding lives in decode.py once the SAM 3.1 encoding is confirmed)."""
from __future__ import annotations

import base64
import io
from dataclasses import asdict
from typing import Dict, List, Optional, Tuple

import numpy as np
from fastapi import FastAPI
from PIL import Image, ImageFilter
from pydantic import BaseModel

import sam
from signature import (ComponentSignature, Plate, clock, golden_signature as signature_from_reads, measure, pass_checks, pass_score, photos_agree, read_measure,
                       score_plate, signature)

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


class SamPart(BaseModel):
    name: str
    colour: str  # "#RRGGBB"
    output: str  # raw SAM 3.1 output text for this part's prompt


class ReadIn(BaseModel):
    plate_output: Optional[str] = None  # raw SAM output for the prompt "plate"; none for shelves and closing spots
    parts: List[SamPart]


def where(m, objects, plate: Plate) -> str:
    """Plain words for a part's position, from the measured centroids."""
    centres = [((o.box[0] + o.box[2]) / 2, (o.box[1] + o.box[3]) / 2) for o in objects]
    reach = max((np.hypot(a[0] - b[0], a[1] - b[1]) for a in centres for b in centres), default=0.0)
    if len(objects) >= 3 and reach > plate.radius_px:
        return "spread over the plate"
    if m.radius < 0.3:
        return "centre"
    if m.radius > 1.0:
        return f"outside the plate, {clock(m.angle_deg)}"
    if m.radius > 0.75:
        return f"rim, {clock(m.angle_deg)}"
    return clock(m.angle_deg)


@app.post("/sam/read")
def sam_read(body: ReadIn):
    """Decodes SAM masks for each part and measures them against the plate. Outlines come back as SVG path
    data in the media's pixel grid, so the app can draw, colour and animate them over the photo."""
    outputs = [o for o in [body.plate_output or "", *(p.output for p in body.parts)] if "<|box" in o]
    if not outputs:
        return {"ok": False, "error": "nothing found"}
    size = sam.media_size(outputs[0])
    plate, rim = None, None
    if body.plate_output:
        plates = sam.parse(body.plate_output, size) if "<|box" in body.plate_output else []
        if not plates:
            return {"ok": False, "error": "no plate found"}
        rim = max(plates, key=lambda o: o.mask.sum())
        # The plate mask is the rim with the food cut out, so the plate is measured from its outline box.
        left, top, right, bottom = rim.box
        plate = Plate(cx=(left + right) / 2, cy=(top + bottom) / 2, radius_px=((right - left) + (bottom - top)) / 4)

    parts = []
    for p in body.parts:
        objects = sam.parse(p.output, size) if "<|box" in p.output else []
        union = np.zeros((size[1], size[0]), dtype=bool)
        for o in objects:
            union |= o.mask
        ys, xs = np.nonzero(union)
        m = measure(union, plate, len(objects)) if plate else None
        present = bool(m.present) if m else len(xs) > 0
        parts.append({
            "name": p.name,
            "colour": p.colour,
            "found": present,
            "count": len(objects) if present else 0,
            "share": round(m.area_share, 3) if m and m.present and m.radius <= 1.0 else 0,
            "where": where(m, objects, plate) if m and m.present else None,
            "centre": [round(float(xs.mean())), round(float(ys.mean()))] if present else None,
            "paths": [o.path for o in objects] if present else [],
            "boxes": [list(o.box) for o in objects] if present else [],
        })
    return {
        "ok": True,
        "size": {"w": size[0], "h": size[1]},
        "plate": {"cx": round(plate.cx), "cy": round(plate.cy), "r": round(plate.radius_px), "path": rim.path} if plate else None,
        "parts": parts,
    }


class GoldenRead(BaseModel):
    plate: Dict  # {cx, cy, r} in that photo's pixels
    parts: List[Dict]  # {name, found, count, share, centre} as /sam/read returned them


class PassIn(BaseModel):
    golden: List[GoldenRead]  # the dish's saved Golden Plate photo reads
    roles: Dict[str, str]  # part name → main, count, placement or side
    plate_output: str  # raw SAM output for "plate" on the pass frame
    parts: List[SamPart]


@app.post("/pass/check")
def pass_check(body: PassIn):
    """Reads the pass frame like a Golden Plate photo, builds the dish's signature from its golden reads, and checks each
    part against it: found or not, pieces, position, plate area against the Golden Plate."""
    read = sam_read(ReadIn(plate_output=body.plate_output, parts=body.parts))
    if not read.get("ok"):
        return {"ok": False, "error": read.get("error", "nothing found")}
    seen = {p["name"]: read_measure(p, read["plate"]) for p in read["parts"]}
    sig = signature_from_reads([g.model_dump() for g in body.golden])
    rows = pass_checks(sig, seen, body.roles)
    colours = {p.name: p.colour for p in body.parts}
    components = [{**{k: v for k, v in asdict(r).items() if k not in ("penalty", "reasons")}, "colour": colours.get(r.name, "#FFB627")} for r in rows]
    return {
        "ok": True,
        "score": pass_score(rows),
        "components": components,
        "reasons": [x for r in rows for x in r.reasons],
        "read": {k: read[k] for k in ("size", "plate", "parts")},
    }


class BlurIn(BaseModel):
    frame: str  # data URL
    boxes: List[Tuple[float, float, float, float]]  # x1, y1, x2, y2 in 0–1 of the frame


def blur_boxes(img: Image.Image, boxes, pad: float = 0.15) -> Image.Image:
    """Blurs each box (grown by `pad` of its size) so no face leaves the restaurant."""
    out = img.convert("RGB")
    w, h = out.size
    for x1, y1, x2, y2 in boxes:
        bw, bh = (x2 - x1) * pad, (y2 - y1) * pad
        box = (max(0, int((x1 - bw) * w)), max(0, int((y1 - bh) * h)), min(w, int((x2 + bw) * w)), min(h, int((y2 + bh) * h)))
        if box[2] <= box[0] or box[3] <= box[1]:
            continue
        region = out.crop(box)
        out.paste(region.filter(ImageFilter.GaussianBlur(max(8, (box[2] - box[0]) // 6))), box)
    return out


@app.post("/frame/blur")
def frame_blur(body: BlurIn):
    img = Image.open(io.BytesIO(base64.b64decode(body.frame.split(",", 1)[1])))
    buf = io.BytesIO()
    blur_boxes(img, body.boxes).save(buf, format="JPEG", quality=88)
    return {"frame": "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()}


@app.get("/health")
def health():
    return {"ok": True}
