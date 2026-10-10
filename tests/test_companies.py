"""Company MCQ pipeline — the guards that make this a separate pipeline from deck-papers.

The shared mechanics (quote verbatim, duplicate qid, answer-in-choices, shape ratios) are
already covered by ``test_papers.py`` and are exercised here only where the company pipeline
changes their meaning. What is tested in depth is the three differences: the volatility gate,
the staleness window, and the durable-only coverage denominator.
"""
from __future__ import annotations

import json
from datetime import date
from pathlib import Path

import pytest

from deck_generator import companies

CONFIG_DIR = Path(__file__).resolve().parents[1] / "configs" / "companies"
SLUG = "foundation_medicine"


# --------------------------------------------------------------------- fixtures


def _card(qid="q01", answer="right", choices=None, stem="Stem?", label="L"):
    return companies.Card(qid, stem, choices or ["right", "wrong1", "wrong2", "wrong3"],
                          answer, label)


def _audit(qid="q01", quote="a quote", volatility="durable", checked="2026-09-21",
           decision="keep", category="history", kind="history"):
    return companies.AuditRow(qid, quote, category, kind, volatility, checked, "because",
                              decision)


SOURCE = "a quote and some other text"


# --------------------------------------------------------------------- volatility


def test_volatile_card_is_a_failure_not_a_warning():
    """The central rule: a volatile fact asserts something the reader cannot know has gone
    false. It must refuse, not warn."""
    report = companies.validate([_card()], [_audit(volatility="volatile")], SOURCE, 4)
    assert not report.ok
    assert any("volatile fact shipped" in f for f in report.failures)


def test_volatile_fact_may_be_extracted_as_long_as_it_is_dropped():
    facts = [companies.Fact("f01", "durable thing", "a quote", "history", "durable"),
             companies.Fact("f02", "headcount", "other quote", "people", "volatile")]
    audit = [_audit(), _audit(qid="q02", quote="other quote", volatility="volatile",
                              decision="drop")]
    report = companies.validate([_card()], audit, "a quote other quote", 4, facts=facts)
    assert report.ok


def test_unknown_volatility_is_refused():
    report = companies.validate([_card()], [_audit(volatility="probably fine")], SOURCE, 4)
    assert any("unknown volatility" in f for f in report.failures)


# --------------------------------------------------------------------- staleness


def test_stale_cards_respects_the_recheck_window():
    audit = [_audit(checked="2026-01-01")]
    fresh = companies.stale_cards(audit, 9, today=date(2026, 6, 1))
    stale = companies.stale_cards(audit, 9, today=date(2026, 12, 1))
    assert fresh == []
    assert stale == [("q01", "2026-01-01", 11)]


def test_a_missing_or_malformed_checked_date_counts_as_stale():
    """Nobody knows when an undated fact was last true — which is the condition the check
    exists to surface, so it must not read as fresh."""
    for bad in ("", "last tuesday", None):
        out = companies.stale_cards([_audit(checked=bad)], 9, today=date(2026, 9, 21))
        assert out and out[0][2] == -1


def test_dropped_cards_are_not_reported_stale():
    audit = [_audit(checked="2020-01-01", decision="drop")]
    assert companies.stale_cards(audit, 9, today=date(2026, 9, 21)) == []


def test_staleness_is_a_warning_so_an_old_deck_still_builds():
    """A stale card is a prompt to look, not a defect — Alnylam's founders will not change."""
    report = companies.validate([_card()], [_audit(checked="2020-01-01")], SOURCE, 4,
                                recheck_months=9, today=date(2026, 9, 21))
    assert report.ok
    assert any("recheck window" in w for w in report.warnings)


# --------------------------------------------------------------------- coverage


def test_coverage_denominator_excludes_volatile_facts():
    """Two facts, one volatile and uncarded. Coverage is 1/1, not 1/2 — otherwise every deck
    would be permanently short by however many volatile facts the research turned up."""
    facts = [companies.Fact("f01", "x", "a quote", "history", "durable"),
             companies.Fact("f02", "y", "unquoted", "people", "volatile")]
    assert companies.uncovered_facts(facts, [_audit()]) == []
    report = companies.validate([_card()], [_audit()], SOURCE, 4, facts=facts)
    assert not any("durable facts" in w for w in report.warnings)


def test_uncovered_durable_fact_is_reported():
    facts = [companies.Fact("f01", "x", "a quote", "history", "durable"),
             companies.Fact("f02", "y", "missing quote", "history", "durable")]
    report = companies.validate([_card()], [_audit()], SOURCE, 4, facts=facts)
    assert any("f02" in w for w in report.warnings)


# --------------------------------------------------------------------- identity


def test_item_string_is_namespace_and_qid_never_the_stem():
    assert companies.item_string("company:x", "q07") == "company:x|q07"


def test_assemble_does_not_use_the_papers_group():
    """`Papers` is study.json's priority_collection and its budget key. A company deck landing
    in it would silently join the daily gate and throttle every other deck to half."""
    art = companies.assemble_artifact([_card()], {"namespace": "company:x",
                                                  "deck_name": "X"}, "p", "sha")
    assert art["group"] == "Companies"
    assert art["mode"] == "text-mc"       # loads via the shared mc_routes loop
    assert art["deck_type"] == "company"
    assert art["source"] == "manual"


def test_shuffle_is_deterministic_per_qid():
    a = companies.shuffled_choices(_card())
    b = companies.shuffled_choices(_card())
    assert a == b


# --------------------------------------------------------------------- shipped deck


def _load_shipped():
    cfg_dir = CONFIG_DIR
    cards = companies.load_curated(cfg_dir / f"{SLUG}.curated.jsonl")
    audit = companies.load_audit(cfg_dir / f"{SLUG}.audit.jsonl")
    facts = companies.load_facts(cfg_dir / f"{SLUG}.facts.jsonl")
    source = (cfg_dir / f"{SLUG}.source.txt").read_text(encoding="utf-8")
    return cards, audit, facts, source


@pytest.mark.skipif(not (CONFIG_DIR / f"{SLUG}.curated.jsonl").exists(),
                    reason="shipped deck absent")
def test_shipped_deck_passes_every_failure_check():
    cards, audit, facts, source = _load_shipped()
    report = companies.validate(cards, audit, source, 4, facts=facts, recheck_months=9,
                                today=date(2026, 9, 21))
    assert report.failures == []


@pytest.mark.skipif(not (CONFIG_DIR / f"{SLUG}.curated.jsonl").exists(),
                    reason="shipped deck absent")
def test_shipped_deck_ships_no_volatile_card():
    _, audit, _, _ = _load_shipped()
    kept = [r for r in audit if r.decision == "keep"]
    assert kept and all(r.volatility == "durable" for r in kept)


@pytest.mark.skipif(not (CONFIG_DIR / f"{SLUG}.curated.jsonl").exists(),
                    reason="shipped deck absent")
def test_shipped_deck_answers_are_not_all_at_one_index():
    """The authoring tell: a reviewer who always writes the answer first biases the pass even
    though the quiz reshuffles at display."""
    cards, _, _, _ = _load_shipped()
    assert len({c.choices.index(c.answer) for c in cards}) > 1


@pytest.mark.skipif(not (CONFIG_DIR / f"{SLUG}.curated.jsonl").exists(),
                    reason="shipped deck absent")
def test_shipped_deck_has_no_duplicate_item_keys():
    cards, _, _, _ = _load_shipped()
    items = [companies.item_string("company:foundation-medicine", c.qid) for c in cards]
    assert len(set(items)) == len(items)
