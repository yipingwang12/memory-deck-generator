"""Reign reference tables — what each digit of a monarch deck actually stands for.

A monarch deck ships digit strings and century labels and nothing else, because the digits are
the cards. That makes the deck unreadable on its own: `47965958` is the thing memorised, and
nowhere on disk says the `4` is Edward the Elder's reign ending in 924.

This module builds that explanation, as a **sidecar artifact** rather than a deck field, for the
same reason the poetry translations are one: monarch decks are frozen on re-sync in the quiz repo
(live-Wikidata drift is deliberately not committed), so a new field added to the deck JSON would
never actually land. The sidecar is a second, display-only file keyed to the deck it explains.

**Alignment is the whole contract, and a shift is invisible.** A table offset by one digit reads
as perfectly plausible history — the reader cannot catch it, since not knowing the reigns is why
the table is on screen. So the payload carries `items_sha256`, the digest of the digit strings it
was built against, exactly as `data/translations/` does; the quiz drops a table failing that
rather than showing it. `config_hash` cannot stand in — it covers config bytes only, so a
Wikidata re-fetch that inserts one ruler leaves it unchanged while moving every later digit.
"""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from pathlib import Path

from .monarchs import MonarchChunk

# Bump when the payload's shape changes in a way the quiz must notice. The quiz refuses a
# version it does not know rather than rendering fields it may be misreading.
SCHEMA_VERSION = 1


def items_digest(items: list[str]) -> str:
    """The digest a table is bound to. Same construction as the translation artifacts'."""
    return hashlib.sha256("\n".join(items).encode()).hexdigest()


def _event_row(event) -> dict:
    """One digit's row. Empty fields are omitted — most events have no correction note, and
    plenty of rulers have no recorded parents, so writing them costs bytes and reads as data."""
    row = {'digit': event.digit, 'year': event.year, 'kind': event.kind}
    m = event.monarch
    if m is not None:
        row['name'] = m.name
        row['accession'] = m.accession_year
        if m.end_year is not None:
            row['end'] = m.end_year
        for key, value in (('father', m.father), ('mother', m.mother), ('wp', m.wp_title)):
            if value:
                row[key] = value
    elif event.note:
        row['note'] = event.note
    return row


def build_reign_table(deck: str, subject: str, chunks: list[MonarchChunk],
                      digits: list[str]) -> dict:
    """The sidecar payload for one monarch deck.

    ``digits`` is the deck's own ``digits`` array — the digest is taken over that rather than
    over the freshly built chunks, so the file records which *shipped* deck it explains.

    Bound to the digits, NOT the artifact's ``items``: since the collision fix those are stable
    identities (`<deck-stem>|<century>`) that do not move when Wikidata does, so a digest over
    them would survive precisely the drift this guard exists to catch.
    """
    return {
        'schema': SCHEMA_VERSION,
        'deck': deck,
        'subject': subject,
        'source': 'wikidata',
        'items_sha256': items_digest(digits),
        'chunks': [
            {
                'label': c.label,
                'digits': c.transition_string,
                'events': [_event_row(e) for e in c.events],
            }
            for c in chunks
        ],
    }


@dataclass
class TableCheck:
    """Whether freshly fetched chunks still describe the deck as shipped."""
    ok: bool
    problems: list[str]


def check_against_deck(chunks: list[MonarchChunk], items: list[str],
                       labels: list[str]) -> TableCheck:
    """Refuse to explain a deck the fetch no longer reproduces.

    The decks are frozen; Wikidata is not. A ruler added upstream since the artifact was built
    shifts every later digit, and the resulting table would confidently mislabel them. Diverging
    here is not an error in either side — it is a report that this deck's table cannot be built
    from today's Wikidata without first re-exporting the deck (which would strand FSRS history).
    """
    problems = []
    built_items = [c.transition_string for c in chunks]
    built_labels = [c.label for c in chunks]
    if len(built_items) != len(items):
        problems.append(f"chunk count {len(built_items)} != deck's {len(items)}")
    for i, (got, want) in enumerate(zip(built_items, items)):
        if got != want:
            label = labels[i] if i < len(labels) else f"#{i}"
            problems.append(f"{label}: digits {got!r} != deck's {want!r}")
    for i, (got, want) in enumerate(zip(built_labels, labels)):
        if got != want:
            problems.append(f"label #{i}: {got!r} != deck's {want!r}")
    return TableCheck(ok=not problems, problems=problems)


def write_reign_table(payload: dict, out_dir: Path) -> Path:
    """Write ``<deck>.json``. Sorted keys + trailing newline so a re-run with unchanged data is
    a no-op in git rather than a diff of reordered fields."""
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / f"{payload['deck']}.json"
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=1, sort_keys=True) + "\n")
    return path
