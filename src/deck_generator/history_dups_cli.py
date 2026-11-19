"""``deck-history-dups`` — list city cards that can repeat a world-grid event in other words.

A report for the main session after each wave of city eras (cities.md). It ranks candidate
pairs; a person decides each one. It never changes a file and always exits 0.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from . import history_dups as hx

DEFAULT_CELLS = Path("configs/history/cells")
DEFAULT_WORLD_DATES = Path("configs/history/world_dates.yaml")
EVENT_WIDTH = 70


def _row(h: hx.Candidate) -> str:
    rare = ",".join(h.rare) or "-"
    return (f"{h.cos:.2f}  rare={rare}\n"
            f"    {h.card.file}:{h.card.year}  {h.card.event[:EVENT_WIDTH]}\n"
            f"    {h.other.file}:{h.other.year}  {h.other.event[:EVENT_WIDTH]}")


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("files", nargs="+", type=Path, help="city era files")
    ap.add_argument("--cells", type=Path, default=DEFAULT_CELLS)
    ap.add_argument("--world-dates", type=Path, default=DEFAULT_WORLD_DATES)
    ap.add_argument("--min-cos", type=float, default=hx.MIN_COS)
    ap.add_argument("--min-rare", type=int, default=hx.MIN_RARE)
    ap.add_argument("--top", type=int, default=0, help="show only the best N (0 = all)")
    args = ap.parse_args(argv)
    cards = [e for p in args.files for e in hx.load_cards(p)]
    world = hx.load_world(args.cells, args.world_dates)
    hits = hx.candidates(cards, world, min_cos=args.min_cos, min_rare=args.min_rare,
                         cross_city=True)
    print(f"{len(hits)} candidate pairs ({len(cards)} cards against {len(world)} world dates)")
    for h in hits[:args.top or None]:
        print(_row(h))
    return 0


if __name__ == "__main__":
    sys.exit(main())
