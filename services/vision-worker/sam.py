"""SAM 3.1 output → numpy masks, using Meta's meta-sam-parser.

The Model API answers with compact text, one record per object:
  <0f>id<|box;x1=;y1=;x2=;y2=;w=;h=|><|mask;x=0;y=0;data=H,W,<enc><payload>|>
Boxes and mask bounds are in the media's w×h pixel space reported in the record. Each mask
covers only its bounds, so it is placed into a full w×h canvas here.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional

import numpy as np
from meta_sam_parser import CompletedOutcome, decode_mask_to_raster, decode_mask_to_svg_path, image_segmentation_format


@dataclass
class SamObject:
    object_id: str
    box: tuple  # (left, top, right, bottom), right/bottom exclusive
    confidence: Optional[float]
    mask: np.ndarray  # bool, full media size (height, width)
    path: str  # simplified outline in media pixels, SVG path data (fill-rule evenodd)


def _rdp(points: np.ndarray, eps: float) -> np.ndarray:
    """Ramer-Douglas-Peucker: keeps the corners of a pixel-step outline and drops the stairs."""
    if len(points) < 3:
        return points
    start, end = points[0], points[-1]
    d = end - start
    norm = np.hypot(*d)
    rel = points - start
    dist = np.abs(d[0] * rel[:, 1] - d[1] * rel[:, 0]) / norm if norm else np.hypot(rel[:, 0], rel[:, 1])
    i = int(np.argmax(dist))
    if dist[i] <= eps:
        return np.array([start, end])
    return np.vstack([_rdp(points[: i + 1], eps)[:-1], _rdp(points[i:], eps)])


def outline(record, eps: float = 2.0) -> str:
    """The mask as compact SVG path data in media pixels: placed at its bounds, stretched if SAM sent it smaller."""
    raw = decode_mask_to_svg_path(record.mask)
    b = record.bounds
    sx = (b.right - b.left) / record.mask.width
    sy = (b.bottom - b.top) / record.mask.height
    out = []
    for sub in raw.split("M")[1:]:
        nums = [float(v) for v in sub.replace("L", " ").replace("Z", " ").split()]
        pts = np.array(nums, dtype=np.float64).reshape(-1, 2)
        pts = pts * [sx, sy] + [b.left, b.top]
        # Specks smaller than a few pixels are noise in the outline, not part of the dish.
        if np.ptp(pts[:, 0]) < 4 and np.ptp(pts[:, 1]) < 4:
            continue
        keep = _rdp(pts, eps)
        out.append("M" + "L".join(f"{x:.0f} {y:.0f}" for x, y in keep) + "Z")
    return "".join(out)


def parse(output_text: str, media_size: tuple) -> List[SamObject]:
    """media_size is (width, height) of the grid SAM reported (the w and h in its box records)."""
    parser = image_segmentation_format().create_parser()
    parser.push(output_text)
    result = parser.finish(CompletedOutcome()).result
    width, height = media_size
    boxes = {r.object_id: r for r in result.records if r.kind == "box"}
    objects = []
    for r in result.records:
        if r.kind != "mask":
            continue
        b = r.bounds
        raster = np.frombuffer(decode_mask_to_raster(r.mask), dtype=np.uint8).reshape(r.mask.height, r.mask.width).astype(bool)
        bh, bw = b.bottom - b.top, b.right - b.left
        if raster.shape != (bh, bw):
            # Large objects come back at reduced resolution: stretch to the bounds (nearest neighbour).
            rows = (np.arange(bh) * raster.shape[0] // bh).clip(0, raster.shape[0] - 1)
            cols = (np.arange(bw) * raster.shape[1] // bw).clip(0, raster.shape[1] - 1)
            raster = raster[rows][:, cols]
        full = np.zeros((height, width), dtype=bool)
        full[b.top:b.bottom, b.left:b.right] = raster
        box = boxes.get(r.object_id)
        objects.append(SamObject(
            object_id=r.object_id,
            box=(b.left, b.top, b.right, b.bottom),
            confidence=(box.confidence if box is not None else None) or r.confidence,
            mask=full,
            path=outline(r),
        ))
    return objects


def media_size(output_text: str) -> tuple:
    """Reads w and h from the first box record."""
    import re
    m = re.search(r"<\|box;[^|]*?w=(\d+);h=(\d+)", output_text)
    if not m:
        raise ValueError("no box record in SAM output")
    return int(m.group(1)), int(m.group(2))


def point_prompt(points: List[tuple], size: tuple, object_id: int = 1) -> str:
    """A tap-to-fix prompt: positive points (x, y) in media pixels on one image."""
    from meta_sam_parser import FramePrompt, PromptObject, PromptPoint, build_object_prompt
    return build_object_prompt(size=size, objects=[PromptObject(id=object_id, prompts=[FramePrompt(points=[PromptPoint(x, y) for x, y in points])])])
