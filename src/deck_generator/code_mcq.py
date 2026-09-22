"""Source-file MCQ decks — ``deck-code``, the code sibling of ``deck-papers``.

One **source file** is one deck, the way one paper is one deck. Reading unfamiliar code for
comprehension is slow and open-ended; a card set turns it into a finite, reviewable thing —
what each function is for, what a dense expression evaluates to, which constant governs
what, and how the parts fit together.

Everything structural is shared with :mod:`papers`: the curated/audit/claims triple, the
no-oracle discipline (**every card quotes the source verbatim** and :func:`validate` refuses
a deck whose quotes are not in the file), the shape guards, and ``qid`` as append-only
identity. Three things differ:

* **Namespace.** The item string is ``<source_id>|<qid>`` where ``source_id`` is
  ``<repo>:<path>`` — a file has no DOI, and a path alone would collide across repos.
* **Sections.** A paper has a home section (Results) and drifting out of it is a smell. A
  file does not: its structure, its functions, its expressions and its integration points
  are all first-class, so the Results-share check is switched off and replaced by —
* **Function coverage.** Every function and method defined in the file must carry at least
  one card. This is the check that makes the deck a reading of the *file* rather than of
  its interesting parts, and it is derived from the source by :func:`defined_symbols`,
  not from anything the author asserts.

**The cards quote work-repo source**, so a code deck's data and artifact are governed like
code-drill's artifacts: gitignored, never committed, never deployed. This module holds no
data — only the machinery.
"""
from __future__ import annotations

import ast
import json
import random
from dataclasses import dataclass
from pathlib import Path

from .papers import (  # noqa: F401 — re-exported so a caller needs one import
    AuditRow,
    Card,
    Claim,
    Report,
    composition,
    load_audit,
    load_claims,
    load_curated,
    normalise,
    source_digest,
    uncovered_claims,
    validate as validate_shared,
)

#: Where a card's material comes from. Unlike a paper's sections these carry no priority —
#: a deck of nothing but `expression` cards is as wrong as a deck with none.
SECTIONS = ("structure", "function", "expression", "variable", "integration")

#: What the card asks. `gotcha` is the code-specific one: a syntactic or semantic subtlety
#: that reads as something else (a `break` that ends a table, a closure over the loop
#: variable, an unused-looking import that is really a re-export).
TYPES = ("purpose", "contract", "semantics", "integration", "gotcha")


@dataclass
class Symbol:
    """A function or method defined in the file, with the line it starts on."""
    name: str
    lineno: int


def defined_symbols(source: str) -> list[Symbol]:
    """Every function and method the file defines, outermost first.

    Nested helpers count — they are exactly the kind of thing that goes unread (the
    closure inside a parsing loop), and one is often the hardest card in the deck.
    """
    try:
        tree = ast.parse(source)
    except SyntaxError:
        return []
    out: list[Symbol] = []
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            out.append(Symbol(node.name, node.lineno))
    return sorted(out, key=lambda s: s.lineno)


def covered_symbols(audit: list[AuditRow], source: str) -> set[str]:
    """Symbols whose body a shipped card quotes from.

    Derived from where the quote *lands* rather than from a field the author fills in: a
    card that claims to be about `read_spec_triplets` while quoting a constant is not a
    card about that function, and an author-asserted label would hide that.
    """
    lines = source.splitlines()
    spans = _symbol_spans(source)
    covered: set[str] = set()
    for row in audit:
        if row.decision != "keep":
            continue
        # Matched line by line: a quote spanning a `def` and the statement under it is one
        # quote but never appears inside any single line, so whole-quote matching silently
        # reported the function as uncovered.
        for part in (normalise(p) for p in row.quote.splitlines()):
            if not part:
                continue
            for i, line in enumerate(lines, start=1):
                if part in normalise(line):
                    covered.update(name for name, (a, b) in spans.items() if a <= i <= b)
    return covered


def _symbol_spans(source: str) -> dict[str, tuple[int, int]]:
    try:
        tree = ast.parse(source)
    except SyntaxError:
        return {}
    return {
        node.name: (node.lineno, node.end_lineno or node.lineno)
        for node in ast.walk(tree)
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))
    }


def validate(cards: list[Card], audit: list[AuditRow], source: str, n_choices: int,
             shipped_qids: tuple[str, ...] = (), verify_quotes: bool = True,
             claims: list[Claim] | None = None) -> Report:
    """The shared checks, plus function coverage and the code section vocabulary."""
    report = validate_shared(cards, audit, source, n_choices, shipped_qids,
                             verify_quotes=verify_quotes, claims=claims,
                             primary_section=None)

    for row in audit:
        if row.section and row.section not in SECTIONS:
            report.failures.append(f"{row.qid}: unknown section {row.section!r} "
                                   f"(want one of {', '.join(SECTIONS)})")
        if row.kind and row.kind not in TYPES:
            report.failures.append(f"{row.qid}: unknown type {row.kind!r} "
                                   f"(want one of {', '.join(TYPES)})")

    if source:
        defined = {s.name for s in defined_symbols(source)}
        missing = sorted(defined - covered_symbols(audit, source))
        if missing:
            report.failures.append(
                f"functions with no card: {missing} — every function in the file carries "
                f"one, or the deck is a reading of the interesting parts")
    return report


def item_string(source_id: str, qid: str) -> str:
    return f"{source_id}|{qid}"


def shuffled_choices(card: Card) -> list[str]:
    options = list(card.choices)
    random.Random(card.qid).shuffle(options)
    return options


def shipped_qids(artifact_path: Path, source_id: str) -> tuple[str, ...]:
    try:
        items = json.loads(artifact_path.read_text(encoding="utf-8"))["items"]
    except (OSError, ValueError, KeyError):
        return ()
    prefix = f"{source_id}|"
    return tuple(i[len(prefix):] for i in items if i.startswith(prefix))


def assemble_artifact(cards: list[Card], cfg: dict, config_path: str,
                      source_sha256: str) -> dict:
    """The ``text-mc`` envelope the quiz already reads for papers.

    Deliberately the same mode: the quiz routes on ``mode``, so a code deck plays through
    the existing single-choice loop with no change to that app. ``citation`` carries the
    repo, path and commit instead of a journal reference — it is what the reveal shows,
    and for code the useful provenance is *which* version of the file this is.
    """
    source_id = cfg["source_id"]
    return {
        "order": cfg.get("order", 450),
        "name": cfg["deck_name"],
        "deck_type": "code",
        "mode": "text-mc",
        "title": cfg.get("title", cfg["deck_name"]),
        "group": cfg.get("group", "Code"),
        "items": [item_string(source_id, c.qid) for c in cards],
        "labels": [c.label for c in cards],
        "stems": [c.stem for c in cards],
        "answers": [c.answer for c in cards],
        "choices": [shuffled_choices(c) for c in cards],
        "poem_title": None,
        "config_path": config_path,
        "source": "manual",
        "source_id": source_id,
        "repo": cfg.get("repo", ""),
        "path": cfg.get("path", ""),
        "commit": cfg.get("commit", ""),
        "citation": cfg.get("citation", ""),
        "source_sha256": source_sha256,
    }
