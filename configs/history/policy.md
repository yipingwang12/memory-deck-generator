# History dates — policy

Rules for `configs/history/`. Procedure: `history-cell` skill. Check: `deck-history-check`.
All text in ASD-STE100 style.

## Sources

- Dates come from model knowledge + targeted web checks. **No Wikidata** (accuracy problems seen in artworks, monarchs).
- Wikimedia blocked by default; `task wiki-open` for a window. Prefer journal / museum / university pages anyway.

## Cell = region × theme × period

- File: `cells/<region>_<theme>_<period>.yaml`, e.g. `oceania_science_pre500bce.yaml`.
- Header comments: cell name, `DRAFT <date>`, conversion rules used.
- Group entries by subregion with `# <subregion>` comments.

## Entry

```yaml
- {years_ago: 46000, year: -44000, peg: roach, confidence: high,
   event: "Warratyi rock shelter: worked red ochre",
   scene: "A ROACH crawls through red ochre on a stone tool in a Flinders Ranges shelter."}
```

- `year`: int, negative = BCE. Required.
- `years_ago`: only for dates ≥ 10,000 years. Then `year = 2000 - years_ago`.
- `confidence`: `high` (source confirms) | `medium` (source close, or several values) | `low` (single weak claim) | `disputed` (sources disagree in print) | `unverified` (no source found).
  A label other than `unverified` needs a source found in the web check. A date from memory alone is `unverified`, even a textbook date. Keep an unsourced item as `unverified`; do not drop it.
- `source`: optional, short (< 60 characters): the site or work that confirms the date, e.g. `"Britannica: Treaty of Andrusovo"`. Added from the 2026-11-04 check pass; give it on every entry a check confirms or corrects.
- `event`: site/name + key fact. **No year-like number** (no 3–4-digit numbers at all; write "2 km high", "thousands of km"). Approximate → append `(approximate)`. Tradition only → `(traditional date)`.
- One entry per distinct fact. Same site + date + one find → consider one merged entry.

## Date conversion

- ≥ 10,000 years → `years_ago`.
- < 10,000 years ago, source gives years ago → BCE = years ago − 2,000, round to nearest century. Source gives BCE/cal BC → use it.
- Range → the **conventional "c." date**: the date survey histories and museums quote (Great Pyramid c. 2560 BCE, early Upanishads c. 600 BCE). With no conventional date: the start of a phase or tradition (a phase is dated by when it begins), or the midpoint of the span for one work of uncertain date. Mark it `(approximate)`. Changed 2026-11-04: the old "younger end" rule dated phases by their end (Wadi Sura 4400 instead of c. 7000 BCE) and pushed works across period lines (Tirukkural).
- "X ± Y" → X.
- A work (book, play, opera, film, painting, building) → its **first public appearance**: premiere, first publication, first exhibition, or opening. Not the year it was written, made or finished. The event text names which one ("premiere", "published", "opens"). A source that gives the year of writing for the same work is not a dispute. Added 2026-11-04: the check pass marked eight works `disputed` that were only written-year vs premiere-year (Carmina Burana 1936 / 1937).
- The cell's period takes the event by its converted date. Never shift a date to keep an event in a cell.

## Peg digits (`peg_number`)

- Default: last two digits of the year.
- `(approximate)` + year ending 00 → first two digits (c. 3100 BCE → 31). Under 1000 → `year // 10` (c. 900 → 90).
- `years_ago` → its first two digits, cut not rounded (41,600 → 41).
- Peg word = `major_pegs.yaml[digits]`. Never choose a peg by hand.

## Scene

- Main-fact method: peg carries the key fact of the event; peg has an active role.
- Peg in CAPITALS, singular, noun form (plural adds a 0; verb form misleads).
- Vary the peg's role across dates that share it.
- Test: "Does this scene still work for a different event with the same peg?" Yes → rewrite.
- No per-century art style.
- One sentence, ≤ 25 words.

## Open (deferred)

- Tier definition (textbook / regional / specialist).
- Blind check of the date list in a fresh context.
- Peg overload where dates bunch: round "c." dates crowd a few pegs (wave 1: dice 14 in one cell, lasso 13).
