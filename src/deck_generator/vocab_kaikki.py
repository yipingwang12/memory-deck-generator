"""Inflected-language vocab decks (German, Polish) from Wiktionary via kaikki.org.

Pipeline (see docs/design/vocab-pipeline.md, "Inflected languages"):
  wordfreq surface forms  →  lemmas (kaikki form index)  →  summed lemma frequency
  →  router  →  clean rows (first gloss)  +  needs-LLM chunks  →  merge  →  curated rows.

Chinese has one written form per word, so wordfreq ranks words directly. German and Polish
inflect: wordfreq counts "roku" and "rok" apart. This module maps each surface form to
its lemmas and adds the frequencies, then routes each lemma like the Chinese router does.
A form with several lemmas ("lat" → lata, lato) gives each lemma an equal share.

Everything here runs offline from the kaikki cache. Wiktionary text is CC-BY-SA 4.0.
"""
from __future__ import annotations

import gzip
import json
import re
import shutil
import urllib.request
from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable, Iterable

from wordfreq import word_frequency

from .vocab import CuratedRow

_ROOT = Path(__file__).resolve().parents[2]
KAIKKI_LICENSE = (
    "CC-BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/) — Wiktionary via kaikki.org"
)
# Bump when the parse changes, so a stale derived lexicon cache is not used.
_LEXICON_VERSION = 6


@dataclass(frozen=True)
class LangSpec:
    """One kaikki language: wordfreq code + kaikki name."""
    code: str
    name: str

    @property
    def kaikki_url(self) -> str:
        return (f"https://kaikki.org/dictionary/{self.name}/"
                f"kaikki.org-dictionary-{self.name}.jsonl.gz")

    @property
    def cache_path(self) -> Path:
        return _ROOT / "cache" / f"kaikki_{self.code}" / f"kaikki.org-dictionary-{self.name}.jsonl.gz"


LANGS = {"de": LangSpec("de", "German"), "pl": LangSpec("pl", "Polish")}

KEEP_POS = {
    "noun", "verb", "adj", "adv", "pron", "det", "article", "prep", "postp", "conj",
    "particle", "num", "intj", "contraction",
}
# Parts of speech whose citation form claims its own surface in the frequency split:
# no inflection table (or, for numerals, a citation form far more frequent than any
# noun homograph — "vier" vs the noun "Vier").
CLAIM_POS = {"prep", "postp", "conj", "particle", "adv", "intj", "num"}
FUNCTION_POS = {"pron", "det", "article", "prep", "postp", "conj", "particle", "intj", "contraction"}
_POS_ABBR = {
    "noun": "noun", "verb": "v.", "adj": "adj.", "adv": "adv.", "pron": "pron.", "det": "det.",
    "article": "art.", "prep": "prep.", "postp": "postp.", "conj": "conj.", "particle": "part.",
    "num": "num.", "intj": "interj.", "contraction": "contr.",
}
_META_FORM_TAGS = {"table-tags", "inflection-template", "class", "auxiliary"}
# Senses with these tags are not the modern frequent use ("Middle" = Middle Polish).
_DROP_SENSE_TAGS = {"obsolete", "archaic", "dated", "dialectal", "Middle", "Old", "historical"}
_GENDERS = {"masculine": "m", "feminine": "f", "neuter": "n"}
_DE_ARTICLE = {"m": "der", "f": "die", "n": "das"}
_MAX_SENSES = 12
_WORD = re.compile(r"[^\W\d_]+(?:-[^\W\d_]+)*")


def fetch_kaikki(spec: LangSpec) -> Path:
    """Download the language's kaikki extract into the cache if absent. Returns its path."""
    dest = spec.cache_path
    if dest.exists():
        return dest
    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_suffix(".part")
    with urllib.request.urlopen(spec.kaikki_url) as r, tmp.open("wb") as f:  # noqa: S310
        shutil.copyfileobj(r, f)
    tmp.rename(dest)
    return dest


# --- lexicon --------------------------------------------------------------------
@dataclass
class Lexicon:
    """Lemma data + a surface-form index, limited to the wanted surface forms.

    `parts`: lemma word → one dict per part of speech
    (`pos`, `glosses`, `gender`, `plural`, `plural_only`, `aspect`, `partner`).
    `forms`: lowercase surface form → lemma words it can be a form of.
    """
    parts: dict[str, list[dict]]
    forms: dict[str, list[str]]

    def lemmas_for(self, surface: str) -> list[str]:
        """Sorted lemma words that `surface` can be a form of (itself included)."""
        return sorted({w for w in self.forms.get(surface.lower(), ()) if w in self.parts})


_EQUIVALENT = re.compile(r"^(?:female|male) equivalent of ")


def _is_equivalent(sense: dict) -> bool:
    """A "female equivalent of pan" sense: Wiktionary files it as form-of, but pani is a
    word of its own, not an inflection of pan."""
    return bool(sense.get("glosses")) and bool(_EQUIVALENT.match(sense["glosses"][0]))


def _lemma_senses(senses: list[dict]) -> list[dict]:
    """Senses that define the word itself: no form-of/alt-of, no archaic tag."""
    own = [s for s in senses
           if s.get("glosses") and (_is_equivalent(s) or (
               not ({"form-of", "alt-of"} & set(s.get("tags") or ()))
               and not s.get("form_of") and not s.get("alt_of")))]
    return [s for s in own if not (_DROP_SENSE_TAGS & set(s.get("tags") or ()))]


def _new_part(entry: dict, senses: list[dict]) -> dict:
    """Compact part-of-speech record for one kaikki lemma entry."""
    tags = set(senses[0].get("tags") or ())
    gender = next((g for t, g in _GENDERS.items() if t in tags), None)
    aspect = "impf" if "imperfective" in tags else "pf" if "perfective" in tags else None
    plural = partner = None
    for f in entry.get("forms") or ():
        if "source" in f:
            continue
        ftags = set(f.get("tags") or ())
        if ftags == {"plural"} and plural is None:
            plural = f["form"]
        if aspect == "impf" and ftags == {"perfective"} and partner is None:
            partner = f["form"]
        if aspect == "pf" and ftags == {"imperfective"} and partner is None:
            partner = f["form"]
    plural_only = gender is None and "plural" in tags and "singular" not in tags
    return {"pos": entry["pos"], "glosses": [], "gender": gender, "plural": plural,
            "plural_only": plural_only, "aspect": aspect, "partner": partner}


def _merge_part(parts: list[dict], new: dict, senses: list[dict]) -> None:
    """Add `senses` to the part with the same POS, or append `new` as a fresh part."""
    part = next((p for p in parts if p["pos"] == new["pos"]), None)
    if part is None:
        parts.append(new)
        part = new
    else:
        for k in ("gender", "plural", "plural_only", "aspect", "partner"):
            part[k] = part[k] or new[k]
    for s in senses:
        g = " › ".join(s["glosses"])
        if g not in part["glosses"] and len(part["glosses"]) < _MAX_SENSES:
            part["glosses"].append(g)


def _form_pairs(entry: dict) -> Iterable[tuple[str, str]]:
    """(surface form, lemma) pairs one entry contributes to the form index.

    Single-token inflection-table forms of a lemma, and form-of/alt-of targets of a form
    entry. Head forms without a `source` (aspect partners, diminutives) are other words.
    Split forms ("fängt an", "der andere", "robi się") are skipped: crediting "fängt" to
    anfangen gives every particle verb its base verb's frequency (sieben → durchsieben).
    """
    word = entry["word"]
    for s in entry.get("senses") or ():
        if _is_equivalent(s):
            continue
        for ref in (s.get("form_of") or []) + (s.get("alt_of") or []):
            if ref.get("word"):
                yield word, ref["word"]
    for f in entry.get("forms") or ():
        if "source" not in f or _META_FORM_TAGS & set(f.get("tags") or ()):
            continue
        form = f["form"]
        if not form.startswith("-") and " " not in form:
            yield form, word


def _iter_entries(path: Path) -> Iterable[dict]:
    opener = gzip.open if path.suffix == ".gz" else open
    with opener(path, "rt", encoding="utf-8") as f:
        for ln in f:
            yield json.loads(ln)


def load_lexicon(path: Path, wanted: set[str]) -> Lexicon:
    """Parse a kaikki extract. Keep forms whose lowercase is in `wanted`, and their lemmas."""
    all_parts: dict[str, list[dict]] = {}
    forms: dict[str, set[str]] = defaultdict(set)
    for e in _iter_entries(path):
        word, pos = e.get("word"), e.get("pos")
        if not word or " " in word:
            continue
        for form, lemma in _form_pairs(e):
            if form.lower() in wanted:
                forms[form.lower()].add(lemma)
        if pos not in KEEP_POS:
            continue
        senses = _lemma_senses(e.get("senses") or [])
        if not senses:
            continue
        _merge_part(all_parts.setdefault(word, []), _new_part(e, senses), senses)
        if word.lower() in wanted:
            forms[word.lower()].add(word)
    reachable = {w for ws in forms.values() for w in ws if w in all_parts}
    return Lexicon(
        parts={w: all_parts[w] for w in sorted(reachable)},
        forms={f: sorted(ws & reachable) for f, ws in sorted(forms.items()) if ws & reachable},
    )


def cached_lexicon(spec: LangSpec, wanted: set[str], surface_n: int) -> Lexicon:
    """`load_lexicon` with a derived JSON cache beside the extract (a full parse takes minutes)."""
    cache = spec.cache_path.parent / f"lexicon_n{surface_n}_v{_LEXICON_VERSION}.json"
    if cache.exists():
        d = json.loads(cache.read_text(encoding="utf-8"))
        return Lexicon(d["parts"], d["forms"])
    lex = load_lexicon(fetch_kaikki(spec), wanted)
    cache.write_text(json.dumps({"parts": lex.parts, "forms": lex.forms}, ensure_ascii=False),
                     encoding="utf-8")
    return lex


# --- capitalisation -------------------------------------------------------------
def case_shares(
    words_file: Path, non_noun_forms: set[str], min_count: int = 5,
) -> dict[str, float]:
    """Lowercase form → share of its uses that are capitalised as a noun.

    `words_file` is a case-preserving word list (Leipzig Corpora Collection
    `*-words.txt`: id, word, count). wordfreq lowercases, so German loses the capital
    that marks a noun: *Schulen* (schools) and *schulen* (to train) become one form.
    A capital also starts every sentence, so the raw capital rate is corrected by the
    baseline rate of `non_noun_forms` (forms that can be no noun): share =
    (raw − baseline) / (1 − baseline), clamped to [0, 1]. ALL-CAPS tokens are ignored.
    """
    cap: dict[str, int] = defaultdict(int)
    total: dict[str, int] = defaultdict(int)
    with words_file.open(encoding="utf-8") as f:
        for ln in f:
            parts = ln.rstrip("\n").split("\t")
            if len(parts) < 3 or not parts[1] or (parts[1].isupper() and len(parts[1]) > 1):
                continue
            w, n = parts[1], int(parts[2])
            total[w.lower()] += n
            if w[0].isupper():
                cap[w.lower()] += n
    base_cap = sum(cap[w] for w in non_noun_forms if w in total)
    base_total = sum(total[w] for w in non_noun_forms if w in total)
    base = base_cap / base_total if base_total else 0.0
    return {w: min(max((cap[w] / n - base) / (1 - base), 0.0), 1.0)
            for w, n in total.items() if n >= min_count}


# --- hint -----------------------------------------------------------------------
def make_hint(spec: LangSpec, part: dict) -> str:
    """The line shown below the word: article + plural (de noun), gender (pl noun),
    plural-only mark, aspect + partner (pl verb), else a part-of-speech abbreviation."""
    pos, g = part["pos"], part.get("gender")
    if pos == "noun" and part.get("plural_only"):
        return "die (pl.)" if spec.code == "de" else "pl. only"
    if pos == "noun" and g and spec.code == "de":
        art = _DE_ARTICLE[g]
        return f"{art}, pl. {part['plural']}" if part.get("plural") else art
    if pos == "noun" and g and spec.code == "pl":
        return f"{g}."
    if pos == "verb" and part.get("aspect"):
        a = f"{part['aspect']}."
        return f"{a} ↔ {part['partner']}" if part.get("partner") else a
    return _POS_ABBR.get(pos, pos)


# --- ranking + router -----------------------------------------------------------
@dataclass
class Candidate:
    """A ranked lemma with every part of speech the deck could show for it."""
    word: str
    freq_rank: int
    score: float
    parts: list[dict]  # [{pos, hint, glosses}]
    shared: float = 0.0  # fraction of score held as a minority share of shared forms
    evidence: list[dict] = field(default_factory=list)  # top shared forms
    case_twin: bool = False  # another lemma differs only by capitals (Essen/essen)
    noun_collision: list[str] = field(default_factory=list)  # nouns whose forms it borrows

    @property
    def shared_evidence(self) -> bool:
        return self.shared > _SHARED_LIMIT

    @property
    def functional(self) -> bool:
        return any(p["pos"] in FUNCTION_POS for p in self.parts)

    @property
    def multipos(self) -> bool:
        return len(self.parts) > 1

    @property
    def multisense(self) -> bool:
        return sum(len(p["glosses"]) for p in self.parts) > 3

    @property
    def aspect_pair(self) -> bool:
        return any("↔" in p["hint"] for p in self.parts)

    @property
    def needs_llm(self) -> bool:
        # An aspect pair shares one English gloss, so the LLM must tag it to keep the
        # pair apart in a matching round.
        return (self.functional or self.multipos or self.multisense or self.aspect_pair
                or self.shared_evidence or self.case_twin or bool(self.noun_collision))


_SPLIT_ROUNDS = 3
_MAX_EVIDENCE = 5
# A lemma that earns more than this fraction of its score as a minority share (≤ half) of
# forms it shares with other lemmas may rank only by coincidence ("einen" = to unite,
# from the article's forms).
_SHARED_LIMIT = 0.5


def _split_frequencies(
    forms: list[tuple[list[str], float]], claims: list[list[bool]],
) -> list[list[float]]:
    """Each lemma's share of each form's frequency; a lemma's score is the sum of its shares.

    Round 0 splits a shared form evenly. Each later round splits it in proportion to
    what each lemma earns from its OTHER forms: "lat" goes to lato (latem, …) rather than
    splitting evenly with lata, when only lato has other evidence.

    `claims[i][j]` marks lemma j as the indeclinable citation of form i. Such a lemma has
    no other forms by nature, so it takes the full surface frequency as its evidence:
    "od" (from) keeps "od", which the rare noun oda also lists as its genitive plural.
    """
    shares = [[f / len(ls)] * len(ls) for ls, f in forms]
    for _ in range(_SPLIT_ROUNDS):
        score: dict[str, float] = defaultdict(float)
        for (ls, _f), sh in zip(forms, shares):
            for w, x in zip(ls, sh):
                score[w] += x
        new = []
        for (ls, f), sh, own in zip(forms, shares, claims):
            other = [f if o else max(score[w] - x, 0.0) for w, x, o in zip(ls, sh, own)]
            total = sum(other)
            new.append([f * o / total for o in other] if total else [f / len(ls)] * len(ls))
        shares = new
    return shares


# Parts of speech that seldom start a German sentence (verb-second order), so a capital
# on their form is a noun, not a sentence start, once the baseline is subtracted.
_RARELY_INITIAL_POS = {"verb", "adj", "num"}


def _rarely_initial(lex: Lexicon, w: str) -> bool:
    return all(p["pos"] in _RARELY_INITIAL_POS for p in lex.parts[w])


def _is_noun(lex: Lexicon, w: str) -> bool:
    return w[:1].isupper() and any(p["pos"] == "noun" for p in lex.parts[w])


def _is_verb(lex: Lexicon, w: str) -> bool:
    return w[:1].islower() and any(p["pos"] == "verb" for p in lex.parts[w])


def _case_split_forms(
    lex: Lexicon, spec: LangSpec, surfaces: Iterable[str],
    freq: Callable[[str, str], float], shares: dict[str, float],
) -> tuple[list[tuple[str, list[str], float]], dict[int, dict[str, set[str]]]]:
    """Forms for the frequency split, mixed-case forms divided by `shares`.

    Returns the forms and, per form index without case data, the lowercase verbs that
    share it with capitalised nouns (→ those nouns).
    """
    forms: list[tuple[str, list[str], float]] = []
    uncased: dict[int, dict[str, set[str]]] = {}
    for s in surfaces:
        if not _WORD.fullmatch(s):
            continue
        ls = lex.lemmas_for(s)
        if not ls:
            continue
        f = freq(s, spec.code)
        cap = [w for w in ls if w[:1].isupper()]
        low = [w for w in ls if not w[:1].isupper()]
        if cap and low and s in shares and all(_rarely_initial(lex, w) for w in low):
            p = shares[s]
            forms += [(s, cap, f * p), (s, low, f * (1 - p))]
            continue
        nouns = {w for w in cap if _is_noun(lex, w)}
        verbs = [w for w in low if _is_verb(lex, w)]
        if nouns and verbs:
            uncased[len(forms)] = {v: nouns for v in verbs}
        forms.append((s, ls, f))
    return forms, uncased


def rank_lemmas(
    lex: Lexicon,
    spec: LangSpec,
    surfaces: Iterable[str],
    target_n: int,
    freq: Callable[[str, str], float] = word_frequency,
    exclude: Iterable[str] = (),
    case_shares: dict[str, float] | None = None,
) -> list[Candidate]:
    """Lemmas ranked by summed surface-form frequency, minus `exclude`, capped at `target_n`.

    With `case_shares`, a form whose lemmas mix capitalised nouns and lowercase words is
    split first: the capitalised share goes to the capitalised lemmas, the rest to the
    others — only when the lowercase lemmas are verbs, adjectives or numerals. A function
    word, adverb or interjection starts sentences far above the baseline ("Aber …"), so
    its capitals say nothing about a noun twin. Without case data for such a form, a lowercase verb that earns most of its
    score from it is flagged `noun_collision` for the LLM to check.
    """
    forms, uncased = _case_split_forms(lex, spec, surfaces, freq, case_shares or {})
    claims = [[w.lower() == s and any(p["pos"] in CLAIM_POS for p in lex.parts[w])
               for w in ls] for s, ls, _f in forms]
    shares = _split_frequencies([(ls, f) for _s, ls, f in forms], claims)
    score: dict[str, float] = defaultdict(float)
    shared: dict[str, float] = defaultdict(float)
    collided: dict[str, float] = defaultdict(float)
    partners: dict[str, set[str]] = defaultdict(set)
    evidence: dict[str, list[tuple[float, dict]]] = defaultdict(list)
    for i, ((s, ls, f), sh) in enumerate(zip(forms, shares)):
        for w, x in zip(ls, sh):
            score[w] += x
            if w in uncased.get(i, {}):
                collided[w] += x
                partners[w] |= uncased[i][w]
            if len(ls) > 1 and f and x / f <= 0.5:
                shared[w] += x
                also = [v for v in ls if v != w]
                evidence[w].append((x, {"form": s, "share": round(x / f, 2) if f else 0.0,
                                        "also": also}))
    lower_count: dict[str, int] = defaultdict(int)
    for w in score:
        lower_count[w.lower()] += 1
    skip = set(exclude)
    ranked = [w for w in sorted(score, key=lambda w: (-score[w], w))
              if w not in skip and score[w] > 0]
    out = []
    for rank, w in enumerate(ranked[:target_n]):
        parts = [{"pos": p["pos"], "hint": make_hint(spec, p), "glosses": p["glosses"]}
                 for p in lex.parts[w]]
        top = [e for _x, e in sorted(evidence[w], key=lambda t: -t[0])[:_MAX_EVIDENCE]]
        nc = sorted(partners[w]) if collided[w] / score[w] > _SHARED_LIMIT else []
        out.append(Candidate(w, rank, round(score[w], 12), parts,
                             round(shared[w] / score[w], 3), top,
                             lower_count[w.lower()] > 1, nc))
    return out


def clean_row(c: Candidate) -> CuratedRow:
    """First-sense row for a clean candidate (one POS, ≤3 senses). Not for needs_llm."""
    p = c.parts[0]
    first = p["glosses"][0].split(" › ")[0]
    first = re.sub(r"\s*\[[^\]]*\]", "", first)
    gloss = re.sub(r"\s*\([^)]*\)", "", first).split(";")[0].strip().rstrip(":").strip()
    gloss = ", ".join(g.strip() for g in gloss.split(",") if g.strip())
    gloss = ", ".join(gloss.split(", ")[:2])
    return CuratedRow(c.word, p["hint"], gloss, "kaikki-first")


def llm_record(c: Candidate) -> dict:
    """Input record for the audited LLM pass — every POS and sense, so it picks the frequent one."""
    rec = {"word": c.word, "freq_rank": c.freq_rank, "parts": c.parts}
    if c.evidence:
        rec["evidence"] = c.evidence
    if c.case_twin:
        rec["case_twin"] = True
    if c.noun_collision:
        rec["noun_collision"] = c.noun_collision
    return rec


# --- merge ----------------------------------------------------------------------
def merge_curated(
    cands: list[Candidate], adjudicated: list[dict],
) -> tuple[list[CuratedRow], list[dict]]:
    """Clean rows + adjudicated rows in rank order → (curated rows, audit rows).

    Every needs-LLM candidate must have an adjudicated row. A clean candidate may have one
    too (a review pass that corrects a misleading first gloss); it then wins. A row for a
    word outside the candidates (a re-rank moved it past `target_n`) is set aside for
    when the deck grows. `decision: drop` rows go to the audit only.
    """
    by_word = {d["word"]: d for d in adjudicated}
    need = {c.word for c in cands if c.needs_llm}
    missing = sorted(need - set(by_word))
    if missing:
        raise ValueError(f"missing adjudication for {len(missing)} words: {missing[:10]}")
    rows, audit = [], []
    for c in cands:
        if c.word not in by_word:
            rows.append(clean_row(c))
            continue
        d = by_word[c.word]
        audit.append(d)
        if d["decision"] != "drop":
            rows.append(CuratedRow(c.word, d["hint"], d["gloss"], "llm"))
    return rows, audit


def row_record(r: CuratedRow) -> dict:
    """Curated JSONL record for a non-Chinese row."""
    return {"word": r.word, "hint": r.hint, "gloss": r.gloss, "source": r.source}


def write_jsonl(path: Path, records: Iterable[dict]) -> None:
    path.write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in records),
                    encoding="utf-8")


def read_jsonl(path: Path) -> list[dict]:
    return [json.loads(ln) for ln in path.read_text(encoding="utf-8").splitlines() if ln.strip()]
