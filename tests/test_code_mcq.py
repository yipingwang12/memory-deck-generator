"""Source-file MCQ pipeline — the checks that differ from the paper path."""
from __future__ import annotations

import json
import textwrap
from pathlib import Path

import pytest
import yaml

from deck_generator import code_mcq, code_mcq_cli

SOURCE_ID = "demo-repo:pkg/mod.py"
SOURCE = textwrap.dedent('''
    """Module docstring explaining the purpose."""
    RATIO_BY_SUFFIX = {"A": "10:1", "B": "12:1"}


    def arm_of(label):
        """Ratio arm from the label."""
        raise ValueError(f"cannot read ratio arm from label {label!r}")


    def read_rows(path):
        """Read the rows."""
        def inner(name):
            return name
        return inner(path)
''').lstrip()


def card(qid="q01", answer="right one", choices=None, stem="Which?", label="function · arm_of"):
    return code_mcq.Card(qid, stem, choices or ["right one", "wrong one", "wrong two", "odd one"],
                         answer, label)


def audit(qid="q01", quote='raise ValueError(f"cannot read ratio arm from label {label!r}")',
          decision="keep", section="function", kind="contract"):
    return code_mcq.AuditRow(qid, quote, section, kind, "because", decision)


def cover_all():
    """One card per function, so the coverage check passes and other checks are isolated."""
    return (
        [card("q01"), card("q02", label="function · read_rows"),
         card("q03", label="function · inner")],
        [audit("q01"),
         audit("q02", quote='def read_rows(path):'),
         audit("q03", quote='def inner(name):')],
    )


class TestDefinedSymbols:
    def test_lists_functions_in_file_order(self):
        assert [s.name for s in code_mcq.defined_symbols(SOURCE)] == [
            "arm_of", "read_rows", "inner"]

    def test_a_nested_helper_counts(self):
        """The closure inside a parsing loop is exactly what goes unread."""
        assert "inner" in {s.name for s in code_mcq.defined_symbols(SOURCE)}

    def test_unparseable_source_yields_nothing_rather_than_raising(self):
        assert code_mcq.defined_symbols("def f(:\n") == []


class TestCoverage:
    def test_a_quote_lands_the_card_on_its_enclosing_function(self):
        covered = code_mcq.covered_symbols([audit()], SOURCE)
        assert "arm_of" in covered
        assert "read_rows" not in covered

    def test_a_nested_quote_covers_both_the_helper_and_its_parent(self):
        covered = code_mcq.covered_symbols([audit(quote="return name")], SOURCE)
        assert covered == {"read_rows", "inner"}

    def test_a_multi_line_quote_covers_its_function(self):
        """A quote spanning a def and its body appears in no single line."""
        quote = 'def read_rows(path):\n    """Read the rows."""'
        assert "read_rows" in code_mcq.covered_symbols([audit(quote=quote)], SOURCE)

    def test_a_dropped_card_covers_nothing(self):
        assert code_mcq.covered_symbols([audit(decision="drop")], SOURCE) == set()

    def test_a_function_with_no_card_fails_the_build(self):
        report = code_mcq.validate([card()], [audit()], SOURCE, 4)
        assert not report.ok
        assert any("functions with no card" in f and "read_rows" in f
                   for f in report.failures)

    def test_a_card_per_function_passes(self):
        cards, rows = cover_all()
        assert code_mcq.validate(cards, rows, SOURCE, 4).ok


class TestVocabulary:
    def test_an_unknown_section_is_refused(self):
        cards, rows = cover_all()
        rows[0] = audit("q01", section="results")
        report = code_mcq.validate(cards, rows, SOURCE, 4)
        assert any("unknown section" in f for f in report.failures)

    def test_an_unknown_type_is_refused(self):
        cards, rows = cover_all()
        rows[0] = audit("q01", kind="finding")
        report = code_mcq.validate(cards, rows, SOURCE, 4)
        assert any("unknown type" in f for f in report.failures)

    def test_the_paper_composition_warning_does_not_fire_on_code_sections(self):
        """A code deck has no home section; every section is first-class."""
        cards, rows = cover_all()
        rows = [audit(r.qid, r.quote, section=s)
                for r, s in zip(rows, ("structure", "expression", "integration"))]
        report = code_mcq.validate(cards, rows, SOURCE, 4)
        assert not any("outside" in w for w in report.warnings)


class TestSharedChecksStillApply:
    def test_a_quote_absent_from_the_file_is_refused(self):
        cards, rows = cover_all()
        rows[0] = audit("q01", quote="this line is not in the file")
        report = code_mcq.validate(cards, rows, SOURCE, 4)
        assert any("quote not found verbatim" in f for f in report.failures)

    def test_a_banned_option_is_refused(self):
        cards, rows = cover_all()
        cards[0] = card("q01", choices=["a", "b", "c", "none of the above"], answer="a")
        report = code_mcq.validate(cards, rows, SOURCE, 4)
        assert any("banned option" in f for f in report.failures)


class TestArtifact:
    def test_the_item_string_namespaces_by_repo_and_path(self):
        assert code_mcq.item_string(SOURCE_ID, "q01") == f"{SOURCE_ID}|q01"

    def test_the_artifact_is_a_text_mc_deck_the_quiz_already_routes(self):
        art = code_mcq.assemble_artifact(
            [card()], {"deck_name": "mod.py", "source_id": SOURCE_ID}, "manual/code/x.yaml", "abc")
        assert art["mode"] == "text-mc"
        assert art["deck_type"] == "code-mcq"
        assert art["source"] == "manual"
        assert art["items"] == [f"{SOURCE_ID}|q01"]

    def test_choices_are_shuffled_deterministically(self):
        assert code_mcq.shuffled_choices(card()) == code_mcq.shuffled_choices(card())


class TestCli:
    def _deck(self, tmp_path: Path):
        src = tmp_path / "mod.py"
        src.write_text(SOURCE, encoding="utf-8")
        cards, rows = cover_all()
        (tmp_path / "demo.curated.jsonl").write_text("\n".join(
            json.dumps({"qid": c.qid, "stem": c.stem, "choices": c.choices,
                        "answer": c.answer, "label": c.label}) for c in cards), encoding="utf-8")
        (tmp_path / "demo.audit.jsonl").write_text("\n".join(
            json.dumps({"qid": r.qid, "quote": r.quote, "section": r.section,
                        "type": r.kind, "reason": r.reason, "decision": r.decision})
            for r in rows), encoding="utf-8")
        cfg = {"deck_name": "mod.py", "source_id": SOURCE_ID, "n_choices": 4,
               "curated": "demo.curated.jsonl", "audit": "demo.audit.jsonl",
               "source_file": "mod.py", "reviewed_sha256": code_mcq.file_sha256(SOURCE)}
        (tmp_path / "code_ai_explanation_mod.json").write_text(json.dumps(
            {"source_id": SOURCE_ID, "source_sha256": code_mcq.file_sha256(SOURCE)}))
        config = tmp_path / "demo.yaml"
        config.write_text(yaml.safe_dump(cfg), encoding="utf-8")
        return config

    def test_build_writes_the_artifact_beside_the_config(self, tmp_path, capsys):
        config = self._deck(tmp_path)
        code_mcq_cli.main(["--config", str(config), "--build"])
        art = json.loads((tmp_path / "code_demo.json").read_text(encoding="utf-8"))
        assert len(art["items"]) == 3
        assert "3/3 carry a card" in capsys.readouterr().out

    def test_build_refuses_a_deck_that_skips_a_function(self, tmp_path):
        config = self._deck(tmp_path)
        rows = (tmp_path / "demo.audit.jsonl").read_text().splitlines()[:1]
        (tmp_path / "demo.audit.jsonl").write_text("\n".join(rows), encoding="utf-8")
        curated = (tmp_path / "demo.curated.jsonl").read_text().splitlines()[:1]
        (tmp_path / "demo.curated.jsonl").write_text("\n".join(curated), encoding="utf-8")
        with pytest.raises(SystemExit):
            code_mcq_cli.main(["--config", str(config), "--build"])

    def test_a_missing_source_file_stops_the_build(self, tmp_path):
        config = self._deck(tmp_path)
        (tmp_path / "mod.py").unlink()
        with pytest.raises(SystemExit):
            code_mcq_cli.main(["--config", str(config), "--build"])


@pytest.mark.parametrize("path, ok", [
    ("pkg/mod.py", True), ("analysis/fit.R", True), ("scripts/run.sh", True),
    ("tests/test_mod.py", False), ("pkg/test_mod.py", False), ("pkg/mod_test.py", False),
    ("pkg/conftest.py", False), ("R/tests/testthat/test-fit.R", False),
    ("README.md", False), ("config/run.json", False), ("data/s.tsv", False),
    (".github/ci.sh", False),
])
def test_only_executable_non_test_source_may_carry_a_deck(path, ok):
    """Mirror of code-drill's `scope.refusal`: tests, docs and data are never quizzed."""
    assert (code_mcq.scope_refusal(path) is None) is ok


# --- ASD-STE100 and currency: MCQs follow AI notes, and follow every change ------------

def test_a_sentence_over_the_ste_cap_is_refused():
    long_stem = " ".join(["word"] * 26) + "?"
    cards, rows = cover_all()
    cards[0] = card("q01", stem=long_stem)
    report = code_mcq.validate(cards, rows, SOURCE, 4)
    assert any("q01: stem sentence over 25 words" in f for f in report.failures)


def test_a_backticked_code_span_counts_as_one_word():
    assert code_mcq.ste_word_count("What does `set(RATIO) - arms` return?") == 4


def test_a_long_choice_is_refused():
    cards, rows = cover_all()
    cards[0] = card("q01", answer="right one",
                    choices=["right one", " ".join(["w"] * 26), "wrong two", "odd one"])
    report = code_mcq.validate(cards, rows, SOURCE, 4)
    assert any("q01: choice sentence over 25 words" in f for f in report.failures)


SHA = code_mcq.file_sha256(SOURCE)


def notes(tmp_path, sha=SHA, source_id=SOURCE_ID):
    (tmp_path / "code_ai_explanation_mod.json").write_text(json.dumps(
        {"deck_type": "code-ai-explanation", "source_id": source_id, "source_sha256": sha}))


class TestCurrency:
    def test_current_notes_and_review_pass(self, tmp_path):
        notes(tmp_path)
        assert code_mcq.currency_refusals(SOURCE_ID, SHA, tmp_path, SOURCE) == []

    def test_no_notes_is_refused(self, tmp_path):
        why = code_mcq.currency_refusals(SOURCE_ID, SHA, tmp_path, SOURCE)
        assert any("no AI notes" in w for w in why)

    def test_stale_notes_are_refused(self, tmp_path):
        notes(tmp_path, sha="0" * 64)
        why = code_mcq.currency_refusals(SOURCE_ID, SHA, tmp_path, SOURCE)
        assert any("AI notes" in w and "version" in w for w in why)

    def test_an_unreviewed_deck_is_refused(self, tmp_path):
        notes(tmp_path)
        why = code_mcq.currency_refusals(SOURCE_ID, None, tmp_path, SOURCE)
        assert any("reviewed_sha256" in w for w in why)

    def test_a_changed_file_needs_every_card_reviewed(self, tmp_path):
        changed = SOURCE + "X = 1\n"
        notes(tmp_path, sha=code_mcq.file_sha256(changed))
        why = code_mcq.currency_refusals(SOURCE_ID, SHA, tmp_path, changed)
        assert any("review every card" in w for w in why)

    def test_without_the_source_review_and_notes_must_agree(self, tmp_path):
        notes(tmp_path)
        assert code_mcq.currency_refusals(SOURCE_ID, SHA, tmp_path, "") == []
        assert code_mcq.currency_refusals(SOURCE_ID, "1" * 64, tmp_path, "")


class TestCliCurrency:
    _deck = TestCli._deck

    def test_build_records_the_reviewed_version(self, tmp_path):
        config = self._deck(tmp_path)
        code_mcq_cli.main(["--config", str(config), "--build"])
        art = json.loads((tmp_path / "code_demo.json").read_text(encoding="utf-8"))
        assert art["notes_sha256"] == SHA

    def test_build_refuses_without_notes(self, tmp_path):
        config = self._deck(tmp_path)
        (tmp_path / "code_ai_explanation_mod.json").unlink()
        with pytest.raises(SystemExit):
            code_mcq_cli.main(["--config", str(config), "--build"])
