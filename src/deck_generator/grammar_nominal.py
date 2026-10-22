"""Grammar-table decks for nouns and pronouns: declension tables → quiz ``grammar-table``.

Same contract as the verb decks (`grammar`): one form = one card, item = tag identity
(``la:porta|abl.sg``, ``la:hic|gen.sg.m``), forms imported from Wiktionary and re-derived
here, build refused on any disagreement or absence.

- **Nouns** are derived from the dictionary entry (nominative, genitive, gender) by
  declension rule; ``domus`` and ``vīs`` are explicit tables (Wheelock).
- **Pronouns** have no conjugation-style rule, so most are explicit tables written from
  Wheelock — but the compounds are *derived* from their bases, which is a real second
  check: īdem from is (+dem, m → n), quīdam from quī (+dam), aliquis and quisque from quis,
  and ille / iste / ipse from one set of endings.

Tags: ``<case>.<number>`` (nouns, personal pronouns; ``genpart`` is nostrum/vestrum),
``<case>.<number>.<gender>`` (gendered pronouns).
"""
from __future__ import annotations

import unicodedata

from . import grammar
from .grammar import Report

CASES = ("nom", "gen", "genpart", "dat", "acc", "abl", "voc", "loc")
CASE_LABELS = {"nom": "nominative", "gen": "genitive", "genpart": "partitive gen.",
               "dat": "dative", "acc": "accusative", "abl": "ablative", "voc": "vocative",
               "loc": "locative"}
#: Three gender columns leave no room for the full case names beside them (e2e GT.4).
CASE_ABBR = {"nom": "nom.", "gen": "gen.", "dat": "dat.", "acc": "acc.", "abl": "abl."}
NUMBERS, NUMBER_LABELS = ("sg", "pl"), {"sg": "singular", "pl": "plural"}
GENDERS = ("m", "f", "n")
GENDER_LABELS = {"m": "masculine", "f": "feminine", "n": "neuter", "c": "masc. & fem."}
#: Pronoun tables have no vocative (Wheelock gives none but tū's, which equals the nominative).
PRONOUN_CASES = ("nom", "gen", "genpart", "dat", "acc", "abl")


def _nfc(s: str) -> str:
    return unicodedata.normalize("NFC", s)


def _w(s: str) -> list[str]:
    return s.split()


# --- noun rules -------------------------------------------------------------------------

#: Singular and plural endings, cases in order nom gen dat acc abl voc; "-" = the nominative
#: as given (3rd-declension nominatives are not stem + ending).
_NOUN_ENDINGS = {
    "1": ("a ae ae am ā a", "ae ārum īs ās īs ae"),
    "2": ("us ī ō um ō e", "ī ōrum īs ōs īs ī"),
    "2n": ("um ī ō um ō um", "a ōrum īs a īs a"),
    "3": ("- is ī em e -", "ēs um ibus ēs ibus ēs"),
    "3n": ("- is ī - e -", "a um ibus a ibus a"),
    "3i": ("- is ī em e -", "ēs ium ibus ēs ibus ēs"),
    "3in": ("- is ī - ī -", "ia ium ibus ia ibus ia"),
    "4": ("us ūs uī um ū us", "ūs uum ibus ūs ibus ūs"),
    "4n": ("ū ūs ū ū ū ū", "ua uum ibus ua ibus ua"),
    "5": ("ēs eī eī em ē ēs", "ēs ērum ēbus ēs ēbus ēs"),
}
_NOUN_CASES = ("nom", "gen", "dat", "acc", "abl", "voc")
#: Genitive singular ending per declension — the stem is the genitive minus it.
_GEN_ENDING = {"1": "ae", "2": "ī", "3": "is", "4": "ūs", "5": "ēī"}
#: Nouns no rule declines (Wheelock): domus mixes 2nd and 4th, vīs is irregular.
_IRREGULAR_NOUNS = {
    "domus": {"sg": "domus domūs domuī domum domō domus", "pl": "domūs domuum domibus domōs domibus domūs",
              "loc.sg": "domī"},
    "vis": {"sg": "vīs vīs vī vim vī vīs", "pl": "vīrēs vīrium vīribus vīrēs vīribus vīrēs"},
}


def noun_stem(lex: dict) -> str:
    nom, gen = (_nfc(p) for p in lex["principal_parts"])
    decl = str(lex["declension"])[0]
    if decl == "5":
        return gen[:-2]                                  # diēī → di-, reī → r-
    return gen[: -len(_GEN_ENDING[decl])]


def derive_noun(lex: dict) -> dict[str, str]:
    """Every form of a noun, tag → form."""
    key = lex["lemma_key"]
    if key in _IRREGULAR_NOUNS:
        t = _IRREGULAR_NOUNS[key]
        out = {f"{c}.{n}": f for n in NUMBERS for c, f in zip(_NOUN_CASES, _w(t[n]))}
        out.update({k: v for k, v in t.items() if "." in k})
        return {k: _nfc(v) for k, v in out.items()}
    nom = _nfc(lex["principal_parts"][0])
    decl = str(lex["declension"])
    klass = decl + ("n" if lex["gender"] == "n" else "")
    stem, out = noun_stem(lex), {}
    for n, ends in zip(NUMBERS, _NOUN_ENDINGS[klass]):
        for c, e in zip(_NOUN_CASES, _w(ends)):
            out[f"{c}.{n}"] = nom if e == "-" else stem + e
    if decl == "2" and not nom.endswith(("us", "um")):   # puer, ager, vir: nom = voc as given
        out["nom.sg"] = out["voc.sg"] = nom
    if decl == "2" and nom.endswith("ius"):              # fīlius → fīlī
        out["voc.sg"] = stem[:-1] + "ī"
    if decl == "5" and stem[-1:] in "aeiouāēīōū":        # diēī, but reī
        out["gen.sg"] = out["dat.sg"] = stem + "ēī"
    return {k: _nfc(v) for k, v in out.items()}


# --- pronoun rules ----------------------------------------------------------------------

def _g(*rows: str) -> list[list[str]]:
    """Gendered rows nom gen dat acc abl, each 'm f n'."""
    return [_w(r) for r in rows]


#: Explicit tables (Wheelock), singular and plural.
_PRONOUNS = {
    "is": {"sg": _g("is ea id", "eius eius eius", "eī eī eī", "eum eam id", "eō eā eō"),
           "pl": _g("eī eae ea", "eōrum eārum eōrum", "eīs eīs eīs", "eōs eās ea", "eīs eīs eīs")},
    "hic": {"sg": _g("hic haec hoc", "huius huius huius", "huic huic huic", "hunc hanc hoc",
                     "hōc hāc hōc"),
            "pl": _g("hī hae haec", "hōrum hārum hōrum", "hīs hīs hīs", "hōs hās haec",
                     "hīs hīs hīs")},
    "qui": {"sg": _g("quī quae quod", "cuius cuius cuius", "cui cui cui", "quem quam quod",
                     "quō quā quō"),
            "pl": _g("quī quae quae", "quōrum quārum quōrum", "quibus quibus quibus",
                     "quōs quās quae", "quibus quibus quibus")},
    "quis": {"sg": _g("quis quis quid", "cuius cuius cuius", "cui cui cui", "quem quem quid",
                      "quō quō quō")},
}
#: ille / iste / ipse: one declension on three stems; only ipse's neuter is -um, not -ud.
_ILLE = ("{s}e {s}a {s}{n}", "{s}īus {s}īus {s}īus", "{s}ī {s}ī {s}ī", "{s}um {s}am {s}{n}",
         "{s}ō {s}ā {s}ō")
_ILLE_PL = ("{s}ī {s}ae {s}a", "{s}ōrum {s}ārum {s}ōrum", "{s}īs {s}īs {s}īs",
            "{s}ōs {s}ās {s}a", "{s}īs {s}īs {s}īs")
_ILLE_STEMS = {"ille": ("ill", "ud"), "iste": ("ist", "ud"), "ipse": ("ips", "um")}

_PERSONAL = {
    "ego": {"nom.sg": "ego", "gen.sg": "meī", "dat.sg": "mihi", "acc.sg": "mē", "abl.sg": "mē",
            "nom.pl": "nōs", "gen.pl": "nostrī", "genpart.pl": "nostrum", "dat.pl": "nōbīs",
            "acc.pl": "nōs", "abl.pl": "nōbīs"},
    "tu": {"nom.sg": "tū", "gen.sg": "tuī", "dat.sg": "tibi", "acc.sg": "tē", "abl.sg": "tē",
           "nom.pl": "vōs", "gen.pl": "vestrī", "genpart.pl": "vestrum", "dat.pl": "vōbīs",
           "acc.pl": "vōs", "abl.pl": "vōbīs"},
    # Reflexive: no nominative, and singular = plural — one column.
    "sui": {"gen.sg": "suī", "dat.sg": "sibi", "acc.sg": "sē", "abl.sg": "sē"},
}
_GENDERED_CASES = ("nom", "gen", "dat", "acc", "abl")


def _table_forms(table: dict) -> dict[str, str]:
    return {f"{c}.{n}.{g}": f for n, rows in table.items()
            for c, row in zip(_GENDERED_CASES, rows) for g, f in zip(GENDERS, row)}


def _ille(key: str) -> dict[str, str]:
    stem, neut = _ILLE_STEMS[key]
    fill = lambda rows: [_w(r.format(s=stem, n=neut)) for r in rows]
    return _table_forms({"sg": fill(_ILLE), "pl": fill(_ILLE_PL)})


def _assimilate(form: str, suffix: str) -> str:
    """m before d becomes n: eum + dem → eundem, quōrum + dam → quōrundam."""
    return (form[:-1] + "n" if form.endswith("m") else form) + suffix


def _idem() -> dict[str, str]:
    out = {k: _assimilate(v, "dem") for k, v in _table_forms(_PRONOUNS["is"]).items()}
    out.update({"nom.sg.m": "īdem", "nom.sg.n": "idem", "acc.sg.n": "idem"})   # is-dem, id-dem
    return out


def _quidam() -> dict[str, str]:
    out = {k: _assimilate(v, "dam") for k, v in _table_forms(_PRONOUNS["qui"]).items()}
    out.update({"nom.sg.n": "quiddam", "acc.sg.n": "quiddam"})          # the pronoun's neuter
    return out


def _aliquis() -> dict[str, str]:
    """ali + quis in the singular (masc. & fem. one column), ali + quī in the plural — whose
    neuter is aliqua, not aliquae."""
    sg = {k: "ali" + v for k, v in _table_forms(_PRONOUNS["quis"]).items()}
    pl = {k: "ali" + v for k, v in _table_forms(_PRONOUNS["qui"]).items() if ".pl." in k}
    pl.update({"nom.pl.n": "aliqua", "acc.pl.n": "aliqua"})              # not aliquae
    return {**sg, **pl}


def _quisque() -> dict[str, str]:
    """quis + que, singular only."""
    return {k: v + "que" for k, v in _table_forms(_PRONOUNS["quis"]).items()}


_DERIVED = {"idem": _idem, "quidam": _quidam, "aliquis": _aliquis, "quisque": _quisque}


def derive_pronoun(lex: dict) -> dict[str, str]:
    key = lex["lemma_key"]
    if key in _PERSONAL:
        out = dict(_PERSONAL[key])
    elif key in _ILLE_STEMS:
        out = _ille(key)
    elif key in _DERIVED:
        out = _DERIVED[key]()
    else:
        out = _table_forms(_PRONOUNS[key])
    if lex.get("common_singular"):
        out = {_common(k): v for k, v in out.items() if not k.endswith(".sg.f")}
    for tag in grammar.excluded_tags(lex):
        out.pop(tag, None)
    return {k: _nfc(v) for k, v in out.items()}


def _common(tag: str) -> str:
    """nom.sg.m → nom.sg.c: Wheelock's one masc. & fem. column."""
    return tag[:-1] + "c" if tag.endswith(".sg.m") else tag


def derive(lex: dict) -> dict[str, str]:
    return derive_pronoun(lex) if lex.get("type") in ("personal", "gendered") else derive_noun(lex)


# --- tables -----------------------------------------------------------------------------

def _grid(key: str, label: str, rows: list[str], cols: list[str], tag_of, forms: dict,
          lexeme: str, row_labels: dict = CASE_LABELS) -> dict | None:
    """A config-form table over ``rows`` × ``cols`` (tag_of(row, col) → tag); rows with
    no form dropped. None when nothing is left."""
    cells = [[[tag_of(r, c), forms[tag_of(r, c)]] if tag_of(r, c) in forms else None
              for c in cols] for r in rows]
    kept = [(r, row) for r, row in zip(rows, cells) if any(row)]
    if not kept:
        return None
    return {"key": key, "lexeme": lexeme, "label": label,
            "rows": [row_labels[r] for r, _ in kept], "cols": None,
            "cells": [c for _, row in kept for c in row]}


def lexeme_tables(lex: dict, forms: dict[str, str]) -> list[dict]:
    """A lexeme's tables in config form: a noun or personal pronoun is one table (cases ×
    numbers); a gendered pronoun is one per number (cases × genders), singular beside plural.
    The reflexive has one column — its singular and plural are the same forms."""
    key, kind = lex["lemma_key"], lex.get("type", "noun")
    if kind == "gendered":
        out = []
        for n in NUMBERS:
            genders = ("c", "n") if lex.get("common_singular") and n == "sg" else GENDERS
            t = _grid(f"{key}_{n}", f"{lex['lemma']} · {NUMBER_LABELS[n]}", list(_GENDERED_CASES),
                      list(genders), lambda r, c, n=n: f"{r}.{n}.{c}", forms, key, CASE_ABBR)
            if t:
                t["cols"] = [GENDER_LABELS[g] for g in genders]
                out.append(t)
        return out
    cases = PRONOUN_CASES if kind == "personal" else CASES
    numbers = ["sg"] if lex.get("one_column") else list(NUMBERS)
    t = _grid(key, lex["label"], list(cases), numbers, lambda r, c: f"{r}.{c}", forms, key)
    t["cols"] = [lex["one_column"]] if lex.get("one_column") else [NUMBER_LABELS[n] for n in NUMBERS]
    return [t]


def noun_label(lex: dict) -> str:
    nom, gen = lex["principal_parts"]
    return f"{nom}, {gen} ({lex['gender']}.)"


# --- pools ------------------------------------------------------------------------------

def stems(lex: dict) -> list[str]:
    """Stems no vowel-length flip may touch: a pronoun's are listed; a noun's are its stem
    and the part of the nominative that shares it (rēx keeps rē-)."""
    if "stems" in lex:
        return lex["stems"]
    if lex.get("type") in ("personal", "gendered"):
        return []
    nom = _nfc(lex["principal_parts"][0])
    stem = noun_stem(lex) if lex["lemma_key"] not in _IRREGULAR_NOUNS else lex.get("stem", "")
    common = ""
    for a, b in zip(nom, stem):
        if a != b:
            break
        common += a
    return [s for s in (stem, common) if s]


def wrong_pool(tables: list[grammar.Table], t: int, c: int, protected: list[str]) -> list[str]:
    """Plausible wrong forms for cell ``c`` of table ``t``: every other form of the same word
    on the page (a pronoun's singular and plural tables both), then ending-vowel flips — the
    nominative/ablative portă / portā confusion is exactly a length flip. Never the cell's
    form, and never one of its other valid forms."""
    tb = tables[t]
    cell = tb.cells[c]
    same_word = [x.form for u in tables if u.lexeme == tb.lexeme for x in u.cells if x is not cell]
    candidates = same_word + grammar._length_flips(cell.form, protected)
    valid = {cell.form, *tb.also.get(cell.tag, [])}
    return list(dict.fromkeys(f for f in candidates if f not in valid))


# --- validation and artifact -------------------------------------------------------------

def _lexemes(cfg: dict) -> dict[str, dict]:
    return {lx["lemma_key"]: lx for lx in cfg["lexemes"]}


def validate(cfg: dict) -> Report:
    r = Report()
    pages = grammar.check_structure(cfg, r)
    if pages is None:
        return r
    lexemes = _lexemes(cfg)
    for pg in pages:
        for tb in pg.tables:
            if tb.lexeme not in lexemes:
                r.failures.append(f"{tb.key}: no lexeme {tb.lexeme!r}")
    if r.failures:
        return r
    rules = {k: derive(lx) for k, lx in lexemes.items()}
    have = {(tb.lexeme, x.tag) for pg in pages for tb in pg.tables for x in tb.cells}
    for pg in pages:
        for tb in pg.tables:
            for x in tb.cells:
                want = rules[tb.lexeme].get(x.tag)
                if want is None:
                    r.failures.append(f"{tb.lexeme} {x.tag}: authored {x.form}, rules give no such form")
                elif x.form != want:
                    r.failures.append(f"{tb.lexeme} {x.tag}: authored {x.form}, rules give {want}")
    for key, lx in lexemes.items():
        for spec in lexeme_tables(lx, rules[key]):
            for tag in grammar._spec_tags(spec):
                if (key, tag) not in have:
                    r.failures.append(f"{key} {tag}: rules give {rules[key][tag]}, "
                                      "config has no such cell")
    for pg in pages:
        for t, tb in enumerate(pg.tables):
            for c, x in enumerate(tb.cells):
                if not wrong_pool(pg.tables, t, c, stems(lexemes[tb.lexeme])):
                    r.failures.append(f"{tb.lexeme} {x.tag} ({x.form}) has no wrong forms")
    return r


def assemble_artifact(cfg: dict, config_path: str) -> dict:
    lexemes = _lexemes(cfg)
    return grammar.envelope(
        cfg, config_path, grammar.parse_pages(cfg),
        lambda tb, x: f"{cfg['language']}:{tb.lexeme}|{x.tag}",
        lambda tables, t, c: wrong_pool(tables, t, c, stems(lexemes[tables[t].lexeme])))
