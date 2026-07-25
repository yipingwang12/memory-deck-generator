"""Shared discipline for sourced manual overrides of upstream data.

Several pipelines patch Wikidata: monarch transition years (see ``monarchs.py``) and artwork
creators (see ``artworks.py``). *What* they patch differs completely — a monarch correction
adds or drops a scalar year in an unkeyed multiset; an artwork correction rewrites a named
field on a QID-keyed record — so there is no shared ``Correction`` type. What they do share is
the contract, and that contract is the part worth keeping in one place:

1. **Provenance is mandatory.** Every correction records *why* upstream is wrong and *what* was
   checked, so a later reader can re-verify it rather than trust it.
2. **Validation raises, never skips.** A correction that silently fails to apply is
   indistinguishable in the output from one that was never written.
3. **Corrections go stale.** A correction is a bet that upstream stays wrong, and upstream
   improves. Each pipeline defines its own staleness predicate, but every pipeline must have
   one, or entries rot invisibly. See ``monarchs.stale_corrections`` /
   ``artworks.stale_corrections``.
"""

from __future__ import annotations

PROVENANCE = ('reason', 'source')


def validate(entry: dict, index: int, required: tuple[str, ...] = (),
             actions: tuple[str, ...] | None = None, label: str = 'corrections') -> None:
    """Raise ValueError unless ``entry`` carries provenance, every ``required`` key, and a
    legal ``action``. Missing keys are named in the message so a malformed config says which
    line to fix."""
    missing = [k for k in (*required, *PROVENANCE) if not entry.get(k)]
    if missing:
        raise ValueError(f"{label}[{index}]: missing required key(s): {', '.join(missing)}")
    if actions is not None and entry.get('action') not in actions:
        raise ValueError(
            f"{label}[{index}]: action must be one of {actions}, got {entry.get('action')!r}")


def provenance(entry: dict) -> tuple[str, str, str]:
    """The (reason, source, checked) triple, with ``checked`` normalised to a string.

    ``checked`` is optional — a correction without a verification date is still valid, just
    less re-checkable. YAML parses a bare ISO date into ``datetime.date``, hence the ``str``.
    """
    return entry['reason'], entry['source'], str(entry.get('checked', ''))
