"""Tests for sourced creator corrections on artwork decks.

The failure these guard against is specific: a creator card whose answer is wrong (upstream
error) or arbitrary (several P170 statements and no way to choose). See the config's
``corrections:`` block and ``artworks.parse_artwork_corrections``.
"""

from __future__ import annotations

import pytest

from deck_generator.artworks import (
    JOINT_SEP, Artwork, apply_corrections, parse_artwork_corrections, stale_corrections,
)
from deck_generator.distractors import build_choices


def _art(qid, title, creator, creator_qid, cands=None, inception=1900, sitelinks=10):
    cands = cands if cands is not None else (((creator_qid, creator),) if creator else ())
    return Artwork(qid=qid, title=title, creator=creator, creator_qid=creator_qid,
                   image_url=f"http://img/{qid}.jpg", sitelinks=sitelinks,
                   inception=inception, creator_candidates=cands)


def _entry(**kw):
    base = {"work": "Q1", "action": "set", "value": "Real Painter",
            "reason": "upstream is wrong", "source": "https://example/x"}
    base.update(kw)
    return base


# --- parsing: provenance is mandatory, and a bad entry raises rather than vanishing ---
class TestParse:
    def test_roundtrip(self):
        cs = parse_artwork_corrections([_entry(checked="2026-07-25")])
        assert cs["Q1"].value == "Real Painter"
        assert cs["Q1"].reason == "upstream is wrong"
        assert cs["Q1"].checked == "2026-07-25"

    def test_empty(self):
        assert parse_artwork_corrections(None) == {}
        assert parse_artwork_corrections([]) == {}

    @pytest.mark.parametrize("drop", ["work", "action", "reason", "source"])
    def test_requires_key(self, drop):
        entry = _entry()
        del entry[drop]
        with pytest.raises(ValueError, match=drop):
            parse_artwork_corrections([entry])

    def test_set_requires_a_value(self):
        entry = _entry()
        del entry["value"]
        with pytest.raises(ValueError, match="value"):
            parse_artwork_corrections([entry])

    def test_exclude_needs_no_value(self):
        cs = parse_artwork_corrections([_entry(action="exclude", value=None)])
        assert cs["Q1"].action == "exclude"

    def test_rejects_bad_action(self):
        with pytest.raises(ValueError, match="action"):
            parse_artwork_corrections([_entry(action="delete")])

    def test_rejects_duplicate_work(self):
        # Two corrections for one QID means one silently loses — the exact invisible
        # failure the raise-don't-skip rule exists to prevent.
        with pytest.raises(ValueError, match="duplicate"):
            parse_artwork_corrections([_entry(), _entry(value="Someone Else")])


# --- application ---
class TestApply:
    def test_set_replaces_creator(self):
        arts = [_art("Q1", "The Magpie", "Pablo Picasso", "Q5593")]
        out = apply_corrections(arts, parse_artwork_corrections([_entry(value="Claude Monet")]))
        assert out[0].creator == "Claude Monet"

    def test_set_leaves_title_and_qid_untouched(self):
        # item_key is sha256("<QID>|creator"), so the QID must survive a correction or the
        # card's FSRS history is stranded.
        arts = [_art("Q1", "The Magpie", "Pablo Picasso", "Q5593")]
        out = apply_corrections(arts, parse_artwork_corrections([_entry(value="Claude Monet")]))
        assert (out[0].qid, out[0].title) == ("Q1", "The Magpie")

    def test_exclude_clears_creator_but_keeps_the_work(self):
        # The title card is still answerable; only the creator card goes away.
        arts = [_art("Q1", "Riace bronzes", "Greeks", "Q530")]
        out = apply_corrections(arts, parse_artwork_corrections([_entry(action="exclude",
                                                                       value=None)]))
        assert out[0].creator == "" and out[0].title == "Riace bronzes"

    def test_untouched_work_passes_through(self):
        arts = [_art("Q2", "Mona Lisa", "Leonardo da Vinci", "Q762")]
        assert apply_corrections(arts, parse_artwork_corrections([_entry()])) == arts


# --- staleness: a correction is a bet that upstream stays wrong ---
class TestStale:
    def test_reports_correction_for_absent_work(self):
        notes = stale_corrections([], parse_artwork_corrections([_entry()]))
        assert "Q1" in notes[0] and "no longer in the deck" in notes[0]

    def test_reports_when_wikidata_resolves_to_our_answer(self):
        arts = [_art("Q1", "W", "Real Painter", "Q9")]
        notes = stale_corrections(arts, parse_artwork_corrections([_entry()]))
        assert "supplies this creator on its own" in notes[0]

    def test_live_correction_not_stale(self):
        arts = [_art("Q1", "W", "Wrong", "Q8", cands=(("Q8", "Wrong"), ("Q9", "Real Painter")))]
        assert stale_corrections(arts, parse_artwork_corrections([_entry()])) == []

    def test_reports_uncorrected_ambiguity(self):
        # A NEW multi-creator work nobody has adjudicated is answered by tiebreak — stable,
        # but arbitrary, so it must surface rather than pass silently.
        arts = [_art("Q7", "W", "A", "Q1", cands=(("Q1", "A"), ("Q2", "B")))]
        notes = stale_corrections(arts, {})
        assert "Q7" in notes[0] and "no correction" in notes[0]


# --- the joint-answer shape leak ---
class TestJointDistractors:
    def test_joint_answer_gets_joint_distractors(self):
        # A two-name answer among three one-name options is pickable on shape alone — the card
        # would test spotting an ampersand, not recognising the artwork.
        joint = [_art(f"Q{i}", f"W{i}", f"A{i}{JOINT_SEP}B{i}", "", inception=1500 + i)
                 for i in range(1, 5)]
        single = [_art(f"Q{i}", f"W{i}", f"Solo{i}", f"C{i}", inception=1500 + i)
                  for i in range(5, 12)]
        choices = build_choices(joint + single, "creator", count=4)
        opts = choices["Q1"]
        assert all(JOINT_SEP in o for o in opts), opts

    def test_single_answer_keeps_single_distractors(self):
        joint = [_art(f"Q{i}", f"W{i}", f"A{i}{JOINT_SEP}B{i}", "", inception=1500 + i)
                 for i in range(1, 8)]
        single = [_art(f"Q{i}", f"W{i}", f"Solo{i}", f"C{i}", inception=1500 + i)
                  for i in range(8, 13)]
        opts = build_choices(joint + single, "creator", count=4)["Q8"]
        assert all(JOINT_SEP not in o for o in opts), opts

    def test_falls_back_when_too_few_of_a_shape(self):
        # One joint work in a single-name deck: a short list would be worse than a mixed one.
        arts = ([_art("Q1", "W1", f"A{JOINT_SEP}B", "", inception=1500)]
                + [_art(f"Q{i}", f"W{i}", f"Solo{i}", f"C{i}", inception=1500 + i)
                   for i in range(2, 8)])
        assert len(build_choices(arts, "creator", count=4)["Q1"]) == 4

    def test_corrected_works_do_not_read_as_same_creator(self):
        # apply_corrections clears creator_qid, so two corrected works both carry "" — they
        # must not be treated as sharing a creator when biasing title distractors.
        arts = [_art("Q1", "W1", "X", "", inception=1500),
                _art("Q2", "W2", "Y", "", inception=1900),
                _art("Q3", "W3", "Z", "Q9", inception=1510)]
        opts = build_choices(arts, "title", count=3, same_creator_bias=True)["Q1"]
        assert "W3" in opts  # the era-adjacent work wins, not the empty-qid "same creator"
