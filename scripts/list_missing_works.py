"""List every artistic work in the index of *Art: The Definitive Visual Guide* that is
absent from the artworks_famous deck - works of any kind, not only paintings.

The book's index italicises work titles, but OCR loses italics, so works are recovered two ways:
  A. attributed - "Title (Attribution) 123", where the attribution is an artist or a culture
     ("(Greek)", "(Roman)"). High confidence.
  B. anonymous  - a plain title-case entry with no attribution (The Book of Kells, Borobudur).
     Recovered heuristically by excluding topics, movements, people and places; needs review.

Usage: python scripts/list_missing_works.py
Output: results/list_missing_works/
"""

from __future__ import annotations

import json
import re
from pathlib import Path

from compare_art_index import (
    ARTIST,
    DECK,
    PAGES,
    WORK,
    build_index,
    fuzzy_hit,
    norm,
    read_entries,
    surname_keys,
)

OUT = Path(__file__).resolve().parent.parent / "results" / "list_missing_works"

# Words that mark an entry as a topic, movement, institution or period rather than a work.
TOPIC_WORDS = {
    "art", "arts", "artist", "artists", "school", "schools", "movement", "group",
    "academy", "academie", "dynasty", "culture", "cultures", "period", "style",
    "painting", "paintings", "sculpture", "drawing", "drawings", "printmaking",
    "architecture", "photography", "ceramics", "pottery", "engraving", "etching",
    "fresco", "watercolor", "watercolour", "tempera", "collage", "mosaic",
    "century", "war", "revolution", "commune", "empire", "kingdom", "republic",
    "church", "cathedral", "chapel", "museum", "gallery", "collection", "exhibition",
    "salon", "biennale", "society", "brotherhood", "guild", "workshop", "studio",
    "renaissance", "baroque", "rococo", "gothic", "romanesque", "classical",
    "king", "queen", "emperor", "empress", "pope", "duke", "duchess", "cardinal",
    "prince", "princess", "lord", "lady", "sir", "saint", "master", "colour", "color",
    "perspective", "composition", "technique", "materials", "pigment", "canvas",
    # Groups, dynasties, periods and materials seen in the anonymous tier.
    "family", "dynasty", "sezession", "secession", "avant", "garde", "bronze", "age",
    "islands", "island", "crayons", "crayon", "pencil", "charcoal", "oils", "acrylic",
    "brotherhood", "circle", "square", "die", "der", "das", "group", "salon",
}

# Movement names ending in -ism are topics ("Cubism", "Neoclassicism", "Symbolism").
ISM = re.compile(r"\b\w+ism\b", re.I)

# "Surname, Forename", "Duquesnoy. Francois", "Fischer von Erlach, Johann" are people.
PERSONISH = re.compile(r"^[A-Z][\w'’-]+(?:\s+(?:von|van|de|del|della|di|da|le|la)\s+[\w'’-]+)*[,.]\s")

# Titles and honorifics that mark a biographical entry rather than a work.
PERSON_MARKERS = {
    "elector", "inquisition", "barbarossa", "great", "younger", "elder",
}

ENTRY = re.compile(rf"^(?P<body>.+?)\s*(?P<pages>{PAGES})\s*$")

# Every "Title (Attribution)" pair in an entry. Two index entries routinely OCR into one
# line ("Be Mysterious (Gauguin) The Beach at Fecamp (Marquet) 387"), so matching only the
# last pair would fuse them into a single bogus work.
PAIR = re.compile(r"(?P<title>[^()]+?)\s*\((?P<artist>[^()]+?)\)")

# Attributions that are cultures rather than named artists - still a work.
CULTURES = {
    "greek", "roman", "egyptian", "chinese", "japanese", "byzantine", "celtic",
    "persian", "indian", "islamic", "korean", "african", "aztec", "mayan", "inca",
    "etruscan", "assyrian", "sumerian", "minoan", "mycenaean", "olmec", "moche",
    "german", "french", "italian", "flemish", "dutch", "spanish", "english",
}


# Page numbers from the preceding entry leak onto the front of a title when lines join
# badly ("146 a St. Mark", "33 see: The Money Lender"). Strip a leading number plus any
# short lowercase debris, but only when a capitalised title follows - titles like Ben
# Nicholson's "1933 (guitar)" or Still's "1955-D" are genuine and must survive.
LEADING_JUNK = re.compile(r"^\d{1,4}\s*[^\w(]*\s*(?:[a-z|]{1,6}[:;.,]?\s+){0,3}(?=[A-Z])")


def clean_title(title: str) -> str:
    # Strip first: LEADING_JUNK is anchored, so a leading space would defeat it.
    return LEADING_JUNK.sub("", title.strip(" .,;:|")).strip(" .,;:|")


def is_topic(title: str) -> bool:
    words = norm(title).split()
    if not words:
        return True
    if any(w in TOPIC_WORDS for w in words):
        return True
    if ISM.search(title):
        return True
    return False


def looks_like_title(title: str, people: set[str], people_surnames: set[str]) -> bool:
    """Title-case phrase of plausible length, not a person or a topic."""
    if not (3 <= len(title) <= 70):
        return False
    if PERSONISH.match(title) or is_topic(title):
        return False
    # Any parenthesis here means an OCR merge artifact: attributed works are handled
    # by WORK, so a stray bracket is damage ("Die Kathearale (Schwitters").
    if "(" in title or ")" in title:
        return False
    # Digits mid-entry are leaked page references from a mis-joined line.
    if re.search(r"\d", title):
        return False
    # An entry that is simply an artist's name is not a work.
    if norm(title) in people:
        return False
    words = norm(title).split()
    if any(w in PERSON_MARKERS for w in words):
        return False
    # A short entry ending in a known artist surname is that artist, not a work
    # ("Dong Yuan", "Hans von Aachen"). Long titles may legitimately end in a name.
    if len(words) <= 3 and surname_keys(title) & people_surnames:
        return False
    words = [w for w in title.split() if w]
    if len(words) < 2:  # single bare words are almost always topics
        return False
    # Needs a capitalised head and mostly capitalised significant words.
    if not title[0].isupper() and not title.lower().startswith(("the ", "a ", "an ")):
        return False
    signif = [w for w in words if len(w) > 3]
    if not signif:
        return False
    caps = sum(w[0].isupper() for w in signif)
    return caps / len(signif) >= 0.5


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    entries = read_entries()

    deck = json.loads(DECK.read_text())
    deck_creators = [a for i, a in zip(deck["items"], deck["answers"]) if i.endswith("|creator")]

    # Names that must never be mistaken for a work title: the book's own artist entries,
    # every attribution it uses, and every creator the deck knows.
    people: set[str] = {norm(c) for c in deck_creators}
    for e in entries:
        if m := ARTIST.match(e):
            people.add(norm(f"{m['forename']} {m['surname']}"))
            people.add(norm(f"{m['surname']} {m['forename']}"))
        elif m := WORK.match(e):
            people.add(norm(m["artist"]))

    people_surnames = {k for n in people for k in surname_keys(n)}

    attributed: list[dict] = []
    anonymous: list[dict] = []

    for e in entries:
        if WORK.match(e):
            for pm in PAIR.finditer(e):
                title = clean_title(pm["title"])
                attribution = pm["artist"].strip()
                # A fragment left by a bad line join ("ation (Campin)") starts lowercase.
                if title[:1].islower() and not title.lower().startswith(("the ", "a ", "an ")):
                    continue
                if len(title) > 2 and not is_topic(title):
                    kind = "culture" if norm(attribution) in CULTURES else "artist"
                    attributed.append({"title": title, "by": attribution, "kind": kind})
            continue
        if ARTIST.match(e):
            continue
        if m := ENTRY.match(e):
            title = clean_title(m["body"])
            if looks_like_title(title, people, people_surnames):
                anonymous.append({"title": title, "by": "", "kind": "anonymous"})

    # Deduplicate on normalised title, keeping the first (attributed beats anonymous).
    seen: dict[str, dict] = {}
    for w in attributed + anonymous:
        seen.setdefault(norm(w["title"]), w)
    works = list(seen.values())

    # Diff against the deck.
    deck_titles = [a for i, a in zip(deck["items"], deck["answers"]) if i.endswith("|title")]
    title_idx = build_index(deck_titles)

    missing, present = [], []
    for w in works:
        hit = fuzzy_hit(norm(w["title"]), title_idx)
        (present if hit else missing).append(w)

    missing.sort(key=lambda w: norm(w["title"]))

    def fmt(w: dict) -> str:
        return f"{w['title']} ({w['by']})" if w["by"] else w["title"]

    (OUT / "missing_works.txt").write_text("\n".join(fmt(w) for w in missing) + "\n")
    (OUT / "missing_works.json").write_text(json.dumps(missing, indent=2, ensure_ascii=False))

    by_kind = {k: [w for w in missing if w["kind"] == k] for k in ("artist", "culture", "anonymous")}
    for kind, rows in by_kind.items():
        (OUT / f"missing_{kind}.txt").write_text("\n".join(fmt(w) for w in rows) + "\n")

    (OUT / "summary.md").write_text(
        "\n".join(
            [
                "# Works in the book index, absent from artworks_famous",
                "",
                f"- index entries parsed: **{len(entries)}**",
                f"- works identified: **{len(works)}** "
                f"({len(attributed)} attributed, {len(anonymous)} anonymous, deduplicated)",
                f"- already in deck: **{len(present)}**",
                f"- **missing from deck: {len(missing)}**",
                "",
                "| kind | missing |",
                "|---|---|",
                *[f"| {k} | {len(v)} |" for k, v in by_kind.items()],
                "",
                "`artist` = attributed to a named artist; `culture` = attributed to a culture",
                "(Greek, Roman); `anonymous` = plain title, recovered heuristically and the",
                "noisiest tier. Title matching is fuzzy (0.90) over accent-stripped, article-free",
                "text to absorb OCR damage.",
                "",
            ]
        )
    )
    print((OUT / "summary.md").read_text())


if __name__ == "__main__":
    main()
