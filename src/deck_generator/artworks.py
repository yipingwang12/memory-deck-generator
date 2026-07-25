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

import hashlib
import json
import sys
from dataclasses import asdict, dataclass, replace
from pathlib import Path

from .corrections import provenance, validate
from .wikidata import _SPARQL_URL, _sparql_session

PAINTING = "Q3305213"

_ROOT = Path(__file__).resolve().parent.parent.parent

# Persistent metadata cache. The banded sweep is ~60 SPARQL queries (12 sitelink bands × 5 media
# types) and dominates an export at ~10 of its ~12 minutes — yet it is entirely invariant to the
# things that actually change between exports (a creator correction, a distractor tweak). Mirrors
# ``deck_export``'s ``cache/equation_pools.json``, including its central lesson: a stale cache that
# silently serves old data is worse than a slow rebuild.
#
# **Bump ``_META_ENGINE_VERSION`` whenever the fetch or its parsing changes** — the query shape,
# ``_BAND_EDGES``, ``_is_unresolved``, ``_principal_creator``, ``_year``, or the ``Artwork`` fields.
# Otherwise a fix to any of them keeps serving results produced by the old logic.
_META_ENGINE_VERSION = "v1-principal-creator-2026-07-25"
_META_CACHE_PATH = _ROOT / "cache" / "artworks_meta.json"

# The cache key hashes the config MINUS these — deliberately an exclude-list, not an include-list.
# Anything not named here contributes to the key, so a config knob added later busts the cache by
# default instead of being silently ignored. Getting that backwards is how a cache ships wrong data.
_NON_FETCH_KEYS = frozenset({
    "corrections",      # applied after the fetch, to its results
    "distractors",      # baked downstream from the fetched set
    "image_px", "image_workers", "cache_only",  # image pipeline, not metadata
    "deck_name", "group",                        # presentation only
})

# Separator for a work with no principal creator, whose answer is the credited set (the Ghent
# Altarpiece is "Hubert van Eyck & Jan van Eyck", not either brother). ``distractors`` keys off
# this string: a multi-name answer among single-name options would be guessable without knowing
# the artwork, so joint answers draw joint distractors.
JOINT_SEP = " & "


@dataclass(frozen=True)
class Artwork:
    qid: str
    title: str
    creator: str
    creator_qid: str
    image_url: str
    sitelinks: int
    inception: int | None = None  # year (P571), for same-era distractor biasing
    # Every creator Wikidata credits, as (qid, label), ascending by QID. Usually one. More than
    # one means ``creator`` above was *chosen*, not read — see ``_principal_creator``. Kept so
    # ``stale_corrections`` can tell a settled work from one answered by tiebreak.
    creator_candidates: tuple[tuple[str, str], ...] = ()


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


@dataclass(frozen=True)
class ArtworkCorrection:
    """A manual, sourced override of Wikidata's creator for one work.

    Two failure modes need patching, and neither is expressible upstream-side by us:

    - **``set``** — a work with several P170 statements, where the pipeline cannot know which
      one carries the work. Wikidata credits the Ghent Altarpiece to both van Eyck brothers and
      the Siegessäule to six sculptors plus its architect; picking one is an art-historical
      judgment, not a field lookup. Also covers a plainly wrong single statement (The Magpie is
      credited to Picasso on a Monet painting).
    - **``exclude``** — no answerable creator exists: the work is anonymous, its creator
      statement is junk (the Riace bronzes are credited to "Greeks"), or the attribution is
      disowned by the sources.

    ``value`` is the answer string shown on the card, so a joint credit is written out in full
    and joined with ``JOINT_SEP``. Corrections change only the answer text, never the item
    string (``<QID>|creator``), so applying one preserves the card's FSRS history.
    """

    work: str          # QID
    action: str        # 'set' | 'exclude'
    value: str         # replacement creator ('' for exclude)
    reason: str        # why Wikidata's own value is wrong, unusable, or ambiguous
    source: str        # what was checked (article title / URL)
    checked: str = ''  # ISO date the source was last verified


_ART_ACTIONS = ('set', 'exclude')


def parse_artwork_corrections(raw: list[dict] | None) -> dict[str, ArtworkCorrection]:
    """Parse and validate a config's ``corrections:`` block, keyed by QID.

    Raises rather than skipping a malformed entry, and rejects a duplicate ``work``: two
    corrections for one QID means one of them silently loses, which is exactly the invisible
    failure the raise-don't-skip rule exists to prevent.
    """
    if not raw:
        return {}
    out: dict[str, ArtworkCorrection] = {}
    for i, entry in enumerate(raw):
        required = ('work', 'action') + (('value',) if entry.get('action') == 'set' else ())
        validate(entry, i, required=required, actions=_ART_ACTIONS)
        reason, source, checked = provenance(entry)
        work = str(entry['work'])
        if work in out:
            raise ValueError(f"corrections[{i}]: duplicate correction for {work}")
        out[work] = ArtworkCorrection(work=work, action=entry['action'],
                                      value=str(entry.get('value', '')), reason=reason,
                                      source=source, checked=checked)
    return out


def apply_corrections(artworks: list[Artwork],
                      corrections: dict[str, ArtworkCorrection]) -> list[Artwork]:
    """Rewrite creators per the config's corrections, dropping ``exclude``d creator cards.

    An ``exclude`` clears the creator rather than removing the work — the title card is still
    perfectly answerable, and ``_build_artwork_deck`` already emits title-only cards for
    anonymous works. A correction for a QID that is not in this fetch is ignored here and
    reported by ``stale_corrections``.
    """
    out = []
    for a in artworks:
        c = corrections.get(a.qid)
        if c is None:
            out.append(a)
        elif c.action == 'exclude':
            out.append(replace(a, creator='', creator_qid=''))
        else:
            out.append(replace(a, creator=c.value, creator_qid=''))
    return out


def stale_corrections(artworks: list[Artwork],
                      corrections: dict[str, ArtworkCorrection]) -> list[str]:
    """Corrections that no longer earn their place.

    Two ways an entry dies: the work left the deck (fame floor, media type, dead image), or —
    the interesting one — Wikidata resolved the ambiguity itself, leaving a single creator
    where we once had to choose. Neither is an error, which is why they need reporting rather
    than silence. Uncorrected ambiguity is reported too: a work with several creators and no
    correction is answered by the deterministic tiebreak, which is stable but arbitrary.
    """
    present = {a.qid: a for a in artworks}
    stale = []
    for qid, c in sorted(corrections.items()):
        a = present.get(qid)
        if a is None:
            stale.append(f"{qid} ({c.action}): no longer in the deck")
        elif c.action == 'set' and len(a.creator_candidates) == 1 and a.creator == c.value:
            stale.append(f"{qid} (set): Wikidata now supplies this creator on its own")
    for a in artworks:
        if len(a.creator_candidates) > 1 and a.qid not in corrections:
            stale.append(f"{a.qid}: {len(a.creator_candidates)} creators, no correction — "
                         f"answering {a.creator!r} by tiebreak")
    return stale


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
    candidates: dict[str, dict[str, str]] = {}
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
            creator = b.get("creatorLabel", {}).get("value", "")
            creator_qid = _qid(b["creator"]["value"]) if b.get("creator") else ""
            if creator and creator_qid and not _is_unresolved(creator):
                candidates.setdefault(qid, {})[creator_qid] = creator
            sitelinks = int(b.get("sitelinks", {}).get("value", 0))
            if qid in by_qid and by_qid[qid].sitelinks >= sitelinks:
                continue  # already have a same-or-famer row for this work
            by_qid[qid] = Artwork(
                qid=qid, title=title, creator="", creator_qid="", image_url=img,
                sitelinks=sitelinks, inception=_year(b.get("inception", {}).get("value")),
            )
    # Creator is settled only after every band/type query has been seen, since a work's P170
    # statements arrive as separate rows that may straddle queries.
    out = []
    for qid, a in by_qid.items():
        cands = tuple(sorted(candidates.get(qid, {}).items(), key=_qid_sort))
        cqid, cname = _principal_creator(cands)
        out.append(replace(a, creator=cname, creator_qid=cqid, creator_candidates=cands))
    out.sort(key=lambda a: (-a.sitelinks, a.qid))
    limit = config.get("limit")
    return out[:limit] if limit else out


def _meta_cache_key(config: dict) -> str:
    """Hash of everything about ``config`` that can change what the fetch returns."""
    payload = {k: v for k, v in sorted(config.items()) if k not in _NON_FETCH_KEYS}
    payload["_engine"] = _META_ENGINE_VERSION
    return hashlib.sha256(
        json.dumps(payload, sort_keys=True, ensure_ascii=False, default=str).encode()
    ).hexdigest()


def _to_row(a: Artwork) -> dict:
    return asdict(a)


def _from_row(row: dict) -> Artwork:
    """Rebuild an Artwork, restoring tuple-ness that JSON flattens to lists."""
    row = dict(row)
    row["creator_candidates"] = tuple(tuple(c) for c in row.get("creator_candidates", ()))
    return Artwork(**row)


def fetch_artworks_cached(config: dict, sparql_url: str = _SPARQL_URL,
                          refresh: bool = False,
                          cache_path: Path | None = None) -> list[Artwork]:
    """``fetch_artworks`` with its result persisted to ``cache/artworks_meta.json``.

    A cache hit is reported on stderr rather than passing silently: served-from-cache is
    exactly the state where a wrong answer looks like a fast one, so it should be visible in
    the export log. ``refresh=True`` (``--refresh-metadata``) bypasses the read and rewrites
    the entry — the escape hatch for when upstream Wikidata itself has changed.

    Cache failures are never fatal: an unreadable or unwritable cache degrades to a live
    fetch, because a broken cache must not be able to break an export.
    """
    path = cache_path or _META_CACHE_PATH
    key = _meta_cache_key(config)
    if not refresh:
        try:
            hit = json.loads(path.read_text(encoding="utf-8")).get(key)
        except (OSError, ValueError):
            hit = None
        if hit is not None:
            arts = [_from_row(r) for r in hit]
            print(f"  artworks metadata: {len(arts)} works from cache (key {key[:12]}, "
                  f"engine {_META_ENGINE_VERSION}); --refresh-metadata to re-query",
                  file=sys.stderr)
            return arts

    arts = fetch_artworks(config, sparql_url)
    try:
        try:
            store = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            store = {}
        store[key] = [_to_row(a) for a in arts]
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(store, ensure_ascii=False), encoding="utf-8")
        print(f"  artworks metadata: cached {len(arts)} works (key {key[:12]})", file=sys.stderr)
    except OSError as e:
        print(f"  ! artworks metadata: cache write failed ({e}); continuing", file=sys.stderr)
    return arts


def _qid_sort(item: tuple[str, str]) -> tuple[int, str]:
    """Sort key putting Q-numbers in numeric order (Q42 before Q1000)."""
    qid = item[0]
    return (int(qid[1:]), qid) if qid[1:].isdigit() else (1 << 62, qid)


def _principal_creator(candidates: tuple[tuple[str, str], ...]) -> tuple[str, str]:
    """The creator to answer with, given every P170 Wikidata credits.

    One candidate is the whole story. Several means Wikidata cannot tell us which one carries
    the work — a collaboration, a monument's architect vs its sculptors, a disputed attribution
    — and no field settles it. The honest fix is a sourced ``corrections:`` entry; this is only
    the fallback for a work nobody has adjudicated yet.

    The fallback is **lowest QID**, chosen purely because it is *stable*. What it replaced was
    not: the previous code kept whichever row SPARQL happened to return first, and WDQS makes no
    ordering guarantee without ``ORDER BY``, so a re-export could silently flip a card's answer
    while its ``item_key`` — and so its FSRS history — stayed put. An arbitrary-but-fixed answer
    is a data-quality problem you can find with ``stale_corrections``; an arbitrary-and-moving
    one is a bug that hides.
    """
    if not candidates:
        return "", ""          # anonymous → title-only card downstream
    return candidates[0]
