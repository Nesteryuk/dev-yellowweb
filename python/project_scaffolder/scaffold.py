#!/usr/bin/env python3
"""Генератор шаблона фичи для Next.js.

Пример: python scaffold.py user-profile --root ./src/features
Создаёт: <root>/user-profile/{UserProfile.tsx, UserProfile.test.tsx, index.ts}
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path

KEBAB = re.compile(r"^[a-z][a-z0-9]*(-[a-z0-9]+)*$")


def pascal(name: str) -> str:
    return "".join(part.capitalize() for part in name.split("-"))


def scaffold(name: str, root: Path) -> list[Path]:
    if not KEBAB.match(name):
        raise ValueError(f"feature name must be kebab-case (e.g. user-profile), got {name!r}")
    comp = pascal(name)
    target = root / name
    if target.exists():
        raise FileExistsError(f"{target} already exists")
    target.mkdir(parents=True)
    files = {
        f"{comp}.tsx": f"export function {comp}() {{\n  return <div>{comp}</div>;\n}}\n",
        f"{comp}.test.tsx": (
            "import { render, screen } from '@testing-library/react';\n"
            f"import {{ {comp} }} from './{comp}';\n\n"
            f"it('renders', () => {{\n  render(<{comp} />);\n"
            f"  expect(screen.getByText('{comp}')).toBeInTheDocument();\n}});\n"
        ),
        "index.ts": f"export * from './{comp}';\n",
    }
    created = []
    for filename, content in files.items():
        path = target / filename
        path.write_text(content, encoding="utf-8")
        created.append(path)
    return created


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawTextHelpFormatter)
    parser.add_argument("name", help="feature name in kebab-case")
    parser.add_argument("--root", type=Path, default=Path("src/features"))
    args = parser.parse_args()
    try:
        for path in scaffold(args.name, args.root):
            print(f"created {path}")
    except (ValueError, FileExistsError) as exc:
        parser.error(str(exc))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
