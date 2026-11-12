# City timelines — policy

Rules for `configs/history/cities/`, for every city in "City list" below. Procedure: `city-timeline` skill.
Check: `deck-history-check`. Everything in `policy.md` applies (entry format, confidence, date conversion,
peg digits, scene method) except what this file changes. All text in ASD-STE100 style.

## Cell = city × era

- File: `cities/<city>/<era>.yaml`, e.g. `cities/london/43_409.yaml`. City slug = lowercase English name,
  underscores for spaces (`new_york`, `mexico_city`, `sao_paulo`).
- Eras are the city's own, listed in the city's section below. Era slug = first and last year included;
  negative = BCE; `pre<year>` for prehistory; `<year>_present` for the last era.
- A city with no section: before its first era, propose 6–10 eras (each about 50–300 events) and the area
  (see "Area"), get the user's yes, then add the section.
- Group entries by theme with `# <theme>` comments, in date order inside each group. Themes and their scope
  are the grid's six (`grid.md`): politics (here: city government, sieges, riots against the city order),
  science, religion, arts, economy, society. "Theme of each subject" below says which theme a city
  subject goes in.

## Scope

### Area

- The area is the whole metropolitan area as it is today, as ONE named unit in the city's section
  (London: Greater London, all 32 boroughs and the City). An event in a place now inside the area counts,
  also before that place joined the city.
- Choose a unit that the city's own statistics or government use. When two units are possible and the
  choice moves a major old site in or out of the city (Cairo: Memphis and Giza; Osaka: Kyoto and Nara;
  Tokyo: Kamakura), ask the user and write the decision in the city's section.
- An earlier city on the same site, or inside the area, is part of the timeline (Delhi: Lal Kot, Siri,
  Tughlaqabad, Shahjahanabad; Istanbul: Byzantion and Chalcedon; Mexico City: Tenochtitlan and Tlatelolco).

### IN

The event happens in the area AND the city is its subject or main stage. This includes:

- **Transport**: roads and streets, railways and railway stations, Underground and other mass transit
  lines, tram and bus networks, mass transit companies, canals, airports.
- **River and port**: docks, quays, dockyards and shipbuilding, shipping events (wrecks, first sailings).
- **Engineering works**: bridges, tunnels, embankments and other hydraulic works (flood barriers,
  reservoirs, river diversions), sewers, fresh water supply, energy supply (gas, electricity).
- **Buildings**: palaces, prisons, government buildings, city walls and forts, religious buildings,
  theatres, opera houses, concert halls, art galleries, museums, hotels, banks, markets and other
  commercial buildings. Building a palace is IN; royal ceremonies in it are OUT (national).
- **Monuments and statues**.
- **Growth**: the founding of a neighbourhood, suburb or estate; a village joins the built-up area.
- **Disasters**: fires, floods, plagues and other epidemics, earthquakes, famines, attacks on the city
  (Boudica in London, the Blitz, the 1923 Kantō earthquake in Tokyo).
- **City order**: riots, crimes, local government and each change to its structure (London: Metropolis
  Management Act, London Government Act; New York: the 1898 consolidation of the five boroughs).
- **Foundings of institutions in the city**: hospitals, schools, universities, museums, societies,
  banks, companies.
- **Culture and sport**: premieres and first performances in the city's theatres, first exhibitions,
  sports clubs and events.

### OUT — events of a higher government seated in the city

- Many cities are, or were, the seat of a government above the city: a country, an empire, a state or
  province, a church. Leave out events that only happen in the city because that government sits there:
  laws for the whole country or province, coronations, royal or imperial births, marriages and funerals,
  national and state elections, treaties signed in the city, cabinet decisions, national court cases.
  Examples: Acts of Parliament in London, Ottoman sultans' accessions in Istanbul, papal elections in Rome,
  Mughal court events in Delhi, Maharashtra state laws in Mumbai.
- Exception: the city is the subject (an Act about London, a trial for a London riot, a sultan's decree
  that rebuilds an Istanbul quarter, a pope's water supply for Rome). Then the event is IN.
- The rule applies only while the city is the seat (Kyoto before 1869, Rio de Janeiro to 1960).
- A city-state (Singapore after 1965) has no higher government: its national events are IN.
- When unsure whether the city is the subject, leave the event out and list it in the report.
- Record each notable event that this rule leaves out under `out_refs:`, after `world_refs:`, in date
  order. Reference only: no peg, no scene, no card. `reason` = a short phrase for the rule (imperial visit,
  provincial government, national army). `deck-history-check` fails when a field is missing or the same
  `(year, event)` is also a card.

```yaml
out_refs:
  - {year: 122, event: "Hadrian visits London", reason: "imperial visit"}
```

### Legendary dates

Legendary dates are left out, as policy.md says for king lists (Brutus founding London, Romulus founding
Rome in 753 BCE).

## Theme of each subject

Use this table to put a city event in a theme. It follows the grid's theme scopes (`grid.md`):
engineering is science, architecture is arts, companies are economy, disasters and education are society.
An event that fits two rows goes in the row of its main purpose (a flood is society; the embankment
built after it is science).

| theme | subjects |
|---|---|
| politics | local government and changes to its structure, government buildings, prisons, city walls and forts, sieges, attacks on the city, riots against the city order |
| science | roads, railways and stations, Underground and other mass transit lines, canals, airports, bridges, tunnels, embankments and hydraulic works, sewers, fresh water supply, energy supply, hospitals, scientific societies |
| religion | religious buildings, religious foundations and communities |
| arts | palaces, theatres, opera houses, concert halls, art galleries, museums, monuments and statues, other buildings notable for their architecture, premieres, first exhibitions |
| economy | docks, quays, dockyards and shipbuilding, shipping events, markets, banks, hotels and other commercial buildings, companies (mass transit companies included), mints, guilds |
| society | neighbourhood foundings and growth, fires, floods, plagues and epidemics, earthquakes, famines, crimes, schools and universities, sport, burials and cemeteries |

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
- The city's region is its `grid.md` region (Istanbul: eastern_europe, by the boundary rule). Grep every
  world cell of that region, and `world_dates.yaml`, for the city's names (old names too: Londinium,
  Byzantion, Constantinople, Edo, Tenochtitlan, New Amsterdam, Bombay), its districts, rivers and landmarks
  BEFORE the memory pass, so the agent knows which events are taken.
- A world event holds a city event when it is the same event, also when the city is only one of the
  event's places (a council that a London bishop attends at Arles; an emperor's visit to Britain that
  includes London) → world_ref, not card.
- `world_refs` sit after `dates:`, in date order. They carry no peg and no scene.
- Capitals lose many events to world_refs and to the OUT rule. A thin era is correct; do not pad it.
- After each wave of city eras, the main session runs the IDF duplicate scan (as for world waves,
  `grid.md`) of the new city files against the world cells. The `deck-history-check` world_ref check
  finds only an exact `(year, event)` match; a reworded duplicate card passes it.

## Archaeological dates

- Card the event itself in its own era (a burial, a written tablet, a building), not its modern discovery.
  The discovery is a separate event in the era of the discovery, only when the discovery itself is a city
  event (the London Mithraeum found in 1954 → `1945_present`).
- Tree-ring felling year (winter X/X+1): use the year that the source names. Coin-dated deposits and
  pottery-dated phases are ranges: conventional c. date, else midpoint (policy.md).

## Sources and search budget

- Do not use unauthorised copies of books (erenow.org and similar full-text mirrors). Cite a book by
  name only from a legitimate page: publisher or Google Books preview, a review, a museum or
  archaeology-unit page that quotes it.
- Search budget per era: 25 searches for a thin early era (prehistory, ancient, early medieval: about 50–80
  expected cards), 45 for a dense era. The city's era table can set another number. Do not spend the
  budget on low-value searches only to use it up.

## Scenes — the city as a memory palace

- Set each scene at the real place of the event (the street, building, bridge or ward), named in the scene.
  Optional field `place:` (short, e.g. `"Pudding Lane"`) when the event text does not name it.
- A peg with many dates in one era: each scene in a different real place AND a different role.

## City list (2026-11-12)

Major cities today with enough own history for several eras. Work order: finish London, then Tier 1 one
city at a time, then Tier 2, then Tier 3. Each city gets its section (area + eras) below when it starts.

| tier | city (slug) | region | area note for the user's decision |
|---|---|---|---|
| 1 | London (`london`) | western_europe | Greater London (decided) |
| 1 | Paris (`paris`) | western_europe | Métropole du Grand Paris or Île-de-France (Saint-Denis, Versailles) |
| 1 | Rome (`rome`) | western_europe | Roma Capitale or the metropolitan city (Ostia, Tivoli); Vatican: Holy See events OUT |
| 1 | Istanbul (`istanbul`) | eastern_europe | Istanbul Province, both shores |
| 1 | Moscow (`moscow`) | eastern_europe | Moscow city or with Moscow Oblast |
| 1 | Cairo (`cairo`) | north_africa | Greater Cairo: Memphis, Giza, Saqqara in or out |
| 1 | Beijing (`beijing`) | east_asia | Beijing Municipality (Zhoukoudian) |
| 1 | Tokyo (`tokyo`) | east_asia | Tokyo Metropolis or Greater Tokyo (Yokohama, Kamakura) |
| 1 | Delhi (`delhi`) | south_asia | NCT of Delhi or the National Capital Region |
| 1 | New York (`new_york`) | north_america | five boroughs or the metropolitan area (Newark, Long Island) |
| 1 | Mexico City (`mexico_city`) | latin_america | Mexico City or the Valley of Mexico metro (Teotihuacan) |
| 2 | Shanghai (`shanghai`) | east_asia | Shanghai Municipality |
| 2 | Seoul (`seoul`) | east_asia | Seoul or the Seoul Capital Area (Incheon, Suwon) |
| 2 | Osaka (`osaka`) | east_asia | Osaka Prefecture or Keihanshin (Kyoto, Kobe, Nara) |
| 2 | Mumbai (`mumbai`) | south_asia | Mumbai Metropolitan Region (Elephanta, Thane) |
| 2 | Kolkata (`kolkata`) | south_asia | Kolkata Metropolitan Area |
| 2 | Bangkok (`bangkok`) | southeast_asia | Bangkok or the metro region (Thonburi is inside either) |
| 2 | Jakarta (`jakarta`) | southeast_asia | Jakarta or Jabodetabek |
| 2 | Tehran (`tehran`) | west_asia | Tehran Province (Rey) |
| 2 | Berlin (`berlin`) | western_europe | Berlin or the capital region (Potsdam) |
| 2 | Madrid (`madrid`) | western_europe | Community of Madrid (Alcalá de Henares, El Escorial) |
| 2 | Chicago (`chicago`) | north_america | city or the metropolitan area |
| 2 | São Paulo (`sao_paulo`) | latin_america | metropolitan region |
| 3 | Lagos (`lagos`) | subsaharan_africa | Lagos State |
| 3 | Johannesburg (`johannesburg`) | subsaharan_africa | city or Gauteng (Pretoria, Cradle of Humankind) |
| 3 | Buenos Aires (`buenos_aires`) | latin_america | city or Greater Buenos Aires |
| 3 | Los Angeles (`los_angeles`) | north_america | county or the metropolitan area |
| 3 | Sydney (`sydney`) | oceania | Greater Sydney |
| 3 | Singapore (`singapore`) | southeast_asia | the island state (city-state rule) |
| 3 | Baghdad (`baghdad`) | west_asia | Baghdad Governorate (Ctesiphon in or out) |

Not on the list: historic cities that are not major today (Jerusalem, Kyoto, Xi'an, Athens, Venice,
Samarkand); megacities with little old history (Karachi, Dhaka, Kinshasa, Shenzhen). Central Asia has no
city here; Tashkent is the best one if the user wants the region.

## Cities and eras

### London (2026-11-12)

Area: Greater London, all 32 boroughs and the City.

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
