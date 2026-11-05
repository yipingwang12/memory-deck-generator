You are FIXING listed open items in existing history topic cells for a Major System date-memorization deck.
This is a fix pass: change only the entries named below (plus scope moves found by the scope sweep).
Do not add new events, except the two pending-move notes at the end.

SEARCH BUDGET: at most {budget} WebSearch calls. WebFetch does not use the budget.

## Read first
1. /Users/yipingwa/Documents/Projects/memory-deck-generator/configs/history/policy.md — the rules. The
   2026-11-05 rules are new: "Scope", the invention rule, calendar straddle = `medium`, peg overload.
2. /Users/yipingwa/Documents/Projects/memory-deck-generator/configs/history/grid.md — regions, themes,
   periods, and the new boundary rules (Finland, Constantinople, the steppe).
3. /Users/yipingwa/Documents/Projects/memory-deck-generator/configs/history/check_prompt.md — "What to
   change, per entry" and the fetchable-site notes apply here too.
Cell files: /Users/yipingwa/Documents/Projects/memory-deck-generator/configs/history/cells/. Grep for each item.

## The user has pre-authorised the whole pass
Run it end to end, then report. Never ask the user anything.

## Items
A. First public appearance (works):
- east_asia_arts_1500_1800: Jin Ping Mei → first print (1617 expected); Palace of Eternal Life → premiere (1689 expected).
- western_europe_arts_1800_1945: 9 entries are `disputed`. For each, if the dispute is only written-year
  vs premiere/publication year, use the first-public-appearance year and relabel (`high`/`medium`).
B. Start of a phase:
- latin_america_religion_pre500bce: La Galgada, Kotosh — date by the start of the phase.
- Alaca Höyük (west_asia_religion, west_asia_arts, west_asia_science pre500bce): make the cells agree
  (start of phase; west_asia_religion uses -2850). -2250 is doubtful.
- Karnak / Senusret I (north_africa cells): date the building by when building starts, not the accession year
  — unless a source gives only the accession year; then say so in `source:`.
C. Make cells agree:
- Maurya founding: world_dates.yaml -322 vs south_asia_politics_500bce_500ce -321. Settle it with sources;
  you MAY edit world_dates.yaml for this item only.
- Kanishka accession (central_asia_economy, central_asia_religion, south_asia_politics, south_asia_arts,
  all 500bce_500ce): 123 vs 127. Use the year current sources give (127 is the usual consensus); make all agree.
D. One-source dates — get a second source; if it settles the year use it, else `disputed` with both years in `source:`:
- north_america_religion_1800_1945: Cumberland Presbyterian 1810/1816, Christian Reformed 1857/1858,
  Southern Baptist Seminary 1859/1860, Andover 1807/1808.
- oceania_religion_1800_1945: Rota Waitoa 1853/1852. southeast_asia_science_1945_present: Golden Rice court 2024/2023.
- western_europe_religion_1500_1800: Tridentine Creed 1564; Way of Perfection Évora 1583.
- south_asia_economy_1500_1800: Hooghly factory 1651; Calcutta villages 1698 vs 1690.
- Guangwu slave edicts (26, 31, 35 CE) in east_asia cells: confirm against the Hou Hanshu or a scholarly page.
- subsaharan_africa_economy_1500_1800: Ouidah 1692 (doubtful).
E. Text or date:
- latin_america_religion_pre500bce: Gheo-Shih -6600 is an uncalibrated C14 date → use a calibrated date.
- Panama 1880/1881 (latin_america_economy_1800_1945 and cells that mention it): make event text match the date.
- Ai-Khanoum (central_asia cells): check the event text against a source.
- east_asia_science_500_1500: Mugujeonggwang — is "sealed" (the stupa deposit date) the right fact? Fix the text.
- subsaharan_africa_politics_1800_1945: weak 1861 JET scenes — rewrite per the scene rules.
F. Invention rule (policy.md): north_america_economy_1800_1945 McCormick reaper → demonstration year 1831.
   Apply the rule to the cases listed in the wave 4–6 notes in grid.md: north_africa_science_pre500bce,
   eastern_europe_science_1800_1945, southeast_asia_science_1945_present, oceania_science_1945_present.
   Event text must say "demonstrates" / "first flight" / "patent" etc.
G. Calendar straddle: grep every cell for `disputed` entries whose two years differ by one only because of a
   Hijri or regnal year. Relabel them `medium` with the main source's year. Do not spend searches on this.
H. Scope sweep (no searches): apply the new Scope and boundary rules.
- Nobel / prize entries (north_america_arts, north_america_science, oceania_arts, western_europe_arts,
  oceania_science): IN only if the prize work was done in the region.
- Finland entries in eastern_europe cells → western_europe. Istanbul entries in west_asia cells → eastern_europe.
- Works first published or premiered abroad by regional authors or filmmakers: now IN.
For an entry that must LEAVE a cell: delete it there and append it to
/Users/yipingwa/Documents/Projects/memory-deck-generator/configs/history/pending_moves.yaml under
`moves:` as `- {target: <cell slug>, from: <old slug>, entry: {…the full entry…}}`. If the target cell file
exists, add it there directly instead (recompute nothing: the date and peg stay). Create pending_moves.yaml
if it does not exist, with a header comment saying future cell agents read it.
Also append these two notes (entries to research later, no entry body):
`- {target: south_asia_religion_1945_present, note: "Ambedkar Nagpur conversion"}` and
`- {target: north_africa_economy_pre500bce, note: "Meroë iron smelting, 7th–6th century BCE"}`.

## Rules
- Date changes: recompute the peg from major_pegs.yaml by the digit rule, rewrite the scene, add `source:`.
- Never shift a date to keep an event in a cell; a date that leaves the period → pending_moves.yaml.
- Run deck-history-check on EVERY file you edit:
  cd /Users/yipingwa/Documents/Projects/memory-deck-generator && .venv/bin/deck-history-check <files>
  Exit 0 is required. `WARNING PEG OVERLOAD` lines are warnings; do not fix them in this pass.
- Edit only cell files, pending_moves.yaml, and world_dates.yaml (Maurya only). Do not commit.
  Scratch files only under $TMPDIR/history_fix/.
- All text in ASD-STE100 style.

## Final report (your last message; under 400 words)
- Searches used / budget.
- Per item letter: what changed, old → new (source), or "kept: <why>".
- Entries moved (from → to) and pending moves written.
- deck-history-check exit status over all cells.
