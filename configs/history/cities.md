# City timelines — policy

Rules for `configs/history/cities/`, for every city in "City list" below. Procedure: `city-timeline` skill.
Check: `deck-history-check`. Everything in `policy.md` applies (entry format, confidence, date conversion,
peg digits, scene method) except what this file changes. All text in ASD-STE100 style.

## Cell = city × era

- File: `cities/<city>/<era>.yaml`, e.g. `cities/london/43_409.yaml`. City slug = lowercase English name,
  underscores for spaces (`new_york`, `mexico_city`, `sao_paulo`).
- Eras are the city's own, listed in the city's section below. Era slug = first and last year included;
  BCE years take a `bce` suffix (`52bce_485`, `pre52bce`), never a minus sign; `pre<year>` for prehistory; `<year>_present` for the last era.
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
- City as main stage (user rule 2026-11-19): a national event whose stage is the city's streets, buildings
  and people is IN as a card, even when a higher government acts: occupations, public executions and
  burnings, mass protests and riots, assassinations and attacks in the city, sieges. The London and Paris
  borderline cards are the examples.
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
- After each wave of city eras, the main session runs the duplicate scan
  `.venv/bin/deck-history-dups configs/history/cities/<city>/*.yaml` and decides each candidate pair
  (reworded duplicate → world_ref; different aspect → keep). The `deck-history-check` world_ref check
  finds only an exact `(year, event)` match; a reworded duplicate card passes it. The scan compares
  each card with world dates and other city eras' cards of a near year (TF-IDF cosine ≥ 0.35, or two
  shared rare words). It misses paraphrases that share no word and dates that differ by more than
  its window (±2 years after 1000, ±5 before, wider BCE; doubled for approximate dates).

## Archaeological dates

- Card the event itself in its own era (a burial, a written tablet, a building), not its modern discovery.
  The discovery is a separate event in the era of the discovery, only when the discovery itself is a city
  event (the London Mithraeum found in 1954 → `1945_present`).
- Tree-ring felling year (winter X/X+1): use the year that the source names. Coin-dated deposits and
  pottery-dated phases are ranges: conventional c. date, else midpoint (policy.md).
- Radiocarbon: calibrated date first; a card with only an uncalibrated BP date is `disputed` (policy.md, 2026-11-19).

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
| 1 | Paris (`paris`) | western_europe | Île-de-France (decided) |
| 1 | Rome (`rome`) | western_europe | Metropolitan City of Rome Capital (decided) |
| 1 | Istanbul (`istanbul`) | eastern_europe | Istanbul Province, both shores (decided) |
| 1 | Moscow (`moscow`) | eastern_europe | Moscow city + Moscow Oblast (Trinity Lavra, New Jerusalem, Borodino) (decided 2026-11-19) |
| 1 | Cairo (`cairo`) | north_africa | Greater Cairo (Cairo + Giza governorates) with Memphis, Saqqara, Dahshur (decided 2026-11-19) |
| 1 | Beijing (`beijing`) | east_asia | Beijing Municipality (Zhoukoudian, Ming Tombs, Great Wall sections) (decided 2026-11-19) |
| 1 | Tokyo (`tokyo`) | east_asia | Tokyo Metropolis (23 wards, Tama, islands); Kamakura and Yokohama out (decided 2026-11-19) |
| 1 | Delhi (`delhi`) | south_asia | National Capital Region (NCT + Gurgaon, Noida, Faridabad, Ghaziabad) (decided 2026-11-19) |
| 1 | New York (`new_york`) | north_america | metropolitan area (five boroughs, Long Island, Westchester, northern New Jersey) (decided 2026-11-19) |
| 1 | Mexico City (`mexico_city`) | latin_america | Valley of Mexico metro (CDMX + State of Mexico metro: Teotihuacan, Texcoco, Tenayuca) (decided 2026-11-19) |
| 2 | Shanghai (`shanghai`) | east_asia | Shanghai Municipality (decided 2026-11-19) |
| 2 | Seoul (`seoul`) | east_asia | Seoul Capital Area (Seoul, Incheon, Gyeonggi: Suwon, Ganghwa, Namhansanseong) (decided 2026-11-19) |
| 2 | Osaka (`osaka`) | east_asia | Osaka Prefecture (Sakai, Mozu-Furuichi); Kyoto, Nara, Kobe out (decided 2026-11-19) |
| 2 | Mumbai (`mumbai`) | south_asia | Mumbai Metropolitan Region (Elephanta, Kanheri, Thane, Sopara, Vasai) (decided 2026-11-19) |
| 2 | Kolkata (`kolkata`) | south_asia | Kolkata Metropolitan Area (Howrah, Serampore, Chandannagar, Chinsurah, Barrackpore) (decided 2026-11-19) |
| 2 | Bangkok (`bangkok`) | southeast_asia | Bangkok Metropolitan Region (with Thonburi and the ring provinces); Ayutthaya out (decided 2026-11-19) |
| 2 | Jakarta (`jakarta`) | southeast_asia | Jabodetabek (Bogor, Tangerang, Bekasi) (decided 2026-11-19) |
| 2 | Tehran (`tehran`) | west_asia | Tehran Province (Rey, Varamin, Damavand) (decided 2026-11-19) |
| 2 | Berlin (`berlin`) | western_europe | Berlin + Potsdam (decided 2026-11-19) |
| 2 | Madrid (`madrid`) | western_europe | Community of Madrid (Alcalá de Henares, El Escorial, Aranjuez) (decided 2026-11-19) |
| 2 | Chicago (`chicago`) | north_america | metropolitan area (Cook and collar counties, northwest Indiana) (decided 2026-11-19) |
| 2 | São Paulo (`sao_paulo`) | latin_america | metropolitan region + Santos and São Vicente (decided 2026-11-19) |
| 3 | Lagos (`lagos`) | subsaharan_africa | Lagos State (Badagry, Epe, Ikorodu) (decided 2026-11-19) |
| 3 | Johannesburg (`johannesburg`) | subsaharan_africa | Gauteng Province (Pretoria, Soweto, Sharpeville, Cradle of Humankind) (decided 2026-11-19) |
| 3 | Buenos Aires (`buenos_aires`) | latin_america | Greater Buenos Aires (CABA + conurbation) (decided 2026-11-19) |
| 3 | Los Angeles (`los_angeles`) | north_america | metropolitan area (LA, Orange and Inland Empire counties) (decided 2026-11-19) |
| 3 | Sydney (`sydney`) | oceania | Greater Sydney + Blue Mountains + Wollongong (decided 2026-11-19) |
| 3 | Singapore (`singapore`) | southeast_asia | Singapore island + Johor Bahru (city-state rule for Singapore from 1965; Johor state seat rule) (decided 2026-11-19) |
| 3 | Baghdad (`baghdad`) | west_asia | Baghdad Governorate + Ctesiphon and Seleucia on the Tigris (decided 2026-11-19) |

Not on the list: historic cities that are not major today (Jerusalem, Kyoto, Xi'an, Athens, Venice,
Samarkand); megacities with little old history (Karachi, Dhaka, Kinshasa, Shenzhen). Central Asia has no
city here; Tashkent is the best one if the user wants the region.

### Moscow (2026-11-19)

Area: Moscow city and Moscow Oblast (user's choice): the city in its 2012 borders, Kolomenskoye,
Tsaritsyno, and the Oblast: Sergiyev Posad (Trinity Lavra), Istra (New Jerusalem), Borodino, Abramtsevo,
Kolomna, Zvenigorod, Dmitrov, Dubna, Korolyov, Zelenograd. Region: eastern_europe.

- The OUT rule covers the grand princes' and tsars' court while Moscow is the seat (about 1328–1712, and
  1728–1730 when Peter II's court returns) and the Soviet and Russian governments from March 1918:
  accessions, coronations, court weddings and funerals, decrees and laws for the whole state, Party
  congresses, national elections, treaties. Coronations in the Kremlin stay OUT also while St Petersburg
  is the capital. A ruler's building, walls, fire relief, city plan or Metro is IN.
- The Metropolitan and later Patriarch of Moscow is treated like the Holy See: councils, synods,
  elections and church-wide reforms are OUT unless the city is the subject. Building a church or
  monastery (the Trinity Lavra, New Jerusalem) is IN; a ceremony in it is OUT.
- Main stage (IN as cards): sacks and sieges (1382, 1571, 1610–1612), the Salt, Copper and Plague riots,
  the Streltsy risings, the 1812 fire and the Battle of Borodino (inside the area), 1905, the October
  fighting of 1917, the 1941 battle for Moscow, purges and show trials as city events only when the
  city is the subject, the 1991 coup and the 1993 crisis in the streets, attacks in the city.

| era slug | years | searches | expected cards |
|---|---|---|---|
| `pre1147` | prehistory, Fatyanovo and Dyakovo cultures, the Vyatichi | 25 | ~50 |
| `1147_1460` | first mention to the eve of Ivan III | 45 | ~150 |
| `1461_1612` | Ivan III to the end of the Time of Troubles | 45 | ~200 |
| `1613_1711` | early Romanovs to the capital's move | 45 | ~200 |
| `1712_1812` | the old capital to the fire of 1812 | 45 | ~180 |
| `1813_1917` | rebuilding to the revolution | 45 | ~250 |
| `1918_1940` | Soviet capital to the eve of war | 45 | ~180 |
| `1941_1991` | the war to the end of the Soviet Union | 45 | ~220 |
| `1992_present` | post-Soviet | 45 | ~200 |

Expected cards are a guide, not a target.

## Planned eras for the remaining cities (approved 2026-11-19)

Area for each city: City list. Each era runs from its start to the year before the next one. Budgets:
the first era (prehistory and early sites) 25 searches, every later era 45. Expected cards: about 50 for
the first era and 150–250 for later eras (London, Paris and Rome yields); a guide, not a target. When a
city starts, its full section (area notes, OUT rules for its seats of government) is added above.

- **Moscow (`moscow`)**: `pre1147`, `1147_1460`, `1461_1612`, `1613_1711`, `1712_1812`, `1813_1917`, `1918_1940`, `1941_1991`, `1992_present`
- **Cairo (`cairo`)**: `pre3100bce`, `3100bce_2181bce`, `2180bce_332bce`, `331bce_640`, `641_968`, `969_1249`, `1250_1516`, `1517_1797`, `1798_1922`, `1923_present`
- **Beijing (`beijing`)**: `pre1045bce`, `1045bce_937`, `938_1271`, `1272_1420`, `1421_1643`, `1644_1860`, `1861_1927`, `1928_1948`, `1949_1976`, `1977_present`
- **Tokyo (`tokyo`)**: `pre1457`, `1457_1602`, `1603_1715`, `1716_1867`, `1868_1922`, `1923_1945`, `1946_1989`, `1990_present`
- **Delhi (`delhi`)**: `pre1060`, `1060_1205`, `1206_1525`, `1526_1707`, `1708_1857`, `1858_1946`, `1947_1983`, `1984_present`
- **New York (`new_york`)**: `pre1609`, `1609_1782`, `1783_1860`, `1861_1897`, `1898_1929`, `1930_1964`, `1965_2000`, `2001_present`
- **Mexico City (`mexico_city`)**: `pre100bce`, `100bce_1324`, `1325_1520`, `1521_1699`, `1700_1820`, `1821_1910`, `1911_1967`, `1968_present`
- **Shanghai (`shanghai`)**: `pre1292`, `1292_1842`, `1843_1926`, `1927_1949`, `1950_1990`, `1991_present`
- **Seoul (`seoul`)**: `pre1392`, `1392_1591`, `1592_1875`, `1876_1909`, `1910_1945`, `1946_1987`, `1988_present`
- **Osaka (`osaka`)**: `pre645`, `645_1495`, `1496_1614`, `1615_1867`, `1868_1944`, `1945_present`
- **Mumbai (`mumbai`)**: `pre1534`, `1534_1667`, `1668_1856`, `1857_1946`, `1947_1991`, `1992_present`
- **Kolkata (`kolkata`)**: `pre1690`, `1690_1856`, `1857_1910`, `1911_1946`, `1947_present`
- **Bangkok (`bangkok`)**: `pre1767`, `1767_1867`, `1868_1931`, `1932_1972`, `1973_present`
- **Jakarta (`jakarta`)**: `pre1527`, `1527_1799`, `1800_1941`, `1942_1965`, `1966_present`
- **Tehran (`tehran`)**: `pre1220`, `1220_1785`, `1786_1924`, `1925_1978`, `1979_present`
- **Berlin (`berlin`)**: `pre1237`, `1237_1700`, `1701_1870`, `1871_1918`, `1919_1945`, `1946_1989`, `1990_present`
- **Madrid (`madrid`)**: `pre1561`, `1561_1807`, `1808_1930`, `1931_1975`, `1976_present`
- **Chicago (`chicago`)**: `pre1833`, `1833_1871`, `1872_1918`, `1919_1955`, `1956_present`
- **São Paulo (`sao_paulo`)**: `pre1554`, `1554_1821`, `1822_1929`, `1930_1984`, `1985_present`
- **Lagos (`lagos`)**: `pre1861`, `1861_1959`, `1960_1990`, `1991_present`
- **Johannesburg (`johannesburg`)**: `pre1886`, `1886_1947`, `1948_1993`, `1994_present`
- **Buenos Aires (`buenos_aires`)**: `pre1810`, `1810_1879`, `1880_1945`, `1946_1983`, `1984_present`
- **Los Angeles (`los_angeles`)**: `pre1781`, `1781_1849`, `1850_1919`, `1920_1964`, `1965_present`
- **Sydney (`sydney`)**: `pre1788`, `1788_1850`, `1851_1913`, `1914_1969`, `1970_present`
- **Singapore (`singapore`)**: `pre1819`, `1819_1941`, `1942_1964`, `1965_present`
- **Baghdad (`baghdad`)**: `pre762`, `762_1257`, `1258_1916`, `1917_1978`, `1979_present`

## Further cities after the 30 (proposed 2026-11-19, areas and eras not yet chosen)

Order: Group A first (Kano and Marrakech before the rest: the user's city-history volumes exist), then
Group B, then Group C. Historic cities give many world_refs and fewer cards (Rome ~2/3 of expected).

- **A, historic cities, not major today**: Kano, Marrakech, Jerusalem, Athens, Kyoto, Xi'an, Venice,
  Vienna, St Petersburg, Isfahan, Samarkand, Damascus.
- **B, regional gaps**: Addis Ababa, Timbuktu, Kinshasa, Lima (Cusco in or separate), Havana, Hanoi,
  Manila, Lahore or Varanasi, Boston, Quebec City.
- **C, more depth**: Florence, Amsterdam, Prague, Lisbon, Kyiv, Edinburgh, Kraków, Budapest, Barcelona;
  Alexandria, Carthage–Tunis, Cape Town, Zanzibar or Mombasa; Rio de Janeiro, Philadelphia, Cusco,
  Montreal, Washington; Nanjing, Hangzhou, Hong Kong, Kathmandu, Yangon; Melbourne.
- **D, GaWC 2024 Alpha tier and former giants** (user 2026-11-19: add the full Alpha tier): every Alpha++,
  Alpha+, Alpha and Alpha− city not already listed: Dubai, Milan, Toronto, Frankfurt, Warsaw, Guangzhou,
  Kuala Lumpur, Luxembourg, Taipei, Shenzhen, Brussels, Zurich, San Francisco, Riyadh, Santiago,
  Düsseldorf, Stockholm, Munich, Dublin, Houston; plus Dhaka (UN #2 by population), Kaifeng, Córdoba,
  Patna (Pataliputra). Several Alpha business hubs have thin city history: expect few eras.

## Cities and eras

### London (2026-11-12)

Area: Greater London, all 32 boroughs and the City.

| era slug | years | searches | expected cards |
|---|---|---|---|
| `pre43` | before 43 CE (prehistory, Iron Age) | 25 | ~50 |
| `43_409` | Londinium | 25 | ~70 (built: 59) |
| `410_1065` | Saxon Lundenwic to the Conquest | 25 | ~70 |
| `1066_1484` | medieval | 45 | ~150 |
| `1485_1665` | Tudor and Stuart, to the eve of the Great Fire | 45 | ~200 |
| `1666_1836` | Great Fire to Victoria | 45 | ~250 |
| `1837_1913` | Victorian and Edwardian | 45 | ~300 |
| `1914_1944` | the world wars | 45 | ~150 |
| `1945_present` | post-war | 45 | ~250 |

Expected cards are a guide, not a target (capital: many events go to world_refs and out_refs).
The 4 unverified Londinium cards stay (user, 2026-11-19).

### Paris (2026-11-19)

Area: Île-de-France, the whole region (user's choice): Paris, the inner and outer départements,
Saint-Denis, Vincennes, Versailles, Saint-Germain-en-Laye, Fontainebleau. Region: western_europe.

- The OUT rule covers the royal and imperial court wherever it sits in the area: Paris, and
  Versailles while the court lives there (1682–1789). Building a palace, park or basilica is IN;
  royal ceremonies, births, marriages and burials in it (Saint-Denis royal burials) are OUT.
- A BCE era slug uses the `bce` suffix, because a file name cannot start with `-`.

| era slug | years | searches | expected cards |
|---|---|---|---|
| `pre52bce` | before 52 BCE (prehistory, the Parisii) | 25 | ~40 |
| `52bce_485` | Lutetia (Roman), 52 BCE–485 | 25 | ~60 |
| `486_986` | Merovingian and Carolingian | 25 | ~70 |
| `987_1328` | Capetian | 45 | ~180 |
| `1329_1588` | Valois, Hundred Years' War, Wars of Religion | 45 | ~220 |
| `1589_1788` | Bourbon, to the eve of the Revolution | 45 | ~300 |
| `1789_1851` | Revolution to the Second Republic | 45 | ~280 |
| `1852_1913` | Haussmann, the Commune, Belle Époque | 45 | ~350 |
| `1914_1944` | the world wars | 45 | ~220 |
| `1945_present` | post-war | 45 | ~300 |

Expected cards are a guide, not a target.

### Rome (2026-11-19)

Area: the Metropolitan City of Rome Capital (user's choice): Rome, Ostia and Portus, Tivoli and
Hadrian's Villa, the Castelli Romani and Castel Gandolfo, Veii, Palestrina (Praeneste), Civitavecchia.
Vatican City is inside the area. Region: western_europe.

- Republic (509–27 BCE), user rule: the city is the subject only. Laws of the Senate and assemblies for
  Italy and the provinces, wars, treaties, triumphs for foreign wars and provincial commands are OUT.
  City laws, buildings, roads and aqueducts that start in Rome, fires, floods, riots, street violence
  and murders in the city (the Gracchi, Clodius) are IN.
- Emperors: the OUT rule covers the imperial court (accessions, births, imperial funerals). An emperor's
  building, games, fire relief or city law is IN.
- Holy See and papal acts are OUT unless the city is the subject (papal elections, bulls, councils,
  canonisations OUT; a pope's walls, streets, fountains, aqueducts, a Jubilee's works in Rome IN).
  Building a basilica is IN; a ceremony in it is OUT, as for Paris.
- The traditional dates of the kings and of the founding are legendary (Legendary dates): OUT. Cards for
  the regal period come from archaeology (Latial culture, Forum drainage, the first temples).

| era slug | years | searches | expected cards |
|---|---|---|---|
| `pre509bce` | prehistory, Latial culture, the regal period | 25 | ~70 |
| `509bce_31bce` | Republic (city-subject only) | 45 | ~220 |
| `30bce_284` | Principate, Augustus to Diocletian | 45 | ~300 |
| `285_800` | late empire, Goths, Byzantines, papal city to Charlemagne | 45 | ~200 |
| `801_1308` | medieval commune, Senate, Saracens, Normans, Jubilee of 1300 | 45 | ~170 |
| `1309_1526` | Avignon, the return, Renaissance popes | 45 | ~220 |
| `1527_1797` | Sack of Rome to the Baroque | 45 | ~300 |
| `1798_1870` | Roman Republics, French rule, Risorgimento | 45 | ~200 |
| `1871_1944` | capital of Italy, Fascism, the war | 45 | ~280 |
| `1945_present` | post-war | 45 | ~300 |

Expected cards are a guide, not a target.

### Istanbul (2026-11-19)

Area: the whole of Istanbul Province, both shores (user's choice): the historic peninsula, Galata and
Pera, the Bosphorus villages, Üsküdar (Chrysopolis), Kadıköy (Chalcedon), the Princes' Islands,
Yarımburgaz, Küçükçekmece, Silivri, Şile. Region: eastern_europe; the grid also files Istanbul events
under west_asia, so Step 0 greps both `eastern_europe_*` and `west_asia_*` cells.

- The OUT rule covers the Roman, Byzantine and Ottoman courts while the city is the capital (330–1922,
  except 1204–1261 for the Byzantine court, when the Latin emperors' court is OUT instead): accessions,
  coronations, imperial births, marriages and funerals, palace coups with no street fighting, laws for
  the empire. An emperor's or sultan's building, water supply, fire relief or city law is IN. Riots,
  sieges, janissary revolts in the streets and massacres are IN (main-stage rule).
- The Ecumenical Patriarchate is treated like the Holy See: councils, synods and patriarchal elections
  are OUT unless the city is the subject. Building a church or mosque is IN; a ceremony in it is OUT.
- After 1923 Ankara is the capital: Istanbul is no longer the seat, so national events that take place
  in the city are IN.

| era slug | years | searches | expected cards |
|---|---|---|---|
| `pre667bce` | prehistory: Yarımburgaz, Fikirtepe, Yenikapı Neolithic, Bronze Age | 25 | ~50 |
| `667bce_329` | Greek and Roman Byzantion | 25 | ~70 |
| `330_716` | Constantinople to the Arab siege | 45 | ~200 |
| `717_1203` | middle Byzantine | 45 | ~180 |
| `1204_1452` | Latin Empire, the Palaiologan city | 45 | ~150 |
| `1453_1565` | the conquest to Suleiman | 45 | ~220 |
| `1566_1807` | later classical Ottoman, the Tulip Era | 45 | ~250 |
| `1808_1922` | reform, the Tanzimat, the end of the empire | 45 | ~300 |
| `1923_1979` | the Republic, the city after the capital moves | 45 | ~200 |
| `1980_present` | the megacity | 45 | ~250 |

Expected cards are a guide, not a target.

### Cairo (2026-11-19)

Area: Greater Cairo (Cairo and Giza governorates) with Memphis, Saqqara, Dahshur and Abusir (user's
choice): Heliopolis (Iunu), Giza, Old Cairo (Babylon fortress, Fustat), al-Qata'i and al-Askar, Fatimid
al-Qahira, the Citadel, Bulaq, Helwan, Maadi, the Maadi and Omari prehistoric sites, the new cities (6th of
October, New Cairo). Region: north_africa.

- Ancient chronology: use one system for the whole city, the Oxford History of Ancient Egypt (Shaw 2000),
  and write other dates in the source note. A king's date that rests on reign lengths is `approximate`.
  Radiocarbon follows cities.md "Archaeological dates".
- The OUT rule covers the kings' court while Memphis is the capital (Early Dynastic and Old Kingdom,
  about 3000–2181 BCE, and later royal residence periods): accessions, jubilees, royal marriages and
  funerals, decrees for the whole of Egypt, campaigns abroad. Pyramids, temples, tombs, the Apis burials
  at the Serapeum and works for Memphis or Heliopolis are IN. Ptolemaic and Roman Egypt is ruled from
  Alexandria: Memphis and Babylon events are IN; acts of the Alexandrian court are OUT unless the city is
  the subject.
- From 641 the city is the seat of Egypt's government: the Umayyad and Abbasid governors (provincial
  government OUT), the Tulunids, the Ikhshidids, the Fatimid caliphs, the Ayyubids, the Mamluk sultans
  and the Abbasid shadow caliphs (1261–1517), the Ottoman pashas, the khedives, the British agency, the
  kings and the republic. Leave out their accessions, court events, laws for all of Egypt, treaties,
  national elections and national court cases. A ruler's mosque, wall, gate, citadel, canal, hospital,
  market, city law or fire and plague relief is IN.
- Al-Azhar and the Coptic Patriarchate (in the city from the 11th century) are treated like the Holy
  See: fatwas, councils and patriarchal elections are OUT unless the city is the subject. Building a
  mosque, church or monastery is IN; a ceremony in it is OUT.
- Main stage (IN as cards): the Arab siege of Babylon (640–641), the burning of Fustat (1168), plagues
  and famines in the city, the Cairo revolts of 1798 and 1800, the massacre of the Mamluks at the
  Citadel (1811), the 1882 occupation, the 1919 revolution in the streets, the Cairo fire (1952), the
  1977 bread riots, the 1986 conscript riot, attacks in the city, the 2011 Tahrir protests, the 2013
  Rabaa and Nahda sit-ins and their clearing.

| era slug | years | searches | expected cards |
|---|---|---|---|
| `pre3100bce` | Palaeolithic, Neolithic, Omari, Maadi and Heliopolis cultures | 25 | ~50 |
| `3100bce_2181bce` | Memphis founded, Early Dynastic, Old Kingdom pyramids | 45 | ~150 |
| `2180bce_332bce` | First Intermediate Period to the Late Period | 45 | ~150 |
| `331bce_640` | Ptolemaic, Roman and Byzantine Memphis and Babylon | 45 | ~120 |
| `641_968` | Fustat, al-Askar, al-Qata'i | 45 | ~150 |
| `969_1249` | Fatimid al-Qahira, Ayyubid Cairo | 45 | ~200 |
| `1250_1516` | the Mamluk city | 45 | ~250 |
| `1517_1797` | Ottoman Cairo | 45 | ~180 |
| `1798_1922` | the French, Muhammad Ali, Ismail, the British | 45 | ~250 |
| `1923_present` | the kingdom, the republic, the megacity | 45 | ~250 |

Expected cards are a guide, not a target.

### Beijing (2026-11-20)

Area: Beijing Municipality (user's choice): the old Inner and Outer cities, the Western Hills, the Summer
Palaces, Zhoukoudian (Fangshan), the Ming Tombs (Changping), the Great Wall at Badaling, Mutianyu, Juyongguan
and Simatai, Marco Polo Bridge (Lugou), Tongzhou (the Grand Canal's north end), Miyun, Pinggu, Yanqing.
Region: east_asia.

- Dates: give the CE year of the event itself. A lunar-calendar date late in a Chinese year can fall in
  the next CE year; convert it (policy.md "Date conversion") and write the Chinese date in the source.
- The OUT rule covers each court while the city is its seat: the Liao Southern Capital (938–1122) only
  when the Liao court is there; the Jin court at Zhongdu (1153–1215); the Yuan court at Dadu (1267/1272–
  1368); the Ming court (1421–1644, and the Yongle court at Beiping before 1421 for empire-wide acts);
  the Qing court (1644–1911); the Beiyang government (1912–1928); the People's Republic (from 1949).
  Leave out their accessions, court rituals, imperial examinations, decrees and laws for the whole
  state, Party congresses and plenums, national elections and treaties. A ruler's palace, wall, gate,
  temple, garden, canal, tomb or city plan is IN (the Forbidden City, the Temple of Heaven, the Ming
  Tombs, the Summer Palaces, the 1950s ring roads).
- 1928–1949 the capital is Nanjing (the city is Beiping, then occupied): national events in the city are
  IN, except the occupiers' puppet governments' acts for the whole of north China (OUT).
- Main stage (IN as cards): the Mongol siege and sack of Zhongdu (1214–1215), the Oirat siege after Tumu
  (1449), Altan Khan's raid (1550), Li Zicheng's capture and the Qing entry (1644), the burning of the
  Old Summer Palace (1860), the Boxer siege of the legations and the Allied occupation (1900–1901), the
  May Fourth demonstrations (1919), the Marco Polo Bridge incident and the occupation (1937), the PLA's
  entry (1949), the Red Guard rallies in Tiananmen Square (1966), the Tiananmen incident (1976), the
  1989 protests and the crackdown, attacks in the city, the 2008 and 2022 Olympics.

| era slug | years | searches | expected cards |
|---|---|---|---|
| `pre1045bce` | Peking Man at Zhoukoudian, Upper Cave, Donghulin, Shangzhai, Xiajiadian | 25 | ~50 |
| `1045bce_937` | Ji and Yan, Youzhou under Qin to Tang, An Lushan's base | 45 | ~120 |
| `938_1271` | Liao Nanjing, Jin Zhongdu, the Mongol conquest | 45 | ~150 |
| `1272_1420` | Yuan Dadu, Ming Beiping, Yongle's rebuilding | 45 | ~180 |
| `1421_1643` | the Ming capital | 45 | ~250 |
| `1644_1860` | the Qing capital to the Second Opium War | 45 | ~220 |
| `1861_1927` | self-strengthening, the Boxers, the early Republic | 45 | ~220 |
| `1928_1948` | Beiping, the Japanese occupation, the civil war | 45 | ~150 |
| `1949_1976` | the People's Republic to the death of Mao | 45 | ~200 |
| `1977_present` | reform, 1989, the Olympics, the megacity | 45 | ~250 |

Expected cards are a guide, not a target.
