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

Wave 2 cells: subsaharan_africa religion 500_1500, subsaharan_africa economy 1500_1800,
western_europe science 1500_1800, western_europe arts 1800_1945, eastern_europe politics 1500_1800,
eastern_europe society 1945_present, north_america society 1500_1800, north_america science 1945_present,
latin_america religion pre500bce, latin_america economy 1800_1945, oceania economy 1800_1945,
oceania arts 1945_present.
