"""Grammar-table decks: one verb paradigm → one quiz ``grammar-table`` artifact.

**One form = one card.** The item is a tag identity (``la:porto|ind.act.impf.3sg``), never the
form, so fixing a macron re-displays a card instead of stranding its history. Forms are shown
in tense tables of six (persons × numbers) and the quiz corrupts cells independently.

**The oracle is the paradigm itself.** Every authored form is re-derived from conjugation
rules and the build refuses on any disagreement — two sources, so a typo in the config cannot
ship as the "correct" form a reader is then marked wrong against.

**Wrong forms come from the same paradigm**, because those are what a learner confuses: the
same tense in another person, the same person in another tense, and a vowel of the ending at
the wrong length. Letter swaps would test spelling, not grammar.
"""
from __future__ import annotations

import os
import unicodedata
from dataclasses import dataclass, field

PERSONS = ("1sg", "2sg", "3sg", "1pl", "2pl", "3pl")
PERSON_LABELS = {"1sg": "1st sg.", "2sg": "2nd sg.", "3sg": "3rd sg.",
                 "1pl": "1st pl.", "2pl": "2nd pl.", "3pl": "3rd pl."}

# First conjugation, indicative active. Present-system endings attach to the present stem
# (infinitive minus -re, e.g. portā-) except where the stem vowel is absorbed or shortened,
# which is why those three are written against the root instead.
_PRESENT_SYSTEM = {
    "pres": [("root", "ō"), ("stem", "s"), ("root", "at"),
             ("stem", "mus"), ("stem", "tis"), ("root", "ant")],
    "impf": [("stem", e) for e in ("bam", "bās", "bat", "bāmus", "bātis", "bant")],
    "fut": [("stem", e) for e in ("bō", "bis", "bit", "bimus", "bitis", "bunt")],
}
_PERFECT_SYSTEM = {
    "perf": ("ī", "istī", "it", "imus", "istis", "ērunt"),
    "plpf": ("eram", "erās", "erat", "erāmus", "erātis", "erant"),
    "futp": ("erō", "eris", "erit", "erimus", "eritis", "erint"),
}

_LENGTH = {"a": "ā", "e": "ē", "i": "ī", "o": "ō", "u": "ū"}
_LENGTH.update({v: k for k, v in list(_LENGTH.items())})


def _nfc(s: str) -> str:
    return unicodedata.normalize("NFC", s)


def derive_first_conjugation(infinitive: str, perfect: str) -> dict[str, list[str]]:
    """Indicative active of a first-conjugation verb from its 2nd and 3rd principal parts."""
    infinitive, perfect = _nfc(infinitive), _nfc(perfect)
    if not infinitive.endswith("āre") or not perfect.endswith("ī"):
        raise ValueError(f"not first conjugation: {infinitive}, {perfect}")
    stem, root, pstem = infinitive[:-2], infinitive[:-3], perfect[:-1]
    base = {"stem": stem, "root": root}
    out = {k: [base[b] + e for b, e in cells] for k, cells in _PRESENT_SYSTEM.items()}
    out.update({k: [pstem + e for e in ends] for k, ends in _PERFECT_SYSTEM.items()})
    return out


@dataclass(frozen=True)
class Paradigm:
    """Tense tables in order; ``forms`` is every cell, table by table, in PERSONS order."""
    tenses: tuple[str, ...]
    forms: tuple[str, ...]
    root: str

    @classmethod
    def from_forms(cls, tables: dict[str, list[str]]) -> Paradigm:
        forms = tuple(_nfc(f) for fs in tables.values() for f in fs)
        return cls(tuple(tables), forms, os.path.commonprefix(list(forms)))

    def index(self, tense: str, person: str) -> int:
        return self.tenses.index(tense) * len(PERSONS) + PERSONS.index(person)


def _length_flips(form: str, root: str) -> list[str]:
    """Each vowel after the root at the opposite length — one flip per candidate."""
    return [form[:i] + _LENGTH[c] + form[i + 1:]
            for i, c in enumerate(form) if i >= len(root) and c in _LENGTH]


def wrong_pool(paradigm: Paradigm, i: int) -> list[str]:
    """Plausible wrong forms for cell ``i``: other persons of its tense, its person in other
    tenses, and its ending's vowels at the wrong length. Never the cell's own form."""
    n = len(PERSONS)
    t, p = divmod(i, n)
    correct = paradigm.forms[i]
    candidates = ([paradigm.forms[t * n + q] for q in range(n) if q != p]
                  + [paradigm.forms[u * n + p] for u in range(len(paradigm.tenses)) if u != t]
                  + _length_flips(correct, paradigm.root))
    return list(dict.fromkeys(c for c in candidates if c != correct))


@dataclass
class Report:
    failures: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return not self.failures


def _paradigm(cfg: dict) -> Paradigm:
    return Paradigm.from_forms({t["key"]: t["forms"] for t in cfg["tables"]})


def validate(cfg: dict) -> Report:
    """Every structural check plus authored-vs-rules agreement; failures block a build."""
    r = Report()
    keys = [t["key"] for t in cfg["tables"]]
    if len(set(keys)) != len(keys):
        r.failures.append(f"duplicate table keys: {keys}")
    for t in cfg["tables"]:
        if len(t["forms"]) != len(PERSONS):
            r.failures.append(f"{t['key']}: {len(t['forms'])} forms, need {len(PERSONS)}")
        for f in t["forms"]:
            if not unicodedata.is_normalized("NFC", f):
                r.failures.append(f"{t['key']}: {f!r} is not NFC")
    if r.failures:
        return r

    if cfg.get("conjugation") == 1:
        _, inf, perf, *_ = cfg["principal_parts"]
        rules = derive_first_conjugation(inf, perf)
        for t in cfg["tables"]:
            if t["key"] not in rules:
                r.failures.append(f"{t['key']}: no rule to check it against")
                continue
            for person, authored, derived in zip(PERSONS, t["forms"], rules[t["key"]]):
                if authored != derived:
                    r.failures.append(f"{t['key']} {person}: authored {authored}, "
                                      f"rules give {derived}")
    else:
        r.warnings.append(f"conjugation {cfg.get('conjugation')!r} has no rules; "
                          "authored forms are unchecked")

    p = _paradigm(cfg)
    for i in range(len(p.forms)):
        if not wrong_pool(p, i):
            r.failures.append(f"cell {i} ({p.forms[i]}) has no wrong forms")
    return r


def item_string(cfg: dict, tense: str, person: str) -> str:
    return f"{cfg['language']}:{cfg['lemma_key']}|{cfg['mood']}.{cfg['voice']}.{tense}.{person}"


def assemble_artifact(cfg: dict, config_path: str) -> dict:
    """The envelope the quiz's ``deck_loader`` reads for a ``grammar-table`` deck."""
    p = _paradigm(cfg)
    n = len(PERSONS)
    return {
        "order": cfg.get("order", 600),
        "name": cfg["deck_name"],
        "deck_type": "grammar",
        "mode": "grammar-table",
        "title": cfg.get("title", cfg["deck_name"]),
        "group": cfg.get("group", "Latin Grammar"),
        "language": cfg["language"],
        "lemma": cfg["lemma"],
        "items": [item_string(cfg, t["key"], q) for t in cfg["tables"] for q in PERSONS],
        "labels": [f"{t['label']} · {PERSON_LABELS[q]}" for t in cfg["tables"] for q in PERSONS],
        "forms": list(p.forms),
        "pools": [wrong_pool(p, i) for i in range(len(p.forms))],
        "tables": [{"key": t["key"], "label": t["label"],
                    "cells": list(range(k * n, (k + 1) * n))}
                   for k, t in enumerate(cfg["tables"])],
        "persons": ["1st", "2nd", "3rd"],
        "numbers": ["singular", "plural"],
        "poem_title": None,
        "config_path": config_path,
        "source": "manual",
        "standard": cfg.get("standard", ""),
    }
