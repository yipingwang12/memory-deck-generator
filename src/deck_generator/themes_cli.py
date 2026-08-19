"""``deck-themes`` — survey, preview or export the MTD musical-theme decks.

Three modes, and the first two exist because notation cannot be checked by reading a data
structure. ``--survey`` reports what the corpus holds after the config's selection rules,
which is how you tune ``max_per_composer`` (uncapped, Beethoven is 27% of MTD). The default
preview reports each theme's pool health. ``--render`` writes real engraved SVGs — one clean
and one corrupted per theme — because "is this corruption spottable, and does it still look
like music" is a question only the page can answer.
"""

from __future__ import annotations

import argparse
import collections
import random
from pathlib import Path

import yaml

from .deck_export import DEFAULT_DECKS_DIR, export_decks
from .theme_corruptions import DEFAULT_TYPES, build_theme_pool, pool_warnings
from .themes import apply_patch, discover_theme_ids, load_theme, render_svg


def _period(birth: int) -> str:
    if not birth:
        return 'unknown'
    for limit, name in ((1700, 'Baroque'), (1760, 'Classical'), (1800, 'Early Romantic'),
                        (1840, 'High Romantic'), (1875, 'Late Romantic')):
        if birth < limit:
            return name
    return 'Modern'


def _work_type(meta: dict) -> str:
    """MTD leaves ``WorkTitle`` empty for 81.5% of themes, so genre comes from the
    instrumentation fields, which are complete."""
    ensemble, instruments = meta.get('Ensemble', ''), meta.get('WorkInstruments', '')
    if 'Vocal' in ensemble or 'Choir' in ensemble:
        return 'Vocal/choral'
    if ensemble == 'Solo':
        return {'Piano': 'Piano solo', 'Harpsichord': 'Harpsichord solo'}.get(
            instruments, 'Other solo')
    if ensemble == 'Quartet':
        return 'String quartet' if instruments == 'Violin, Viola, Cello' else 'Other quartet'
    return ensemble or 'Other'


def _survey(themes) -> None:
    for label, key in (('PERIOD', lambda t: _period(t.birth)),
                       ('TYPE OF WORK', lambda t: _work_type(t.meta)),
                       ('COMPOSER', lambda t: t.composer)):
        counts = collections.Counter(key(t) for t in themes)
        rows = counts.most_common(12 if label == 'COMPOSER' else None)
        print(f'\n{label}')
        for name, n in rows:
            print(f'  {n:5d}  {n / len(themes) * 100:5.1f}%  {name}')
        if len(counts) > len(rows):
            print(f'  ... {len(counts) - len(rows)} more')
    lengths = sorted(len([n for n in t.notes if not n.grace]) for t in themes)
    print(f'\nNOTES PER THEME  min {lengths[0]}  median {lengths[len(lengths) // 2]}  '
          f'max {lengths[-1]}')


def main(argv=None) -> None:
    p = argparse.ArgumentParser(description='Survey, preview or export MTD theme decks.')
    p.add_argument('--config', type=Path, required=True, help='Path to a configs/themes/*.yaml')
    p.add_argument('--export', action='store_true',
                   help='Write the deck artifacts (default: preview only).')
    p.add_argument('--survey', action='store_true',
                   help='Report corpus composition by period, work type and composer.')
    p.add_argument('--render', type=Path, metavar='DIR',
                   help='Write clean + corrupted SVGs per theme, to eyeball the engraving.')
    p.add_argument('--limit', type=int, default=0, help='Only the first N themes (preview/render).')
    p.add_argument('--seed', type=int, default=0, help='Seed for --render (reproducible).')
    p.add_argument('--out', type=Path, default=DEFAULT_DECKS_DIR)
    args = p.parse_args(argv)

    if args.export:
        stem = f'themes_{args.config.stem}'
        written = export_decks(args.config.parent.parent, args.out, only=f'{stem}*')
        print(f'Exported {len(written)} deck(s) matching {stem}* to {args.out}')
        return

    cfg = yaml.safe_load(args.config.read_text())
    mtd_dir = Path(cfg.get('mtd_dir', 'cache/mtd'))
    ccfg = cfg.get('corruption') or {}
    types = tuple(ccfg.get('types', list(DEFAULT_TYPES)))
    pool_size, max_pool = ccfg.get('pool_size', 16), ccfg.get('max_pool', 40)

    ids = discover_theme_ids(mtd_dir)
    if args.limit:
        ids = ids[:args.limit]
    themes = [load_theme(mtd_dir, i) for i in ids]
    print(f"{len(themes)} themes in {mtd_dir}  (types: {', '.join(types)})")

    if args.survey:
        _survey(themes)
        return

    rng = random.Random(args.seed)
    if args.render:
        args.render.mkdir(parents=True, exist_ok=True)

    warnings_seen, by_type = 0, collections.Counter()
    for theme in themes:
        pool = build_theme_pool(theme, types, pool_size, max_pool)
        by_type.update(e['type'] for e in pool)
        notes = len([n for n in theme.notes if not n.grace])
        print(f'  {theme.item}  {theme.label}')
        print(f'    notes={notes}  pool={len(pool)}  '
              f'{dict(collections.Counter(e["type"] for e in pool))}')
        for w in pool_warnings(theme, pool):
            warnings_seen += 1
            print(f'    ! {w}')
        if args.render and pool:
            entry = rng.choice(pool)
            stem = args.render / f'MTD{theme.mtd_id}'
            stem.with_suffix('.clean.svg').write_text(render_svg(theme.mei), encoding='utf-8')
            stem.with_suffix('.bad.svg').write_text(
                render_svg(apply_patch(theme.mei, entry['patch'])), encoding='utf-8')
            print(f'    rendered — corrupted {entry["id"]} at {entry["positions"]}')

    print(f'\n{len(themes)} themes, {warnings_seen} warning(s); pool composition {dict(by_type)}')


if __name__ == '__main__':
    main()
