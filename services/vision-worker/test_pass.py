"""PASS checks against the chicken biryani Golden Plate, using the SAM 3.1 reads saved with the demo photos."""
import json
from pathlib import Path

import numpy as np
import pytest
from PIL import Image

from app import blur_boxes
from signature import golden_signature, pass_checks, pass_score, read_measure

DEMO = Path(__file__).resolve().parents[2] / "apps/app/assets/images/demo/chicken-biryani"
ROLES = {"Rice": "main", "Chicken pieces": "count", "Fried onions": "placement", "Lemon wedge": "placement", "Raita bowl": "side"}

needs_demo = pytest.mark.skipif(not DEMO.exists(), reason="demo photos not in this checkout")


def load(name):
    return json.loads((DEMO / f"{name}.sam.json").read_text())


def check(name):
    golden = golden_signature([load(f"golden-{i}") for i in (1, 2, 3)])
    read = load(name)
    seen = {p["name"]: read_measure(p, read["plate"]) for p in read["parts"]}
    rows = pass_checks(golden, seen, ROLES)
    return pass_score(rows), {r.name: r for r in rows}


@needs_demo
def test_good_plate_matches():
    score, rows = check("pass-good")
    assert score >= 90
    assert all(r.ok for r in rows.values())


@needs_demo
def test_onions_missing():
    score, rows = check("pass-onions-missing")
    assert rows["Fried onions"].reason == "Fried onions: not found" and rows["Fried onions"].kind == "missing"
    assert rows["Rice"].kind == "area" and rows["Rice"].area_vs_golden < -25
    assert score < 75


@needs_demo
def test_three_pieces():
    _, rows = check("pass-three-pieces")
    assert rows["Chicken pieces"].reason == "Chicken pieces: 3 of 4"


@needs_demo
def test_lemon_moved_off_the_rim():
    _, rows = check("pass-lemon-off")
    assert rows["Lemon wedge"].kind == "position" and "rim" in rows["Lemon wedge"].reason


def test_blur_hides_a_face_box():
    img = Image.fromarray(np.tile(np.arange(200, dtype=np.uint8) % 2 * 255, (200, 1)).astype(np.uint8))
    out = np.asarray(blur_boxes(img, [(0.0, 0.0, 0.4, 0.4)]).convert("L")).astype(int)
    assert out[:60, :60].std() < 40  # stripes smoothed out inside the box
    assert out[150:, 150:].std() > 100  # untouched outside it


def test_endpoint_on_a_real_sam_run():
    """The whole /pass/check path on raw SAM 3.1 output recorded for chicken-biryani--onions-missing.jpg (Nov 3)."""
    from app import PassIn, pass_check

    body = json.loads((Path(__file__).parent / "fixtures/pass-onions-missing.json").read_text())
    out = pass_check(PassIn(**body))
    assert out["ok"] and out["score"] < 75
    assert "Fried onions: not found" in out["reasons"]
    onions = next(c for c in out["components"] if c["name"] == "Fried onions")
    assert not onions["found"] and onions["kind"] == "missing" and onions["colour"].startswith("#")
