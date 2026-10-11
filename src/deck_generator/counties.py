"""County memorization decks: one state's county-group acronyms → three quiz decks.

Source is a committed per-state YAML (``configs/counties/<state>.yaml``): each atlas county
group carries its acronym split into pieces, each piece paired with the full name it stands
for, plus every county's seat and largest town. ``curate`` drafts that YAML from sheet-style
rows (``acronym<TAB>names``) and the atlas's ``sheet_rows.py`` facts; ``build`` turns it into

- **pieces** (``text-mc``): the acronym with one piece highlighted → pick the full name;
- **seats** (``text-mc``): a county → pick its seat; a second card for its largest town
  when that differs from the seat;
- **map** (``type-in``): the state's county outlines with one group in red → type the
  acronym, lowercase.

Item strings are positional identities (``counties:MI|piece|g01|p03``), never the displayed
text, so correcting a name or a typo keeps a card's FSRS history.
"""
from __future__ import annotations

import hashlib
import io
import math
import random
import re
from dataclasses import dataclass, field
from functools import lru_cache

from PIL import Image, ImageDraw

MAX_SEGMENT_WORDS = 4
N_CHOICES = 4


# --------------------------------------------------------------------- alignment

def split_units(acronym: str) -> list[str]:
    """'LvnHowLAGF' → ['Lvn', 'How', 'L', 'A', 'G', 'F'] — one unit per capital."""
    return re.findall(r"[A-Z][a-z]*", acronym)


def _tokens(name: str) -> list[str]:
    """Alphabetic runs: "L'Anse" → ['L', 'Anse'], 'Sault Ste. Marie' → ['Sault', 'Ste', 'Marie']."""
    return re.findall(r"[A-Za-z]+", name)


def _subsequence(needle: str, hay: str) -> bool:
    it = iter(hay)
    return all(ch in it for ch in needle)


def unit_fits(unit: str, token: str) -> bool:
    """A unit abbreviates a token: same first letter, the rest in order (Lvn → Livingston)."""
    u, t = unit.lower(), token.lower()
    return bool(u and t) and u[0] == t[0] and _subsequence(u[1:], t[1:])


def piece_fits(piece: str, name: str) -> bool:
    """A piece's units land on increasing tokens of the name, the first on its first token.
    Later tokens may go unabbreviated ('B' = Bay City)."""
    units, toks = split_units(piece), _tokens(name)
    if not units or not toks or not unit_fits(units[0], toks[0]):
        return False
    t = 1
    for u in units[1:]:
        while t < len(toks) and not unit_fits(u, toks[t]):
            t += 1
        if t == len(toks):
            return False
        t += 1
    return True


def align(acronym: str, names: str, lexicon: set[str]) -> list[tuple[str, str]] | None:
    """Split a sheet row into (piece, name) pairs, or None if no split fits.

    Several splits can fit ('Iron Mountain' vs 'Iron' + 'Mountain'), so prefer the one with
    the most names found in ``lexicon`` (known counties and places), then fewer pieces.
    """
    units, words = split_units(acronym), names.split()
    if "".join(units) != acronym:
        return None
    known = {n.lower() for n in lexicon}

    @lru_cache(maxsize=None)
    def best(i: int, j: int):
        if i == len(units) and j == len(words):
            return (0, 0), ()
        top = None
        for k in range(j + 1, min(len(words), j + MAX_SEGMENT_WORDS) + 1):
            name = " ".join(words[j:k])
            for m in range(i + 1, len(units) + 1):
                piece = "".join(units[i:m])
                if not piece_fits(piece, name):
                    continue
                sub = best(m, k)
                if sub is None:
                    continue
                score = (sub[0][0] + (name.lower() in known), sub[0][1] - 1)
                if top is None or score > top[0]:
                    top = (score, ((piece, name),) + sub[1])
        return top

    found = best(0, 0)
    return list(found[1]) if found else None


# --------------------------------------------------------------------- validation

def validate(state: dict) -> list[str]:
    """Every group's pieces must spell its acronym and each piece must fit its name."""
    errors = []
    for i, g in enumerate(state["groups"], 1):
        pieces = g["pieces"]
        if "".join(p for p, _ in pieces) != g["acronym"]:
            errors.append(f"group {i}: pieces do not spell {g['acronym']!r}")
        errors += [f"group {i}: piece {p!r} does not fit {n!r}"
                   for p, n in pieces if not piece_fits(p, n)]
        if not g.get("members"):
            errors.append(f"group {i}: no member counties")
    errors += [f"county {x['county']}: no seat" for x in state["counties"] if not x.get("seat")]
    return errors


# --------------------------------------------------------------------- cards

@dataclass(frozen=True)
class Card:
    item: str
    label: str
    stem: str
    answer: str
    choices: list[str] = field(default_factory=list)
    mark: list[int] | None = None      # [start, end) of the highlighted piece in ``stem``
    img: str | None = None


def _item(state: dict, *parts: str) -> str:
    return f"counties:{state['usps']}|" + "|".join(parts)


def _choices(item: str, answer: str, ranked: list[list[str]]) -> list[str]:
    """Answer + the first N_CHOICES-1 distinct candidates, taking tiers in order and
    shuffling within each tier by ``item`` so a rebuild is byte-identical."""
    rng = random.Random(item)
    picked: list[str] = []
    for tier in ranked:
        tier = sorted({t for t in tier if t and t != answer and t not in picked})
        rng.shuffle(tier)
        picked += tier[:N_CHOICES - 1 - len(picked)]
        if len(picked) == N_CHOICES - 1:
            break
    if len(picked) < N_CHOICES - 1:
        raise ValueError(f"{item}: only {len(picked)} distractors for {answer!r}")
    options = [answer] + picked
    rng.shuffle(options)
    return options


def _name_pool(state: dict) -> list[str]:
    names = {n for g in state["groups"] for _, n in g["pieces"]}
    for x in state["counties"]:
        names |= {x["county"], x["seat"], x.get("largest")}
    return sorted(n for n in names if n)


def piece_cards(state: dict) -> list[Card]:
    """One card per acronym piece: the acronym with that piece marked → its full name.
    Distractors are names the same letters could abbreviate, then same-initial names."""
    pool = _name_pool(state)
    cards = []
    for gi, g in enumerate(state["groups"], 1):
        start = 0
        for pi, (piece, name) in enumerate(g["pieces"], 1):
            item = _item(state, "piece", f"g{gi:02d}", f"p{pi:02d}")
            ranked = [[n for n in pool if piece_fits(piece, n)],
                      [n for n in pool if n[0].lower() == piece[0].lower()], pool]
            cards.append(Card(item, f"Group {gi}", g["acronym"], name,
                              _choices(item, name, ranked), [start, start + len(piece)]))
            start += len(piece)
    return cards


def seat_cards(state: dict) -> list[Card]:
    """Per county: its seat; then its largest town when that is not the seat. Each card's
    first distractor is the other one of the pair — the confusion this deck exists for."""
    unit = state.get("unit_word", "County")
    by_group: dict[int, list[dict]] = {}
    for x in state["counties"]:
        by_group.setdefault(x["group"], []).append(x)
    all_seats = [x["seat"] for x in state["counties"]]
    all_largest = [x.get("largest") for x in state["counties"]]
    cards = []
    for x in state["counties"]:
        mates = by_group[x["group"]]
        towns = x.get("towns", [])
        largest = x.get("largest") or x["seat"]
        item = _item(state, "seat", x["county"])
        cards.append(Card(item, f"{x['county']} · seat", f"{x['county']} {unit} — county seat?",
                          x["seat"], _choices(item, x["seat"], [
                              [largest], towns, [m["seat"] for m in mates], all_seats])))
        if largest != x["seat"]:
            item = _item(state, "largest", x["county"])
            cards.append(Card(item, f"{x['county']} · largest",
                              f"{x['county']} {unit} — largest city?", largest,
                              _choices(item, largest, [
                                  [x["seat"]], towns, [m.get("largest") for m in mates],
                                  all_largest])))
    return cards


def map_cards(state: dict) -> list[Card]:
    """One card per group: the outline map with the group in red → the lowercase acronym."""
    return [Card(_item(state, "map", f"g{gi:02d}"), f"Group {gi}",
                 "Type the acronym for the red counties", g["acronym"].lower(),
                 img=f"assets/{state['deck_stem']}_map/g{gi:02d}.webp")
            for gi, g in enumerate(state["groups"], 1)]


# --------------------------------------------------------------------- map render

LAND, EDGE = (246, 246, 246, 255), (110, 110, 110, 255)
RED, RED_EDGE = (214, 39, 40, 255), (120, 16, 16, 255)
CLEAR = (0, 0, 0, 0)
SUPERSAMPLE = 2


def _polygons(geom: dict) -> list[list]:
    return [geom["coordinates"]] if geom["type"] == "Polygon" else geom["coordinates"]


def render_map(geo: dict, highlight: set[str], width: int = 900, pad: int = 12) -> bytes:
    """WebP of every county outline (water bodies left out), ``highlight`` names in red,
    on a transparent background. Equirectangular, x scaled by cos(mid-latitude)."""
    feats = [f for f in geo["features"] if f["properties"].get("TYPE_2") != "Waterbody"]
    pts = [p for f in feats for poly in _polygons(f["geometry"]) for ring in poly for p in ring]
    lons, lats = [p[0] for p in pts], [p[1] for p in pts]
    k = math.cos(math.radians((min(lats) + max(lats)) / 2))
    span_x, span_y = (max(lons) - min(lons)) * k, max(lats) - min(lats)
    s = SUPERSAMPLE
    scale = (width - 2 * pad) * s / span_x
    size = (width * s, int(span_y * scale + 2 * pad * s))

    def xy(ring):
        return [((lon - min(lons)) * k * scale + pad * s, (max(lats) - lat) * scale + pad * s)
                for lon, lat in ring]

    img = Image.new("RGBA", size, CLEAR)
    draw = ImageDraw.Draw(img)
    ordered = sorted(feats, key=lambda f: f["properties"]["NAME_2"] in highlight)
    for f in ordered:
        red = f["properties"]["NAME_2"] in highlight
        for poly in _polygons(f["geometry"]):
            draw.polygon(xy(poly[0]), fill=RED if red else LAND, outline=RED_EDGE if red else EDGE,
                         width=s)
            for hole in poly[1:]:
                draw.polygon(xy(hole), fill=CLEAR, outline=EDGE, width=s)
    img = img.resize((size[0] // s, size[1] // s), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, "WEBP", lossless=True)
    return buf.getvalue()


# --------------------------------------------------------------------- curate / assemble

def curate(rows: list[tuple[str, str]], facts: dict, *, title: str, order: int) -> tuple[dict, list[str]]:
    """Draft a state YAML from sheet rows (one per atlas group, in order) and atlas facts.
    Returns (state, problems); a row that cannot be aligned keeps empty pieces."""
    counties = facts["counties"]
    n_groups = max(x["group"] for x in counties)
    lexicon = {x["county"] for x in counties} | set(facts["places"])
    problems = []
    if len(rows) != n_groups:
        problems.append(f"{len(rows)} rows for {n_groups} atlas groups")
    groups = []
    for gi in range(1, n_groups + 1):
        members = [x["gadm"] for x in counties if x["group"] == gi]
        acronym, names = rows[gi - 1] if gi <= len(rows) else ("", "")
        pieces = align(acronym, names, lexicon) if acronym else None
        if pieces is None:
            problems.append(f"group {gi}: cannot align {acronym!r} with {names!r}")
        else:
            problems += [f"group {gi}: {n!r} is not a known county or place"
                         for _, n in pieces if n not in lexicon]
        groups.append({"members": members, "acronym": acronym,
                       "pieces": [list(p) for p in pieces or []]})
    state = {
        "state": title, "usps": facts["usps"], "atlas_region": facts["state"],
        "deck_stem": f"counties_{facts['state']}", "order": order, "group": "Counties",
        "groups": groups,
        "counties": [{k: x[k] for k in ("county", "group", "seat", "largest", "towns")}
                     for x in counties],
    }
    return state, problems


def _envelope(state: dict, kind: str, deck_type: str, mode: str, title: str, cards: list[Card],
              config_path: str, config_hash: str, offset: int) -> dict:
    return {
        "order": state.get("order", 520) + offset,
        "name": f"{state['state']} · {title}",
        "deck_type": deck_type,
        "mode": mode,
        "title": f"{state['state']} counties · {title}",
        "group": state.get("group", "Counties"),
        "items": [c.item for c in cards],
        "labels": [c.label for c in cards],
        "stems": [c.stem for c in cards],
        "answers": [c.answer for c in cards],
        "poem_title": None,
        "config_path": config_path,
        "config_hash": config_hash,
        "source": "manual",
        "namespace": f"counties:{state['usps']}|{kind}",
    }


def assemble(state: dict, config_bytes: bytes, config_path: str) -> dict[str, dict]:
    """deck stem → artifact, for the three decks."""
    h = hashlib.sha256(config_bytes).hexdigest()
    stem = state["deck_stem"]
    pieces, seats, maps = piece_cards(state), seat_cards(state), map_cards(state)
    out = {
        f"{stem}_pieces": {**_envelope(state, "piece", "county-acronym", "text-mc",
                                       "acronym pieces", pieces, config_path, h, 0),
                           "choices": [c.choices for c in pieces],
                           "marks": [c.mark for c in pieces]},
        f"{stem}_seats": {**_envelope(state, "seat", "county-seat", "text-mc",
                                      "seats & largest cities", seats, config_path, h, 1),
                          "choices": [c.choices for c in seats]},
        f"{stem}_map": {**_envelope(state, "map", "county-map", "type-in", "map acronyms",
                                    maps, config_path, h, 2),
                        "img": [c.img for c in maps]},
    }
    return out
