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
from meta_sam_parser import CompletedOutcome, decode_mask_to_raster, image_segmentation_format


@dataclass
class SamObject:
    object_id: str
    box: tuple  # (left, top, right, bottom), right/bottom exclusive
    confidence: Optional[float]
    mask: np.ndarray  # bool, full media size (height, width)


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
