"""``deck-history-check`` — check history-date files against the Major System rules.

Exit 1 when a file breaks a rule. A peg with too many dates in one file is a warning only. ``--peg-codes`` also checks the peg list against
CMUdict (``uv run --with cmudict``). A city file's ``world_refs`` must point to world-grid cells
(``--cells``) that hold a date of the same year. Its ``out_refs`` (events the OUT rule leaves out)
need a year, an event and a reason.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import yaml

from . import history_dates

DEFAULT_PEGS = Path("configs/history/major_pegs.yaml")
DEFAULT_CELLS = Path("configs/history/cells")
MAX_LOAD_SHOWN = 6


def _check_file(path: Path, pegs: dict[str, str], cells: Path) -> list[str]:
    data = yaml.safe_load(path.read_text(encoding="utf-8"))
    dates = data["dates"]
    problems = history_dates.file_problems(dates, pegs)
    problems += history_dates.world_ref_problems(data.get("world_refs") or [], cells, dates)
    problems += history_dates.out_ref_problems(data.get("out_refs") or [], dates)
    load = history_dates.peg_load(dates)
    print(f"{path}: {len(dates)} dates, {len(load)} pegs, "
          f"most loaded {load.most_common(MAX_LOAD_SHOWN)}")
    for peg, n in history_dates.overloaded_pegs(dates):
        print(f"WARNING PEG OVERLOAD {peg}: {n} dates in {path.name}; "
              "give each scene a different role and setting", file=sys.stderr)
    return problems


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("files", nargs="+", type=Path)
    ap.add_argument("--pegs", type=Path, default=DEFAULT_PEGS)
    ap.add_argument("--peg-codes", action="store_true")
    ap.add_argument("--cells", type=Path, default=DEFAULT_CELLS,
                    help="world-grid cells that a city file's world_refs point to")
    args = ap.parse_args(argv)
    pegs = yaml.safe_load(args.pegs.read_text(encoding="utf-8"))["pegs"]
    problems = []
    if args.peg_codes:
        import cmudict
        problems += history_dates.peg_code_problems(pegs, cmudict.dict())
    for path in args.files:
        problems += _check_file(path, pegs, args.cells)
    for p in problems:
        print(p, file=sys.stderr)
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
