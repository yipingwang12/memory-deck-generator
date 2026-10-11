"""deck-counties — county-group acronym decks for one state (see ``counties.py``).

  deck-counties curate STATE --rows ROWS.tsv [--facts FACTS.json] [--title T] [--order N]
      draft configs/counties/STATE.yaml from sheet rows (``acronym<TAB>names``, one per atlas
      group, in order) + the atlas's ``sheet_rows.py`` facts. Prints what needs a hand fix.
  deck-counties build STATE [--out DIR] [--atlas DIR]
      validate the YAML, write the three decks + map images. Default ``--out`` is the quiz
      repo's ``data/decks`` — the decks are ``source: manual`` and committed there.
"""
from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path

import yaml

from . import counties

_ROOT = Path(__file__).resolve().parent.parent.parent
CONFIG_DIR = _ROOT / "configs" / "counties"


def _sibling(name: str) -> Path:
    """A repo next to this one — searched upward so it resolves from a worktree too."""
    for p in _ROOT.parents:
        if (p / name).is_dir():
            return p / name
    sys.exit(f"cannot find sibling repo {name!r} above {_ROOT}")


class _Dumper(yaml.SafeDumper):
    """Lists of scalars inline — one `[piece, name]` or town list per line, reviewable by eye."""


_Dumper.add_representer(list, lambda d, xs: d.represent_sequence(
    "tag:yaml.org,2002:seq", xs, flow_style=not any(isinstance(x, (list, dict)) for x in xs)))


def dump_state(state: dict) -> str:
    return yaml.dump(state, Dumper=_Dumper, sort_keys=False, allow_unicode=True, width=120)


def _read_rows(path: Path) -> list[tuple[str, str]]:
    with path.open(encoding="utf-8") as f:
        rows = [r for r in csv.reader(f, delimiter="\t") if r and r[0].strip()]
    if rows and rows[0][0].lower() == "acronym":
        rows = rows[1:]
    return [(r[0].strip(), r[1].strip()) for r in rows]


def _curate(args) -> int:
    facts_path = args.facts or (_sibling("global-geo-atlas") / "results" / "sheet_rows"
                                / f"{args.state}.facts.json")
    facts = json.loads(Path(facts_path).read_text(encoding="utf-8"))
    state, problems = counties.curate(_read_rows(args.rows), facts,
                                      title=args.title or args.state.title(), order=args.order)
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    out = CONFIG_DIR / f"{args.state}.yaml"
    out.write_text(dump_state(state), encoding="utf-8")
    print(f"→ {out}")
    for p in problems:
        print(f"  check: {p}")
    return 0


def _build(args) -> int:
    path = CONFIG_DIR / f"{args.state}.yaml"
    raw = path.read_bytes()
    state = yaml.safe_load(raw)
    errors = counties.validate(state)
    if errors:
        print("\n".join(f"  error: {e}" for e in errors))
        return 1
    out_dir = args.out or (_sibling("memory-quiz-app") / "data" / "decks")
    geo_path = ((args.atlas or _sibling("global-geo-atlas")) / "data" / "us" / "regions"
                / f"{state['atlas_region']}.json")
    geo = json.loads(geo_path.read_text(encoding="utf-8"))
    decks = counties.assemble(state, raw, f"manual/counties/{args.state}")

    asset_dir = out_dir / "assets" / f"{state['deck_stem']}_map"
    asset_dir.mkdir(parents=True, exist_ok=True)
    for stale in asset_dir.glob("*.webp"):
        stale.unlink()
    for g, rel in zip(state["groups"], decks[f"{state['deck_stem']}_map"]["img"]):
        (out_dir / rel).write_bytes(counties.render_map(geo, set(g["members"])))
    for stem, art in decks.items():
        (out_dir / f"{stem}.json").write_text(json.dumps(art, ensure_ascii=False, indent=2) + "\n",
                                              encoding="utf-8")
        print(f"built {out_dir / stem}.json — {len(art['items'])} cards")
    return 0


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(prog="deck-counties", description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    c = sub.add_parser("curate")
    c.add_argument("state")
    c.add_argument("--rows", type=Path, required=True)
    c.add_argument("--facts", type=Path)
    c.add_argument("--title")
    c.add_argument("--order", type=int, default=520)
    b = sub.add_parser("build")
    b.add_argument("state")
    b.add_argument("--out", type=Path)
    b.add_argument("--atlas", type=Path, help="global-geo-atlas checkout (default: sibling repo)")
    args = p.parse_args(argv)
    return _curate(args) if args.cmd == "curate" else _build(args)


if __name__ == "__main__":
    sys.exit(main())
