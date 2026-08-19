"""Generated + verified note corruptions.

The invariant under test throughout: a corruption must be a *real, notatable* error. Not a
respelling, not a bar that no longer adds up, and not something that changes nothing.
"""

import collections

from deck_generator.theme_corruptions import (
    DEFAULT_TYPES, build_theme_pool, pool_target, pool_warnings, quarters, verify,
    _accidental_entries, _measure_totals, _rhythm_entries,
)
from deck_generator.themes import Theme, apply_patch, parse_notes

from .theme_fixture import MEI


def theme(mei=MEI, mtd_id='TEST'):
    return Theme(mtd_id=mtd_id, mei=mei, notes=parse_notes(mei))


class TestQuarters:
    def test_plain_values(self):
        assert quarters(4, 0) == 1.0 and quarters(2, 0) == 2.0 and quarters(8, 0) == 0.5

    def test_dots_add_half(self):
        assert quarters(4, 1) == 1.5 and quarters(4, 2) == 1.75


class TestMeasureTotals:
    def test_sums_each_bar(self):
        assert _measure_totals(theme().notes) == {1: 4.0, 2: 4.0}

    def test_grace_notes_take_no_metrical_time(self):
        from deck_generator.themes import Note
        notes = [Note(pos=1, pname='c', oct=5, dur=4, measure=1),
                 Note(pos=2, pname='d', oct=5, dur=8, grace=True, measure=1)]
        assert _measure_totals(notes) == {1: 1.0}


class TestRhythmCorruptions:
    def test_pairs_equal_adjacent_notes(self):
        ids = {e['id'] for e in _rhythm_entries(theme().notes)}
        assert 'n1.rhythm.long_short' in ids and 'n5.rhythm.long_short' in ids

    def test_marks_both_notes_of_the_pair(self):
        """Lengthening one note has to shorten another, so the pair IS the alteration —
        asking for both is what makes this a rhythm question."""
        entry = next(e for e in _rhythm_entries(theme().notes) if e['id'] == 'n1.rhythm.long_short')
        assert entry['positions'] == [1, 2]

    def test_never_spans_a_barline(self):
        """A cross-measure pair would move length between bars, so neither would add up."""
        for e in _rhythm_entries(theme().notes):
            assert e['positions'] != [4, 5]

    def test_the_measure_still_adds_up(self):
        t = theme()
        for e in _rhythm_entries(t.notes):
            after = parse_notes(apply_patch(t.mei, e['patch']))
            assert _measure_totals(after) == _measure_totals(t.notes), e['id']

    def test_long_short_and_short_long_are_both_offered(self):
        ids = {e['id'] for e in _rhythm_entries(theme().notes)}
        assert {'n1.rhythm.long_short', 'n1.rhythm.short_long'} <= ids


class TestAccidentalCorruptions:
    def test_offers_both_signs_on_a_plain_note(self):
        ids = {e['id'] for e in _accidental_entries(theme().notes) if e['positions'] == [1]}
        assert ids == {'n1.accidental.sharp', 'n1.accidental.flat'}

    def test_never_reprints_a_sign_the_note_already_sounds(self):
        """n4 sounds F# via accid.ges. "Add a sharp" there prints a courtesy accidental and
        changes nothing audible — a respelling, not a wrong note."""
        ids = {e['id'] for e in _accidental_entries(theme().notes) if e['positions'] == [4]}
        assert ids == {'n4.accidental.flat'}

    def test_a_written_sign_can_be_dropped(self):
        mei = MEI.replace('pname="f" accid.ges="s"', 'pname="f" accid="s"')
        ids = {e['id'] for e in _accidental_entries(theme(mei).notes) if e['positions'] == [4]}
        assert ids == {'n4.accidental.drop'}


class TestVerify:
    def test_accepts_a_real_pitch_change(self):
        entry = {'id': 'x', 'type': 'pitch_step', 'positions': [1],
                 'patch': {'1': {'pname': 'd', 'oct': '5', 'accid': '', 'accid.ges': ''}}}
        assert verify(theme(), entry) is None

    def test_rejects_a_respelling(self):
        """The class-wide guard: caught here, no generator can ship one by mistake."""
        entry = {'id': 'x', 'type': 'accidental', 'positions': [4],
                 'patch': {'4': {'accid': 's', 'accid.ges': 's'}}}
        assert 'sounds identical' in verify(theme(), entry)

    def test_rejects_a_no_op(self):
        entry = {'id': 'x', 'type': 'pitch_step', 'positions': [1],
                 'patch': {'1': {'pname': 'c', 'oct': '5'}}}
        assert 'sounds identical' in verify(theme(), entry)

    def test_rejects_a_bar_that_no_longer_adds_up(self):
        """Unbalanced bars re-space every following note, so the error would be spottable
        as typography rather than as music."""
        entry = {'id': 'x', 'type': 'rhythm_redistribute', 'positions': [1],
                 'patch': {'1': {'dur': '2'}}}
        assert 'no longer adds up' in verify(theme(), entry)

    def test_rejects_a_claim_that_understates_what_changed(self):
        entry = {'id': 'x', 'type': 'rhythm_redistribute', 'positions': [1],
                 'patch': {'1': {'dur': '4', 'dots': '1'}, '2': {'dur': '8', 'dots': ''}}}
        assert 'claims' in verify(theme(), entry)

    def test_rejects_an_unrenderable_patch(self):
        entry = {'id': 'x', 'type': 'pitch_step', 'positions': [9],
                 'patch': {'9': {'pname': 'd'}}}
        assert 'unrenderable' in verify(theme(), entry)


class TestBuildPool:
    def test_every_entry_verifies(self):
        t = theme()
        assert all(verify(t, e) is None for e in build_theme_pool(t))

    def test_is_deterministic_for_a_given_theme(self):
        """A re-export of an unchanged corpus must produce a byte-identical artifact."""
        a = build_theme_pool(theme(mtd_id='0417'))
        b = build_theme_pool(theme(mtd_id='0417'))
        assert [e['id'] for e in a] == [e['id'] for e in b]

    def test_different_themes_sample_differently(self):
        a = build_theme_pool(theme(mtd_id='0001'), pool_size=4)
        b = build_theme_pool(theme(mtd_id='9999'), pool_size=4)
        assert [e['id'] for e in a] != [e['id'] for e in b]

    def test_trimming_keeps_every_type(self):
        """Pitch moves outnumber rhythm ones ~10:1, so a flat trim would silently sample
        away the rhythmic errors — half of what this mode exists to test."""
        pool = build_theme_pool(theme(), pool_size=8, max_pool=8)
        assert len(pool) == 8
        assert set(collections.Counter(e['type'] for e in pool)) == set(DEFAULT_TYPES)

    def test_respects_the_requested_types(self):
        pool = build_theme_pool(theme(), types=('accidental',))
        assert {e['type'] for e in pool} == {'accidental'}

    def test_positions_are_always_within_the_theme(self):
        valid = {n.pos for n in theme().notes}
        assert all(set(e['positions']) <= valid for e in build_theme_pool(theme()))


class TestPoolTarget:
    def test_scales_up_to_the_note_count(self):
        """A flat cap makes the error position predictable on a long theme: the untouched
        half becomes known-safe without reading a note."""
        assert pool_target(theme(), pool_size=4, max_pool=40) == 6

    def test_is_capped(self):
        assert pool_target(theme(), pool_size=4, max_pool=5) == 5

    def test_never_falls_below_the_floor(self):
        assert pool_target(theme(), pool_size=20, max_pool=40) == 20


class TestPoolWarnings:
    def test_warns_on_a_thin_pool(self):
        assert any('pool of' in w for w in pool_warnings(theme(), build_theme_pool(theme())[:2]))

    def test_warns_when_no_rhythmic_corruption_is_available(self):
        pool = [e for e in build_theme_pool(theme()) if e['type'] != 'rhythm_redistribute']
        assert any('no rhythmic corruption' in w for w in pool_warnings(theme(), pool))

    def test_a_healthy_pool_is_quiet(self):
        assert pool_warnings(theme(), build_theme_pool(theme())) == []
