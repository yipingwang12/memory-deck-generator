"""Tests for the noun and pronoun grammar-table decks (``deck-grammar``, `grammar_nominal`).

Same contract as the verb decks: one form = one card, item = tag identity, Wiktionary import
checked against rules (declension endings; Wheelock tables; compounds derived from bases).
"""
from __future__ import annotations

import yaml
import pytest

from deck_generator import grammar
from deck_generator import grammar_kaikki as gk
from deck_generator import grammar_nominal as gn
from deck_generator.grammar_cli import GRAMMAR_DIR, NOMINALS, import_configs
from tests.test_grammar import FIXTURES

NOUN_CONFIGS = sorted(GRAMMAR_DIR.glob("latin_noun_*.yaml"))
PRON_CONFIGS = sorted(GRAMMAR_DIR.glob("latin_pron_*.yaml"))


def _registry(kind: str) -> dict[str, dict]:
    decks = yaml.safe_load(NOMINALS[kind].read_text(encoding="utf-8"))["decks"]
    return {lx["lemma_key"]: lx for d in decks for p in d["pages"] for lx in p["lexemes"]}


NOUNS, PRONOUNS = _registry("noun"), _registry("pronoun")

#: Written from Wheelock, not from the import — the rules' own check.
WHEELOCK_NOUNS = {
    "porta": {"gen.sg": "portae", "abl.sg": "portā", "gen.pl": "portārum", "dat.pl": "portīs"},
    "agricola": {"acc.sg": "agricolam", "voc.sg": "agricola"},
    "amicus": {"voc.sg": "amīce", "gen.pl": "amīcōrum", "acc.pl": "amīcōs"},
    "filius": {"voc.sg": "fīlī", "gen.sg": "fīliī"},
    "donum": {"nom.pl": "dōna", "acc.sg": "dōnum"},
    "puer": {"nom.sg": "puer", "voc.sg": "puer", "gen.sg": "puerī"},
    "ager": {"nom.sg": "ager", "voc.sg": "ager", "acc.sg": "agrum"},
    "vir": {"nom.sg": "vir", "gen.pl": "virōrum"},
    "rex": {"nom.sg": "rēx", "acc.sg": "rēgem", "abl.sg": "rēge", "gen.pl": "rēgum"},
    "corpus": {"acc.sg": "corpus", "abl.sg": "corpore", "nom.pl": "corpora"},
    "civis": {"abl.sg": "cīve", "gen.pl": "cīvium", "acc.pl": "cīvēs"},
    "urbs": {"gen.pl": "urbium"},
    "mare": {"abl.sg": "marī", "nom.pl": "maria", "gen.pl": "marium"},
    "vis": {"acc.sg": "vim", "abl.sg": "vī", "nom.pl": "vīrēs", "gen.pl": "vīrium"},
    "fructus": {"gen.sg": "frūctūs", "dat.sg": "frūctuī", "gen.pl": "frūctuum"},
    "cornu": {"nom.sg": "cornū", "nom.pl": "cornua", "dat.pl": "cornibus"},
    "domus": {"abl.sg": "domō", "acc.pl": "domōs", "loc.sg": "domī", "gen.pl": "domuum"},
    "dies": {"gen.sg": "diēī", "dat.pl": "diēbus"},
    "res": {"gen.sg": "reī", "acc.sg": "rem"},
}
WHEELOCK_PRONOUNS = {
    "ego": {"dat.sg": "mihi", "gen.pl": "nostrī", "genpart.pl": "nostrum", "abl.pl": "nōbīs"},
    "tu": {"dat.sg": "tibi", "genpart.pl": "vestrum"},
    "sui": {"dat.sg": "sibi", "acc.sg": "sē"},
    "hic": {"gen.sg.m": "huius", "abl.sg.n": "hōc", "nom.sg.n": "hoc", "nom.pl.n": "haec"},
    "ille": {"gen.sg.f": "illīus", "dat.sg.m": "illī", "nom.sg.n": "illud"},
    "ipse": {"nom.sg.n": "ipsum", "gen.sg.m": "ipsīus"},
    "is": {"gen.sg.m": "eius", "nom.pl.m": "eī", "dat.pl.f": "eīs", "acc.sg.n": "id"},
    "idem": {"nom.sg.m": "īdem", "nom.sg.n": "idem", "acc.sg.m": "eundem", "gen.pl.m": "eōrundem",
             "dat.pl.n": "eīsdem"},
    "qui": {"gen.sg.f": "cuius", "nom.pl.n": "quae", "dat.pl.m": "quibus", "acc.sg.n": "quod"},
    "quis": {"nom.sg.c": "quis", "acc.sg.c": "quem", "nom.sg.n": "quid"},
    "aliquis": {"nom.sg.c": "aliquis", "gen.sg.n": "alicuius", "nom.pl.n": "aliqua",
                "dat.pl.f": "aliquibus"},
    "quidam": {"acc.sg.m": "quendam", "nom.sg.n": "quiddam", "gen.pl.f": "quārundam"},
    "quisque": {"nom.sg.c": "quisque", "nom.sg.n": "quidque", "dat.sg.c": "cuique"},
}


def _cfg(path) -> dict:
    return yaml.safe_load(path.read_text(encoding="utf-8"))


class TestRules:
    @pytest.mark.parametrize("key", sorted(WHEELOCK_NOUNS))
    def test_nouns(self, key):
        forms = gn.derive(NOUNS[key])
        assert {t: forms.get(t) for t in WHEELOCK_NOUNS[key]} == WHEELOCK_NOUNS[key]

    @pytest.mark.parametrize("key", sorted(WHEELOCK_PRONOUNS))
    def test_pronouns(self, key):
        forms = gn.derive(PRONOUNS[key])
        assert {t: forms.get(t) for t in WHEELOCK_PRONOUNS[key]} == WHEELOCK_PRONOUNS[key]

    def test_compounds_assimilate_m_to_n_before_d(self):
        assert gn._assimilate("eum", "dem") == "eundem"
        assert gn._assimilate("eius", "dem") == "eiusdem"

    def test_common_singular_has_no_feminine(self):
        forms = gn.derive(PRONOUNS["quis"])
        assert not [t for t in forms if t.endswith(".sg.f") or t.endswith(".sg.m")]
        assert not [t for t in forms if ".pl." in t]                 # excluded: quī's plural

    def test_only_domus_has_a_locative(self):
        assert [k for k in NOUNS if "loc.sg" in gn.derive(NOUNS[k])] == ["domus"]


class TestKaikki:
    def test_one_row_covers_several_genders(self):
        tags = ["feminine", "genitive", "masculine", "neuter", "singular"]
        assert gk.nominal_tags(tags, gendered=True) == ["gen.sg.m", "gen.sg.f", "gen.sg.n"]
        assert gk.nominal_tags(tags, gendered=True, common_singular=True) == ["gen.sg.c", "gen.sg.n"]

    def test_a_row_with_no_number_is_singular(self):
        assert gk.nominal_tags(["dative", "feminine", "masculine", "neuter"], gendered=False) == ["dat.sg"]

    @pytest.mark.parametrize("form,long,out", [
        ("egō̆", False, "ego"), ("cornū̆", True, "cornū"), ("e͡idem", False, None), ("portā", False, "portā")])
    def test_anceps(self, form, long, out):
        assert gk.resolve_anceps(form, long) == out

    def test_choose_puts_wheelocks_form_first_and_keeps_the_other_valid(self):
        v = gk.lexeme_variants(NOUNS["domus"], FIXTURES)
        assert v["abl.sg"] == ["domō", "domū"] and v["acc.pl"][0] == "domōs"

    def test_choose_refuses_a_form_wiktionary_does_not_list(self):
        lex = {**NOUNS["domus"], "choose": [{"tag": "abl.sg", "form": "domō̆", "reason": "x"}]}
        with pytest.raises(LookupError):
            gk.lexeme_variants(lex, FIXTURES)

    def test_partitive_genitive_gets_its_own_cell(self):
        v = gk.lexeme_variants(PRONOUNS["ego"], FIXTURES)
        assert v["gen.pl"] == ["nostrī"] and v["genpart.pl"] == ["nostrum"]

    def test_nominal_import_agrees_with_the_rules(self):
        for lex in (NOUNS["porta"], NOUNS["domus"], PRONOUNS["hic"], PRONOUNS["quidam"],
                    PRONOUNS["is"], PRONOUNS["idem"], PRONOUNS["ego"]):
            forms = {t: vs[0] for t, vs in gk.lexeme_variants(lex, FIXTURES).items()}
            rules = gn.derive(lex)
            assert {t: forms[t] for t in rules} == rules, lex["lemma_key"]

    def test_import_writes_noun_and_pronoun_decks(self, tmp_path):
        nouns = tmp_path / "nouns.yaml"
        nouns.write_text(yaml.safe_dump({"decks": [{"key": "decl1", "name": "1st declension",
            "pages": [{"key": "a", "label": "-a", "lexemes": [NOUNS["porta"]]}]}]},
            allow_unicode=True), encoding="utf-8")
        written = import_configs(None, FIXTURES, tmp_path, nominals={"noun": nouns})
        assert [p.stem for p in written] == ["latin_noun_decl1"]
        assert grammar.validate(_cfg(written[0])).ok


class TestDecks:
    @pytest.mark.parametrize("path", NOUN_CONFIGS + PRON_CONFIGS, ids=lambda p: p.stem)
    def test_committed_config_is_clean(self, path):
        report = grammar.validate(_cfg(path))
        assert report.ok, report.failures

    def test_one_deck_per_declension_and_three_pronoun_decks(self):
        assert [p.stem for p in NOUN_CONFIGS] == [f"latin_noun_decl{i}" for i in range(1, 6)]
        assert [p.stem for p in PRON_CONFIGS] == [
            "latin_pron_demonstratives", "latin_pron_personal", "latin_pron_relatives"]

    def test_items_are_word_and_tag(self):
        art = grammar.assemble_artifact(_cfg(GRAMMAR_DIR / "latin_noun_decl1.yaml"), "x")
        i = art["items"].index("la:porta|abl.sg")
        assert art["forms"][i] == "portā"
        assert art["labels"][i] == "-a nouns · porta, portae (f.) · ablative singular"

    def test_items_are_unique_across_every_grammar_deck(self):
        items = [i for p in sorted(GRAMMAR_DIR.glob("latin_*.yaml"))
                 for i in grammar.assemble_artifact(_cfg(p), "x")["items"]]
        assert len(items) == len(set(items))

    def test_a_noun_table_is_cases_by_number(self):
        c = _cfg(GRAMMAR_DIR / "latin_noun_decl4.yaml")
        domus = next(t for t in c["pages"][0]["tables"] if t["lexeme"] == "domus")
        assert domus["rows"][-1] == "locative" and domus["cols"] == ["singular", "plural"]
        assert domus["cells"][-1] is None                             # no locative plural
        assert len(next(t for t in c["pages"][0]["tables"] if t["lexeme"] == "cornu")["rows"]) == 6

    def test_a_gendered_pronoun_is_two_tables_side_by_side(self):
        c = _cfg(GRAMMAR_DIR / "latin_pron_demonstratives.yaml")
        page = c["pages"][0]
        assert page["flow"] == "row"
        assert [t["key"] for t in page["tables"]] == ["hic_sg", "hic_pl", "ille_sg", "ille_pl"]
        assert page["tables"][0]["cols"] == ["masculine", "feminine", "neuter"]

    def test_pages_fit_the_window(self):
        """At most four noun tables (six or seven rows each) or two pronouns a page."""
        for path in NOUN_CONFIGS + PRON_CONFIGS:
            for page in _cfg(path)["pages"]:
                assert len(page["tables"]) <= 4, (path.stem, page["key"])

    def test_the_flow_reaches_the_artifact(self):
        art = grammar.assemble_artifact(_cfg(GRAMMAR_DIR / "latin_pron_relatives.yaml"), "x")
        assert {p.get("flow") for p in art["pages"]} == {"row"}
        art = grammar.assemble_artifact(_cfg(GRAMMAR_DIR / "latin_noun_decl2.yaml"), "x")
        assert {p.get("flow") for p in art["pages"]} == {None}


class TestPools:
    def _pool(self, path, lexeme, tag):
        c = _cfg(path)
        lexemes = {lx["lemma_key"]: lx for lx in c["lexemes"]}
        for pg in grammar.parse_pages(c):
            for t, tb in enumerate(pg.tables):
                for i, x in enumerate(tb.cells):
                    if tb.lexeme == lexeme and x.tag == tag:
                        return gn.wrong_pool(pg.tables, t, i, gn.stems(lexemes[lexeme]))

    def test_nominative_and_ablative_differ_by_a_length_flip(self):
        pool = self._pool(GRAMMAR_DIR / "latin_noun_decl1.yaml", "porta", "nom.sg")
        assert "portā" in pool

    def test_a_noun_draws_only_on_itself(self):
        pool = self._pool(GRAMMAR_DIR / "latin_noun_decl1.yaml", "porta", "abl.sg")
        assert not any(f.startswith("agric") for f in pool)

    def test_a_pronoun_draws_on_both_its_tables(self):
        pool = self._pool(GRAMMAR_DIR / "latin_pron_demonstratives.yaml", "hic", "gen.sg.m")
        assert {"hōrum", "huic"} <= set(pool) and "huius" not in pool

    def test_a_valid_alternative_is_never_offered(self):
        pool = self._pool(GRAMMAR_DIR / "latin_noun_decl3.yaml", "civis", "abl.sg")
        assert "cīvī" not in pool                     # dative — and a valid ablative too
        pool = self._pool(GRAMMAR_DIR / "latin_noun_decl4.yaml", "domus", "acc.pl")
        assert "domūs" not in pool

    def test_the_stem_vowel_is_never_flipped(self):
        pool = self._pool(GRAMMAR_DIR / "latin_noun_decl3.yaml", "rex", "acc.sg")
        assert not any(f.startswith("reg") for f in pool)
