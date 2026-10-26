from pathlib import Path

import yaml

from deck_generator import company_snapshot as cs

ROOT = Path(__file__).resolve().parents[1]
DOSSIER = ROOT.parent / "career_planning" / "boston_companies.yaml"
ENTRY = {"name": "Acme Bio", "sector": "Biotech", "location": "Boston, MA",
         "one_line": "One line.", "founding": "Founded 2020.", "platform": "A platform.",
         "pipeline": ["First asset.", "Second asset."], "funding": "Series A.",
         "roles": "Few roles.", "read": "A read.", "cardable": ["Fact one", "Fact two"]}


def test_sections_in_order():
    text = cs.render(ENTRY, rendered="2026-10-25", revised="2026-10-24")
    heads = [h for h in cs.SECTIONS.values() if h in text]
    assert heads == list(cs.SECTIONS.values())
    assert text.index("HISTORY AND PEOPLE") < text.index("Founded 2020.") < text.index("PLATFORM")


def test_header_and_lists():
    text = cs.render(ENTRY, rendered="2026-10-25", revised="2026-10-24")
    assert text.startswith("Acme Bio — research snapshot\nRendered 2026-10-25 from")
    assert "last revised 2026-10-24)" in text
    assert "Summary: One line.\n" in text
    assert "- First asset.\n- Second asset.\n" in text
    assert text.endswith("- Fact two\n")


def test_find_entry_by_name():
    assert cs.find_entry({"deep": [ENTRY]}, "Acme Bio") is ENTRY


def test_reproduces_a_committed_snapshot():
    """The renderer must write what earlier decks were hand-rendered as."""
    entry = cs.find_entry(yaml.safe_load(DOSSIER.read_text()), "Tessera Therapeutics")
    want = (ROOT / "configs" / "companies" / "tessera_therapeutics.source.txt").read_text()
    assert cs.render(entry, rendered="2026-10-15", revised="2026-10-14") == want
