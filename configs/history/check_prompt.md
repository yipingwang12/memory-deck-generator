You are CHECKING one existing history topic cell for a Major System date-memorization deck.
This is a checking-only pass: verify dates that are already in the cell. Do not add new events.

CELL FILE: /Users/yipingwa/Documents/Projects/memory-deck-generator/configs/history/cells/{slug}.yaml
SEARCH BUDGET: at most {budget} WebSearch calls ({unverified} entries are `unverified`).

## Read first
1. /Users/yipingwa/Documents/Projects/memory-deck-generator/configs/history/policy.md — the rules. Follow them exactly.
2. /Users/yipingwa/Documents/Projects/memory-deck-generator/configs/history/grid.md — region, theme and period scope.
3. The cell file.

## The user has pre-authorised the whole pass
Run it end to end, then report. Never ask the user anything.

## How to verify efficiently
- WebSearch is capped per session and SHARED by about 20 agents running in parallel. Never go over your budget.
  If a search is refused, stop searching and finish with what you have.
- WebFetch does NOT use the search budget. One good page (a timeline, a chronology, an encyclopedia
  article, a museum or university page) can confirm many entries. So: search to FIND such pages,
  then fetch them and confirm every entry the page covers. Batch related entries into one search.
- Load tools with ToolSearch ("select:WebSearch,WebFetch") if they are deferred. Use "standard" search mode.
- Wikimedia sites (Wikipedia, Wikidata, and the rest) are blocked at the network layer — do not try them.
  Prefer Britannica, journal, museum, university, government and reference pages.
- Wave A found which sites WebFetch can read. Works: encyclopedia.com, encyclopediaofukraine.com,
  worldhistory.org (some pages), arce.org, state.gov. Refuses (403 / bot check): britannica.com,
  metmuseum.org, smarthistory.org, britishmuseum.org, ucl.ac.uk, loc.gov. A refused site still
  counts as a source from its search-result summary; do not try to fetch it. Fetch encyclopedia.com first.
- A machine sleep can kill you. Save your progress to the cell file every 30 or so entries.

## What to change, per entry
- Source confirms the date → `confidence: high` (or `medium` if the source is close or gives several values;
  `disputed` if sources disagree in print). Add `source: "<site or work, short>"` to the entry, e.g.
  `source: "Britannica: Treaty of Andrusovo"`. Keep the source string short (under 60 characters).
- Source gives a DIFFERENT date → correct `year` (and `years_ago`), apply the date-conversion rules,
  recompute the peg from `major_pegs.yaml` by the digit rule (never choose by hand), and rewrite the
  scene for the new peg per the scene rules. Record each correction for the report.
- Corrected date falls OUTSIDE the cell's period → delete the entry from this cell and list it in the
  report (old date, new date, source). Never shift a date to keep an event in a cell.
- Event is clearly outside the cell's region or theme → leave it, but list it in the report.
- No source found → keep `confidence: unverified`. Never drop an entry only because it is unverified.
- An entry that is already `high`/`medium`/`low`/`disputed` and has no `source:` — confirm it too if a
  fetched page covers it, and add the source. Do not spend searches only on these.
- Event text must keep the policy rules (no year-like numbers; `(approximate)` / `(traditional date)` markers).
- Do not reorder, rename or restyle entries you did not change. Keep the file layout and header.
  Add one header comment line: `# Check pass {date}: <n> entries confirmed, <m> corrected.`

## Check
cd /Users/yipingwa/Documents/Projects/memory-deck-generator && .venv/bin/deck-history-check configs/history/cells/{slug}.yaml
Exit 0 is required. Fix every problem it prints and re-run.
Write ONLY your one cell file. Do not edit any other file. Do not commit. Use your own scratch files only
under $TMPDIR/{slug}/ — other agents run at the same time.

## Final report (your last message; under 250 words)
- Searches used / budget; pages fetched.
- Confidence counts before → after (high/medium/low/disputed/unverified).
- Date corrections: old → new (source), max 10 lines.
- Entries deleted as outside the period; entries flagged as outside the region or theme.
- deck-history-check exit status.
All text in ASD-STE100 style.
