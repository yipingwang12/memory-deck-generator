"""Compare the index of *Art: The Definitive Visual Guide* against the artworks_famous deck.

Reads OCR text of the book's index (data/art_definitive_index/ocr/*.txt), parses it into
work entries (title + artist) and artist entries, then diffs both axes against the deck.

OCR is imperfect (diacritics, proper nouns), so matching is normalised + fuzzy rather than literal.

Usage: python scripts/compare_art_index.py
Output: results/compare_art_index/
"""

from __future__ import annotations

import json
import re
import unicodedata
from collections import Counter
from difflib import SequenceMatcher
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OCR_DIR = ROOT / "data" / "art_definitive_index" / "ocr"
DECK = ROOT / "data" / "decks" / "artworks_famous.json"
OUT = ROOT / "results" / "compare_art_index"

# A trailing page reference: "535", "23, 39, 398, 584-5", "502-03, 507"
PAGES = r"(?:\d{1,3}(?:[-–]\d{1,3})?)(?:\s*,\s*\d{1,3}(?:[-–]\d{1,3})?)*"
ENTRY_END = re.compile(rf"{PAGES}\s*$")
WORK = re.compile(rf"^(?P<title>.+?)\s*\((?P<artist>[^()]+?)\)\s*(?P<pages>{PAGES})\s*$")
# Name char classes exclude digits: \w would swallow the trailing page numbers.
NAME = r"[^\W\d_][^\W\d_'’.-]*"
ARTIST = re.compile(
    rf"^(?P<surname>[A-Z]{NAME}(?:[-'’]{NAME})*)"
    rf",\s*(?P<forename>[A-Z][^\d]*?)\s*(?P<pages>{PAGES})\s*$"
)

# Nobiliary particles: part of the surname, but never the sorting head.
PARTICLES = {
    "van", "von", "de", "del", "della", "di", "da", "dei", "du", "le", "la",
    "der", "den", "ter", "el", "al", "of",
}

# OCR debris: page furniture, mirrored text from the facing page, stray glyph runs.
NOISE = re.compile(r"^(INDEX|ART|Index)\b|^[^a-zA-Z]*$|XAGNI|^\W{2,}")

STOPWORDS = {"the", "a", "an", "of", "and"}


def strip_accents(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFKD", s) if not unicodedata.combining(c))


def norm(s: str) -> str:
    """Normalise for comparison: accent-free, lowercase, punctuation-free, article-free."""
    s = strip_accents(s).lower()
    s = re.sub(r"[^a-z0-9\s]", " ", s)
    words = [w for w in s.split() if w not in STOPWORDS]
    return " ".join(words)


def norm_person(s: str) -> str:
    """Normalise a person name, dropping initials and honorifics."""
    s = norm(s)
    return " ".join(w for w in s.split() if len(w) > 1)


def surname_keys(name: str) -> set[str]:
    """Candidate surnames for a personal name; a match on any one counts.

    The book indexes works by surname alone ("(van Gogh)") while the deck stores full
    names ("Vincent van Gogh"), so the surname is the only axis the two share. But the
    two disagree on detail: the deck writes "Antonio da Correggio" where the book writes
    "(Correggio)", and appends epithets ("Hans Holbein the Younger"). So emit both the
    particle-bearing form and the bare one and let either hit.
    """
    words = norm_person(name).split()
    # Drop trailing epithets: "the Younger"/"the Elder" ("the" is already a stopword).
    while len(words) > 1 and words[-1] in {"younger", "elder", "yr", "snr", "jnr"}:
        words.pop()
    if not words:
        return set()

    bare = words[-1]
    # Walk back over any nobiliary particles preceding the bare surname.
    i = len(words) - 1
    while i > 0 and words[i - 1] in PARTICLES:
        i -= 1
    return {bare, " ".join(words[i:])}


PAGES_ONLY = re.compile(rf"^{PAGES}$")


def looks_like_text(line: str) -> bool:
    """Reject OCR gibberish: needs enough letters and a plausible vowel ratio.

    A bare page list is kept: an entry's pages routinely wrap onto their own line, and
    dropping it leaves the entry unterminated and eventually discarded.
    """
    if PAGES_ONLY.match(line):
        return True
    letters = [c for c in line if c.isalpha()]
    if len(letters) < 4:
        return False
    vowels = sum(c.lower() in "aeiou" for c in letters)
    return 0.15 <= vowels / len(letters) <= 0.65


def read_entries() -> list[str]:
    """Rejoin OCR-wrapped lines into whole index entries (an entry ends in page numbers)."""
    entries: list[str] = []
    for path in sorted(OCR_DIR.glob("*.txt")):
        buf = ""
        for raw in path.read_text(errors="replace").splitlines():
            line = raw.strip()
            if not line:
                continue
            # A bare page list must be tested first: NOISE's "no letters" rule would eat it.
            if not PAGES_ONLY.match(line) and (NOISE.search(line) or not looks_like_text(line)):
                continue
            buf = f"{buf} {line}".strip() if buf else line
            if ENTRY_END.search(buf):
                entries.append(re.sub(r"\s+", " ", buf))
                buf = ""
            elif len(buf) > 200:  # runaway: never terminated, discard
                buf = ""
    return entries


def parse(entries: list[str]) -> tuple[list[dict], list[dict]]:
    works, artists = [], []
    for e in entries:
        if m := WORK.match(e):
            title, artist = m["title"].strip(), m["artist"].strip()
            # "(Greek)", "(Roman)", "(Chinese)" are cultures, not artists - keep, flag later
            if len(title) > 2:
                works.append({"title": title, "artist": artist, "raw": e})
        elif m := ARTIST.match(e):
            artists.append(
                {
                    "name": f"{m['forename'].strip()} {m['surname'].strip()}".strip(),
                    "surname": m["surname"].strip(),
                    "raw": e,
                }
            )
    return works, artists


def load_deck() -> tuple[dict[str, str], dict[str, str]]:
    d = json.loads(DECK.read_text())
    titles, creators = {}, {}
    for item, answer in zip(d["items"], d["answers"]):
        qid, attr = item.split("|")
        if attr == "title":
            titles[qid] = answer
        elif attr == "creator":
            creators[qid] = answer
    return titles, creators


def build_index(values) -> dict[str, list[str]]:
    idx: dict[str, list[str]] = {}
    for v in values:
        idx.setdefault(norm(v), []).append(v)
    return idx


def fuzzy_hit(needle: str, haystack: dict[str, list[str]], cutoff: float = 0.90) -> str | None:
    """Exact-then-fuzzy lookup, restricted by first token to keep it tractable."""
    if needle in haystack:
        return haystack[needle][0]
    if not needle:
        return None
    head = needle.split()[0]
    for key, vals in haystack.items():
        if key.startswith(head[:4]) and SequenceMatcher(None, needle, key).ratio() >= cutoff:
            return vals[0]
    return None


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    entries = read_entries()
    works, artists = parse(entries)
    deck_titles, deck_creators = load_deck()

    title_idx = build_index(deck_titles.values())
    creator_idx = build_index(deck_creators.values())

    # --- works: book -> deck ---
    matched, missing = [], []
    for w in works:
        hit = fuzzy_hit(norm(w["title"]), title_idx)
        (matched if hit else missing).append({**w, "deck_title": hit})

    # --- artists, matched on surname (the only axis both sides share) ---
    book_artist_names = {a["name"]: a for a in artists}

    def index_keys(name: str) -> set[str]:
        """Keys a name is filed under. Generous: includes every substantial token, so a
        compound surname ("Sorolla y Bastida") is reachable by either half."""
        toks = [t for t in norm_person(name).split() if len(t) >= 4]
        return surname_keys(name) | set(toks)

    def query_keys(name: str) -> set[str]:
        """Keys a name is looked up by. Excludes the leading token, which is normally a
        forename - indexing "claude" is harmless, but querying it would match every Claude."""
        toks = [t for t in norm_person(name).split()[1:] if len(t) >= 4]
        return surname_keys(name) | set(toks)

    def index_by_surname(names) -> dict[str, list[str]]:
        idx: dict[str, list[str]] = {}
        for n in names:
            for key in index_keys(n):
                idx.setdefault(key, []).append(n)
        return idx

    def any_hit(name: str, idx: dict[str, list[str]]) -> str | None:
        for key in query_keys(name):
            if hit := fuzzy_hit(key, idx):
                return hit
        return None

    deck_surname_idx = index_by_surname(set(deck_creators.values()))
    artists_missing = [
        a for name, a in book_artist_names.items() if not any_hit(name, deck_surname_idx)
    ]
    artists_matched = len(book_artist_names) - len(artists_missing)

    # --- deck -> book (creators the book never indexes) ---
    # The book names artists two ways: as index entries, and inline as "(van Gogh)".
    book_surname_idx = index_by_surname(
        list(book_artist_names) + [w["artist"] for w in works]
    )

    deck_creator_counts = Counter(deck_creators.values())
    deck_only = [
        (c, n)
        for c, n in deck_creator_counts.most_common()
        if not any_hit(c, book_surname_idx)
    ]

    # --- write results ---
    (OUT / "summary.md").write_text(
        "\n".join(
            [
                "# Art: The Definitive Visual Guide - index vs artworks_famous",
                "",
                f"- index entries parsed: **{len(entries)}**",
                f"- work entries (title + artist): **{len(works)}**",
                f"- artist entries: **{len(artists)}** ({len(book_artist_names)} unique)",
                f"- deck works: **{len(deck_titles)}**, deck creators: **{len(set(deck_creators.values()))}** unique",
                "",
                "## Works",
                f"- in book and deck: **{len(matched)}** ({len(matched) / max(len(works), 1):.1%})",
                f"- in book, missing from deck: **{len(missing)}**",
                "",
                "## Artists",
                f"- in book and deck: **{artists_matched}**",
                f"- in book, missing from deck: **{len(artists_missing)}**",
                f"- deck creators the book never indexes: **{len(deck_only)}**",
                "",
                "Matching is accent-stripped, lowercased, article-free, with a 0.90 fuzzy fallback",
                "to absorb OCR damage. Counts are approximate at the margin.",
                "",
            ]
        )
    )

    def dump(name: str, rows: list[str]) -> None:
        (OUT / name).write_text("\n".join(rows) + "\n")

    dump("works_missing_from_deck.txt", [f"{w['title']} ({w['artist']})" for w in missing])
    dump("works_matched.txt", [f"{w['title']}  ->  {w['deck_title']}" for w in matched])
    dump("artists_missing_from_deck.txt", sorted(a["name"] for a in artists_missing))
    dump("deck_creators_not_in_book.txt", [f"{n:4d}  {c}" for c, n in deck_only])

    print((OUT / "summary.md").read_text())


if __name__ == "__main__":
    main()
