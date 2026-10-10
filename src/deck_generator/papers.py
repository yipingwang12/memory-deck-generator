"""Paper MCQ decks — the deterministic core of the ``deck-papers`` pipeline.

A curated artifact (``source: manual``), the same contract as ``deck-vocab``: an LLM session
reads the paper and writes ``<slug>.curated.jsonl`` + ``<slug>.audit.jsonl`` following
``configs/papers/policy.md``; ``build`` assembles the deck deterministically, offline.

**There is no oracle.** Wikidata, CC-CEDICT, sympy and MTD can each be re-queried to check a
deck they produced; nothing can re-derive a question. The paper is the only authority, so
every card carries the verbatim sentence supporting it and :func:`validate` refuses a deck
whose quotes are not found in the extracted source text.

The item string is ``<doi>|<qid>``, never the stem — a stem is reworded freely, and keying on
it would strand the card's FSRS history the first time it was (the monarch-digits trap).
``qid`` is therefore authored, append-only, and never derived from position.
"""
from __future__ import annotations

import hashlib
import json
import random
import re
import unicodedata
from dataclasses import dataclass
from pathlib import Path

# Options that make a card answerable without knowing the material, or that collapse four
# choices into fewer. Matched case-insensitively as substrings.
BANNED_OPTIONS = (
    "all of the above", "none of the above", "all of these", "none of these",
    "both a and b", "both of the above",
)

# Shape guards. A deck whose answers systematically run longer than its distractors is
# pickable on length alone — the artwork answer-shape lesson, applied to prose.
SHAPE_DECK_RATIO = 1.15   # mean answer length / mean distractor length, deck-wide
SHAPE_CARD_RATIO = 1.6    # any single card

#: Share of cards that may come from outside Results before the composition warning fires.
#: A results deck earns some Methods cards — a stated rationale is worth knowing — but a
#: third of the deck explaining the engineering means the pass drifted off the findings.
MAX_NON_RESULTS_SHARE = 0.34
#: Share of extracted findings that must carry a card before coverage is questioned. Not
#: 1.0: some findings are genuinely untestable, and a drop with a recorded reason is a
#: legitimate outcome of the authoring pass.
MIN_CLAIM_COVERAGE = 0.75


@dataclass
class Card:
    """One multiple-choice card. ``qid`` is identity; everything else is display."""
    qid: str
    stem: str
    choices: list[str]
    answer: str
    label: str


@dataclass
class AuditRow:
    """Provenance for one card. ``quote`` must appear verbatim in the paper."""
    qid: str
    quote: str
    section: str
    kind: str          # finding | comparison | quantity | design | limitation
    reason: str
    decision: str      # keep | drop


@dataclass
class Claim:
    """One finding from the extraction pass, before any question exists.

    Committed because it is the **denominator for density**: a deck is not "15 to 30 cards",
    it is one card per distinct finding, and only the extracted list says how many findings
    the paper had. Without it, a deck that quietly covered half the paper looks identical to
    one that covered all of it.
    """
    id: str
    claim: str
    quote: str
    section: str


@dataclass
class Report:
    failures: list[str]
    warnings: list[str]

    @property
    def ok(self) -> bool:
        return not self.failures


def normalise(text: str) -> str:
    """Fold a quote and the source text onto common ground before matching.

    A PDF extractor breaks lines mid-sentence and emits typographic quotes, en/em dashes and
    the Unicode minus; an author copying a sentence out picks up whichever the viewer showed.
    Matching raw would fail on punctuation the reader cannot even see, so both sides are
    normalised — but only in ways that cannot change *which* sentence matches.
    """
    text = unicodedata.normalize("NFKC", text)
    for a, b in (("’", "'"), ("‘", "'"), ("“", '"'), ("”", '"'),
                 ("–", "-"), ("—", "-"), ("−", "-")):
        text = text.replace(a, b)
    return re.sub(r"\s+", " ", text).strip()


def item_string(doi: str, qid: str) -> str:
    """The card's global FSRS identity. Never the stem — see the module docstring."""
    return f"{doi}|{qid}"


def source_digest(text: str) -> str:
    """sha256 over the NORMALISED source, so a re-extraction that only reflows whitespace
    does not read as a different paper — the same tolerance :func:`validate` matches with."""
    return hashlib.sha256(normalise(text).encode("utf-8")).hexdigest()


def _rows(path: Path) -> list[dict]:
    return [json.loads(ln) for ln in path.read_text(encoding="utf-8").splitlines() if ln.strip()]


def load_curated(path: Path) -> list[Card]:
    return [Card(d["qid"], d["stem"], list(d["choices"]), d["answer"], d["label"])
            for d in _rows(path)]


def load_claims(path: Path) -> list[Claim]:
    return [Claim(d["id"], d["claim"], d["quote"], d.get("section", "")) for d in _rows(path)]


def composition(audit: list[AuditRow]) -> dict[str, dict[str, int]]:
    """Card counts by section and by type, for the shipped cards only."""
    kept = [r for r in audit if r.decision == "keep"]
    out: dict[str, dict[str, int]] = {"section": {}, "type": {}}
    for row in kept:
        out["section"][row.section] = out["section"].get(row.section, 0) + 1
        out["type"][row.kind] = out["type"].get(row.kind, 0) + 1
    return out


def uncovered_claims(claims: list[Claim], audit: list[AuditRow]) -> list[Claim]:
    """Findings that no shipped card is built from.

    A claim is covered when a kept card quotes the same sentence — the link needs no extra
    field because a card is *required* to be built from its claim's supporting quote. An
    author who quoted a different sentence for the same finding will show up here as
    uncovered, which under-reports rather than over-reports: the failure mode is a prompt to
    look, not a silent pass.
    """
    quoted = {normalise(r.quote) for r in audit if r.decision == "keep"}
    return [c for c in claims if normalise(c.quote) not in quoted]


def load_audit(path: Path) -> list[AuditRow]:
    return [AuditRow(d["qid"], d["quote"], d.get("section", ""), d.get("type", ""),
                     d.get("reason", ""), d["decision"])
            for d in _rows(path)]


def validate(cards: list[Card], audit: list[AuditRow], source: str, n_choices: int,
             shipped_qids: tuple[str, ...] = (), verify_quotes: bool = True,
             claims: list[Claim] | None = None,
             primary_section: str | None = "results") -> Report:
    """Every check ``build`` fails closed on, plus the warnings it surfaces.

    Failures are defects in the data; warnings are things only a human can adjudicate (a
    shape tell, a card that stopped shipping). Nothing here is fixed silently — the same
    reason ``stale_corrections`` and ``find_orphan_artifacts`` report rather than act.

    ``verify_quotes=False`` skips only the source check, for a clone where the gitignored
    paper text is absent. The audit rows are still required and still checked against the
    curated set — dropping them entirely would report every card as unattested.
    """
    failures: list[str] = []
    warnings: list[str] = []
    src = normalise(source)
    qids = [c.qid for c in cards]

    # 1. identity — a duplicate qid is two cards sharing one FSRS key
    dupes = {q for q in qids if qids.count(q) > 1}
    if dupes:
        failures.append(f"duplicate qid in curated: {sorted(dupes)}")

    # 2. every quote verbatim in the source — the substitute for an oracle
    if verify_quotes:
        for row in audit:
            if normalise(row.quote) not in src:
                failures.append(f"{row.qid}: quote not found verbatim in source text")
    else:
        warnings.append("QUOTES NOT VERIFIED — source text unavailable")

    # 3. per-card structure
    for c in cards:
        if c.answer not in c.choices:
            failures.append(f"{c.qid}: answer is not one of the choices")
        if len(c.choices) != n_choices:
            failures.append(f"{c.qid}: {len(c.choices)} choices, expected {n_choices}")
        if len(set(c.choices)) != len(c.choices):
            failures.append(f"{c.qid}: duplicate option")
        for opt in c.choices:
            low = opt.lower()
            if any(b in low for b in BANNED_OPTIONS):
                failures.append(f"{c.qid}: banned option {opt!r}")

    # 4. curated and audit describe the same cards
    keep = {r.qid for r in audit if r.decision == "keep"}
    drop = {r.qid for r in audit if r.decision == "drop"}
    if keep != set(qids):
        missing, extra = sorted(keep - set(qids)), sorted(set(qids) - keep)
        if missing:
            failures.append(f"audit keeps qids absent from curated: {missing}")
        if extra:
            failures.append(f"curated has qids with no audit row: {extra}")
    if drop & set(qids):
        failures.append(f"dropped qid present in curated: {sorted(drop & set(qids))}")

    # 5. shape — an answer pickable on length is pickable without the paper
    ratios = []
    for c in cards:
        others = [o for o in c.choices if o != c.answer]
        if not others:
            continue
        ratio = len(c.answer) / max(sum(len(o) for o in others) / len(others), 1)
        ratios.append(ratio)
        if ratio > SHAPE_CARD_RATIO:
            warnings.append(f"{c.qid}: answer runs {ratio:.2f}x its distractors")
    if ratios and sum(ratios) / len(ratios) > SHAPE_DECK_RATIO:
        warnings.append(f"answers average {sum(ratios)/len(ratios):.2f}x distractor length "
                        f"deck-wide (longest-is-correct tell)")

    # 6. authoring tell — every answer at the same index means the author never varied it.
    #    Harmless at runtime (the quiz reshuffles per view) but it biases review.
    if len(cards) > 3:
        idx = [c.choices.index(c.answer) for c in cards if c.answer in c.choices]
        if idx and len(set(idx)) == 1:
            warnings.append(f"every answer sits at choice index {idx[0]} in the curated file")

    # 7. a card that shipped and is now gone strands its history
    gone = sorted(set(shipped_qids) - set(qids))
    if gone:
        warnings.append(f"previously shipped qids no longer in curated (stranded FSRS "
                        f"history): {gone}")

    # 8. density — measured against the paper's own findings, never a fixed range. A long
    #    paper earns more cards and a thin one fewer; what matters is that the extraction
    #    was exhaustive and the cards cover it. Total intake is paced by study.json's
    #    shared collection budget, so a large deck is a longer introduction, not a flood.
    if claims:
        missing = uncovered_claims(claims, audit)
        covered = len(claims) - len(missing)
        if covered / len(claims) < MIN_CLAIM_COVERAGE:
            warnings.append(
                f"only {covered}/{len(claims)} extracted findings carry a card "
                f"({covered / len(claims):.0%}) — uncovered: "
                f"{[c.id for c in missing][:8]}")
        elif missing:
            warnings.append(f"findings with no card: {[c.id for c in missing]}")

    # 9. composition — a results deck that is mostly Methods has drifted off the findings.
    #    `primary_section=None` for decks with no single home section (code decks, where
    #    every section is first-class and coverage is measured per function instead).
    if primary_section:
        counts = composition(audit)["section"]
        total = sum(counts.values())
        non_primary = total - counts.get(primary_section, 0)
        if total and non_primary / total > MAX_NON_RESULTS_SHARE:
            warnings.append(f"{non_primary}/{total} cards are from outside "
                            f"{primary_section.title()} ({non_primary / total:.0%}) — {counts}")

    return Report(failures, warnings)


def shuffled_choices(card: Card) -> list[str]:
    """Options in a deterministic per-card order, seeded by ``qid``.

    The quiz reshuffles again at display, so this does not affect what the reader sees; it
    keeps the artifact from carrying the authoring order, in which the answer is usually
    first. Seeded by ``qid`` so a rebuild is byte-identical.
    """
    options = list(card.choices)
    random.Random(card.qid).shuffle(options)
    return options


def shipped_qids(artifact_path: Path, doi: str) -> tuple[str, ...]:
    """The qids of an already-built artifact, for the disappeared-card check. Missing or
    malformed → empty, so a first build is not a warning."""
    try:
        items = json.loads(artifact_path.read_text(encoding="utf-8"))["items"]
    except (OSError, ValueError, KeyError):
        return ()
    prefix = f"{doi}|"
    return tuple(i[len(prefix):] for i in items if i.startswith(prefix))


def assemble_artifact(cards: list[Card], cfg: dict, config_path: str,
                      source_sha256: str) -> dict:
    """The exact envelope the quiz's ``deck_loader`` reads for a ``text-mc`` deck.

    ``stems`` rather than artworks' ``prompts``: there the field selects one of two fixed
    templates, here it *is* the question. ``config_hash`` is stamped by the caller (sha256 of
    the curated rows), matching ``deck_export.config_hash``.
    """
    doi = cfg["doi"]
    return {
        "order": cfg.get("order", 400),
        "name": cfg["deck_name"],
        "deck_type": "paper",
        "mode": "text-mc",
        "title": cfg.get("title", cfg["deck_name"]),
        "group": cfg.get("group", "Papers"),
        "items": [item_string(doi, c.qid) for c in cards],
        "labels": [c.label for c in cards],
        "stems": [c.stem for c in cards],
        "answers": [c.answer for c in cards],
        "choices": [shuffled_choices(c) for c in cards],
        "poem_title": None,
        "config_path": config_path,
        "source": "manual",
        "doi": doi,
        "pmid": cfg.get("pmid"),
        "citation": cfg.get("citation", ""),
        # Which extraction the quotes were verified against. The source text itself is
        # gitignored (third-party full text), so without this nothing committed records it.
        "source_sha256": source_sha256,
    }
