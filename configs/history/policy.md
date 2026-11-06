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

## Scope (added 2026-11-05)

- An event goes in a region if (a) it happens in the region, or (b) its main subject or effect is in the region.
- So these go IN: laws, Acts and decrees issued abroad for the region (Spanish crown laws for the Americas,
  Acts of Parliament for a colony); treaties a regional state signs abroad; satellites launched abroad for a
  regional owner; students the region sends abroad; works by regional authors or filmmakers that appear first
  abroad (Garcilaso and Sor Juana printed in Spain, Kazakh books printed in Orenburg, films premiered at
  Cannes). Date a work by its first public appearance, wherever that is.
- Works made or shown outside the author's region (user rule 2026-11-06): the work goes to the region it is
  set in or about; if it has no such setting, to the author's (or company's) home region. Never by the place of
  premiere or print alone. Midnight's Children → south_asia; The Plague (Oran) → north_africa; Kafka's novels
  → eastern_europe; Ballets Russes premieres in Paris (Firebird, Petrushka, Rite of Spring) → eastern_europe;
  Mahjar poets printed in New York → west_asia.
- Nobel and other prizes: IN only if the prize work was done in the region. A prize to an emigrant for work
  done abroad goes to the region where the work was done.
- Region boundaries: see `grid.md` Regions (Finland, Constantinople, the steppe, Hawaii).
- Already in an older cell (user rule 2026-11-06): if an older cell of another theme already holds the event,
  leave it there and do not repeat it, even when this cell's theme is its main theme (first-come).

## Entry

```yaml
- {years_ago: 46000, year: -44000, peg: roach, confidence: high,
   event: "Warratyi rock shelter: worked red ochre",
   scene: "A ROACH crawls through red ochre on a stone tool in a Flinders Ranges shelter."}
```

- `year`: int, negative = BCE. Required.
- `years_ago`: only for dates ≥ 10,000 years. Then `year = 2000 - years_ago`.
- `confidence`: `high` (source confirms) | `medium` (source close, or several values) | `low` (single weak claim) | `disputed` (sources disagree in print) | `unverified` (no source found).
  A label other than `unverified` needs a source found in the web check.
  Calendar straddle (added 2026-11-05): when sources differ by one year only because a Hijri, regnal or other
  calendar year covers two Common Era years, use `medium`, not `disputed`, and the year the main source gives.
  Lunar new-year gap (user rule 2026-11-06): when the day is known and falls early in a Western year but in
  the previous lunar, Hijri or regnal year, use the Western (Julian, Gregorian from 1582) year of that day:
  Chanyuan treaty, January 1005 = 12th month of 1004 → 1005, `medium`. A date from memory alone is `unverified`, even a textbook date. Keep an unsourced item as `unverified`; do not drop it.
- `source`: optional, short (< 60 characters): the site or work that confirms the date, e.g. `"Britannica: Treaty of Andrusovo"`. Added from the 2026-11-04 check pass; give it on every entry a check confirms or corrects.
- `event`: site/name + key fact. **No year-like number** (no 3–4-digit numbers at all; write "2 km high", "thousands of km"). Approximate → append `(approximate)`. Tradition only → `(traditional date)`.
- One entry per distinct fact. Same site + date + one find → consider one merged entry.

## Date conversion

- ≥ 10,000 years → `years_ago`.
- < 10,000 years ago, source gives years ago → BCE = years ago − 2,000, round to nearest century. Source gives BCE/cal BC → use it.
- Range → the **conventional "c." date**: the date survey histories and museums quote (Great Pyramid c. 2560 BCE, early Upanishads c. 600 BCE). With no conventional date: the start of a phase or tradition (a phase is dated by when it begins), or the midpoint of the span for one work of uncertain date. Mark it `(approximate)`. Changed 2026-11-04: the old "younger end" rule dated phases by their end (Wadi Sura 4400 instead of c. 7000 BCE) and pushed works across period lines (Tirukkural).
- "X ± Y" → X.
- A work (book, play, opera, film, painting, building) → its **first public appearance**: premiere, first publication, first exhibition, or opening. Not the year it was written, made or finished. The event text names which one ("premiere", "published", "opens"). A source that gives the year of writing for the same work is not a dispute. Added 2026-11-04: the check pass marked eight works `disputed` that were only written-year vs premiere-year (Carmina Burana 1936 / 1937).
- An invention → its **first working public demonstration** (event text says "demonstrates", "first flight",
  "first implant"). No demonstration on record → the first patent filing (event text says "patent").
  Prehistoric inventions (glass, wheel, water clock) → earliest dated evidence, by the rules above.
  Added 2026-11-05 (McCormick reaper: demonstration 1831, not patent 1834).
- The cell's period takes the event by its converted date. Never shift a date to keep an event in a cell.

## Peg digits (`peg_number`)

- Default: last two digits of the year.
- `(approximate)` + year ending 00 → first two digits (c. 3100 BCE → 31). Under 1000 → `year // 10` (c. 900 → 90).
- `years_ago` → its first two digits, cut not rounded (41,600 → 41).
- Peg word = `major_pegs.yaml[digits]`. Never choose a peg by hand.

## Scene

- Main-fact method: peg carries the key fact of the event; peg has an active role.
- Peg in CAPITALS, singular, noun form (plural adds a 0; verb form misleads).
- Vary the peg's role across dates that share it. A peg with more than 10 dates in one cell makes
  `deck-history-check` print `WARNING PEG OVERLOAD` (exit stays 0): give each of its scenes a different
  role AND setting. For a round approximate date, use a more exact conventional date if sources give one.
- Test: "Does this scene still work for a different event with the same peg?" Yes → rewrite.
- No per-century art style.
- One sentence, ≤ 25 words.

## Open (deferred)

- Tier definition (textbook / regional / specialist).
- Blind check of the date list in a fresh context.
- Peg overload where dates bunch: round "c." dates crowd a few pegs (wave 1: dice 14 in one cell, lasso 13).
  Partly handled 2026-11-05: check warns above 10 per cell; 38 pegs over the limit across 73 cells then.
