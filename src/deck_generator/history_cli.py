"""``deck-history-check`` — check history-date files against the Major System rules.

Exit 1 when a file breaks a rule. ``--peg-codes`` also checks the peg list against
CMUdict (``uv run --with cmudict``).
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import yaml

from . import history_dates

DEFAULT_PEGS = Path("configs/history/major_pegs.yaml")
MAX_LOAD_SHOWN = 6


def _check_file(path: Path, pegs: dict[str, str]) -> list[str]:
    dates = yaml.safe_load(path.read_text(encoding="utf-8"))["dates"]
    problems = history_dates.file_problems(dates, pegs)
    load = history_dates.peg_load(dates)
    print(f"{path}: {len(dates)} dates, {len(load)} pegs, "
          f"most loaded {load.most_common(MAX_LOAD_SHOWN)}")
    return problems


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("files", nargs="+", type=Path)
    ap.add_argument("--pegs", type=Path, default=DEFAULT_PEGS)
    ap.add_argument("--peg-codes", action="store_true")
    args = ap.parse_args(argv)
    pegs = yaml.safe_load(args.pegs.read_text(encoding="utf-8"))["pegs"]
    problems = []
    if args.peg_codes:
        import cmudict
        problems += history_dates.peg_code_problems(pegs, cmudict.dict())
    for path in args.files:
        problems += _check_file(path, pegs)
    for p in problems:
        print(p, file=sys.stderr)
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
