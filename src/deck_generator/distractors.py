"""Baked multiple-choice distractors for artwork decks.

Multiple choice tests *recognition*, a weak signal unless the wrong options are plausible
(see the quiz PRD's retention-testing table). So distractors are biased toward the same
domain: for a **title** card the strongest confuser is another work by the *same creator*,
then works of the same *era*; for a **creator** card, creators of the same era.

Everything is **deterministic** — the option order is seeded by the artwork's QID — so a
re-export produces byte-identical ``choices`` and never churns the quiz's FSRS ``item_key``.
"""

from __future__ import annotations

import difflib
import hashlib
import random
import re
import unicodedata

from .artworks import JOINT_SEP, Artwork

_ERA_UNKNOWN = 10 ** 6

# Two options at or above this similarity (after normalisation) are one name in two spellings.
_NEAR_DUP_RATIO = 0.9
_DROPPED_WORDS = {"the", "a", "an"}
_WORD_ALIASES = {"st": "saint"}
_NUMBER_WORDS = {"one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
                 "first", "second", "third", "fourth", "fifth"}
_ROMAN = re.compile(r"^(?=[ivxlcdm]+$)m{0,3}(cm|cd|d?c{0,3})(xc|xl|l?x{0,3})(ix|iv|v?i{0,3})$")


def _name_words(value: str) -> list[str]:
    """Words of ``value`` without case, accents, punctuation or articles; "St" → "saint"."""
    text = unicodedata.normalize("NFKD", value)
    text = "".join(c for c in text if not unicodedata.combining(c)).casefold()
    words = re.sub(r"[^\w\s]", " ", text).split()
    return [_WORD_ALIASES.get(w, w) for w in words if w not in _DROPPED_WORDS]


def _number_words(words: list[str]) -> set[str]:
    """The words that number a work in a series: digits, Roman numerals, number words."""
    return {w for w in words if w.isdigit() or _ROMAN.match(w) or w in _NUMBER_WORDS}


def is_near_duplicate(a: str, b: str) -> bool:
    """True when ``a`` and ``b`` are one name in two spellings.

    Examples: "Last Judgment" / "The Last Judgement", "Lot and His Daughters" / "Lot and his
    Daughters". Two such options in one question test spelling, not recognition. Series
    siblings stay distinct: a different number ("Composition IV" / "Composition VI") or a
    different word ("Dance in the City" / "Dance in the Country") is a different work.
    """
    wa, wb = _name_words(a), _name_words(b)
    if _number_words(wa) != _number_words(wb):
        return False
    return difflib.SequenceMatcher(None, " ".join(wa), " ".join(wb)).ratio() >= _NEAR_DUP_RATIO


def _stable_tiebreak(a_qid: str, b_qid: str) -> int:
    """Reproducible pseudo-random ordering for candidates that rank equally."""
    return int(hashlib.sha256(f"{a_qid}|{b_qid}".encode()).hexdigest()[:8], 16)


def _is_joint(value: str) -> bool:
    """A credited-set answer ("Hubert van Eyck & Jan van Eyck") rather than one name."""
    return JOINT_SEP in value


def _rank(art: Artwork, other: Artwork, attr: str, same_creator_bias: bool) -> tuple:
    """Sort key ranking ``other`` as a distractor for ``art`` (lower = more plausible).

    Shape is matched before anything else on creator cards: a work with no principal creator
    answers with a credited *set*, and a two-name answer sitting among three one-name options
    is pickable on shape alone — the card would test noticing an ampersand, not recognising the
    artwork. So joint answers draw joint distractors and single answers draw single ones,
    whenever the deck has enough of each kind (``_options_for`` falls back rather than return a
    short list).
    """
    if art.inception is not None and other.inception is not None:
        era = abs(other.inception - art.inception)
    else:
        era = _ERA_UNKNOWN
    same_creator = other.creator_qid == art.creator_qid and bool(art.creator_qid)
    tier = 0 if (attr == "title" and same_creator_bias and same_creator) else 1
    shape = 0 if _is_joint(getattr(other, attr)) == _is_joint(getattr(art, attr)) else 1
    return ((shape, tier, era, _stable_tiebreak(art.qid, other.qid)) if attr == "creator"
            else (tier, era, _stable_tiebreak(art.qid, other.qid)))


def _options_for(art: Artwork, others: list[Artwork], attr: str, count: int,
                 same_creator_bias: bool) -> list[str]:
    correct = getattr(art, attr)
    ranked = sorted(others, key=lambda o: _rank(art, o, attr, same_creator_bias))
    distractors: list[str] = []
    for o in ranked:
        value = getattr(o, attr)
        if not value or any(is_near_duplicate(value, kept) for kept in [correct, *distractors]):
            continue  # skip empty (anon), exact and near duplicates
        distractors.append(value)
        if len(distractors) == count - 1:
            break
    options = [correct] + distractors
    random.Random(f"{art.qid}|{attr}").shuffle(options)  # deterministic placement
    return options


def build_choices(artworks: list[Artwork], attr: str, count: int = 4,
                  same_creator_bias: bool = True) -> dict[str, list[str]]:
    """Map each artwork's QID → its shuffled option list (correct answer included).

    ``attr`` is ``"title"`` or ``"creator"``. Artworks with an empty ``attr`` (an anonymous
    work has no ``creator``) get no option list and are never offered as a distractor. When
    the deck is too small to supply ``count - 1`` distinct distractors, the option list is
    shorter (never padded with duplicates). The correct answer is always present exactly once.
    """
    return {
        art.qid: _options_for(art, [o for o in artworks if o.qid != art.qid],
                              attr, count, same_creator_bias)
        for art in artworks if getattr(art, attr)
    }
