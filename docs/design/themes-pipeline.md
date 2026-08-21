# Design — Musical themes notation pipeline (`deck-themes`)

Status: **built and in use** — generator + desktop quiz surface. 2,067 MTD themes → **899 cards
across 6 period decks**, consumed by `memory-quiz-app`'s `notation-spot` mode. **No PWA surface
and no `study.json` gate opt-in**, matching equations.

## Goal

Cards that test whether you can *read* a musical theme: the theme is engraved on a staff with
one alteration silently applied, and the reader taps every note that is wrong.

## Source — MTD, and why `data_SCORE_XML`

The **Musical Theme Dataset** (AudioLabs Erlangen, 2020) digitises Barlow & Morgenstern's
*A Dictionary of Musical Themes* (1948). Its unit is an **editorially-chosen theme**, not a
mechanical incipit — no other open source segments themes at this scale, which is the whole
reason the deck is possible. The archive is a 2.6 GB download unpacked under `cache/mtd/`
(gitignored, like every other heavyweight pipeline input); only two folders are read.

| Folder | Used | Why |
|---|---|---|
| `data_SCORE_XML` | **yes** | The notated score — MusicXML 3.0, Sibelius-exported |
| `data_META` | **yes** | Composer, work, instrumentation, dates |
| `data_SCORE_CSV` | no | Sounding note list; merges ties (below) |
| `data_EDM-*`, `data_AUDIO`, `data_SCORE_{IMG,MID,SIB}` | no | Not needed for notation |

**The score, not the note list.** `data_SCORE_CSV` is a flat `Start;Duration;Pitch` table and
is the obvious thing to reach for. It merges tied notes into one sounding event, so it
disagrees with the notated score for **566 of the 2,067 themes** — and 561 of those are exactly
the tie cases (measured, not assumed). Corrupting a *sounding* duration would render a
dotted quarter the score never showed. The CSVs describe what is heard; the MusicXML describes
what is read, and reading is the skill being tested.

## Canonical MEI, and why ids are renumbered

MusicXML → Verovio → MEI, then **every `<note>` is renumbered `n1`..`nN`** in document order
(`canonical_ids`). This is not cosmetic. Verovio mints a fresh random `xml:id` per element on
every load, so a corruption pool built against one conversion would address a *different note*
in the next render, or none. The renumbering makes `Note.pos`, the pool's `positions`, the
SVG's `<g id="nK">`, and the reader's click one index space.

`canonical_ids` also drops Verovio's per-element `color` noise and the `<label>`/`<labelAbbr>`
part name — the latter engraves as "P1" (or the instrument) to the left of the staff, which is
clutter on a single-line theme and occasionally a hint the card never meant to give.

The MEI ships as **asset files** under `data/decks/assets/<deck>/`, following artworks' WebP
images: ~6 KB a theme is fine on disk and unreasonable inside a JSON the deck picker parses.

## Corruption taxonomy

| Type | What changes | Positions |
|---|---|---|
| `pitch_step` | ±1 diatonic step | 1 |
| `pitch_leap` | ±2..±4 diatonic steps | 1 |
| `accidental` | add a sharp/flat, or remove a written one | 1 |
| `rhythm_redistribute` | an adjacent pair re-split long-short or short-long | **2** |

Pitch moves are measured in **staff steps, not semitones**: that is the error a reader actually
makes, and a diatonic move is always notatable without inventing an accidental. Moves are
bounded to the theme's own range widened by a third — an unbounded move puts notes on five
ledger lines, which is spottable as *typography* rather than as a wrong note.

**A rhythmic corruption necessarily edits two notes.** Lengthening one note has to shorten
another, or the bar stops adding up — and an unbalanced bar re-spaces every note after it, so
the reader would spot the error from the spacing without reading the rhythm at all. Two
undotted notes of equal value `d` occupy the same time as a dotted `d` plus a single `2d`, so
the pair is re-split and **both positions are the answer**. That is the question, not a
rounding of it: asking for both is what makes it a rhythm question rather than a
which-note-looks-odd question.

## Verification is structural, not algebraic

This is why the pipeline is cheap where the equation one is expensive. sympy must *prove* a
corrupted formula is not equivalent to the original; here "different" is decidable by looking.
There is no proof obligation, **no pool cache, and no engine version to bump** — the whole
2,067-theme corpus builds in about 90 seconds.

What does need proving is that a corruption is still **notatable**. `verify` fails closed on:

- **a no-op** — renders identically, so the reader is asked to find an error that is not there
- **a respelling** — compares the *sounding* accidental (`accid` else `accid.ges`). Verovio
  records an unprinted alteration — from the key signature, or a MusicXML `<alter>` with no
  `<accidental>` — in `accid.ges`, so "add a sharp" to an already-sharp note prints a courtesy
  accidental and changes the page but not the music. Caught here, the whole class is
  unshippable rather than left to each generator to avoid
- **a changed measure total** — the invariant whose violation leaks the answer as spacing
- **a claim/effect mismatch** — the patch's real effect must equal its declared `positions`

Across the full corpus every generated candidate verified; the guard has caught nothing in
production, which is the point of a fail-closed check rather than evidence it is unnecessary.

## Pool sizing and sampling

`pool_size` is a **floor scaled by note count**, capped at `max_pool`. A flat cap makes the
error position predictable on a long theme: 16 corruptions over a 29-note theme can only ever
touch about half its notes, so the rest becomes known-safe to anyone who has seen the card a
few times, and the deck quietly stops testing it.

Trimming is **round-robin across types**, never the first N: pitch moves outnumber rhythm ones
roughly ten to one, so a flat trim would produce a deck whose rhythmic errors had been silently
sampled away — half of what this mode exists to test.

Sampling is seeded on the theme id, so re-exporting an unchanged corpus produces a
byte-identical artifact. (The quiz samples *from* the pool unseeded — fresh errors each
showing — which is safe because corruptions never participate in the FSRS key.)

## Selection — the composer cap is the design decision

MTD is heavily concentrated: **Beethoven alone is 27%** of the corpus and ten composers are
73% of it. Uncapped, every fourth card is Beethoven and the deck teaches one catalogue rather
than the repertoire. `max_per_composer: 40` takes 2,067 → **899**.

The cap applies in MTD id order, so a capped composer keeps their lowest-numbered themes — a
stable, reproducible subset, not a quality ranking, and raising the cap only ever *adds*
themes rather than reshuffling the kept set. Also excluded: themes outside `min_notes`/
`max_notes`, and the 20 themes carrying more than one voice (a corruption on an inner voice is
a differently-skilled task).

Decks are split by composer birth year into six period bands. Because the item is `MTD|<id>`,
**redrawing those bands moves a theme between decks without touching its review history**.

## Corpus profile (measured, 2,067 themes)

| | min | p25 | median | p75 | max |
|---|---:|---:|---:|---:|---:|
| Notes | 3 | 15 | **18** | 22 | 41 |
| Bars | 1 | 4 | **5** | 6 | 12 |
| Ambitus (semitones) | 0 | 9 | **12** | 15 | 57 |

87% of themes are 12–25 notes and 80% are 3–8 bars — Barlow & Morgenstern were editorially
consistent about what counts as a theme, so difficulty is near-constant across the deck rather
than varying by an order of magnitude. **97.6% are single-instrument lines**; 99.0% are strictly
monophonic and single-part. Note types: eighth 41.7%, quarter 27.6%, 16th 20.4%, half 6.8%.

## Artifact schema

```
deck_type: 'themes'      mode: 'notation-spot'
items:      ['MTD|0417', ...]        # identity — never the notes
labels:     ['Bach — Brandenburg Concerto, no 1', ...]
mei:        ['assets/<deck>/MTD0417.mei', ...]
pool:       [[{id, type, positions, patch}, ...], ...]
composers:  ['Bach', ...]
n_wrong:    1
attribution: 'Themes from the Musical Theme Dataset (MTD) — …, CC-BY 4.0. …'
```

**`item` is the catalogue id, never the notation.** MTD ships corrected encodings — its own
`EDM-orig`/`EDM-corr` split exists because the source had errors — so keying on notes would
strand a card's history the first time a wrong pitch was fixed upstream.

`labels` fall back to the catalogue number because MTD leaves `WorkTitle` empty for **81.5%**
of themes. That is genuinely all the dataset knows; the genre analysis behind the period split
comes from `Ensemble` + `WorkInstruments`, which are complete.

## Licensing — unresolved, blocks publishing the derived MEI

The archive's `LICENSE` grants **CC-BY 4.0** to `data_ALIGNMENT`, `data_META`,
`data_SCORE_CSV`, `data_SCORE_IMG`, `data_SCORE_MID` and `data_SCORE_SIB`. It does **not** name
`data_SCORE_XML` — the folder this pipeline reads. The archive's README omits it too, while
listing two `data_EDM-*_XML` folders the archive does not contain, so the documentation has
demonstrably drifted in both directions.

It is probably an oversight: every other member of the `data_SCORE_*` family is covered, that
family is the newly-engraved material, and the deliberate carve-outs are the audio recordings
and the `EDM-*` folders derived from the 1949 book. But an apparent oversight is not a grant.
**Confirm with the authors before publishing the derived MEI.** Attribution is required either
way and travels in each artifact's `attribution` field.

Fallback if it cannot be confirmed: `data_SCORE_MID` and `data_SCORE_SIB` *are* covered, but
MIDI loses written accidentals, ties-as-notation and correct spelling — a real quality loss for
a mode whose entire subject is how the music is written.

## CLI

```sh
deck-themes --config configs/themes/mtd.yaml --survey        # period / work type / composer
deck-themes --config configs/themes/mtd.yaml                 # pool health per theme
deck-themes --config configs/themes/mtd.yaml --render DIR    # clean + corrupted SVGs to eyeball
deck-themes --config configs/themes/mtd.yaml --export        # write the artifacts
```

`--render` exists because notation cannot be checked by reading a data structure: "is this
corruption spottable, and does it still look like music" is a question only the page answers.

## Open questions

- **Licensing** (above) — the one blocker.
- **Rhythmic vs pitch difficulty is unmeasured.** The quiz records the corruption type per
  attempt from day one, so the comparison is answerable later; nothing has run it, and the two
  may deserve separate decks.
- **Theme segmentation is out of scope.** MTD's 2,067 are taken as given. Getting past them
  means finishing the Barlow & Morgenstern digitisation or building a segmenter over a
  full-score corpus (DCML's phrase annotations are the only open training signal) — research,
  and a different repo.
- **No `deck-monarch-tables`-style sidecar.** Nothing explains *why* a theme is famous. A
  per-theme note (work, movement, what the theme is) would be the analogue of the reign tables.

## Non-goals

- Segmenting themes out of full scores (above).
- Audio. MTD ships aligned snippets and they are licensed differently; an audio-recognition
  mode would be a separate deck type, not an extension of this one.
