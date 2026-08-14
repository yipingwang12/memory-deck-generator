import json

from deck_generator.monarchs import Correction, Monarch, make_monarch_chunks
from deck_generator.reign_tables import (
    build_reign_table, check_against_deck, items_digest, write_reign_table,
)


def _chunks():
    return make_monarch_chunks([
        Monarch("Alfred the Great", 871, 899, "Æthelwulf", "Osburh"),
        Monarch("Edward the Elder", 899, 924, "Alfred the Great", "Ealhswith"),
        Monarch("Æthelstan", 927, 939, "Edward the Elder", "Ecgwynn"),
    ], 100, 800)


def _items(chunks):
    return [c.transition_string for c in chunks]


def _labels(chunks):
    return [f"{c.start_year}–{c.end_year}" for c in chunks]


# --- payload shape --------------------------------------------------------------------------

def test_every_digit_has_a_row():
    """The alignment the quiz renders on: chunk['events'][i] explains chunk['digits'][i]."""
    chunks = _chunks()
    table = build_reign_table("monarchs_britain", "British Monarchs", chunks, _items(chunks))
    for chunk in table["chunks"]:
        assert len(chunk["events"]) == len(chunk["digits"])
        assert "".join(e["digit"] for e in chunk["events"]) == chunk["digits"]


def test_labels_match_the_deck():
    chunks = _chunks()
    table = build_reign_table("monarchs_britain", "British Monarchs", chunks, _items(chunks))
    assert [c["label"] for c in table["chunks"]] == _labels(chunks)


def test_accession_row_carries_the_ruler():
    chunks = _chunks()
    table = build_reign_table("d", "s", chunks, _items(chunks))
    row = table["chunks"][0]["events"][0]
    assert row == {"digit": "1", "year": 871, "kind": "accession", "name": "Alfred the Great",
                   "accession": 871, "end": 899, "father": "Æthelwulf", "mother": "Osburh"}


def test_empty_fields_are_omitted_not_written_blank():
    chunks = make_monarch_chunks([Monarch("Nameless", 1000, None, "", "")], 100, 1000)
    row = build_reign_table("d", "s", chunks, _items(chunks))["chunks"][0]["events"][0]
    assert set(row) == {"digit", "year", "kind", "name", "accession"}


def test_correction_row_carries_its_reason_and_no_ruler():
    c = Correction(year=1446, action="add", reason="Murad II restored 1446", source="X")
    chunks = make_monarch_chunks([Monarch("Murad II", 1421, 1451, "", "")], 100, 1400,
                                 add_transition_years=[1446], corrections=[c])
    table = build_reign_table("d", "s", chunks, _items(chunks))
    row = next(e for e in table["chunks"][0]["events"] if e["year"] == 1446)
    assert row["kind"] == "correction"
    assert row["note"] == "Murad II restored 1446"
    assert "name" not in row


# --- the digest guard -----------------------------------------------------------------------

def test_digest_is_over_the_decks_items():
    chunks = _chunks()
    table = build_reign_table("d", "s", chunks, _items(chunks))
    assert table["items_sha256"] == items_digest(_items(chunks))


def test_digest_moves_when_a_digit_moves():
    """The failure this guards: one ruler added upstream shifts every later digit while the
    config bytes — and so `config_hash` — stay identical."""
    assert items_digest(["19", "4"]) != items_digest(["19", "44"])


# --- the drift check ------------------------------------------------------------------------

def test_check_passes_on_the_deck_it_was_built_from():
    chunks = _chunks()
    assert check_against_deck(chunks, _items(chunks), _labels(chunks)).ok


def test_check_reports_a_changed_digit_string():
    chunks = _chunks()
    items = _items(chunks)
    items[0] = "199"                     # as if Wikidata gained a ruler in the 800s
    result = check_against_deck(chunks, items, _labels(chunks))
    assert not result.ok
    assert "800–899" in result.problems[0]


def test_check_reports_a_changed_chunk_count():
    chunks = _chunks()
    result = check_against_deck(chunks, _items(chunks)[:-1], _labels(chunks)[:-1])
    assert not result.ok
    assert "chunk count" in result.problems[0]


# --- writing --------------------------------------------------------------------------------

def test_write_is_stable_across_runs(tmp_path):
    """Re-running with unchanged data must be a git no-op, or every run looks like a change."""
    chunks = _chunks()
    table = build_reign_table("monarchs_britain", "British Monarchs", chunks, _items(chunks))
    first = write_reign_table(table, tmp_path).read_text()
    second = write_reign_table(table, tmp_path).read_text()
    assert first == second
    assert json.loads(first)["deck"] == "monarchs_britain"


def test_write_uses_the_deck_stem_as_filename(tmp_path):
    chunks = _chunks()
    table = build_reign_table("monarchs_britain", "British Monarchs", chunks, _items(chunks))
    assert write_reign_table(table, tmp_path).name == "monarchs_britain.json"
