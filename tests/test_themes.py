"""MTD ingest: MusicXML → canonical MEI → note list, and patching."""

import pytest

from deck_generator.themes import (
    Note, Theme, apply_patch, canonical_ids, musicxml_to_mei, parse_notes, render_svg,
)

from .theme_fixture import MEI, MUSICXML


class TestCanonicalIds:
    def test_notes_are_numbered_in_document_order(self):
        notes = parse_notes(canonical_ids(MEI))
        assert [n.pos for n in notes] == [1, 2, 3, 4, 5, 6]
        assert [n.pname for n in notes] == ['c', 'd', 'e', 'f', 'g', 'a']

    def test_renumbering_is_idempotent(self):
        assert canonical_ids(canonical_ids(MEI)) == canonical_ids(MEI)

    def test_verovio_ids_are_replaced(self):
        """The point of renumbering: Verovio mints a fresh random id per load, so a pool
        entry built against one conversion would address a different note in the next."""
        mei = musicxml_to_mei(MUSICXML)
        assert 'xml:id="n1"' in mei and 'xml:id="n6"' in mei

    def test_conversion_matches_the_hand_written_fixture(self):
        converted = parse_notes(musicxml_to_mei(MUSICXML))
        expected = parse_notes(MEI)
        assert [(n.pos, n.pname, n.oct, n.dur) for n in converted] == \
               [(n.pos, n.pname, n.oct, n.dur) for n in expected]

    def test_uncanonical_ids_are_refused(self):
        """Rather than guessing a position — a wrong guess silently mislabels every card."""
        with pytest.raises(ValueError, match='canonical'):
            parse_notes(MEI.replace('xml:id="n1"', 'xml:id="zzz"'))


class TestParseNotes:
    def test_measures_are_numbered(self):
        notes = parse_notes(MEI)
        assert [n.measure for n in notes] == [1, 1, 1, 1, 2, 2]

    def test_durations(self):
        assert [n.dur for n in parse_notes(MEI)] == [4, 4, 4, 4, 2, 2]

    def test_gestural_accidental_is_kept_separate_from_the_printed_one(self):
        """n4 sounds F# with no sign printed. Conflating the two makes "add a sharp" look
        like a corruption when it only prints a courtesy accidental."""
        n4 = parse_notes(MEI)[3]
        assert (n4.accid, n4.accid_ges, n4.sounding_accid) == ('', 's', 's')

    def test_sounding_accid_prefers_the_printed_sign(self):
        assert Note(pos=1, pname='c', oct=5, accid='f', accid_ges='s').sounding_accid == 'f'


class TestDiatonic:
    def test_steps_are_staff_positions_not_semitones(self):
        """E→F is one staff step and one semitone; F→G is one step and two. Corruptions move
        by steps, so the two must not be conflated."""
        e = Note(pos=1, pname='e', oct=5)
        f = Note(pos=2, pname='f', oct=5)
        g = Note(pos=3, pname='g', oct=5)
        assert f.diatonic - e.diatonic == 1
        assert g.diatonic - f.diatonic == 1

    def test_octave_wraps(self):
        assert Note(pos=1, pname='c', oct=5).diatonic - Note(pos=2, pname='b', oct=4).diatonic == 1


class TestApplyPatch:
    def test_sets_attributes(self):
        out = parse_notes(apply_patch(MEI, {'1': {'pname': 'd'}}))
        assert out[0].pname == 'd'

    def test_empty_value_removes_the_attribute(self):
        """How an accidental is taken away — not expressible by setting it to anything."""
        out = parse_notes(apply_patch(MEI, {'4': {'accid.ges': ''}}))
        assert out[3].accid_ges == ''

    def test_unknown_position_raises(self):
        """Loud, not silent: a pool addressing a missing note means the artifact and its
        notation disagree, and rendering clean while claiming corrupted asks the reader to
        find an error that is not there."""
        with pytest.raises(KeyError, match='n99'):
            apply_patch(MEI, {'99': {'pname': 'd'}})

    def test_does_not_mutate_the_source(self):
        apply_patch(MEI, {'1': {'pname': 'g'}})
        assert parse_notes(MEI)[0].pname == 'c'


class TestRender:
    def test_note_ids_reach_the_svg(self):
        """The whole seam: the pool's positions and the page's click targets are one index
        space only because these ids survive engraving."""
        svg = render_svg(MEI)
        for pos in range(1, 7):
            assert f'<g id="n{pos}" class="note"' in svg

    def test_rendering_is_deterministic(self):
        """Verovio randomises generated ids per load unless the seed is pinned; without
        that, no test could assert on engraved output and a re-render would look like a
        change."""
        assert render_svg(MEI) == render_svg(MEI)

    def test_a_pitch_change_renders_differently(self):
        assert render_svg(apply_patch(MEI, {'1': {'pname': 'g'}})) != render_svg(MEI)


class TestTheme:
    def _theme(self, **meta):
        return Theme(mtd_id='0417', mei=MEI, notes=parse_notes(MEI), meta=meta)

    def test_item_is_the_catalogue_id_not_the_notes(self):
        """MTD ships corrected encodings, so keying on notation would strand a card's
        history the first time a wrong pitch was fixed upstream."""
        assert self._theme().item == 'MTD|0417'

    def test_label_prefers_the_work_title(self):
        t = self._theme(ComposerID='Beethoven', WorkTitle='Symphony No. 5', WorkID='Op067-01')
        assert t.label == 'Beethoven — Symphony No. 5'

    def test_label_falls_back_to_the_catalogue_number(self):
        """MTD leaves WorkTitle empty for 81.5% of themes — the id is genuinely all it
        knows, and a blank prompt is worse than a catalogue number."""
        t = self._theme(ComposerID='Beethoven', WorkTitle='', WorkID='Op067-01')
        assert t.label == 'Beethoven — Op067-01'

    def test_birth_year_is_numeric_and_tolerates_junk(self):
        assert self._theme(ComposerBirth='1770').birth == 1770
        assert self._theme(ComposerBirth='').birth == 0
