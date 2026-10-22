"""Tests for the grammar-table decks (``deck-grammar``): Latin verb paradigm pages → quiz
``grammar-table`` artifacts. One form = one card; each card carries a pool of plausible wrong
forms drawn from its own verb. Forms come from two sources — the Wiktionary import and the
rules here — and the build refuses where they disagree."""
from __future__ import annotations

import json
import unicodedata
from pathlib import Path

import pytest
import yaml

from deck_generator import grammar
from deck_generator import grammar_kaikki as gk
from deck_generator.grammar_cli import GRAMMAR_DIR, VERBS, import_configs, main

CONFIG = GRAMMAR_DIR / "latin_porto.yaml"
CONFIGS = sorted(GRAMMAR_DIR.glob("*.yaml"))               # verbs, nouns and pronouns
VERB_CONFIGS = [p for p in CONFIGS if not p.stem.startswith(("latin_noun_", "latin_pron_"))]
FIXTURES = Path(__file__).resolve().parent / "fixtures" / "kaikki_la"
REGISTRY = {v["lemma_key"]: v for v in yaml.safe_load(VERBS.read_text(encoding="utf-8"))["verbs"]}

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

#: Written from Wheelock (edō: Allen & Greenough §201), not from the import — the rules' own check.
WHEELOCK = {
    "moneo": {"ind.act.fut.3sg": "monēbit", "subj.act.pres.1sg": "moneam",
              "ind.pass.pres.2sg": "monēris", "imp.act.pres.2sg": "monē",
              "inf.pass.pres": "monērī", "ptcp.act.fut": "monitūrus", "ptcp.pass.fut": "monendus"},
    "duco": {"ind.act.fut.1sg": "dūcam", "ind.act.pres.3pl": "dūcunt", "imp.act.pres.2sg": "dūc",
             "ind.pass.pres.2sg": "dūceris", "ind.pass.fut.2sg": "dūcēris",
             "inf.pass.pres": "dūcī", "ind.act.perf.1sg": "dūxī", "ptcp.pass.perf": "ductus"},
    "capio": {"ind.act.pres.3pl": "capiunt", "ind.act.impf.1sg": "capiēbam",
              "imp.act.pres.2sg": "cape", "subj.act.impf.1sg": "caperem", "inf.pass.pres": "capī",
              "ptcp.act.pres": "capiēns", "ind.act.perf.1sg": "cēpī"},
    "audio": {"ind.act.pres.2sg": "audīs", "ind.act.fut.3pl": "audient",
              "ind.pass.pres.2sg": "audīris", "inf.pass.pres": "audīrī",
              "subj.act.perf.1pl": "audīverīmus", "ind.act.futp.1pl": "audīverimus",
              "ger.gen": "audiendī"},
    "sum": {"ind.act.pres.2sg": "es", "ind.act.fut.3pl": "erunt", "subj.act.pres.1pl": "sīmus",
            "subj.act.impf.3sg": "esset", "ind.act.futp.3pl": "fuerint",
            "imp.act.fut.3pl": "suntō", "inf.act.perf": "fuisse", "ptcp.act.fut": "futūrus"},
    "possum": {"ind.act.pres.3sg": "potest", "ind.act.fut.1sg": "poterō",
               "subj.act.pres.3pl": "possint", "inf.act.pres": "posse", "inf.act.perf": "potuisse"},
    "volo": {"ind.act.pres.2sg": "vīs", "ind.act.pres.3sg": "vult", "ind.act.fut.1sg": "volam",
             "subj.act.pres.1sg": "velim", "subj.act.impf.1sg": "vellem", "ptcp.act.pres": "volēns"},
    "eo": {"ind.act.pres.3pl": "eunt", "ind.act.impf.1sg": "ībam", "ind.act.perf.2sg": "īstī",
           "ind.act.perf.3pl": "iērunt", "ind.act.plpf.1sg": "ieram", "inf.act.perf": "īsse",
           "ptcp.act.pres": "iēns", "ger.gen": "eundī", "sup.acc": "itum"},
    "fio": {"ind.act.pres.3sg": "fit", "ind.act.pres.3pl": "fīunt", "ind.act.impf.1sg": "fīēbam",
            "subj.act.impf.1sg": "fierem", "ind.act.perf.1sg": "factus sum",
            "subj.act.plpf.3pl": "factī essent", "inf.act.pres": "fierī",
            "inf.act.perf": "factus esse", "inf.act.fut": "factum īrī", "ptcp.act.perf": "factus"},
    "edo": {"ind.act.pres.2sg": "ēs", "ind.act.pres.3sg": "ēst", "ind.act.pres.1pl": "edimus",
            "ind.act.pres.2pl": "ēstis", "subj.act.pres.1sg": "edam", "subj.act.impf.1sg": "ēssem",
            "inf.act.pres": "ēsse", "imp.act.pres.2pl": "ēste", "ind.act.perf.1sg": "ēdī",
            "ptcp.act.fut": "ēsūrus"},
    "fero": {"ind.act.pres.2sg": "fers", "ind.act.pres.3sg": "fert", "ind.pass.pres.2sg": "ferris",
             "subj.act.impf.1sg": "ferrem", "imp.act.pres.2sg": "fer", "inf.pass.pres": "ferrī",
             "ind.act.perf.1sg": "tulī", "ind.pass.perf.1sg": "lātus sum",
             "inf.act.fut": "lātūrus esse", "ptcp.pass.fut": "ferendus"},
}


@pytest.fixture
def cfg() -> dict:
    return yaml.safe_load(CONFIG.read_text(encoding="utf-8"))


def _cfg(stem: str) -> dict:
    return yaml.safe_load((GRAMMAR_DIR / f"{stem}.yaml").read_text(encoding="utf-8"))


# --- rule derivation: the second source for every imported form -------------------------

class TestDerive:
    def test_first_conjugation_indicative_active(self):
        forms = grammar.derive(REGISTRY["porto"])
        assert {t: [forms[f"ind.act.{t}.{p}"] for p in grammar.PERSONS] for t in PORTO} == PORTO

    @pytest.mark.parametrize("key", sorted(WHEELOCK))
    def test_wheelock_forms(self, key):
        forms = grammar.derive(REGISTRY[key])
        assert {t: forms.get(t) for t in WHEELOCK[key]} == WHEELOCK[key]

    def test_irregular_verbs_keep_the_regular_perfect_system(self):
        """Regression: a table prefix `ind.act.fut` also matched `ind.act.futp.*`."""
        for key in ("sum", "possum", "volo", "eo"):
            assert "ind.act.futp.3pl" in grammar.derive(REGISTRY[key])

    def test_perfect_passive_is_periphrastic_masculine(self):
        forms = grammar.derive(REGISTRY["porto"])
        assert forms["ind.pass.perf.1sg"] == "portātus sum"
        assert forms["ind.pass.perf.1pl"] == "portātī sumus"
        assert forms["subj.pass.plpf.3pl"] == "portātī essent"
        assert forms["inf.pass.perf"] == "portātus esse"
        assert forms["inf.pass.fut"] == "portātum īrī"

    def test_active_only_verbs_have_no_passive(self):
        for key in ("sum", "possum", "volo", "eo", "fio", "edo"):
            assert not [t for t in grammar.derive(REGISTRY[key]) if ".pass." in t]

    def test_semi_deponent_perfect_is_active(self):
        forms = grammar.derive(REGISTRY["fio"])
        assert forms["ind.act.futp.1pl"] == "factī erimus"
        assert "ptcp.act.fut" not in forms and "ind.act.perf.1sg" in forms

    def test_exclusions_apply_to_the_rules_too(self):
        forms = grammar.derive(REGISTRY["fio"])
        assert not {"ptcp.act.pres", "ger.gen", "sup.acc"} & set(forms)

    def test_future_passive_imperative_has_no_2nd_plural(self):
        forms = grammar.derive(REGISTRY["porto"])
        assert "imp.pass.fut.2pl" not in forms and forms["imp.pass.fut.3pl"] == "portantor"

    def test_a_first_principal_part_the_rules_contradict_raises(self):
        with pytest.raises(ValueError):
            grammar.derive({**REGISTRY["porto"], "principal_parts": ["portiō", "portāre",
                                                                     "portāvī", "portātum"]})

    def test_forms_are_nfc(self):
        for v in REGISTRY.values():
            assert all(unicodedata.is_normalized("NFC", f) for f in grammar.derive(v).values())


# --- pages ------------------------------------------------------------------------------

class TestPages:
    def test_a_regular_verb_has_five_pages(self):
        pages = grammar.verb_pages(grammar.derive(REGISTRY["porto"]))
        assert [p["key"] for p in pages] == ["ind_act", "ind_pass", "subj_act", "subj_pass",
                                             "nonfinite"]
        assert pages[1]["label"] == "Indicative passive"

    def test_an_active_only_verb_has_three_unvoiced_pages(self):
        pages = grammar.verb_pages(grammar.derive(REGISTRY["volo"]), active_only=True)
        assert [p["label"] for p in pages] == ["Indicative", "Subjunctive", "Non-finite"]

    def test_finite_page_is_one_table_per_tense(self):
        tables = grammar.page_tables(grammar.derive(REGISTRY["porto"]), "subj", "pass")
        assert [t["key"] for t in tables] == ["pres", "impf", "perf", "plpf"]
        assert tables[0]["tag"] == "subj.pass.pres"

    def test_nonfinite_page_has_five_grid_tables(self):
        tables = grammar.page_tables(grammar.derive(REGISTRY["porto"]), None, None)
        assert [t["key"] for t in tables] == ["imp_pres", "imp_fut", "inf", "ptcp", "gersup"]
        ptcp = tables[3]
        assert ptcp["cells"][1] is None and ptcp["cells"][5] == ["ptcp.pass.fut", "portandus"]

    def test_rows_and_columns_with_no_form_are_dropped(self):
        ptcp = grammar.page_tables(grammar.derive(REGISTRY["eo"]), None, None)[3]
        assert ptcp["rows"] == ["present", "future"] and ptcp["cols"] == ["active"]
        assert ptcp["cells"] == [["ptcp.act.pres", "iēns"], ["ptcp.act.fut", "itūrus"]]

    def test_a_verb_without_imperative_or_gerund_drops_those_tables(self):
        tables = grammar.page_tables(grammar.derive(REGISTRY["possum"]), None, None)
        assert [t["key"] for t in tables] == ["inf", "ptcp"]

    def test_an_absent_passive_drops_the_whole_page(self):
        assert grammar.page_tables(grammar.derive(REGISTRY["sum"]), "ind", "pass") == []


# --- Wiktionary import --------------------------------------------------------------------

class TestKaikki:
    @pytest.mark.parametrize("tags,tag", [
        (["active", "first-person", "indicative", "present", "singular"], "ind.act.pres.1sg"),
        (["active", "future", "indicative", "perfect", "plural", "third-person"], "ind.act.futp.3pl"),
        (["imperfect", "passive", "second-person", "singular", "subjunctive"], "subj.pass.impf.2sg"),
        (["active", "future", "imperative", "plural", "third-person"], "imp.act.fut.3pl"),
        (["active", "future", "infinitive"], "inf.act.fut"),
        (["future", "participle", "passive"], "ptcp.pass.fut"),
        (["genitive", "gerund", "noun-from-verb"], "ger.gen"),
        (["ablative", "noun-from-verb", "supine"], "sup.abl"),
        (["future", "infinitive", "passive", "perfect"], None),          # portātum fore
        (["active", "infinitive", "perfect", "potential"], None),
        (["active", "perfect"], None),                                    # principal part
    ])
    def test_tag_of(self, tags, tag):
        assert gk.tag_of(tags) == tag

    def test_first_variant_wins_and_blanks_are_skipped(self):
        entry = {"forms": [
            {"form": "portāvistī", "tags": ["active", "indicative", "perfect", "second-person", "singular"]},
            {"form": "portāstī", "tags": ["active", "indicative", "perfect", "second-person", "singular"]},
            {"form": "-", "tags": ["active", "first-person", "imperative", "present", "singular"]},
            {"form": "portātus + present active indicative of sum", "tags": ["indicative", "passive", "perfect"]},
        ]}
        assert gk.parse_forms(entry) == {"ind.act.perf.2sg": "portāvistī"}

    def test_prefer_matches_a_prefix_not_a_substring(self):
        entry = {"forms": [
            {"form": "ederēs", "tags": ["active", "imperfect", "second-person", "singular", "subjunctive"]},
            {"form": "ēssēs", "tags": ["active", "imperfect", "second-person", "singular", "subjunctive"]},
            {"form": "edās", "tags": ["active", "present", "second-person", "singular", "subjunctive"]},
            {"form": "ēs", "tags": ["active", "present", "second-person", "singular", "subjunctive"]},
        ]}
        prefer = {"prefix": "ēs", "except": ["subj.act.pres"]}
        assert gk.parse_forms(entry, prefer) == {"subj.act.impf.2sg": "ēssēs",
                                                 "subj.act.pres.2sg": "edās"}

    def test_periphrastic_infinitives_are_cited_in_the_nominative(self):
        assert gk._nominative("portātūrum esse") == "portātūrus esse"
        assert gk._nominative("portātum esse") == "portātus esse"
        assert gk._nominative("portātum īrī") == "portātum īrī"

    def test_import_composes_the_perfect_passive_from_sum(self):
        forms = gk.verb_forms(REGISTRY["porto"], FIXTURES)
        assert forms["ind.pass.futp.3pl"] == "portātī erunt"
        assert forms["subj.pass.perf.2sg"] == "portātus sīs"

    def test_active_only_import_drops_impersonal_passives(self):
        forms = gk.verb_forms(REGISTRY["eo"], FIXTURES)
        assert "inf.pass.pres" not in forms and forms["inf.act.pres"] == "īre"

    @pytest.mark.parametrize("key", ["porto", "sum", "eo"])
    def test_import_agrees_with_the_rules(self, key):
        page = {t for p in grammar.verb_pages(grammar.derive(REGISTRY[key]))
                for spec in p["tables"] for t in grammar._spec_tags(spec)}
        imported = {t: f for t, f in gk.verb_forms(REGISTRY[key], FIXTURES).items() if t in page}
        assert imported == {t: grammar.derive(REGISTRY[key])[t] for t in page}

    def test_excluded_tags_and_preferences_carry_a_reason(self):
        for v in REGISTRY.values():
            assert all(ex.get("reason") for ex in v.get("exclude", []))
            assert "prefer" not in v or v["prefer"].get("reason")

    def test_portos_deck_keeps_its_config_stem(self):
        assert gk.config_stem("porto") == "latin_porto"

    def test_import_writes_every_page(self, tmp_path):
        verbs = tmp_path / "verbs.yaml"
        verbs.write_text(yaml.safe_dump({"verbs": [REGISTRY["porto"], REGISTRY["sum"]]},
                                        allow_unicode=True), encoding="utf-8")
        written = import_configs(verbs, FIXTURES, tmp_path, nominals={})
        assert [p.stem for p in written] == ["latin_porto", "latin_sum"]
        assert all(grammar.validate(yaml.safe_load(p.read_text(encoding="utf-8"))).ok
                   for p in written)


# --- wrong-form pools ----------------------------------------------------------------------

def _pool(stem: str, tag: str) -> list[str]:
    c = _cfg(stem)
    tables, t, i = next((pg.tables, t, i) for pg in grammar.parse_pages(c)
                        for t, tb in enumerate(pg.tables) for i, x in enumerate(tb.cells)
                        if x.tag == tag)
    return grammar.wrong_pool(tables, t, i, grammar.derive(c), grammar.stems(c))


class TestPools:
    def test_pool_never_contains_the_correct_form(self):
        for path in CONFIGS:
            c = yaml.safe_load(path.read_text(encoding="utf-8"))
            art = grammar.assemble_artifact(c, "x")
            assert all(f not in pool for f, pool in zip(art["forms"], art["pools"])), path.name

    def test_pool_holds_other_persons_and_other_tenses(self):
        pool = _pool("latin_porto", "ind.act.impf.3sg")
        assert {"portābant", "portābit", "portāverat", "portat"} <= set(pool)

    def test_pool_holds_the_other_voice_and_the_other_mood(self):
        pool = _pool("latin_porto", "ind.act.pres.3sg")
        assert {"portātur", "portet"} <= set(pool)

    def test_pool_holds_wrong_vowel_lengths_in_the_ending(self):
        pool = _pool("latin_porto", "ind.act.impf.3sg")
        assert {"portābāt", "portabat"} <= set(pool)

    @pytest.mark.parametrize("stem", ["latin_duco", "latin_fero", "latin_sum"])
    def test_the_root_vowel_is_never_flipped(self, stem):
        """A flip is a pool form one vowel-length away from the cell's form; its position
        must lie past the protected stem — root length is lexical, not grammar."""
        c = _cfg(stem)
        protected = grammar.stems(c)
        art = grammar.assemble_artifact(c, "x")
        for form, pool in zip(art["forms"], art["pools"]):
            root = max((len(p) for p in protected if form.startswith(p)), default=0)
            for f in pool:
                diff = [k for k, (a, b) in enumerate(zip(form, f)) if a != b]
                if len(f) == len(form) and len(diff) == 1 and grammar._LENGTH.get(form[diff[0]]) == f[diff[0]]:
                    assert diff[0] >= root, (form, f)

    def test_a_periphrastic_form_flips_only_the_participle(self):
        pool = _pool("latin_porto", "ind.pass.perf.1sg")
        assert "portātūs sum" in pool and "portātus sūm" not in pool

    def test_nonfinite_pools_draw_on_the_whole_page(self):
        pool = _pool("latin_porto", "ger.gen")
        assert {"portandum", "portandus", "portāre"} <= set(pool)

    def test_a_valid_alternative_is_never_offered_as_wrong(self):
        c = _cfg("latin_porto")
        assert "portāstī" in next(t for t in c["pages"][0]["tables"] if t["key"] == "perf")["also"][
            "ind.act.perf.2sg"]
        art = grammar.assemble_artifact(c, "x")
        for item, pool in zip(art["items"], art["pools"]):
            assert "portāstī" not in pool or not item.endswith("ind.act.perf.2sg")

    def test_pool_is_deterministic_and_unique(self):
        a, b = _pool("latin_porto", "ind.act.futp.3pl"), _pool("latin_porto", "ind.act.futp.3pl")
        assert a == b and len(a) == len(set(a))


# --- validation ---------------------------------------------------------------------------

class TestValidate:
    @pytest.mark.parametrize("path", CONFIGS, ids=[p.stem for p in CONFIGS])
    def test_committed_config_is_clean(self, path):
        report = grammar.validate(yaml.safe_load(path.read_text(encoding="utf-8")))
        assert report.ok, report.failures

    def test_one_deck_per_verb(self):
        assert [p.stem for p in VERB_CONFIGS] == sorted(f"latin_{k}" for k in REGISTRY)

    def test_an_authored_form_disagreeing_with_the_rules_fails(self, cfg):
        cfg["pages"][0]["tables"][1]["forms"][2] = "portābāt"
        report = grammar.validate(cfg)
        assert not report.ok and any("ind.act.impf.3sg" in f for f in report.failures)

    def test_a_missing_table_fails(self, cfg):
        cfg["pages"][0]["tables"].pop()
        report = grammar.validate(cfg)
        assert any("ind.act.futp.3pl" in f and "no such cell" in f for f in report.failures)

    def test_a_missing_page_fails(self, cfg):
        cfg["pages"].pop(1)
        assert any("pages" in f for f in grammar.validate(cfg).failures)

    def test_a_cell_the_rules_cannot_produce_fails(self):
        c = _cfg("latin_sum")
        c["pages"][-1]["tables"][0]["cells"][0] = ["imp.pass.pres.2sg", "essere"]  # no passive
        report = grammar.validate(c)
        assert any("no such form" in f for f in report.failures)

    def test_a_short_table_fails(self, cfg):
        cfg["pages"][0]["tables"][0]["forms"] = cfg["pages"][0]["tables"][0]["forms"][:5]
        assert not grammar.validate(cfg).ok

    def test_duplicate_table_keys_fail(self, cfg):
        cfg["pages"][0]["tables"][1]["key"] = "pres"
        assert not grammar.validate(cfg).ok

    def test_decomposed_unicode_fails(self, cfg):
        cfg["pages"][0]["tables"][0]["forms"][1] = unicodedata.normalize("NFD", "portās")
        assert not grammar.validate(cfg).ok


# --- artifact -----------------------------------------------------------------------------

class TestArtifact:
    def test_portos_original_cards_are_unchanged(self, cfg):
        """Its study history is keyed on these strings; the expansion must not move them."""
        art = grammar.assemble_artifact(cfg, "manual/grammar/latin_porto.yaml")
        assert art["items"][:36] == [f"la:porto|ind.act.{t}.{p}" for t in PORTO
                                     for p in grammar.PERSONS]
        assert art["forms"][:36] == [f for fs in PORTO.values() for f in fs]
        assert art["name"] == "1st conjugation — portō" and art["order"] == 600

    def test_one_deck_holds_every_page(self, cfg):
        art = grammar.assemble_artifact(cfg, "x")
        assert len(art["items"]) == 147
        assert [p["label"] for p in art["pages"]] == [
            "Indicative active", "Indicative passive", "Subjunctive active", "Subjunctive passive",
            "Imperative & non-finite"]
        assert [t for p in art["pages"] for t in p["tables"]] == list(range(len(art["tables"])))
        assert art["tables"][6]["key"] == "ind_pass.pres"

    def test_items_are_unique_across_every_deck(self):
        items = [i for p in CONFIGS for i in grammar.assemble_artifact(
            yaml.safe_load(p.read_text(encoding="utf-8")), "x")["items"]]
        assert len(items) == len(set(items))

    def test_person_tables_carry_their_grid(self, cfg):
        t = grammar.assemble_artifact(cfg, "x")["tables"][3]
        assert t["rows"] == ["1st", "2nd", "3rd"] and t["cols"] == ["singular", "plural"]
        assert t["grid"] == [0, 3, 1, 4, 2, 5] and t["cells"] == list(range(18, 24))

    def test_grid_tables_mark_absent_forms(self):
        art = grammar.assemble_artifact(_cfg("latin_porto"), "x")
        ptcp = next(t for t in art["tables"] if t["key"] == "nonfinite.ptcp")
        assert ptcp["grid"] == [0, None, None, 1, 2, 3]
        assert [art["forms"][i] for i in ptcp["cells"]] == [
            "portāns", "portātus", "portātūrus", "portandus"]
        assert [c for t in art["tables"] for c in t["cells"]] == list(range(len(art["items"])))

    def test_labels_name_page_table_and_cell(self, cfg):
        art = grammar.assemble_artifact(cfg, "x")
        assert art["labels"][2] == "Indicative active · Present · 3rd sg."
        assert art["labels"][art["items"].index("la:porto|inf.pass.perf")] == \
            "Imperative & non-finite · Infinitives · perfect passive"
        assert len(set(art["labels"])) == len(art["labels"])

    def test_envelope_dispatches_to_the_grammar_mode(self, cfg):
        art = grammar.assemble_artifact(cfg, "manual/grammar/latin_porto.yaml")
        assert art["deck_type"] == "grammar" and art["mode"] == "grammar-table"
        assert art["source"] == "manual" and art["language"] == "la"
        assert art["config_path"] == "manual/grammar/latin_porto.yaml"

    def test_menu_order_follows_the_registry(self):
        order = {p.stem: yaml.safe_load(p.read_text(encoding="utf-8"))["order"] for p in VERB_CONFIGS}
        assert [order[f"latin_{k}"] for k in REGISTRY] == list(range(600, 600 + len(REGISTRY)))


# --- CLI ----------------------------------------------------------------------------------

class TestCli:
    def test_check_passes_and_writes_nothing(self, tmp_path, capsys):
        with pytest.raises(SystemExit) as e:
            main(["--config", str(CONFIG), "--out", str(tmp_path)])
        assert e.value.code == 0 and not any(tmp_path.iterdir())
        assert "OK" in capsys.readouterr().out

    def test_build_writes_every_artifact(self, tmp_path):
        with pytest.raises(SystemExit) as e:
            main(["--config", *map(str, CONFIGS), "--out", str(tmp_path), "--build"])
        assert e.value.code == 0
        art = json.loads((tmp_path / "grammar_latin_porto.json").read_text(encoding="utf-8"))
        assert art["forms"][0] == "portō" and len(art["config_hash"]) == 64
        assert len(list(tmp_path.glob("grammar_*.json"))) == len(CONFIGS)

    def test_build_refuses_a_bad_config(self, tmp_path, cfg):
        cfg["pages"][0]["tables"][0]["forms"][0] = "porto"
        bad = tmp_path / "bad.yaml"
        bad.write_text(yaml.safe_dump(cfg, allow_unicode=True), encoding="utf-8")
        out = tmp_path / "out"
        with pytest.raises(SystemExit):
            main(["--config", str(bad), "--out", str(out), "--build"])
        assert not out.exists()
