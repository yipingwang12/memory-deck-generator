"""Corpus lemma counts: how often each surface form is each lemma, in context.

wordfreq gives counts of single lowercase forms without context, so a form shared by
two lemmas (*Schulen* / *schulen*, *jest*, *lata*) must be split by a guess. A
lemmatiser reads each form in its sentence. This module tags a sample of a corpus
(Leipzig Corpora Collection `*-sentences.txt`: id, sentence) and writes
(surface, lemma, count) rows. `vocab_kaikki.measured_shares` maps them to kaikki
headwords; wordfreq still gives the frequencies.

German uses spaCy (`de_core_news_md`, with the parser, to join a separable particle
to its verb: *fängt … an* → *anfangen*). Polish uses Stanza (`pl`, PDB models):
spaCy's Polish lemmatiser fails on capitalised forms and cannot tell *lata* (flies)
from *lata* (years). Both are optional dependencies, imported only to tag.

Each row also keeps the tagger's universal POS, so the mapping can tell a form that is
its own headword (*später*, an adverb; the tagger gives *spät*) from a form of another
word (*einen*, the article; the verb headword *einen* is a different POS).
"""
from __future__ import annotations

from collections import Counter
from pathlib import Path
from typing import Iterable, Iterator

_SKIP_UPOS = {"PUNCT", "SYM", "NUM", "X"}
_FORMAL_UPOS = {"PRON", "DET"}
_FORMAL_LEMMAS = {"sie": "Sie", "ihr": "Ihr"}
_STANZA_PROCESSORS = "tokenize,mwt,pos,lemma"
_BATCH = 2000


def sample_lines(path: Path, n: int, skip_chars: str = "") -> Iterator[str]:
    """About `n` sentences at an even stride through the file (the file is sorted).

    Lines that contain a character in `skip_chars` are dropped (mis-encoded text).
    """
    with path.open(encoding="utf-8") as f:
        total = sum(1 for _ in f)
    step = max(total // n, 1) if n else 1
    with path.open(encoding="utf-8") as f:
        for i, ln in enumerate(f):
            if i % step:
                continue
            text = ln.rstrip("\n").split("\t", 1)[-1]
            if text and not any(c in text for c in skip_chars):
                yield text


def _starts_clause(tok) -> bool:
    """The token starts a sentence, or follows punctuation other than a comma."""
    if tok.is_sent_start or tok.i == 0:
        return True
    prev = tok.doc[tok.i - 1]
    return prev.is_punct and prev.text != ","


def de_token_lemma(tok) -> str | None:
    """Lemma of one spaCy German token; a separable particle child joins the verb.

    Sentence-initial tokens are skipped: a question starts with its verb, and the
    tagger reads the capital as a noun ("Muss das sein?" → Muss). A token after
    punctuation other than a comma counts as initial (quoted speech: sagte: „Ich …").
    A capitalised sie/ihr inside the sentence is formal address (Sie, Ihnen, Ihr).
    """
    if (tok.is_punct or tok.is_space or tok.like_num or tok.pos_ in _SKIP_UPOS
            or _starts_clause(tok)):
        return None
    if (tok.pos_ in _FORMAL_UPOS and tok.text[:1].isupper()
            and tok.lemma_.lower() in _FORMAL_LEMMAS):
        return _FORMAL_LEMMAS[tok.lemma_.lower()]
    particle = next((c for c in tok.children if c.dep_ == "svp"), None)
    if particle is not None and tok.pos_ in ("VERB", "AUX"):
        return particle.text.lower() + tok.lemma_
    return tok.lemma_


def _pl_main_word(tok):
    """The word of a Stanza token that carries its lemma: not a contracted auxiliary."""
    return next((w for w in tok.words if w.upos != "AUX"), tok.words[0])


def pl_token_lemma(tok) -> str | None:
    """Lemma of one Stanza Polish token; a contracted auxiliary gives the main word."""
    if all(w.upos in _SKIP_UPOS for w in tok.words):
        return None
    return _pl_main_word(tok).lemma


Row = tuple[str, "str | None", str]  # surface, lemma (None = skip), universal POS


def count_tokens(rows: Iterable[Row]) -> Counter:
    """(lowercase surface, lemma, POS) → count; rows with no lemma are dropped."""
    return Counter((s.lower(), lem, pos) for s, lem, pos in rows if lem)


def _de_rows(texts: Iterable[str]) -> Iterator[Row]:
    import spacy
    nlp = spacy.load("de_core_news_md", disable=["ner"])
    for doc in nlp.pipe(texts, batch_size=256):
        for tok in doc:
            yield tok.text, de_token_lemma(tok), tok.pos_


def _batches(texts: Iterable[str], size: int) -> Iterator[list[str]]:
    batch: list[str] = []
    for t in texts:
        batch.append(t)
        if len(batch) == size:
            yield batch
            batch = []
    if batch:
        yield batch


def _pl_rows(texts: Iterable[str], model_dir: Path) -> Iterator[Row]:
    import stanza
    nlp = stanza.Pipeline("pl", processors=_STANZA_PROCESSORS, dir=str(model_dir),
                          download_method=None, tokenize_no_ssplit=True, verbose=False)
    for batch in _batches(texts, _BATCH):
        for sent in nlp("\n\n".join(batch)).sentences:
            for tok in sent.tokens:
                yield tok.text, pl_token_lemma(tok), _pl_main_word(tok).upos


def tag_corpus(
    lang: str, sentences: Path, sample: int, skip_chars: str = "",
    model_dir: Path | None = None,
) -> Counter:
    """(lowercase surface, lemma, POS) counts over a stride sample of `sentences`."""
    texts = sample_lines(sentences, sample, skip_chars)
    if lang == "de":
        return count_tokens(_de_rows(texts))
    if lang == "pl":
        if model_dir is None:
            raise ValueError("Polish tagging needs the Stanza model_dir")
        return count_tokens(_pl_rows(texts, model_dir))
    raise ValueError(f"no tagger for language {lang!r}")


def write_counts(path: Path, counts: dict[tuple[str, str, str], int]) -> None:
    """Write `surface<TAB>lemma<TAB>POS<TAB>count` rows, surfaces case-folded and merged."""
    merged: Counter = Counter()
    for (s, lem, pos), n in counts.items():
        merged[(s.lower(), lem, pos)] += n
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        for (s, lem, pos), n in sorted(merged.items()):
            f.write(f"{s}\t{lem}\t{pos}\t{n}\n")


def read_counts(path: Path) -> dict[str, dict[tuple[str, str], int]]:
    """Surface → (lemma, POS) → count, from a `write_counts` file."""
    out: dict[str, dict[tuple[str, str], int]] = {}
    with path.open(encoding="utf-8") as f:
        for ln in f:
            s, lem, pos, n = ln.rstrip("\n").split("\t")
            by = out.setdefault(s, {})
            by[(lem, pos)] = by.get((lem, pos), 0) + int(n)
    return out
