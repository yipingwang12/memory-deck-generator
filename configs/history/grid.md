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

Boundary rules (2026-11-05):
- Finland → western_europe (with Scandinavia), in every period.
- Constantinople / Istanbul (the city, both shores) → eastern_europe, in every period (Byzantine and
  Ottoman). Anatolia outside the city → west_asia.
- Steppe: the Pontic-Caspian steppe west of the Ural River → eastern_europe. The Kazakh steppe east of
  the Ural River, Mongolia and the Altai-Sayan mountains → central_asia, also the parts inside modern
  Russia. The Siberian forest and tundra → eastern_europe.
- Scope of events issued outside a region: policy.md "Scope".

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
- world_dates.yaml: FIXED 2026-11-04 (Talas scene no longer states the paper legend; 1113 = accession
  only; Boudica 60 → 61). Gauls sack Rome stays -387 (390 is Varro's chronology).
- Scope rule for works printed outside the region (Garcilaso, Ercilla, Sor Juana printed in Spain).
- north_america_religion: 4 entries keep the memory year against one source (Cumberland 1810/1816,
  Christian Reformed 1857/1858, Southern Baptist Seminary 1859/1860, Andover 1807/1808).
- Peg overload of round dates is now severe: lasso 17 (north_africa_science), rhino 20 (oceania 1942).
- Invention cases listed in north_africa_science (water clock, sundial, glass, Egyptian blue, wheel).
- Future cells: Ambedkar Nagpur conversion 1956 → south_asia religion 1945_present.

## Wave 5 (2026-11-04)
One new theme per region; each theme and each period twice. Budget 25 searches per agent.
west_asia religion pre500bce, central_asia arts pre500bce, south_asia politics 500bce_500ce,
east_asia economy 500bce_500ce, subsaharan_africa arts 500_1500, western_europe economy 500_1500,
north_america politics 1500_1800, latin_america society 1500_1800, eastern_europe science 1800_1945,
oceania religion 1800_1945, southeast_asia science 1945_present, north_africa society 1945_present.
Result: 2,097 dates (high 1,475, medium 303, low 28, disputed 59, unverified 232); check exit 0 on all.
Every agent spent all 25 searches. Sizes 49–436 (north_america_politics 436). Grid now 61 of 432
cells, about 8,330 dates. Kom Ombo move fixed 1964 → 1963 (start-of-phase rule).
Brief updated: exact Kiwix path; never keep a memory year against a source; phases by start.
Open:
- Scope rule "issued outside the region, effect inside": works printed in Spain (latin_america_arts),
  crown laws for the Americas (latin_america_society, included), Acts of Parliament (north_america_politics,
  included), satellites launched abroad (southeast_asia_science, included under owner). One rule needed.
- Region overlap: central_asia "Eurasian steppe" vs eastern_europe Siberia. central_asia_arts took
  Trans-Ural and Sayan-Altai steppe; Pontic-Caspian left to eastern_europe. Write into Regions.
- Alaca Höyük: west_asia_religion uses -2850 (phase start); earlier cell has -2250 (doubtful).
- Maurya founding: world_dates -322, south_asia_politics -321 (medium).
- Memory year kept against one source (re-check): Rota Waitoa 1853/1852 (oceania_religion), Golden Rice
  court 2024/2023 (southeast_asia_science), plus the 4 north_america_religion cases above.
- Invention cases: eastern_europe_science (Lodygin demo, Kaplan patent + demo, Penkala, Bíró,
  Just–Hanaman patents, Schilling demo, Mozhaysky), southeast_asia_science (ThumbDrive, Sound Blaster,
  CN-235 / N-250 first flight).
- Peg overload: cage 19 (1776, north_america_politics).

## Wave 6 (2026-11-04)
Each region takes its last missing theme (oceania has all six: science in a new period); each theme
and each period twice. Budget 25 searches per agent.
subsaharan_africa science pre500bce, west_asia arts pre500bce, north_africa economy 500bce_500ce,
east_asia society 500bce_500ce, eastern_europe religion 500_1500, southeast_asia politics 500_1500,
western_europe religion 1500_1800, south_asia economy 1500_1800, latin_america politics 1800_1945,
central_asia society 1800_1945, north_america arts 1945_present, oceania science 1945_present.
Result: 2,519 dates (high 1,892, medium 262, low 21, disputed 65, unverified 279); check exit 0 on all.
Every agent spent all 25 searches. Sizes 66–635 (latin_america_politics 635, western_europe_religion 411).
Every region now has all six themes. Grid 73 of 432 cells, about 10,850 dates.
Brief wording bug: "never keep the memory year alone" made two agents DROP items. 10 restored
(7 latin_america_politics, all confirmed high — the timeline pages were wrong; 3 western_europe_religion).
Brief now says NEVER drop; get a second source, else `disputed` with both years.
Nimrud banquet -864 → disputed (museum labels give 879).
Open:
- Region boundary: Constantinople. eastern_europe_religion_500_1500 counts it (European shore, 44
  dates); eastern_europe_politics_1500_1800 left Istanbul out. Add to Regions with Finland and steppe.
- Scope rule, more cases: Nobel prizes (in for north_america_arts, out for oceania_science); films
  premiered abroad out (north_america_arts); Orenburg-printed Kazakh books out, students sent abroad in
  (central_asia_society); treaties signed abroad by a regional state in (latin_america_politics).
- Invention cases (oceania_science): Wi-Fi 1992 patent filing, flight recorder 1958 prototype, syringe
  1956 patent, cochlear implant 1978 first implant, Mills Cross 1954 first observations.
- Re-check: Tridentine Creed 1564 (year from the main session, not a fetched page); Way of Perfection
  Évora 1583 (no fetched source); Hooghly factory 1651; Calcutta villages 1698 vs 1690; Guangwu slave
  edicts (26, 31, 35) need Hou Hanshu; western_europe_religion has 129 unverified.
- Future cell: Meroë iron smelting (7th–6th c. BCE) → north_africa economy pre500bce.

## Rules + fix pass (2026-11-05)
Rules added (policy.md, grid.md): Scope (happens in region OR main subject/effect there; prizes only for
work done in region), invention = first working public demonstration (patent only as fallback), calendar
straddle = `medium`, boundaries (Finland → western_europe; Constantinople → eastern_europe always; steppe
split at the Ural River). deck-history-check warns above 10 dates per peg per cell (38 pegs then).
Fix pass (one Sonnet agent, brief `fix_prompt.md`, 29 of 60 searches): Jin Ping Mei 1617, Palace of Eternal
Life 1689, 8 western_europe_arts relabelled, Gheo-Shih -7600 (calibrated), La Galgada / Kotosh -3000
(Kotosh disputed), Alaca Höyük -2850 both cells (disputed), Maurya -321 in world_dates, Kanishka 127 everywhere
(Sarnath 129), 8 one-source dates now high, Mugujeonggwang text fixed, McCormick 1831 demonstration, Bíró 1931.
pending_moves.yaml started (Ambedkar, Meroë notes; cell agents read it).
Still open: Karnak Senusret I (accession year only, `low`); Guangwu edicts unverified (Hou Hanshu
unreachable); Ouidah disputed 1692/1650; Hong Canal, Esen, Emerald Buddha, Khuc Thua Du disputed — maybe
calendar straddle; water clock / sundial / glass / wheel invention dates not checked; Khashoggi (Istanbul)
kept in west_asia_politics under Scope (b).

## Wave 7 (2026-11-05)
Each region takes a period it had no cell in; each theme and each period twice; fills the five empty
theme × period pairs (politics + society pre500bce, science 500bce_500ce, religion + economy 1945_present).
western_europe politics pre500bce, eastern_europe society pre500bce, subsaharan_africa politics 500bce_500ce,
latin_america science 500bce_500ce, north_america society 500_1500, oceania arts 500_1500,
west_asia science 1500_1800, north_africa economy 1500_1800, south_asia religion 1800_1945,
southeast_asia arts 1800_1945, east_asia economy 1945_present, central_asia religion 1945_present.
Result: 866 dates (high 465, medium 234, low 51, disputed 40, unverified 76); check exit 0 on all.
Every agent spent all 25 searches. Sizes 14–192 (south_asia_religion 192, southeast_asia_arts 141;
oceania_arts_500_1500 14, subsaharan_africa_politics_500bce_500ce 21 — little datable material, not padded).
Grid now 85 of 432 cells, about 11,720 dates. Main session fixed: Bank of Japan negative rate 2014 → 2016
(CNN), Burmese Days 1935 → 1934 (New York first edition; first-public-appearance rule).
The Constantinople rule moved Ottoman science out of west_asia_science_1500_1800 (Taqi al-Din, Müteferrika)
→ pending_moves.yaml for eastern_europe_science_1500_1800. Endubis coins and the explorers → pending for
subsaharan_africa_economy_500bce_500ce.
Open:
- El Palmar Stela 46 (180 CE, latin_america_science) rests on 2026 press reports; re-check.
- Theme fit: Pyramid of the Sun (arts?) and Paracas skull shaping (society?) in latin_america_science.
- Nan Madol 800 and Moai 1250 (oceania_arts, disputed): check against the start-of-phase rule.
- Dalai Lama visits to Mongolia 1979 / 1991 (central_asia_religion): weak, unverified.
- Guruvayur satyagraha 1931 missing from south_asia_religion (no source found).

## Wave 8 (2026-11-05)
User's aim: the remaining cells with the most entries. Ranked by a log-linear fit of the 85 built cells'
sizes (size ≈ region × theme × period factor; residual sd 0.46 in log, so about ±60%). Factors: politics 1.65,
1800_1945 1.74, 1945_present 1.47, western_europe 1.74, east_asia 1.36, eastern_europe 1.34; subsaharan_africa
0.65 lowest. Top 12 of 347 taken as is (predicted 311–543 each). Budget 35 searches per agent; target 200–500
entries; save every 50.
western_europe politics 1800_1945, western_europe politics 1945_present, east_asia politics 1800_1945,
eastern_europe politics 1800_1945, east_asia politics 1945_present, eastern_europe politics 1945_present,
western_europe politics 1500_1800, north_america politics 1800_1945, western_europe religion 1800_1945,
southeast_asia politics 1800_1945, west_asia politics 1800_1945, western_europe science 1800_1945.
Result: 6,169 dates over 12 cells (high 3,023, medium 174, disputed 8, unverified 2,964); sizes 342–790,
mostly ABOVE the model's prediction (western_europe_science 790 vs 311). Check exit 0 on all. Every agent
spent all 35 searches; free Kiwix fetches did most verification. Unverified share 0–85% (north_america 0,
western_europe_politics_1800_1945 85%). Grid now 97 of 432 cells, 17,879 dates.
Lessons: in a dense cell, 35 searches verify too little, and agents fall back to template scenes ("A PEG
hands X the hat") that fail the policy test; layouts group by build stage instead of subregion. Peg overload
is severe where dates bunch (dove 43 for 1918 in eastern_europe_politics_1800_1945; rhino 29 for 1942 in
southeast_asia_politics). 179 OVERLOAD warnings over all cells.
north_america_politics_1800_1945: 605 high, but some source fields cite the wrong timeline page (Van Buren
1837 → "Timeline 1790-1819"); dates sampled were right.
Main session: 23 Istanbul / Macedonia entries left west_asia_politics_1800_1945 (Constantinople rule):
7 already in eastern_europe_politics_1800_1945 (deleted), 15 moved there. Telekino: one entry, 1906 public
demonstration (1905 = trial). Pending notes: Teller Amendment, Roosevelt Corollary, Ronald Ross.
Open:
- Recent events checked only by search snippets (western_europe_politics_1945_present): Bayrou's fall, Merz,
  Dutch and Portuguese 2025 elections, Stocker, Starmer resignation announcement (June 2026). Re-check.
- eastern_europe_politics_1945_present: 2025–26 entries from memory only.

## Scene pass, first half (2026-11-05) — PAUSED, resume in a new session
Brief scene_prompt.md (v1). 15 of 30 planned jobs ran (300–800 scenes each), covering 26 of 97 cells;
jobs 15–29 never launched. 7,448 scenes changed; all 97 cells pass the verifier (only scene text and
order changed; baseline = commit 158cdb8) and deck-history-check exit 0. Seven big cells regrouped by subregion.
Result: weak. Agents met the standard only for their first 200–300 entries. The ", and a PEG …" pattern
(regex: (,| and| as| while| with) (a|an|the) (\w+ )?PEG\b) fell only 2,773 → 2,534 over all cells.
Pilot of METHOD v2 (key fact first, peg performs it, deletion test; see scene_prompt.md header): 39 of 40 fixed.
Options for the user (undecided): A = all 17,879 scenes with v2 (~14M subagent tokens); B = weak scenes only
(the ~2,500 tacked-on + the weak ranges below; ~5–6M tokens; RECOMMENDED); C = stop here.
Before running: add deck-history-check warnings for (1) the tacked-on pattern, (2) near-duplicate events
in one year (exact-text DUPLICATE misses reworded copies). Write the tests first.
Weak ranges named by agents (0-based entry index in the current file):
- western_europe_politics_1800_1945 285–593; latin_america_politics_1800_1945 ~240–634;
  eastern_europe_politics_1800_1945 110–581; western_europe_politics_1500_1800 250–479;
  east_asia_politics_1945_present ~200–476; southeast_asia_politics_1800_1945 300–457;
  west_asia_politics_1800_1945 200–390; western_europe_religion_1500_1800 285–410;
  north_america_politics_1500_1800 337–435; eastern_europe_society_1945_present 59–162;
  north_america_religion_1800_1945 (166 scenes unchanged); western_europe_science_1800_1945 ~100–150 prop scenes;
  north_america_politics_1800_1945 (only 180 of 607 changed, before the stricter tests).
- Cells NOT yet touched: the 71 cells of jobs 15–29 (lists in git: compare to 158cdb8; untouched = 0 rewritten).
Data flags from scene agents (not fixed; for a fix pass):
- Duplicates: western_europe_science_1800_1945 Davy arc lamp 1809 ×2, Binet–Simon 1905 ×2, Auger 1923 ×2
  (Joule 1840/1843, Rutherford 1909/1911 near-duplicates); east_asia_politics_1945_present Liu Xiaobo 2010 ×2,
  Tsai re-election ×2 (should be 2020), Kim Young-sam 1992/1993, Shidehara/Higashikuni 1945;
  eastern_europe_politics_1800_1945 Ottoman 1808 and 1826 entries moved from west_asia may repeat existing ones.
- west_asia_politics_1800_1945: 1823 entry named "Second Treaty of Erzurum" (that is 1847; 1823 = First).
- western_europe_politics_1800_1945: Giolitti 1901 = interior minister, not prime minister.
- oceania_society_1945_present: Black Summer → 2019 (start of phase).
- southeast_asia_politics_1800_1945: Trat 1904 vs 1907 (France takes Trat 1904, returns it 1907): check text.
- central_asia_politics_500_1500: Tong Yabghu killed 628 or 630.
- Several big cells have entries out of chronological order inside a group.

## Wave 9 (2026-11-05)
User's aim: the remaining cells with the most entries, and a bigger wave (20). Same log-linear fit, now on 97
cells (residual sd 0.49). Factors: 1800_1945 3.03, 1945_present 2.40, 1500_1800 1.75; western_europe 1.45.
Top 20 of 335 taken as is (predicted 262–380). Budget 40 searches per agent (800 of the 1000 cap); target
200–500. Brief now carries scene METHOD v2 (deletion / action / swap tests), subregion-only layout, and save
every ~50 entries.
western_europe society 1800_1945, western_europe religion 1945_present, western_europe science 1945_present,
north_america politics 1945_present, western_europe economy 1800_1945, south_asia politics 1800_1945,
east_asia religion 1800_1945, western_europe arts 1945_present, eastern_europe religion 1800_1945,
western_europe society 1945_present, southeast_asia politics 1945_present, east_asia science 1800_1945,
east_asia politics 1500_1800, western_europe politics 500_1500, central_asia politics 1800_1945,
east_asia arts 1800_1945, eastern_europe arts 1800_1945, north_africa politics 1945_present,
east_asia society 1800_1945, eastern_europe society 1800_1945.
Result: 8,263 dates over 20 cells (high 6,641, medium 292, low 6, disputed 37, unverified 1,287); sizes
173–674 (western_europe_politics_500_1500 674, southeast_asia_politics_1945_present 669, western_europe_arts
622). Check exit 0 on all. Grid now 117 of 432 cells, 26,142 dates. Unverified share 16% (wave 8: 48%).
Tacked-on scene pattern about 6% of scenes (wave 8 about 14%): METHOD v2 in the brief helped, but some
scenes still fail the deletion test ("A BELL rings as Olaf lands", "the northeast wobbles like JELLY").
Limit hit: 20 Opus agents at ~300k tokens each (~6M) reached the ACCOUNT 5-hour usage limit, not the search
cap. Five agents lost their web check early (western_europe society ×2, religion 1945, economy 1800, politics
500_1500: their unverified entries are the top-up list); two died mid-run and were resumed with SendMessage
after the reset. For a 20-cell wave: run Sonnet agents, or two halves of 10 across a reset.
Main session: world_dates Great Heathen Army 866 → 865 (two sources); Mers El Kébir 1968 restored
(agent dropped it against the brief; `disputed`, 1967 vs 1968).
Open:
- Scope, "issued outside the region": Paris Ballets Russes premieres are split (Rite of Spring + first season
  in western_europe_arts_1800_1945; Firebird + Petrushka in eastern_europe_arts_1800_1945); Kafka split too
  (Metamorphosis, Trial west; Castle east). One rule needed.
- Cross-cell duplicates: Suez, Six-Day War, Camp David, Egypt–Israel treaty, UAR are in both
  north_africa_politics_1945_present and west_asia_politics_1945_present.
- Soshi-kaimei: east_asia_politics_1800_1945 has 1940; decree 1939, enforced 1940; a timeline says 1938.
- Qiu Jin's journal: disputed 1906/1907; first issue January 1907.
- Shaanxi revolts 1628 vs Wang Er 1627 (start-of-phase rule → 1627?); Grand Council 1729/1733.
- Recent events (2025–26) in north_america, southeast_asia, western_europe cells: search snippets only.
- Peg overload: 89 warnings in wave 9 cells (radio 31 for 1941–44 in eastern_europe_society_1800_1945;
  tattoo 24 for 2011 in north_africa_politics_1945_present; wolf 21 in western_europe_arts_1945_present).

## Wave 10 (2026-11-05)
User's aim: the next 20 cells, most entries first. Same log-linear fit, now on 117 cells (residual sd 0.43).
Top 20 of 315 taken as is (predicted 218–313). Budget 40 searches per agent (800 of the 1000 cap).
Sonnet agents (wave 9 lesson: 20 Opus agents hit the account 5-hour usage limit).
south_asia politics 1945_present, western_europe economy 1945_present, latin_america politics 1945_present,
eastern_europe religion 1945_present, east_asia religion 1945_present, eastern_europe arts 1945_present,
central_asia politics 1945_present, western_europe arts 1500_1800, eastern_europe science 1945_present,
east_asia arts 1945_present, east_asia science 1945_present, southeast_asia politics 1500_1800,
western_europe society 1500_1800, eastern_europe economy 1800_1945, southeast_asia religion 1800_1945,
west_asia politics 1500_1800, north_america arts 1800_1945, north_america science 1800_1945,
east_asia society 1945_present, west_asia religion 1800_1945.
Result: 5,982 dates over 20 cells (high 3,708, medium 399, low 13, disputed 39, unverified 1,843 = 31%);
sizes 109–509 (south_asia_politics_1945_present 509, western_europe_economy_1945_present 486,
western_europe_arts_1500_1800 454). Check exit 0 on all; all years inside the period. Grid now 137 of 432
cells, 32,124 dates. Sonnet stayed under the usage limit (~5.6M subagent tokens, no deaths), but: unverified
31% (Opus wave 9: 16%) and many agents self-report scenes weaker than METHOD v2 (peg as prop or decoration).
Tacked-on regex hits only 1.9%, so the weakness is a different kind (peg present but not the actor).
Cells far ABOVE the fit: east_asia_arts, western_europe_arts_1500_1800, north_america_science/arts (×1.5–1.8);
far BELOW: west_asia_religion_1800_1945 (109 vs 218), eastern_europe_economy_1800_1945 (144 vs 230).
Shared scratchpad collisions: generic names (build.py, gen.py) were overwritten across agents; one gen.py
wrote to another agent's cell. Agents told mid-run to use scratchpad/<slug>/; no cross-cell contamination
found (exact-event duplicates only with neighbouring theme cells, 15). Next waves: put "use scratchpad/<slug>/
for all working files" in agent_prompt.md.
Main session: Baqi demolition 1925 → 1926 (8 Shawwal 1344 = 21 April 1926).
Fix-pass list (not done):
- Dropped against the brief, restore: Borujerdi to Qom 1944 (west_asia_religion), 2001 Tiananmen
  self-immolation (east_asia_religion), Kyiv Lavra closure 1961 (eastern_europe_religion), Chenonceau,
  Azay-le-Rideau, Byrd 1607, Blue Boy c. 1770, Ewald, Dalin (western_europe_arts_1500_1800);
  missing Pangestu 1932, Mathla'ul Anwar 1916 (southeast_asia_religion).
- Likely wrong: BNP founding kept 1977 (usual date 1 Sep 1978); Lutosławski Funeral Music and Penderecki
  Threnody premieres moved Katowice → Warsaw Autumn (Funeral Music = Katowice 1958?); Beaumont 1822 → 1833
  (check event text = publication); Morse demo 1837 NYU vs 1838 Speedwell (policy: first public demo).
- Thin sourcing: west_asia_politics_1500_1800 and southeast_asia_politics_1500_1800 "high" rest on one WP
  mirror article each; west_asia_politics left 19 searches unspent.
- Peg overload: sofa 17, piano 15 (western_europe_economy_1945_present), judge 13 (eastern_europe_arts),
  seal/dove 11 (south_asia_politics).
- Cross-cell: 1924 caliphate abolition in west_asia religion + politics; 5 events shared
  western_europe economy/politics 1945_present.
- Top-up: Belize 1, Costa Rica 3 entries (latin_america_politics_1945_present).
