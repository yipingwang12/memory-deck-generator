"""Duplicate scan for city timelines: find city cards that repeat a world-grid event in other words.

``deck-history-check`` finds only an exact ``(year, event)`` match between a ``world_ref`` and a
card. This module finds reworded duplicates. It compares each city card with the world events
of a near year (``year_window``) by TF-IDF cosine on the event text, and it also flags a pair
that shares two or more rare words (``rare`` = a word in few events). The result is a ranked
list of candidates for a person to decide. It never changes a file.
"""
from __future__ import annotations

import math
import re
import unicodedata
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from pathlib import Path

import yaml

from .history_dates import APPROXIMATE

STOPWORDS = frozenset("""
a an and are as at be by for from has have he her his in into is it its of on or she that the
their them they this to was were which who with after before about over under than then there
here other new first""".split())
FOLDS = {"st": "saint", "ste": "sainte", "mt": "mount"}
MIN_COS = 0.35
MIN_RARE = 2
RARE_MIN_DF = 5            # a word in this many events or fewer is always rare
RARE_FRACTION = 1 / 1000   # in a big corpus: a word in at most this share of events is rare
LOADER = getattr(yaml, "CSafeLoader", yaml.SafeLoader)  # C parser: ~5x faster on 432 cells


@dataclass(frozen=True)
class Entry:
    """One dated event: a city card (``card``) or a world-grid date (``world``)."""
    year: int
    event: str
    file: str
    kind: str


@dataclass(frozen=True)
class Candidate:
    """A pair of events that can be the same event."""
    card: Entry
    other: Entry
    cos: float
    rare: list[str] = field(default_factory=list)


class IdfTable(dict):
    """Word -> IDF weight. ``default`` is the weight of a word not in the corpus, and
    ``rare_idf`` is the lowest weight that makes a word rare."""
    default: float = 0.0
    rare_idf: float = 0.0


def _fold(word: str) -> str:
    """Fold one lowercase word: abbreviations, possessive, simple plural."""
    word = FOLDS.get(word, word)
    if word.endswith("'s"):
        return word[:-2]
    if len(word) > 3 and word.endswith("s") and not word.endswith(("ss", "us", "is")):
        return word[:-1]
    return word


def tokens(text: str) -> list[str]:
    """Content words of an event text: no accents, numbers, stopwords or approximate marker."""
    text = text.replace(APPROXIMATE, " ")
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode().lower()
    text = text.replace("’", "'")
    words = (_fold(w.strip("'")) for w in re.findall(r"[a-z][a-z']*", text))
    return [w for w in words if w and w not in STOPWORDS]


def _base_window(year: int) -> int:
    """Year tolerance for an exact date: tighter for recent years, wider for BCE."""
    if year >= 1000:
        return 2
    if year >= 0:
        return 5
    return max(10, round(abs(year) * 0.02))


def year_window(entry: Entry) -> int:
    """Largest year difference at which ``entry`` can match another event."""
    w = _base_window(entry.year)
    return 2 * w if APPROXIMATE in entry.event else w


def idf_weights(docs: list[list[str]]) -> IdfTable:
    """Smoothed IDF over ``docs`` (each a token list)."""
    n = len(docs)
    df = Counter(w for d in docs for w in set(d))
    table = IdfTable({w: math.log((n + 1) / (c + 1)) + 1 for w, c in df.items()})
    table.default = max(table.values(), default=1.0)
    rare_df = max(RARE_MIN_DF, n * RARE_FRACTION)
    table.rare_idf = math.log((n + 1) / (rare_df + 1)) + 1
    return table


def _vector(words: list[str], idf: IdfTable) -> dict[str, float]:
    return {w: c * idf.get(w, idf.default) for w, c in Counter(words).items()}


def cosine(a: list[str], b: list[str], idf: IdfTable) -> float:
    """TF-IDF cosine similarity of two token lists."""
    va, vb = _vector(a, idf), _vector(b, idf)
    dot = sum(x * vb[w] for w, x in va.items() if w in vb)
    if not dot:
        return 0.0
    return dot / (math.sqrt(sum(x * x for x in va.values())) *
                  math.sqrt(sum(x * x for x in vb.values())))


def _rare_shared(a: list[str], b: list[str], idf: IdfTable) -> list[str]:
    return sorted(w for w in set(a) & set(b) if idf.get(w, idf.default) >= idf.rare_idf)


def _pair(card: Entry, other: Entry, toks: dict[Entry, list[str]], idf: IdfTable,
          min_cos: float, min_rare: int) -> Candidate | None:
    """A candidate when the years are close and the texts are similar enough."""
    if abs(card.year - other.year) > max(year_window(card), year_window(other)):
        return None
    cos = cosine(toks[card], toks[other], idf)
    rare = _rare_shared(toks[card], toks[other], idf)
    if cos >= min_cos or len(rare) >= min_rare:
        return Candidate(card, other, round(cos, 3), rare)
    return None


def candidates(cards: list[Entry], world: list[Entry], *, min_cos: float = MIN_COS,
               min_rare: int = MIN_RARE, cross_city: bool = False) -> list[Candidate]:
    """Ranked candidate pairs: each card against world events, and with ``cross_city`` each
    card against cards of other city files. Best match first."""
    toks = {e: tokens(e.event) for e in [*cards, *world]}
    idf = idf_weights(list(toks.values()))
    by_year: dict[int, list[Entry]] = defaultdict(list)
    for e in world:
        by_year[e.year].append(e)
    hits = []
    for card in cards:
        span = 2 * _base_window(card.year)
        for y in range(card.year - span, card.year + span + 1):
            hits += [h for o in by_year.get(y, ()) if (h := _pair(card, o, toks, idf, min_cos, min_rare))]
    if cross_city:
        for i, a in enumerate(cards):
            hits += [h for b in cards[i + 1:] if a.file != b.file
                     and (h := _pair(a, b, toks, idf, min_cos, min_rare))]
    return sorted(hits, key=lambda h: (-h.cos, -len(h.rare), h.card.year))


def _load(path: Path) -> dict:
    return yaml.load(path.read_text(encoding="utf-8"), Loader=LOADER)


def load_cards(path: Path) -> list[Entry]:
    """The cards (``dates:``) of one city era file. References are not cards."""
    data = _load(path)
    return [Entry(d["year"], d["event"], path.stem, "card") for d in data.get("dates") or []]


def load_world(cells_dir: Path, world_dates: Path) -> list[Entry]:
    """Every date of every world-grid cell and of ``world_dates.yaml``."""
    out = []
    for path in [*sorted(cells_dir.glob("*.yaml")), world_dates]:
        data = _load(path)
        out += [Entry(d["year"], d["event"], path.stem, "world") for d in data.get("dates") or []]
    return out
