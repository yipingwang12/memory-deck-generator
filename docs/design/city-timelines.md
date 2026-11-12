# City timelines — design discussion (2026-11-12)

A variation of the world-history grid (PRD §15): a timeline of dated events for ONE city, with the
same Major System pegs and scenes. London is the first city.

## Decisions by the user

| Question | Decision |
|---|---|
| National events that happen in a capital (Acts of Parliament, coronations, treaties, cabinet decisions) | **Out.** Only events where the city is the subject or the main stage. |
| Area | **Today's metropolitan area** (London: Greater London). An event counts if its place is inside the area now. |
| Events that the world grid already holds | **No card.** A short `world_refs` entry (year, label, world cell slug) only. The user will not study these cards a second time; the list is for reference. |

## Design

- **Cell = city × era.** One file per era: `configs/history/cities/<city>/<era>.yaml`. The city's own eras,
  not the grid's six periods. Entries are grouped by theme (the grid's six themes).
  London has 9 eras: `pre43`, `43_409`, `410_1065`, `1066_1484`, `1485_1665`, `1666_1836`, `1837_1913`,
  `1914_1944`, `1945_present`.
- **Same entry format and rules** as the world grid (`policy.md`): peg fixed by the digit rule, METHOD v2
  scenes, confidence labels, date conversion.
- **City as a memory palace.** Each scene is set at the real place of the event. Optional `place:` field.
- **`world_refs`** sit after `dates:` and carry no peg or scene:
  `{year: 1666, event: "Great Fire of London", cell: western_europe_society_1500_1800}`. The year is
  always the world cell's year.
- **Separate skill** `city-timeline` (Projects/.claude/skills), so the `history-cell` procedure for the
  104 unbuilt world cells does not change.

## What was built (branch `feat/city-timeline`, commit eae4707, not pushed)

- `configs/history/cities.md` — city rules: scope, area, world_refs, scenes, era table per city.
- `configs/history/city_agent_prompt.md` — agent brief. It reuses the scene, search and check sections of
  `agent_prompt.md`. Step 0: grep the world cells of the city's region for the city, districts, rivers and
  landmarks before the memory pass.
- `deck-history-check --cells` — `world_ref_problems`: fails when a world_ref names a cell that does not
  exist, a cell with no date in that year, or an event that is also a card. Tests on the local
  `feat/city-timeline-tests` branch (366 pass).

## Pilot: London 43–409 (Londinium)

One Opus agent, 45 searches. 52 cards (expected 70) + 10 world_refs; high 6, medium 41, low 5;
check exit 0. File `configs/history/cities/london/43_409.yaml`.

Agent findings:
1. The main source (Perring, *London in the Roman World*, 2022) was read on erenow.org, which looks like
   an unauthorised copy of the book.
2. The budget of 45 searches is too large for a thin era; "spend the whole budget" forced low-value searches.
3. `cities.md` did not say if a world event "holds" a city event when the city is only one of its places
   (Arles bishops, Constans, the Severan split). The agent made them world_refs.
4. The world_ref check catches only an exact (year, event) match; a reworded duplicate card passes.
5. No rule for archaeological dates: tree-ring felling years, coin-dated deposits, the ancient act versus
   its modern discovery. The agent carded the ancient act.
6. Scene rules (`place:`, real place, 25 words) are not machine-checked; two scenes are weak.
7. Year conflicts with world cells (Theodosius 369 vs 367–8, Severan split 211 vs c. 197/8 or 213/14):
   world_refs keep the world year.

## Fixes before the other 8 London eras (approved by the user 2026-11-12; now in cities.md)

1. Ban unauthorised book mirrors (erenow.org and similar) in the brief.
2. Budget per era: 25 searches for thin early eras, 45 for dense later eras.
3. Rule: a world event holds a city event when it is the same event, also when the city is one of
   several places → world_ref.
4. Rule: a city era cards the event itself (a burial, a tablet); the modern discovery goes in the era of
   the discovery (London Mithraeum found 1954 → `1945_present`).
5. After each wave, run the IDF duplicate scan (city files vs world cells) for reworded duplicates.

## Open questions for the user

- Perring dates sourced only from erenow.org: re-check against legitimate pages, or keep and cite the
  book by name?
- Approve the fixes above and run the 8 remaining London eras as one wave?

## Rebuild of London 43–409 (2026-11-12)

- cities.md now covers all cities: area unit per city, OUT rule for any higher government (empire, state,
  church), city-state rule, an IN list by subject, a theme table, and a 30-city list in three tiers.
- New `out_refs:` list (year, event, reason): events the OUT rule leaves out, reference only.
  `deck-history-check` checks the fields and that no out_ref is also a card.
- Rebuilt in the main session, 25 searches, no erenow.org: 59 cards (high 8, medium 39, low 5, disputed 3,
  unverified 4) + 10 world_refs + 3 out_refs (Hadrian's visit, the vicarius seat, Lupicinus).
- Pilot dates corrected by the web check: Gresham St bucket chain 63 → 110 (Museum of London); Fortunata
  90 → c. 100; riverside wall 275 → c. 270; Huggin Hill baths 83 → c. 78; Walbrook skulls 150 → c. 140;
  Drapers' Gardens 380 → c. 390; Southwark courtyard building 74 → c. 72; Colchester House 350 → c. 375.
- Unverified (Perring-only, no legitimate source found): first stone temples (108), warehouse fire (155),
  amphitheatre drains and games (243), Southwark settlement (50).
