"""Fetch monarch reign data from Wikidata and chunk by century."""

from __future__ import annotations

import re
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
) -> list[Monarch]:
    """Fetch monarchs for the given Wikidata position Q-numbers, ordered by accession year.

    ``house_ids`` (optional P53 "noble family" Q-numbers) restrict results to holders in
    those houses — needed when a position is shared across dynasties (e.g. "Emperor of
    China" Q268218 spans every Chinese dynasty; the House of Zhu / Aisin-Gioro filters
    isolate the Ming / Qing rulers from rebels and neighbouring dynasties)."""
    positions = " ".join(f"wd:{qid}" for qid in position_ids)
    if house_ids:
        houses = " ".join(f"wd:{qid}" for qid in house_ids)
        house_clause = f"\n  ?person wdt:P53 ?house .\n  VALUES ?house {{ {houses} }}"
    else:
        house_clause = ""
    bindings = _sparql_session(sparql_url, _QUERY.format(positions=positions, house_clause=house_clause))

    # Deduplicate by person Q-number, keeping the earliest accession year.
    # A monarch can appear multiple times when their title changes (e.g. George III
    # as King of Great Britain 1760 and King of the UK 1801). We want first accession.
    seen: dict[str, Monarch] = {}
    for b in bindings:
        person_uri = b.get("person", {}).get("value", "")
        person_id = person_uri.split("/")[-1] if person_uri else ""
        name = b.get("personLabel", {}).get("value", "")
        start_val = b.get("start", {}).get("value", "")
        if not person_id or not name or not start_val:
            continue
        if name.startswith("Q") and name[1:].isdigit():
            continue
        year = _parse_year(start_val)
        if year is None:
            continue
        end_val = b.get("end", {}).get("value", "")
        end_year = _parse_year(end_val) if end_val else None
        prec_val = b.get("startPrec", {}).get("value")
        precision = int(prec_val) if prec_val else None
        father = b.get("fatherLabel", {}).get("value", "")
        mother = b.get("motherLabel", {}).get("value", "")
        wp_title = b.get("wpTitle", {}).get("value") or None
        if person_id not in seen:
            seen[person_id] = Monarch(
                name=name,
                accession_year=year,
                end_year=end_year,
                father=father,
                mother=mother,
                wp_title=wp_title,
                accession_precision=precision,
            )
        else:
            m = seen[person_id]
            # Keep earliest accession year and latest end year across all position statements.
            # A monarch deposed and restored (e.g. Stephen 1135–1141, 1141–1154) appears twice;
            # we want accession=1135 and end_year=1154 so the gap-fill logic doesn't insert the
            # intermediate deposition year as a spurious transition event.
            if year < m.accession_year:
                m.accession_year = year
                m.accession_precision = precision   # precision must track the year that wins
            if end_year is not None and (m.end_year is None or end_year > m.end_year):
                m.end_year = end_year
            if not m.father and father:
                m.father = father
            if not m.mother and mother:
                m.mother = mother
            if not m.wp_title and wp_title:
                m.wp_title = wp_title

    return sorted(seen.values(), key=lambda m: m.accession_year)


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


def make_monarch_chunks(
    monarchs: list[Monarch],
    chunk_years: int = 100,
    chunk_start_year: int | None = None,
    add_transition_years: list[int] | None = None,
    drop_transition_years: list[int] | None = None,
    corrections: list[Correction] | None = None,
) -> list[MonarchChunk]:
    """Group monarchs into fixed-width year-range chunks.

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

    return chunks
