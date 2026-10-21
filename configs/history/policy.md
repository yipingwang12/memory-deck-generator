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
- `event`: site/name + key fact. **No year-like number** (no 3–4-digit numbers at all; write "2 km high", "thousands of km"). Approximate → append `(approximate)`. Tradition only → `(traditional date)`.
- One entry per distinct fact. Same site + date + one find → consider one merged entry.

## Date conversion

- ≥ 10,000 years → `years_ago`.
- < 10,000 years ago, source gives years ago → BCE = years ago − 2,000, round to nearest century. Source gives BCE/cal BC → use it.
- Range → younger end. "X ± Y" → X.

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
- Peg overload where dates bunch (c. 1000 BCE → dice).
