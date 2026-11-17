"""Memory hooks for artwork title cards → the quiz's mnemonic sidecar.

Series siblings ("Composition IV" / "Composition VI") sit together in one question by design
(same-creator bias). A hook ties the word or number that differs to a thing visible in that
picture. Hooks are hand-written in ``configs/artworks/<deck>.mnemonics.yaml``; this module
checks them against the built deck and writes ``memory-quiz-app/data/mnemonics/<deck>.json``
(schema 1, the same sidecar company scenes use, keyed by item).
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import yaml

_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CONFIG = _ROOT / "configs" / "artworks" / "famous.mnemonics.yaml"
DEFAULT_DECKS = _ROOT / "data" / "decks"
DEFAULT_OUT = _ROOT.parent / "memory-quiz-app" / "data" / "mnemonics"
MNEMONIC_SCHEMA = 1
MAX_SCENE_WORDS = 30


def load_hooks(path: Path = DEFAULT_CONFIG) -> dict:
    """Read a hooks config: ``{deck, cards: [{work, answer, scene}]}``."""
    return yaml.safe_load(Path(path).read_text(encoding="utf-8"))


def _title_answers(deck: dict) -> dict[str, str]:
    """QID → title answer, from a built artwork deck artifact."""
    return {item.split("|")[0]: ans for item, ans in zip(deck["items"], deck["answers"])
            if item.endswith("|title")}


def hook_problems(cfg: dict, deck: dict) -> list[str]:
    """Every rule break in ``cfg`` against the built ``deck``; empty when clean."""
    titles = _title_answers(deck)
    problems, seen = [], set()
    for card in cfg.get("cards") or []:
        work, answer, scene = card.get("work"), card.get("answer"), (card.get("scene") or "")
        if work in seen:
            problems.append(f"{work}: listed twice")
        seen.add(work)
        if work not in titles:
            problems.append(f"{work}: not a title card in {deck.get('name')}")
        elif titles[work] != answer:
            problems.append(f"{work}: answer {answer!r} but the deck says {titles[work]!r}")
        if not scene.strip():
            problems.append(f"{work}: empty scene")
        elif len(scene.split()) > MAX_SCENE_WORDS:
            problems.append(f"{work}: scene has {len(scene.split())} words (max {MAX_SCENE_WORDS})")
    return problems


def build_sidecar(cfg: dict, deck: dict) -> dict:
    """The quiz sidecar for ``cfg``. Raises ``ValueError`` on any rule break."""
    problems = hook_problems(cfg, deck)
    if problems:
        raise ValueError("artwork hooks refused:\n  " + "\n  ".join(problems))
    return {"schema": MNEMONIC_SCHEMA, "deck": cfg["deck"], "cards": [
        {"item": f"{c['work']}|title", "answer": c["answer"], "scene": c["scene"]}
        for c in cfg["cards"]]}


def main(argv: list[str] | None = None) -> None:
    """``deck-artwork-mnemonics``: check hooks; ``--build`` writes the quiz sidecar."""
    ap = argparse.ArgumentParser(description=main.__doc__)
    ap.add_argument("--config", type=Path, default=DEFAULT_CONFIG)
    ap.add_argument("--decks", type=Path, default=DEFAULT_DECKS)
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT)
    ap.add_argument("--build", action="store_true")
    args = ap.parse_args(argv)
    cfg = load_hooks(args.config)
    deck = json.loads((args.decks / f"{cfg['deck']}.json").read_text(encoding="utf-8"))
    sidecar = build_sidecar(cfg, deck)
    if args.build:
        args.out.mkdir(parents=True, exist_ok=True)
        (args.out / f"{cfg['deck']}.json").write_text(
            json.dumps(sidecar, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
