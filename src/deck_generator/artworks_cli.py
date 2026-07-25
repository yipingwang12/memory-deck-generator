"""``deck-artworks`` — preview or export a famous-artworks deck config.

By default it *previews*: fetches the resolved artwork set from Wikidata and prints it
(title / creator / fame), downloading no images — the fast loop for tuning ``min_sitelinks``
before committing to an image download. ``--export`` runs the full export (metadata + WebP
assets) for just this deck, via the same ``deck-export`` seam.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import yaml

from .artworks import (
    apply_corrections, fetch_artworks_cached, parse_artwork_corrections, stale_corrections,
)
from .deck_export import DEFAULT_DECKS_DIR, export_decks


def main(argv=None) -> None:
    p = argparse.ArgumentParser(description="Preview or export a famous-artworks deck.")
    p.add_argument("--config", type=Path, required=True, help="Path to a configs/artworks/*.yaml")
    p.add_argument("--export", action="store_true",
                   help="Download images and write the deck artifact + assets (default: preview only).")
    p.add_argument("--refresh-metadata", action="store_true",
                   help="Re-query Wikidata instead of reusing cache/artworks_meta.json "
                        "(use when upstream data has changed).")
    p.add_argument("--out", type=Path, default=DEFAULT_DECKS_DIR)
    args = p.parse_args(argv)

    cfg = yaml.safe_load(args.config.read_text())
    if args.export:
        stem = f"artworks_{args.config.stem}"
        written = export_decks(args.config.parent.parent, args.out, only=stem)
        print(f"Exported {len(written)} deck(s) matching {stem!r} to {args.out}")
        return

    # Preview what the deck will actually say, corrections included — otherwise the one command
    # for eyeballing a config shows creators the export would never emit.
    arts = fetch_artworks_cached(cfg, refresh=args.refresh_metadata)
    corrections = parse_artwork_corrections(cfg.get('corrections'))
    notes = stale_corrections(arts, corrections)
    arts = apply_corrections(arts, corrections)
    print(f"{len(arts)} artworks for {cfg.get('deck_name', args.config.stem)!r}:\n")
    for a in arts:
        print(f"  {a.sitelinks:>4}  {a.title}  —  {a.creator or '(anonymous)'}")
    if notes:
        print(f"\n{len(notes)} correction warning(s):")
        for n in notes:
            print(f"  ! {n}")


if __name__ == "__main__":
    main()
