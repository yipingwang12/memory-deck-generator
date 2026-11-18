"""Etymology rules for person-deck memory scenes — ``configs/people/mnemonic_policy.md``.

Person decks (CoevCon attendees, 2026-11-17) reuse the company scene rules in
``company_mnemonics`` and add one more layer: the anchor and the place images come from the
ETYMOLOGY of a name, not only from its sound. An etymology can be wrong, so each one must
name its source. The quiz shows the etymology after the answer, beside the scene.
"""
from __future__ import annotations

from pathlib import Path

import yaml

from .company_mnemonics import BREAK, _QID

#: An ASD-STE100 sentence limit, like the code-deck stems.
MAX_STEM_WORDS = 25

ETYMOLOGY_KEYS = ("term", "origin", "source")


def _entry_problems(where: str, ety: object) -> list[str]:
    """Problems in one etymology entry: a dict with a non-empty term, origin and source."""
    if not isinstance(ety, dict):
        return [f"{where}: etymology entry must be a mapping with {list(ETYMOLOGY_KEYS)}"]
    return [f"{where}: etymology entry needs a non-empty {k!r}"
            for k in ETYMOLOGY_KEYS if not str(ety.get(k) or "").strip()]


def problems(data: dict) -> list[str]:
    """Every etymology rule break in a person's scenes file; empty means it ships."""
    out = _entry_problems("anchor", data.get("anchor_etymology"))
    for entry in data.get("cards", []):
        for ety in entry.get("etymology") or []:
            out += _entry_problems(entry["qid"], ety)
    return out


def gloss(ety: dict) -> str:
    """One etymology as display text: ``Norman: Old English 'north man'``."""
    return f"{ety['term']}: {ety['origin']}"


def _first_scene(data: dict) -> str | None:
    """The qid of the first scene in the story, else the first card."""
    for entry in data.get("story") or []:
        if entry != BREAK and _QID.fullmatch(entry):
            return entry
    cards = data.get("cards") or []
    return cards[0]["qid"] if cards else None


def add_etymology(sidecar: dict, data: dict, cfg: dict) -> dict:
    """Append each scene's etymologies to its text, and the anchor's to the first scene.

    The quiz shows a scene's text after the answer, so this is where the etymology is read.
    The scene itself stays within the 25-word limit; the etymology is extra text after it."""
    first = _first_scene(data)
    by_item = {f"{cfg['namespace']}|{e['qid']}": e for e in data["cards"]}
    anchor = data["anchor_etymology"]
    for row in sidecar["cards"]:
        entry = by_item[row["item"]]
        etys = list(entry.get("etymology") or [])
        if entry["qid"] == first:
            etys.insert(0, anchor)
        if etys:
            row["scene"] = f"{row['scene']} — Etymology: " + "; ".join(gloss(e) for e in etys)
    sidecar["anchor_etymology"] = gloss(anchor)
    return sidecar


def stem_problems(cards: list, cfg: dict) -> list[str]:
    """Every stem names the person (``stem_name``, default ``deck_name``) and has at most
    25 words: a bare "where did they study?" is unanswerable among 60 person decks."""
    name = cfg.get("stem_name", cfg["deck_name"])
    out = []
    for c in cards:
        if name.lower() not in c.stem.lower():
            out.append(f"{c.qid}: stem does not name {name!r}")
        if len(c.stem.split()) > MAX_STEM_WORDS:
            out.append(f"{c.qid}: stem has {len(c.stem.split())} words (max {MAX_STEM_WORDS})")
    return out


def anchor_clashes(anchor: str, config: Path, pegs: dict[str, str]) -> list[str]:
    """The anchor is no peg word and no other person deck's anchor (same folder)."""
    out = []
    if anchor.lower() in {p.lower() for p in pegs.values()}:
        out.append(f"anchor {anchor} is a peg word")
    for other in sorted(Path(config).parent.glob("*.mnemonics.yaml")):
        if other.name == f"{Path(config).stem}.mnemonics.yaml":
            continue
        data = yaml.safe_load(other.read_text(encoding="utf-8")) or {}
        if str(data.get("anchor", "")).upper() == anchor.upper():
            out.append(f"anchor {anchor} is already used by {other.name}")
    return out
