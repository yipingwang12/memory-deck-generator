"""MTD musical themes → canonical MEI with per-note handles, for the quiz's `notation-spot` mode.

Source is the **Musical Theme Dataset** (AudioLabs Erlangen), a digitisation of Barlow &
Morgenstern's *Dictionary of Musical Themes*: 2,067 themes, each an editorially-chosen theme
rather than a mechanical incipit. We read two of its folders — ``data_SCORE_XML`` (the
notated score, MusicXML 3.0) and ``data_META`` (composer/work/instrumentation JSON).

**The score, not the note list.** MTD also ships ``data_SCORE_CSV`` as flat
``Start;Duration;Pitch`` rows, which is tempting and wrong: it merges tied notes into one
sounding event, so it disagrees with the notated score for 566 of the 2,067 themes (561 of
those are exactly the tie cases). Corrupting a *sounding* duration would render a
dotted-quarter the score never showed. The CSVs describe what is heard; only the MusicXML
describes what is read, and reading is the skill being tested.

Themes are canonicalised to **MEI** with ``xml:id="n1".."nN"`` on every note, because that is
what makes the corruption seam work — exactly as equations bake MathML with ``id="tok-N"``.
Verovio renders the MEI to SVG carrying those same ids, so a corruption is an *attribute
swap* on one note and the markup is otherwise byte-identical between clean and corrupted.
Anything that re-rendered from a different source, or wrapped the changed note, would leak
the answer through the DOM.

Verovio assigns fresh random ids on every load, so the renumbering here is not cosmetic: it
is what makes a pool entry's ``i`` mean the same note on the generator's machine and the
reader's.
"""

from __future__ import annotations

import json
import re
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path

MEI_NS = 'http://www.music-encoding.org/ns/mei'
XML_NS = 'http://www.w3.org/XML/1998/namespace'
_XML_ID = f'{{{XML_NS}}}id'

# Verovio's engraving options. Fixed here rather than in the quiz so the generator's preview
# and the quiz's rendering cannot drift into disagreeing about what a theme looks like.
VEROVIO_OPTIONS = {
    'adjustPageHeight': True,
    'adjustPageWidth': True,
    'scale': 40,
    'header': 'none',
    'footer': 'none',
    'svgViewBox': True,
    'breaks': 'auto',
    'pageMarginTop': 0,
    'pageMarginBottom': 0,
    'pageMarginLeft': 0,
    'pageMarginRight': 0,
    # Verovio suffixes every generated element id with a per-load random string, so the same
    # MEI renders to different bytes each time. Pinning the seed makes rendering a pure
    # function of the MEI — which is what lets a test assert on engraved output at all, and
    # what keeps a re-render from looking like a change when it is not. It does NOT affect
    # the note ids: `loadData` preserves the xml:ids already in the MEI.
    'xmlIdSeed': 1,
}

_STEPS = 'cdefgab'


@dataclass(frozen=True)
class Note:
    """One notated note, addressed by its 1-based position in the theme.

    ``pos`` is the number in the MEI ``xml:id`` (``n{pos}``) and is what a corruption's ``i``
    refers to. It counts *notated* notes including grace notes, so it stays aligned with the
    ids even where the corruption engine refuses to touch a note.
    """
    pos: int
    pname: str                 # 'c'..'b'
    oct: int
    accid: str = ''            # 'f' | 's' | 'n' | '' — the accidental actually printed
    # What the note SOUNDS, whether or not a sign is printed: MEI's gestural alteration,
    # which Verovio fills in from the key signature and from a MusicXML `<alter>` that
    # carried no `<accidental>` element. Corruptions compare on this, not on `accid` —
    # printing a courtesy sharp on a note the key already sharpened changes the page but not
    # the music, and asking a reader to find that as a "wrong note" is asking for something
    # that is not wrong.
    accid_ges: str = ''
    dur: int = 4               # MEI duration: 1=whole, 2=half, 4=quarter, 8=eighth...
    dots: int = 0
    grace: bool = False
    tied: bool = False         # participates in a tie (either end)
    tuplet: bool = False
    measure: int = 0           # 1-based measure index

    @property
    def sounding_accid(self) -> str:
        """The alteration the note is heard with — printed if there is one, gestural
        otherwise. This is the value a corruption has to change to be a real error."""
        return self.accid or self.accid_ges

    @property
    def diatonic(self) -> int:
        """Absolute diatonic step number — the vertical position on the staff.

        Corruptions move notes by *staff steps*, not semitones, because that is the error a
        reader actually makes and the only one that always stays notatable without inventing
        an accidental."""
        return self.oct * 7 + _STEPS.index(self.pname)


@dataclass
class Theme:
    """A theme ready to become a card. ``mei`` is the baked display source; ``notes`` is the
    parsed view the corruption engine works from. ``mtd_id`` is the FSRS identity component —
    never the notes, which change whenever MTD corrects an encoding."""
    mtd_id: str
    mei: str
    notes: list[Note]
    meta: dict = field(default_factory=dict)

    @property
    def item(self) -> str:
        """Global FSRS identity. Prefixed because ``item_key`` carries no deck: a bare
        ``0417`` would be a plausible string for some future numeric deck to mint too."""
        return f'MTD|{self.mtd_id}'

    @property
    def composer(self) -> str:
        return self.meta.get('ComposerID', '')

    @property
    def birth(self) -> int:
        try:
            return int(self.meta.get('ComposerBirth') or 0)
        except (TypeError, ValueError):
            return 0

    @property
    def label(self) -> str:
        """Card label — the prompt, so it must name the work rather than describe the notes.

        MTD leaves ``WorkTitle`` empty for 81.5% of themes, so the catalogue id is the
        fallback and is genuinely all the dataset knows. Never derive this from the notation:
        a label is shown beside a *corrupted* score and must not restate it.
        """
        work = (self.meta.get('WorkTitle') or '').strip() or self.meta.get('WorkID', '')
        return f'{self.composer} — {work}'.strip(' —')

    @property
    def ensemble(self) -> str:
        return self.meta.get('Ensemble', '')

    @property
    def work_instruments(self) -> str:
        return self.meta.get('WorkInstruments', '')


def _toolkit():
    """A configured Verovio toolkit. Imported lazily so importing this module (and therefore
    the whole generator package) does not require verovio to be installed."""
    import verovio
    tk = verovio.toolkit()
    tk.setOptions(dict(VEROVIO_OPTIONS))
    return tk


def musicxml_to_mei(musicxml: str) -> str:
    """Convert MusicXML to MEI with deterministic note ids (``n1``..``nN``).

    The renumbering is the point. Verovio mints a random ``xml:id`` per element on every
    load, so ids taken straight from ``getMEI()`` would differ between the export that built
    a corruption pool and any later render — every pool entry would then address a different
    note, or none. Ids are assigned in document order over ``<note>`` elements, which is the
    same order ``notes()`` walks, so ``Note.pos`` and ``n{pos}`` cannot disagree.
    """
    tk = _toolkit()
    if not tk.loadData(musicxml):
        raise ValueError('verovio could not load the MusicXML')
    return canonical_ids(tk.getMEI())


def canonical_ids(mei: str) -> str:
    """Renumber note ids to ``n1``..``nN``, drop Verovio's colour noise, and remove the part
    label.

    The label is Sibelius's ``<part-name>`` carried through the MusicXML — "P1", "Violin",
    whatever the engraver happened to type. It engraves to the left of the staff, where it is
    pure clutter on a single-line theme, and occasionally names the instrument, which on a
    card whose prompt is the work is a hint nobody asked for.
    """
    ET.register_namespace('', MEI_NS)
    root = ET.fromstring(mei)
    for n, note in enumerate(_note_elements(root), start=1):
        note.set(_XML_ID, f'n{n}')
        note.attrib.pop('color', None)
    for parent in root.iter():
        for child in list(parent):
            if _local(child.tag) in ('label', 'labelAbbr'):
                parent.remove(child)
    return ET.tostring(root, encoding='unicode')


def _note_elements(root: ET.Element) -> list[ET.Element]:
    """Every ``<note>`` in document order — the notes a reader sees, left to right."""
    return [e for e in root.iter() if e.tag == f'{{{MEI_NS}}}note']


def _local(tag: str) -> str:
    return tag.split('}')[-1]


def parse_notes(mei: str) -> list[Note]:
    """Parse a canonicalised MEI into the note list the corruption engine reads.

    Tie and tuplet membership are collected from their *container/reference* elements rather
    than the notes, because MEI expresses both either way round (``<tie startid= endid=>`` or
    ``@tie`` on the note). Missing one form would let the engine retime a tied note, which
    renders as a bar that no longer adds up.
    """
    root = ET.fromstring(mei)
    tied = _tied_ids(root)
    tuplet = _tuplet_ids(root)
    out: list[Note] = []
    measure = 0
    for e in root.iter():
        if _local(e.tag) == 'measure':
            measure += 1
        if e.tag != f'{{{MEI_NS}}}note':
            continue
        nid = e.get(_XML_ID) or ''
        m = re.fullmatch(r'n(\d+)', nid)
        if m is None:
            raise ValueError(f'note id {nid!r} is not canonical — run canonical_ids first')
        out.append(Note(
            pos=int(m.group(1)),
            pname=(e.get('pname') or 'c').lower(),
            oct=int(e.get('oct') or 4),
            accid=(e.get('accid') or '').lower(),
            accid_ges=(e.get('accid.ges') or '').lower(),
            dur=int(e.get('dur') or 4),
            dots=int(e.get('dots') or 0),
            grace=e.get('grace') is not None,
            tied=nid in tied or bool(e.get('tie')),
            tuplet=nid in tuplet,
            measure=measure,
        ))
    return out


def _tied_ids(root: ET.Element) -> set[str]:
    ids: set[str] = set()
    for e in root.iter():
        if _local(e.tag) != 'tie':
            continue
        for attr in ('startid', 'endid'):
            ref = (e.get(attr) or '').lstrip('#')
            if ref:
                ids.add(ref)
    return ids


def _tuplet_ids(root: ET.Element) -> set[str]:
    ids: set[str] = set()
    for e in root.iter():
        if _local(e.tag) not in ('tuplet', 'tupletSpan'):
            continue
        ids.update(n.get(_XML_ID) for n in _note_elements(e) if n.get(_XML_ID))
        for attr in ('startid', 'endid'):
            ref = (e.get(attr) or '').lstrip('#')
            if ref:
                ids.add(ref)
    return {i for i in ids if i}


def apply_patch(mei: str, patch: dict[str, dict[str, str]]) -> str:
    """Return ``mei`` with each ``{note-position: {attr: value}}`` applied.

    An empty value **removes** the attribute — how an accidental is taken away, which is a
    real corruption and not expressible by setting it to something. Raises on an unknown
    position: a pool that addresses a note the MEI does not have means the artifact and its
    notation disagree, which must be loud rather than silently rendering a clean theme as
    though it were corrupted (the same contract as ``equations.apply_corruptions``).
    """
    ET.register_namespace('', MEI_NS)
    root = ET.fromstring(mei)
    by_id = {n.get(_XML_ID): n for n in _note_elements(root)}
    for pos, attrs in patch.items():
        note = by_id.get(f'n{pos}')
        if note is None:
            raise KeyError(f'n{pos} not in MEI')
        for attr, value in attrs.items():
            if value == '':
                note.attrib.pop(attr, None)
            else:
                note.set(attr, str(value))
    return ET.tostring(root, encoding='unicode')


def render_svg(mei: str) -> str:
    """Engrave MEI to a single SVG system. Raises if Verovio rejects the data."""
    tk = _toolkit()
    if not tk.loadData(mei):
        raise ValueError('verovio could not load the MEI')
    return tk.renderToSVG(1)


# --- MTD corpus access -------------------------------------------------------------------

# Some works contribute two themes from one movement, numbered `0739-2`. The suffix is part
# of the id, and therefore part of the FSRS identity — dropping it would collide the two.
_ID_RE = re.compile(r'MTD(\d+(?:-\d+)?)_')


def _mtd_id(path: Path) -> str:
    m = _ID_RE.match(path.name)
    if m is None:
        raise ValueError(f'not an MTD filename: {path.name}')
    return m.group(1)


def discover_theme_ids(mtd_dir: Path) -> list[str]:
    """Every theme id in an MTD checkout, sorted. Reads filenames only."""
    score_dir = Path(mtd_dir) / 'data_SCORE_XML'
    if not score_dir.is_dir():
        raise FileNotFoundError(
            f'{score_dir} not found — point `mtd_dir` at an unpacked MTD_1.0.0 archive '
            f'(needs its data_SCORE_XML and data_META folders)')
    return sorted(_mtd_id(p) for p in score_dir.glob('MTD*.xml'))


def _one(directory: Path, mtd_id: str, suffix: str) -> Path:
    matches = sorted(Path(directory).glob(f'MTD{mtd_id}_*{suffix}'))
    if not matches:
        raise FileNotFoundError(f'no MTD{mtd_id}*{suffix} in {directory}')
    return matches[0]


def load_meta(mtd_dir: Path, mtd_id: str) -> dict:
    return json.loads(_one(Path(mtd_dir) / 'data_META', mtd_id, '.json').read_text(encoding='utf-8'))


@lru_cache(maxsize=None)
def _load_theme_cached(mtd_dir: str, mtd_id: str) -> Theme:
    xml_path = _one(Path(mtd_dir) / 'data_SCORE_XML', mtd_id, '.xml')
    mei = musicxml_to_mei(xml_path.read_text(encoding='utf-8'))
    return Theme(mtd_id=mtd_id, mei=mei, notes=parse_notes(mei),
                 meta=load_meta(Path(mtd_dir), mtd_id))


def load_theme(mtd_dir: Path, mtd_id: str) -> Theme:
    """One theme, converted and parsed. Cached per (dir, id) — a config's decks are filtered
    views over the same corpus, so an unfiltered run would otherwise convert each theme once
    per deck."""
    return _load_theme_cached(str(mtd_dir), mtd_id)


def load_themes(mtd_dir: Path, ids: list[str] | None = None) -> list[Theme]:
    ids = discover_theme_ids(mtd_dir) if ids is None else ids
    return [load_theme(mtd_dir, i) for i in ids]
