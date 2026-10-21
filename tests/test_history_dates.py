"""Major System rules for history-date files; production configs must pass."""
from __future__ import annotations

from pathlib import Path

import pytest
import yaml

from deck_generator import history_dates as hd
from deck_generator.history_cli import main

HISTORY = Path(__file__).resolve().parents[1] / "configs" / "history"
PEGS = yaml.safe_load((HISTORY / "major_pegs.yaml").read_text())["pegs"]
DATE_FILES = sorted([HISTORY / "world_dates.yaml", *(HISTORY / "cells").glob("*.yaml")])


def entry(**kw):
    return {"event": "Some event", "scene": "", **kw}


class TestPegNumber:
    @pytest.mark.parametrize("e,expected", [
        (entry(year=1066), "66"),
        (entry(year=1600), "00"),
        (entry(year=-3100, event="Narmer unites Egypt (approximate)"), "31"),
        (entry(year=900, event="Maya collapse (approximate)"), "90"),
        (entry(year=1000, event="Vinland (approximate)"), "10"),
        (entry(year=-1754, event="Hammurabi (approximate)"), "54"),
        (entry(year=-1350, event="Lapita (approximate)"), "50"),
        (entry(year=-6000, event="Sugarcane (approximate)"), "60"),
        (entry(year=30, event="Crucifixion (approximate)"), "30"),
        (entry(year=-63000, years_ago=65000), "65"),
        (entry(year=-39600, years_ago=41600), "41"),
    ])
    def test_rule(self, e, expected):
        assert hd.peg_number(e) == expected


class TestMajorDigits:
    @pytest.mark.parametrize("word,phones,expected", [
        ("tongue", ["T", "AH1", "NG"], "12"),
        ("fox", ["F", "AA1", "K", "S"], "87"),
        ("bear", ["B", "EH1", "R"], "94"),
        ("hammer", ["HH", "AE1", "M", "ER0"], "34"),
        ("moth", ["M", "AO1", "TH"], "31"),
        ("kiss", ["K", "IH1", "S"], "70"),
    ])
    def test_digits(self, word, phones, expected):
        assert hd.major_digits(word, phones) == expected

    def test_peg_code_problem(self):
        cmu = {"dice": [["D", "AY1", "S"]], "dog": [["D", "AO1", "G"]]}
        assert hd.peg_code_problems({"10": "dice", "11": "dog"}, cmu) == ["PEG CODE 11 dog"]


class TestEntryProblems:
    def good(self, **kw):
        return {"year": -2500, "peg": "nail", "confidence": "medium",
                "event": "Small Tool Tradition (approximate)", "scene": "A finger NAIL.", **kw}

    def test_clean(self):
        assert hd.entry_problems(self.good(), PEGS) == []

    @pytest.mark.parametrize("change,label", [
        ({"peg": "nose"}, "WRONG PEG"),
        ({"scene": "A finger nail."}, "PEG NOT IN SCENE"),
        ({"scene": "Finger NAILS."}, "PEG NOT IN SCENE"),
        ({"scene": "A NAIL and NAILS."}, "PLURAL PEG"),
        ({"event": "Small Tool Tradition, 2500 BCE"}, "YEAR-LIKE"),
        ({"confidence": "maybe"}, "BAD CONFIDENCE"),
    ])
    def test_flags(self, change, label):
        problems = hd.entry_problems(self.good(**change), PEGS)
        assert any(p.startswith(label) for p in problems), problems

    def test_years_ago_must_match_year(self):
        e = {"years_ago": 46000, "year": -46000, "peg": "roach", "event": "Ochre",
             "scene": "A ROACH."}
        assert any(p.startswith("YEAR != ") for p in hd.entry_problems(e, PEGS))

    def test_years_ago_floor(self):
        e = {"years_ago": 9000, "year": -7000, "peg": "cheese", "event": "X", "scene": "CHEESE"}
        assert any(p.startswith("YEARS_AGO UNDER") for p in hd.entry_problems(e, PEGS))


def test_duplicate_entries():
    d = {"year": 1066, "peg": "judge", "event": "Hastings", "scene": "A JUDGE."}
    assert hd.file_problems([d, dict(d)], PEGS) == ["DUPLICATE (1066, 'Hastings')"]


def test_peg_load():
    assert hd.peg_load([{"peg": "dice"}, {"peg": "dice"}, {"peg": "nun"}]) == {"dice": 2, "nun": 1}


@pytest.mark.parametrize("path", DATE_FILES, ids=lambda p: p.name)
def test_production_files_pass(path):
    dates = yaml.safe_load(path.read_text())["dates"]
    assert hd.file_problems(dates, PEGS) == []


def test_cli_exit_codes(tmp_path, capsys):
    bad = tmp_path / "bad.yaml"
    bad.write_text(yaml.safe_dump({"dates": [
        {"year": 1066, "peg": "nose", "event": "Hastings", "scene": "A NOSE."}]}))
    pegs = ["--pegs", str(HISTORY / "major_pegs.yaml")]
    assert main([str(DATE_FILES[0]), *pegs]) == 0
    assert main([str(bad), *pegs]) == 1
    assert "WRONG PEG" in capsys.readouterr().err
