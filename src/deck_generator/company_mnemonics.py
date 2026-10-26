"""Memory scenes for company cards — rules in ``configs/companies/mnemonic_policy.md``.

One anchor image per company (Alnylam → LAMB) appears in every scene, so all of a company's
facts hang on one image instead of competing as unrelated scenes. A date or count answer
must carry its Major System peg from ``configs/history/major_pegs.yaml`` — the same list and
last-two-digits rule as the history decks, never a peg chosen by hand.

The quiz sidecar keys each scene by item identity AND records the answer it was written
for; the quiz drops a scene whose answer has since changed.
"""
from __future__ import annotations

import re
from pathlib import Path

import yaml

from .companies import Card

SCHEMA = 1
MAX_WORDS = 25
_COUNTS = {w: i for i, w in enumerate(
    "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen "
    "fifteen sixteen seventeen eighteen nineteen twenty".split())}
_W = "|".join(_COUNTS)
_UNIT = r"(?:x\b|Hz\b|mm\b|storeys?\b|years?\b|months?\b|days?\b|minutes?\b|times\b)"
# One pass in answer order. A count is a quantity only beside a unit or in a range, so the
# digit in a product name (JAM-2, Layer 7, Connect-One) is never pegged.
_NUMBER = re.compile(
    rf"(?:\$|EUR\s?|€|£)\s?(?P<money>\d[\d,]*(?:\.\d+)?)\s*(?P<mult>billion\b|bn\b|B\b)?"
    rf"|(?<![\d.,])(?P<pct>\d+(?:\.\d+)?)\s*%"
    rf"|(?P<area>\d[\d,]*)\s*sq ft"
    rf"|(?<![\d,.$])\b(?P<year>(?:19|20)\d{{2}})\b(?![\d,])"
    rf"|(?<![\d.,])\b(?P<n>\d{{1,2}})\s*(?={_UNIT})"
    rf"|\b(?P<w1>{_W})\s+to\s+(?P<w2>{_W})\b"
    rf"|\b(?P<w>{_W})\b(?=\s+{_UNIT})",
    re.IGNORECASE)


def load_pegs(path: Path) -> dict[str, str]:
    """The 00–99 peg list."""
    return yaml.safe_load(Path(path).read_text(encoding="utf-8"))["pegs"]


def _two_sig(digits: str) -> str:
    """First two significant digits, cut not rounded (235,500 → 23; $6.84 → 68; 1 → 10).
    The multiplier never changes them, so they are read from the figure as written."""
    return re.sub(r"\D", "", digits).lstrip("0")[:2].ljust(2, "0")


def _numbers(answer: str) -> list[tuple[str, str]]:
    """(two digits, unit image or '') per quantity in the answer, in answer order."""
    word = answer.strip().lower()
    if word in _COUNTS or (word.isdigit() and len(word) <= 2):
        return [(f"{_COUNTS.get(word, int(word) if word.isdigit() else 0):02d}", "")]
    out = []
    for m in _NUMBER.finditer(answer):
        if m["money"]:
            out.append((_two_sig(m["money"]), "gold bar" if m["mult"] else "coin"))
        elif m["pct"]:
            out.append((_two_sig(m["pct"]), ""))
        elif m["area"]:
            out.append((_two_sig(m["area"]), "tile"))
        elif m["year"]:
            out.append((m["year"][-2:], ""))
        elif m["n"]:
            out.append((f"{int(m['n']):02d}", ""))
        elif m["w1"]:
            out += [(f"{_COUNTS[m['w1'].lower()]:02d}", ""), (f"{_COUNTS[m['w2'].lower()]:02d}", "")]
        else:
            out.append((f"{_COUNTS[m['w'].lower()]:02d}", ""))
    return out


def expected_pegs(answer: str, pegs: dict[str, str]) -> list[str]:
    """The pegs an answer must carry, in answer order: a year's last two digits, a money
    or area figure's first two significant digits, a count beside a unit or in a range."""
    return [pegs[d] for d, _ in _numbers(answer)]


def unit_images(answer: str) -> list[str]:
    """The size image each money or area figure needs: coin (millions or less),
    gold bar (billions), tile (square feet). The peg gives the digits; the image gives the scale."""
    return [img for _, img in _numbers(answer) if img]


def _capitals(scene: str) -> set[str]:
    """Capitalised words; a possessive or hyphen tail is not part of the word (LAMB's)."""
    return set(re.findall(r"\b[A-Z]{2,}(?:[-'][A-Z]+)*\b", scene))


def _entry_pegs(entry: dict) -> list[str]:
    """``peg: sun`` or ``peg: [tongue, hanger]`` → a list."""
    peg = entry.get("peg") or []
    return [peg] if isinstance(peg, str) else list(peg)


def _peg_problems(qid: str, scene: str, got: list[str], pegs: dict[str, str]) -> list[str]:
    caps, out = _capitals(scene), []
    for p in got:
        if p not in pegs.values():
            out.append(f"{qid}: peg {p!r} not in the peg list")
        elif p.upper() not in caps:
            out.append(f"{qid}: peg {p.upper()} not in capitals in the scene")
    if out:
        return out
    # Answer order is what tells several pegs apart: the first peg is the first number.
    at = [re.search(rf"\b{p.upper()}\b", scene).start() for p in got]
    if at != sorted(at):
        out.append(f"{qid}: pegs must appear in answer order {[p.upper() for p in got]}")
    return out


def _entry_problems(entry: dict, card: Card, anchor: str, pegs: dict[str, str]) -> list[str]:
    qid, scene = entry["qid"], entry.get("scene", "")
    got, out = _entry_pegs(entry), []
    if anchor not in _capitals(scene):
        out.append(f"{qid}: anchor {anchor} not in capitals in the scene")
    if len(scene.split()) > MAX_WORDS:
        out.append(f"{qid}: scene has {len(scene.split())} words (max {MAX_WORDS})")
    want = expected_pegs(card.answer, pegs)
    if want and got != want:
        out.append(f"{qid}: answer {card.answer!r} needs pegs {want}, got {got}")
    for img in unit_images(card.answer):
        if img not in scene.lower():
            out.append(f"{qid}: answer {card.answer!r} needs the unit image {img!r}")
    return out + _peg_problems(qid, scene, got, pegs)


def problems(data: dict, cards: list[Card], pegs: dict[str, str]) -> list[str]:
    """Every rule break in a company's mnemonics file; empty means it ships."""
    by_qid = {c.qid: c for c in cards}
    anchor, seen, out = data["anchor"], set(), []
    for entry in data["cards"]:
        qid = entry["qid"]
        if qid in seen:
            out.append(f"{qid}: scene given twice")
        seen.add(qid)
        if qid not in by_qid:
            out.append(f"{qid}: no such card in curated")
            continue
        out.extend(_entry_problems(entry, by_qid[qid], anchor, pegs))
    return out + story_problems(data)


_QID = re.compile(r"q\d+")
BREAK = "---"


def story_problems(data: dict) -> list[str]:
    """Rule breaks in the optional ``story``: the company's scenes as one narrative.
    An entry is a scene's qid, ``---`` (paragraph break) or a link sentence. Every scene
    appears exactly once, so the story and the per-card scenes cannot disagree. A link
    holds no card fact; unlike a scene it may omit the anchor — it is read only in the story."""
    story = data.get("story")
    if story is None:
        return []
    scenes = {e["qid"] for e in data["cards"]}
    out, seen = [], set()
    for entry in story:
        if entry == BREAK:
            continue
        if _QID.fullmatch(entry):
            if entry not in scenes:
                out.append(f"story: {entry} has no scene")
            elif entry in seen:
                out.append(f"story: {entry} given twice")
            seen.add(entry)
            continue
        if len(entry.split()) > MAX_WORDS:
            out.append(f"story: link has {len(entry.split())} words (max {MAX_WORDS})")
    out += [f"story: {q} missing from the story" for q in sorted(scenes - seen)]
    return out


def assemble(data: dict, cards: list[Card], cfg: dict, deck: str,
             images: set[str] = frozenset()) -> dict:
    """The quiz sidecar: one row per scene, keyed by item and the answer it describes.
    ``images``: qids with a current picture, named ``<qid>.webp`` beside the sidecar.
    A ``story`` refers to scenes by item, never copies their text, so a scene the quiz
    drops for a changed answer leaves the story too."""
    by_qid = {c.qid: c for c in cards}
    story = [{"break": True} if e == BREAK else
             {"item": f"{cfg['namespace']}|{e}"} if _QID.fullmatch(e) else {"text": e}
             for e in data.get("story") or []]
    return {"schema": SCHEMA, "deck": deck, "anchor": data["anchor"],
            **({"story": story} if story else {}),
            "cards": [{"item": f"{cfg['namespace']}|{e['qid']}",
                       "answer": by_qid[e["qid"]].answer, "scene": e["scene"],
                       **({"image": f"{e['qid']}.webp"} if e["qid"] in images else {})}
                      for e in data["cards"]]}
