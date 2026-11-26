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
| 2 | Berlin (`berlin`) | western_europe | Berlin + Potsdam, with Sachsenhausen and Schönefeld/BER (decided 2026-11-19; exceptions 2026-11-25) |
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
- Republican dates known only from an ancient historian (Livy, Dionysius, Plutarch; added 2026-11-21): the
  ancient text, or a standard year-by-year listing of it (attalus.org, Broughton's Magistrates via a
  summary page, a Wikipedia article citing the passage), counts as the source. Use `medium`, keep
  `(traditional date)` in the event for the early Republic (before the Gallic sack), and cite the passage
  (`"Livy 3.44-48 (attalus.org)"`). Such a card is not `unverified`.

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

### Tokyo (2026-11-20)

Area: Tokyo Metropolis (user's choice): the 23 special wards, the Tama area (Fuchū, the old Musashi
provincial capital; Hachiōji; Takao; Ōme; Okutama), and the Izu and Ogasawara islands (Ōshima, Miyake,
Hachijō, Chichijima, Iwo Jima). Kamakura, Yokohama, Kawasaki and the rest of Kanagawa and Saitama are OUT
(different prefectures). Region: east_asia.

- Dates: before 1873 Japan used the lunisolar calendar. Give the Gregorian (or Julian, before 1582) year
  of the event; a date late in a Japanese year can fall in the next CE year. Write the Japanese era date
  in the source (policy.md "Date conversion").
- The OUT rule covers each government while the city is its seat: the Tokugawa shogunate (1603–1867) and
  the imperial and national government (from 1868: the court, the Diet, the cabinet, the ministries, the
  Supreme Court). Leave out shogunal successions, edicts and laws for the whole country (the seclusion
  edicts, the sankin-kōtai rule, the Kansei and Tenpō reforms as national acts), imperial accessions and
  rituals, national laws, elections, cabinet changes and treaties signed in the city. The city's own
  acts are IN: the Edo machi-bugyō, town fire brigades, the Tokyo prefecture and Metropolitan government,
  governors. A ruler's castle, palace, temple, shrine, garden, mausoleum or city plan is IN (Edo Castle,
  Kan'ei-ji, Zōjō-ji, Meiji Shrine, the Imperial Palace, Yasukuni).
- Ōta Dōkan's castle (1457) and the Late Hōjō hold (to 1590) are local rulers: IN.
- Main stage (IN as cards): the Great Meireki Fire (1657), the Akō rōnin attack on Kira (1703) and their
  seppuku, the Great Ansei earthquake (1855), the Sakuradamon incident (1860), the surrender of Edo Castle
  and the Battle of Ueno (1868), the emperor's arrival (1868–1869), the Hibiya riots (1905), the 1918 rice
  riots in the city, the Great Kantō earthquake and its massacres (1923), assassinations in the city (Hara
  1921, Hamaguchi 1930, Inukai 1932, Asanuma 1960), the February 26 incident (1936), the Doolittle raid
  (1942), the Battle of Iwo Jima and the firebombing of Tokyo (1945), the Kyūjō incident (1945), the
  surrender in Tokyo Bay (1945), the Occupation and GHQ (1945–1952), the Tokyo Trials (1946–1948), the
  Anpo protests (1960), the 1964 Olympics, the university struggles (Yasuda Auditorium 1969), the return of
  the Ogasawara islands (1968), the sarin attack (1995), the 2011 earthquake in the city, the 2021 Olympics.

| era slug | years | searches | expected cards |
|---|---|---|---|
| `pre1457` | Paleolithic and Jōmon shell mounds (Ōmori), Yayoi, Musashi province, Sensō-ji, Masakado, the Edo clan | 35 | ~80 |
| `1457_1602` | Ōta Dōkan's Edo Castle, the Late Hōjō, Ieyasu's arrival (1590) | 30 | ~70 |
| `1603_1715` | the shogunate's capital to the Shōtoku era | 45 | ~200 |
| `1716_1867` | the Kyōhō reforms to the fall of the shogunate | 45 | ~230 |
| `1868_1922` | Meiji Tokyo to the eve of the earthquake | 45 | ~250 |
| `1923_1945` | the earthquake, rebuilding, militarism, the war | 45 | ~200 |
| `1946_1989` | the Occupation, recovery, the Olympics, the bubble | 45 | ~230 |
| `1990_present` | the bubble's end, the sarin attack, the 2011 earthquake, the 2021 Olympics | 45 | ~200 |

Expected cards are a guide, not a target.

### Delhi (2026-11-20)

Area: the National Capital Region as decided: the NCT of Delhi (the seven historic cities: Lal Kot and
Qila Rai Pithora, Siri, Tughlaqabad, Jahanpanah, Firozabad, Purana Qila/Dinpanah, Shahjahanabad; New
Delhi; Mehrauli; Shahdara) plus Gurugram, Faridabad (Anangpur dam, Surajkund), Noida and Ghaziabad (Loni).
Panipat, Tarain, Meerut, Agra, Mathura and Sonipat are OUT (outside the area). Region: south_asia.

- Dates: Hijri and Vikram Samvat dates go to the CE year of the event; write the original date in the
  source (policy.md "Date conversion"). A Persian chronicle year that straddles two CE years → the CE
  year of the event if known, else medium confidence.
- The Tomar and Chauhan rulers (to 1192) are local: IN.
- The OUT rule covers each court while the city is its seat: the Delhi Sultanate (1206–1526, not while
  it sits at Daulatabad 1327–c.1335 or at Agra under Sikandar and Ibrahim Lodi 1506–1526, when only the
  city's own events are IN); the Mughal court when seated in Delhi (Humayun 1533–1540 and 1555–1556,
  Shah Jahan's Shahjahanabad from 1648 to 1857); the British Raj from 1912 (the capital move announced
  at the 1911 Durbar); the Republic of India from 1947. Leave out their accessions, court rituals,
  decrees and laws for the whole state, embassies received, Parliament acts, national elections,
  cabinet changes and treaties. A ruler's fort, palace, mosque, tomb, garden, canal or city plan is IN
  (the Qutb complex, Tughlaqabad, Humayun's Tomb, the Red Fort, the Jama Masjid, Lutyens' Delhi).
- Main stage (IN as cards): the Mongol raids on the city (1299, 1303), Timur's sack (1398), Babur's and
  Humayun's entries, Nadir Shah's massacre (1739), Ahmad Shah Durrani's sacks (1757, 1760), the Maratha
  and Rohilla seizures (1771, 1788), the Battle of Delhi (1803), the 1857 rising and siege, the Durbars
  (1877, 1903, 1911), the Hardinge bomb (1912), Bhagat Singh's Assembly bomb (1929), New Delhi's
  inauguration (1931), the Partition riots and refugee camps (1947), Gandhi's assassination (1948),
  the Asian Games (1951, 1982), the Emergency demolitions (Turkman Gate 1976), Indira Gandhi's
  assassination and the anti-Sikh riots (1984), the Uphaar fire (1997), the Parliament attack (2001),
  the 2005 and 2008 bombings, the Commonwealth Games (2010), the 2012 gang rape and protests, the 2019
  Jamia/Shaheen Bagh protests, the 2020 riots, the farmers' sit-in at the borders (2020–2021).

| era slug | years | searches | expected cards |
|---|---|---|---|
| `pre1060` | prehistoric quartzite tools, PGW at Purana Qila, the Ashokan edict, the Iron Pillar, Anangpur and Surajkund | 30 | ~60 |
| `1060_1205` | the Tomar Lal Kot, Prithviraj Chauhan's Qila Rai Pithora, the Ghurid conquest, the Qutb begins | 30 | ~60 |
| `1206_1525` | the Delhi Sultanate: Mamluk, Khalji, Tughlaq, Sayyid, Lodi | 45 | ~200 |
| `1526_1707` | Babur to Aurangzeb, Sher Shah, Shahjahanabad | 45 | ~180 |
| `1708_1857` | the later Mughals, the sacks, the Marathas, the British Resident, 1857 | 45 | ~200 |
| `1858_1946` | the Raj, the Durbars, New Delhi, the national movement | 45 | ~220 |
| `1947_1983` | Partition, the refugee city, the Emergency, the Asian Games | 45 | ~200 |
| `1984_present` | 1984, the metro, the NCR boom, attacks, protests | 45 | ~220 |

Expected cards are a guide, not a target.

### New York (2026-11-20)

Area: the metropolitan area as decided: the five boroughs; Long Island (Nassau, Suffolk); Westchester; and
northern New Jersey (Hudson, Bergen, Essex, Passaic, Union, Morris and Middlesex counties: Newark, Jersey
City, Hoboken, Paterson, Elizabeth, Morristown, Menlo Park, New Brunswick). Albany, West Point, Trenton,
Princeton and Monmouth are OUT. Region: north_america.

- Dates: before 1752 the English colonies used the Julian calendar with the year starting on 25 March;
  New Amsterdam used the Gregorian calendar. Give the CE year of the event (New Style year for January–
  March dates) and write the original date in the source.
- The OUT rule covers each government while the city is its seat: the New Netherland government at New
  Amsterdam (1625–1664: acts for the whole colony); the Province of New York (1664–1776: acts of the
  governor, council and assembly for the whole province); the State of New York while it sits in the
  city (1784–1797: state laws for the whole state); the Confederation Congress (1785–1789) and the US
  federal government (1789–1790): national laws, the Bill of Rights, the Judiciary Act, inaugurations,
  treaties. Colonial and state acts about the city itself are IN (the Dongan and Montgomerie charters,
  the 1811 Commissioners' Plan, the 1898 consolidation, city charters).
- The United Nations is treated like the Holy See: General Assembly and Security Council acts are OUT;
  the headquarters, its building and events where the city is the subject are IN.
- National and international finance: a crash or panic on Wall Street is IN (the city is the main stage);
  Federal Reserve policy and national laws about banks are OUT.
- Main stage (IN as cards): the Esopus and Kieft's War massacres in the area (Pavonia 1643), the 1664 and
  1673 surrenders, Leisler's Rebellion and his hanging (1689–1691), the 1712 slave revolt and the 1741
  conspiracy trials, the Stamp Act riots (1765), the Battle of Long Island and the British occupation
  (1776–1783), the Great Fire of 1776, Nathan Hale's hanging, Evacuation Day (1783), the Doctors' Riot
  (1788), the Great Fire of 1835, the Astor Place riot (1849), the Draft Riots (1863), the Orange riots
  (1870–1871), the Triangle fire (1911), the Wall Street bombing (1920), the 1929 crash, the Harlem riots
  (1935, 1943, 1964), the Stonewall uprising (1969), the 1977 blackout, the 1993 and 2001 World Trade
  Center attacks, Occupy Wall Street (2011), Hurricane Sandy (2012), the 2020 COVID wave in the city.

| era slug | years | searches | expected cards |
|---|---|---|---|
| `pre1609` | Paleo-Indian and Archaic sites, the Lenape, Verrazzano (1524) | 30 | ~50 |
| `1609_1782` | Hudson, New Amsterdam, colonial New York, the Revolution and occupation | 45 | ~200 |
| `1783_1860` | Evacuation Day, the federal capital, the canal port, immigration, Central Park | 45 | ~230 |
| `1861_1897` | the Civil War, Tweed, the Brooklyn Bridge, the Gilded Age | 45 | ~230 |
| `1898_1929` | consolidation, the subway, Ellis Island, Harlem, the skyscrapers, the crash | 45 | ~260 |
| `1930_1964` | the Depression, La Guardia, Moses, the UN, the World's Fairs | 45 | ~250 |
| `1965_2000` | the fiscal crisis, the blackout, hip hop, the 1990s revival | 45 | ~250 |
| `2001_present` | 9/11, rebuilding, Bloomberg, Sandy, COVID | 45 | ~220 |

Expected cards are a guide, not a target.

### Mexico City (2026-11-20)

Area: the Valley of Mexico metro as decided: Mexico City (all 16 boroughs: Xochimilco, Tlalpan with Cuicuilco,
Milpa Alta, Coyoacán and the rest) and the State of Mexico municipalities of the valley
(Teotihuacan and San Juan Teotihuacán, Texcoco, Tenayuca/Tlalnepantla, Naucalpan, Ecatepec, Nezahualcóyotl,
Chalco, Tepotzotlán, Tlatilco, Tepexpan, Huexotla, Acolman, Cuautitlán). Tula, Toluca, Puebla, Cholula,
Cuernavaca, Pachuca and Veracruz are OUT. Region: latin_america.

- Dates: before the Gregorian switch in New Spain (1583–1584) give the Julian date with the CE year.
  Convert Mexica xiuhpohualli year-names (e.g. 2 Reed) to CE years with the correlation the source uses;
  where sources differ (e.g. founding 1325 vs 1345, Tlatelolco 1337) use the common one and mark the card
  disputed with the other in the source.
- Archaeological dates: follow cities.md "Archaeological dates" (calibrated BCE/CE; uncalibrated BP only →
  disputed).
- The Mexica rulers of Tenochtitlan, the rulers of Tlatelolco and Texcoco (Nezahualcóyotl) and the Triple
  Alliance are local and IN (accessions of tlatoque are court ritual and OUT as accessions, but wars,
  buildings, floods, dikes, temple stages, the New Fire ceremony on Huixachtlan/Cerro de la Estrella are IN).
  Campaigns far from the valley are OUT.
- The OUT rule covers each government while the city is its seat: the Viceroyalty of New Spain
  (1535–1821: viceroys' acts, laws and decrees for the whole of New Spain; viceroys' arrivals and
  accessions); the Audiencias (1527–1535, acts for all New Spain); the national governments from 1821
  (empire, republic, the Second Empire 1864–1867): national laws, constitutions, presidential
  inaugurations, national elections. Acts about the city itself are IN (the 1521 traza, the drainage of the
  valley (Desagüe, Gran Canal), the city ayuntamiento, Federal District creation 1824 and its changes, the
  1928 abolition of municipalities, the 1997 first elected head of government, the 2016 constitution and
  the CDMX name). The Catholic Church: archbishops' consecrations and church councils for all of New Spain
  are OUT; cathedrals, basilicas, convents, the Inquisition's autos-de-fé in the city are IN.
- Main stage (IN as cards): the siege and fall of Tenochtitlan (1520–1521, La Noche Triste, the Toxcatl
  massacre), the 1629 great flood, the 1624 and 1692 riots, Hidalgo at Monte de las Cruces (1810),
  Iturbide's entry (1821), the Parián riot (1828), the Battles of
  Churubusco, Molino del Rey and Chapultepec and the US occupation (1847–1848), the French entry (1863),
  the Republic's return (1867), the Decena Trágica (1913), the Zapatista/Villista occupation (1914–1915),
  Obregón's assassination at La Bombilla (1928), Trotsky's assassination (1940), the 1957 earthquake,
  the 1968 Tlatelolco massacre and the Olympics, the 1971 Corpus Christi (Halconazo) massacre, the 1985
  earthquake, the 1986 World Cup final, the 2017 earthquake, the 2021 Line 12 collapse.

| era slug | years | searches | expected cards |
|---|---|---|---|
| `pre100bce` | Tlapacoya, Tepexpan, Tlatilco, Cuicuilco, Copilco, early Teotihuacan | 30 | ~50 |
| `100bce_1324` | Teotihuacan, Xitle, the Toltec-era valley, Tenayuca, Texcoco, Azcapotzalco, Culhuacan | 35 | ~80 |
| `1325_1520` | Tenochtitlan and Tlatelolco, the Triple Alliance, Nezahualcóyotl, the Templo Mayor, Cortés's arrival | 45 | ~150 |
| `1521_1699` | the fall, the Spanish city, the drainage, floods, the 1624 and 1692 riots | 45 | ~180 |
| `1700_1820` | the Bourbon city, the Academy of San Carlos, the independence war | 45 | ~180 |
| `1821_1910` | independence, the US and French occupations, the Reform, the Porfiriato | 45 | ~230 |
| `1911_1967` | the Revolution, the Decena Trágica, growth, the university city, the 1957 quake | 45 | ~230 |
| `1968_present` | Tlatelolco, the Olympics, the 1985 quake, the elected city, the 2017 quake | 45 | ~230 |

Expected cards are a guide, not a target.

### Shanghai (2026-11-22)

Area: Shanghai Municipality as decided: the old walled county town (Nanshi), the International Settlement
and the French Concession, Hongkou, Zhabei, Pudong, Wusong and Baoshan, Minhang, Songjiang (the old
prefecture seat, Guangfulin), Qingpu (Songze, Fuquanshan, Qinglong town), Jiading, Jinshan, Fengxian,
Nanhui, Chongming, Changxing and Hengsha islands. Suzhou, Kunshan, Hangzhou, Ningbo and the Yangshan port
islands of Zhejiang are OUT (the Donghai Bridge and the Lingang end are IN). Region: east_asia.

- Dates: give the CE year of the event itself. A lunar-calendar date late in a Chinese year can fall in
  the next CE year; convert it (policy.md "Date conversion") and write the Chinese date in the source.
- Shanghai was never the national capital, so the OUT rule is narrow: imperial and national laws, edicts,
  examinations and reforms for the whole state stay OUT (Song, Yuan, Ming, Qing courts; the Beiyang,
  Nanjing and wartime governments; the People's Republic). Acts about the county, the prefecture or the
  city are IN (the county's founding in 1292, the city wall in 1553, the customs house, the Treaty
  opening in 1843, the 1927 Special Municipality, the 1958 county transfers from Jiangsu, Pudong New Area
  1990/1992, the Free Trade Zone 2013).
- Foreign bodies seated in the city: the Shanghai Municipal Council, the French Conseil municipal and the
  Mixed Court are local governments and IN. The Korean Provisional Government (1919–1932) and the national
  party headquarters seated in the concessions: their founding, a raid on them or an attack in the city is
  IN; their acts for the whole country are OUT. The First Congress of the Chinese Communist Party (1921,
  in the French Concession) is IN as a city event; later Party congresses and plenums held elsewhere are OUT.
- The Reformed Government and the Wang Jingwei regime (seated in Nanjing): their acts for occupied China
  are OUT; their and the Japanese acts in the city (the Settlement's seizure in 1941, the Hongkew ghetto
  1943) are IN.
- Main stage (IN as cards): the wokou raids (1553–1555), the British capture of Wusong and Shanghai (1842),
  the Small Swords rising (1853–1855), the Taiping attacks and the Ever-Victorious Army (1860–1862), the
  1905 Mixed Court riot, the 1911 revolution in the city, the May Thirtieth Movement (1925), the workers'
  uprisings and the April 12 purge (1927), the January 28 incident (1932), the Battle of Shanghai and
  Bloody Saturday (1937), the Communist capture (1949), the January Storm (1967), the 1989 protests in the
  city, Expo 2010, the 2014 Bund stampede, the 2022 lockdown.

| era slug | years | searches | expected cards |
|---|---|---|---|
| `pre1292` | Songze, Majiabang, Liangzhu at Fuquanshan, Maqiao, Qinglong port, Huating county, the Song market town | 25 | ~50 |
| `1292_1842` | the county under Yuan, Ming and Qing, cotton, the wokou, the city wall, Xu Guangqi, the Yu Garden, the Opium War | 45 | ~150 |
| `1843_1926` | the treaty port, the concessions, the Small Swords and the Taiping, the Bund, 1911, May Thirtieth | 45 | ~250 |
| `1927_1949` | the Special Municipality, 1932 and 1937, the occupation, the refugees, the civil war | 45 | ~200 |
| `1950_1990` | the People's Republic, the Cultural Revolution base, reform, the opening of Pudong | 45 | ~180 |
| `1991_present` | Pudong, the Metro, the towers, Expo 2010, the megacity | 45 | ~200 |

Expected cards are a guide, not a target.

### Seoul (2026-11-22)

Area: the Seoul Capital Area as decided: Seoul (Hanyang/Hanseong/Gyeongseong, Bukhansan, the Han River,
Baekje's Wiryeseong sites at Pungnap and Mongchon, Amsa-dong), Incheon (Jemulpo, Ganghwa, Gyodong, the
western islands), and Gyeonggi Province (Suwon Hwaseong, Namhansanseong, Gwangju, Yongin, Paju, Panmunjom,
Yeoncheon Jeongok-ri, Goyang Haengju). Gaeseong is OUT (North Korea). Region: east_asia.

- Dates: give the CE year of the event itself. A lunar-calendar date late in a Korean year can fall in the
  next CE year; convert it (policy.md "Date conversion") and write the lunar date in the source.
- The OUT rule covers each government while the city (or a place in the area) is its seat: the Baekje court
  at Wiryeseong (to 475); the Goryeo court at Ganghwa (1232–1270); the Joseon court at Hanyang (1394–1910,
  except 1399–1405 at Gaeseong); the Korean Empire (1897–1910); the Japanese Government-General (1910–1945:
  laws and orders for all Korea); the US Army Military Government (1945–1948); the Republic of Korea (from
  1948). Leave out their accessions, court rituals, state examinations, decrees and laws for the whole
  state, national elections, constitutions and treaties. A ruler's palace, wall, gate, shrine, tomb,
  fortress or city plan is IN (Gyeongbokgung, Jongmyo, the Hanyang wall, Hwaseong, the royal tombs,
  Namhansanseong, the Cheonggyecheon works, the subway).
- Main stage (IN as cards): the Goguryeo capture of Wiryeseong (475), the Mongol attacks on Ganghwa, the
  Imjin War in the area (the palaces burned 1592, Haengju 1593), Yi Gwal's capture of the capital (1624),
  the siege of Namhansanseong (1636–1637), the French (1866) and US (1871) expeditions to Ganghwa, the
  Unyo incident (1875), the Imo mutiny (1882), the Gapsin coup (1884), Queen Min's murder at Gyeongbokgung
  (1895), the king's flight to the Russian legation (1896), the 1907 army disbandment fighting, the March
  First Movement (1919), the June Tenth Movement (1926), the fall and recaptures of Seoul and the Incheon
  landing (1950–1951), the Panmunjom armistice (1953), the April Revolution (1960), the coup troops in the
  city (1961, 1979), the Blue House raid (1968), the June Struggle (1987), the 1988 Olympics, the Seongsu
  Bridge and Sampoong collapses (1994, 1995), the 2002 World Cup, the 2008 Sungnyemun fire, the candlelight
  protests (2016–2017), the Itaewon crush (2022), martial law at the National Assembly (2024).
  Treaties signed in the area (Ganghwa 1876, Jemulpo 1882, Eulsa 1905) are OUT as treaties; the event in
  the city around them (troops at the palace in 1905) is IN.

| era slug | years | searches | expected cards |
|---|---|---|---|
| `pre1392` | Jeongok-ri, Amsa-dong, dolmens of Ganghwa, Baekje Wiryeseong, Goguryeo and Silla Hanju, Goryeo Namgyeong, the Ganghwa court | 35 | ~90 |
| `1392_1591` | Joseon founds Hanyang, the palaces and wall, Sejong's city, the purges in the capital | 45 | ~150 |
| `1592_1875` | the Imjin War, the Manchu invasions, Namhansanseong, Hwaseong, the French and US attacks on Ganghwa | 45 | ~180 |
| `1876_1909` | the opening, Jemulpo, the Imo and Gapsin incidents, the Korean Empire, trams and railways | 45 | ~180 |
| `1910_1945` | Gyeongseong under Japanese rule, March First, the Government-General building | 45 | ~180 |
| `1946_1987` | liberation, the Korean War, the April Revolution, growth, the June Struggle | 45 | ~220 |
| `1988_present` | the Olympics, the collapses, Cheonggyecheon, candlelight, Itaewon, 2024 martial law | 45 | ~220 |

Expected cards are a guide, not a target.

### Osaka (2026-11-24)

Area: Osaka Prefecture as decided: Osaka city (Naniwa, Uemachi plateau, Semba, Shimanouchi, Dōjima,
Nakanoshima, Tennōji, Sumiyoshi), Sakai, the Mozu and Furuichi kofun groups (Habikino, Fujiidera), Hirakata,
Takatsuki (Imashirozuka), Ibaraki, Suita (Expo '70 site), Toyonaka, Ikeda, Kishiwada, Izumi, Kaizuka,
Kawachi-Nagano (Kongō-ji, Kanshin-ji), Chihaya-Akasaka, Kansai Airport. Kyoto, Nara, Kobe and the rest of
Hyōgo (Amagasaki, Itami) are OUT. Region: east_asia.

- Dates: give the CE year of the event itself. Before 1873 Japan used a lunisolar calendar: a date late in a
  Japanese year can fall in the next CE year; convert it (policy.md "Date conversion") and write the
  Japanese date (era name, month, day) in the source.
- Early dates: Nihon Shoki dates before about 500 (Nintoku's Takatsu palace, Ōjin's Ōsumi palace) follow
  cities.md "Legendary dates": `(traditional date)` in the event, confidence low or disputed. Kofun dates come
  from archaeology ("Archaeological dates").
- The OUT rule covers each government while the area is its seat: the court at Naniwa (Naniwa-Nagara-Toyosaki
  palace 645–655, Shōmu's capital 744–745): edicts and reforms for the whole state, accessions, court rituals;
  the palace itself and its buildings are IN. Hideyoshi at Osaka Castle (1583–1598) and Hideyori's court
  (to 1615): national acts (the sword hunt, land surveys, the invasions of Korea, edicts for all Japan) are OUT;
  the castle, the city plan, canals, the merchant moves and events in the city are IN. Tokugawa Yoshinobu at
  Osaka Castle (1866–1868): shogunal acts OUT, events in the city IN. The Tokugawa and Meiji-and-later national
  governments sit elsewhere, so only their laws for the whole state are OUT; acts about the city (the Osaka
  castellan and magistrates, the Mint, the city's charter, the 1925 Greater Osaka merger, the 2015 and 2020
  Osaka Metropolis referendums) are IN.
- The Ishiyama Hongan-ji (1496–1580) is treated like the Holy See: the sect's councils and doctrine are OUT;
  the temple's building, its town and the Ishiyama war (1570–1580) are IN.
- Main stage (IN as cards): the fall of the Ishiyama Hongan-ji (1580), the sieges of Osaka (1614–1615), the
  Ōshio Heihachirō rising (1837), Yoshinobu's flight from the castle (1868), the 1903 Industrial Exposition,
  the 1918 rice riots, the Muroto typhoon (1934), the air raids (1945), Expo '70, the 1995 earthquake in the
  prefecture, the Ikeda school attack (2001), the G20 summit (2019), Expo 2025.

| era slug | years | searches | expected cards |
|---|---|---|---|
| `pre645` | Jōmon and Yayoi sites (Ikegami-Sone), the Mozu-Furuichi kofun, Naniwa port, Shitennō-ji, Sumiyoshi | 30 | ~70 |
| `645_1495` | the Naniwa palaces, Gyōki, Watanabe port, Kusunoki Masashige, Sakai the free city | 45 | ~120 |
| `1496_1614` | the Ishiyama Hongan-ji, Sakai's merchants and tea, Hideyoshi's castle and city | 45 | ~150 |
| `1615_1867` | the sieges' end, the merchant city, Dōjima rice, bunraku and kabuki, Ōshio | 45 | ~200 |
| `1868_1944` | the Mint, industry, "Great Osaka", the 1903 Expo, the Muroto typhoon, the war | 45 | ~230 |
| `1945_present` | the air raids' ruins, Expo '70, Kansai Airport, the 1995 quake, Expo 2025 | 45 | ~230 |

Expected cards are a guide, not a target.

### Mumbai (2026-11-24)

Area: the Mumbai Metropolitan Region as decided: the seven islands and Mumbai city and suburbs (Mahim, Sion,
Worli, Bandra, Juhu, Andheri, Borivali with Sanjay Gandhi Park and Kanheri), Elephanta (Gharapuri), Thane,
Kalyan, Bhiwandi, Vasai (Bassein) and Sopara (Nala Sopara), Navi Mumbai, Uran, Panvel, Karnala, Matheran.
Chaul, Pune, Nashik, Surat, Daman and Raigad fort are OUT. Region: south_asia.

- Dates: give the CE year. Hindu and Islamic calendar dates in inscriptions convert per policy.md; old
  Portuguese and English records before 1752 may give Julian or Old Style dates — use the CE year of the event.
- The OUT rule covers each government while the area is its seat: the Portuguese Província do Norte at Bassein
  (1534–1739: acts for the whole Northern Province, captains' appointments); the Bombay Presidency government
  from 1687 (when the Company's western seat moves from Surat) to 1947: acts for the whole presidency, governors'
  arrivals; Bombay State and Maharashtra from 1947 (state laws, chief ministers, state elections). Acts about the
  city are IN: the Company's takeover (1668), the 1715 wall, the Hornby Vellard, the reclamations, the Municipal
  Corporation (1865/1888), the BEST, the Bombay Improvement Trust, the BMC's acts, the 1960 creation of
  Maharashtra with Bombay as capital as a city event, the 1995 renaming to Mumbai. Treaties ceding the islands
  (1534 Bassein, 1661 marriage treaty) are OUT; the handovers in the city (1534 at Bassein, 1665, 1668) are IN.
- Local rulers IN: the Silhara kings of the north Konkan (Thane/Puri), Bimbadev's Mahikavati (Mahim), the
  Gujarat Sultanate's governors at Mahim and Thane.
- National bodies founded or meeting in the city are IN as city events (the Indian National Congress founded at
  Gokuldas Tejpal College, 1885; Congress sessions held in Bombay; the 1942 Quit India resolution at Gowalia Tank).
- Main stage (IN as cards): the Portuguese capture of Bassein and Thane (1530s), the Maratha siege of Bassein
  (1739), the Sidi raids on Bombay (1689–1690), the 1857 executions on the Esplanade, the 1874 and 1893 riots,
  the 1896 plague, the 1908 Tilak strike, the 1921 Prince of Wales riots, the 1944 Victoria Dock explosion, the
  1946 naval mutiny, the 1955–1956 Flora Fountain firings and riots, the 1982 textile strike, the 1992–1993 riots, the 1993
  bombings, the 2005 floods, the 2006 train bombings, the 2008 attacks, the 2011 bombings.

| era slug | years | searches | expected cards |
|---|---|---|---|
| `pre1534` | Kandivali stone tools, Sopara and Ashoka, Kanheri, Elephanta, Jogeshwari, the Silharas, Mahikavati, the Gujarat Sultanate | 35 | ~90 |
| `1534_1667` | Portuguese Bassein and Bombay, the churches and forts, the cession to England | 45 | ~100 |
| `1668_1856` | the Company's Bombay, the wall and dockyard, the reclamations, the Parsis, the first railway | 45 | ~200 |
| `1857_1946` | the cotton boom, the Municipal Corporation, the Gothic city, plague, Congress, Quit India, the 1946 mutiny | 45 | ~250 |
| `1947_1991` | Bombay State, Samyukta Maharashtra, the mills and the strike, Navi Mumbai, Bollywood | 45 | ~200 |
| `1992_present` | the riots and bombings, the renaming, the 2005 floods, 26/11, the Metro and the sea link | 45 | ~200 |

Expected cards are a guide, not a target.

### Kolkata (2026-11-24)

Area: the Kolkata Metropolitan Area as decided: Kolkata (Sutanuti, Gobindapur, Kalikata, Kalighat, Garden
Reach and Metiabruz, Alipore, Ballygunge, Dum Dum, Salt Lake, New Town), Howrah and Shibpur, Barrackpore and
the Hooghly mill towns on both banks (Titagarh, Barasat, Belur, Dakshineswar, Uttarpara, Konnagar, Baranagar),
Serampore (Danish Frederiksnagore), Chandannagar (French), Chinsurah (Dutch) with Hooghly town and Bandel
(Portuguese Ugolim), Bansberia and Tribeni, Budge Budge, Baruipur. Saptagram/Satgaon counts when a source places
the event there. Murshidabad, Plassey (Palashi), Chandraketugarh, Tamralipta, Kalna and Nabadwip are OUT.
Region: south_asia.

- Dates: give the CE year. Bengali (Bangabda), Hijri and Shaka dates convert per policy.md. English records
  before 1752 may give Old Style dates — use the CE year of the event.
- The OUT rule covers each government while the area is its seat: the Company's Presidency of Fort William
  (from 1700: acts for the whole Bengal Presidency, council appointments); the Governor-General / Viceroy of
  India (1773 Regulating Act to 1911: India-wide laws, the Permanent Settlement, the Sati and Widow Remarriage
  Acts as laws, appointments, arrivals); the Lieutenant-Governor / Governor of Bengal (1854–1947: province-wide
  acts); the state of West Bengal from 1947 (state laws, chief ministers, state elections). Acts about the city
  are IN: the Mayor's Court, the 1772 move of the treasury to Calcutta, the Lottery Committee, the Calcutta
  Corporation (1876/1899/1923), the Improvement Trust, the Port Commissioners, the 1911 transfer of the capital
  to Delhi as a city event (the city stops being capital), the 2001 renaming to Kolkata, the Kolkata Municipal
  Corporation's acts.
- The European settlements are local governments, IN: Portuguese Hooghly, Dutch Chinsurah, Danish Serampore,
  French Chandannagar (France's Indian capital was Pondicherry; Chandannagar's acts are city events), the Ostend
  Company at Bankibazar. The Nawabs' government at Murshidabad is OUT, but its acts in the area (the 1756 capture
  of Calcutta, the renaming to Alinagar) are IN.
- National bodies founded or meeting in the city are IN as city events (the Asiatic Society 1784, the British
  Indian Association, the Indian Association 1876, Congress sessions held in Calcutta, the Muslim League
  sessions held there, the Brahmo Samaj, the Ramakrishna Mission at Belur).
- Courts seated in the city: the Supreme Court of Judicature at Fort William (1774) and the Calcutta High
  Court (1862) are IN as city institutions; their famous trials held in the city are IN (Nandakumar hanged
  1775, the Alipore Bomb Case 1908–1909).
- Main stage (IN as cards): the 1756 siege and the Black Hole, the 1757 recapture, the 1824 Barrackpore mutiny,
  the 1857 Mangal Pandey shooting and hanging at Barrackpore, Wajid Ali Shah's exile at Metiabruz (1856), the
  1905 anti-partition protests and boycott in the city (the partition itself is OUT), the 1926 riots, the 1930
  Writers' Building attack, the 1943 famine in the city, the 1946 Direct Action Day killings, the 1946 INA
  trial protests, Gandhi's 1947 fast at Beliaghata, the 1950 and 1964 riots, the 1959 food movement, the
  Naxalite killings (1970–1971), the 1971 refugees at Salt Lake, the 1993 Bowbazar blast, the 2007 Nandigram
  protests in the city (Nandigram itself is OUT), the 2024 R. G. Kar protests.

| era slug | years | searches | expected cards |
|---|---|---|---|
| `pre1690` | Kalighat and Bengali texts, Saptagram and Tribeni, Portuguese Hooghly and Bandel, the 1632 siege, Dutch Chinsurah, the English factories at Hooghly | 35 | ~90 |
| `1690_1856` | Job Charnock, Fort William, the 1756–1757 wars, the Company's capital, the Bengal Renaissance, Serampore and Chandannagar | 45 | ~250 |
| `1857_1910` | 1857 at Barrackpore, the University, the High Court, the Corporation, the jute mills, Tagore and Vivekananda, Swadeshi | 45 | ~220 |
| `1911_1946` | the capital leaves, the revolutionaries, the Corporation under C. R. Das and Bose, the Howrah Bridge, the famine, the 1946 killings | 45 | ~200 |
| `1947_present` | partition refugees, the Left Front, the Naxalites, the Metro, the renaming, Salt Lake and New Town, Singur and Nandigram | 45 | ~250 |

Expected cards are a guide, not a target.

### Bangkok (2026-11-24)

Area: the Bangkok Metropolitan Region as decided: Bangkok (Rattanakosin Island, Phra Nakhon, Dusit, Sampanthawong
and Yaowarat, Bang Rak, Pathum Wan, Lat Phrao, Don Mueang, Lat Krabang with Suvarnabhumi), Thonburi on the west
bank, Nonthaburi, Pathum Thani (Sam Khok, Rangsit, Thammasat Rangsit), Samut Prakan (Paknam, Phra Samut Chedi,
the Muang Boran park), Samut Sakhon (Tha Chin, Mahachai), Nakhon Pathom (Phra Pathom Chedi, Phra Prathon,
Salaya). Ayutthaya, Bang Pa-in, Ratchaburi, Khu Bua, Suphanburi, Chachoengsao and Pattaya are OUT.
Region: southeast_asia.

- Dates: give the CE year. Buddhist Era (BE) = CE + 543; Chula Sakarat (CS) = CE − 638. Until 1940 the Thai
  official year began on 1 April (before 1889 it followed the lunar calendar, starting in about April), so a
  January–March date in a BE year before 2484 falls in CE = BE − 542. Convert each date, do not subtract blindly.
- The OUT rule covers each government while the area is its seat: the Thonburi Kingdom (1767–1782: Taksin's
  campaigns, appointments, laws for the kingdom); the Rattanakosin Kingdom / Siam / Thailand from 1782 (royal
  accessions, coronations and cremations as ceremonies, national laws, treaties signed in Bangkok such as the
  Burney 1826 and Bowring 1855 treaties, cabinets, constitutions, elections, prime ministers). Acts about the city
  are IN: the founding of Rattanakosin (1782), the city pillar, the walls, canals (khlongs), roads (Charoen Krung
  1864), the trams, the Sanitary Department (1897), the Bangkok municipality (1937), the 1971–1972 merger of
  Phra Nakhon and Thonburi and the Bangkok Metropolitan Administration (1972), governors' elections, the BTS,
  MRT and airports.
- Ayutthaya's acts in the area are IN (the customs post at Bang Kok, the Wichaiprasit fort, the Thonburi
  canal shortcuts, the 1688 siege of the French at Bangkok). The Ayutthaya court itself is OUT of area.
- Main stage (IN as cards): the 1688 siege, the 1767 Thonburi rally, Taksin's execution (1782), the 1874–1875
  Front Palace crisis, the 1893 Paknam incident and blockade, the 1912 palace plot arrests, the 1932 revolution at
  the Royal Plaza, the 1933 Boworadet fighting at Don Mueang and Bang Khen, the Second World War bombing of Bangkok,
  King Ananda's death in the Grand Palace (1946), the 1949 Palace Rebellion, the 1951 Manhattan Rebellion, coups
  with troops in the city (the decrees after are OUT), 14 October 1973, 6 October 1976, Black May 1992, the 2008
  airport and Government House occupations, the 2010 crackdown, the 2013–2014 shutdown, the 2015 Erawan shrine
  bombing, the 2020–2021 protests, the 2025 building collapse in the Myanmar earthquake.
- International games, summits and congresses held in the city are IN as city events (the Asian Games 1966,
  1970, 1978, 1998; APEC 2003 and 2022).

| era slug | years | searches | expected cards |
|---|---|---|---|
| `pre1767` | Dvaravati Nakhon Pathom and Phra Pathom Chedi, the Bang Kok customs post, Thonburi under Ayutthaya, the forts, the 1688 siege | 35 | ~80 |
| `1767_1867` | Taksin's Thonburi, the founding of Rattanakosin, the Grand Palace and wats, the Chinese of Sampeng, the first Western houses | 45 | ~200 |
| `1868_1931` | Chulalongkorn's city: roads, trams, railways, Dusit, Paknam 1893, the first schools and hospitals, Vajiravudh | 45 | ~220 |
| `1932_1972` | the 1932 revolution, the coups, the war and bombing, the Vietnam War boom, the merger into Bangkok Metropolis | 45 | ~200 |
| `1973_present` | 1973 and 1976, the BMA, Black May, the BTS and MRT, Suvarnabhumi, the yellow and red shirts, the 2020 protests | 45 | ~250 |

Expected cards are a guide, not a target.

### Jakarta (2026-11-24)

Area: Jabodetabek as decided: DKI Jakarta (Sunda Kelapa, Kota and old Batavia, Glodok, Pasar Ikan, Weltevreden
and Gambir, Menteng, Meester Cornelis/Jatinegara, Kebayoran Baru, Tanjung Priok, Ancol, the Thousand Islands with
Onrust), Bogor (Buitenzorg, Batutulis, the Ciaruteun and Kebon Kopi inscriptions, Pakuan Pajajaran, Puncak),
Depok, Tangerang (with Serpong), Bekasi (the Buni culture, Batujaya temples if a source places them in Bekasi or
Karawang — Karawang is OUT). Banten Lama and Serang, Rengasdengklok, Karawang, Bandung and Cirebon are OUT.
Region: southeast_asia.

- Dates: give the CE year. Saka dates in inscriptions = CE + 78; Hijri and Javanese (Anno Javanico) dates
  convert per policy.md.
- The OUT rule covers each government while the area is its seat: the Sunda Kingdom at Pakuan Pajajaran
  (Bogor, from about 1482 to 1579: acts for the whole kingdom); the VOC Governor-General and Council of the Indies
  at Batavia (1619–1799: Indies-wide decrees, appointments, campaigns and treaties elsewhere); the Dutch, French
  and British governments of the East Indies at Batavia and Buitenzorg (1800–1942: Daendels's and Raffles's
  Java-wide reforms, the Cultivation System, laws for the colony, governors-general); the Japanese military
  administration of Java (1942–1945: Java-wide decrees); the Republic of Indonesia from 1945 (except 1946–1949
  when the capital was Yogyakarta): national laws, cabinets, presidents, elections. Acts about the city are IN:
  Batavia's walls, canals, town hall and Stadhuis, the move south to Weltevreden, the 1905 Gemeente Batavia, the
  DKI Jakarta province (1961/1964), governors of Jakarta, the 2022–2024 law moving the capital to Nusantara as a
  city event (the city stops being capital).
- Main stage (IN as cards): Fatahillah's capture of Sunda Kelapa (1527), Coen's destruction of Jayakarta (1619),
  the Mataram sieges (1628, 1629), Erberveld's execution (1722), the 1740 Chinese massacre, the British capture
  and the battle of Meester Cornelis (1811), the 1926 PKI rising in Batavia, the Japanese entry (1942), the
  Proclamation at Pegangsaan Timur 56 (1945, read in the city), the Ikada rally (1945), the 1945–1946 fighting in
  Jakarta, the 1965 killings of the generals and Lubang Buaya, the 1966 student demonstrations, the 1974 Malari
  riots, the 1984 Tanjung Priok killings, the 27 July 1996 attack, the 1998 Trisakti shootings and May riots,
  Semanggi, the bombings (2000 Stock Exchange, 2003 Marriott, 2004 Australian embassy, 2009 hotels, 2016 Thamrin),
  the 2016–2017 mass rallies and Ahok's trial, the 2019 riots, the floods (1621 onwards, 2002, 2007, 2020).
- National bodies founded or meeting in the city are IN as city events (Budi Utomo at STOVIA 1908, the 1928 Youth
  Pledge congress, the Volksraad's opening, the PPKI sessions). International games and summits held in the city
  are IN (Asian Games 1962 and 2018, GANEFO 1963, ASEAN's founding 1967 in Bangkok is OUT).

| era slug | years | searches | expected cards |
|---|---|---|---|
| `pre1527` | the Buni culture, Tarumanagara inscriptions (Ciaruteun, Tugu), Batujaya, Pakuan Pajajaran, Sunda Kelapa and the 1522 Portuguese padrão | 35 | ~70 |
| `1527_1799` | Jayakarta, Coen's Batavia, the Mataram sieges, the castle and canals, the Chinese, the 1740 massacre, the VOC's end | 45 | ~200 |
| `1800_1941` | Daendels's Weltevreden, the British, Buitenzorg's garden, Tanjung Priok, the Gemeente, Budi Utomo, the Youth Pledge | 45 | ~220 |
| `1942_1965` | the Japanese occupation, the Proclamation, the revolution in Jakarta, Sukarno's monuments, the Asian Games, 1965 | 45 | ~180 |
| `1966_present` | 1966, Ali Sadikin's city, Malari, Tanjung Priok 1984, 1998, the bombings, the MRT, the floods, the move to Nusantara | 45 | ~250 |

Expected cards are a guide, not a target.

### Tehran (2026-11-24)

Area: Tehran Province as decided: Tehran city (the Arg and Golestan Palace, the bazaar, Shemiran with Tajrish,
Darband, Niavaran and Sa'dabad, Evin, Jaleh/Shohada Square, Azadi), Rey (Ray, ancient Rhages: Cheshmeh Ali,
Tepe Mil, the Tughril tower, the Shah Abdol-Azim shrine, Bibi Shahrbanu), Varamin (the Jameh mosque, Pishva,
Qal'eh Iraj), Damavand (the mountain and town), Firuzkuh, Shahriar, Eslamshahr, Pakdasht, Lavasan, Robat Karim,
Qods, Parand, Imam Khomeini Airport. Karaj and Alborz Province (separated 2010), Qazvin, Qom and Kashan (Fin)
are OUT. Region: west_asia.

- Dates: give the CE year. Lunar Hijri dates convert per policy.md. Solar Hijri (SH) years begin at the March
  equinox: a date from about 21 March to 31 December falls in CE = SH + 621, a date from 1 January to about
  20 March in CE = SH + 622. Convert each date, do not add blindly.
- The OUT rule covers each government while the area is its seat: the Buyid emirate at Rey (Rukn al-Dawla to
  Majd al-Dawla, about 943–1029) and the Seljuk court at Rey under Tughril (about 1043–1063): acts for the whole
  realm; the Qajar state from 1786 (Agha Mohammad Khan makes Tehran capital) to 1925; the Pahlavi state
  (1925–1979); the Islamic Republic from 1979: national laws, accessions and coronations as ceremonies, treaties
  signed in Tehran, cabinets, the Majlis's acts, elections, presidents. Acts about the city are IN: Tahmasp's
  walls (1553), Agha Mohammad Khan's choice of Tehran as capital as a city event, Naser al-Din Shah's new walls
  (1867), the municipality (baladiyeh, 1907/1910), Reza Shah's demolition of the walls and gates, the street
  plans, the Tehran metro, the city council and mayors.
- Main stage (IN as cards): the Mongol sack of Rey (1220), Griboyedov's killing at the Russian legation (1829),
  the 1891–1892 tobacco protest in Tehran, Naser al-Din Shah's assassination at Shah Abdol-Azim (1896), the
  1905–1906 basts at the shrine and the British legation, the 1908 bombardment of the Majlis, the 1909 capture
  of Tehran by the constitutionalists, the 1921 coup (Reza Khan's entry), the 1941 Allied entry, the 1952 30 Tir
  rising, the 1953 coup street fighting, the 15 Khordad 1963 rising, Black Friday at Jaleh Square (1978),
  Khomeini's return and Behesht-e Zahra speech (1979), the US embassy seizure (1979–1981), the Iraqi missile
  strikes on Tehran (1985, 1988), the 1981 Hafte Tir and prime minister's office bombings, the 1988 prison
  executions at Evin, the 1999 student protests, the 2009 Green Movement protests, the 2017 attacks on the Majlis
  and Khomeini's mausoleum, the 2020 shooting down of flight PS752 near Parand, Mahsa Amini's death (2022) and the
  protests in the city, Haniyeh's killing in Tehran (2024), the Israeli and US strikes on Tehran (2025).
- International summits and games held in the city are IN as city events (the 1943 Tehran Conference, the 1974
  Asian Games, the 1997 OIC summit, the 2012 Non-Aligned summit).

| era slug | years | searches | expected cards |
|---|---|---|---|
| `pre1220` | Cheshmeh Ali, Rhages of the Medes and Seleucids, Arsacid and Sasanian Rey, the Islamic conquest, the Buyids and Seljuks at Rey, Tughril's tomb | 35 | ~90 |
| `1220_1785` | the Mongol sack, Varamin under the Ilkhans, Clavijo's Tehran, Tahmasp's walls, Safavid and Zand Tehran | 35 | ~70 |
| `1786_1924` | the Qajar capital, Golestan, Griboyedov, Naser al-Din's city, Dar al-Funun, the tobacco protest, the Constitutional Revolution, 1921 | 45 | ~220 |
| `1925_1978` | Reza Shah's avenues, the 1941 occupation, the Tehran Conference, 1953, the White Revolution, Azadi tower, the 1978 revolution | 45 | ~220 |
| `1979_present` | 1979, the embassy, the war and the missiles, the metro and Milad tower, 1999, 2009, 2017, 2022, the 2025 strikes | 45 | ~250 |

Expected cards are a guide, not a target.

### Berlin (2026-11-25)

Area: Berlin (all 12 boroughs: Mitte with old Berlin, Cölln, Friedrichswerder and Dorotheenstadt; Spandau with
the citadel; Köpenick; Charlottenburg; Tempelhof; Kreuzberg; Prenzlauer Berg; Lichtenberg with Karlshorst and
Hohenschönhausen; Plötzensee; Grunewald; Wannsee and Pfaueninsel; Gatow; Tegel) and Potsdam (Sanssouci, the
New Palace, Cecilienhof and the New Garden, Babelsberg, the Garrison Church, Glienicke Bridge). Named
exceptions (user decision 2026-11-25): the Sachsenhausen camp at Oranienburg and Schönefeld/BER airport are
IN. The rest of Brandenburg is OUT: Brandenburg an der Havel, Lehnin, Seelow Heights, Bernau, Erkner,
Rheinsberg, Halbe. Region: western_europe (Step 0 also greps the eastern_europe cells).

- Dates: Brandenburg and Prussia moved from the Julian to the Gregorian calendar in 1700 (18 February
  Julian was followed by 1 March Gregorian). Convert earlier dates per policy.md.
- The OUT rule covers each government while the area is its seat:
  - the margraves and electors of Brandenburg with their residence at Berlin-Cölln (from Frederick II's
    palace, 1443–1451, to 1701) and at Potsdam: acts for the whole march or for Brandenburg-Prussia, accessions,
    births, marriages and funerals of the house, treaties. The Edict of Potsdam (1685) is OUT; the Huguenot
    colony in Berlin (its church, school, quarter) is IN.
  - the Kingdom of Prussia (1701–1918), with Berlin and Potsdam as residences; the North German Confederation
    (1867–1871); the German Empire (1871–1918); the Free State of Prussia (1918–1947); the Weimar Republic
    (1919–1933); Nazi Germany (1933–1945): national and Prussian laws (the 1808 Städteordnung is OUT; the first
    Berlin city council election under it, 1809, is IN), Reichstag and Landtag acts, cabinets, elections,
    accessions, treaties signed in the city, Nazi decrees for the whole Reich.
  - the Allied Control Council (1945–1948, acts for all Germany) is OUT; the Allied Kommandatura (acts for
    Berlin) is IN. The GDR government seated in East Berlin (1949–1990): Volkskammer acts, SED congresses,
    state funerals and national acts OUT. Federal German acts (Bonn) are OUT unless Berlin is the subject.
  - reunified Germany with Berlin as seat (Bundestag from 1999, federal government): federal laws, elections,
    cabinets, chancellors OUT. The state of Brandenburg seated in Potsdam (from 1990): state-wide acts OUT.
- Berlin as a Land (West Berlin from 1950, all Berlin from 1990) is a city government: its Senate, House of
  Representatives, governing mayors and Land laws are IN (city-state rule). Potsdam city acts are IN.
- Acts about the city are IN even when a higher government makes them: the union of Berlin and Cölln (1307,
  1432, 1709), the Berlin Customs Wall, the Hobrecht Plan (1862), the Greater Berlin Act (1920), Germania
  plans, the sector division (1945), the Wall (1961), the Four Power Agreement on Berlin (1971), the 1991
  capital decision and the move of the Bundestag (1999).
- Main stage (IN as cards): the Berliner Unwille (1448), the Russian and Austrian raids (1757, 1760),
  Napoleon's entry (1806), the March 1848 barricades, the November 1918 revolution in the city (the two
  proclamations), the Spartacist rising (1919), the Kapp Putsch (1920), Rathenau's assassination (1922), the
  Reichstag fire and the book burning (1933), the killings of 30 June 1934 in the city, Kristallnacht in
  Berlin (1938), the deportations from Grunewald and Moabit, the Rosenstrasse protest (1943), 20 July 1944 at
  the Bendlerblock, the air raids, the Battle of Berlin and the surrender at Karlshorst (1945), the blockade
  and airlift (1948–1949), 17 June 1953, the Wall and the escapes, Kennedy (1963) and Reagan (1987), the fall
  of the Wall (1989), the Breitscheidplatz attack (2016). The Day of Potsdam (1933) and the Wannsee Conference
  (1942) are unsure: list them in the report.
- International congresses, summits and games held in the area are IN as city events (the Congress of
  Berlin 1878, the Berlin Conference 1884–1885, the 1936 Olympics, the Potsdam Conference 1945, the 1971
  Four Power talks, the 2006 World Cup final, the 2009 World Athletics Championships).

| era slug | years | searches | expected cards |
|---|---|---|---|
| `pre1237` | prehistoric finds, Bronze Age sites, the Semnones, the Slav Hevelli at Spandau and Sprewanen at Köpenick, Jaxa, Albert the Bear (1157), the Spandau and Köpenick castles | 30 | ~50 |
| `1237_1700` | Cölln (1237) and Berlin (1244), the 1307 union, the Hanse, the Unwille, the palace, the Reformation, the Thirty Years' War, the Great Elector's new towns, the Huguenots, the Academy of Arts | 45 | ~180 |
| `1701_1870` | the royal capital, the 1709 union, Sanssouci, the Brandenburg Gate, the 1757/1760 raids, Napoleon, the university, Schinkel, the first railway (1838), 1848, the Hobrecht Plan, the Red Town Hall | 45 | ~250 |
| `1871_1918` | the imperial capital, the Gründerzeit, the Stadtbahn, the Reichstag building, the U-Bahn (1902), the Captain of Köpenick, the 1918 revolution | 45 | ~250 |
| `1919_1945` | the Spartacists, Greater Berlin (1920), the Kapp Putsch, the Golden Twenties, Tempelhof, 1933, the 1936 Olympics, Kristallnacht, Germania, the bombing, the battle and the surrender | 45 | ~250 |
| `1946_1989` | the sectors, the blockade and airlift, 17 June 1953, the Wall and the escapes, Kennedy, the Four Power Agreement, the 750th anniversary, Reagan, 9 November 1989 | 45 | ~250 |
| `1990_present` | reunification, the capital decision, the Wrapped Reichstag, the Bundestag move, the Hauptbahnhof, the Love Parade, the 2016 attack, BER (2020) | 45 | ~220 |

Expected cards are a guide, not a target. The world grid holds many Berlin events (about 230 lines in the
western_europe cells), so yields may be lower than the expected counts.

### Madrid (2026-11-25)

Area: the Community of Madrid as decided: Madrid city (the Alcázar and Royal Palace, the Plaza Mayor, Puerta del
Sol, the Retiro, the Prado and the Paseo, Atocha, Chamberí, Salamanca, Vallecas, Carabanchel, Barajas, Ciudad
Universitaria, the Casa de Campo, El Pardo), Alcalá de Henares (Complutum, the university, Cervantes), San Lorenzo
de El Escorial (the monastery, Cuelgamuros / Valley of the Fallen), Aranjuez, Chinchón, Getafe (Cerro de los
Ángeles), Leganés, Alcobendas, Móstoles, Torrejón de Ardoz (the air base), Paracuellos de Jarama, Brunete,
Navacerrada, Buitrago del Lozoya, the Lozoya and Canal de Isabel II works, the Jarama valley. Toledo, Segovia,
Guadalajara and Ávila are OUT. Region: western_europe.

- Dates: Spain moved from the Julian to the Gregorian calendar in October 1582 (4 October was followed by
  15 October). Convert earlier dates per policy.md. Muslim Mayrit dates in Hijri convert per policy.md.
- The OUT rule covers each government while the area is its seat:
  - before 1561 the Castilian court travelled: a Cortes or a royal stay in Madrid, Alcalá or Aranjuez
    (the Cortes of Madrid 1329, 1391, 1435; royal births and deaths) is OUT; town charters (fueros), town
    council acts and buildings are IN.
  - the Spanish Habsburg court from 1561 (Philip II makes Madrid the seat; IN as a city event) to 1700, except
    Valladolid 1601–1606 (the move away in 1601 and the return in 1606 are IN as city events); the Bourbons
    (1700–1808, 1814–1868, 1875–1931); Joseph Bonaparte (1808–1813); the First and Second Republics; Franco's
    state (from 1939; the Republic left Madrid for Valencia in November 1936); democratic Spain from 1975:
    national laws, accessions, coronations as ceremonies, royal births, marriages and funerals, Cortes and Congress
    acts, cabinets, national elections, treaties signed in the area (Aranjuez 1752, 1801; Madrid 1526, 1750),
    national court cases. Royal sites as buildings (El Escorial, Aranjuez, El Pardo, the Royal Palace) are IN.
  - the Community of Madrid (from 1983) is the government of the area unit itself: its Assembly, presidents and
    laws are IN, like the city council and mayors.
- Acts about the city are IN even when a higher government makes them: the 1561 court move, Philip III's move
  to Valladolid and back, the Ensanche (Castro plan, 1860), the Canal de Isabel II, the Gran Vía, the metro,
  Franco's planning acts for Madrid, the 1983 statute of the Community.
- Main stage (IN as cards): the Esquilache riots (1766), the Mutiny of Aranjuez (1808), the Dos de Mayo rising
  and the Tres de Mayo shootings (1808), the 1854 Vicalvarada and revolution, the San Gil barracks rising (1866),
  Prim's assassination (1870), the regicide attempt on the royal wedding (1906), Canalejas's assassination at
  Puerta del Sol (1912), Dato's assassination (1921), the Republic proclaimed at Puerta del Sol (1931), the
  burning of the convents (1931), Calvo Sotelo's killing (1936), the Montaña barracks (1936), the siege and
  bombing of Madrid (1936–1939), the Paracuellos killings (1936), Casado's coup (1939), Carrero Blanco's
  assassination (1973), the Atocha lawyers' massacre (1977), the 23-F coup in the Congress (1981), the 11-M
  train bombings (2004), 15-M at Puerta del Sol (2011).
- International congresses, summits and games held in the area are IN as city events (the 1982 World Cup final,
  the 1991 Middle East Peace Conference, the NATO summits of 1997 and 2022, COP25 in 2019). National party
  congresses and the Valley of the Fallen exhumation of Franco (2019) are unsure: list them in the report.

| era slug | years | searches | expected cards |
|---|---|---|---|
| `pre1561` | prehistoric sites of the Manzanares and Jarama, Complutum, Visigothic sites, Muslim Mayrit (Muhammad I's fort), the Christian conquest (1085), the fueros, medieval Madrid and Alcalá, Cisneros's university (1499) | 40 | ~120 |
| `1561_1807` | the court arrives, El Escorial, the Plaza Mayor, the Buen Retiro, the Valladolid interval, the Bourbon palace, Charles III's city (Prado, Puerta de Alcalá, Botanic Garden), the Esquilache riots, Aranjuez | 45 | ~250 |
| `1808_1930` | 1808, the French years, the Prado museum, the Canal de Isabel II, the Ensanche, the 1854 and 1868 revolutions, the first railway and tram, the metro (1919), the Gran Vía, the Telefónica | 45 | ~280 |
| `1931_1975` | the Republic at Sol, the convent burnings, the siege, Franco's Madrid, the Valley of the Fallen, the Castellana, the 1960s growth, the 1973 assassination | 45 | ~250 |
| `1976_present` | the Transition, Atocha 1977, the Movida, 23-F, the 1982 World Cup, the 1991 conference, Barajas T4, 11-M, 15-M, Madrid Río, the 2022 NATO summit | 45 | ~250 |

Expected cards are a guide, not a target. The world grid holds about 90 Madrid lines in the western_europe cells.

### Chicago (2026-11-25)

Area: the metropolitan area as decided: Cook County (Chicago with the Loop, the river and its branches, the
lakefront and Lake Michigan shore, Fort Dearborn site, Hyde Park, Pullman, Bronzeville, Back of the Yards and the
Union Stock Yards, Maxwell Street, O'Hare, Midway, Evanston, Oak Park, Cicero), the collar counties (DuPage, Kane,
Lake, McHenry, Will: Joliet, Aurora, Elgin, Naperville, Waukegan, the Argonne site, Fermilab, Lockport and the
I&M Canal) and northwest Indiana (Lake and Porter counties: Gary, Hammond, East Chicago, Whiting, the Indiana Dunes).
Kenosha (Wisconsin) and Kankakee are OUT. Region: north_america.

- Chicago was never a national or state capital (Illinois: Kaskaskia, Vandalia, Springfield; Indiana:
  Indianapolis). So only acts for the whole state or country are OUT: Illinois and Indiana state laws, federal
  laws, presidential acts, national court cases. Acts about the area are IN (the 1837 city charter, the I&M Canal
  acts, the Sanitary District, the 1889 annexations, the Burnham Plan, Chicago court cases).
- Indigenous history in the area is IN (Potawatomi, Miami, Illinois/Peoria villages; the 1795 Greenville and 1833
  Chicago treaties ceding the site are IN as city events; national Indian policy is OUT).
- National party conventions and congresses held in the area are IN as city events (the 1860 Wigwam convention,
  the 1932 and 1968 conventions; the 1893 World's Columbian Exposition and the Parliament of Religions; the 1933
  Century of Progress; the 1959 Pan American Games; the 1994 World Cup opening; the 2012 NATO summit).
- Main stage (IN as cards): the Fort Dearborn battle (1812), the Great Fire (1871), the 1877 railroad strike in
  the city, Haymarket (1886) and the trial and hangings, the Pullman strike (1894), the Eastland disaster (1915),
  the 1919 race riot, the St. Valentine's Day massacre (1929), the Memorial Day massacre (1937), the 1966 open
  housing marches, the 1968 riots and the convention protests, Fred Hampton's killing (1969), the 1995 heat wave.

| era slug | years | searches | expected cards |
|---|---|---|---|
| `pre1833` | prehistoric and Mississippian sites, the portage, Marquette and Jolliet (1673), La Salle, the French mission, du Sable's post, Fort Dearborn (1803, 1812, 1816), the Potawatomi | 30 | ~60 |
| `1833_1871` | the town and city charters, the 1833 treaty, the I&M Canal (1848), the railroads, the Board of Trade, raising the city, the Wigwam, Camp Douglas, the stock yards, the water tower, the Great Fire | 45 | ~200 |
| `1872_1918` | the rebuilding, the skyscrapers, Haymarket, Hull House, the 1893 fair, the L, Pullman, the river reversal (1900), the Burnham Plan, the Eastland, the Great Migration | 45 | ~280 |
| `1919_1955` | the race riot, the Capone years, 1929, the Century of Progress, the Depression, the Manhattan Project pile (1942), O'Hare, the first Daley election (1955) | 45 | ~250 |
| `1956_present` | the Daley machine, expressways and housing projects, 1966 and 1968, Sears Tower, Harold Washington, the 1992 flood, the Bulls, Millennium Park, Obama, the 2012 NATO summit | 45 | ~250 |

Expected cards are a guide, not a target.

### São Paulo (2026-11-25)

Area: the São Paulo Metropolitan Region (39 municipalities: São Paulo with the Pátio do Colégio, the Triangle,
Luz, Brás, Mooca, Bixiga, Liberdade, Ipiranga, Avenida Paulista, Pinheiros, the Tietê and Pinheiros rivers;
Guarulhos with the airport; the ABC (Santo André with Santo André da Borda do Campo, São Bernardo do Campo, São
Caetano do Sul, Diadema); Osasco; Mogi das Cruzes; Santana de Parnaíba; Embu; the Cantareira and Billings and
Guarapiranga reservoirs) plus Santos and São Vicente on the coast (the port, the 1532 town, the Serra do Mar road
and railway down to them). Campinas, Jundiaí, Sorocaba and Cubatão's industrial zone outside these towns are OUT.
Region: latin_america.

- Dates: Portugal and its colonies moved to the Gregorian calendar in October 1582.
- The OUT rule covers each government while the area is its seat: the Captaincy of São Vicente with its seat at
  São Vicente (1532 to about 1681) and later in São Paulo; the Captaincy of São Paulo (1709–1821); the Province of
  São Paulo (1822–1889); the State of São Paulo (from 1889): acts for the whole captaincy, province or state,
  governors' and presidents' appointments, state elections and state laws. Brazil's national governments never sat
  here: national laws, emperors' and presidents' acts are OUT unless the area is the subject. Acts about the city
  are IN (the 1711 city status, the Faculty of Law (1827), the Santos railway concession, city plans, the metro,
  mayors and the city council).
- Main stage (IN as cards): Pedro I's Cry of Ipiranga (7 September 1822), the 1924 revolt and the bombardment of
  the city, the 1932 Constitutionalist Revolution (the MMDC killings of 23 May, the city's war effort), the 1968
  student fights (Rua Maria Antônia), Vladimir Herzog's death at DOI-CODI (1975) and the ecumenical service, the
  ABC metalworkers' strikes (1978–1980), the Diretas Já rally at Praça da Sé (1984), the Carandiru massacre (1992),
  the 2006 PCC attacks, the June 2013 protests.
- International and national congresses, summits and games held in the area are IN as city events (the 1922 Week of
  Modern Art, the São Paulo Biennial (1951), the 1963 Pan American Games, the 2014 World Cup opening).

| era slug | years | searches | expected cards |
|---|---|---|---|
| `pre1554` | sambaquis and prehistoric sites, the Tupiniquim, João Ramalho, Martim Afonso founds São Vicente (1532), the first sugar mill, Santos (1546), Santo André da Borda do Campo (1553) | 25 | ~50 |
| `1554_1821` | the Jesuit college (1554), the 1560s wars and the move from Santo André, the bandeiras, the 1711 city charter, the captaincy seat, churches and convents, the Calçada do Lorena | 45 | ~150 |
| `1822_1929` | the Cry of Ipiranga, the Faculty of Law, the Santos railway (1867), coffee, immigrants, Brás and the Hospedaria, abolition, Avenida Paulista, the Municipal Theatre, the 1917 general strike, the 1922 Week of Modern Art, the 1924 revolt | 45 | ~250 |
| `1930_1984` | 1932, the University of São Paulo (1934), the Prestes Maia avenues, the Martinelli and Copan, the Biennial, Ibirapuera (1954), the ABC car industry, the metro (1974), the Joelma fire, Herzog, the ABC strikes, Diretas Já | 45 | ~250 |
| `1985_present` | redemocratisation, Erundina, Carandiru, the Rodoanel, the Paulista Museum and MASP, the 2006 attacks, the 2013 protests, the 2014 World Cup, the 2014–2015 water crisis, the Formula 1 race at Interlagos | 45 | ~250 |

Expected cards are a guide, not a target.

### Lagos (2026-11-26)

Area: Lagos State as decided (Lagos Island with Isale Eko, the Iga Idunganran palace, the Marina and Tinubu Square;
Ikoyi; Victoria Island and Lekki; Ebute Metta, Yaba, Surulere, Mushin, Apapa with the port, Ajegunle; Ikeja with the
airport and the cantonment; Agege; Badagry with the slave market, the Agia tree and the first storey building; Epe;
Ikorodu; the Lagos Lagoon, Five Cowrie Creek and the Lekki coast). Ota, Abeokuta, Ijebu-Ode, Porto-Novo and Ouidah are
OUT. Region: subsaharan_africa.

- The Kingdom of Lagos (the Obas of Lagos, the Idejo chiefs, the Eko court) is a city government: its successions,
  wars and acts are IN. Benin overlordship and Benin acts for the whole kingdom are OUT unless Lagos is the subject.
- The Colony of Lagos (1862–1906) is a city government (the colony and the area are about the same): its governors,
  ordinances and works are IN. The OUT rule covers each government while the area is its seat for a larger
  territory: the Colony and Protectorate of Southern Nigeria (1906–1914), the Colony and Protectorate of Nigeria
  (1914–1960) and the Federation and Federal Republic of Nigeria (1960 to 12 December 1991, the move to Abuja):
  amalgamation, constitutions, national elections, cabinets, heads of state, national laws and decrees, coups that
  are not fought in the city. Acts about the city are IN (the 1861 cession, the Lagos Town Council (1917), the
  Lagos Executive Development Board, the Federal Territory (1954), the creation of Lagos State (1967), the capital
  move decree (1976) and the move (1991)).
- Lagos State (from 1967; seat at Ikeja from 1976) covers the whole area: it is a city government (city-state
  rule). Its governors, the House of Assembly and state laws are IN.
- Main stage (IN as cards): the British bombardment of Lagos (1851), the 1908 water-rate protests, the 1929
  women's tax protests in the city, the 1945 general strike, the 1949 Iva Valley reaction protests in the city,
  independence night at the Racecourse (1960) is unsure (list it in the report), the January 1966 coup killings in
  the city, the 1976 assassination of Murtala Mohammed, FESTAC '77, the 1990 Orkar coup attempt at Dodan Barracks,
  the June 12 protests (1993), the Ikeja cantonment explosion (2002), the 2012 Occupy Nigeria protests in the city,
  the #EndSARS protests and the Lekki toll gate shooting (2020).
- International congresses, festivals and games held in the area are IN as city events (FESTAC '77, the 1973 All
  Africa Games, the 1980 African Cup of Nations, OAU summits held in Lagos).

| era slug | years | searches | expected cards |
|---|---|---|---|
| `pre1861` | prehistoric finds, the Awori settlement of Iddo and Ebute Metta, the Benin war camp (Eko), Ashipa and the Obas, the Portuguese name (1472), the slave trade at Lagos and Badagry, Kosoko and Akitoye, the missions at Badagry (1842), the 1851 bombardment, the consulate | 35 | ~100 |
| `1861_1959` | the cession (1861), the colony, the Brazilian returnees, the Saro, the Lagos railway (1896–1901), the Eleko affair, Herbert Macaulay, the Town Council, the Yaba Higher College, Ikoyi, the 1945 strike, the Federal Territory (1954) | 45 | ~200 |
| `1960_1990` | independence, the 1966 coups in the city, the civil war years, Lagos State (1967), the oil boom, the National Theatre and FESTAC, the Third Mainland Bridge, the capital move decree, the 1990 coup attempt | 45 | ~150 |
| `1991_present` | the capital move to Abuja (1991), June 12, the Ikeja explosion, the Lekki free zone, Eko Atlantic, the BRT and the Blue Line rail (2023), Ebola (2014), #EndSARS (2020), the Dangote refinery (2023) | 45 | ~180 |

Expected cards are a guide, not a target.

### Johannesburg (2026-11-26)

Area: Gauteng Province as decided (Johannesburg with the CBD, Ferreirasdorp, Braamfontein, Hillbrow, Sophiatown,
Alexandra, Soweto with Orlando and Kliptown, Melville Koppies; the Witwatersrand mines and towns: Krugersdorp,
Roodepoort, Germiston, Boksburg, Benoni, Springs, Randfontein; Pretoria/Tshwane with Church Square, the Union
Buildings, the Voortrekker Monument, Mamelodi, Atteridgeville; Sharpeville, Vereeniging, Vanderbijlpark and Sebokeng;
Kempton Park with OR Tambo airport; the Cradle of Humankind (Sterkfontein, Swartkrans, Kromdraai, Rising Star) and
Cullinan). Taung, Mapungubwe, Rustenburg, Marikana and Hartbeespoort's dam in North West are OUT. Region:
subsaharan_africa.

- The OUT rule covers each government while the area is its seat: the South African Republic (ZAR, Transvaal) with
  its seat at Pretoria (from 1860); the Transvaal Colony (1902–1910); the Union of South Africa (1910–1961) and the
  Republic (from 1961) with Pretoria as administrative capital; the Transvaal Province (1910–1994, seated in
  Pretoria); Gauteng Province (from 1994, seated in Johannesburg): national and provincial laws (apartheid laws
  such as the Population Registration Act and the Group Areas Act are OUT), parliaments, cabinets, presidents,
  elections, treaties and conventions signed in the area (the Pretoria Convention 1881). Acts about the area are IN
  (the proclamation of the Johannesburg goldfields (1886), Pretoria's founding, the Johannesburg municipality
  (1897), the Natives (Urban Areas) acts applied to Johannesburg townships, the Sophiatown and Alexandra removals,
  Soweto's naming (1963), the Tshwane and City of Johannesburg metros (2000)).
- Main stage (IN as cards): the siege of Pretoria (1880–1881), the Jameson Raid ending at Doornkop (1896), the
  British capture of Johannesburg and Pretoria (1900), the Vereeniging peace talks (1902), the 1913 and 1922 Rand
  strikes and the Rand Rebellion, the 1946 African mine workers' strike, the Congress of the People and the
  Freedom Charter at Kliptown (1955), the Treason Trial (1956–1961), the Women's March to the Union Buildings
  (1956), the Sharpeville massacre (1960), the Rivonia raid (1963) and the Rivonia Trial (1963–1964), the Soweto
  uprising (1976), the Church Street bombing (1983), the Vaal uprising (1984), Boipatong (1992), the assassination
  of Chris Hani (1993), the Shell House shooting (1994). The 1994 presidential inauguration at the Union Buildings
  is unsure: list it in the report.
- International congresses, summits and games held in the area are IN as city events (the 1995 Rugby World Cup
  final at Ellis Park, the 2002 Earth Summit, the 2010 FIFA World Cup final at Soccer City, BRICS summits in
  Johannesburg, the 2025 G20 summit).

| era slug | years | searches | expected cards |
|---|---|---|---|
| `pre1886` | the hominin sites (Sterkfontein, Swartkrans, Kromdraai, Rising Star), Stone Age and Iron Age sites, the Tswana towns (Kweneng, Kaditshwene is OUT), Mzilikazi's Ndebele (1820s–1837), the Voortrekkers, Pretoria (1855), the ZAR capital (1860), the siege of Pretoria (1880–1881) | 35 | ~80 |
| `1886_1947` | the gold discovery and the proclamation (1886), the mining camp and the Rand, the Corner House, the Jameson Raid, the 1900 capture, Gandhi in Johannesburg, the Union Buildings (1913), the 1922 rebellion, Wits University, Sophiatown, Orlando, the 1946 strike | 45 | ~220 |
| `1948_1993` | the townships and removals, Kliptown, the Women's March, Sharpeville, Rivonia, Soweto 1976, the Carlton Centre, the Church Street bomb, the Vaal uprising, the 1980s states of emergency in the townships, Mandela's release rally at Soccer City (1990), Boipatong, Hani | 45 | ~220 |
| `1994_present` | Shell House, the 1995 Rugby World Cup final, Gauteng and the metros, the Constitutional Court at Constitution Hill, Gautrain (2010), the 2010 World Cup, the 2008 xenophobic attacks, the 2021 unrest, Hillbrow and the 2023 Marshalltown fire, the 2025 G20 summit | 45 | ~180 |

Expected cards are a guide, not a target.

### Buenos Aires (2026-11-26)

Area: Greater Buenos Aires as decided: the Autonomous City (CABA: the Plaza de Mayo with the Cabildo, the Casa Rosada
and the cathedral; San Telmo, La Boca and the Riachuelo, Monserrat, Retiro, Recoleta, Palermo, Belgrano, Flores,
Puerto Madero, the Costanera and the Río de la Plata shore) and the 24 partidos of the conurbation (Avellaneda,
Lanús, Lomas de Zamora, Quilmes, La Matanza, Morón, San Isidro, Vicente López, San Fernando, Tigre with the delta
towns, San Martín, Tres de Febrero, Merlo, Moreno, Ezeiza with the airport, Esteban Echeverría and the rest). La
Plata, Luján, Pilar, Escobar, Campana, Zárate and Colonia del Sacramento are OUT. Region: latin_america.

- Dates: Spain and its colonies moved to the Gregorian calendar in October 1582.
- The OUT rule covers each government while the area is its seat for a larger territory: the Governorate of the
  Río de la Plata (from 1617), the Viceroyalty of the Río de la Plata (1776–1810), the Primera Junta, the
  Triumvirates and the Directorate (1810–1820), the Province of Buenos Aires with its governors seated in the city
  (to 1880; Rosas's acts for the Confederation, 1829–1852), the State of Buenos Aires (1852–1861) and the Argentine
  national government (from 1862): viceregal, provincial and national laws, decrees, elections, presidents,
  cabinets, Congress, treaties, coups that are not fought in the streets. Acts about the city are IN (the 1580
  founding, the cabildo's acts, the 1880 federalisation of the city, the 1887 annexation of Flores and Belgrano,
  the city plans, the subway (1913), the 1994 city autonomy).
- The cabildo (to 1821), the municipality and its intendentes, and the Autonomous City (from 1996, with its Head of
  Government and Legislature) are city governments: IN (city-state rule). Province of Buenos Aires acts after 1880
  (seat at La Plata) are OUT unless the area is the subject.
- Main stage (IN as cards): the British invasions (1806, 1807), the open cabildo and the May Revolution (22–25 May
  1810), the 1871 yellow fever epidemic, the 1880 battles in the city, the Revolution of the Park (1890), the
  Tragic Week (1919), the 1930 coup march on the Casa Rosada, 17 October 1945 in the Plaza de Mayo, the bombing of
  the Plaza de Mayo (16 June 1955) and the church burnings, the Mothers of the Plaza de Mayo (1977) and ESMA, the
  1982 Plaza rallies, the Israeli embassy (1992) and AMIA (1994) bombings, the December 2001 riots, Cromañón (2004).
  Presidential inaugurations are OUT.
- International congresses, summits and games held in the area are IN as city events (the 1951 Pan American Games,
  the 1978 World Cup final at the Monumental, the 2018 Youth Olympics, the 2018 G20 summit).

| era slug | years | searches | expected cards |
|---|---|---|---|
| `pre1810` | Querandí sites, Solís (1516), Mendoza's first founding (1536) and its end (1541), Garay's second founding (1580), the cabildo, the port and smuggling, the governorate (1617), the Jesuits, the viceroyalty (1776), the British invasions | 35 | ~120 |
| `1810_1879` | the May Revolution, the 1820 anarchy in the city, Rivadavia's city works, Rosas and the Mazorca, the 1845–1850 blockades, Caseros (1852, OUT unless in the area), the first railway (1857), the 1871 yellow fever, the Teatro Colón (first, 1857) | 45 | ~200 |
| `1880_1945` | federalisation, the port (Puerto Madero), the Avenida de Mayo, immigration and the conventillos, 1890, the centenary (1910), the subway (1913), the Tragic Week, tango, the Obelisk (1936), the Avenida 9 de Julio, 17 October 1945 | 45 | ~250 |
| `1946_1983` | Perón's Buenos Aires, Ezeiza airport (1949), the 1955 bombing, the villas miseria, the Ezeiza massacre (1973), the junta years and ESMA, the Mothers, the 1978 World Cup, the 1982 rallies | 45 | ~220 |
| `1984_present` | democracy, the city autonomy (1996), the embassy and AMIA bombings, 2001, Cromañón, the Metrobus, the 2018 Youth Olympics and G20, the 2022 World Cup celebrations at the Obelisk | 45 | ~220 |

Expected cards are a guide, not a target.

### Los Angeles (2026-11-26)

Area: the metropolitan area as decided: Los Angeles County (Los Angeles with the Plaza and Olvera Street,
Downtown, Hollywood, Watts, Boyle Heights, Venice, the San Fernando Valley, San Pedro and the port; Long Beach;
Pasadena; Santa Monica; Burbank; Glendale; Malibu; Catalina Island; the Los Angeles River), Orange County (Anaheim,
Santa Ana, Irvine, Mission San Juan Capistrano, Huntington Beach, Newport Beach) and the Inland Empire (Riverside
and San Bernardino counties: Riverside, San Bernardino, Ontario, Palm Springs and the Coachella Valley, Joshua Tree,
Big Bear). Ventura County, Santa Barbara and San Diego County are OUT. Region: north_america.

- The OUT rule covers Alta California's government while the area was its seat (the Mexican congress named Los
  Angeles the capital in 1835; Governor Pío Pico governed from Los Angeles in 1845–1847): acts for all Alta
  California in those years. Otherwise Los Angeles was never a state or national capital: only acts for the whole
  of California, Mexico or the United States are OUT (state and federal laws, presidential acts, national court
  cases). Acts about the area are IN (the 1781 founding, the 1850 city and county, the Owens Valley aqueduct, the
  Colorado River Aqueduct, the freeway plans, city charters and mayors, LA court cases).
- Indigenous history is IN (the Tongva, Tataviam, Acjachemen, Serrano and Cahuilla villages; the missions San
  Gabriel (1771), San Juan Capistrano (1776) and San Fernando (1797)).
- Main stage (IN as cards): the Battle of Dominguez Rancho (1846) and the Battles of Río San Gabriel and La Mesa
  (1847), the Treaty of Cahuenga (1847), the Chinese massacre (1871), the Los Angeles Times bombing (1910), the St.
  Francis Dam failure (1928), the Zoot Suit Riots (1943), the Watts riots (1965), Robert F. Kennedy's
  assassination at the Ambassador Hotel (1968), the East LA Chicano Moratorium (1970), the 1992 riots, the
  Northridge earthquake (1994), the January 2025 wildfires, the June 2025 immigration-raid protests and the troop
  deployment in the city.
- International congresses, summits, games and fairs held in the area are IN as city events (the 1932 and 1984
  Olympics, the 1994 World Cup final at the Rose Bowl, the 2026 World Cup matches; Academy Awards ceremonies are
  arts cards).

| era slug | years | searches | expected cards |
|---|---|---|---|
| `pre1781` | the La Brea tar pits finds, Los Angeles Man and early sites, the Tongva villages (Yaanga), Cabrillo (1542), Vizcaíno (1602), Portolà (1769), the San Gabriel mission (1771), Anza (1774), San Juan Capistrano (1776) | 35 | ~70 |
| `1781_1849` | the pueblo's founding (1781), the Plaza church, San Fernando (1797), the ranchos, Mexican independence and secularisation, the capital years, the 1846–1847 battles, Cahuenga, the gold rush years | 45 | ~120 |
| `1850_1919` | the city and county (1850), the 1871 massacre, the railroads (1876, 1885), the boom of the 1880s, oil (1892), the port at San Pedro, Hollywood and the film industry, the Times bombing, the aqueduct (1913), Orange County (1889) and the citrus belt | 45 | ~220 |
| `1920_1964` | the 1920s boom, the City Hall (1928), the St. Francis Dam, the 1932 Olympics, the Hoover Dam power, the aircraft industry, the Zoot Suit Riots, the freeways, Disneyland (1955), the Dodgers and Chavez Ravine | 45 | ~250 |
| `1965_present` | Watts, RFK, the Moratorium, Bradley, the 1984 Olympics, the Metro Rail (1990), 1992, Northridge, the Getty Center, the 2025 fires and protests, the 2028 Olympics preparations | 45 | ~250 |

Expected cards are a guide, not a target.

### Sydney (2026-11-26)

Area: Greater Sydney as decided (Sydney Cove and The Rocks, the CBD, Port Jackson and its harbour islands, Botany
Bay with La Perouse and Kurnell, Parramatta, Windsor and the Hawkesbury towns, Liverpool, Penrith, Campbelltown,
Castle Hill and Rouse Hill, Bondi, Manly, Cronulla) plus the Blue Mountains (Katoomba,
Leura, Blackheath, the 1813 crossing route) and Wollongong (the Illawarra coast, Port
Kembla). The Central Coast, Newcastle, Lithgow, the Jenolan Caves and Canberra are OUT. Region: oceania.

- The OUT rule covers each government while the area is its seat for a larger territory: the Colony of New South
  Wales (1788–1901; its governors and Legislative Council acted for a colony that once included Victoria,
  Queensland, Tasmania and New Zealand) and the State of New South Wales (from 1901): colony-wide and state-wide
  laws and acts, governors' commissions, premiers, cabinets, state elections. The early settlement is the colony's
  whole life: the governors' orders for Sydney, Parramatta and the Hawkesbury, the first buildings, the convict
  works and the town plans are IN. The Commonwealth never sat in Sydney (Melbourne 1901–1927, then Canberra):
  federal acts are OUT unless the area is the subject. Acts about the city are IN (the 1842 incorporation of
  Sydney, the Sydney Harbour Bridge Act, the County of Cumberland plan, the Opera House, the city councils and
  lord mayors, the Greater Sydney Commission).
- Aboriginal history in the area is IN (the Eora, Darug, Dharawal, Guringai and Gundungurra peoples, rock
  engravings, Bennelong and Pemulwuy, the frontier wars of the Hawkesbury and Appin).
- Main stage (IN as cards): the arrival of the First Fleet and the flag at Sydney Cove (26 January 1788), the
  Battle of Parramatta (1797), the Castle Hill convict rising (1804), the Rum Rebellion (1808), the Appin massacre
  (1816), the 1938 Day of Mourning, de Groot at the Harbour Bridge opening (1932), the Japanese midget submarine
  attack (1942), the 1970 Vietnam moratorium, the first Mardi Gras (1978), the Hilton bombing (1978), the 1988
  bicentenary protest, the Cronulla riots (2005), the Lindt Café siege (2014), the Bondi Junction stabbings
  (2024), the Bondi Beach Hanukkah shooting (December 2025).
- International congresses, summits and games held in the area are IN as city events (the 1938 Empire Games, the
  2000 Olympics and Paralympics, the 2003 Rugby World Cup final, the 2007 APEC summit, World Youth Day 2008, the
  2023 Women's World Cup final).

| era slug | years | searches | expected cards |
|---|---|---|---|
| `pre1788` | rock shelters and the oldest dates (Parramatta River, Cranebrook, Shaws Creek), shell middens, engravings, the Eora clans, Cook at Kurnell (1770), Banks's plants | 35 | ~60 |
| `1788_1850` | the First Fleet, the 1789 smallpox, Bennelong, Parramatta and the Hawkesbury, Pemulwuy, the Castle Hill rising, the Rum Rebellion, Macquarie's town, the Blue Mountains crossing (1813), the Bank of NSW (1817), the 1842 city council, the end of transportation (1840) | 45 | ~200 |
| `1851_1913` | the gold years, the university (1850 Act, 1852 opening), the first railway (1855), the GPO, the 1891 strike, the plague of 1900, Federation day in Centennial Park (1901), Bondi, the Illawarra mines, the 1913 naming of the Harbour Bridge plans | 45 | ~220 |
| `1914_1969` | the war years, the 1919 flu, the Harbour Bridge (1932), the 1938 Day of Mourning and Empire Games, the 1942 submarine attack, postwar migration, the Opera House competition (1957) and works, Utzon's exit (1966) | 45 | ~220 |
| `1970_present` | the moratorium, the green bans, the Opera House opening (1973), Granville (1977), Mardi Gras, the bicentenary, the 1994 fires, the 2000 Olympics, Cronulla, APEC, the Lindt siege, the 2019–2020 fires, the metro (2019), Western Sydney Airport | 45 | ~250 |

Expected cards are a guide, not a target.
