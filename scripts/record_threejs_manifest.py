"""Stamp hand-authored Three.js scene pictures into each company's image manifest.

    uv run python scripts/record_threejs_manifest.py [SLUG ...] [--dry-run]

The Gemini pipeline writes the manifest as it draws, because it knows the prompt it sent.
A Three.js final is a rendered scene *page*, written by hand, so nothing records what it was
drawn from — and without that record `deck-companies --build` skips it (`current_images`).

This stamps the record after the fact: per qid, the scene text as it now reads. That is an
assertion, so it is checked, not assumed — a picture older than its scenes YAML is refused,
because the scene may have been edited after the picture was drawn and a wrong certificate
teaches the old scene forever.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import yaml

from deck_generator import scene_images as si

ROOT = Path(__file__).resolve().parents[1]
CONFIGS = ROOT / 'configs' / 'companies'


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('slugs', nargs='*', help='company slugs (default: every one with finals)')
    ap.add_argument('--dry-run', action='store_true')
    args = ap.parse_args(argv)

    slugs = args.slugs or sorted(
        p.name for p in si.ROOT.iterdir()
        if (p / si.THREEJS_DIR).is_dir()
        and any((p / si.THREEJS_DIR).glob(f'q*{si.THREEJS_SUFFIX}.webp')))

    total, refused, decks = 0, 0, 0
    for slug in slugs:
        source = CONFIGS / f'{slug}.mnemonics.yaml'
        if not source.exists():
            print(f'{slug}: no scenes file, skipped', file=sys.stderr)
            continue
        scenes = yaml.safe_load(source.read_text())
        out_dir = si.threejs_dir(slug)
        drawn = {p.name.split('_')[0] for p in out_dir.glob(f'q*{si.THREEJS_SUFFIX}.webp')}
        if args.dry_run:
            stamped = {c['qid'] for c in scenes['cards'] if c['qid'] in drawn}
        else:
            stamped = si.record_threejs(scenes, out_dir, source=source)
        skipped = drawn - stamped
        total += len(stamped)
        refused += len(skipped)
        decks += bool(stamped)
        note = f'  REFUSED (older than the scenes file): {sorted(skipped)}' if skipped else ''
        print(f'{slug:46s} {len(stamped):2d}/{len(scenes["cards"]):2d}{note}')

    print(f'\n{"would stamp" if args.dry_run else "stamped"} {total} pictures '
          f'across {decks} decks; refused {refused}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
