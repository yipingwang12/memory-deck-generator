"""Paper MCQ pipeline — the deterministic core and the checks `build` fails closed on."""
from __future__ import annotations

import json
from pathlib import Path

import pytest
import yaml

from deck_generator import papers, papers_cli

DOI = "10.1000/test.1"
SOURCE = (
    "We observe a log-linear increase in encoding accuracy without any plateau.\n"
    "The model’s predictions estimate the group response better than most subjects.\n"
    "Scores remain significant in most areas.\n"
)


def card(qid="q01", answer="right one", choices=None, stem="Which?", label="Results · x"):
    return papers.Card(qid, stem, choices or ["right one", "wrong one", "wrong two", "wrong red"],
                       answer, label)


def audit(qid="q01", quote="Scores remain significant in most areas.", decision="keep",
          section="results"):
    return papers.AuditRow(qid, quote, section, "finding", "because", decision)


def claim(cid="c01", quote="Scores remain significant in most areas.", section="results"):
    return papers.Claim(cid, "a finding", quote, section)


class TestNormalise:
    def test_collapses_whitespace_and_linebreaks(self):
        assert papers.normalise("a\n  b\tc") == "a b c"

    @pytest.mark.parametrize("raw,flat", [("don’t", "don't"), ("a–b", "a-b"),
                                          ("a—b", "a-b"), ("−4", "-4"), ("“q”", '"q"')])
    def test_folds_typographic_punctuation(self, raw, flat):
        assert papers.normalise(raw) == flat

    def test_quote_matches_across_a_pdf_line_break(self):
        src = papers.normalise("a log-linear increase\nin encoding accuracy")
        assert papers.normalise("a log-linear increase in encoding accuracy") in src


class TestIdentity:
    def test_item_string_is_doi_and_qid(self):
        assert papers.item_string(DOI, "q07") == "10.1000/test.1|q07"

    def test_item_string_ignores_the_stem(self):
        # Rewording a stem must not move the key — the whole point of an authored qid.
        a, b = card(stem="First wording"), card(stem="Totally different wording")
        assert papers.item_string(DOI, a.qid) == papers.item_string(DOI, b.qid)


class TestSourceDigest:
    def test_stable_under_whitespace_reflow(self):
        assert papers.source_digest("a b\nc") == papers.source_digest("a  b   c")

    def test_changes_with_content(self):
        assert papers.source_digest("a b") != papers.source_digest("a c")


class TestQuoteVerification:
    def test_verbatim_quote_passes(self):
        r = papers.validate([card()], [audit()], SOURCE, 4)
        assert r.ok

    def test_paraphrased_quote_fails(self):
        bad = audit(quote="Scores were significant nearly everywhere.")
        r = papers.validate([card()], [bad], SOURCE, 4)
        assert not r.ok and "quote not found" in r.failures[0]

    def test_quote_spanning_a_line_break_in_the_source_passes(self):
        src = "We observe a log-linear increase in encoding\naccuracy without any plateau."
        a = audit(quote="a log-linear increase in encoding accuracy without any plateau")
        assert papers.validate([card()], [a], src, 4).ok

    def test_quote_with_typographic_apostrophe_passes(self):
        a = audit(quote="The model's predictions estimate the group response")
        assert papers.validate([card()], [a], SOURCE, 4).ok


class TestStructuralChecks:
    def test_duplicate_qid_fails(self):
        cards = [card("q01"), card("q01")]
        r = papers.validate(cards, [audit("q01")], SOURCE, 4)
        assert any("duplicate qid" in f for f in r.failures)

    def test_answer_not_among_choices_fails(self):
        c = card(answer="absent")
        r = papers.validate([c], [audit()], SOURCE, 4)
        assert any("not one of the choices" in f for f in r.failures)

    def test_wrong_choice_count_fails(self):
        c = card(choices=["right one", "wrong one", "wrong two"])
        r = papers.validate([c], [audit()], SOURCE, 4)
        assert any("expected 4" in f for f in r.failures)

    def test_duplicate_option_fails(self):
        c = card(choices=["right one", "wrong one", "wrong one", "wrong two"])
        r = papers.validate([c], [audit()], SOURCE, 4)
        assert any("duplicate option" in f for f in r.failures)

    @pytest.mark.parametrize("opt", ["None of the above", "all of the above", "Both A and B"])
    def test_banned_options_fail(self, opt):
        c = card(choices=["right one", "wrong one", "wrong two", opt])
        r = papers.validate([c], [audit()], SOURCE, 4)
        assert any("banned option" in f for f in r.failures)


class TestCuratedAuditAgreement:
    def test_curated_card_without_an_audit_row_fails(self):
        r = papers.validate([card("q01"), card("q02")], [audit("q01")], SOURCE, 4)
        assert any("no audit row" in f for f in r.failures)

    def test_audit_keep_missing_from_curated_fails(self):
        r = papers.validate([card("q01")], [audit("q01"), audit("q02")], SOURCE, 4)
        assert any("absent from curated" in f for f in r.failures)

    def test_dropped_card_must_not_ship(self):
        cards = [card("q01"), card("q02")]
        rows = [audit("q01"), audit("q02", decision="drop")]
        r = papers.validate(cards, rows, SOURCE, 4)
        assert any("dropped qid present" in f for f in r.failures)

    def test_drop_row_absent_from_curated_is_clean(self):
        # The append-only hole: q02 was considered and rejected, so it exists only in audit.
        rows = [audit("q01"), audit("q02", decision="drop")]
        assert papers.validate([card("q01")], rows, SOURCE, 4).ok


class TestShapeGuards:
    def _deck(self, answer, n=5):
        return [card(f"q{i:02d}", answer=answer,
                     choices=[answer, "short one", "short two", "short three"])
                for i in range(1, n + 1)]

    def test_long_answers_warn(self):
        long = "a considerably longer answer than any of its distractors here"
        r = papers.validate(self._deck(long), [audit(f"q{i:02d}") for i in range(1, 6)],
                            SOURCE, 4)
        assert r.ok  # a warning, never a failure — only a human can judge it
        assert any("longest-is-correct" in w for w in r.warnings)

    def test_balanced_answers_do_not_warn(self):
        r = papers.validate(self._deck("short zero"),
                            [audit(f"q{i:02d}") for i in range(1, 6)], SOURCE, 4)
        assert not any("longest-is-correct" in w for w in r.warnings)

    def test_answer_always_first_warns(self):
        r = papers.validate(self._deck("short zero"),
                            [audit(f"q{i:02d}") for i in range(1, 6)], SOURCE, 4)
        assert any("choice index 0" in w for w in r.warnings)

    def test_varied_answer_position_does_not_warn(self):
        cards = [card("q01", answer="a", choices=["a", "b", "c", "d"]),
                 card("q02", answer="b", choices=["a", "b", "c", "d"]),
                 card("q03", answer="c", choices=["a", "b", "c", "d"]),
                 card("q04", answer="d", choices=["a", "b", "c", "d"])]
        r = papers.validate(cards, [audit(f"q{i:02d}") for i in range(1, 5)], SOURCE, 4)
        assert not any("choice index" in w for w in r.warnings)


class TestStrandedHistory:
    def test_disappeared_shipped_card_warns(self):
        r = papers.validate([card("q01")], [audit("q01")], SOURCE, 4,
                            shipped_qids=("q01", "q02"))
        assert r.ok and any("stranded FSRS history" in w for w in r.warnings)

    def test_first_build_does_not_warn(self):
        r = papers.validate([card("q01")], [audit("q01")], SOURCE, 4)
        assert not any("stranded" in w for w in r.warnings)

    def test_shipped_qids_read_from_artifact(self, tmp_path):
        art = tmp_path / "a.json"
        art.write_text(json.dumps({"items": [f"{DOI}|q01", f"{DOI}|q02"]}), encoding="utf-8")
        assert papers.shipped_qids(art, DOI) == ("q01", "q02")

    def test_missing_artifact_is_not_a_warning(self, tmp_path):
        assert papers.shipped_qids(tmp_path / "absent.json", DOI) == ()


class TestShuffle:
    def test_deterministic_across_runs(self):
        c = card()
        assert papers.shuffled_choices(c) == papers.shuffled_choices(c)

    def test_seeded_by_qid_not_position(self):
        a, b = card("q01"), card("q02")
        assert papers.shuffled_choices(a) != papers.shuffled_choices(b)

    def test_preserves_the_option_set(self):
        c = card()
        assert sorted(papers.shuffled_choices(c)) == sorted(c.choices)


class TestArtifact:
    def _cfg(self):
        return {"deck_name": "Test 2026", "title": "Test 2026", "group": "Papers",
                "order": 400, "doi": DOI, "pmid": 1, "citation": "Test et al."}

    def test_envelope(self):
        art = papers.assemble_artifact([card("q01")], self._cfg(), "manual/papers/t.yaml", "d1")
        assert art["mode"] == "text-mc" and art["deck_type"] == "paper"
        assert art["source"] == "manual"      # survives deck-export's clear + the Dagster sync
        assert art["group"] == "Papers"       # the group_new_per_day budget key
        assert art["items"] == [f"{DOI}|q01"]
        assert art["source_sha256"] == "d1"

    def test_parallel_arrays_are_aligned(self):
        cards = [card("q01", answer="a1", choices=["a1", "b", "c", "d"], label="L1"),
                 card("q02", answer="a2", choices=["a2", "b", "c", "d"], label="L2")]
        art = papers.assemble_artifact(cards, self._cfg(), "p", "d")
        for i, c in enumerate(cards):
            assert art["labels"][i] == c.label
            assert art["answers"][i] == c.answer
            assert art["answers"][i] in art["choices"][i]

    def test_stems_not_prompts(self):
        # artworks' `prompts` selects one of two fixed templates; here the field IS the
        # question, so it carries a different name on purpose.
        art = papers.assemble_artifact([card()], self._cfg(), "p", "d")
        assert "stems" in art and "prompts" not in art


class TestLoaders:
    def test_round_trip(self, tmp_path):
        cur = tmp_path / "c.jsonl"
        cur.write_text(json.dumps({"qid": "q01", "stem": "S?", "choices": ["a", "b"],
                                   "answer": "a", "label": "L"}) + "\n", encoding="utf-8")
        assert papers.load_curated(cur) == [papers.Card("q01", "S?", ["a", "b"], "a", "L")]

    def test_blank_lines_ignored(self, tmp_path):
        aud = tmp_path / "a.jsonl"
        aud.write_text('\n{"qid":"q01","quote":"q","decision":"keep"}\n\n', encoding="utf-8")
        assert [r.qid for r in papers.load_audit(aud)] == ["q01"]


class TestCLI:
    def _deck(self, tmp_path, decision="keep"):
        d = tmp_path / "configs" / "papers"
        d.mkdir(parents=True)
        (d / "t.curated.jsonl").write_text(json.dumps(
            {"qid": "q01", "stem": "S?", "choices": ["right one", "wrong one", "wrong two", "wrong red"],
             "answer": "right one", "label": "Results · x"}) + "\n", encoding="utf-8")
        (d / "t.audit.jsonl").write_text(json.dumps(
            {"qid": "q01", "quote": "Scores remain significant in most areas.",
             "section": "results", "type": "finding", "reason": "r",
             "decision": decision}) + "\n", encoding="utf-8")
        (d / "t.source.txt").write_text(SOURCE, encoding="utf-8")
        (d / "t.yaml").write_text(yaml.safe_dump(
            {"deck_name": "T", "title": "T", "group": "Papers", "order": 400, "doi": DOI,
             "citation": "c", "curated": "t.curated.jsonl", "audit": "t.audit.jsonl",
             "source_text": "t.source.txt", "n_choices": 4}), encoding="utf-8")
        return d / "t.yaml"

    def test_build_writes_artifact_and_digest_stamp(self, tmp_path):
        cfg = self._deck(tmp_path)
        out = tmp_path / "decks"
        papers_cli.main(["--config", str(cfg), "--out", str(out), "--build"])
        art = json.loads((out / "papers_t.json").read_text(encoding="utf-8"))
        assert art["items"] == [f"{DOI}|q01"] and art["config_hash"]
        stamp = (cfg.parent / "t.source.sha256").read_text(encoding="utf-8").strip()
        assert stamp == art["source_sha256"] == papers.source_digest(SOURCE)

    def test_build_refuses_on_a_bad_quote(self, tmp_path):
        cfg = self._deck(tmp_path)
        (cfg.parent / "t.audit.jsonl").write_text(json.dumps(
            {"qid": "q01", "quote": "not in the paper at all", "decision": "keep"}) + "\n",
            encoding="utf-8")
        with pytest.raises(SystemExit):
            papers_cli.main(["--config", str(cfg), "--out", str(tmp_path / "d"), "--build"])
        assert not (tmp_path / "d" / "papers_t.json").exists()

    def test_check_mode_writes_nothing(self, tmp_path):
        cfg = self._deck(tmp_path)
        out = tmp_path / "decks"
        with pytest.raises(SystemExit) as e:
            papers_cli.main(["--config", str(cfg), "--out", str(out)])
        assert e.value.code == 0 and not out.exists()

    def test_missing_source_text_is_a_hard_stop(self, tmp_path):
        cfg = self._deck(tmp_path)
        (cfg.parent / "t.source.txt").unlink()
        with pytest.raises(SystemExit) as e:
            papers_cli.main(["--config", str(cfg), "--out", str(tmp_path / "d"), "--build"])
        assert "source text missing" in str(e.value)

    def test_no_verify_quotes_builds_without_the_source(self, tmp_path):
        cfg = self._deck(tmp_path)
        (cfg.parent / "t.source.txt").unlink()
        out = tmp_path / "decks"
        papers_cli.main(["--config", str(cfg), "--out", str(out), "--build",
                         "--no-verify-quotes"])
        art = json.loads((out / "papers_t.json").read_text(encoding="utf-8"))
        assert art["source_sha256"] == ""   # nothing was verified, so nothing is claimed

    def test_rebuild_is_byte_identical(self, tmp_path):
        cfg = self._deck(tmp_path)
        out = tmp_path / "decks"
        papers_cli.main(["--config", str(cfg), "--out", str(out), "--build"])
        first = (out / "papers_t.json").read_bytes()
        papers_cli.main(["--config", str(cfg), "--out", str(out), "--build"])
        assert (out / "papers_t.json").read_bytes() == first


class TestDensity:
    """Density is measured against the paper's own findings, never a fixed range."""

    def test_every_finding_covered_is_silent(self):
        r = papers.validate([card("q01")], [audit("q01")], SOURCE, 4, claims=[claim("c01")])
        assert not any("finding" in w for w in r.warnings)

    def test_uncovered_finding_is_named(self):
        claims = [claim("c01"), claim("c02", quote="We observe a log-linear increase")]
        r = papers.validate([card("q01")], [audit("q01")], SOURCE, 4, claims=claims)
        assert r.ok                                   # a warning, never a failure
        assert any("c02" in w for w in r.warnings)

    def test_low_coverage_warns_with_a_percentage(self):
        claims = [claim("c01")] + [claim(f"c{i:02d}", quote=f"unquoted {i}") for i in range(2, 8)]
        r = papers.validate([card("q01")], [audit("q01")], SOURCE, 4, claims=claims)
        assert any("1/7 extracted findings" in w and "14%" in w for w in r.warnings)

    def test_a_dropped_card_leaves_its_finding_uncovered(self):
        # The self-check rejecting a question is exactly how a finding loses its card, and
        # the reader should be told rather than left to notice.
        rows = [audit("q01", decision="drop")]
        r = papers.validate([], rows, SOURCE, 4, claims=[claim("c01")])
        assert any("c01" in w for w in r.warnings)

    def test_coverage_matching_tolerates_pdf_whitespace(self):
        c = claim("c01", quote="Scores remain\n  significant in most areas.")
        assert papers.uncovered_claims([c], [audit("q01")]) == []

    def test_no_claims_file_means_no_density_warning(self):
        r = papers.validate([card("q01")], [audit("q01")], SOURCE, 4)
        assert not any("finding" in w for w in r.warnings)

    def test_no_card_count_cap(self):
        # A long paper earns a long deck; study.json's collection budget paces intake.
        cards = [card(f"q{i:03d}") for i in range(1, 81)]
        rows = [audit(f"q{i:03d}") for i in range(1, 81)]
        assert papers.validate(cards, rows, SOURCE, 4).ok


class TestComposition:
    def _deck(self, sections):
        cards = [card(f"q{i:02d}") for i in range(1, len(sections) + 1)]
        rows = [audit(f"q{i:02d}", section=sec) for i, sec in enumerate(sections, 1)]
        return cards, rows

    def test_counts_by_section_and_type(self):
        _cards, rows = self._deck(["results", "results", "methods"])
        comp = papers.composition(rows)
        assert comp["section"] == {"results": 2, "methods": 1}
        assert comp["type"] == {"finding": 3}

    def test_dropped_cards_are_not_counted(self):
        rows = [audit("q01"), audit("q02", decision="drop")]
        assert papers.composition(rows)["section"] == {"results": 1}

    def test_results_weighted_deck_is_silent(self):
        cards, rows = self._deck(["results"] * 8 + ["methods", "discussion"])
        assert not any("outside Results" in w
                       for w in papers.validate(cards, rows, SOURCE, 4).warnings)

    def test_methods_heavy_deck_warns(self):
        cards, rows = self._deck(["results"] * 5 + ["methods"] * 5)
        r = papers.validate(cards, rows, SOURCE, 4)
        assert r.ok and any("outside Results" in w and "50%" in w for w in r.warnings)


class TestClaimsLoading:
    def test_round_trip(self, tmp_path):
        p = tmp_path / "c.jsonl"
        p.write_text(json.dumps({"id": "c01", "claim": "x", "quote": "q",
                                 "section": "results"}) + "\n", encoding="utf-8")
        assert papers.load_claims(p) == [papers.Claim("c01", "x", "q", "results")]


class TestCLIDensity:
    def test_named_but_absent_claims_file_warns(self, tmp_path, capsys):
        cfg = TestCLI()._deck(tmp_path)
        cfg.write_text(cfg.read_text().replace(
            "curated: t.curated.jsonl", "claims: t.claims.jsonl\ncurated: t.curated.jsonl"),
            encoding="utf-8")
        papers_cli.main(["--config", str(cfg), "--out", str(tmp_path / "d"), "--build"])
        assert "density" in capsys.readouterr().out

    def test_report_prints_the_composition(self, tmp_path, capsys):
        cfg = TestCLI()._deck(tmp_path)
        papers_cli.main(["--config", str(cfg), "--out", str(tmp_path / "d"), "--build"])
        out = capsys.readouterr().out
        assert "section: results 1" in out and "type   : finding 1" in out
