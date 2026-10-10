"""Company MCQ decks — the deterministic core of the ``deck-companies`` pipeline.

A curated artifact (``source: manual``), the same curate-then-assemble contract as
``deck-papers`` and ``deck-vocab``: a research session writes ``<slug>.curated.jsonl`` +
``<slug>.audit.jsonl`` following ``configs/companies/policy.md``, and ``build`` assembles the
deck deterministically, offline.

**Why this is not ``deck-papers`` with a different config.** Three differences, each of which
changes what ``build`` must enforce:

1. **The source decays.** A paper is frozen; a company is not. ``deck-papers`` can treat its
   source text as the authority forever, because the paper will never contradict a card. Here
   the source is a dated research snapshot and the world moves underneath it — Verve was
   acquired, Arena BioWorks closed, Inari cut a third of its staff. So every audit row carries
   a ``checked`` date and :func:`stale_cards` reports cards whose verification has aged past
   the config's ``recheck_months``. Staleness is *reported*, never fixed silently — the same
   reason ``stale_corrections`` and ``find_orphan_artifacts`` report rather than act.
2. **Volatility is a property of the fact, not the card.** A company's cash balance, quarterly
   revenue, headcount and runway are knowable and wrong within two quarters. Carding them
   costs the reader a lifetime of reviews of a false statement, so ``volatility: volatile`` is
   a **failure**, not a warning: the deck refuses to ship it.
3. **There is no DOI.** The item namespace is an authored ``namespace`` string, and the source
   text is our own prose rather than third-party full text, so it is committed rather than
   gitignored and a fresh clone can always build.

The item string is ``<namespace>|<qid>``, never the stem — a stem is reworded freely, and
keying on it would strand the card's FSRS history the first time it was (the monarch-digits
trap). ``qid`` is authored, append-only, and never derived from position.

Primitives that are genuinely identical to the paper pipeline — quote normalisation, the
source digest, deterministic option shuffling, the banned-option list and the shape ratios —
are imported from :mod:`.papers` rather than copied, on the same reasoning as
:mod:`.corrections`: share the contract, not the domain logic.
"""
from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import date
from pathlib import Path

from .papers import (  # shared contract — see module docstring
    BANNED_OPTIONS,
    SHAPE_CARD_RATIO,
    SHAPE_DECK_RATIO,
    Card,
    Report,
    normalise,
    shuffled_choices,
    source_digest,
)

__all__ = [
    "Card", "Fact", "AuditRow", "Report",
    "load_curated", "load_audit", "load_facts",
    "item_string", "source_digest", "shuffled_choices",
    "uncovered_facts", "composition", "stale_cards", "shipped_qids",
    "validate", "assemble_artifact",
    "MIN_FACT_COVERAGE", "DEFAULT_RECHECK_MONTHS",
]

#: Share of extracted durable facts that must carry a card before coverage is questioned.
#: Matches the paper pipeline's threshold and exists for the same reason: an incomplete
#: extraction produces a small deck that looks fully covered.
MIN_FACT_COVERAGE = 0.75

#: How long a ``checked`` date stays fresh when the config does not say. Twelve months is
#: roughly the interval over which this file's own research went stale in three places.
DEFAULT_RECHECK_MONTHS = 12

#: Fact categories. ``durable`` ships; ``volatile`` is refused by :func:`validate`.
VOLATILITY = ("durable", "volatile")


@dataclass
class Fact:
    """One durable fact from the extraction pass, before any question exists.

    Committed because it is the **denominator for density**: a deck is not "ten cards", it is
    one card per distinct durable fact, and only the extracted list says how many the company
    had. A rich company earns a long deck and a thin one a short deck.
    """
    id: str
    fact: str
    quote: str
    category: str          # history | platform | product | funding | people | location
    volatility: str        # durable | volatile


@dataclass
class AuditRow:
    """Provenance for one card. ``quote`` must appear verbatim in the source snapshot."""
    qid: str
    quote: str
    category: str
    kind: str              # history | platform | product | funding | people | location
    volatility: str        # durable | volatile
    checked: str           # ISO date the fact was last verified against a live source
    reason: str
    decision: str          # keep | drop


def item_string(namespace: str, qid: str) -> str:
    """The card's global FSRS identity. Never the stem — see the module docstring."""
    return f"{namespace}|{qid}"


def _rows(path: Path) -> list[dict]:
    return [json.loads(ln) for ln in path.read_text(encoding="utf-8").splitlines() if ln.strip()]


def load_curated(path: Path) -> list[Card]:
    return [Card(d["qid"], d["stem"], list(d["choices"]), d["answer"], d["label"])
            for d in _rows(path)]


def load_facts(path: Path) -> list[Fact]:
    return [Fact(d["id"], d["fact"], d["quote"], d.get("category", ""),
                 d.get("volatility", "durable"))
            for d in _rows(path)]


def load_audit(path: Path) -> list[AuditRow]:
    return [AuditRow(d["qid"], d["quote"], d.get("category", ""), d.get("type", ""),
                     d.get("volatility", "durable"), d.get("checked", ""),
                     d.get("reason", ""), d["decision"])
            for d in _rows(path)]


def composition(audit: list[AuditRow]) -> dict[str, dict[str, int]]:
    """Card counts by category and by type, for the shipped cards only."""
    kept = [r for r in audit if r.decision == "keep"]
    out: dict[str, dict[str, int]] = {"category": {}, "type": {}}
    for row in kept:
        out["category"][row.category] = out["category"].get(row.category, 0) + 1
        out["type"][row.kind] = out["type"].get(row.kind, 0) + 1
    return out


def uncovered_facts(facts: list[Fact], audit: list[AuditRow]) -> list[Fact]:
    """Durable facts that no shipped card is built from.

    A fact is covered when a kept card quotes the same sentence — the link needs no extra
    field, because a card is *required* to be built from its fact's supporting quote. An
    author who quoted a different sentence for the same fact shows up here as uncovered,
    which under-reports rather than over-reports: the failure mode is a prompt to look.

    Volatile facts are excluded from the denominator. They are extracted so the research is
    complete and so a later pass can see they were considered and deliberately not carded.
    """
    quoted = {normalise(r.quote) for r in audit if r.decision == "keep"}
    return [f for f in facts
            if f.volatility == "durable" and normalise(f.quote) not in quoted]


def _months_between(earlier: date, later: date) -> int:
    return (later.year - earlier.year) * 12 + (later.month - earlier.month)


def stale_cards(audit: list[AuditRow], recheck_months: int,
                today: date | None = None) -> list[tuple[str, str, int]]:
    """Shipped cards whose ``checked`` date has aged past ``recheck_months``.

    Returns ``(qid, checked, months_old)``. A malformed or absent date counts as stale rather
    than fresh: an unparseable date is exactly the case where nobody knows when the fact was
    last true, which is the condition this check exists to surface.

    This is the company pipeline's substitute for an oracle. ``deck-papers`` can verify a
    quote against a frozen paper forever; here a verbatim quote only proves the card matches
    the *snapshot*, so the snapshot's age is the honest measure of how much the quote is
    still worth.
    """
    today = today or date.today()
    out: list[tuple[str, str, int]] = []
    for row in audit:
        if row.decision != "keep":
            continue
        try:
            checked = date.fromisoformat(row.checked)
        except (TypeError, ValueError):
            out.append((row.qid, row.checked or "(none)", -1))
            continue
        age = _months_between(checked, today)
        if age >= recheck_months:
            out.append((row.qid, row.checked, age))
    return out


def shipped_qids(artifact_path: Path, namespace: str) -> tuple[str, ...]:
    """The qids of an already-built artifact, for the disappeared-card check. Missing or
    malformed → empty, so a first build is not a warning."""
    try:
        items = json.loads(artifact_path.read_text(encoding="utf-8"))["items"]
    except (OSError, ValueError, KeyError):
        return ()
    prefix = f"{namespace}|"
    return tuple(i[len(prefix):] for i in items if i.startswith(prefix))


def validate(cards: list[Card], audit: list[AuditRow], source: str, n_choices: int,
             shipped: tuple[str, ...] = (), facts: list[Fact] | None = None,
             recheck_months: int = DEFAULT_RECHECK_MONTHS,
             today: date | None = None) -> Report:
    """Every check ``build`` fails closed on, plus the warnings it surfaces.

    Failures are defects in the data; warnings are things only a human can adjudicate.
    Nothing is fixed silently.
    """
    failures: list[str] = []
    warnings: list[str] = []
    src = normalise(source)
    qids = [c.qid for c in cards]

    # 1. identity — a duplicate qid is two cards sharing one FSRS key
    dupes = {q for q in qids if qids.count(q) > 1}
    if dupes:
        failures.append(f"duplicate qid in curated: {sorted(dupes)}")

    # 2. every quote verbatim in the snapshot. Weaker than the paper check by construction:
    #    it proves the card matches what was researched, not that it is still true. The
    #    `checked` dates in 6 are what carry the second half of that claim.
    for row in audit:
        if normalise(row.quote) not in src:
            failures.append(f"{row.qid}: quote not found verbatim in source snapshot")

    # 3. volatility — a FAILURE, not a warning. A card asserting a cash balance or a headcount
    #    is a card that will be false before its third review, and the reader has no way to
    #    know. Extract volatile facts; never ship them.
    for row in audit:
        if row.volatility not in VOLATILITY:
            failures.append(f"{row.qid}: unknown volatility {row.volatility!r}")
        elif row.volatility == "volatile" and row.decision == "keep":
            failures.append(f"{row.qid}: volatile fact shipped as a card — "
                            f"volatile facts belong in the dossier, not the deck")

    # 4. per-card structure
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

    # 5. curated and audit describe the same cards
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

    # 6. staleness — the company-specific check, and the reason this pipeline exists
    stale = stale_cards(audit, recheck_months, today)
    if stale:
        warnings.append(
            f"{len(stale)} card(s) past the {recheck_months}-month recheck window: "
            + ", ".join(f"{q} (checked {d}, {m}mo)" if m >= 0 else f"{q} (checked {d})"
                        for q, d, m in stale[:8]))

    # 7. shape — an answer pickable on length is pickable without knowing the company
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

    # 8. authoring tell — every answer at one index biases the pass, though the quiz
    #    reshuffles at display
    if len(cards) > 3:
        idx = [c.choices.index(c.answer) for c in cards if c.answer in c.choices]
        if idx and len(set(idx)) == 1:
            warnings.append(f"every answer sits at choice index {idx[0]} in the curated file")

    # 9. a card that shipped and is now gone strands its history
    gone = sorted(set(shipped) - set(qids))
    if gone:
        warnings.append(f"previously shipped qids no longer in curated (stranded FSRS "
                        f"history): {gone}")

    # 10. density — measured against the extracted durable facts, never a fixed range
    if facts:
        durable = [f for f in facts if f.volatility == "durable"]
        if durable:
            missing_facts = uncovered_facts(facts, audit)
            covered = len(durable) - len(missing_facts)
            if covered / len(durable) < MIN_FACT_COVERAGE:
                warnings.append(
                    f"only {covered}/{len(durable)} durable facts carry a card "
                    f"({covered / len(durable):.0%}) — uncovered: "
                    f"{[f.id for f in missing_facts][:8]}")
            elif missing_facts:
                warnings.append(f"durable facts with no card: {[f.id for f in missing_facts]}")

    return Report(failures, warnings)


def assemble_artifact(cards: list[Card], cfg: dict, config_path: str,
                      source_sha256: str, checked_range: tuple[str, str] | None = None) -> dict:
    """The exact envelope the quiz's ``deck_loader`` reads for a ``text-mc`` deck.

    ``deck_type`` is ``company`` rather than ``paper``; the quiz dispatches on ``mode``, so
    both load through ``load_papers_deck`` and the shared ``mc_routes`` loop. ``group`` is
    deliberately **not** ``Papers`` — that string is ``study.json``'s ``priority_collection``
    and its ``group_new_per_day`` budget key, so reusing it would silently enrol this deck in
    the daily gate, throttle every other deck to half, and put it behind the blue launcher.
    """
    namespace = cfg["namespace"]
    artifact = {
        "order": cfg.get("order", 500),
        "name": cfg["deck_name"],
        "deck_type": "company",
        "mode": "text-mc",
        "title": cfg.get("title", cfg["deck_name"]),
        "group": cfg.get("group", "Companies"),
        "items": [item_string(namespace, c.qid) for c in cards],
        "labels": [c.label for c in cards],
        "stems": [c.stem for c in cards],
        "answers": [c.answer for c in cards],
        "choices": [shuffled_choices(c) for c in cards],
        "poem_title": None,
        "config_path": config_path,
        "source": "manual",
        "namespace": namespace,
        "citation": cfg.get("citation", ""),
        # Which snapshot the quotes were verified against, and how old the underlying
        # verification is. Unlike a paper's source text this file is committed, but the
        # digest still records which revision of it the cards were checked against.
        "source_sha256": source_sha256,
        "recheck_months": cfg.get("recheck_months", DEFAULT_RECHECK_MONTHS),
    }
    if checked_range:
        artifact["checked_from"], artifact["checked_to"] = checked_range
    return artifact
