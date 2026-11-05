"""Verify a scene pass on history cells: same entries as a git ref, only `scene` changed.

    .venv/bin/python scripts/verify_scene_pass.py <slug> [--ref 158cdb8]

Exit 0 = only scene text (and entry order) changed; exit 1 = data changed.
Commit 158cdb8 is the state before the 2026-11-05 scene pass.
"""
import argparse
import subprocess
import sys
from collections import Counter
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
CELLS = "configs/history/cells"


def _entries(text: str) -> list[dict]:
    return yaml.safe_load(text)["dates"]


def _key(entry: dict) -> tuple:
    """Every field except the scene, as a hashable record."""
    return tuple(sorted((k, repr(v)) for k, v in entry.items() if k != "scene"))


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("slug")
    ap.add_argument("--ref", default="158cdb8")
    args = ap.parse_args()
    path = f"{CELLS}/{args.slug}.yaml"
    old = _entries(subprocess.run(["git", "show", f"{args.ref}:{path}"], cwd=ROOT,
                                  check=True, capture_output=True, text=True).stdout)
    new = _entries((ROOT / path).read_text(encoding="utf-8"))
    lost = Counter(map(_key, old)) - Counter(map(_key, new))
    added = Counter(map(_key, new)) - Counter(map(_key, old))
    for k in lost:
        print("CHANGED OR LOST:", dict(k), file=sys.stderr)
    for k in added:
        print("CHANGED OR ADDED:", dict(k), file=sys.stderr)
    before = {(_key(e), e["scene"]) for e in old}
    rewritten = sum((_key(e), e["scene"]) not in before for e in new)
    print(f"{args.slug}: {len(new)} entries ({len(old)} before), {rewritten} scenes rewritten")
    return 1 if lost or added else 0


if __name__ == "__main__":
    sys.exit(main())
