# History grid definitions (wave 1, 2026-11-04)

## Regions (slug: scope)
- east_asia: China (excluding Tibet and Xinjiang), Korea, Japan, Taiwan
- south_asia: India, Pakistan, Bangladesh, Sri Lanka, Nepal, Bhutan, Maldives
- southeast_asia: Myanmar, Thailand, Laos, Cambodia, Vietnam, Malaysia, Singapore, Indonesia, Brunei, Philippines, Timor-Leste
- central_asia: Kazakhstan, Uzbekistan, Turkmenistan, Kyrgyzstan, Tajikistan, Afghanistan, Mongolia, Tibet, Xinjiang, the Eurasian steppe
- west_asia: Anatolia, Levant, Mesopotamia, Arabian Peninsula, Iran, Caucasus, Cyprus
- north_africa: Egypt, Libya, Tunisia, Algeria, Morocco, Nubia / northern Sudan
- subsaharan_africa: all other African states, including the Horn, Sahel, and Madagascar
- western_europe: Iberia, France, Low Countries, British Isles, Germany, Switzerland, Austria, Italy, Scandinavia, Iceland
- eastern_europe: Poland, Czechia, Slovakia, Hungary, Balkans, Greece, Romania, Moldova, Baltic states, Belarus, Ukraine, Russia (including Siberia)
- north_america: United States, Canada, Greenland
- latin_america: Mexico, Central America, Caribbean, South America
- oceania: Australia, New Zealand, New Guinea, Pacific islands

## Themes (slug: scope)
- politics: states, rulers, wars, battles, treaties, revolutions, laws, independence
- science: science, technology, medicine, mathematics, engineering, inventions, astronomy
- religion: religions, philosophies, founders, councils, scriptures, religious buildings and reforms
- arts: literature, visual art, architecture, music, theatre, film
- economy: trade, money, agriculture, industry, exploration, trade routes, companies, economic crises
- society: social change, education, rights movements, slavery and abolition, epidemics, natural disasters, famines, population, sport

## Periods (slug: year range; negative = BCE)
- pre500bce: year <= -501, prehistory included
- 500bce_500ce: -500 to 499
- 500_1500: 500 to 1499
- 1500_1800: 1500 to 1799
- 1800_1945: 1800 to 1944
- 1945_present: 1945 to 2026

## Wave 1 (2026-11-04, committed d315713)
12 cells, one agent each, run in parallel. Web search is capped per session (about 200 calls,
shared by every agent; refills about 100/hour; setting `CLAUDE_CODE_MAX_WEB_SEARCHES_PER_SESSION`).
The cap ran out after the first ~20 searches per agent, so most entries are `unverified`.
Next: a checking-only pass on the 12 cells, then wave 2 (the 12 cells below), after the cap is raised.

## Wave 2 (2026-11-04)
12 cells below, one agent each, 12 searches per agent (cap still not raised). About 1,770 dates,
mostly `unverified` (about 1,535). deck-history-check exit 0 on all 12.
Next: a checking-only pass on waves 1 and 2, after the cap is raised; then wave 3.
Open: Finland is in no region (western_europe lists only Scandinavia + Iceland).

## Check pass on waves 1 + 2 (2026-11-04)
Search cap raised to 1000. 21 cells, one Sonnet agent each, brief `check_prompt.md`, budget 0.4 search
per unverified entry (10–70), about 660 searches used. Unverified 2,170 → 668; high 835 → 1,957;
disputed 40 → 120. 36 dates corrected (new peg + scene). 1,762 entries now carry `source:`.
WebFetch costs no searches: encyclopedia.com, MacTutor, HistoryWorld, Linda Hall and Kiwix / IPFS
Wikipedia mirrors work; Britannica, Met, British Museum, Smarthistory refuse.
Open (not done): relabel 8 western_europe_arts `disputed` works under the first-public-appearance rule;
Gheo-Shih -6600 is an uncalibrated C14 date; La Galgada / Kotosh start-of-phase; Kanishka era
(123 vs 127); Panama 1880/1881 text; Ai-Khanoum text; Mugujeonggwang "sealed"; Ouidah 1692 and
Alaca Höyük -2250 doubtful; one-year calendar `disputed` labels; top-up of the 668 unverified.

## Wave 3 (2026-11-04)
One new theme per region; each theme and each period twice. Budget 25 searches per agent.
east_asia arts 1500_1800, south_asia science pre500bce, southeast_asia religion 1500_1800,
central_asia economy 500bce_500ce, west_asia politics 1945_present, north_africa religion pre500bce,
subsaharan_africa politics 1800_1945, western_europe society 500_1500, eastern_europe arts 500bce_500ce,
north_america economy 1800_1945, latin_america science 500_1500, oceania society 1945_present.
Result: about 1,110 dates (high ~480, medium ~150, disputed ~30, unverified ~440); check exit 0 on all.
Cells are thinner than waves 1–2 (26–212); some agents stopped with searches unspent — the brief
must say "spend the whole budget". Grid now 37 of 432 cells, about 4,400 dates.
Open: Jin Ping Mei 1610 → 1617 (first print); Palace of Eternal Life → 1689 premiere; Karnak
Senusret I uses accession year; an invention rule (demonstration vs patent: McCormick 1831/1834);
weak 1861 "jet" scenes in subsaharan_africa_politics.

Wave 2 cells: subsaharan_africa religion 500_1500, subsaharan_africa economy 1500_1800,
western_europe science 1500_1800, western_europe arts 1800_1945, eastern_europe politics 1500_1800,
eastern_europe society 1945_present, north_america society 1500_1800, north_america science 1945_present,
latin_america religion pre500bce, latin_america economy 1800_1945, oceania economy 1800_1945,
oceania arts 1945_present.

## Wave 4 (2026-11-04)
One new theme per region; each theme and each period twice. Budget 25 searches per agent; brief now
says "spend the whole budget", warns about astronomical years, and asks agents to list invention cases.
west_asia economy pre500bce, north_africa science pre500bce, western_europe politics 500bce_500ce,
east_asia religion 500bce_500ce, central_asia science 500_1500, southeast_asia arts 500_1500,
latin_america arts 1500_1800, eastern_europe economy 1500_1800, north_america religion 1800_1945,
oceania politics 1800_1945, subsaharan_africa society 1945_present, south_asia society 1945_present.
Result: 1,858 dates (high 1,166, medium 237, low 13, disputed 41, unverified 401); check exit 0 on all.
Every agent spent all 25 searches. Sizes 63–376 (western_europe_politics 376, oceania_politics 303).
Grid now 49 of 432 cells, about 6,240 dates.
Mirrors: auto-mode refuses IPFS hosts (dweb.link, ipfs.aleph.im); 4everland times out; Kiwix
kaweah.freedombox.rocks works. nzhistory.govt.nz returns 403. Brief updated.
Open:
- world_dates.yaml: Samarkand paper 751 scene states the Talas-prisoner legend as fact; "Angkor Wat
  begun 1113" is Suryavarman II's accession; Boudica 60 vs 61; Gauls sack Rome -387 vs 390.
- Scope rule for works printed outside the region (Garcilaso, Ercilla, Sor Juana printed in Spain).
- north_america_religion: 4 entries keep the memory year against one source (Cumberland 1810/1816,
  Christian Reformed 1857/1858, Southern Baptist Seminary 1859/1860, Andover 1807/1808).
- Peg overload of round dates is now severe: lasso 17 (north_africa_science), rhino 20 (oceania 1942).
- Invention cases listed in north_africa_science (water clock, sundial, glass, Egyptian blue, wheel).
- Future cells: Ambedkar Nagpur conversion 1956 → south_asia religion 1945_present.
