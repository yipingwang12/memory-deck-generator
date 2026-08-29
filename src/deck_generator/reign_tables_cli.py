"""``deck-monarch-tables`` — build the reign reference table for every monarch deck.

Two outputs per config, from one fetch:

- ``results/<slug>.xlsx`` — the human-readable sheet, one row per digit (this is the table that
  previously existed for British Monarchs alone, and only as a one-off local run).
- ``<out>/<deck>.json`` — the sidecar the quiz's monarch preview reads, digest-bound to the
  deck it explains.

The decks are frozen and Wikidata is not, so every deck is **checked before it is explained**:
if today's fetch no longer reproduces the shipped digit strings, that deck's table is skipped
and reported rather than written. A table that quietly describes a different deck than the one
being studied is the failure this command exists to avoid.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import yaml

from .monarchs import (
    correction_years, fetch_monarchs, filter_by_accession, make_monarch_chunks,
    parse_extra_cards,
    parse_corrections, report_imprecise_dates, stale_corrections,
)
from .reign_tables import build_reign_table, check_against_deck, write_reign_table
from .xlsx_writer import write_monarchs_xlsx

_ROOT = Path(__file__).resolve().parent.parent.parent
DEFAULT_CONFIG_DIR = _ROOT / 'configs' / 'monarchs'
DEFAULT_XLSX_DIR = _ROOT / 'results'
# Sibling repo, like the poetry translations and lexicons: these are display-only artifacts
# committed in the quiz, not deck output the orchestrator's `decks` asset syncs.
_QUIZ = _ROOT.parent / 'memory-quiz-app'
DEFAULT_OUT_DIR = _QUIZ / 'data' / 'reigns'
# The QUIZ's copy, not the generator's: those are gitignored build output that a later export
# can rewrite, while the quiz's are the frozen artifacts actually being studied. A table is
# only meaningful against the deck whose digits the reader has FSRS history on.
DEFAULT_DECKS_DIR = _QUIZ / 'data' / 'decks'


def parse_args(argv=None) -> argparse.Namespace:
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument('--config-dir', type=Path, default=DEFAULT_CONFIG_DIR)
    p.add_argument('--decks-dir', type=Path, default=DEFAULT_DECKS_DIR,
                   help="deck artifacts the tables are checked against")
    p.add_argument('--out', type=Path, default=DEFAULT_OUT_DIR,
                   help="where the JSON sidecars are written")
    p.add_argument('--xlsx-dir', type=Path, default=DEFAULT_XLSX_DIR,
                   help="where the readable sheets are written; --no-xlsx to skip")
    p.add_argument('--no-xlsx', action='store_true')
    p.add_argument('--only', default=None,
                   help="config stem glob, e.g. 'britain' or 'monarchs_*'")
    p.add_argument('--force', action='store_true',
                   help="write a table even when the fetch no longer matches the deck. "
                        "The quiz still refuses it on the digest, so this is for inspecting "
                        "the drift, not for shipping past it")
    return p.parse_args(argv)


def _load_deck(decks_dir: Path, stem: str) -> dict | None:
    path = decks_dir / f"{stem}.json"
    if not path.exists():
        return None
    return json.loads(path.read_text())


def build_one(yaml_path: Path, decks_dir: Path) -> tuple[str, list, dict | None, list[str]]:
    """Fetch and chunk one config. Returns (deck stem, chunks, deck artifact, problems)."""
    cfg = yaml.safe_load(yaml_path.read_text())
    stem = f"monarchs_{yaml_path.stem}"
    deck = _load_deck(decks_dir, stem)
    if deck is None:
        return stem, [], None, [f"no artifact {stem}.json in {decks_dir}"]

    monarchs = fetch_monarchs(cfg['positions'], house_ids=cfg.get('houses'),
                              exclude_people=cfg.get('exclude_people'))
    monarchs = filter_by_accession(monarchs, cfg.get('accession_min_year'),
                                   cfg.get('accession_max_year'))
    if not monarchs:
        return stem, [], deck, ["fetch returned no rulers"]

    corrections = parse_corrections(cfg.get('corrections'))
    add_years, drop_years = correction_years(corrections)
    chunks = make_monarch_chunks(
        monarchs, cfg.get('chunk_years', 100), cfg.get('chunk_start_year'),
        add_transition_years=add_years, drop_transition_years=drop_years,
        corrections=corrections,
        extra_cards=parse_extra_cards(cfg.get('extra_cards')),
    )
    check = check_against_deck(chunks, deck.get('digits') or deck['items'], deck['labels'])
    return stem, chunks, deck, check.problems


def main(argv=None) -> None:
    args = parse_args(argv)
    configs = sorted(args.config_dir.glob('*.yaml'))
    if args.only:
        from fnmatch import fnmatch
        configs = [c for c in configs
                   if fnmatch(c.stem, args.only) or fnmatch(f"monarchs_{c.stem}", args.only)]
    if not configs:
        print(f"No configs matched in {args.config_dir}", file=sys.stderr)
        sys.exit(1)

    written, skipped = 0, []
    for yaml_path in configs:
        cfg = yaml.safe_load(yaml_path.read_text())
        subject = cfg.get('subject', yaml_path.stem)
        try:
            stem, chunks, deck, problems = build_one(yaml_path, args.decks_dir)
        except Exception as e:                      # one bad config must not lose 36 fetches
            print(f"✗ {yaml_path.stem}: {type(e).__name__}: {e}", file=sys.stderr)
            skipped.append((yaml_path.stem, [str(e)]))
            continue

        for note in report_imprecise_dates([m for c in chunks for m in c.monarchs]):
            print(f"  warning: {note}", file=sys.stderr)

        if problems and not args.force:
            print(f"✗ {stem}: deck drifted, table not written", file=sys.stderr)
            for p in problems[:5]:
                print(f"    {p}", file=sys.stderr)
            if len(problems) > 5:
                print(f"    … and {len(problems) - 5} more", file=sys.stderr)
            skipped.append((stem, problems))
            continue

        payload = build_reign_table(stem, subject, chunks, deck.get('digits') or deck['items'])
        path = write_reign_table(payload, args.out)
        if not args.no_xlsx:
            args.xlsx_dir.mkdir(parents=True, exist_ok=True)
            xlsx = args.xlsx_dir / f"{subject.lower().replace(' ', '_')}.xlsx"
            write_monarchs_xlsx(chunks, xlsx, subject=subject)
        digits = sum(len(c['digits']) for c in payload['chunks'])
        flag = " (FORCED — digest will not match)" if problems else ""
        print(f"✓ {stem}: {len(payload['chunks'])} chunks, {digits} digits → {path.name}{flag}")
        written += 1

    print(f"\n{written} table(s) written to {args.out}")
    if skipped:
        print(f"{len(skipped)} skipped: {', '.join(s for s, _ in skipped)}", file=sys.stderr)


if __name__ == "__main__":
    main()
