import random

import pytest
from optimizer import optimize, run
from PIL import Image


def noisy(size=(200, 200), mode="RGB"):
    rnd = random.Random(0)
    img = Image.new(mode, size)
    img.putdata([tuple(rnd.randrange(256) for _ in mode) for _ in range(size[0] * size[1])])
    return img


def test_resizes_and_keeps_aspect(tmp_path):
    src, dst = tmp_path / "a.jpg", tmp_path / "out" / "a.jpg"
    noisy((400, 200)).save(src, quality=100)
    optimize(src, dst, quality=50, max_size=100)
    with Image.open(dst) as img:
        assert img.size == (100, 50)


def test_jpeg_quality_reduces_size(tmp_path):
    src, dst = tmp_path / "a.jpg", tmp_path / "b.jpg"
    noisy().save(src, quality=100)
    before, after = optimize(src, dst, quality=30)
    assert after < before


def test_rgba_png_to_jpeg_is_converted(tmp_path):
    src, dst = tmp_path / "a.png", tmp_path / "a.jpg"
    noisy(mode="RGBA").save(src)
    optimize(src, dst, quality=60, max_size=64)
    with Image.open(dst) as img:
        assert img.mode == "RGB"


def test_exif_orientation_is_applied(tmp_path):
    src, dst = tmp_path / "a.jpg", tmp_path / "b.jpg"
    exif = Image.Exif()
    exif[0x0112] = 6  # повернуть на 90° по часовой
    noisy((200, 100)).save(src, exif=exif, quality=100)
    optimize(src, dst, quality=80, max_size=500)
    with Image.open(dst) as img:
        assert img.size == (100, 200)


def test_output_never_larger_than_original_without_resize(tmp_path):
    src, dst = tmp_path / "a.png", tmp_path / "b.png"
    Image.new("RGB", (50, 50), "red").save(src, optimize=True)
    before, after = optimize(src, dst)
    assert after <= before


def test_run_skips_non_images_and_survives_broken_files(tmp_path, capsys):
    source, out = tmp_path / "src", tmp_path / "out"
    (source / "sub").mkdir(parents=True)
    noisy().save(source / "sub" / "ok.jpg")
    (source / "broken.jpg").write_bytes(b"not an image")
    (source / "notes.txt").write_text("hi")
    before, after, failed = run(source, out, 70, None)
    assert failed == 1
    assert (out / "sub" / "ok.jpg").exists()
    assert not (out / "notes.txt").exists()
    assert before > 0 and after > 0
    assert "FAILED" in capsys.readouterr().out


@pytest.mark.parametrize("suffix", [".webp", ".png"])
def test_other_formats(tmp_path, suffix):
    src, dst = tmp_path / "a.png", tmp_path / f"b{suffix}"
    noisy().save(src)
    optimize(src, dst, quality=50)
    assert dst.exists()
