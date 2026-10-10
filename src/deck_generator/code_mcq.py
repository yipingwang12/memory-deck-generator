"""Source-file MCQ decks — ``deck-code-mcq``, the code sibling of ``deck-papers``.

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
import hashlib
import json
import random
import re
from dataclasses import dataclass
from pathlib import Path, PurePosixPath

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

    report.failures += ste_refusals(cards)

    if source:
        defined = {s.name for s in defined_symbols(source)}
        missing = sorted(defined - covered_symbols(audit, source))
        if missing:
            report.failures.append(
                f"functions with no card: {missing} — every function in the file carries "
                f"one, or the deck is a reading of the interesting parts")
    return report


#: ASD-STE100 caps a descriptive sentence at 25 words (procedural at 20).
STE_WORD_LIMIT = 25
_SENTENCE_END = re.compile(r"(?<=[.!?])\s+")


def ste_word_count(sentence: str) -> int:
    """Words in a sentence, a `backticked` code span counting as one."""
    return len(re.sub(r"`[^`]*`", "X", sentence).split())


def ste_refusals(cards: list[Card]) -> list[str]:
    """Stems and choices are ASD-STE100: no sentence over the word cap."""
    out = []
    for c in cards:
        for field, texts in (("stem", [c.stem]), ("choice", c.choices)):
            for t in texts:
                if any(ste_word_count(s) > STE_WORD_LIMIT for s in _SENTENCE_END.split(t)):
                    out.append(f"{c.qid}: {field} sentence over {STE_WORD_LIMIT} words (STE)")
    return out


def file_sha256(source: str) -> str:
    """Raw sha256 of the file text — the hash code-drill's AI notes record."""
    return hashlib.sha256(source.encode("utf-8")).hexdigest()


def _notes_sha(notes_dir: Path, file_id: str) -> str | None:
    for p in sorted(notes_dir.glob("code_ai_explanation_*.json")):
        art = json.loads(p.read_text(encoding="utf-8"))
        if art.get("source_id") == file_id:
            return art.get("source_sha256")
    return None


def currency_refusals(file_id: str, reviewed: str | None, notes_dir: Path,
                      source: str) -> list[str]:
    """MCQs follow AI notes, and follow every change to the file.

    ``reviewed`` is the file version every card was last checked against; it must be the
    version the AI notes cover and, when the source is at hand, the file as it is now.
    """
    out = []
    current = file_sha256(source) if source else None
    if not reviewed:
        out.append("reviewed_sha256 missing: review every card against the file, then set it "
                   "to the file's sha256")
    elif current and reviewed != current:
        out.append(f"file changed since the cards were reviewed ({reviewed[:12]}… → "
                   f"{current[:12]}…): review every card — drop obsolete, add for changes — "
                   f"then set reviewed_sha256")
    notes = _notes_sha(notes_dir, file_id)
    if notes is None:
        out.append(f"no AI notes for {file_id}: MCQs follow notes (code-drill export first)")
    elif notes != (current or reviewed):
        out.append(f"AI notes for {file_id} cover another version of the file: update and "
                   f"export them first")
    return out


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
        "deck_type": "code-mcq",
        "mode": "text-mc",
        "title": cfg.get("title", cfg["deck_name"]),
        "group": cfg.get("group", "Code MCQ"),
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


#: Executable source in the work repos. Mirrors code-drill's `scope.py` (EXECUTABLE,
#: TEST_DIRS, `is_test`) — the two repos share no package, so keep them in step.
EXECUTABLE = frozenset({".py", ".R", ".r", ".sh", ".bash"})
TEST_DIRS = frozenset({"tests", "test", "testthat", "testing"})


def scope_refusal(path: str) -> str | None:
    """Why ``path`` may not carry a deck — tests, docs, data, tooling — or None."""
    p = PurePosixPath(path)
    stem = p.stem.lower()
    if p.suffix not in EXECUTABLE:
        return f"{path}: not executable source ({p.suffix or 'no suffix'})"
    if any(part.startswith(".") for part in p.parts[:-1]):
        return f"{path}: tooling directory"
    if (p.name == "conftest.py" or stem == "test" or stem.startswith(("test_", "test-"))
            or stem.endswith(("_test", "_tests")) or any(x in TEST_DIRS for x in p.parts[:-1])):
        return f"{path}: test code"
    return None
