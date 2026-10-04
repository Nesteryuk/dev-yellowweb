#!/usr/bin/env python3
"""Пакетное сжатие изображений (Pillow).

Пример: python optimizer.py ./photos ./out --quality 80 --max-size 1920

Особенности:
- учитывает EXIF-ориентацию (фото не «ложатся на бок»);
- RGBA/P при сохранении в JPEG конвертируется в RGB;
- `quality` применяется только к JPEG/WebP (для PNG — lossless optimize);
- если результат получился больше исходника, копируется оригинал.
"""

from __future__ import annotations

import argparse
import shutil
from pathlib import Path

from PIL import Image, ImageOps

EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def optimize(src: Path, dst: Path, quality: int = 80, max_size: int | None = None) -> tuple[int, int]:
    """Сжимает `src` в `dst`, возвращает (размер до, размер после) в байтах."""
    dst.parent.mkdir(parents=True, exist_ok=True)
    suffix = dst.suffix.lower()

    with Image.open(src) as opened:
        img = ImageOps.exif_transpose(opened)
        if max_size:
            img.thumbnail((max_size, max_size))

        if suffix in {".jpg", ".jpeg"}:
            if img.mode != "RGB":
                img = img.convert("RGB")
            img.save(dst, "JPEG", quality=quality, optimize=True)
        elif suffix == ".webp":
            img.save(dst, "WEBP", quality=quality)
        else:
            img.save(dst, "PNG", optimize=True)

    before, after = src.stat().st_size, dst.stat().st_size
    if after >= before and not max_size:
        shutil.copyfile(src, dst)
        after = before
    return before, after


def run(source: Path, output: Path, quality: int, max_size: int | None) -> tuple[int, int, int]:
    """Обходит `source`, возвращает (до, после, число ошибок)."""
    before = after = failed = 0
    for path in sorted(source.rglob("*")):
        if path.suffix.lower() not in EXTENSIONS:
            continue
        try:
            b, a = optimize(path, output / path.relative_to(source), quality, max_size)
        except OSError as exc:  # битый файл не должен ронять весь пакет
            failed += 1
            print(f"{path}: FAILED ({exc})")
            continue
        before, after = before + b, after + a
        print(f"{path}: {b} -> {a} bytes")
    return before, after, failed


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawTextHelpFormatter)
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--quality", type=int, default=80, choices=range(1, 101), metavar="1-100")
    parser.add_argument("--max-size", type=int, default=None, help="max width/height in px")
    args = parser.parse_args()

    if not args.source.is_dir():
        parser.error(f"source is not a directory: {args.source}")
    if args.output.resolve() == args.source.resolve():
        parser.error("output must differ from source (originals would be overwritten)")

    before, after, failed = run(args.source, args.output, args.quality, args.max_size)
    if before:
        print(f"Total: {before} -> {after} bytes ({100 - after * 100 // before}% saved)")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
