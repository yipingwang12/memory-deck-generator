"""Fetch famous artworks (title, creator, image) from Wikidata.

Feeds the quiz's image + multiple-choice mode. Three source modes select the QID set:

- ``wikidata`` — paintings ranked by ``wikibase:sitelinks`` (fame proxy), ``min_sitelinks`` /
  ``limit`` knobs. Beware: a low threshold over ~381k paintings can exceed the public
  endpoint's ~60s cap — page by narrower bands or raise the threshold.
- ``curated``  — an explicit ``works: [Q…]`` list (cheap, fully controlled).
- ``collection`` — every work in a ``collection: Q…`` (P195), e.g. a museum.

All three emit the same :class:`Artwork` shape. Distractors and image bytes are handled by
``distractors`` and ``artwork_images``; this module only resolves metadata.
"""

from __future__ import annotations

import sys
from dataclasses import dataclass

from .wikidata import _SPARQL_URL, _sparql_session

PAINTING = "Q3305213"


@dataclass(frozen=True)
class Artwork:
    qid: str
    title: str
    creator: str
    creator_qid: str
    image_url: str
    sitelinks: int
    inception: int | None = None  # year (P571), for same-era distractor biasing


_CORE = {
    "wikidata": (
        "  ?work wdt:P31 wd:{instance} ;\n"
        "        wdt:P170 ?creator ;\n"
        "        wdt:P18 ?img ;\n"
        "        wikibase:sitelinks ?sitelinks .\n"
        "  FILTER({band})\n"
    ),
    "collection": (
        "  ?work wdt:P31 wd:{instance} ;\n"
        "        wdt:P195 wd:{collection} ;\n"
        "        wdt:P170 ?creator ;\n"
        "        wdt:P18 ?img ;\n"
        "        wikibase:sitelinks ?sitelinks .\n"
    ),
    "curated": (
        "  VALUES ?work {{ {works} }}\n"
        "  ?work wdt:P170 ?creator ;\n"
        "        wdt:P18 ?img ;\n"
        "        wikibase:sitelinks ?sitelinks .\n"
    ),
}

# No ORDER BY: sorting the whole fame-filtered catalog on WDQS overflows its 60 s limit (and is
# flaky well before that). Instead ``fetch_artworks`` sweeps narrow sitelink *bands* — each a
# bounded FILTER range that returns fast — and sorts/limits client-side.
_QUERY = """\
SELECT ?work ?workLabel ?creator ?creatorLabel ?img ?sitelinks ?inception WHERE {{
{core}  OPTIONAL {{ ?work wdt:P571 ?inception . }}
  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en" }}
}}"""

# Upper band edges (exclusive). A config's ``min_sitelinks`` becomes the lowest edge; the top
# band is open-ended. Narrower at the low, dense end where a single wide band would be huge.
_BAND_EDGES = (5, 6, 7, 8, 10, 12, 15, 20, 27, 40, 70, 120)


def _sitelink_bands(min_sitelinks: int) -> list[tuple[int, int | None]]:
    """Descending (lo, hi) ranges covering ``[min_sitelinks, ∞)`` — hi=None is open-ended."""
    edges = [e for e in _BAND_EDGES if e > min_sitelinks]
    los = [min_sitelinks] + edges
    his = edges + [None]
    return list(reversed(list(zip(los, his))))


def build_query(config: dict, instance: str | None = None,
                band: tuple[int, int | None] | None = None) -> str:
    """Assemble the SPARQL for a config's source mode.

    ``instance`` selects one media type (a `Q…` id; defaults to the first ``instance_of``).
    ``band`` is a ``(lo, hi)`` sitelink range for wikidata mode (defaults to the open-ended
    ``[min_sitelinks, ∞)``). Multi-type / deep configs issue one query per type per band (in
    ``fetch_artworks``) — one big ``VALUES``/``ORDER BY`` query times out WDQS at scale.
    """
    mode = config.get("source", "wikidata")
    instance = instance or (config.get("instance_of") or [PAINTING])[0]
    if mode == "wikidata":
        lo, hi = band or (config.get("min_sitelinks", 10), None)
        band_filter = f"?sitelinks >= {lo}" + (f" && ?sitelinks < {hi}" if hi else "")
        core = _CORE["wikidata"].format(instance=instance, band=band_filter)
    elif mode == "collection":
        core = _CORE["collection"].format(instance=instance, collection=config["collection"])
    elif mode == "curated":
        works = " ".join(f"wd:{q}" for q in config["works"])
        core = _CORE["curated"].format(works=works)
    else:
        raise ValueError(f"unknown source mode: {mode!r}")
    return _QUERY.format(core=core)


def _qid(uri: str) -> str:
    """``http://www.wikidata.org/entity/Q12418`` → ``Q12418``."""
    return uri.rsplit("/", 1)[-1]


def _is_unresolved(value: str) -> bool:
    """A label that never resolved to a real name. Wikidata falls back to the bare
    Q-number when no English label exists, and an 'unknown value' / 'no value' P170
    statement (an explicitly anonymous work) surfaces as a blank-node or entity URI
    (``http://www.wikidata.org/.well-known/genid/…``)."""
    return value.startswith("http") or (value.startswith("Q") and value[1:].isdigit())


def _year(iso: str | None) -> int | None:
    """Leading year of a Wikidata time literal (``1503-01-01T…`` / ``-0450-…``).

    Returns None for a missing or non-date value — a P571 set to 'unknown value' surfaces as a
    genid URL, not a date literal, and must not crash the whole fetch.
    """
    if not iso:
        return None
    neg = iso.startswith("-")
    digits = iso.lstrip("-").split("-", 1)[0]
    if not digits.isdigit():
        return None
    return -int(digits) if neg else int(digits)


def fetch_artworks(config: dict, sparql_url: str = _SPARQL_URL) -> list[Artwork]:
    """Fetch artworks for a config, deduplicated by QID (highest-fame row wins).

    Multi-media configs issue **one lightweight SPARQL query per ``instance_of`` type** and
    merge the results (a single all-types query times out WDQS at scale). Curated mode is a
    single query. Merged results are re-sorted by descending fame and capped at ``limit`` — so
    the deck is the globally most-famous works across media, not per-type quotas.

    A work with several P18 images or P170 creators yields multiple rows; the highest-fame is
    kept. A row without a usable title or image is dropped; a row whose *creator* is unresolved
    (an anonymous work) is kept with an empty creator (a title-only card downstream).
    """
    mode = config.get("source", "wikidata")
    if mode == "wikidata":
        instances = config.get("instance_of") or [PAINTING]
        bands = _sitelink_bands(config.get("min_sitelinks", 10))
        queries = [(inst, band) for inst in instances for band in bands]
    else:  # curated / collection — bounded, single query per type
        instances = [None] if mode == "curated" else (config.get("instance_of") or [PAINTING])
        queries = [(inst, None) for inst in instances]

    by_qid: dict[str, Artwork] = {}
    for instance, band in queries:
        try:
            bindings = _sparql_session(sparql_url, build_query(config, instance, band))
        except Exception as e:  # a persistently-failing band must not lose the rest
            print(f"  ! artworks fetch: {instance} band {band} failed ({type(e).__name__}) — skipped",
                  file=sys.stderr)
            continue
        for b in bindings:
            qid = _qid(b["work"]["value"])
            title = b.get("workLabel", {}).get("value", "")
            img = b.get("img", {}).get("value", "")
            if not title or not img or _is_unresolved(title):
                continue  # a card needs a real title and an image
            sitelinks = int(b.get("sitelinks", {}).get("value", 0))
            if qid in by_qid and by_qid[qid].sitelinks >= sitelinks:
                continue  # already have a same-or-famer row for this work
            creator = b.get("creatorLabel", {}).get("value", "")
            creator_qid = _qid(b["creator"]["value"]) if b.get("creator") else ""
            if not creator or _is_unresolved(creator):
                creator = creator_qid = ""  # anonymous → title-only downstream
            by_qid[qid] = Artwork(
                qid=qid, title=title, creator=creator, creator_qid=creator_qid,
                image_url=img, sitelinks=sitelinks,
                inception=_year(b.get("inception", {}).get("value")),
            )
    out = sorted(by_qid.values(), key=lambda a: a.sitelinks, reverse=True)
    limit = config.get("limit")
    return out[:limit] if limit else out
