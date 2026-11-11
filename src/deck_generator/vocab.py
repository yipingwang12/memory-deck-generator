"""Chinese vocab deck — frequency-ranked expansion of the hand-authored matching deck.

Pipeline (see docs/design/vocab-pipeline.md):
  seed (existing 267, frozen)  +  wordfreq top-N  ⋈  CC-CEDICT  →  router  →  curated rows.

The *router* is deterministic: it splits candidates into `clean` (single reading, few
senses — CC-CEDICT's first gloss is trustworthy) and `needs_llm` (polyphone, multi-sense,
or function-word — where first-sense is unreliable, per the prototype: 被→"quilt", 更→gēng).
Only `needs_llm` rows go to the audited LLM adjudication in ``vocab_llm`` — everything here
runs offline with no API key.

The deck stays ``source: manual`` (protected from the full-export clear and the orchestrator
sync); this module is a deliberate curation tool, not a ``deck-export`` builder.

CC-CEDICT is CC-BY-SA 4.0 — attribution + share-alike required on the artifact.
"""
from __future__ import annotations

import json
import re
import urllib.request
from dataclasses import dataclass, field
from pathlib import Path

from wordfreq import top_n_list

_ROOT = Path(__file__).resolve().parents[2]
CEDICT_CACHE = _ROOT / "cache" / "cedict_ts.u8"
CEDICT_URL = "https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz"
CEDICT_LICENSE = "CC-BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/)"

# --- pinyin: CC-CEDICT numbered tones -> diacritics -----------------------------
_VOWELS = {"a": "āáǎà", "e": "ēéěè", "i": "īíǐì", "o": "ōóǒò", "u": "ūúǔù", "ü": "ǖǘǚǜ"}


def _tone_syllable(syl: str) -> str:
    m = re.match(r"^([a-zü:]+?)([1-5])$", syl.lower().replace("u:", "ü"))
    if not m:
        return syl
    body, tone = m.group(1), int(m.group(2))
    if tone == 5:
        return body
    if "a" in body:
        i = body.index("a")
    elif "e" in body:
        i = body.index("e")
    elif "ou" in body:
        i = body.index("o")
    else:
        vs = [j for j, c in enumerate(body) if c in "aeiouü"]
        if not vs:
            return body
        i = vs[-1]
    return body[:i] + _VOWELS[body[i]][tone - 1] + body[i + 1:]


def pinyin_marks(numbered: str) -> str:
    """`ni3 hao3` -> `nǐ hǎo`."""
    return " ".join(_tone_syllable(s) for s in numbered.split())


# --- CC-CEDICT ------------------------------------------------------------------
_LINE = re.compile(r"^(\S+) (\S+) \[([^\]]*)\] /(.*)/\s*$")


def fetch_cedict(dest: Path = CEDICT_CACHE) -> Path:
    """Download + gunzip CC-CEDICT into the cache if absent. Returns the cache path."""
    if dest.exists():
        return dest
    import gzip

    dest.parent.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(CEDICT_URL) as r:  # noqa: S310 — fixed trusted host
        data = gzip.decompress(r.read())
    dest.write_bytes(data)
    return dest


def load_cedict(path: Path = CEDICT_CACHE) -> dict[str, list[tuple[str, list[str]]]]:
    """simplified hanzi -> [(numbered_pinyin, [glosses]), ...] (one entry per reading)."""
    out: dict[str, list[tuple[str, list[str]]]] = {}
    for ln in path.read_text(encoding="utf-8").splitlines():
        if ln.startswith("#"):
            continue
        m = _LINE.match(ln)
        if not m:
            continue
        simp, pin, glosses = m.group(2), m.group(3), [g for g in m.group(4).split("/") if g]
        out.setdefault(simp, []).append((pin, glosses))
    return out


# --- rows -----------------------------------------------------------------------
@dataclass
class Reading:
    pinyin_numbered: str
    pinyin: str
    glosses: list[str]


@dataclass
class Candidate:
    hanzi: str
    freq_rank: int
    readings: list[Reading]
    polyphone: bool
    multisense: bool
    functional: bool

    @property
    def needs_llm(self) -> bool:
        return self.polyphone or self.multisense or self.functional


@dataclass
class CuratedRow:
    """One deck row: an FSRS-keyed word with its display hint, gloss and provenance.

    The hint is the line below the word: pinyin for Chinese, article + plural or
    aspect partner for German and Polish.
    """
    word: str
    hint: str
    gloss: str
    source: str  # "seed" | "cedict-first" | "kaikki-first" | "kaikki-unreviewed" | "llm"


# Function/grammatical gloss signals — CC-CEDICT's first sense is unreliable for these
# (the raw-join failures: 被 "quilt", 把 "to hold", 吗 "what?").
_FUNCTION_SIGNALS = (
    "particle", "classifier", "measure word", "used ", "prefix", "suffix",
    "auxiliary", "preposition", "conjunction", "pronoun", "grammatical",
    "(coll.)", "interjection",
)


def _looks_functional(glosses: list[str]) -> bool:
    joined = " ".join(glosses).lower()
    return any(sig in joined for sig in _FUNCTION_SIGNALS)


def _is_han(w: str) -> bool:
    return bool(w) and all("一" <= c <= "鿿" for c in w)


def load_seed(deck_path: Path) -> list[CuratedRow]:
    """Existing deck's rows, frozen verbatim (hanzi byte-identical → FSRS keys survive)."""
    d = json.loads(deck_path.read_text(encoding="utf-8"))
    return [
        CuratedRow(h, p, g, "seed")
        for h, p, g in zip(d["items"], d.get("pinyin") or d["hints"], d["labels"])
    ]


def rank_candidates(
    cedict: dict[str, list[tuple[str, list[str]]]],
    exclude: set[str],
    target_n: int,
) -> list[Candidate]:
    """wordfreq-ranked hanzi words in CC-CEDICT, minus `exclude`, capped at `target_n`."""
    out: list[Candidate] = []
    for rank, w in enumerate(top_n_list("zh", max(target_n * 3, 10000))):
        if w in exclude or not _is_han(w) or w not in cedict:
            continue
        readings = [Reading(p, pinyin_marks(p), gl) for p, gl in cedict[w]]
        all_glosses = [g for r in readings for g in r.glosses]
        out.append(
            Candidate(
                hanzi=w,
                freq_rank=rank,
                readings=readings,
                polyphone=len({r.pinyin_numbered for r in readings}) > 1,
                multisense=len(all_glosses) > 3,
                functional=_looks_functional(all_glosses),
            )
        )
        if len(out) >= target_n:
            break
    return out


def clean_row(c: Candidate) -> CuratedRow:
    """First-sense row for a `clean` candidate (single reading, ≤3 glosses). Not for needs_llm."""
    r = c.readings[0]
    gloss = re.sub(r"\s*\([^)]*\)", "", r.glosses[0]).split(";")[0].strip()
    return CuratedRow(c.hanzi, r.pinyin, gloss, "cedict-first")


def llm_batch_records(candidates: list[Candidate]) -> list[dict]:
    """Input records for the audited LLM pass — all senses, so it picks the frequent one."""
    return [
        {
            "hanzi": c.hanzi,
            "freq_rank": c.freq_rank,
            "readings": [
                {"pinyin": r.pinyin, "glosses": r.glosses} for r in c.readings
            ],
        }
        for c in candidates
        if c.needs_llm
    ]


FREQ_BAND_SIZE = 30  # mirrors memory-quiz-app matching.FREQ_BAND_SIZE (band-scoped uniqueness)


def load_curated(path: Path) -> list[CuratedRow]:
    """Committed curated rows — the deterministic `build` source of truth.

    Chinese rows use the keys `hanzi`/`pinyin`; other languages use `word`/`hint`.
    """
    rows = []
    for ln in path.read_text(encoding="utf-8").splitlines():
        if ln.strip():
            d = json.loads(ln)
            word = d["word"] if "word" in d else d["hanzi"]
            hint = d["hint"] if "hint" in d else d["pinyin"]
            rows.append(CuratedRow(word, hint, d["gloss"], d.get("source", "curated")))
    return rows


def band_collisions(rows: list[CuratedRow], window: int = FREQ_BAND_SIZE) -> list[tuple]:
    """Same-gloss pairs within `window` positions — the ambiguous-round surface. Empty = ok."""
    out = []
    for i, r in enumerate(rows):
        g = r.gloss.strip().lower()
        for j in range(max(0, i - window + 1), i):
            if rows[j].gloss.strip().lower() == g:
                out.append((rows[j].word, r.word, r.gloss))
                break
    return out


# --- artifact assembly ----------------------------------------------------------
def assemble_artifact(
    rows: list[CuratedRow], cfg: dict, config_path: str, config_hash: str,
) -> dict:
    """The exact envelope the quiz `deck_loader` reads for a vocab/matching deck.

    Keeps `source: manual`. The config can pin `config_path` (the quiz session key) and
    `license`, so a rebuild keeps the identity of the shipped artifact. Chinese keeps the
    hint array under `pinyin`; other languages put it under `hints`.

    Other languages also split identity from display: the quiz keys a card on its item
    string alone, so German "ich" (I) and Polish "ich" (their) would be one card. Their
    `items` are `<artifact stem>|<word>` and `words` is what the board shows. Chinese
    items stay the bare hanzi, which is what its review history is keyed on.
    """
    lang = cfg.get("lang", "zh")
    hint_key = "pinyin" if lang == "zh" else "hints"
    art = {
        "order": cfg.get("order", 300),
        "name": cfg["deck_name"],
        "deck_type": "vocab",
        "mode": "matching",
        "title": cfg.get("title", cfg["deck_name"]),
        "group": cfg.get("group", "Vocabulary"),
        "items": [r.word for r in rows],
        hint_key: [r.hint for r in rows],
        "labels": [r.gloss for r in rows],
        "poem_title": None,
        "config_path": cfg.get("config_path", config_path),
        "config_hash": config_hash,
        "source": "manual",
        "license": cfg.get("license", CEDICT_LICENSE),
    }
    if lang != "zh":
        stem = Path(cfg["artifact"]).stem
        art["items"] = [f"{stem}|{r.word}" for r in rows]
        art["words"] = [r.word for r in rows]
        art["lang"] = lang
    return art
