"""Import Latin verb forms from Wiktionary (kaikki.org JSONL) into grammar-table configs.

This is the *first* source of every form; ``grammar.derive`` is the second, and the build
refuses where they disagree. The import never consults the rules, or the check would be
circular.

- **First variant wins.** Wiktionary lists syncopated and archaic variants after the
  standard form (portāvistī, then portāstī); the first is the one Wheelock teaches. A verb's
  ``prefer`` overrides that where the irregular form is the point (edō: ēs, not edis).
- **Periphrastic perfects are composed**: Wiktionary writes them as
  ``portātus + present active indicative of sum``, so the cells are built from that
  participle and *sum*'s own imported forms, masculine (portātus sum, portātī sumus) as
  Wheelock cites them. The row's own tags give the voice — fīō's factus sum is active.
- **Periphrastic infinitives are cited in the nominative** (portātūrus esse, portātus esse),
  Wheelock's form; Wiktionary gives the accusative (portātūrum esse).
"""
from __future__ import annotations

import json
import unicodedata
from pathlib import Path

from . import grammar

_PERSON = {"first-person": "1", "second-person": "2", "third-person": "3"}
_NUMBER = {"singular": "sg", "plural": "pl"}
_CASE = {"genitive": "gen", "dative": "dat", "accusative": "acc", "ablative": "abl"}
_MOOD = {"indicative": "ind", "subjunctive": "subj", "imperative": "imp"}
_SKIP = {"potential", "alternative", "Old-Latin"}
#: (tag prefix, sum's tag prefix) for the composed perfect passives.
_PERIPHRASTIC = {("ind", "perf"): "ind.act.pres", ("ind", "plpf"): "ind.act.impf",
                 ("ind", "futp"): "ind.act.fut", ("subj", "perf"): "subj.act.pres",
                 ("subj", "plpf"): "subj.act.impf"}


def _tense(t: set[str]) -> str:
    if "future" in t and "perfect" in t:
        return "futp"
    for word, key in (("pluperfect", "plpf"), ("perfect", "perf"), ("imperfect", "impf"),
                      ("future", "fut")):
        if word in t:
            return key
    return "pres"


def tag_of(tags: list[str]) -> str | None:
    """Our tag for a kaikki form's tag list, or None for anything not on a page."""
    t = set(tags)
    if t & _SKIP:
        return None
    voice = "pass" if "passive" in t else "act"
    if "gerund" in t or "supine" in t:
        case = next((_CASE[c] for c in _CASE if c in t), None)
        return case and f"{'ger' if 'gerund' in t else 'sup'}.{case}"
    if "participle" in t or "infinitive" in t:
        if "future" in t and "perfect" in t:
            return None                         # portātum fore — not on the page
        return f"{'ptcp' if 'participle' in t else 'inf'}.{voice}.{_tense(t)}"
    mood = next((_MOOD[m] for m in _MOOD if m in t), None)
    person = next((_PERSON[p] for p in _PERSON if p in t), None)
    number = next((_NUMBER[n] for n in _NUMBER if n in t), None)
    if not (mood and person and number):
        return None
    return f"{mood}.{voice}.{_tense(t)}.{person}{number}"


def load_entry(path: Path, infinitive: str) -> dict:
    """The verb entry whose forms include ``infinitive`` (volō "wish", not volō "fly";
    edō "eat", not ēdō "give out")."""
    for line in path.read_text(encoding="utf-8").splitlines():
        e = json.loads(line)
        if e.get("pos") == "verb" and any(f.get("form") == infinitive for f in e.get("forms", [])):
            return e
    raise LookupError(f"{path.name}: no verb entry with infinitive {infinitive}")


def parse_variants(entry: dict) -> dict[str, list[str]]:
    """Tag → every listed variant, in Wiktionary's order; '-' (no form) and '+'
    compositions skipped."""
    out: dict[str, list[str]] = {}
    for f in entry.get("forms", []):
        form = unicodedata.normalize("NFC", f.get("form", ""))
        if not form or form == "-" or "+" in form:
            continue
        tag = tag_of(f.get("tags", []))
        if tag and form not in out.setdefault(tag, []):
            out[tag].append(form)
    return out


def parse_forms(entry: dict, prefer: dict | None = None) -> dict[str, str]:
    """Tag → one form: the first variant, or the first starting with ``prefer['prefix']``
    for tags outside ``prefer['except']`` (tag prefixes). A prefix, not a substring: edō's
    ``ederēs`` contains ēs in its ending."""
    out = {}
    for tag, variants in parse_variants(entry).items():
        pick = variants[0]
        if prefer and not tag.startswith(tuple(prefer.get("except", []))):
            pick = next((v for v in variants if v.startswith(prefer["prefix"])), pick)
        out[tag] = pick
    return out


def _periphrastic(entry: dict, sum_forms: dict[str, str]) -> dict[str, str]:
    """``factus + present active indicative of sum`` → six cells, masculine."""
    out = {}
    for f in entry.get("forms", []):
        if "+" not in f.get("form", ""):
            continue
        sg = unicodedata.normalize("NFC", f["form"].split(" + ")[0])
        t = set(f.get("tags", []))
        mood = "subj" if "subjunctive" in t else "ind"
        aux = _PERIPHRASTIC.get((mood, _tense(t)))
        if aux is None:
            continue
        voice = "pass" if "passive" in t else "act"
        for i, p in enumerate(grammar.PERSONS):
            out[f"{mood}.{voice}.{_tense(t)}.{p}"] = \
                f"{sg if i < 3 else sg[:-2] + 'ī'} {sum_forms[f'{aux}.{p}']}"
    return out


def _nominative(form: str) -> str:
    """portātūrum esse → portātūrus esse; portātum esse → portātus esse."""
    word, _, aux = form.partition(" ")
    return f"{word[:-2]}us {aux}" if word.endswith("um") and aux == "esse" else form


def verb_forms(verb: dict, cache: Path) -> dict[str, str]:
    """Every imported form of ``verb`` (a ``verbs.yaml`` entry), ready for ``verb_pages``."""
    entry = load_entry(cache / f"{verb['kaikki']}.jsonl", verb["principal_parts"][1])
    forms = parse_forms(entry, verb.get("prefer"))
    forms = {t: _nominative(f) if t.startswith("inf.") else f for t, f in forms.items()}
    forms.update(_periphrastic(entry, parse_forms(load_entry(cache / "sum.jsonl", "esse"))))
    if verb.get("active_only"):
        forms = {k: v for k, v in forms.items() if ".pass." not in k}
    for tag in grammar.excluded_tags(verb):
        forms.pop(tag, None)
    return forms


#: Verb keys copied into its config: what `grammar.derive` reads, plus provenance.
_VERB_KEYS = ("lemma", "lemma_key", "conjugation", "principal_parts", "active_only",
              "semi_deponent", "prefer", "exclude")


def config_stem(lemma_key: str) -> str:
    """``latin_<verb>``. portō's deck keeps ``latin_porto``, the path its study history was
    keyed on before the paradigm grew."""
    return f"latin_{lemma_key}"


def verb_config(verb: dict, rank: int, cache: Path) -> dict:
    """One verb → one deck config, every non-empty page."""
    name = f"{verb['class_label']} — {verb['lemma']}"
    cfg = {"deck_name": name, "title": name.replace(" — ", " · "), "group": "Latin Grammar",
           "order": 600 + rank, "language": "la"}
    cfg.update({k: verb[k] for k in _VERB_KEYS if k in verb})
    entry = load_entry(cache / f"{verb['kaikki']}.jsonl", verb["principal_parts"][1])
    variants = parse_variants(entry)
    pages = grammar.verb_pages(verb_forms(verb, cache), bool(verb.get("active_only")))
    for page in pages:
        grammar.with_alternatives(page["tables"], variants)
    cfg.update({"standard": verb.get("standard", "Wheelock"),
                "source": f"Wiktionary via kaikki.org (cache/kaikki_la/{verb['kaikki']}.jsonl)",
                "pages": pages})
    return cfg


# --- nouns and pronouns -----------------------------------------------------------------

_NOMINAL_CASES = {"nominative": "nom", "genitive": "gen", "dative": "dat", "accusative": "acc",
                  "ablative": "abl", "vocative": "voc", "locative": "loc"}
_GENDER = {"masculine": "m", "feminine": "f", "neuter": "n"}
_MACRON, _BREVE = "\u0304", "\u0306"


def resolve_anceps(form: str, long: bool = False) -> str | None:
    """A vowel Wiktionary marks as either length (ō̆: macron + breve) becomes long or short
    by the lexeme's ``anceps``; a lone breve is dropped. Any other combining mark (the tie
    bar in e͡idem) makes the variant unusable: None."""
    out = []
    for ch in unicodedata.normalize("NFD", form):
        if ch == _BREVE:
            if out and out[-1] == _MACRON and not long:
                out.pop()
            continue
        if unicodedata.combining(ch) and ch != _MACRON:
            return None
        out.append(ch)
    return unicodedata.normalize("NFC", "".join(out))


def nominal_tags(tags: list[str], gendered: bool, common_singular: bool = False) -> list[str]:
    """Our tags for one kaikki row: a gendered pronoun's row may cover several genders
    (huius: feminine genitive masculine neuter singular); a row with no number is singular
    (the reflexive's, whose singular and plural are one). With ``common_singular`` the
    masculine singular is the common masc./fem. cell ``c`` and the feminine is not used."""
    t = set(tags)
    if t & _SKIP:
        return []
    case = next((_NOMINAL_CASES[c] for c in _NOMINAL_CASES if c in t), None)
    if case is None:
        return []
    number = "pl" if "plural" in t else "sg"
    if not gendered:
        return [f"{case}.{number}"]
    genders = [g for w, g in _GENDER.items() if w in t]
    if common_singular and number == "sg":
        genders = [{"m": "c"}.get(g, g) for g in genders if g != "f"]
    return [f"{case}.{number}.{g}" for g in genders]


def _nominal_entry(path: Path, kind: str) -> dict:
    wanted = ("noun",) if kind == "noun" else ("pron", "det")
    entries = [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines()]
    for pos in wanted:
        for e in entries:
            if e.get("pos") == pos and len(e.get("forms", [])) >= 5:
                return e
    raise LookupError(f"{path.name}: no {'/'.join(wanted)} entry with a declension table")


def lexeme_variants(lex: dict, cache: Path) -> dict[str, list[str]]:
    """Tag → every usable variant in Wiktionary's order, across the lexeme's entries
    (ego + nōs), with its ``choose`` / ``partitive`` applied: the chosen form first."""
    kind = lex.get("type", "noun")
    gendered = kind == "gendered"
    long = lex.get("anceps") == "long"
    out: dict[str, list[str]] = {}
    files = lex["kaikki"] if isinstance(lex["kaikki"], list) else [lex["kaikki"]]
    for name in files:
        for f in _nominal_entry(cache / f"{name}.jsonl", kind).get("forms", []):
            form = f.get("form", "")
            if not form or form == "-":
                continue
            form = resolve_anceps(form, long)
            if form is None:
                continue
            for tag in nominal_tags(f.get("tags", []), gendered, bool(lex.get("common_singular"))):
                if form not in out.setdefault(tag, []):
                    out[tag].append(form)
    for rs in lex.get("respell", []):
        for tag in rs["tags"]:
            if rs["from"] not in out.get(tag, []):
                raise LookupError(f"{lex['lemma_key']} {tag}: {rs['from']} is not among "
                                  f"Wiktionary's {out.get(tag)}")
            out[tag].insert(0, rs["to"])
    for ch in lex.get("choose", []):
        for tag in ch.get("tags", [ch.get("tag")]):
            if ch["form"] not in out.get(tag, []):
                raise LookupError(f"{lex['lemma_key']} {tag}: chosen {ch['form']} is not among "
                                  f"Wiktionary's {out.get(tag)}")
            out[tag].remove(ch["form"])
            out[tag].insert(0, ch["form"])
    if "partitive" in lex:
        form = lex["partitive"]["form"]
        if form not in out.get("gen.pl", []):
            raise LookupError(f"{lex['lemma_key']}: partitive {form} is not a Wiktionary gen.pl")
        out["gen.pl"].remove(form)
        out["genpart.pl"] = [form]
    for tag in grammar.excluded_tags(lex):
        out.pop(tag, None)
    return out


def nominal_config(deck: dict, kind: str, rank: int, cache: Path) -> dict:
    """One registry deck (nouns.yaml / pronouns.yaml) → one deck config."""
    from . import grammar_nominal as gn
    lexemes, pages = [], []
    for page in deck["pages"]:
        tables = []
        for lex in page["lexemes"]:
            lex = dict(lex)
            if kind == "noun":
                lex["label"] = gn.noun_label(lex)
            variants = lexeme_variants(lex, cache)
            forms = {tag: vs[0] for tag, vs in variants.items()}
            tables += grammar.with_alternatives(gn.lexeme_tables(lex, forms), variants)
            lexemes.append(lex)
        pg = {"key": page["key"], "label": page["label"]}
        if page.get("flow"):
            pg["flow"] = page["flow"]
        pg["tables"] = tables
        pages.append(pg)
    name = deck["name"]
    return {"deck_name": name, "title": name, "group": "Latin Grammar",
            "order": (620 if kind == "noun" else 640) + rank, "language": "la", "kind": kind,
            "standard": "Wheelock", "source": "Wiktionary via kaikki.org (cache/kaikki_la/)",
            "lexemes": lexemes, "pages": pages}


def nominal_stem(deck: dict, kind: str) -> str:
    return f"latin_{'noun' if kind == 'noun' else 'pron'}_{deck['key']}"
