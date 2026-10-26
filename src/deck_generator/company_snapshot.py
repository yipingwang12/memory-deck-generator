"""Render one Boston-dossier entry to a company deck's ``<slug>.source.txt``.

The snapshot is the text every card quote is verified against, so it is rendered from the
dossier (``career_planning/boston_companies.yaml``, the single source of record) rather than
retyped. Paragraphs stay on one line: a quote is matched within the normalised text, and a
hard wrap would only add line breaks for ``normalise`` to fold.
"""
from __future__ import annotations

import argparse
import textwrap
from datetime import date
from pathlib import Path

import yaml

#: dossier field → snapshot heading, in snapshot order
SECTIONS = {"founding": "HISTORY AND PEOPLE", "platform": "PLATFORM",
            "pipeline": "PIPELINE AND PRODUCTS", "funding": "FUNDING AND PARTNERS",
            "roles": "TEAMS AND ROLES", "read": "ASSESSMENT", "cardable": "KEY FACTS"}

_HEADER = (
    "Rendered {rendered} from the career_planning Boston employer dossier (boston_companies.yaml, "
    "last revised {revised}). Every quote in this deck is verified against this text. It is a dated "
    "snapshot of a live organisation: a quote proves a card matches what was researched, not that it "
    "is still true. The `checked` date on each audit row carries the second half of that claim.")


def find_entry(dossier: dict, name: str) -> dict:
    """The dossier entry called ``name``; raises if there is none."""
    for entry in dossier["deep"]:
        if entry["name"] == name:
            return entry
    raise KeyError(f"no dossier entry named {name!r}")


def _body(value) -> str:
    return "\n".join(f"- {v}" for v in value) if isinstance(value, list) else str(value)


def render(entry: dict, rendered: str, revised: str) -> str:
    """The snapshot text for one entry; ``rendered``/``revised`` are ISO dates."""
    head = "\n".join(textwrap.wrap(_HEADER.format(rendered=rendered, revised=revised), 95))
    parts = [f"{entry['name']} — research snapshot\n{head}",
             f"Sector: {entry['sector']}\nLocation: {entry['location']}\nSummary: {entry['one_line']}"]
    parts += [f"{title}\n\n{_body(entry[key])}" for key, title in SECTIONS.items() if entry.get(key)]
    return "\n\n".join(parts) + "\n"


def main(argv: list[str] | None = None) -> None:
    p = argparse.ArgumentParser(description="Render a dossier entry to a company snapshot.")
    p.add_argument("name", help="dossier entry name, e.g. 'Bristol Myers Squibb'")
    p.add_argument("out", type=Path, help="configs/companies/<slug>.source.txt")
    p.add_argument("--dossier", type=Path, default=Path(__file__).resolve().parents[3]
                   / "career_planning" / "boston_companies.yaml")
    p.add_argument("--revised", required=True, help="dossier revision date (ISO)")
    args = p.parse_args(argv)
    entry = find_entry(yaml.safe_load(args.dossier.read_text(encoding="utf-8")), args.name)
    args.out.write_text(render(entry, date.today().isoformat(), args.revised), encoding="utf-8")
    print(f"wrote {args.out}")


if __name__ == "__main__":
    main()
