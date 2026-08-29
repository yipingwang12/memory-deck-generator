from unittest.mock import patch

import pytest

from deck_generator.monarchs import (
    Correction, Monarch, MonarchChunk, correction_years, fetch_monarchs, filter_by_accession,
    make_monarch_chunks, parse_corrections, parse_extra_cards, report_imprecise_dates,
    stale_corrections,
    transition_events,
)

_SAMPLE_BINDINGS = [
    {
        "person": {"value": "http://www.wikidata.org/entity/Q12345"},
        "personLabel": {"value": "Alfred the Great"},
        "start": {"value": "0871-01-01T00:00:00Z"},
        "end": {"value": "0899-01-01T00:00:00Z"},
        "fatherLabel": {"value": "Æthelwulf"},
        "motherLabel": {"value": "Osburh"},
    },
    {
        "person": {"value": "http://www.wikidata.org/entity/Q12346"},
        "personLabel": {"value": "Edward the Elder"},
        "start": {"value": "0899-01-01T00:00:00Z"},
        "end": {"value": "0924-01-01T00:00:00Z"},
        "fatherLabel": {"value": "Alfred the Great"},
        "motherLabel": {"value": "Ealhswith"},
    },
    {
        "person": {"value": "http://www.wikidata.org/entity/Q12347"},
        "personLabel": {"value": "William I"},
        "start": {"value": "1066-12-25T00:00:00Z"},
        "end": {"value": "1087-09-09T00:00:00Z"},
        "fatherLabel": {"value": "Robert I, Duke of Normandy"},
        "motherLabel": {"value": "Herleva"},
    },
]


def _mock_sparql(bindings):
    with patch("deck_generator.monarchs._sparql_session", return_value=bindings) as m:
        yield m


# fetch_monarchs
def test_fetch_basic():
    with patch("deck_generator.monarchs._sparql_session", return_value=_SAMPLE_BINDINGS):
        monarchs = fetch_monarchs(["Q18810062"])
    assert len(monarchs) == 3
    assert monarchs[0].name == "Alfred the Great"
    assert monarchs[0].accession_year == 871
    assert monarchs[0].end_year == 899
    assert monarchs[0].father == "Æthelwulf"
    assert monarchs[0].mother == "Osburh"


def test_fetch_ordered_by_accession():
    with patch("deck_generator.monarchs._sparql_session", return_value=_SAMPLE_BINDINGS):
        monarchs = fetch_monarchs(["Q18810062"])
    years = [m.accession_year for m in monarchs]
    assert years == sorted(years)


def test_fetch_missing_end_year():
    bindings = [{
        "person": {"value": "http://www.wikidata.org/entity/Q99999"},
        "personLabel": {"value": "Charles III"},
        "start": {"value": "2022-09-08T00:00:00Z"},
        "fatherLabel": {"value": "Charles, Prince of Wales"},
        "motherLabel": {"value": "Elizabeth II"},
    }]
    with patch("deck_generator.monarchs._sparql_session", return_value=bindings):
        monarchs = fetch_monarchs(["Q192444"])
    assert monarchs[0].end_year is None


def test_fetch_skips_unlabelled_q_ids():
    bindings = [
        {"person": {"value": "http://www.wikidata.org/entity/Q99"}, "personLabel": {"value": "Q99"}, "start": {"value": "0871-01-01T00:00:00Z"}},
        _SAMPLE_BINDINGS[0],
    ]
    with patch("deck_generator.monarchs._sparql_session", return_value=bindings):
        monarchs = fetch_monarchs(["Q18810062"])
    assert len(monarchs) == 1


def test_fetch_deduplicates_same_person_same_year():
    duplicate = dict(_SAMPLE_BINDINGS[0])
    with patch("deck_generator.monarchs._sparql_session", return_value=[_SAMPLE_BINDINGS[0], duplicate]):
        monarchs = fetch_monarchs(["Q18810062"])
    assert len(monarchs) == 1


def test_fetch_deduplicates_same_person_different_title():
    # Same person Q-number, two positions with different start years (title change, not new monarch)
    row_early = {
        "person": {"value": "http://www.wikidata.org/entity/Q127318"},
        "personLabel": {"value": "George III"},
        "start": {"value": "1760-01-01T00:00:00Z"},
    }
    row_late = {
        "person": {"value": "http://www.wikidata.org/entity/Q127318"},
        "personLabel": {"value": "George III"},
        "start": {"value": "1801-01-01T00:00:00Z"},
    }
    with patch("deck_generator.monarchs._sparql_session", return_value=[row_early, row_late]):
        monarchs = fetch_monarchs(["Q110324075", "Q111722535"])
    assert len(monarchs) == 1
    assert monarchs[0].accession_year == 1760  # earliest wins


def test_fetch_merges_parent_info():
    row1 = {"person": {"value": "http://www.wikidata.org/entity/Q12345"}, "personLabel": {"value": "Alfred the Great"}, "start": {"value": "0871-01-01T00:00:00Z"}}
    row2 = {**row1, "fatherLabel": {"value": "Æthelwulf"}, "motherLabel": {"value": "Osburh"}}
    with patch("deck_generator.monarchs._sparql_session", return_value=[row1, row2]):
        monarchs = fetch_monarchs(["Q18810062"])
    assert monarchs[0].father == "Æthelwulf"
    assert monarchs[0].mother == "Osburh"


def test_fetch_query_contains_position_ids():
    with patch("deck_generator.monarchs._sparql_session", return_value=[]) as mock_session:
        fetch_monarchs(["Q18810062", "Q192444"])
    query = mock_session.call_args[0][1]
    assert "wd:Q18810062" in query
    assert "wd:Q192444" in query


def test_fetch_empty():
    with patch("deck_generator.monarchs._sparql_session", return_value=[]):
        assert fetch_monarchs(["Q18810062"]) == []


def test_fetch_no_house_clause_by_default():
    with patch("deck_generator.monarchs._sparql_session", return_value=[]) as mock_session:
        fetch_monarchs(["Q18810062"])
    query = mock_session.call_args[0][1]
    assert "wdt:P53" not in query   # unfiltered position query unchanged


def test_fetch_adds_house_clause_when_given():
    with patch("deck_generator.monarchs._sparql_session", return_value=[]) as mock_session:
        fetch_monarchs(["Q268218"], house_ids=["Q5185064", "Q934262"])
    query = mock_session.call_args[0][1]
    assert "wdt:P53" in query
    assert "wd:Q5185064" in query
    assert "wd:Q934262" in query


# --- exclude_people: per-person removal ---------------------------------------
#
# Year-level corrections cannot express "this person is not a ruler of this realm".
# A `drop` removes every event in the year, so a consort or wrong-realm claimant who
# shares a year with a real transition can only be removed by also deleting that
# transition and re-adding it as an anonymous correction — which strips the real
# ruler's name from the reign table. Byzantium needed this for 8 such years.

def test_exclude_people_removes_that_person():
    with patch("deck_generator.monarchs._sparql_session", return_value=_SAMPLE_BINDINGS):
        monarchs = fetch_monarchs(["Q18810062"], exclude_people=["Q12346"])
    assert [m.name for m in monarchs] == ["Alfred the Great", "William I"]


def test_exclude_people_leaves_a_shared_year_intact():
    """The whole point: the excluded person's year-mate keeps their row and their name."""
    rival = {
        **_SAMPLE_BINDINGS[1],
        "person": {"value": "http://www.wikidata.org/entity/Q99999"},
        "personLabel": {"value": "Consort of Edward"},
    }
    with patch("deck_generator.monarchs._sparql_session",
               return_value=[*_SAMPLE_BINDINGS, rival]):
        monarchs = fetch_monarchs(["Q18810062"], exclude_people=["Q99999"])
    edward = [m for m in monarchs if m.accession_year == 899]
    assert len(edward) == 1
    assert edward[0].name == "Edward the Elder"   # not replaced, not anonymised


def test_exclude_people_defaults_to_nothing():
    with patch("deck_generator.monarchs._sparql_session", return_value=_SAMPLE_BINDINGS):
        assert len(fetch_monarchs(["Q18810062"])) == 3


def test_exclude_people_is_not_a_query_filter():
    """Filtered after the fetch, not in SPARQL — so `stale_exclusions` can see that an
    exclusion no longer matches anything, the way `stale_corrections` does."""
    with patch("deck_generator.monarchs._sparql_session", return_value=[]) as mock_session:
        with pytest.warns(UserWarning):      # empty fetch -> the exclusion is trivially stale
            fetch_monarchs(["Q18810062"], exclude_people=["Q12346"])
    assert "Q12346" not in mock_session.call_args[0][1]


def test_stale_exclusion_warns():
    """Upstream may fix a holder or move a Q-number; a config full of dead exclusions is
    one nobody can audit. Warns rather than raising — it cannot change the digits."""
    with patch("deck_generator.monarchs._sparql_session", return_value=_SAMPLE_BINDINGS):
        with pytest.warns(UserWarning, match="Q404404"):
            fetch_monarchs(["Q18810062"], exclude_people=["Q12346", "Q404404"])


def test_no_warning_when_every_exclusion_still_applies():
    import warnings as _w
    with patch("deck_generator.monarchs._sparql_session", return_value=_SAMPLE_BINDINGS):
        with _w.catch_warnings():
            _w.simplefilter("error")
            fetch_monarchs(["Q18810062"], exclude_people=["Q12345", "Q12346"])


# --- separate reigns vs. one reign under two titles ------------------------------
#
# One person's position statements were ALWAYS merged into a single reign (earliest
# accession, latest end). That is right for a title change and wrong for a restoration,
# and the two are distinguishable: a title change is contiguous (George III is King of
# Great Britain to 1801 and King of the UK from 1801), a restoration has a GAP (Abdallah
# of Morocco ruled six times between 1729 and 1757, deposed in between). Merging the
# second kind erased both transitions of every deposition — sixteen Alaouite reigns
# collapsed into one digit.

def _reign(qid, name, start, end=None):
    b = {"person": {"value": f"http://www.wikidata.org/entity/{qid}"},
         "personLabel": {"value": name},
         "start": {"value": f"{start:04d}-01-01T00:00:00Z"}}
    if end is not None:
        b["end"] = {"value": f"{end:04d}-01-01T00:00:00Z"}
    return b


def test_contiguous_statements_still_merge():
    """George III: King of Great Britain to 1801, King of the UK from 1801. One reign."""
    rows = [_reign("Q1", "George III", 1760, 1801), _reign("Q1", "George III", 1801, 1820)]
    with patch("deck_generator.monarchs._sparql_session", return_value=rows):
        got = fetch_monarchs(["Qx"])
    assert [(m.accession_year, m.end_year) for m in got] == [(1760, 1820)]


def test_overlapping_statements_still_merge():
    rows = [_reign("Q1", "Someone", 1100, 1150), _reign("Q1", "Someone", 1120, 1160)]
    with patch("deck_generator.monarchs._sparql_session", return_value=rows):
        got = fetch_monarchs(["Qx"])
    assert [(m.accession_year, m.end_year) for m in got] == [(1100, 1160)]


def test_stephen_still_merges():
    """The case the original comment was written for: 1135-1141 and 1141-1154 abut."""
    rows = [_reign("Q1", "Stephen", 1135, 1141), _reign("Q1", "Stephen", 1141, 1154)]
    with patch("deck_generator.monarchs._sparql_session", return_value=rows):
        got = fetch_monarchs(["Qx"])
    assert [(m.accession_year, m.end_year) for m in got] == [(1135, 1154)]


def test_a_gap_makes_two_reigns():
    """Deposed and restored: both transitions are real and must both survive."""
    rows = [_reign("Q1", "Abdallah", 1729, 1734), _reign("Q1", "Abdallah", 1736, 1738)]
    with patch("deck_generator.monarchs._sparql_session", return_value=rows):
        got = fetch_monarchs(["Qx"])
    assert [(m.accession_year, m.end_year) for m in got] == [(1729, 1734), (1736, 1738)]


def test_abdallah_of_morocco_keeps_his_separate_reigns():
    """Abdallah bin Ismail's real six reigns, at the year granularity Wikidata stores.

    Five survive, not six: his third ended in June 1741 and his fourth began in November
    1741, so at YEAR granularity they abut and merge. That is the documented limit of the
    rule — and it costs no digit here, because Zin al-Abidin reigned between them and 1741
    is his accession year either way."""
    rows = [_reign("Q1", "Abdallah", a, b) for a, b in
            [(1729, 1734), (1736, 1736), (1740, 1741), (1741, 1742), (1743, 1747), (1748, 1757)]]
    with patch("deck_generator.monarchs._sparql_session", return_value=rows):
        got = fetch_monarchs(["Qx"])
    assert [(m.accession_year, m.end_year) for m in got] == [
        (1729, 1734), (1736, 1736), (1740, 1742), (1743, 1747), (1748, 1757)]


def test_reigns_separated_by_a_full_year_all_survive():
    rows = [_reign("Q1", "X", a, b) for a, b in
            [(1700, 1710), (1712, 1720), (1722, 1730), (1732, 1740)]]
    with patch("deck_generator.monarchs._sparql_session", return_value=rows):
        got = fetch_monarchs(["Qx"])
    assert len(got) == 4


def test_separate_reigns_each_yield_a_transition():
    """The point of the change: a restoration is two digits, not none."""
    rows = [_reign("Q1", "Ahmad", 1526, 1545), _reign("Q1", "Ahmad", 1547, 1549)]
    with patch("deck_generator.monarchs._sparql_session", return_value=rows):
        got = fetch_monarchs(["Qx"])
    years = [e.year for e in transition_events(got)]
    assert years == [1526, 1545, 1547, 1549]


def test_an_open_ended_statement_merges_rather_than_splitting():
    """A statement with no end year can't be shown to be separate, so it must not split
    a reign — an unknown end is not evidence of a gap."""
    rows = [_reign("Q1", "Someone", 1900), _reign("Q1", "Someone", 1910, 1920)]
    with patch("deck_generator.monarchs._sparql_session", return_value=rows):
        got = fetch_monarchs(["Qx"])
    assert len(got) == 1


def test_split_reigns_carry_the_same_person_id():
    rows = [_reign("Q1", "Abdallah", 1729, 1734), _reign("Q1", "Abdallah", 1736, 1738)]
    with patch("deck_generator.monarchs._sparql_session", return_value=rows):
        got = fetch_monarchs(["Qx"])
    assert {m.person_id for m in got} == {"Q1"}


def test_exclude_people_removes_all_of_a_persons_reigns():
    rows = [_reign("Q1", "Abdallah", 1729, 1734), _reign("Q1", "Abdallah", 1736, 1738),
            _reign("Q2", "Other", 1800, 1810)]
    with patch("deck_generator.monarchs._sparql_session", return_value=rows):
        got = fetch_monarchs(["Qx"], exclude_people=["Q1"])
    assert [m.name for m in got] == ["Other"]


def test_fetch_populates_wp_title():
    bindings = [{
        **_SAMPLE_BINDINGS[2],
        "wpTitle": {"value": "William I of England"},
    }]
    with patch("deck_generator.monarchs._sparql_session", return_value=bindings):
        monarchs = fetch_monarchs(["Q18810062"])
    assert monarchs[0].wp_title == "William I of England"


def test_fetch_wp_title_none_when_absent():
    with patch("deck_generator.monarchs._sparql_session", return_value=[_SAMPLE_BINDINGS[0]]):
        monarchs = fetch_monarchs(["Q18810062"])
    assert monarchs[0].wp_title is None


def test_fetch_merges_wp_title():
    # First row has no sitelink; second (same person) has one — should be saved
    row1 = {**_SAMPLE_BINDINGS[0]}
    row2 = {**_SAMPLE_BINDINGS[0], "wpTitle": {"value": "Alfred the Great"}}
    with patch("deck_generator.monarchs._sparql_session", return_value=[row1, row2]):
        monarchs = fetch_monarchs(["Q18810062"])
    assert monarchs[0].wp_title == "Alfred the Great"


# make_monarch_chunks
def _monarchs(*year_name_pairs):
    return [Monarch(name=n, accession_year=y, end_year=None, father="", mother="") for y, n in year_name_pairs]


# filter_by_accession
def test_filter_by_accession_max_caps_dynasty():
    # Abbasid case: drop the Cairo figureheads acceding after the 1258 Baghdad fall
    ms = _monarchs((750, "As-Saffah"), (1242, "Al-Musta'sim"), (1261, "Al-Mustansir (Cairo)"))
    kept = filter_by_accession(ms, max_year=1258)
    assert [m.name for m in kept] == ["As-Saffah", "Al-Musta'sim"]


def test_filter_by_accession_min_and_max_window():
    ms = _monarchs((1368, "Hongwu"), (1627, "Chongzhen"), (1644, "Southern Ming"))
    kept = filter_by_accession(ms, min_year=1368, max_year=1643)
    assert [m.name for m in kept] == ["Hongwu", "Chongzhen"]


def test_filter_by_accession_none_bounds_keep_all():
    ms = _monarchs((661, "Mu'awiya"), (744, "Marwan II"))
    assert filter_by_accession(ms) == ms


def test_chunks_single_century():
    monarchs = _monarchs((871, "Alfred"), (899, "Edward"))
    chunks = make_monarch_chunks(monarchs, chunk_years=100, chunk_start_year=800)
    assert len(chunks) == 1
    assert chunks[0].start_year == 800
    assert chunks[0].end_year == 899


def test_chunks_two_centuries():
    monarchs = _monarchs((871, "Alfred"), (924, "Æthelstan"))
    chunks = make_monarch_chunks(monarchs, chunk_years=100, chunk_start_year=800)
    assert len(chunks) == 2
    assert chunks[0].start_year == 800
    assert chunks[1].start_year == 900


def test_transition_string():
    monarchs = _monarchs((871, "Alfred"), (899, "Edward"), (924, "Æthelstan"))
    chunks = make_monarch_chunks(monarchs, chunk_years=100, chunk_start_year=800)
    assert chunks[0].transition_string == "19"
    assert chunks[1].transition_string == "4"


def test_transition_string_same_year_repeated():
    # Two monarchs acceding in 1066 → two 6s
    monarchs = _monarchs((1066, "Harold II"), (1066, "William I"))
    chunks = make_monarch_chunks(monarchs, chunk_years=100, chunk_start_year=1000)
    assert chunks[0].transition_string == "66"


def test_empty_century_skipped():
    monarchs = _monarchs((871, "Alfred"), (1066, "William I"))
    chunks = make_monarch_chunks(monarchs, chunk_years=100, chunk_start_year=800)
    years = [c.start_year for c in chunks]
    # 900–999 has no monarchs; 800–899 and 1000–1099 do
    assert 900 not in years
    assert 800 in years
    assert 1000 in years


def test_empty_monarchs():
    assert make_monarch_chunks([]) == []


# make_monarch_chunks — end-year gap fallback
def _monarchs_with_ends(*tuples):
    """Create monarchs with (accession, end, name)."""
    return [Monarch(name=n, accession_year=a, end_year=e, father="", mother="") for a, e, n in tuples]


def test_gap_inserts_end_year():
    # Edward ends 924, Æthelstan starts 927 → 924 should appear in 900s string
    monarchs = _monarchs_with_ends((899, 924, "Edward"), (927, 939, "Æthelstan"))
    chunks = make_monarch_chunks(monarchs, chunk_years=100, chunk_start_year=800)
    nineties = next(c for c in chunks if c.start_year == 900)
    assert '4' == nineties.transition_string[0]   # 924 % 10
    assert '7' == nineties.transition_string[1]   # 927 % 10


def test_no_gap_no_extra_digit():
    # Normal succession: Henry dies 1547, Edward accedes 1547 → 1547 appears once, not
    # twice. (Edward still reigning / no end year, to isolate this from the terminal-end
    # rule covered by test_dynasty_end_year_included.)
    monarchs = _monarchs_with_ends((1509, 1547, "Henry VIII"), (1547, None, "Edward VI"))
    chunks = make_monarch_chunks(monarchs, chunk_years=100, chunk_start_year=1500)
    assert chunks[0].transition_string == "97"   # 1509 % 10, 1547 % 10


def test_end_year_lands_in_correct_century():
    # Edward (899-924) is in 800s chunk; his end year 924 should appear in 900s chunk
    monarchs = _monarchs_with_ends((899, 924, "Edward"), (927, 939, "Æthelstan"))
    chunks = make_monarch_chunks(monarchs, chunk_years=100, chunk_start_year=800)
    eighties = next(c for c in chunks if c.start_year == 800)
    nineties = next(c for c in chunks if c.start_year == 900)
    assert eighties.transition_string == "9"    # only Edward's accession 899
    assert "4" in nineties.transition_string    # Edward's end 924 in 900s


def test_gap_cnut_harold(monkeypatch):
    # Cnut ends 1035, Harold Harefoot starts 1037 → 1035 should appear
    monarchs = _monarchs_with_ends((1016, 1035, "Cnut"), (1037, 1040, "Harold"))
    chunks = make_monarch_chunks(monarchs, chunk_years=100, chunk_start_year=1000)
    ts = chunks[0].transition_string
    idx_cnut = ts.index('6')     # 1016 % 10
    assert ts[idx_cnut + 1] == '5'   # 1035 % 10 inserted next
    assert ts[idx_cnut + 2] == '7'   # 1037 % 10


def test_dynasty_end_year_included():
    # Final ruler has no successor: their end year must still appear (e.g. Umayyad
    # Marwan II acceded 744, killed 750 → the dynasty-ending 750 belongs in the 700s).
    monarchs = _monarchs_with_ends((661, 680, "Mu'awiya"), (744, 750, "Marwan II"))
    chunks = make_monarch_chunks(monarchs, chunk_years=100, chunk_start_year=600)
    seven_hundreds = next(c for c in chunks if c.start_year == 700)
    assert seven_hundreds.transition_string == "40"   # 744 accession, 750 end


def test_interregnum_start_year_included():
    # Large gap between a reign's end and the next accession (a genuine interregnum):
    # the end year now marks the interregnum's start (Commonwealth: Charles I end 1649,
    # Charles II accession 1660 — 1649 must appear, unlike the old ≤5-year-only rule).
    monarchs = _monarchs_with_ends((1625, 1649, "Charles I"), (1660, 1685, "Charles II"))
    chunks = make_monarch_chunks(monarchs, chunk_years=100, chunk_start_year=1600)
    ts = chunks[0].transition_string
    assert "9" in ts        # 1649 end (interregnum start) included
    assert ts == "5905"     # 1625, 1649, 1660, 1685


def test_add_transition_year_inserts_missing_event():
    # al-Muqtadir case: Wikidata records 908–932 unbroken, omitting the brief 929
    # deposition for al-Qahir. The manual year is sorted into place.
    monarchs = _monarchs_with_ends((908, 932, "al-Muqtadir"), (932, None, "al-Qahir"))
    chunks = make_monarch_chunks(monarchs, chunk_years=100, chunk_start_year=900,
                                 add_transition_years=[929])
    assert chunks[0].transition_string == "892"   # 908, 929, 932


def test_drop_transition_year_removes_artifact():
    # al-Musta'in case: Wikidata's 865 end date is a dating artifact; the real
    # transition is 866 (al-Mu'tazz's accession), already present.
    monarchs = _monarchs_with_ends((862, 865, "al-Musta'in"), (866, None, "al-Mu'tazz"))
    assert make_monarch_chunks(monarchs, 100, 800)[0].transition_string == "256"  # 862,865,866
    chunks = make_monarch_chunks(monarchs, 100, 800, drop_transition_years=[865])
    assert chunks[0].transition_string == "26"    # 865 gone


def test_drop_removes_all_occurrences_of_year():
    monarchs = _monarchs((744, "Yazid III"), (744, "Ibrahim"), (750, "Marwan II"))
    chunks = make_monarch_chunks(monarchs, 100, 700, drop_transition_years=[744])
    assert chunks[0].transition_string == "0"


def test_add_and_drop_combined():
    monarchs = _monarchs_with_ends((900, 910, "A"), (910, 920, "B"))
    chunks = make_monarch_chunks(monarchs, 100, 900,
                                 add_transition_years=[915], drop_transition_years=[920])
    assert chunks[0].transition_string == "005"   # 900, 910, 915; 920 dropped


def test_no_end_year_no_gap_inserted():
    # Monarchs with no end_year should behave as before
    monarchs = _monarchs((871, "Alfred"), (899, "Edward"), (924, "Æthelstan"))
    chunks = make_monarch_chunks(monarchs, chunk_years=100, chunk_start_year=800)
    assert chunks[0].transition_string == "19"
    assert chunks[1].transition_string == "4"


def test_default_start_year():
    monarchs = _monarchs((1837, "Victoria"), (1901, "Edward VII"))
    chunks = make_monarch_chunks(monarchs, chunk_years=100)
    assert chunks[0].start_year == 1837


def test_last_digit_extraction():
    monarchs = _monarchs((1900, "Edward VII"), (1910, "George V"))
    chunks = make_monarch_chunks(monarchs, chunk_years=100, chunk_start_year=1900)
    assert chunks[0].transition_string == "00"


# write_monarchs_xlsx
import openpyxl
from deck_generator.xlsx_writer import write_monarchs_xlsx


def _sample_chunks():
    """Built through the real chunker, not by hand: the sheet is one row per transition EVENT,
    and a hand-made MonarchChunk carries none — so a handwritten fixture would silently assert
    against an empty sheet."""
    m1 = Monarch("Alfred the Great", 871, 899, "Æthelwulf", "Osburh")
    m2 = Monarch("Edward the Elder", 899, 924, "Alfred the Great", "Ealhswith")
    m3 = Monarch("William I", 1066, 1087, "Robert I", "Herleva")
    return make_monarch_chunks([m1, m2, m3], chunk_years=100, chunk_start_year=800)


def test_monarchs_xlsx_created(tmp_path):
    out = tmp_path / "monarchs.xlsx"
    write_monarchs_xlsx(_sample_chunks(), out, subject="Test Monarchs")
    assert out.exists()


def test_monarchs_sheet_title(tmp_path):
    out = tmp_path / "monarchs.xlsx"
    write_monarchs_xlsx(_sample_chunks(), out, subject="Test Monarchs")
    wb = openpyxl.load_workbook(out)
    assert "Test Monarchs" in wb.sheetnames


def test_monarchs_header(tmp_path):
    out = tmp_path / "monarchs.xlsx"
    write_monarchs_xlsx(_sample_chunks(), out)
    ws = openpyxl.load_workbook(out).active
    assert ws[1][0].value == "Digit"
    assert ws[1][2].value == "Event"
    assert ws[1][3].value == "Name"
    assert ws[1][9].value == "Century String"


def test_monarchs_first_data_row(tmp_path):
    out = tmp_path / "monarchs.xlsx"
    write_monarchs_xlsx(_sample_chunks(), out)
    rows = list(openpyxl.load_workbook(out).active.iter_rows(values_only=True))
    assert rows[1][0] == "1"                 # last digit of 871
    assert rows[1][1] == 871
    assert rows[1][2] == "acceded"
    assert rows[1][3] == "Alfred the Great"
    assert rows[1][6] == "Æthelwulf"
    assert rows[1][9] == "19"                # century string on first row of chunk


def test_monarchs_century_string_blank_on_non_first(tmp_path):
    out = tmp_path / "monarchs.xlsx"
    write_monarchs_xlsx(_sample_chunks(), out)
    rows = list(openpyxl.load_workbook(out).active.iter_rows(values_only=True))
    assert rows[2][9] in (None, "")  # second event in chunk has no century string


def test_monarchs_sheet_has_a_row_per_digit(tmp_path):
    """The point of the sheet: reading the Digit column down reproduces the strings exactly.

    The old per-ruler sheet could not — a `reign_end` digit has no ruler acceding to give it a
    row, so the sheet omitted it and the two disagreed with nothing to catch it."""
    chunks = _sample_chunks()
    out = tmp_path / "monarchs.xlsx"
    write_monarchs_xlsx(chunks, out)
    rows = list(openpyxl.load_workbook(out).active.iter_rows(values_only=True))[1:]
    assert "".join(r[0] for r in rows) == "".join(c.transition_string for c in chunks)


def test_monarchs_sheet_labels_a_reign_end(tmp_path):
    """924 is Edward the Elder's death with no successor acceding that year — a digit no
    accession accounts for, and the row that used to be missing entirely."""
    out = tmp_path / "monarchs.xlsx"
    write_monarchs_xlsx(_sample_chunks(), out)
    rows = list(openpyxl.load_workbook(out).active.iter_rows(values_only=True))
    row = next(r for r in rows[1:] if r[1] == 924)
    assert row[0] == "4"
    assert "reign ended" in row[2]
    assert row[3] == "Edward the Elder"


def test_monarchs_summary_sheet(tmp_path):
    out = tmp_path / "monarchs.xlsx"
    write_monarchs_xlsx(_sample_chunks(), out)
    wb = openpyxl.load_workbook(out)
    assert "Summary" in wb.sheetnames
    rows = list(wb["Summary"].iter_rows(values_only=True))
    assert len(rows) == 4  # header + 3 chunks
    assert [r[1] for r in rows[1:]] == ["19", "4", "67"]


# --- add idempotency: a correction must not double a year Wikidata already supplies ---
def test_add_is_idempotent_when_year_already_present():
    # The regression this guards: if Wikidata later fixes Puyi's end to 1912, a config still
    # carrying add:[1912] must not emit the digit twice.
    monarchs = _monarchs_with_ends((1908, 1912, "Puyi"))
    chunks = make_monarch_chunks(monarchs, 100, 1900, add_transition_years=[1912])
    assert chunks[0].transition_string == "82"   # 1908, 1912 — not "822"


def test_add_still_inserts_when_year_absent():
    monarchs = _monarchs_with_ends((1908, 1917, "Puyi"))
    chunks = make_monarch_chunks(monarchs, 100, 1900,
                                 drop_transition_years=[1917], add_transition_years=[1912])
    assert chunks[0].transition_string == "82"


def test_add_idempotent_against_an_accession_year():
    monarchs = _monarchs((900, "A"), (910, "B"))
    chunks = make_monarch_chunks(monarchs, 100, 900, add_transition_years=[910])
    assert chunks[0].transition_string == "00"   # 910 already an accession; not tripled


def test_same_year_accessions_still_produce_two_digits():
    # Idempotent add must not collapse genuine duplicate transition years from the data itself.
    monarchs = _monarchs((744, "Yazid III"), (744, "Ibrahim"))
    assert make_monarch_chunks(monarchs, 100, 700)[0].transition_string == "44"


# --- corrections: parsing + validation ---
def test_parse_corrections_roundtrip():
    cs = parse_corrections([
        {"year": 1446, "action": "add", "reason": "restoration", "source": "List", "checked": "2026-07-16"},
        {"year": 1917, "action": "drop", "reason": "artifact", "source": "List"},
    ])
    assert cs == [
        Correction(1446, "add", "restoration", "List", "2026-07-16"),
        Correction(1917, "drop", "artifact", "List", ""),
    ]


def test_parse_corrections_empty():
    assert parse_corrections(None) == []
    assert parse_corrections([]) == []


@pytest.mark.parametrize("entry,missing", [
    ({"action": "add", "reason": "r", "source": "s"}, "year"),
    ({"year": 1, "reason": "r", "source": "s"}, "action"),
    ({"year": 1, "action": "add", "source": "s"}, "reason"),
    ({"year": 1, "action": "add", "reason": "r"}, "source"),
])
def test_parse_corrections_requires_provenance(entry, missing):
    with pytest.raises(ValueError, match=missing):
        parse_corrections([entry])


def test_parse_corrections_rejects_bad_action():
    with pytest.raises(ValueError, match="action"):
        parse_corrections([{"year": 1, "action": "delete", "reason": "r", "source": "s"}])


def test_correction_years_splits_by_action():
    cs = parse_corrections([
        {"year": 1501, "action": "add", "reason": "r", "source": "s"},
        {"year": 1502, "action": "drop", "reason": "r", "source": "s"},
        {"year": 1729, "action": "drop", "reason": "r", "source": "s"},
    ])
    assert correction_years(cs) == ([1501], [1502, 1729])


# --- stale corrections: the point is to notice when upstream catches up ---
def test_stale_add_reported_when_wikidata_supplies_year():
    monarchs = _monarchs_with_ends((1908, 1912, "Puyi"))
    cs = [Correction(1912, "add", "r", "s")]
    assert "add 1912" in stale_corrections(monarchs, cs)[0]


def test_stale_drop_reported_when_year_gone():
    monarchs = _monarchs_with_ends((1908, 1912, "Puyi"))
    cs = [Correction(1917, "drop", "r", "s")]
    assert "drop 1917" in stale_corrections(monarchs, cs)[0]


def test_live_corrections_not_reported_stale():
    monarchs = _monarchs_with_ends((1908, 1917, "Puyi"))
    cs = [Correction(1917, "drop", "r", "s"), Correction(1912, "add", "r", "s")]
    assert stale_corrections(monarchs, cs) == []


# --- timePrecision: recorded, reported, but must NOT touch digit extraction ---
def test_report_imprecise_dates_flags_sub_year_precision():
    ms = [Monarch(name="Sigfred", accession_year=770, end_year=800, father="", mother="",
                  accession_precision=8)]
    notes = report_imprecise_dates(ms)
    assert len(notes) == 1 and "Sigfred" in notes[0] and "decade" in notes[0]


def test_report_imprecise_dates_silent_on_year_precision():
    ms = [Monarch(name="Alfred", accession_year=871, end_year=899, father="", mother="",
                  accession_precision=9),
          Monarch(name="Unknown", accession_year=900, end_year=None, father="", mother="",
                  accession_precision=None)]
    assert report_imprecise_dates(ms) == []


def test_precision_does_not_change_digits():
    # The explicit contract: a decade-precision accession still yields its literal last digit,
    # so decks are byte-identical to before the field existed.
    loose = [Monarch(name="Sigfred", accession_year=770, end_year=800, father="", mother="",
                     accession_precision=7)]
    exact = [Monarch(name="Sigfred", accession_year=770, end_year=800, father="", mother="",
                     accession_precision=11)]
    assert (make_monarch_chunks(loose, 100, 700)[0].transition_string
            == make_monarch_chunks(exact, 100, 700)[0].transition_string == "0")


def test_fetch_parses_precision_and_keeps_it_with_winning_year():
    # Dedup keeps the EARLIEST accession; precision must follow that year, not the last row seen.
    bindings = [
        {"person": {"value": "http://www.wikidata.org/entity/Q1"}, "personLabel": {"value": "Stephen"},
         "start": {"value": "1141-01-01T00:00:00Z"}, "startPrec": {"value": "11"}},
        {"person": {"value": "http://www.wikidata.org/entity/Q1"}, "personLabel": {"value": "Stephen"},
         "start": {"value": "1135-01-01T00:00:00Z"}, "startPrec": {"value": "8"}},
    ]
    with patch("deck_generator.monarchs._sparql_session", return_value=bindings):
        got = fetch_monarchs(["Q1"])
    assert got[0].accession_year == 1135
    assert got[0].accession_precision == 8   # the 1135 row's precision, not 1141's


def test_fetch_precision_absent_is_none():
    bindings = [{"person": {"value": "http://www.wikidata.org/entity/Q1"},
                 "personLabel": {"value": "X"}, "start": {"value": "1000-01-01T00:00:00Z"}}]
    with patch("deck_generator.monarchs._sparql_session", return_value=bindings):
        assert fetch_monarchs(["Q1"])[0].accession_precision is None


def test_fetch_query_requests_precision():
    with patch("deck_generator.monarchs._sparql_session", return_value=[]) as mock:
        fetch_monarchs(["Q1"])
    assert "wikibase:timePrecision" in mock.call_args[0][1]


# --- transition events: the digit string and the table share one source ---------------------

def _britain_ish():
    """Every event kind at once: two accessions, a reign_end (924, nobody accedes), and a
    same-year succession that must add nothing."""
    return [
        Monarch("Alfred the Great", 871, 899, "Æthelwulf", "Osburh"),
        Monarch("Edward the Elder", 899, 924, "Alfred the Great", "Ealhswith"),
        Monarch("Æthelstan", 927, 939, "Edward the Elder", "Ecgwynn"),
        Monarch("Edmund I", 939, 946, "Edward the Elder", "Eadgifu"),
    ]


def test_events_reproduce_the_digit_string():
    """The invariant the whole reference table rests on: events[i] explains digit i."""
    for chunk in make_monarch_chunks(_britain_ish(), 100, 800):
        assert "".join(e.digit for e in chunk.events) == chunk.transition_string


def test_events_are_index_aligned_per_chunk():
    chunks = make_monarch_chunks(_britain_ish(), 100, 800)
    for chunk in chunks:
        assert len(chunk.events) == len(chunk.transition_string)


def test_event_kinds_attribute_each_digit():
    events = transition_events(_britain_ish())
    by_year = {e.year: e for e in events}
    assert by_year[871].kind == "accession" and by_year[871].monarch.name == "Alfred the Great"
    # 924 is Edward the Elder's death; Æthelstan accedes 927, so the throne did not pass on.
    assert by_year[924].kind == "reign_end" and by_year[924].monarch.name == "Edward the Elder"
    # 939 is both Æthelstan's end and Edmund I's accession — a direct succession, one digit.
    assert by_year[939].kind == "accession" and by_year[939].monarch.name == "Edmund I"
    assert sum(1 for e in events if e.year == 939) == 1


def test_correction_add_becomes_a_correction_event_carrying_its_reason():
    """A manual add has no Wikidata statement behind it, so the config's `reason` is the only
    thing that can explain its digit."""
    c = Correction(year=1446, action="add", reason="Murad II restored 1446", source="X")
    events = transition_events(
        [Monarch("Murad II", 1421, 1451, "", "")],
        add_transition_years=[1446], corrections=[c],
    )
    added = next(e for e in events if e.year == 1446)
    assert added.kind == "correction"
    assert added.monarch is None
    assert added.note == "Murad II restored 1446"


def test_correction_drop_removes_the_event_not_just_the_digit():
    events = transition_events(
        [Monarch("Osman I", 1299, 1324, "", ""), Monarch("Orhan", 1326, 1362, "", "")],
        drop_transition_years=[1326],
    )
    assert 1326 not in [e.year for e in events]
    # 1324 (Osman's end, no successor acceding) and 1362 (Orhan's) are untouched reign_ends.
    assert [(e.year, e.kind) for e in events] == [
        (1299, "accession"), (1324, "reign_end"), (1362, "reign_end"),
    ]


def test_within_a_year_accession_precedes_reign_end():
    """Ordering is FSRS identity: the digits are the item string, so two events sharing a year
    must keep the order the strings were originally built in."""
    monarchs = [
        Monarch("A", 1000, 1050, "", ""),     # ends 1050, nobody accedes then → reign_end
        Monarch("B", 1050, 1060, "", ""),     # ...except B does, so 1050 is an accession only
        Monarch("C", 1060, 1060, "", ""),
    ]
    events = transition_events(monarchs)
    assert [(e.year, e.kind) for e in events] == [
        (1000, "accession"), (1050, "accession"), (1060, "accession"),
    ]


# --- corrections: `count` — asserting HOW MANY times a year should appear ---
# A year can carry more than one transition (two accessions in one year), and a bare `add` can
# only assert "at least once". Hammadid 1105 is the case: al-Mansur → Badis in January and
# Badis → Abd al-Aziz in July, but Wikidata dates Badis to 1104, so the corrected output needs
# TWO 1105 events while upstream supplies one. `count` states the target occurrence count, which
# keeps the add idempotent — it tops up to `count`, it does not append.
def test_correction_add_count_tops_up_to_the_requested_occurrences():
    monarchs = _monarchs_with_ends((1088, 1105, "al-Mansur"), (1105, 1121, "Abd al-Aziz"))
    c = Correction(1105, "add", "Badis reigned Jan-Jul 1105", "Idris p.282", count=2)
    adds, drops = correction_years([c])
    events = transition_events(monarchs, adds, drops, [c])
    assert [e.kind for e in events if e.year == 1105] == ["accession", "correction"]
    assert make_monarch_chunks(monarchs, 100, 1100, adds, drops, [c])[0].transition_string == "551"


def test_correction_add_count_is_still_idempotent():
    """The whole point of the top-up: when upstream catches up and supplies both events itself,
    the correction adds nothing rather than doubling a digit."""
    monarchs = _monarchs((1105, "Badis"), (1105, "Abd al-Aziz"))
    assert make_monarch_chunks(monarchs, 100, 1100, [1105, 1105])[0].transition_string == "55"


def test_correction_add_defaults_to_count_one():
    assert Correction(1446, "add", "r", "s").count == 1
    assert correction_years([Correction(1446, "add", "r", "s")]) == ([1446], [])


def test_correction_years_expands_count_into_a_multiset():
    cs = parse_corrections([
        {"year": 1105, "action": "add", "reason": "r", "source": "s", "count": 2},
        {"year": 1104, "action": "drop", "reason": "r", "source": "s"},
    ])
    assert correction_years(cs) == ([1105, 1105], [1104])


def test_parse_corrections_reads_count():
    cs = parse_corrections([{"year": 1105, "action": "add", "reason": "r", "source": "s", "count": 2}])
    assert cs == [Correction(1105, "add", "r", "s", count=2)]


def test_parse_corrections_rejects_count_on_drop():
    """Drop already removes EVERY occurrence of a year, so a count on it asserts nothing —
    and reads as if it removed only some."""
    with pytest.raises(ValueError, match="count"):
        parse_corrections([{"year": 1104, "action": "drop", "reason": "r", "source": "s", "count": 2}])


@pytest.mark.parametrize("count", [0, -1])
def test_parse_corrections_rejects_non_positive_count(count):
    with pytest.raises(ValueError, match="count"):
        parse_corrections([{"year": 1105, "action": "add", "reason": "r", "source": "s", "count": count}])


def test_stale_add_with_count_reported_only_when_upstream_supplies_them_all():
    """One 1105 from Wikidata does not make a `count: 2` correction stale — it still adds the
    second. Two does."""
    one = _monarchs_with_ends((1088, 1105, "al-Mansur"), (1105, 1121, "Abd al-Aziz"))
    both = _monarchs_with_ends((1105, 1105, "Badis"), (1105, 1121, "Abd al-Aziz"))
    c = Correction(1105, "add", "r", "s", count=2)
    assert stale_corrections(one, [c]) == []
    assert "add 1105" in stale_corrections(both, [c])[0]


# --- extra_cards: a card that is not a time window --------------------------------
#
# Every monarch card is a slice of the timeline, and its label is its year range. That
# breaks for a realm that split: the Saadi succession war ran two parallel lines, in
# Marrakesh and in Fes, over the SAME years 1603-1627. Two cards cannot both be labelled
# "1603-1627" — the label is the FSRS identity — and interleaving both lines into one
# century card would teach a single succession that never existed.

_MARRAKESH = {
    'label': 'Marrakesh 1603–1627',
    'reason': 'the Marrakesh line of the succession war',
    'source': 'List of rulers of Morocco',
    'checked': '2026-08-27',
    'events': [
        {'year': 1603, 'note': 'Abu Faris Abdallah al-Wathiq'},
        {'year': 1606, 'note': 'Abdallah al-Ghalib II'},
        {'year': 1609, 'note': 'Zaydan al-Nasir'},
    ],
}


def test_extra_card_becomes_a_chunk_with_its_own_label():
    cards = parse_extra_cards([_MARRAKESH])
    chunks = make_monarch_chunks(_monarchs((1600, 'A')), 100, 1600, extra_cards=cards)
    labels = [c.label for c in chunks]
    assert 'Marrakesh 1603–1627' in labels


def test_extra_card_digits_come_from_its_years():
    cards = parse_extra_cards([_MARRAKESH])
    chunks = make_monarch_chunks(_monarchs((1600, 'A')), 100, 1600, extra_cards=cards)
    card = [c for c in chunks if c.label.startswith('Marrakesh')][0]
    assert card.transition_string == '369'
    assert [e.year for e in card.events] == [1603, 1606, 1609]


def test_extra_card_events_align_with_its_digits():
    """The invariant every monarch card has: events[i] explains digit i."""
    cards = parse_extra_cards([_MARRAKESH])
    chunks = make_monarch_chunks(_monarchs((1600, 'A')), 100, 1600, extra_cards=cards)
    for c in chunks:
        assert len(c.events) == len(c.transition_string)
        assert ''.join(e.digit for e in c.events) == c.transition_string


def test_ordinary_chunks_keep_their_year_range_label():
    chunks = make_monarch_chunks(_monarchs((1600, 'A'), (1650, 'B')), 100, 1600)
    assert [c.label for c in chunks] == ['1600–1699']


def test_extra_cards_are_appended_after_the_timeline():
    """The time-window spine first, then the special cards — a stable, predictable order,
    and the one that keeps a reader's century sequence uninterrupted."""
    cards = parse_extra_cards([_MARRAKESH])
    chunks = make_monarch_chunks(_monarchs((1600, 'A'), (1700, 'B')), 100, 1600, extra_cards=cards)
    assert [c.label for c in chunks] == ['1600–1699', '1700–1799', 'Marrakesh 1603–1627']


def test_extra_card_does_not_alter_the_timeline_cards():
    base = make_monarch_chunks(_monarchs((1600, 'A'), (1700, 'B')), 100, 1600)
    cards = parse_extra_cards([_MARRAKESH])
    with_extra = make_monarch_chunks(_monarchs((1600, 'A'), (1700, 'B')), 100, 1600, extra_cards=cards)
    assert [c.transition_string for c in with_extra][:len(base)] == [c.transition_string for c in base]


def test_extra_card_requires_a_source():
    """Same contract as `corrections:` — a hand-authored card is a claim about history."""
    bad = {**_MARRAKESH}
    del bad['source']
    with pytest.raises(ValueError, match='source'):
        parse_extra_cards([bad])


def test_extra_card_requires_events():
    with pytest.raises(ValueError, match='event'):
        parse_extra_cards([{**_MARRAKESH, 'events': []}])


def test_extra_card_labels_must_be_unique():
    """The label IS the FSRS identity; two cards sharing one are one card with two homes."""
    with pytest.raises(ValueError, match='dupl'):
        parse_extra_cards([_MARRAKESH, _MARRAKESH])


def test_extra_card_label_cannot_collide_with_a_year_range():
    cards = parse_extra_cards([{**_MARRAKESH, 'label': '1600–1699'}])
    with pytest.raises(ValueError, match='1600–1699'):
        make_monarch_chunks(_monarchs((1600, 'A')), 100, 1600, extra_cards=cards)
