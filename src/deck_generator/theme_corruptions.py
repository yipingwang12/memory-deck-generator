"""Generated + verified single-note corruptions of a musical theme.

Same contract as ``corruptions.py`` for equations — build a pool of individually-verified
alterations and let the quiz sample from it — but the verification is *structural* rather
than algebraic, and that difference is the whole reason this pipeline is cheap where the
equation one is expensive. sympy has to prove a corrupted formula is not equivalent to the
original; here "different" is decidable by looking: a note is on a different line, or held
for a different length. There is no proof obligation, no engine version to bump, and no
pool cache — a full 2,067-theme export builds its pools in seconds.

What *does* need proving is that a corruption is still **notatable**, and that is where this
module fails closed:

- A pitch change must land on a real staff position within a sane range.
- A rhythm change must leave its measure adding up to exactly what it did before. This is
  the constraint that shapes the design: you cannot lengthen one note without shortening
  another, so a rhythmic corruption necessarily edits an *adjacent pair* and marks both
  positions as wrong. A measure that no longer sums would re-space every note after it, and
  the reader would spot the error from the spacing without reading the rhythm at all — the
  notation equivalent of the DOM leak ``equations.py`` guards against.

A corruption therefore occupies one or more **positions**, and the answer is the set of them
— which keeps scoring identical to error-spot's pure set arithmetic.
"""

from __future__ import annotations

import random

from .themes import Note, Theme, apply_patch

# Pitch moves are measured in staff steps, never semitones: a reader misremembers a note as
# "one line higher", and a diatonic move is always notatable without inventing an accidental.
_STEP_DISTANCES = (1, -1)
_LEAP_DISTANCES = (2, -2, 3, -3, 4, -4)

# MEI durations are powers of two; a redistribution halves one value, so the longer partner
# must still be representable.
_MAX_DUR = 128
_STEPS = 'cdefgab'

DEFAULT_TYPES = ('pitch_step', 'pitch_leap', 'accidental', 'rhythm_redistribute')


def quarters(dur: int, dots: int) -> float:
    """Notated length in quarter notes. ``dur`` is the MEI denominator (4 = quarter)."""
    return (4.0 / dur) * (2 - 0.5 ** dots)


def _diatonic_to_pitch(diatonic: int) -> tuple[str, int]:
    return _STEPS[diatonic % 7], diatonic // 7


def _corruptible(n: Note) -> bool:
    """Grace notes are ornamental and tiny on the page — altering one tests eyesight, not
    recall. Everything else is fair game for a pitch change; rhythm has stricter rules."""
    return not n.grace


def _pitch_entries(notes: list[Note], distances: tuple[int, ...], type_name: str,
                   lo: int, hi: int) -> list[dict]:
    out = []
    for n in notes:
        if not _corruptible(n):
            continue
        for d in distances:
            target = n.diatonic + d
            if not (lo <= target <= hi):
                continue          # off the staff's plausible range for this theme
            pname, octave = _diatonic_to_pitch(target)
            out.append({
                'id': f'n{n.pos}.{type_name}.{d:+d}',
                'type': type_name,
                'positions': [n.pos],
                # A written accidental belongs to the pitch it was written for; carrying it
                # onto a different letter name states an alteration the corruption never
                # intended (and can render as a double-sharp).
                'patch': {str(n.pos): {'pname': pname, 'oct': str(octave),
                                       'accid': '', 'accid.ges': ''}},
            })
    return out


def _accidental_entries(notes: list[Note]) -> list[dict]:
    """Add a written accidental, or take an existing one away.

    A semitone alteration is the subtlest error the deck can pose — the note keeps its staff
    position and only the glyph in front of it changes — which is exactly why it belongs in
    the pool rather than being left to the pitch moves.
    """
    out = []
    for n in notes:
        if not _corruptible(n):
            continue
        if n.accid:
            out.append({
                'id': f'n{n.pos}.accidental.drop',
                'type': 'accidental',
                'positions': [n.pos],
                'patch': {str(n.pos): {'accid': '', 'accid.ges': ''}},
            })
            continue
        for sign, name in (('s', 'sharp'), ('f', 'flat')):
            # Skip a sign the note already sounds. Verovio records an unprinted alteration —
            # from the key signature, or from a MusicXML `<alter>` with no `<accidental>` —
            # in `accid.ges`, so "add a sharp" to an already-sharp note prints a courtesy
            # sign and changes nothing that can be heard. That is a respelling, not an error.
            if sign == n.sounding_accid:
                continue
            out.append({
                'id': f'n{n.pos}.accidental.{name}',
                'type': 'accidental',
                'positions': [n.pos],
                # accid.ges is Verovio's *sounding* alteration, inferred from the key
                # signature. Left in place it fights the written glyph and the note renders
                # with the accidental the key implied, not the one asked for.
                'patch': {str(n.pos): {'accid': sign, 'accid.ges': sign}},
            })
    return out


def _rhythm_entries(notes: list[Note]) -> list[dict]:
    """Redistribute a pair of adjacent equal notes into long-short (or short-long).

    Two undotted notes of equal value ``d`` occupy ``2 × d``; so do a dotted ``d`` and a
    single ``2d``. The measure total is therefore unchanged by construction — and asserted
    anyway in ``build_theme_pool``, because this is the invariant whose violation would leak
    the answer through note spacing.

    Both notes are marked wrong. That is not a compromise: the pair *is* the alteration, and
    asking for both is what makes this a rhythm question rather than a "which note looks
    odd" question.
    """
    out = []
    by_pos = {n.pos: n for n in notes}
    for n in notes:
        m = by_pos.get(n.pos + 1)
        if m is None:
            continue
        if not (_corruptible(n) and _corruptible(m)):
            continue
        # A tie or tuplet spans notes, so retiming one member rewrites a duration the
        # notation states elsewhere; a cross-measure pair would move length between bars.
        if n.tied or m.tied or n.tuplet or m.tuplet or n.measure != m.measure:
            continue
        if n.dur != m.dur or n.dots or m.dots or n.dur * 2 > _MAX_DUR:
            continue
        long_dur, short_dur = n.dur, n.dur * 2
        out.append({
            'id': f'n{n.pos}.rhythm.long_short',
            'type': 'rhythm_redistribute',
            'positions': [n.pos, m.pos],
            'patch': {str(n.pos): {'dur': str(long_dur), 'dots': '1'},
                      str(m.pos): {'dur': str(short_dur), 'dots': ''}},
        })
        out.append({
            'id': f'n{n.pos}.rhythm.short_long',
            'type': 'rhythm_redistribute',
            'positions': [n.pos, m.pos],
            'patch': {str(n.pos): {'dur': str(short_dur), 'dots': ''},
                      str(m.pos): {'dur': str(long_dur), 'dots': '1'}},
        })
    return out


def _measure_totals(notes: list[Note]) -> dict[int, float]:
    """Notated length of each measure, in quarter notes. Grace notes are ornamental and
    take no metrical time, so they are excluded — counting them would make every measure
    holding one look unbalanced."""
    totals: dict[int, float] = {}
    for n in notes:
        if n.grace:
            continue
        totals[n.measure] = totals.get(n.measure, 0.0) + quarters(n.dur, n.dots)
    return totals


def _pitch_range(notes: list[Note]) -> tuple[int, int]:
    """Diatonic bounds a corruption may move a note into — the theme's own range, widened by
    a third either way. Unbounded moves put notes on five ledger lines, which is spottable as
    *typography* rather than as a wrong note."""
    playable = [n.diatonic for n in notes if _corruptible(n)]
    if not playable:
        return (0, 0)
    return min(playable) - 2, max(playable) + 2


def verify(theme: Theme, entry: dict) -> str | None:
    """Reason ``entry`` must be rejected, or None if it is sound.

    Fails closed: anything that cannot be parsed back, or that changes a measure's total, or
    that turns out to change nothing at all, is refused rather than shipped. A corruption
    that renders identically to the clean theme is unanswerable — the reader is asked to find
    an error that is not there — and it cannot be detected downstream.
    """
    from .themes import parse_notes           # local: avoids a cycle at module import
    try:
        corrupted_mei = apply_patch(theme.mei, entry['patch'])
        after = parse_notes(corrupted_mei)
    except (KeyError, ValueError) as e:
        return f'unrenderable: {e}'

    before_notes = {n.pos: n for n in theme.notes}
    after_notes = {n.pos: n for n in after}
    if set(before_notes) != set(after_notes):
        return 'note count changed'

    # Compared on the SOUNDING accidental, not the printed one: a corruption that only adds
    # or removes a sign the key signature already implies respells the note without changing
    # it, and would ask the reader to find an error that is not there. Catching it here makes
    # the whole class unshippable rather than relying on each generator to avoid it.
    def signature(n):
        return (n.pname, n.oct, n.sounding_accid, n.dur, n.dots)

    changed = {p for p in before_notes if signature(before_notes[p]) != signature(after_notes[p])}
    if not changed:
        return 'no-op — sounds identical to the clean theme'
    if changed != set(entry['positions']):
        return f'changed {sorted(changed)} but claims {sorted(entry["positions"])}'

    before_bars, after_bars = _measure_totals(theme.notes), _measure_totals(after)
    for measure, total in before_bars.items():
        if abs(after_bars.get(measure, 0.0) - total) > 1e-9:
            return f'measure {measure} no longer adds up ({total} → {after_bars.get(measure)})'
    return None


def pool_target(theme: Theme, pool_size: int, max_pool: int) -> int:
    """How many corruptions this theme's pool should hold.

    ``pool_size`` is a **floor, scaled by length**, not a fixed count. A flat cap makes the
    error position predictable on a long theme: 16 corruptions over a 29-note theme can only
    ever touch about half its notes, so the second half is known-safe to anyone who has seen
    the card a few times, and the deck quietly stops testing it.
    """
    playable = sum(1 for n in theme.notes if _corruptible(n))
    return min(max(pool_size, playable), max_pool)


def build_theme_pool(theme: Theme, types=DEFAULT_TYPES, pool_size: int = 16,
                     max_pool: int = 40) -> list[dict]:
    """Verified corruption pool for one theme, deterministic per theme.

    Sampling is seeded on the theme id, not left to a fresh RNG, so re-exporting an unchanged
    corpus produces a byte-identical artifact. (The quiz samples *from* this pool unseeded —
    fresh errors each showing — which is safe because corruptions are not part of the FSRS
    key.)

    The pool is trimmed by round-robin across corruption **types**, never by taking the first
    N: pitch moves outnumber rhythm ones by roughly ten to one, so a flat trim would produce
    a deck whose rhythmic errors had been silently sampled away — the half of the notation
    this mode exists to test.
    """
    lo, hi = _pitch_range(theme.notes)
    candidates: list[dict] = []
    if 'pitch_step' in types:
        candidates += _pitch_entries(theme.notes, _STEP_DISTANCES, 'pitch_step', lo, hi)
    if 'pitch_leap' in types:
        candidates += _pitch_entries(theme.notes, _LEAP_DISTANCES, 'pitch_leap', lo, hi)
    if 'accidental' in types:
        candidates += _accidental_entries(theme.notes)
    if 'rhythm_redistribute' in types:
        candidates += _rhythm_entries(theme.notes)

    verified = [e for e in candidates if verify(theme, e) is None]
    target = pool_target(theme, pool_size, max_pool)
    return _sample_by_type(verified, target, random.Random(f'MTD{theme.mtd_id}'))


def _sample_by_type(entries: list[dict], pool_size: int, rng: random.Random) -> list[dict]:
    by_type: dict[str, list[dict]] = {}
    for e in entries:
        by_type.setdefault(e['type'], []).append(e)
    for group in by_type.values():
        rng.shuffle(group)

    out: list[dict] = []
    order = sorted(by_type)
    while len(out) < pool_size and any(by_type[t] for t in order):
        for t in order:
            if by_type[t] and len(out) < pool_size:
                out.append(by_type[t].pop())
    return sorted(out, key=lambda e: e['id'])


def pool_warnings(theme: Theme, pool: list[dict]) -> list[str]:
    """Notes worth printing during an export — a thin or lopsided pool still ships, but
    silently shipping one is how a deck ends up asking the same question every time."""
    warnings = []
    if len(pool) < 4:
        warnings.append(f'{theme.item}: pool of {len(pool)} — the same errors will recur')
    types = {e['type'] for e in pool}
    if 'rhythm_redistribute' not in types:
        warnings.append(f'{theme.item}: no rhythmic corruption available (pitch errors only)')
    # Coverage is judged against what a pool of this size *could* reach, not against the note
    # count: a capped pool on a long theme necessarily leaves notes untouched, and warning
    # about that on every long theme would train the reader to ignore the warnings.
    covered = {p for e in pool for p in e['positions']}
    playable = {n.pos for n in theme.notes if _corruptible(n)}
    reachable = min(len(playable), len(pool))
    if reachable and len(covered) < reachable / 2:
        warnings.append(
            f'{theme.item}: corruptions reach {len(covered)} of {len(playable)} notes — '
            f'the error is predictable from position alone')
    return warnings
