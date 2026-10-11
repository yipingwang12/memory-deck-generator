"""Tests for the grammar-table deck (``deck-grammar``): Latin verb paradigms → quiz
``grammar-table`` artifact. One form = one card; each card carries a pool of plausible wrong
forms drawn from its own paradigm."""
from __future__ import annotations

import json
import unicodedata
from pathlib import Path

import pytest
import yaml

from deck_generator import grammar
from deck_generator.grammar_cli import main

CONFIG = Path(__file__).resolve().parent.parent / "configs" / "grammar" / "latin_porto.yaml"

PORTO = {
    "pres": ["portō", "portās", "portat", "portāmus", "portātis", "portant"],
    "impf": ["portābam", "portābās", "portābat", "portābāmus", "portābātis", "portābant"],
    "fut": ["portābō", "portābis", "portābit", "portābimus", "portābitis", "portābunt"],
    "perf": ["portāvī", "portāvistī", "portāvit", "portāvimus", "portāvistis", "portāvērunt"],
    "plpf": ["portāveram", "portāverās", "portāverat", "portāverāmus", "portāverātis",
             "portāverant"],
    "futp": ["portāverō", "portāveris", "portāverit", "portāverimus", "portāveritis",
             "portāverint"],
}


@pytest.fixture
def cfg() -> dict:
    return yaml.safe_load(CONFIG.read_text(encoding="utf-8"))


# --- rule derivation: the independent second source for every authored form ---

class TestDerive:
    def test_first_conjugation_indicative_active(self):
        assert grammar.derive_first_conjugation("portāre", "portāvī") == PORTO

    def test_another_verb_follows_the_same_rules(self):
        assert grammar.derive_first_conjugation("laudāre", "laudāvī")["impf"][2] == "laudābat"

    def test_rejects_a_non_first_conjugation_infinitive(self):
        with pytest.raises(ValueError):
            grammar.derive_first_conjugation("monēre", "monuī")


# --- wrong-form pools ---

class TestPools:
    def test_pool_never_contains_the_correct_form(self):
        paradigm = grammar.Paradigm.from_forms(PORTO)
        for i, form in enumerate(paradigm.forms):
            assert form not in grammar.wrong_pool(paradigm, i)

    def test_pool_holds_other_persons_of_the_same_tense(self):
        p = grammar.Paradigm.from_forms(PORTO)
        i = p.index("impf", "3sg")
        assert "portābant" in grammar.wrong_pool(p, i)        # 3sg → 3pl

    def test_pool_holds_the_same_person_in_other_tenses(self):
        p = grammar.Paradigm.from_forms(PORTO)
        pool = grammar.wrong_pool(p, p.index("impf", "3sg"))
        assert {"portābit", "portāverat", "portat"} <= set(pool)

    def test_pool_holds_wrong_vowel_lengths_in_the_ending(self):
        p = grammar.Paradigm.from_forms(PORTO)
        pool = grammar.wrong_pool(p, p.index("impf", "3sg"))
        assert "portābāt" in pool                              # long a before final t
        assert "portabat" in pool                              # stem vowel shortened

    def test_the_root_vowel_is_never_flipped(self):
        p = grammar.Paradigm.from_forms(PORTO)
        assert not any(f.startswith("pōrt") for i in range(36)
                       for f in grammar.wrong_pool(p, i))

    def test_pool_is_deterministic_and_unique(self):
        p = grammar.Paradigm.from_forms(PORTO)
        a, b = grammar.wrong_pool(p, 5), grammar.wrong_pool(p, 5)
        assert a == b and len(a) == len(set(a))

    def test_forms_are_nfc(self):
        p = grammar.Paradigm.from_forms(PORTO)
        for i in range(36):
            for f in grammar.wrong_pool(p, i):
                assert unicodedata.is_normalized("NFC", f)


# --- validation ---

class TestValidate:
    def test_committed_config_is_clean(self, cfg):
        report = grammar.validate(cfg)
        assert report.ok, report.failures

    def test_an_authored_form_disagreeing_with_the_rules_fails(self, cfg):
        cfg["tables"][1]["forms"][2] = "portābāt"
        report = grammar.validate(cfg)
        assert not report.ok and any("impf" in f and "3sg" in f for f in report.failures)

    def test_a_short_table_fails(self, cfg):
        cfg["tables"][0]["forms"] = cfg["tables"][0]["forms"][:5]
        assert not grammar.validate(cfg).ok

    def test_duplicate_table_keys_fail(self, cfg):
        cfg["tables"][1]["key"] = "pres"
        assert not grammar.validate(cfg).ok

    def test_decomposed_unicode_fails(self, cfg):
        cfg["tables"][0]["forms"][1] = unicodedata.normalize("NFD", "portās")
        assert not grammar.validate(cfg).ok


# --- artifact ---

class TestArtifact:
    def test_one_card_per_form(self, cfg):
        art = grammar.assemble_artifact(cfg, "manual/grammar/latin_porto.yaml")
        assert len(art["items"]) == len(art["forms"]) == len(art["pools"]) == 36
        assert len(art["labels"]) == 36

    def test_items_are_tag_identities_not_forms(self, cfg):
        art = grammar.assemble_artifact(cfg, "x")
        assert art["items"][0] == "la:porto|ind.act.pres.1sg"
        assert art["items"][-1] == "la:porto|ind.act.futp.3pl"
        assert len(set(art["items"])) == 36

    def test_tables_tile_the_cards_in_person_order(self, cfg):
        art = grammar.assemble_artifact(cfg, "x")
        assert [t["key"] for t in art["tables"]] == list(PORTO)
        assert [c for t in art["tables"] for c in t["cells"]] == list(range(36))
        assert art["forms"][art["tables"][3]["cells"][5]] == "portāvērunt"

    def test_envelope_dispatches_to_the_grammar_mode(self, cfg):
        art = grammar.assemble_artifact(cfg, "manual/grammar/latin_porto.yaml")
        assert art["deck_type"] == "grammar" and art["mode"] == "grammar-table"
        assert art["source"] == "manual" and art["language"] == "la"
        assert art["config_path"] == "manual/grammar/latin_porto.yaml"
        assert art["persons"] == ["1st", "2nd", "3rd"]
        assert art["numbers"] == ["singular", "plural"]

    def test_labels_name_tense_and_person(self, cfg):
        art = grammar.assemble_artifact(cfg, "x")
        assert art["labels"][2] == "Present · 3rd sg."
        assert art["labels"][11] == "Imperfect · 3rd pl."


# --- CLI ---

class TestCli:
    def test_check_passes_and_writes_nothing(self, tmp_path, capsys):
        with pytest.raises(SystemExit) as e:
            main(["--config", str(CONFIG), "--out", str(tmp_path)])
        assert e.value.code == 0 and not any(tmp_path.iterdir())
        assert "OK" in capsys.readouterr().out

    def test_build_writes_the_artifact(self, tmp_path):
        main(["--config", str(CONFIG), "--out", str(tmp_path), "--build"])
        art = json.loads((tmp_path / "grammar_latin_porto.json").read_text(encoding="utf-8"))
        assert art["forms"][0] == "portō" and len(art["config_hash"]) == 64

    def test_build_refuses_a_bad_config(self, tmp_path, cfg):
        cfg["tables"][0]["forms"][0] = "porto"
        bad = tmp_path / "bad.yaml"
        bad.write_text(yaml.safe_dump(cfg, allow_unicode=True), encoding="utf-8")
        out = tmp_path / "out"
        with pytest.raises(SystemExit):
            main(["--config", str(bad), "--out", str(out), "--build"])
        assert not out.exists()
