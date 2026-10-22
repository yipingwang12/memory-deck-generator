"""Grammar-table decks: one verb paradigm → one quiz ``grammar-table`` artifact of pages.

**One form = one card.** The item is a tag identity (``la:porto|ind.act.impf.3sg``), never the
form, so fixing a macron re-displays a card instead of stranding its history. Tags:

- finite: ``<mood>.<voice>.<tense>.<person>`` — mood ``ind``/``subj``/``imp``;
- non-finite: ``inf.<voice>.<tense>``, ``ptcp.<voice>.<tense>`` (``ptcp.pass.fut`` is the
  gerundive), ``ger.<case>``, ``sup.<case>``.

**One verb = one config = one deck** (one deck per conjugation class; each irregular verb is
its own class). The deck is split into pages (`PAGES`) — indicative active / passive,
subjunctive active / passive, imperative & non-finite — each sized to fit the window.

**The oracle is two sources.** Configs are imported from Wiktionary (`grammar_kaikki`); every
form is re-derived here by conjugation rule — or, for the present system of an irregular verb,
from an explicit table — and the build refuses on any disagreement, absence included.

**Wrong forms come from the same verb**, because those are what a learner confuses: the same
tense in another person, the same person in another tense, the same cell in the other voice or
mood, and an ending vowel at the wrong length. Letter swaps would test spelling, not grammar.
"""
from __future__ import annotations

import unicodedata
from dataclasses import dataclass, field

PERSONS = ("1sg", "2sg", "3sg", "1pl", "2pl", "3pl")
PERSON_LABELS = {"1sg": "1st sg.", "2sg": "2nd sg.", "3sg": "3rd sg.",
                 "1pl": "1st pl.", "2pl": "2nd pl.", "3pl": "3rd pl."}
PERSON_ROWS, NUMBER_COLS = ["1st", "2nd", "3rd"], ["singular", "plural"]
#: Row-major display order of a person table's six cells (stored in PERSONS order).
PERSON_GRID = [0, 3, 1, 4, 2, 5]

TENSE_LABELS = {"pres": "Present", "impf": "Imperfect", "fut": "Future", "perf": "Perfect",
                "plpf": "Pluperfect", "futp": "Future perfect"}
FINITE_TENSES = {"ind": ("pres", "impf", "fut", "perf", "plpf", "futp"),
                 "subj": ("pres", "impf", "perf", "plpf")}
MOOD_LABELS = {"ind": "indicative", "subj": "subjunctive"}
VOICE_LABELS = {"act": "active", "pass": "passive"}

#: The non-finite page: (key, label, rows, cols, row-major tags; None = no such form).
GRID_TABLES = (
    ("imp_pres", "Present imperative", ["active", "passive"], NUMBER_COLS,
     ["imp.act.pres.2sg", "imp.act.pres.2pl", "imp.pass.pres.2sg", "imp.pass.pres.2pl"]),
    ("imp_fut", "Future imperative", ["2nd sg.", "3rd sg.", "2nd pl.", "3rd pl."],
     ["active", "passive"],
     ["imp.act.fut.2sg", "imp.pass.fut.2sg", "imp.act.fut.3sg", "imp.pass.fut.3sg",
      "imp.act.fut.2pl", None, "imp.act.fut.3pl", "imp.pass.fut.3pl"]),
    ("inf", "Infinitives", ["present", "perfect", "future"], ["active", "passive"],
     ["inf.act.pres", "inf.pass.pres", "inf.act.perf", "inf.pass.perf",
      "inf.act.fut", "inf.pass.fut"]),
    ("ptcp", "Participles", ["present", "perfect", "future"], ["active", "passive"],
     ["ptcp.act.pres", None, "ptcp.act.perf", "ptcp.pass.perf", "ptcp.act.fut", "ptcp.pass.fut"]),
    ("gersup", "Gerund & supine", ["genitive", "dative", "accusative", "ablative"],
     ["gerund", "supine"],
     ["ger.gen", None, "ger.dat", None, "ger.acc", "sup.acc", "ger.abl", "sup.abl"]),
)

#: Pages of a verb, in deck order: (slug, mood or None for the non-finite page, voice).
PAGES = (("ind_act", "ind", "act"), ("ind_pass", "ind", "pass"),
         ("subj_act", "subj", "act"), ("subj_pass", "subj", "pass"),
         ("nonfinite", None, None))
PAGE_BY_SLUG = {p[0]: p for p in PAGES}
#: Config ``kind`` values handled by `grammar_nominal`; anything else is a verb deck.
NOMINAL_KINDS = ("noun", "pronoun")

_LENGTH = {"a": "ā", "e": "ē", "i": "ī", "o": "ō", "u": "ū"}
_LENGTH.update({v: k for k, v in list(_LENGTH.items())})


def _nfc(s: str) -> str:
    return unicodedata.normalize("NFC", s)


def _w(s: str) -> list[str]:
    return s.split()


# --- rules -----------------------------------------------------------------------------

#: Endings attached to the base (infinitive minus its last three letters: port-, mon-, dūc-,
#: cap-, aud-). ``tv`` is the imperfect's vowel, ``nd`` the gerund/gerundive stem.
_ENDINGS = {
    "1": {"ind.act.pres": "ō ās at āmus ātis ant", "ind.act.fut": "ābō ābis ābit ābimus ābitis ābunt",
          "ind.pass.pres": "or āris ātur āmur āminī antur",
          "ind.pass.fut": "ābor āberis ābitur ābimur ābiminī ābuntur",
          "subj.act.pres": "em ēs et ēmus ētis ent", "subj.pass.pres": "er ēris ētur ēmur ēminī entur",
          "imp.act.pres": "ā āte", "imp.act.fut": "ātō ātō ātōte antō", "imp.pass.fut": "ātor ātor antor",
          "inf.pass.pres": "ārī", "ptcp.act.pres": "āns", "tv": "ā", "nd": "and"},
    "2": {"ind.act.pres": "eō ēs et ēmus ētis ent", "ind.act.fut": "ēbō ēbis ēbit ēbimus ēbitis ēbunt",
          "ind.pass.pres": "eor ēris ētur ēmur ēminī entur",
          "ind.pass.fut": "ēbor ēberis ēbitur ēbimur ēbiminī ēbuntur",
          "subj.act.pres": "eam eās eat eāmus eātis eant",
          "subj.pass.pres": "ear eāris eātur eāmur eāminī eantur",
          "imp.act.pres": "ē ēte", "imp.act.fut": "ētō ētō ētōte entō", "imp.pass.fut": "ētor ētor entor",
          "inf.pass.pres": "ērī", "ptcp.act.pres": "ēns", "tv": "ē", "nd": "end"},
    "3": {"ind.act.pres": "ō is it imus itis unt", "ind.act.fut": "am ēs et ēmus ētis ent",
          "ind.pass.pres": "or eris itur imur iminī untur", "ind.pass.fut": "ar ēris ētur ēmur ēminī entur",
          "subj.act.pres": "am ās at āmus ātis ant", "subj.pass.pres": "ar āris ātur āmur āminī antur",
          "imp.act.pres": "e ite", "imp.act.fut": "itō itō itōte untō", "imp.pass.fut": "itor itor untor",
          "inf.pass.pres": "ī", "ptcp.act.pres": "ēns", "tv": "ē", "nd": "end"},
    "3io": {"ind.act.pres": "iō is it imus itis iunt", "ind.act.fut": "iam iēs iet iēmus iētis ient",
            "ind.pass.pres": "ior eris itur imur iminī iuntur",
            "ind.pass.fut": "iar iēris iētur iēmur iēminī ientur",
            "subj.act.pres": "iam iās iat iāmus iātis iant",
            "subj.pass.pres": "iar iāris iātur iāmur iāminī iantur",
            "imp.act.pres": "e ite", "imp.act.fut": "itō itō itōte iuntō",
            "imp.pass.fut": "itor itor iuntor",
            "inf.pass.pres": "ī", "ptcp.act.pres": "iēns", "tv": "iē", "nd": "iend"},
    "4": {"ind.act.pres": "iō īs it īmus ītis iunt", "ind.act.fut": "iam iēs iet iēmus iētis ient",
          "ind.pass.pres": "ior īris ītur īmur īminī iuntur",
          "ind.pass.fut": "iar iēris iētur iēmur iēminī ientur",
          "subj.act.pres": "iam iās iat iāmus iātis iant",
          "subj.pass.pres": "iar iāris iātur iāmur iāminī iantur",
          "imp.act.pres": "ī īte", "imp.act.fut": "ītō ītō ītōte iuntō", "imp.pass.fut": "ītor ītor iuntor",
          "inf.pass.pres": "īrī", "ptcp.act.pres": "iēns", "tv": "iē", "nd": "iend"},
}
_SUM = {"pres": "sum es est sumus estis sunt", "impf": "eram erās erat erāmus erātis erant",
        "fut": "erō eris erit erimus eritis erunt"}
_SUM_SUBJ = {"pres": "sim sīs sit sīmus sītis sint",
             "impf": "essem essēs esset essēmus essētis essent"}

#: Present systems that no conjugation rule produces: the second source for these cells is
#: this table, written from Wheelock, against the Wiktionary import.
_IRREGULAR = {
    "sum": {"ind.act.pres": _SUM["pres"], "ind.act.impf": _SUM["impf"], "ind.act.fut": _SUM["fut"],
            "subj.act.pres": _SUM_SUBJ["pres"], "subj.act.impf": _SUM_SUBJ["impf"],
            "imp.act.pres": "es este", "imp.act.fut": "estō estō estōte suntō",
            "inf.act.pres": "esse", "inf.act.fut": "futūrus esse", "ptcp.act.fut": "futūrus"},
    "possum": {"ind.act.pres": "possum potes potest possumus potestis possunt",
               "ind.act.impf": "poteram poterās poterat poterāmus poterātis poterant",
               "ind.act.fut": "poterō poteris poterit poterimus poteritis poterunt",
               "subj.act.pres": "possim possīs possit possīmus possītis possint",
               "subj.act.impf": "possem possēs posset possēmus possētis possent",
               "inf.act.pres": "posse", "ptcp.act.pres": "potēns"},
    "volo": {"ind.act.pres": "volō vīs vult volumus vultis volunt",
             "ind.act.impf": "volēbam volēbās volēbat volēbāmus volēbātis volēbant",
             "ind.act.fut": "volam volēs volet volēmus volētis volent",
             "subj.act.pres": "velim velīs velit velīmus velītis velint",
             "subj.act.impf": "vellem vellēs vellet vellēmus vellētis vellent",
             "inf.act.pres": "velle", "ptcp.act.pres": "volēns"},
    "eo": {"ind.act.pres": "eō īs it īmus ītis eunt",
           "ind.act.impf": "ībam ībās ībat ībāmus ībātis ībant",
           "ind.act.fut": "ībō ībis ībit ībimus ībitis ībunt",
           "ind.act.perf": "iī īstī iit iimus īstis iērunt",
           "subj.act.pres": "eam eās eat eāmus eātis eant",
           "subj.act.impf": "īrem īrēs īret īrēmus īrētis īrent",
           "subj.act.plpf": "īssem īssēs īsset īssēmus īssētis īssent",
           "imp.act.pres": "ī īte", "imp.act.fut": "ītō ītō ītōte euntō",
           "inf.act.pres": "īre", "inf.act.perf": "īsse", "ptcp.act.pres": "iēns",
           "ger": "eund"},
    "fio": {"ind.act.pres": "fīō fīs fit fīmus fītis fīunt",
            "ind.act.impf": "fīēbam fīēbās fīēbat fīēbāmus fīēbātis fīēbant",
            "ind.act.fut": "fīam fīēs fīet fīēmus fīētis fīent",
            "subj.act.pres": "fīam fīās fīat fīāmus fīātis fīant",
            "subj.act.impf": "fierem fierēs fieret fierēmus fierētis fierent",
            "imp.act.pres": "fī fīte", "imp.act.fut": "fītō fītō fītōte fīuntō",
            "inf.act.pres": "fierī"},
}
#: Regular verbs with a few irregular cells: ferō is 3rd conjugation with syncopated forms.
_OVERRIDES = {
    "fero": {"ind.act.pres.2sg": "fers", "ind.act.pres.3sg": "fert", "ind.act.pres.2pl": "fertis",
             "ind.pass.pres.2sg": "ferris", "ind.pass.pres.3sg": "fertur",
             "imp.act.pres.2sg": "fer", "imp.act.pres.2pl": "ferte",
             "imp.act.fut.2sg": "fertō", "imp.act.fut.3sg": "fertō", "imp.act.fut.2pl": "fertōte",
             "imp.pass.fut.2sg": "fertor", "imp.pass.fut.3sg": "fertor", "inf.pass.pres": "ferrī"},
    # edō's athematic forms (Allen & Greenough §201), where ēs- replaces edi-/ede-.
    "edo": {"ind.act.pres.2sg": "ēs", "ind.act.pres.3sg": "ēst", "ind.act.pres.2pl": "ēstis",
            "imp.act.pres.2sg": "ēs", "imp.act.pres.2pl": "ēste",
            "imp.act.fut.2sg": "ēstō", "imp.act.fut.3sg": "ēstō", "imp.act.fut.2pl": "ēstōte"},
}
#: The short present imperatives (dīc, dūc, fac, fer), keyed by infinitive.
_SHORT_IMPERATIVE = {"dūcere": "dūc", "dīcere": "dīc", "facere": "fac"}
#: Bases that are not "infinitive minus three letters".
_BASE = {"fero": "fer", "edo": "ed"}
#: Stems protected from vowel-length flips, for verbs whose stems no principal part gives.
_STEMS = {"sum": ["s", "es", "er", "fu", "fut"], "possum": ["poss", "pot", "potu"],
          "volo": ["vol", "vel", "vul", "v"], "eo": ["e", "ī", "i", "eu", "it"],
          "fio": ["fī", "f", "fact"]}

_IMP_PERSONS = {"imp.act.pres": ("2sg", "2pl"), "imp.act.fut": ("2sg", "3sg", "2pl", "3pl"),
                "imp.pass.fut": ("2sg", "3sg", "3pl")}


def _persons(out: dict, prefix: str, forms: list[str]) -> None:
    persons = _IMP_PERSONS.get(prefix, PERSONS)
    if len(forms) != len(persons):
        raise ValueError(f"{prefix}: {len(forms)} forms for {len(persons)} persons")
    out.update({f"{prefix}.{p}": f for p, f in zip(persons, forms)})


def _perfect_system(out: dict, perf: str) -> None:
    p = perf[:-1]
    for prefix, ends in (("ind.act.perf", "ī istī it imus istis ērunt"),
                         ("ind.act.plpf", "eram erās erat erāmus erātis erant"),
                         ("ind.act.futp", "erō eris erit erimus eritis erint"),
                         ("subj.act.perf", "erim erīs erit erīmus erītis erint"),
                         ("subj.act.plpf", "issem issēs isset issēmus issētis issent")):
        _persons(out, prefix, [p + e for e in _w(ends)])
    out["inf.act.perf"] = p + "isse"


def _supine_system(out: dict, sup: str, passive: bool) -> None:
    s = sup[:-2]
    out.update({"ptcp.act.fut": s + "ūrus", "inf.act.fut": s + "ūrus esse",
                "sup.acc": sup, "sup.abl": s + "ū"})
    if not passive:
        return
    sg, pl = s + "us", s + "ī"
    for prefix, aux in (("ind.pass.perf", _SUM["pres"]), ("ind.pass.plpf", _SUM["impf"]),
                        ("ind.pass.futp", _SUM["fut"]), ("subj.pass.perf", _SUM_SUBJ["pres"]),
                        ("subj.pass.plpf", _SUM_SUBJ["impf"])):
        aux = _w(aux)
        _persons(out, prefix, [f"{sg if i < 3 else pl} {a}" for i, a in enumerate(aux)])
    out.update({"ptcp.pass.perf": sg, "inf.pass.perf": sg + " esse", "inf.pass.fut": sup + " īrī"})


def _present_system(out: dict, conj: str, base: str, inf: str) -> None:
    e = _ENDINGS[conj]
    for prefix in ("ind.act.pres", "ind.act.fut", "ind.pass.pres", "ind.pass.fut",
                   "subj.act.pres", "subj.pass.pres", "imp.act.pres", "imp.act.fut",
                   "imp.pass.fut"):
        _persons(out, prefix, [base + x for x in _w(e[prefix])])
    _persons(out, "ind.act.impf",
             [base + e["tv"] + x for x in _w("bam bās bat bāmus bātis bant")])
    _persons(out, "ind.pass.impf",
             [base + e["tv"] + x for x in _w("bar bāris bātur bāmur bāminī bantur")])
    r = inf[:-1]
    _persons(out, "subj.act.impf", [r + x for x in _w("em ēs et ēmus ētis ent")])
    _persons(out, "subj.pass.impf", [r + x for x in _w("er ēris ētur ēmur ēminī entur")])
    if inf in _SHORT_IMPERATIVE:
        out["imp.act.pres.2sg"] = _SHORT_IMPERATIVE[inf]
    out.update({"imp.pass.pres.2sg": inf, "imp.pass.pres.2pl": out["ind.pass.pres.2pl"],
                "inf.act.pres": inf, "inf.pass.pres": base + e["inf.pass.pres"],
                "ptcp.act.pres": base + e["ptcp.act.pres"],
                "ptcp.pass.fut": base + e["nd"] + "us"})
    _gerund(out, base + e["nd"])


def _gerund(out: dict, stem: str) -> None:
    out.update({f"ger.{c}": stem + x for c, x in zip(("gen", "dat", "acc", "abl"),
                                                       ("ī", "ō", "um", "ō"))})


def _semi_deponent_perfect(out: dict, sup: str) -> None:
    """fīō: the perfect system is periphrastic like a passive (factus sum) but ACTIVE in
    meaning, and the verb has no future active participle."""
    perfect = {}
    _supine_system(perfect, sup, passive=True)
    for k in ("ptcp.act.fut", "inf.act.fut"):
        del perfect[k]
    out.update({k.replace(".pass.", ".act."): v for k, v in perfect.items()})


def derive(verb: dict) -> dict[str, str]:
    """Every form of ``verb`` (config keys ``conjugation``, ``principal_parts``,
    ``lemma_key``, optional ``active_only``, ``semi_deponent``, ``exclude``), tag → form; a
    tag absent here has no form. ``exclude`` is applied to both sources alike — it is a
    choice of standard, not a disagreement between them."""
    conj = str(verb["conjugation"])
    first, inf, perf, sup = (_nfc(p) if p else None for p in verb["principal_parts"])
    key, out = verb["lemma_key"], {}
    if conj == "irregular":
        table = _IRREGULAR[key]
        for prefix, forms in table.items():
            if prefix == "ger":
                _gerund(out, forms)
            elif prefix.split(".")[0] in ("ind", "subj", "imp"):
                _persons(out, prefix, _w(forms))
            else:
                out[prefix] = forms
        if perf:
            perfect = {}
            _perfect_system(perfect, perf)
            out.update({k: v for k, v in perfect.items()
                        if k not in out and k.rsplit(".", 1)[0] not in table})
        if sup and verb.get("semi_deponent"):
            _semi_deponent_perfect(out, sup)
        elif sup:
            _supine_system(out, sup, passive=False)
    else:
        _present_system(out, conj, _BASE.get(key, inf[:-3]), inf)
        _perfect_system(out, perf)
        if sup:
            _supine_system(out, sup, passive=True)
        out.update(_OVERRIDES.get(key, {}))
    if first is not None and out.get("ind.act.pres.1sg", first) != first:
        raise ValueError(f"{key}: rules give {out['ind.act.pres.1sg']}, first principal part {first}")
    if verb.get("active_only"):
        out = {k: v for k, v in out.items() if ".pass." not in k}
    for tag in excluded_tags(verb):
        out.pop(tag, None)
    return {k: _nfc(v) for k, v in out.items()}


def excluded_tags(verb: dict) -> list[str]:
    """Tags a verb's ``exclude`` entries drop (``tag`` or ``tags``, each with a reason)."""
    return [t for ex in verb.get("exclude", []) for t in ex.get("tags", [ex.get("tag")]) if t]


def stems(verb: dict) -> list[str]:
    """Stems never touched by a vowel-length flip: the length of a root vowel is lexical
    knowledge, not grammar."""
    if verb["lemma_key"] in _STEMS:
        return _STEMS[verb["lemma_key"]]
    _, inf, perf, sup = (_nfc(p) if p else "" for p in verb["principal_parts"])
    base = _BASE.get(verb["lemma_key"], inf[:-3])
    return [s for s in (base, perf[:-1], sup[:-2]) if s]


# --- pages and tables -------------------------------------------------------------------

@dataclass(frozen=True)
class Cell:
    tag: str
    form: str


@dataclass(frozen=True)
class Table:
    """``grid`` is row-major over ``rows`` × ``cols``: an index into ``cells`` or None.
    ``also`` maps a tag to its other valid forms (Wiktionary's variants) — never shown, and
    never offered as a wrong form: a correct form marked wrong teaches the wrong thing.
    ``lexeme`` names the word a nominal table declines (None for a verb page)."""
    key: str
    label: str
    rows: list[str]
    cols: list[str]
    cells: list[Cell]
    grid: list[int | None]
    also: dict = field(default_factory=dict)
    lexeme: str | None = None


@dataclass(frozen=True)
class Page:
    """``flow`` is how the quiz lays the tables out: by column (a verb's present system
    left, perfect right — the default) or by row (a pronoun's singular beside its plural)."""
    key: str
    label: str
    tables: list[Table]
    flow: str = "column"


def parse_tables(specs: list[dict]) -> list[Table]:
    """One page's tables: person shorthand (``tag`` + six ``forms``) or explicit grid
    (``rows``, ``cols``, ``cells`` row-major of ``[tag, form]`` or null)."""
    out = []
    for t in specs:
        if "forms" in t:
            if len(t["forms"]) != len(PERSONS):
                raise ValueError(f"{t['key']}: {len(t['forms'])} forms, need {len(PERSONS)}")
            cells = [Cell(f"{t['tag']}.{p}", f) for p, f in zip(PERSONS, t["forms"])]
            out.append(Table(t["key"], t["label"], PERSON_ROWS, NUMBER_COLS, cells, PERSON_GRID,
                             t.get("also", {}), t.get("lexeme")))
            continue
        if len(t["cells"]) != len(t["rows"]) * len(t["cols"]):
            raise ValueError(f"{t['key']}: {len(t['cells'])} cells for "
                             f"{len(t['rows'])}×{len(t['cols'])}")
        cells, grid = [], []
        for c in t["cells"]:
            if c is None:
                grid.append(None)
            else:
                grid.append(len(cells))
                cells.append(Cell(c[0], c[1]))
        out.append(Table(t["key"], t["label"], t["rows"], t["cols"], cells, grid,
                         t.get("also", {}), t.get("lexeme")))
    return out


def parse_pages(cfg: dict) -> list[Page]:
    return [Page(p["key"], p["label"], parse_tables(p["tables"]), p.get("flow", "column"))
            for p in cfg["pages"]]


def with_alternatives(tables: list[dict], variants: dict[str, list[str]]) -> list[dict]:
    """Attach each cell's other valid forms (``also``) to config-form tables."""
    for t in tables:
        tags = _spec_tags(t)
        forms = t["forms"] if "forms" in t else [c[1] for c in t["cells"] if c]
        also = {tag: [v for v in variants.get(tag, []) if v != f]
                for tag, f in zip(tags, forms)}
        also = {k: v for k, v in also.items() if v}
        if also:
            t["also"] = also
    return tables


def page_tables(forms: dict[str, str], mood: str | None, voice: str | None) -> list[dict]:
    """One page's tables in config form, from a tag → form map; empty tables dropped, so a
    verb with no passive or no supine simply has fewer."""
    if mood is not None:
        return [{"key": t, "label": TENSE_LABELS[t], "tag": f"{mood}.{voice}.{t}",
                 "forms": [forms[f"{mood}.{voice}.{t}.{p}"] for p in PERSONS]}
                for t in FINITE_TENSES[mood]
                if all(f"{mood}.{voice}.{t}.{p}" in forms for p in PERSONS)]
    out = []
    for key, label, rows, cols, tags in GRID_TABLES:
        n = len(cols)
        cells = [[t, forms[t]] if t in forms else None for t in tags]
        # A row or column with no form at all (eō's passive column) is not shown.
        keep_r = [r for r in range(len(rows)) if any(cells[r * n:(r + 1) * n])]
        keep_c = [c for c in range(n) if any(cells[r * n + c] for r in range(len(rows)))]
        if keep_r:
            out.append({"key": key, "label": label, "rows": [rows[r] for r in keep_r],
                        "cols": [cols[c] for c in keep_c],
                        "cells": [cells[r * n + c] for r in keep_r for c in keep_c]})
    return out


def page_label(slug: str, tables: list[dict], active_only: bool) -> str:
    _, mood, voice = PAGE_BY_SLUG[slug]
    if mood is not None:
        label = MOOD_LABELS[mood].capitalize()
        return label if active_only else f"{label} {VOICE_LABELS[voice]}"
    return ("Imperative & non-finite" if any(t["key"].startswith("imp") for t in tables)
            else "Non-finite")


def verb_pages(forms: dict[str, str], active_only: bool = False) -> list[dict]:
    """Every non-empty page of a verb in config form, in `PAGES` order."""
    out = []
    for slug, mood, voice in PAGES:
        tables = page_tables(forms, mood, voice)
        if tables:
            out.append({"key": slug, "label": page_label(slug, tables, active_only),
                        "tables": tables})
    return out


# --- wrong-form pools -------------------------------------------------------------------

def _length_flips(form: str, protected: list[str]) -> list[str]:
    """Each vowel of the first word's ending at the opposite length — one flip per vowel.
    The ending starts after the longest protected stem the form begins with."""
    word, rest = (form.split(" ", 1) + [""])[:2]
    start = max((len(s) for s in protected if word.startswith(s)), default=0)
    tail = f" {rest}" if rest else ""
    return [word[:i] + _LENGTH[c] + word[i + 1:] + tail
            for i, c in enumerate(word) if i >= start and c in _LENGTH]


def _related_tags(tag: str, verb_forms: dict[str, str]) -> list[str]:
    """Tags a learner confuses with ``tag``: same person in other tenses, then the same cell
    in the other voice and the other mood."""
    parts = tag.split(".")
    swap_voice = {"act": "pass", "pass": "act"}
    if len(parts) == 4 and parts[0] in FINITE_TENSES:
        mood, voice, tense, person = parts
        out = [f"{mood}.{voice}.{t}.{person}" for t in FINITE_TENSES[mood] if t != tense]
        out.append(f"{mood}.{swap_voice[voice]}.{tense}.{person}")
        out.append(f"{'subj' if mood == 'ind' else 'ind'}.{voice}.{tense}.{person}")
        return [t for t in out if t in verb_forms]
    if len(parts) >= 3 and parts[1] in swap_voice:
        other = ".".join([parts[0], swap_voice[parts[1]], *parts[2:]])
        return [other] if other in verb_forms else []
    return []


def wrong_pool(tables: list[Table], t: int, c: int, verb_forms: dict[str, str],
               protected: list[str]) -> list[str]:
    """Plausible wrong forms for cell ``c`` of table ``t`` of one page: the rest of its
    table, related cells of the verb, the rest of a non-finite page, and ending-vowel flips.
    Never the cell's own form."""
    cell = tables[t].cells[c]
    same_table = [x.form for i, x in enumerate(tables[t].cells) if i != c]
    related = [verb_forms[x] for x in _related_tags(cell.tag, verb_forms)]
    finite = cell.tag.split(".")[0] in FINITE_TENSES
    page = [] if finite else [x.form for u, tb in enumerate(tables) if u != t for x in tb.cells]
    candidates = same_table + related + page + _length_flips(cell.form, protected)
    valid = {cell.form, *tables[t].also.get(cell.tag, [])}
    return list(dict.fromkeys(f for f in candidates if f not in valid))


# --- validation -------------------------------------------------------------------------

@dataclass
class Report:
    failures: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return not self.failures


def _spec_tags(spec: dict) -> list[str]:
    if "forms" in spec:
        return [f"{spec['tag']}.{p}" for p in PERSONS]
    return [c[0] for c in spec["cells"] if c]


def check_structure(cfg: dict, r: Report) -> list[Page] | None:
    """Page/table keys, grid shapes, tag uniqueness, NFC; None when the config cannot be
    read further. Shared by verb and nominal decks."""
    page_keys = [p["key"] for p in cfg["pages"]]
    if len(set(page_keys)) != len(page_keys):
        r.failures.append(f"duplicate page keys: {page_keys}")
    for p in cfg["pages"]:
        keys = [t["key"] for t in p["tables"]]
        if len(set(keys)) != len(keys):
            r.failures.append(f"{p['key']}: duplicate table keys: {keys}")
    try:
        pages = parse_pages(cfg)
    except ValueError as e:
        r.failures.append(str(e))
        return None
    ids = [(tb.lexeme, x.tag) for pg in pages for tb in pg.tables for x in tb.cells]
    if len(set(ids)) != len(ids):
        r.failures.append("duplicate tags")
    for pg in pages:
        for tb in pg.tables:
            forms = [x.form for x in tb.cells] + [v for vs in tb.also.values() for v in vs]
            for f in forms:
                if not unicodedata.is_normalized("NFC", f):
                    r.failures.append(f"{tb.key}: {f!r} is not NFC")
    return None if r.failures else pages


def validate(cfg: dict) -> Report:
    """Every structural check plus authored-vs-rules agreement, absence included; failures
    block a build."""
    if cfg.get("kind") in NOMINAL_KINDS:
        from . import grammar_nominal
        return grammar_nominal.validate(cfg)
    r = Report()
    pages = check_structure(cfg, r)
    if pages is None:
        return r
    page_keys = [p.key for p in pages]
    cells = [x for pg in pages for tb in pg.tables for x in tb.cells]
    tags = [x.tag for x in cells]

    rules = derive(cfg)
    for x in cells:
        if x.tag not in rules:
            r.failures.append(f"{x.tag}: authored {x.form}, rules give no such form")
        elif x.form != rules[x.tag]:
            r.failures.append(f"{x.tag}: authored {x.form}, rules give {rules[x.tag]}")
    expected = verb_pages(rules, bool(cfg.get("active_only")))
    if [p["key"] for p in expected] != page_keys:
        r.failures.append(f"pages {page_keys}, rules give {[p['key'] for p in expected]}")
    for tag in (t for p in expected for spec in p["tables"] for t in _spec_tags(spec)):
        if tag not in tags:
            r.failures.append(f"{tag}: rules give {rules[tag]}, config has no such cell")

    protected = stems(cfg)
    for pg in pages:
        for t, tb in enumerate(pg.tables):
            for c, x in enumerate(tb.cells):
                if not wrong_pool(pg.tables, t, c, rules, protected):
                    r.failures.append(f"{x.tag} ({x.form}) has no wrong forms")
    return r


# --- artifact ---------------------------------------------------------------------------

def item_string(cfg: dict, tag: str) -> str:
    return f"{cfg['language']}:{cfg['lemma_key']}|{tag}"


def cell_label(table: Table, i: int) -> str:
    """``Present · 3rd sg.`` for a person table, ``Infinitives · perfect passive`` otherwise."""
    if table.rows == PERSON_ROWS:
        return f"{table.label} · {PERSON_LABELS[table.cells[i].tag.rsplit('.', 1)[1]]}"
    pos = table.grid.index(i)
    return f"{table.label} · {table.rows[pos // len(table.cols)]} {table.cols[pos % len(table.cols)]}"


def envelope(cfg: dict, config_path: str, pages: list[Page], item_for, pool_for) -> dict:
    """The artifact the quiz's ``deck_loader`` reads for a ``grammar-table`` deck, given how
    to name a cell (``item_for(table, cell)``) and draw its wrong forms
    (``pool_for(page_tables, t, c)``). Tables are one flat list (the quiz arms them in order
    across pages); ``pages`` groups them for display, and each label carries its page and
    table so it stays unique across the deck."""
    items, labels, forms, pools, out_tables, out_pages = [], [], [], [], [], []
    for pg in pages:
        first_table = len(out_tables)
        for t, tb in enumerate(pg.tables):
            start = len(items)
            for c, x in enumerate(tb.cells):
                items.append(item_for(tb, x))
                labels.append(f"{pg.label} · {cell_label(tb, c)}")
                forms.append(x.form)
                pools.append(pool_for(pg.tables, t, c))
            out_tables.append({"key": f"{pg.key}.{tb.key}", "label": tb.label, "rows": tb.rows,
                               "cols": tb.cols, "grid": tb.grid,
                               "cells": list(range(start, len(items)))})
        page = {"key": pg.key, "label": pg.label,
                "tables": list(range(first_table, len(out_tables)))}
        if pg.flow != "column":
            page["flow"] = pg.flow
        out_pages.append(page)
    return {
        "order": cfg.get("order", 600),
        "name": cfg["deck_name"],
        "deck_type": "grammar",
        "mode": "grammar-table",
        "title": cfg.get("title", cfg["deck_name"]),
        "group": cfg.get("group", "Latin Grammar"),
        "language": cfg["language"],
        "lemma": cfg.get("lemma", cfg["deck_name"]),
        "items": items,
        "labels": labels,
        "forms": forms,
        "pools": pools,
        "tables": out_tables,
        "pages": out_pages,
        "poem_title": None,
        "config_path": config_path,
        "source": "manual",
        "standard": cfg.get("standard", ""),
    }


def assemble_artifact(cfg: dict, config_path: str) -> dict:
    """A deck's artifact — a verb's here, a noun or pronoun deck's in ``grammar_nominal``."""
    if cfg.get("kind") in NOMINAL_KINDS:
        from . import grammar_nominal
        return grammar_nominal.assemble_artifact(cfg, config_path)
    rules, protected = derive(cfg), stems(cfg)
    return envelope(cfg, config_path, parse_pages(cfg),
                    lambda tb, x: item_string(cfg, x.tag),
                    lambda tables, t, c: wrong_pool(tables, t, c, rules, protected))
