"""Major System checks for history-date files (``configs/history``).

A date file holds ``dates:`` entries ``{year, peg, event, scene}`` and optionally
``years_ago`` and ``confidence``. ``year`` is negative for BCE. The peg encodes two digits
(see ``peg_number``) through ``configs/history/major_pegs.yaml``.
"""
from __future__ import annotations

import re
from collections import Counter

DIGIT = {
    "S": "0", "Z": "0",
    "T": "1", "D": "1", "TH": "1", "DH": "1",
    "N": "2", "NG": "2",
    "M": "3",
    "R": "4", "ER": "4",
    "L": "5",
    "JH": "6", "SH": "6", "CH": "6", "ZH": "6",
    "K": "7", "G": "7",
    "F": "8", "V": "8",
    "P": "9", "B": "9",
}
X_CLUSTERS = {("K", "S"), ("G", "Z"), ("K", "SH"), ("G", "ZH")}
CONFIDENCE = {"high", "medium", "low", "disputed", "unverified"}
YEARS_AGO_MIN = 10_000
PRESENT = 2_000  # years_ago -> year offset
APPROXIMATE = "(approximate)"
YEAR_LIKE = re.compile(r"\b\d{3,4}\b")


def major_digits(word: str, phones: list[str]) -> str:
    """Major System digits for one CMUdict pronunciation; a spelled x cluster is one 7."""
    ph = [p.rstrip("012") for p in phones]
    x_left = word.count("x")
    out, i = [], 0
    while i < len(ph):
        if x_left and i + 1 < len(ph) and (ph[i], ph[i + 1]) in X_CLUSTERS:
            out.append("7")
            x_left -= 1
            i += 2
            continue
        if ph[i] in DIGIT:
            out.append(DIGIT[ph[i]])
        i += 1
    return "".join(out)


def peg_number(entry: dict) -> str:
    """Two digits to encode: first two for years_ago and approximate round years, else last two."""
    if "years_ago" in entry:
        return str(entry["years_ago"])[:2]
    year = abs(entry["year"])
    if APPROXIMATE in entry["event"] and year % 100 == 0:
        return str(year)[:2] if year >= 1000 else f"{year // 10:02d}"
    return f"{year % 100:02d}"


def entry_problems(entry: dict, pegs: dict[str, str]) -> list[str]:
    """Rule breaks in one date entry."""
    peg, scene, event, year = entry["peg"], entry["scene"], entry["event"], entry["year"]
    expected = pegs[peg_number(entry)]
    problems = []
    if peg != expected:
        problems.append(f"WRONG PEG {year}: {peg}, expected {expected}")
    if not re.search(rf"\b{peg.upper()}\b", scene):
        problems.append(f"PEG NOT IN SCENE (singular, capitals) {year}: {scene}")
    if re.search(rf"\b{peg.upper()}(S|ES)\b", scene):
        problems.append(f"PLURAL PEG {year}: {scene}")
    if YEAR_LIKE.search(event):
        problems.append(f"YEAR-LIKE NUMBER IN EVENT {year}: {event}")
    if "confidence" in entry and entry["confidence"] not in CONFIDENCE:
        problems.append(f"BAD CONFIDENCE {year}: {entry['confidence']}")
    if "years_ago" in entry:
        if entry["years_ago"] < YEARS_AGO_MIN:
            problems.append(f"YEARS_AGO UNDER {YEARS_AGO_MIN} {year}: use a BCE year")
        if year != PRESENT - entry["years_ago"]:
            problems.append(f"YEAR != {PRESENT} - years_ago {year}: {entry['years_ago']}")
    return problems


def file_problems(dates: list[dict], pegs: dict[str, str]) -> list[str]:
    """Duplicate (year, event) pairs plus every entry's rule breaks."""
    keys = Counter((d["year"], d["event"]) for d in dates)
    problems = [f"DUPLICATE {k}" for k, n in keys.items() if n > 1]
    return problems + [p for d in dates for p in entry_problems(d, pegs)]


def peg_code_problems(pegs: dict[str, str], cmu: dict[str, list[list[str]]]) -> list[str]:
    """Pegs whose CMUdict pronunciations do not give their number."""
    return [f"PEG CODE {num} {word}" for num, word in pegs.items()
            if num not in {major_digits(word, p) for p in cmu.get(word, [])}]


def peg_load(dates: list[dict]) -> Counter:
    """Dates per peg."""
    return Counter(d["peg"] for d in dates)
