"""``deck-grammar`` — check / build a grammar-table deck from a paradigm config.

- **check** (default): validate authored forms against the conjugation rules. No writes.
- **build**: check, then write ``grammar_<config stem>.json``. Refuses on any failure.

Offline by design: the forms are committed config, re-derived by rule.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import yaml

from .deck_export import DEFAULT_DECKS_DIR, config_hash
from . import grammar


def _print(report: grammar.Report, config: Path) -> None:
    for w in report.warnings:
        print(f"  WARN {w}")
    for f in report.failures:
        print(f"  FAIL {f}")
    print(f"{config.name}: " + ("OK" if report.ok else f"REFUSED — {len(report.failures)} failure(s)"))


def _build(cfg: dict, config: Path, out_dir: Path) -> None:
    art = grammar.assemble_artifact(cfg, f"manual/grammar/{config.name}")
    art["config_hash"] = config_hash(config)
    out_dir.mkdir(parents=True, exist_ok=True)
    out = out_dir / f"grammar_{config.stem}.json"
    out.write_text(json.dumps(art, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"built {out} — {len(art['items'])} cards (source: manual)")
    print("  NOT synced: copy to memory-quiz-app/data/decks/ by hand.")


def main(argv: list[str] | None = None) -> None:
    p = argparse.ArgumentParser(description="Check/build a grammar-table deck.")
    p.add_argument("--config", type=Path, required=True, help="configs/grammar/<slug>.yaml")
    p.add_argument("--out", type=Path, default=DEFAULT_DECKS_DIR)
    p.add_argument("--build", action="store_true", help="write the artifact (default: check only)")
    args = p.parse_args(argv)

    cfg = yaml.safe_load(args.config.read_text(encoding="utf-8"))
    report = grammar.validate(cfg)
    _print(report, args.config)
    if not report.ok:
        sys.exit(1)
    if args.build:
        _build(cfg, args.config, args.out)
    else:
        sys.exit(0)


if __name__ == "__main__":
    main()
