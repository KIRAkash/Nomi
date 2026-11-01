import numpy as np

from signature import Measure, Plate, clock, measure, photos_agree, score_plate, signature

PLATE = Plate(cx=200, cy=200, radius_px=150)


def disc(cx, cy, r, size=400):
    yy, xx = np.mgrid[:size, :size]
    return (xx - cx) ** 2 + (yy - cy) ** 2 <= r ** 2


def test_garnish_at_two_oclock():
    m = measure(disc(200 + 90 * np.sin(np.radians(60)), 200 - 90 * np.cos(np.radians(60)), 12), PLATE)
    assert m.present and clock(m.angle_deg) == "2 o'clock"
    assert 0.55 < m.radius < 0.65


def test_missing_and_moved_and_short():
    golden_rice = [measure(disc(200, 205, 80), PLATE) for _ in range(3)]
    golden_onion = [measure(disc(278, 155, 12), PLATE) for _ in range(3)]
    golden = [signature("Rice", golden_rice), signature("Fried onion", golden_onion)]

    perfect = score_plate(golden, {"Rice": golden_rice[0], "Fried onion": golden_onion[0]})
    assert perfect.score == 100 and perfect.reasons == []

    short = score_plate(golden, {"Rice": measure(disc(200, 205, 70), PLATE), "Fried onion": golden_onion[0]})
    assert short.score < 100 and any("under golden" in r for r in short.reasons)

    no_garnish = score_plate(golden, {"Rice": golden_rice[0]})
    assert "Fried onion missing" in no_garnish.reasons

    moved = score_plate(golden, {"Rice": golden_rice[0], "Fried onion": measure(disc(122, 255, 12), PLATE)})
    assert any("should be 2 o'clock" in r for r in moved.reasons)


def test_photos_must_agree():
    a = {"Rice": measure(disc(200, 200, 80), PLATE)}
    b = {"Rice": measure(disc(200, 200, 55), PLATE)}
    assert photos_agree([a, a, b]) == ["Rice"]
    assert photos_agree([a, a, a]) == []


def test_noise_is_not_present():
    m = measure(disc(200, 200, 1), PLATE)
    assert isinstance(m, Measure) and not m.present
