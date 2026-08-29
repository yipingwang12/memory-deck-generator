"""Fetch monarch reign data from Wikidata and chunk by century."""

from __future__ import annotations

import re
import warnings
from collections import Counter
from dataclasses import dataclass, field

from .corrections import provenance, validate
from .wikidata import _SPARQL_URL, _sparql_session


@dataclass
class Monarch:
    name: str
    accession_year: int
    end_year: int | None
    father: str
    mother: str
    wp_title: str | None = None  # English Wikipedia article title (from sitelinks)
    accession_precision: int | None = None  # Wikidata timePrecision of P580; see _PRECISION
    # Wikidata person Q-number. Trailing and defaulted so hand-built Monarchs in tests and
    # `manual_entries` still compare equal. Only `stale_exclusions` reads it — dedup uses the
    # binding's id directly, from before the Monarch is built.
    person_id: str = ""


# Wikidata timePrecision codes for a time value. Anything below YEAR means the source does not
# actually claim that year — e.g. Assyria's Tudiya is stored as -2450 at DECADE precision,
# meaning "the 2450s BC", and France's Mallobaudes as 378 meaning "the 370s".
# RECORDED FOR DOCUMENTATION ONLY: digit extraction deliberately ignores precision, so decks
# are byte-identical to before this field existed. Surfaced via `report_imprecise_dates`.
_PRECISION = {11: 'day', 10: 'month', 9: 'year', 8: 'decade', 7: 'century', 6: 'millennium'}
YEAR_PRECISION = 9


@dataclass(frozen=True)
class Correction:
    """A manual, sourced override of Wikidata's transition years.

    Wikidata models one P39 statement per ruler, which cannot express a reign interrupted and
    resumed (Murad II 1421–44, deposed, restored 1446–51), and it carries occasional plain date
    errors. A Correction records not just the patch but WHY and against WHAT — so a later reader
    can re-check it, and so `stale_corrections` can report when upstream has caught up."""

    year: int
    action: str   # 'add' | 'drop'
    reason: str   # why Wikidata's own value is wrong or incomplete
    source: str   # what was checked (e.g. the Wikipedia article title)
    checked: str = ''  # ISO date the source was last verified
    # How many times this year should appear in the corrected output. A year can carry more
    # than one transition (two accessions in one year), and a bare add can only assert "at
    # least once" — Hammadid 1105 needs TWO events while Wikidata, dating Badis to 1104,
    # supplies one. This states the TARGET COUNT rather than an append, so the add stays
    # idempotent: it tops up to `count` and does nothing once upstream supplies them all.
    # Meaningless on a drop, which removes every occurrence; `parse_corrections` refuses it.
    count: int = 1


_ACTIONS = ('add', 'drop')


def parse_corrections(raw: list[dict] | None) -> list[Correction]:
    """Parse and validate a config's ``corrections:`` block.

    Raises ValueError rather than skipping a malformed entry: a correction that silently fails
    to apply is indistinguishable in the output from one that was never written."""
    if not raw:
        return []
    out = []
    for i, entry in enumerate(raw):
        validate(entry, i, required=('year', 'action'), actions=_ACTIONS)
        reason, source, checked = provenance(entry)
        count = _parse_count(entry, i)
        out.append(Correction(year=int(entry['year']), action=entry['action'],
                              reason=reason, source=source, checked=checked, count=count))
    return out


def _parse_count(entry: dict, index: int) -> int:
    """The optional ``count:`` of an add — how many occurrences of the year the output should
    carry. Refused on a drop, which removes every occurrence and so cannot honour a count;
    silently ignoring it there would read as if it removed only some."""
    if 'count' not in entry:
        return 1
    if entry['action'] != 'add':
        raise ValueError(f"corrections[{index}]: count applies to 'add' only, not "
                         f"{entry['action']!r} (drop removes every occurrence of a year)")
    count = int(entry['count'])
    if count < 1:
        raise ValueError(f"corrections[{index}]: count must be >= 1, got {count}")
    return count


def correction_years(corrections: list[Correction]) -> tuple[list[int], list[int]]:
    """Split corrections into (add_years, drop_years) for ``make_monarch_chunks``."""
    return ([y for c in corrections if c.action == 'add' for y in [c.year] * c.count],
            [c.year for c in corrections if c.action == 'drop'])


@dataclass(frozen=True)
class TransitionEvent:
    """One transition year, with what happened that year — i.e. **one digit** of a chunk's
    transition string, and the only thing that explains it.

    The digit string is what gets memorised, so the unit a reference table must be keyed on is
    the event, not the ruler: an accession contributes a digit, but so does a reign that ends
    with no same-year successor, and a manual `corrections:` add contributes one belonging to no
    Wikidata statement at all. A per-ruler table cannot line up with the string (it is missing
    the second kind entirely and has no row for the third)."""

    year: int
    kind: str                       # see _EVENT_KINDS
    monarch: Monarch | None = None  # the acceding / departing ruler; None for 'correction'
    note: str = ''                  # correction reason — a correction has no Monarch to name

    @property
    def digit(self) -> str:
        """The memorised digit. `% 10` on a negative (BCE) year still yields 0-9 in Python."""
        return str(self.year % 10)


# 'accession'  — a ruler took the throne this year.
# 'reign_end'  — a reign's recorded end year that is nobody's accession year, so the throne did
#                not pass directly on: a dynasty's last year, an interregnum's start, or
#                Wikidata coronation-lag (Edward the Elder d. 924, Æthelstan crowned 927).
# 'correction' — a sourced manual `add`, for a transition Wikidata cannot express (Murad II's
#                1446 restoration inside one unbroken 1421–1451 statement).
_EVENT_KINDS = ('accession', 'reign_end', 'correction')


@dataclass
class MonarchChunk:
    start_year: int
    end_year: int
    monarchs: list[Monarch] = field(default_factory=list)
    transition_string: str = ""
    # Index-aligned with `transition_string`: events[i] is the event digit i stands for.
    # Built from the same list the string is joined from, so the two cannot disagree.
    events: list[TransitionEvent] = field(default_factory=list)
    #: Card name. Empty means "derive the year range", which is what every timeline chunk
    #: does; an `extra_cards:` entry sets it explicitly. This is the FSRS identity
    #: (`<deck-stem>|<label>`), so it must be unique within a deck — see `make_monarch_chunks`.
    name: str = ""

    @property
    def label(self) -> str:
        return self.name or f"{self.start_year}–{self.end_year}"


_QUERY = """\
SELECT ?person ?personLabel ?start ?startPrec ?end ?fatherLabel ?motherLabel ?wpTitle WHERE {{
  VALUES ?pos {{ {positions} }}
  ?person p:P39 ?stmt .
  ?stmt ps:P39 ?pos .
  ?stmt pq:P580 ?start .{house_clause}
  OPTIONAL {{ ?stmt pqv:P580 ?startNode . ?startNode wikibase:timePrecision ?startPrec }}
  OPTIONAL {{ ?stmt pq:P582 ?end }}
  OPTIONAL {{ ?person wdt:P22 ?father }}
  OPTIONAL {{ ?person wdt:P25 ?mother }}
  OPTIONAL {{
    ?wpArticle schema:about ?person ;
               schema:isPartOf <https://en.wikipedia.org/> ;
               schema:name ?wpTitle .
  }}
  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en" }}
}}
ORDER BY ?start
"""


def _parse_year(value: str) -> int | None:
    """Extract year from an xsd:dateTime string such as '1066-10-14T00:00:00Z'."""
    m = re.match(r"(-?)(\d{4})", value)
    if not m:
        return None
    year = int(m.group(2))
    return -year if m.group(1) else year


def fetch_monarchs(
    position_ids: list[str],
    sparql_url: str = _SPARQL_URL,
    house_ids: list[str] | None = None,
    exclude_people: list[str] | None = None,
) -> list[Monarch]:
    """Fetch monarchs for the given Wikidata position Q-numbers, ordered by accession year.

    ``house_ids`` (optional P53 "noble family" Q-numbers) restrict results to holders in
    those houses — needed when a position is shared across dynasties (e.g. "Emperor of
    China" Q268218 spans every Chinese dynasty; the House of Zhu / Aisin-Gioro filters
    isolate the Ming / Qing rulers from rebels and neighbouring dynasties).

    Returns one Monarch per REIGN, not per person: a ruler deposed and restored appears
    once per separate reign, while statements that touch or overlap (a title change) stay
    one. See `_merge_reigns`.

    ``exclude_people`` (person Q-numbers) drops named holders the position admits but the
    deck should not contain. Positions and houses filter by *category*; this is the escape
    hatch for when upstream membership is simply wrong about an individual — Wikidata's
    ``Byzantine emperor`` is held by thirteen empress *consorts* alongside the emperors and
    the three genuinely regnant empresses.

    Why this exists rather than a year-level ``drop``: a correction removes every event in
    its year, so a wrong holder who shares a year with a real transition can only be removed
    by deleting that transition too and re-adding it as an anonymous ``correction`` — which
    strips the real ruler's name from the reign table. Eight of Byzantium's twenty consort
    digits share their year with an emperor's accession, Justinian I's among them.

    Filtered AFTER the fetch rather than in the query, so an entry that no longer matches
    anyone is visible: upstream may fix a holder or retire a Q-number, and a config full of
    dead exclusions is one nobody can audit. That case warns rather than raising — a stale
    exclusion cannot change the digits, unlike a stale *correction*, which is a claim about
    a year."""
    positions = " ".join(f"wd:{qid}" for qid in position_ids)
    if house_ids:
        houses = " ".join(f"wd:{qid}" for qid in house_ids)
        house_clause = f"\n  ?person wdt:P53 ?house .\n  VALUES ?house {{ {houses} }}"
    else:
        house_clause = ""
    bindings = _sparql_session(sparql_url, _QUERY.format(positions=positions, house_clause=house_clause))
    excluded = set(exclude_people or ())
    if excluded:
        seen_ids = {b.get("person", {}).get("value", "").split("/")[-1] for b in bindings}
        for qid in sorted(excluded - seen_ids):
            warnings.warn(
                f"exclude_people: {qid} matches nobody in the current fetch — "
                "upstream may have fixed it, or the Q-number moved",
                stacklevel=2)

    # Group each person's position statements, then merge only the ones that are actually
    # one reign. See `_merge_reigns` for why that is not the same as "all of them".
    rows: dict[str, list[dict]] = {}
    for b in bindings:
        person_uri = b.get("person", {}).get("value", "")
        person_id = person_uri.split("/")[-1] if person_uri else ""
        name = b.get("personLabel", {}).get("value", "")
        start_val = b.get("start", {}).get("value", "")
        if not person_id or not name or not start_val:
            continue
        if person_id in excluded:
            continue
        if name.startswith("Q") and name[1:].isdigit():
            continue
        if _parse_year(start_val) is None:
            continue
        rows.setdefault(person_id, []).append(b)

    monarchs: list[Monarch] = []
    for person_id, group in rows.items():
        monarchs.extend(_merge_reigns(person_id, group))
    return sorted(monarchs, key=lambda m: (m.accession_year, m.end_year or 9999))


def _merge_reigns(person_id: str, group: list[dict]) -> list[Monarch]:
    """One person's statements -> one Monarch per REIGN, not per person.

    Statements that touch or overlap are one reign; a gap between them is a deposition,
    and both of its transitions are real.

    The old rule merged every statement into a single span — earliest accession, latest
    end — which is right for a title change and wrong for a restoration. Both shapes are
    common and they are distinguishable:

    * **Title change** — contiguous. George III is King of Great Britain 1760-1801 and
      King of the UK 1801-1820: one reign, and splitting it would invent a 1801 handover
      to himself.
    * **Restoration** — separated. Abdallah of Morocco ruled six times between 1729 and
      1757, deposed in between; Wattasid Ahmad ibn Muhammad ruled 1526-1545 and 1547-1549.
      Merging those erased *both* transitions of every deposition — sixteen Alaouite
      reigns became one digit, and the deck taught an unbroken 28-year reign that never
      happened.

    An open-ended statement (no end year) cannot be shown to be separate from the next, so
    it merges: an unknown end is not evidence of a gap.
    """
    def field(b, key, sub="value"):
        return b.get(key, {}).get(sub, "")

    spans = sorted(
        ((_parse_year(field(b, "start")), _parse_year(field(b, "end")) if field(b, "end") else None, b)
         for b in group),
        key=lambda t: (t[0], t[1] if t[1] is not None else 9999),
    )

    out: list[Monarch] = []
    cur_start, cur_end, sources = spans[0][0], spans[0][1], [spans[0][2]]
    for start_year, end_year, b in spans[1:]:
        # `cur_end is None` -> open-ended, so absorb rather than split on an unknown.
        if cur_end is None or start_year <= cur_end:
            if cur_end is not None and (end_year is None or end_year > cur_end):
                cur_end = end_year
            sources.append(b)
        else:
            out.append(_build_monarch(person_id, cur_start, cur_end, sources))
            cur_start, cur_end, sources = start_year, end_year, [b]
    out.append(_build_monarch(person_id, cur_start, cur_end, sources))
    return out


def _build_monarch(person_id: str, accession: int, end: int | None, sources: list[dict]) -> Monarch:
    """One reign's Monarch. Scalar fields take the first non-empty value across the
    statements that make up the reign; precision tracks the accession that won."""
    def first(key):
        for b in sources:
            v = b.get(key, {}).get("value")
            if v:
                return v
        return ""

    precision = None
    for b in sources:
        if _parse_year(b.get("start", {}).get("value", "")) == accession:
            prec = b.get("startPrec", {}).get("value")
            precision = int(prec) if prec else None
            break

    return Monarch(
        person_id=person_id,
        name=first("personLabel"),
        accession_year=accession,
        end_year=end,
        father=first("fatherLabel"),
        mother=first("motherLabel"),
        wp_title=first("wpTitle") or None,
        accession_precision=precision,
    )


def filter_by_accession(
    monarchs: list[Monarch],
    min_year: int | None = None,
    max_year: int | None = None,
) -> list[Monarch]:
    """Keep monarchs whose accession year is within [min_year, max_year] (either bound
    optional). Used to cap a dynasty at a historical end date — e.g. the Abbasid
    caliphate at its 1258 Baghdad fall, excluding the later Cairo figureheads whose
    accessions run to the 1400s under the same Wikidata position."""
    return [
        m for m in monarchs
        if (min_year is None or m.accession_year >= min_year)
        and (max_year is None or m.accession_year <= max_year)
    ]


def _raw_events(monarchs: list[Monarch]) -> list[TransitionEvent]:
    """Transition events implied by Wikidata alone, before any manual correction.

    Every accession year (duplicates kept — two rulers can accede in one year), plus any end
    year that is not itself some ruler's accession year, i.e. the throne did not pass directly
    to a successor that year.

    **Construction order is load-bearing.** Accessions are emitted sorted and first, end-years
    after them in monarch order; the caller's final sort is stable, so within one year an
    accession precedes a reign_end and a correction follows both. That is the order the digit
    string has always been joined in, and the digits are FSRS item strings — reordering two
    digits of a year rewrites the card and strands its history."""
    accession_year_set = {m.accession_year for m in monarchs}
    events = [TransitionEvent(m.accession_year, 'accession', m)
              for m in sorted(monarchs, key=lambda m: m.accession_year)]
    events += [TransitionEvent(m.end_year, 'reign_end', m) for m in monarchs
               if m.end_year is not None and m.end_year not in accession_year_set]
    return events


def _raw_transition_events(monarchs: list[Monarch]) -> list[int]:
    """The years of `_raw_events` — what `stale_corrections` tests membership against."""
    return [e.year for e in _raw_events(monarchs)]


def transition_events(
    monarchs: list[Monarch],
    add_transition_years: list[int] | None = None,
    drop_transition_years: list[int] | None = None,
    corrections: list[Correction] | None = None,
) -> list[TransitionEvent]:
    """Every transition event in year order — the digit string, with its causes attached.

    This is the single source both the deck digits and the reference table are derived from.
    Deriving them separately is the trap: the table would be built from a second pass over the
    same data and could disagree with the string the reader is actually memorising, and no test
    of either alone would catch it.

    ``corrections`` is optional provenance only — the years in ``add_transition_years`` are what
    apply. Passing it lets an added event carry the ``reason`` that justifies it, which is the
    only explanation a correction digit has (there is no Wikidata statement behind it).
    """
    events = _raw_events(monarchs)
    if drop_transition_years:
        dropped = set(drop_transition_years)
        events = [e for e in events if e.year not in dropped]
    reasons = {c.year: c.reason for c in corrections or [] if c.action == 'add'}
    # A MULTISET, not a set: listing a year twice asks for two occurrences of it (Hammadid
    # 1105). Topping up to the requested count keeps the add idempotent — see
    # `make_monarch_chunks` — where appending per request would double a digit the day
    # Wikidata supplies the event itself.
    have = Counter(e.year for e in events)
    for year, wanted in sorted(Counter(add_transition_years or []).items()):
        for _ in range(wanted - have[year]):
            events.append(TransitionEvent(year, 'correction', None, reasons.get(year, '')))
    events.sort(key=lambda e: e.year)       # stable — see `_raw_events`
    return events


def stale_corrections(monarchs: list[Monarch], corrections: list[Correction]) -> list[str]:
    """Corrections that no longer change the output — usually because Wikidata fixed itself.

    An 'add' whose year Wikidata now supplies, or a 'drop' whose year Wikidata no longer emits,
    is dead weight: the config keeps asserting something about upstream that stopped being true.
    Neither is an error (add is idempotent, drop is a no-op), which is exactly why they need
    reporting — otherwise they rot invisibly."""
    events = Counter(_raw_transition_events(monarchs))
    stale = []
    for c in corrections:
        # Counted, not tested for membership: a `count: 2` add is still doing work while
        # upstream supplies only one of the two events.
        if c.action == 'add' and events[c.year] >= c.count:
            stale.append(f"add {c.year}: Wikidata now supplies this year on its own")
        elif c.action == 'drop' and c.year not in events:
            stale.append(f"drop {c.year}: Wikidata no longer emits this year")
    return stale


def report_imprecise_dates(monarchs: list[Monarch]) -> list[str]:
    """Rulers whose accession date is recorded below year precision.

    DOCUMENTATION ONLY — nothing here feeds digit extraction. Wikidata stores such dates as a
    concrete year (Sigfred = 0770 at decade precision), so the pipeline reads them as exact and
    memorises a digit the source never claimed. This surfaces them without changing any deck."""
    out = []
    for m in monarchs:
        p = m.accession_precision
        if p is not None and p < YEAR_PRECISION:
            out.append(f"{m.name}: {m.accession_year} is {_PRECISION.get(p, p)} precision, not an exact year")
    return out


@dataclass
class ExtraCard:
    """A card that is not a slice of the timeline.

    Every monarch card is normally a year window, labelled by its range. That model has no
    room for a realm that SPLIT: the Saadi succession war ran two parallel lines, in
    Marrakesh and in Fes, over the same years 1603-1627. Two cards cannot both be labelled
    "1603-1627" — the label is the FSRS identity — and folding both lines into the century
    card would join two successions into one string that no ruler ever followed.

    So an extra card names itself and lists its own transition years. Its digits are derived
    from those years exactly as a timeline chunk's are, which keeps the invariant that
    `events[i]` explains digit `i`; there is no way to state a digit string directly, and
    therefore no way for the digits and the explanation to drift apart.

    Sourced like a correction, and for the same reason: it is a claim about history that
    Wikidata does not back.
    """
    label: str
    events: list[tuple[int, str]]      # (year, note)
    reason: str
    source: str
    checked: str = ""


def parse_extra_cards(raw: list[dict] | None) -> list[ExtraCard]:
    """Validate an `extra_cards:` config block. Raises rather than skipping a malformed
    entry — a card that silently fails to appear is indistinguishable from one nobody
    wrote, the same rule `corrections.validate` follows."""
    if not raw:
        return []
    cards: list[ExtraCard] = []
    for i, entry in enumerate(raw):
        where = entry.get('label') or f'extra_cards[{i}]'
        for key in ('label', 'reason', 'source'):
            if not entry.get(key):
                raise ValueError(f"{where}: extra card needs a {key}")
        events = entry.get('events') or []
        if not events:
            raise ValueError(f"{where}: extra card needs at least one event")
        parsed: list[tuple[int, str]] = []
        for e in events:
            if 'year' not in e:
                raise ValueError(f"{where}: every event needs a year")
            parsed.append((int(e['year']), e.get('note', '')))
        cards.append(ExtraCard(label=entry['label'], events=parsed,
                               reason=entry['reason'], source=entry['source'],
                               checked=entry.get('checked', '')))
    labels = [c.label for c in cards]
    dupes = {l for l in labels if labels.count(l) > 1}
    if dupes:
        raise ValueError(f"duplicate extra_cards labels: {sorted(dupes)}")
    return cards


def make_monarch_chunks(
    monarchs: list[Monarch],
    chunk_years: int = 100,
    chunk_start_year: int | None = None,
    add_transition_years: list[int] | None = None,
    drop_transition_years: list[int] | None = None,
    corrections: list[Correction] | None = None,
    extra_cards: list[ExtraCard] | None = None,
) -> list[MonarchChunk]:
    """Group monarchs into fixed-width year-range chunks.

    ``extra_cards`` appends cards that are not time windows — see `ExtraCard`. They come
    after the whole timeline rather than interleaved by date, so a reader's century sequence
    runs uninterrupted and the order does not shift when a card's years change.

    The transition_string for each chunk is the last digit of every transition
    year in order. Transition years are accession years plus, for any reign whose
    recorded end year is not itself an accession year, that end year — i.e. the throne
    did not pass directly to a successor that year. This captures a dynasty's final
    year (the last ruler, with no successor) and the start of an interregnum (a gap
    before the next accession), as well as Wikidata coronation-lag (a successor's
    recorded accession a few years after the predecessor's death, e.g. Æthelstan 927
    vs Edward the Elder's death in 924). Continuous same-year successions add nothing.

    ``add_transition_years`` / ``drop_transition_years`` are manual corrections for
    Wikidata's one-statement-per-ruler model, mirroring the award pipeline's
    ``manual_entries`` / ``exclude_entries``. Add covers transitions Wikidata omits —
    a brief deposition and restoration recorded as one unbroken reign (e.g. al-Muqtadir
    deposed for al-Qahir in 929). Drop covers dating artifacts (e.g. Wikidata ends
    al-Musta'in in 865, but he reigned until his 866 deposition). Drop removes every
    occurrence of a year and is applied before add.

    Add is IDEMPOTENT: it declares HOW MANY times a year should appear, and tops up to that,
    rather than appending. Corrections are bets that Wikidata stays wrong, and Wikidata
    improves; an unconditional append would silently double a digit the day upstream fixed the
    underlying statement. ``add_transition_years`` is therefore read as a MULTISET — listing a
    year twice asks for two occurrences of it, which is how a year carrying two transitions is
    expressed when upstream records only one (Hammadid 1105: al-Mansur → Badis in January and
    Badis → Abd al-Aziz in July, with Badis mis-dated to 1104). Use `stale_corrections` to find
    corrections that have become no-ops.

    ``corrections`` is optional and carries provenance only (see `transition_events`); the
    digits are decided by ``add_transition_years``/``drop_transition_years`` either way.
    """
    if not monarchs:
        return []

    events = transition_events(monarchs, add_transition_years, drop_transition_years, corrections)
    if not events:
        return []

    min_year = min(m.accession_year for m in monarchs)
    max_year = max(e.year for e in events)
    start = chunk_start_year if chunk_start_year is not None else min_year

    chunks: list[MonarchChunk] = []
    n = 0
    while True:
        chunk_start = start + n * chunk_years
        if chunk_start > max_year:
            break
        chunk_end = chunk_start + chunk_years - 1
        bucket_events = [e for e in events if chunk_start <= e.year <= chunk_end]
        bucket_monarchs = [m for m in monarchs if chunk_start <= m.accession_year <= chunk_end]
        if bucket_events:
            chunks.append(MonarchChunk(
                start_year=chunk_start,
                end_year=chunk_end,
                monarchs=bucket_monarchs,
                # Joined from the events themselves, so `events[i]` always explains digit i.
                transition_string="".join(e.digit for e in bucket_events),
                events=bucket_events,
            ))
        n += 1

    for card in extra_cards or ():
        if any(c.label == card.label for c in chunks):
            raise ValueError(
                f"extra card {card.label!r} collides with a timeline card of the same label; "
                "the label is the FSRS identity, so the two would be one card with two homes")
        evs = [TransitionEvent(year, 'correction', None, note)
               for year, note in sorted(card.events, key=lambda t: t[0])]
        chunks.append(MonarchChunk(
            start_year=evs[0].year,
            end_year=evs[-1].year,
            monarchs=[],
            transition_string="".join(e.digit for e in evs),
            events=evs,
            name=card.label,
        ))

    return chunks
