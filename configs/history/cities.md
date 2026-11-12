# City timelines — policy

Rules for `configs/history/cities/`. Procedure: `city-timeline` skill. Check: `deck-history-check`.
Everything in `policy.md` applies (entry format, confidence, date conversion, peg digits, scene method)
except what this file changes. All text in ASD-STE100 style.

## Cell = city × era

- File: `cities/<city>/<era>.yaml`, e.g. `cities/london/43_409.yaml`.
- Eras are the city's own, listed below per city. Era slug = first and last year included; negative = BCE;
  `pre<year>` for prehistory; `<year>_present` for the last era.
- Group entries by theme with `# <theme>` comments, in date order inside each group. Themes and their scope
  are the grid's six (`grid.md`): politics (here: city government, sieges, riots against the city order),
  science, religion, arts, economy, society.

## Scope

- **Area**: the whole metropolitan area as it is today (London: Greater London, all 32 boroughs and the City).
  An event in a place now inside the area counts, also before that place joined the city.
- **IN**: the event happens in the area AND the city is its subject or main stage — buildings, bridges,
  streets, docks, railways and Underground lines, fires, floods, plagues, riots, crimes, local government
  and its Acts (Metropolis Management Act, London Government Act), institutions founded in the city
  (hospitals, schools, universities, museums, societies, companies), premieres and first performances in
  the city's theatres, first exhibitions, sports clubs and events, attacks on the city (Boudica, the Blitz).
- **OUT — national events**: events that only happen in the city because it is the capital — Acts of
  Parliament about the whole country, coronations, royal births, marriages and funerals, national elections,
  treaties signed in the city, cabinet decisions, national court cases. Exception: the city is the subject
  (an Act about London, a trial for a London riot).
- Legendary dates (Brutus founding London) are left out, as policy.md says for king lists.

## Events the world grid already holds → `world_refs`, not cards

The user will not study world-grid events a second time. An event that any world cell
(`configs/history/cells/*.yaml`) already holds is NOT a card in the city file. List it under
`world_refs:` instead:

```yaml
world_refs:
  - {year: 1666, event: "Great Fire of London", cell: western_europe_society_1500_1800}
```

- `year` = the year in the world cell (never a different year; if the city sources disagree, say so in the
  report, do not change the world cell). `event` = a short label. `cell` = the world cell's slug.
- `deck-history-check` fails when the cell does not exist, holds no date of that year, or the same
  `(year, event)` is also a card.
- Grep every world cell of the city's region for the city's name and its districts, rivers and landmarks
  (London: London, Thames, Westminster, Southwark, Greenwich, Whitehall, the Tower, St Paul's, …) BEFORE the
  memory pass, so the agent knows which events are taken.
- `world_refs` sit after `dates:`, in date order. They carry no peg and no scene.

## Scenes — the city as a memory palace

- Set each scene at the real place of the event (the street, building, bridge or ward), named in the scene.
  Optional field `place:` (short, e.g. `"Pudding Lane"`) when the event text does not name it.
- A peg with many dates in one era: each scene in a different real place AND a different role.

## Cities and eras

### London (2026-11-12)
| era slug | years |
|---|---|
| `pre43` | before 43 CE (prehistory, Iron Age) |
| `43_409` | Londinium |
| `410_1065` | Saxon Lundenwic to the Conquest |
| `1066_1484` | medieval |
| `1485_1665` | Tudor and Stuart, to the eve of the Great Fire |
| `1666_1836` | Great Fire to Victoria |
| `1837_1913` | Victorian and Edwardian |
| `1914_1944` | the world wars |
| `1945_present` | post-war |
