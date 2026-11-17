"""Keep the shipped artwork set; take only missing creators from a newer fetch.

A fresh Wikidata fetch fixes creators (the "mul" label fix) but also drops works that upstream
reclassified or stripped of P170/P18 since the last fetch (Michelangelo's David became a
"statue"). This writes, under the CURRENT metadata cache key, the OLD work list with an empty
creator filled from the new fetch where it has one. Titles, images, fame and the work set stay
as shipped. The new fetch is kept under ``<key>-fresh`` for later study.

Usage: python scripts/merge_artwork_creators.py OLD_KEY NEW_KEY [--config configs/artworks/famous.yaml]
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import yaml

from deck_generator.artworks import _META_CACHE_PATH, _meta_cache_key

_CREATOR_FIELDS = ("creator", "creator_qid", "creator_candidates")


def merge_creators(old_rows: list[dict], new_rows: list[dict]) -> tuple[list[dict], int]:
    """Old rows with an empty creator filled from ``new_rows``; returns (rows, filled count)."""
    new_by_qid = {r["qid"]: r for r in new_rows}
    out, filled = [], 0
    for row in old_rows:
        fresh = new_by_qid.get(row["qid"])
        if not row["creator"] and fresh and fresh["creator"]:
            row = {**row, **{f: fresh[f] for f in _CREATOR_FIELDS}}
            filled += 1
        out.append(row)
    return out, filled


def main() -> None:
    """Merge two cache entries and store the result under the config's current key."""
    ap = argparse.ArgumentParser(description=main.__doc__)
    ap.add_argument("old_key")
    ap.add_argument("new_key")
    ap.add_argument("--config", type=Path, default=Path("configs/artworks/famous.yaml"))
    args = ap.parse_args()
    store = json.loads(_META_CACHE_PATH.read_text(encoding="utf-8"))
    merged, filled = merge_creators(store[args.old_key], store[args.new_key])
    key = _meta_cache_key(yaml.safe_load(args.config.read_text(encoding="utf-8")))
    store[f"{args.new_key}-fresh"] = store[args.new_key]
    store[key] = merged
    _META_CACHE_PATH.write_text(json.dumps(store, ensure_ascii=False), encoding="utf-8")
    print(f"{len(merged)} works kept, {filled} creators filled, stored under {key[:12]}")


if __name__ == "__main__":
    main()
