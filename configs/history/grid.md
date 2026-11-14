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
- Hawaii → oceania, in every period, also after statehood in 1959 (user rule 2026-11-06).
- Malta → western_europe, in every period (user rule 2026-11-07).
- Western Sahara and Mauritania → subsaharan_africa, in every period (user rule 2026-11-12).
- Chalcedon (Kadıköy) counts as Istanbul → eastern_europe; the Council of Chalcedon (451) goes to
  eastern_europe_religion_500bce_500ce (user rule 2026-11-12).
- Test and launch sites go by geography (user rule 2026-11-07): Baikonur missions (and events on the craft and
  stations they launch) and Semipalatinsk and Lop Nur tests → central_asia. Kapustin Yar, Plesetsk, Vostochny →
  eastern_europe; Jiuquan (Inner Mongolia) → east_asia. A flight whose subject is a regional cosmonaut (Intercosmos,
  first Korean in space) stays with the cosmonaut's region.
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

## Wave 11 (2026-11-05)
User's aim: one more Sonnet wave, the next 8 cells by predicted size (fit on 137 cells, residual sd 0.41;
predicted 210–224). Budget 25 searches per agent: about 226 of the 1000 cap were left after wave 10.
north_america religion 1945_present, oceania politics 1945_present, north_africa politics 1500_1800,
south_asia politics 1500_1800, east_asia economy 1800_1945, subsaharan_africa politics 1945_present,
eastern_europe politics 500_1500, southeast_asia arts 1945_present.
Result: 2,176 dates over 8 cells (high 1,388, medium 160, low 3, disputed 22, unverified 611 = 28%); sizes
204–345. Check exit 0 on all; all years inside the period; no cross-cell contamination (private scratch
folders worked). Grid now 145 of 432 cells, 34,300 dates. 7 of 8 cells came in ABOVE the fit (×1.1–1.6).
Unverified share by cell: east_asia_economy_1800_1945 65%, subsaharan_africa_politics_1945_present 48%;
north_africa_politics_1500_1800 1%, south_asia_politics_1500_1800 7%.
Fix-pass list (not done):
- OPEN RULE (user): Hawaii. oceania_politics_1945_present files 15 Hawaii entries under Polynesia; grid has
  US → north_america, Pacific islands → oceania. Options: always oceania, or oceania until statehood 1959.
- Dropped against the brief, restore: NZ 1951 snap election (oceania_politics; the day was wrong, the year
  is right). Uganda 1966: Obote suspends the constitution (removed from the text; it is a fact).
- Scope: north_africa_politics_1500_1800 files Chaul 1508, Diu 1509 (India) and Marj Dabiq 1516 (Syria)
  under Egypt; check against south_asia / west_asia cells.
- Layout: north_america_religion_1945_present grouped by denomination, not subregion.
- Disputed to settle: Glover locomotive at Nagasaki 1865 (usual) vs 1868 (mirror).
- Peg overload: cheese 23 (1960 independence wave), boot 12, jet 11, judge 11
  (subsaharan_africa_politics_1945_present).
- Tacked-on regex: north_africa_politics_1500_1800 has 26 hits.
- Duplicates: 4 events shared oceania politics/society 1945_present, 1 oceania/southeast_asia politics.

## Wave 12 (2026-11-05)
User's aim: 8 cells, largest predicted first. Same log-linear fit, now on 145 cells (residual sd 0.40);
top 8 of 287 (predicted 201–213). Opus agents, budget 50 searches each (fresh session, 400 of the cap).
east_asia politics 500_1500, eastern_europe economy 1945_present, south_asia arts 1800_1945,
western_europe economy 1500_1800, north_america society 1800_1945, southeast_asia science 1800_1945,
north_africa arts 1800_1945, west_asia arts 1800_1945.
Result: 2,432 dates over 8 cells (high 2,030, medium 144, low 3, disputed 38, unverified 217 = 9%); sizes
187–537 (north_america_society_1800_1945 537, east_asia_politics_500_1500 447, south_asia_arts 324). Check
exit 0 on all; all years inside the period. Grid now 153 of 432 cells, about 36,730 dates. 8 Opus agents at
~250–440k tokens each: no usage-limit deaths. All spent the whole budget; Kiwix fetches did most checking.
Unverified share by cell: eastern_europe_economy_1945_present 36%, western_europe_economy_1500_1800 20%;
north_america_society_1800_1945 0% (sourced mostly to WP mirror timelines: African-American history, labor,
disasters, civil unrest).
Fix-pass list (not done):
- Dropped against the brief, restore: Agnon, A Guest for the Night (west_asia_arts; agent found 1938 vs 1939
  and the entry is gone).
- world_dates conflicts: Chanyuan 1004 (world_dates) vs 1005 (cell; January 1005 = 12th lunar month 1004),
  one rule needed for the lunar new-year gap; Beijing Ming capital 1421 (world_dates, usual) vs 1420 (cell,
  disputed) → prefer 1421.
- Likely wrong: Philip II third bankruptcy moved 1575 → 1576 on one timeline (decree is September 1575);
  Yoshimitsu "King of Japan" 1402 → 1404 marked disputed, but 1402 (Jianwen) and 1404 (Yongle) are two
  events; Bangkok–Ayutthaya railway high at 1897 while the mirror says 1896 (1897 likely right; mark
  disputed or cite a second source); Vigathakumaran 1928 vs 1930 = made vs first shown, split the event text.
- Cross-cell: New Delhi inauguration 1931 in south_asia arts + politics 1800_1945. About 13 economy events
  (Comecon, Kosygin reform, Gaidar, 1998 default, euro changeovers, currency reforms) sit in
  eastern_europe_politics/society_1945_present; the economy cell names them in its header — move?
- Scope: Mahjar works printed in New York filed in west_asia_arts (Lebanon/Syria) — same open
  "issued outside the region" rule as Ballets Russes / Kafka.
- Thin: southeast_asia_science has 1 Laos/Cambodia entry; south_asia_arts none for Bhutan/Maldives.
- Peg overload: north_america_society mill 17, dog 16, dish 13, ink 12, mug 11, tuba 11; south_asia_arts
  match 11. Weak scenes self-reported: north_africa_arts 1923/1932/1934, west_asia_arts Ankara 1924/1935.

## Wave 13 (2026-11-05/06)
User's aim: one big wave of 25 cells to use the night. Fit on 153 cells (residual sd 0.41); top 25 of 279
(predicted 175–215), except north_america politics 500_1500 (fit says 199; few dated pre-Columbian events)
→ replaced by #26, north_africa religion 1945_present. Opus agents, rolling queue of 8 at a time, budget 22
searches each (~550 of the ~600 left in the session).
north_america society 1945_present, south_asia arts 1945_present, south_asia science 1800_1945, west_asia arts
1945_present, east_asia politics pre500bce, latin_america politics 1500_1800, southeast_asia religion
1945_present, western_europe arts 500_1500, south_asia religion 1945_present, eastern_europe politics
pre500bce, north_africa arts 1945_present, southeast_asia society 1800_1945, north_africa religion 1800_1945,
west_asia science 1800_1945, south_asia society 1800_1945, north_america economy 1945_present, south_asia
science 1945_present, eastern_europe politics 500bce_500ce, north_africa science 1800_1945, latin_america arts
1800_1945, eastern_europe arts 1500_1800, west_asia religion 1945_present, western_europe religion 500_1500,
west_asia society 1800_1945, north_africa religion 1945_present.
Result: 6,905 dates over 25 cells (high 5,037, medium 559, low 17, disputed 107, unverified 1,185 = 17%);
sizes 134–416. Check exit 0 on all; all years inside the period. Grid now 178 of 432 cells, 43,637 dates.
Rolling queue of 8 Opus agents (~200–330k tokens each, ~6.3M total over ~3 h): no usage-limit deaths.
Unverified highest: western_europe_religion_500_1500 41%, south_asia_science_1945_present 39%,
latin_america_arts_1800_1945 34%. 22 searches is too few for dense cells; Kiwix fetches carried the rest.
eastern_europe_politics_500bce_500ce set "high" by a script (year + keyword match in ~270 mirror pages, then
hand-checked); main-session audit of 14 random high entries: all correct (Agis III 331 vs 330 debatable).
Pending moves done: Ronald Ross (south_asia_science_1800_1945), Ambedkar Nagpur 1956
(south_asia_religion_1945_present) → remove both from pending_moves.yaml.

OPEN RULE (user), main theme vs "already in an older cell": religion and economy agents left out events whose
main theme is theirs because an older politics/society cell already holds them — Babri, Blue Star, Ram temple
(South Asia); Quang Duc (SE Asia); Muslim Brotherhood, Mahdi, Qutb hanging, Tibhirine, church bombings (North
Africa); Grand Mosque seizure (West Asia); Canossa, Becket, Templars (Western Europe); NAFTA, USMCA, tax acts,
2025 tariffs (North America economy); Comecon, Gaidar, euro changeovers (wave 12, Eastern Europe economy).
Options: move to the main-theme cell, or keep first-come.
Fix-pass list (not done):
- Dropped against the brief, restore: Benedictional of St Aethelwold (western_europe_arts_500_1500; dropped to
  keep eagle ≤ 10), Sarawak abolition of slavery (southeast_asia_society_1800_1945; 1886 vs 1915, disputed),
  IS killing of Ethiopian Christians in Libya 2015 (north_africa_religion_1945_present; no passing scene).
- Likely wrong: Sahitya Akademi first awards 1955 → 1954 (Akademi founded 1954; split); Kutiyattam/Ramlila
  proclamation 2001/2005 vs inscription 2008 = two events; Rajputana famine 1868 → 1869 (phase-start rule →
  1868); La cumparsita 1917 → 1916 (premiere 1917, composed 1916; fix text); Felitsa 1782 (first printed 1783);
  Karekin I 1994 (elected Catholicos of All Armenians April 1995); Synod of Hertford 673 → 672 (Bede 673);
  Saha Institute 1943 vs 1949 (usual 1949); Montevideo 1724 (fort) vs 1726 (formal founding) — fix text.
- Scope: Midnight's Children left out of south_asia_arts_1945_present (written in UK) but Camus's The Plague
  (Oran) is in north_africa_arts_1945_present — same open "issued outside the region" rule. Excavations
  (Tutankhamun, Abu Simbel, Nefertiti) sit in north_africa arts; west_asia science counts excavation as science.
- Cross-cell: Spartacus premiere 1956 (Leningrad) in west_asia_arts_1945_present AND eastern_europe_arts_1945
  → delete from west_asia; Bede's History 731 in western_europe arts + religion 500_1500; Sudan apostasy repeal
  2020 in north_africa religion + society 1945. Koch 1883 (Egypt) and Laveran 1880 (Algeria) in both
  north_africa_science_1800_1945 and western_europe_science_1800_1945 → delete from western_europe. Move to
  eastern_europe_arts_1500_1800 from western_europe_arts_1500_1800: Don Giovanni Prague, Paisiello's Barber
  St Petersburg, Haydn Farewell at Eszterháza. Kreta Ayer 1927 missing from southeast_asia_politics_1800_1945.
- Recent events from search snippets only: north_america_society_1945_present 2023–26 (Key Bridge, Jasper
  fire, Tumbler Ridge, No Kings, measles status); PFBR first criticality April 2026; Zayed National Museum 2025.
- Hawaii: Lahaina 2023 filed under US (fits "oceania until statehood 1959").
- Layout: some cells group by era/state instead of geography (east_asia pre500bce, eastern_europe 500bce_500ce
  Greece, north_america economy US by period, south_asia society "All-India" groups). Acceptable?
- Peg overload: hanger 16, radio 13, gem 11 (latin_america_politics_1500_1800); knife/moth/mug 12,
  movie/warrior 11 (latin_america_arts_1800_1945); eagle 13 (southeast_asia_religion); lawyer 13
  (south_asia_arts_1945); sofa 12 (north_america_economy); judge 11 (north_america_society_1945).

## Rules settled (2026-11-06)
User answers to open rules (written into policy.md "Scope" / "Entry" and agent_prompt.md):
- Hawaii → oceania in every period, also after statehood (1959). Done: Keck I + Keeling (duplicates) deleted
  from north_america_science_1945_present; Lahaina 2023 → oceania_society_1945_present; Iolani Palace 1882 →
  pending_moves.yaml (oceania_arts_1800_1945).
- First-come: an event already in an older cell of another theme stays there; the newer cell does not
  repeat it, even when the newer cell's theme is the main theme. (Cross-cell duplicates: delete the copy in
  the NEWER cell.)
- Works made or shown outside the author's region: region of the work's setting or subject, else the
  author's home region; never premiere or print place alone.
- Lunar new-year gap: Western year of the day, `medium` (Chanyuan → 1005).
- Layout: geography first; era or state groups accepted where one subregion holds most of a cell.
- Scene pass: deferred (A or B later, not now).
Fix pass these rules imply (not done):
- Kafka (Metamorphosis, Trial) and Rite of Spring + Ballets Russes first season: western_europe_arts_1800_1945
  → eastern_europe_arts_1800_1945. Midnight's Children → add to south_asia_arts_1945_present.
- Chanyuan: world_dates 1004 → 1005.
- Delete newer-cell copies of the cross-cell duplicates in the wave 9–13 lists (Suez, Six-Day War, Camp David,
  Egypt–Israel treaty, UAR; 1924 caliphate; New Delhi 1931; Bede 731; Sudan apostasy 2020; Spartacus 1956;
  Koch/Laveran) — check which cell is older by commit.

## Wave 14 (2026-11-06)
User's aim: 20 cells, most entries first. Same log-linear fit, now on 178 cells (residual sd 0.43); top 22 of 254
(predicted 166–216) less two fit artifacts (north_america politics 500_1500 and 500bce_500ce: few dated
pre-Columbian events). Opus agents, rolling queue of 8, budget 45 searches each (900 of the 1000 cap).
latin_america arts 1945_present, west_asia science 1945_present, latin_america religion 1800_1945, latin_america
religion 1945_present, latin_america science 1800_1945, western_europe science 500_1500, latin_america science
1945_present, south_asia politics 500_1500, north_africa science 1945_present, west_asia society 1945_present,
south_asia economy 1800_1945, south_asia economy 1945_present, latin_america society 1800_1945, north_africa
society 1800_1945, north_america arts 1500_1800, western_europe arts 500bce_500ce, latin_america society
1945_present, west_asia politics 500_1500, western_europe arts pre500bce, east_asia religion 1500_1800.
Result: 5,569 dates over 20 cells (high 4,141, medium 725, low 14, disputed 78, unverified 611 = 11%); sizes
188–536 (latin_america_arts_1945_present 536, west_asia_politics_500_1500 499 ≈ 3× the fit,
south_asia_politics_500_1500 343). Every cell came in ABOVE the fit (×1.1–3.0). Check exit 0 on all; all years
inside the period. Grid now 198 of 432 cells, 49,204 dates. No usage-limit deaths (~5.9M subagent tokens).
Main session: 11 cross-cell near-duplicates removed from the newer cell (first-come; where both cells were new,
kept the main-theme copy): Sivas 1993, Tenorio polio 1991, smallpox 1971, Estadio Azteca 1966, MGNREGA 2005,
Maturana–Varela 1973, Taj Mahal Hotel 1903, Christ the Redeemer 1931, Mexican Agricultural Program 1943, Church
of the Company fire 1863, Dionysius Exiguus 525. Restored: western_europe_science Oresme graphs c. 1350 and
al-Qalasadi c. 1450 (agent dropped them to keep lasso ≤ 10); Operation Moses 1984 added to
subsaharan_africa_society_1945_present (west_asia_society left it out "to match" Solomon). Hijra + first
revelation → pending_moves.yaml (west_asia_religion_500_1500).
Brief updated during the wave: overload never justifies a drop; WebFetch summaries can echo the prompt's own
items as page text (latin_america_religion_1800_1945: Rivadavia 1822/1823 rest on such a page, medium).
Fix-pass list (not done):
- Prize lists: latin_america_arts_1945_present has ~110 prize entries (Cervantes, Gallegos, Nobel, Pritzker,
  Oscars, festivals) ≈ 20% of the cell. Lifetime prizes fit the "work done in region" rule badly (Cabrera Infante
  and Condé wrote mostly abroad). OPEN USER QUESTION: keep lifetime literary prizes at all?
- Recent events on search snippets only: west_asia_science 2023–25 satellites + Iron Beam; latin_america_arts 2026
  prizes (Bad Bunny Grammy, Alfaguara, Biblioteca Breve).
- Likely wrong / to settle: Occom sermon 1771 vs 1772 (execution 1772); Uruguay abolition 1842 unverified (mirror
  1830); Bíró 1943 Argentine patent vs eastern_europe Bíró (dup?); Pittier institute 1887/1889; Brazil e-voting
  2000/2002; Cuba Christmas 1997/1998; Central Banking Enquiry 1929/1930; Raniganj 1832/1835; Ezra–Nehemiah 1950.
- Excavations → science (user rule 2026-11-06, policy.md). Move excavation / discovery entries out of arts cells
  (north_africa_arts: Tutankhamun, Nefertiti bust, Abu Simbel; others by grep) into the science cell of the same
  region and period (first-come does not apply: this is a rule change).
- Peg overload: lasso 22 (western_europe_arts_pre500bce, "c. x50" midpoints; lasso scenes repetitive), jockey 18,
  chain 18, wolf 16, chef 15 (latin_america_arts_1945_present), lasso 15 (western_europe_arts_500bce_500ce),
  piano 12 (west_asia_politics_500_1500); 23 OVERLOAD warnings in wave 14 cells.

## Wave 15 (2026-11-06)
User's aim: next wave, largest cells first. Same log-linear fit, now on 198 cells (residual sd 0.40); top 23 of 234
less the three north_america politics fit artifacts (pre500bce, 500bce_500ce, 500_1500: few dated pre-Columbian
events). Opus agents, rolling queue of 8, budget 45 searches each; {expected} = fit × 1.3 (wave 14 cells all came in
above the fit).
latin_america politics 500_1500, west_asia economy 1945_present, latin_america economy 1945_present, west_asia economy
1800_1945, north_africa politics 500_1500, central_asia arts 1945_present, southeast_asia economy 1945_present,
central_asia arts 1800_1945, eastern_europe religion 1500_1800, central_asia politics 1500_1800, south_asia arts
1500_1800, southeast_asia economy 1800_1945, east_asia science 1500_1800, north_africa economy 1945_present,
eastern_europe science 1500_1800, north_africa economy 1800_1945, north_america religion 1500_1800, western_europe
religion 500bce_500ce, east_asia society 1500_1800, east_asia arts 500_1500.
Result (after main-session fixes): 4,710 dates over 20 cells (high 3,394, medium 725, low 38, disputed 102,
unverified 451 = 10%); sizes 149–368 (north_america_religion_1500_1800 368 ≈ 2.4× the fit,
north_africa_politics_500_1500 357, latin_america_politics_500_1500 324). Economy cells near or below the fit: older
politics/science/society cells already hold their main events (first-come). Check exit 0 on all; all years inside the
period. Grid now 218 of 432 cells, 53,914 dates. No usage-limit deaths (~5.7M subagent tokens).
Unverified highest: east_asia_arts_500_1500 41%, east_asia_society_1500_1800 23%, east_asia_science_1500_1800 21%,
north_america_religion_1500_1800 20% → first candidates for the next check pass.
Main session: 20 cross-cell duplicates removed from the newer cell (first-come; where both cells were new, kept one):
Omnibus Law 2020, Timor maritime treaty 2018, Bre-X 1997, Marina Bay Sands 2010 (southeast_asia_economy_1945_present);
Royal Dutch Shell 1907, Royal Dutch Petroleum 1890, East Asiatic Company 1897, galleon trade end 1815
(southeast_asia_economy_1800_1945); NAFTA 1994, USMCA 2020, Tin Council 1985 (latin_america_economy_1945_present; Tin
Council kept in southeast_asia); ILSA 1996 (north_africa_economy_1945_present; kept in west_asia); SPG 1701
(north_america_religion_1500_1800); Zhangzhou–Quanzhou feud 1782, Joseon embassy 1607 (east_asia_society_1500_1800);
Petah Tikva 1878, Hindiya Barrage 1913 (west_asia_economy_1800_1945); Suez shares 1875
(north_africa_economy_1800_1945); Hjortspring c. 350 BCE, Roquepertuse c. 300 BCE
(western_europe_religion_500bce_500ce). Added: Todaiji Great Buddha 752 to east_asia_arts_500_1500 (agent left it out
only because world_dates has it; world_dates is not a cell). Pending moves done: Taqi al-Din observatory, Müteferrika
press (eastern_europe_science_1500_1800) → removed from pending_moves.yaml.
Fix-pass list (not done):
- Settled by user (2026-11-06): keep all three where they are — Battle of Merv 1510 stays in its west_asia cell;
  the Inner Mongolia events stay in central_asia_politics_1500_1800; the Orenburg-printed Kazakh books stay in
  central_asia_arts_1800_1945 (central_asia_society_1800_1945 unchanged).
- Scope: eastern_europe_science_1500_1800 files works printed abroad under the author's home region (Bošković,
  Getaldić, Vrančić, Siemienowicz, Lubieniecki, Theotokis, Kopievsky); check for copies in
  western_europe_science_1500_1800 (the duplicate scan found none).
- Likely wrong / to settle: Kantajew temple completion 1752 → 1722 on one mirror page (both current) → disputed;
  Wang Xichan's Xiao'an xinfa kept at 1663 against its one source (1643; author would be 15) — memory looks right;
  Clovis's baptism 496 vs 508; Qatar Dukhan oil 1939/1940.
- Peg overload: lasso 12 (latin_america_politics_500_1500), sofa 11 (central_asia_arts_1945_present).

## Wave 16 (2026-11-07)
User's aim: next 20 cells, largest predicted first. Search-budget model (PRD §15): log-linear fit of entries on
region + theme + period + log(searches per agent), plus a built-sibling term (same region and period), refit on
218 cells (residual sd 0.38, log-search coefficient 0.36; forecast 23,567 dates in 214 unbuilt cells at 45
searches). Ranks 4–23 (predicted 165–190; {expected} = prediction, no ×1.3) less the three north_america politics
pre-Columbian fit artifacts (ranks 1–3). Opus agents, rolling queue of 8, budget 45 searches each.
north_america science 1500_1800, eastern_europe society 1500_1800, oceania politics 1500_1800, west_asia arts
1500_1800, south_asia religion 1500_1800, south_asia politics pre500bce, latin_america politics 500bce_500ce,
eastern_europe arts 500_1500, west_asia politics 500bce_500ce, central_asia religion 1800_1945, north_america arts
500_1500, western_europe religion pre500bce, west_asia politics pre500bce, oceania arts 1800_1945, latin_america
religion 1500_1800, subsaharan_africa politics 1500_1800, western_europe science 500bce_500ce, oceania religion
1945_present, north_america economy 1500_1800, central_asia science 1945_present.
Result (after main-session fixes): 3,827 dates over 20 cells (high ~2,580, medium ~875, low 106, disputed 139,
unverified 147 = 3.8%, lowest of any wave); sizes 110–363. Above the fit: west_asia_politics_500bce_500ce 363 (×2.1),
north_america_economy_1500_1800 ~294, west_asia_politics_pre500bce 264, oceania_arts_1800_1945 253,
subsaharan_africa_politics_1500_1800 237. Well below: western_europe_religion_pre500bce 110 and
western_europe_science_500bce_500ce 134 (older arts/politics cells hold their main items, first-come),
latin_america_politics_500bce_500ce 112 (Long Count stelae already in science), north_america_arts_500_1500 121
(pre-Columbian, like the skipped politics cells; no dated California / Great Basin items), south_asia_politics_pre500bce
124. Check exit 0 on all 238 cells. Grid now 238 of 432 cells, 57,696 dates (after dropping the king lists). No usage-limit deaths (~5.6M subagent
tokens, every agent spent 45 searches).
Main session: 18 cross-cell duplicates removed (IDF scan): Jama Masjid 1656, Thembavani 1726, Kumari Ghar 1757,
Narayaneeyam 1586, Zhabdrung's death 1651, Bara Imambara 1784 (south_asia_religion; arts/politics older); Council of
Four Lands 1764, Peter III's manifesto 1762 (eastern_europe_society); Whitney musket contract 1798
(north_america_science; kept in economy); Navigation Acts 1651 + 1660, Staple Act 1663, Dutch WIC 1621, French WIC 1664,
Company of the West 1717 (north_america_economy; western_europe_economy older); Tawagalawa letter c. 1250 BCE
(west_asia_politics_pre500bce; eastern_europe older); Typee 1846 removed from north_america_arts_1800_1945 (setting
rule: Marquesas → oceania; kept in oceania_arts_1800_1945). Pending moves: Iolani Palace done (removed); added Dupain's
Sunbaker → oceania_arts_1945_present, Bighorn Medicine Wheel c. 1760 → north_america_arts_1500_1800. Ferapontov
frescoes (left out of eastern_europe_arts_500_1500) are already in eastern_europe_arts_1500_1800 at 1502.
Settled by user (2026-11-07), done in the main session:
- Legendary king lists dropped (policy.md Scope): south_asia_politics_pre500bce loses 44 entries (Puranic Barhadratha
  line 22, Pradyota line of Avanti 6, Kalhana's Kashmir list 16); historical Bimbisara (c. 544) and Pukkusati (c. 550)
  kept. Cell now 80. Mahavamsa founding traditions (Vijaya) stay, low.
- Malta → western_europe (boundary rule above). The 8 Maltese entries stay in western_europe_religion_pre500bce; the
  three other Malta mentions (north_africa politics, The Maltese Falcon) only name it.
- Test and launch sites by geography (boundary rule above): 78 entries moved from eastern_europe_science_1945_present
  to central_asia_science_1945_present (75 Baikonur missions and station events, 3 Semipalatinsk bomb tests; new group
  "Kazakhstan: Baikonur launches and Semipalatinsk tests"); Lop Nur atomic bomb 1964, Dongfeng-2A 1966 and hydrogen bomb
  1967 from east_asia_science_1945_present, and the politics copy of the 1964 test from east_asia_politics_1945_present
  to central_asia_politics_1945_present (Xinjiang groups). Left in place: Kosmos 954 falling on Canada 1978 (effect in
  north_america; not moved), agency founding and Gore–Chernomyrdin (decisions in Moscow).
Fix-pass list (not done):
- Cross-cell date conflicts: Lord of Sipán burial c. 250 (latin_america_politics_500bce_500ce) vs 300 (science cell);
  Siyaj Chan K'awiil II death 456 vs Burial 48 457 (same pair); Dinder River defeat 1744 in north_africa_politics_1500_1800
  vs 1738 (Iyasu II source, subsaharan agent).
- Scope: Freetown founding 1792 sits in north_america_society_1500_1800 (effect in Sierra Leone → subsaharan_africa);
  Kino's Dolores mission 1687 sits in north_america_religion_1500_1800 (Dolores is in Sonora → latin_america); Moravians
  on St Thomas 1732 left out of latin_america_religion because western_europe has the Herrnhut departure (separate event?).
- Unchecked recent items left out of oceania_religion_1945_present as society-theme (attacks on places of worship 2024–25):
  verify before adding to oceania_society_1945_present.
- Weak scenes self-reported (north_america_science_1500_1800): 1717 swim fins (dog), 1775 Turtle (eagle), 1713 (tomb),
  1687 (fox).
- Peg overload: lasso 20 + dice 13 (north_america_arts_500_1500, c. x50 dates), lasso 18
  (latin_america_politics_500bce_500ce), lasso 16 (west_asia_politics_pre500bce), bees 13 + bell 12
  (oceania_politics_1500_1800), tower 11 (central_asia_science_1945_present), lasso 11
  (western_europe_science_500bce_500ce). Round-date lasso overload is now the main overload source.

## Wave 17 (2026-11-07)
User's aim: 30 cells, largest predicted first; search cap raised to 2000. Search-budget model refit on 238 cells
(residual sd 0.38, log-search coefficient 0.36; forecast 19,883 dates in 194 unbuilt cells at 45 searches). Ranks
4–33 (predicted 140–175, total about 4,640; {expected} = prediction), less the three north_america politics
pre-Columbian fit artifacts (ranks 1–3). Opus agents, rolling queue of 8, budget 45 searches each (1,350 in all).
west_asia religion 1500_1800, east_asia economy 1500_1800, subsaharan_africa arts 1945_present, southeast_asia arts
1500_1800, central_asia society 1945_present, south_asia science 1500_1800, central_asia science 1800_1945,
north_africa arts 1500_1800, western_europe society 500bce_500ce, latin_america science 1500_1800, south_asia society
1500_1800, north_america religion 500_1500, subsaharan_africa arts 1800_1945, west_asia society 1500_1800,
subsaharan_africa religion 1945_present, east_asia religion 500_1500, central_asia economy 1945_present, latin_america
politics pre500bce, southeast_asia politics 500bce_500ce, north_africa politics 500bce_500ce, oceania science 1800_1945,
western_europe science pre500bce, western_europe economy 500bce_500ce, north_africa religion 1500_1800, central_asia
economy 1800_1945, west_asia economy 1500_1800, north_america science 500_1500, subsaharan_africa religion 1800_1945,
oceania politics 500_1500, oceania economy 1945_present.
Result (after main-session fixes): 4,525 dates over 30 cells (high 3,231, medium 840, low 81, disputed 119,
unverified 284 = 6.3%); total = 99% of the prediction (4,584), but spread is wide: sizes 25–332. Above the fit:
subsaharan_africa_arts_1945_present 332 (×2.0), east_asia_religion_500_1500 242, subsaharan_africa_religion_1800_1945
236, central_asia_economy_1945_present 232, subsaharan_africa_religion_1945_present 226, oceania_economy_1945_present
210, north_africa_politics_500bce_500ce 201, oceania_science_1800_1945 198. Most others came in 10–25% low
(first-come: older cells hold the main events). Far below: oceania_politics_500_1500 25 (king-list rule),
latin_america_politics_pre500bce 45, north_america_science_500_1500 48, north_america_religion_500_1500 60.
Model fix needed before the next refit: pre-Columbian north_america / latin_america and pre-1500 Pacific cells are
overpredicted for every theme, not only politics (add a term or leave them out of the fit). Check exit 0 on all 268
cells. Grid now 268 of 432 cells, 62,220 dates. No usage-limit deaths (~7.6M subagent tokens, every agent spent 45
searches; ~1,355 of 2,000 session searches used).
Main session: 13 cross-cell duplicates removed (IDF scan): Ovadia Yosef's Beta Israel ruling 1973 (west_asia older),
Humboldt's Leonids (the 1800 copy in latin_america_science_1800_1945; correct date Nov 1799, kept in 1500_1800), Garnier's
nickel 1864 (oceania_economy older), Yamoussoukro basilica 1990 (kept in religion: religious building), Commodus'
African grain fleet 186 (north_africa_economy older), Xi's Silk Road Economic Belt 2013 (east_asia_economy older),
Cyprus muhassil 1703 (politics older), Nathu La 2006 (south_asia_politics older), Yushu earthquake 2010 (east_asia
older), Crimean Tatar return 1989 (eastern_europe older), Avidius Cassius 175 (west_asia older), Skara Brae and
Newgrange (western_europe_arts_pre500bce older). Three dates restored to memory year after a main-session search:
Amina Lawal acquittal 2003 (Al Jazeera, 25 Sep 2003), Rennell's Memoir of a Map of Hindoostan 1783 (ESTC first
edition; 1788 = 2nd ed.), Fiji devaluation 1998 (IMF, 20 Jan 1998). Brief: warning added that some pages (cavac.at)
carry injected instructions.
Deferred by user (2026-11-08): entries stay where they are for now; decide later.
- Works with an ancient setting made abroad (Antony and Cleopatra, All for Love, Giulio Cesare, Haydn/Gluck operas) sit in
  north_africa_arts_1500_1800 under the setting rule. Keep, or send ancient-setting works to the author's home region?
- Sati laws 1500–1800 are in south_asia_society; the 1800–1945 cells put sati regulation in religion. Which theme?
- Antarctic expeditions: oceania_science_1800_1945 files 6 Australasian ones under oceania (home region). Make that the rule?
- Empire-wide Ottoman decrees (capitulations, malikane, coinage) sit under Anatolia (west_asia) in the economy cells,
  though Istanbul is eastern_europe. Keep?
Fix-pass list (not done):
- Monte Alban founding c. 500 BCE and the Takalik Abaj Olmec-to-Maya change c. 500 BCE are missing from
  latin_america_politics_500bce_500ce (year -500 belongs there).
- Tonga: Tu'i Ha'atakalaua title c. 1470 (oceania_politics_500_1500) vs Takalaua's killing 1535 (oceania_politics_1500_1800);
  one source puts the title after the killing.
- Mongolia's first five-year plan: 1931 in central_asia_economy_1800_1945 and 1948 in central_asia_economy_1945_present
  (both may be real: the 1931 plan was dropped); check the texts say which.
- Unverified-heavy cells for a check pass: subsaharan_africa_religion_1800_1945 (39), western_europe_science_pre500bce (36
  of 107), western_europe_society_500bce_500ce (22), central_asia_science_1800_1945 (19).
- Peg overload: lasso 18 (north_america_science_500_1500, c. x50 dates), mill 12 (subsaharan_africa_arts_1800_1945).
- Grouping slip: Vanuatu tax haven 1971 sits in the Nauru/Kiribati group of oceania_economy_1945_present.
- Scope: Umar Tall's jihad 1852 / death 1864 and the Buganda religious wars 1888, 1892 put in subsaharan_africa_religion_1800_1945
  (agent says no politics cell holds them; subsaharan_africa_politics_1800_1945 has Segou only).


## Wave 18 (2026-11-11)
User's aim: next 20 cells, largest predicted first. Search-budget model refit on 268 cells with a new pre-contact term
(north_america, latin_america and oceania cells in pre500bce, 500bce_500ce and 500_1500): residual sd 0.36, log-search
coefficient 0.35; forecast 14,914 dates in 164 unbuilt cells at 45 searches. The term moves the north_america politics
pre-Columbian artifacts out of the top ranks, so ranks 1–20 were taken with no skips (predicted 143–174, total 3,099;
{expected} = prediction). Opus agents, rolling queue of 8, budget 45 searches each.
subsaharan_africa politics 500_1500, south_asia arts 500_1500, west_asia arts 500_1500, eastern_europe science 500_1500,
subsaharan_africa science 1945_present, latin_america economy 1500_1800, oceania society 1800_1945, east_asia society
500_1500, eastern_europe society 500_1500, south_asia religion 500_1500, west_asia religion 500_1500, subsaharan_africa
science 1800_1945, north_africa arts 500_1500, north_africa politics pre500bce, southeast_asia politics pre500bce,
subsaharan_africa society 1800_1945, south_asia science 500_1500, east_asia economy 500_1500, western_europe society
pre500bce, eastern_europe economy 500_1500.
Result (after main-session fixes): 3,013 dates over 20 cells (high 1,852, medium 813, low 57, disputed 132, unverified
159 = 5.3%); total = 97% of the prediction. Above the fit: subsaharan_africa_science_1800_1945 208 (×1.35),
oceania_society_1800_1945 211, west_asia_arts_500_1500 224, north_africa_arts_500_1500 193, west_asia_religion_500_1500
196, subsaharan_africa_science_1945_present 201. Far below: southeast_asia_politics_pre500bce 20 (×0.14; almost no
dated material), eastern_europe_science_500_1500 66 (arts and western_europe_science hold the main items),
western_europe_society_pre500bce 95, south_asia_science_500_1500 106. Model note: Southeast Asia pre500bce is
overpredicted like the pre-contact cells. Check exit 0 on all 288 cells. Grid now 288 of 432 cells, 65,233 dates.
No usage-limit deaths (~5.4M subagent tokens, every agent spent 45 searches).
Main session: south_asia_arts_500_1500 and south_asia_religion_500_1500 ran in parallel and both took the temples and
mosques. 33 building entries removed from arts (grid: religious buildings → religion; Yamoussoukro precedent), among
them Brihadisvara, Konark, Khajuraho, Qutb Minar, Quwwat-ul-Islam, Adina, Elephanta, the Dnyaneshwari and Gommateshwara.
Arts keeps the dates where the two disagreed only through the removed copy (Vishvanatha 999/1002, Kandariya 1029/1030,
Hoysaleswara 1120/1121, Adina 1375 completion/1373 start: the religion years stand). 3 more cross-cell duplicates
removed: RASCOM-QAF1 2007 (north_africa_science older), Atlas indentured workers to Mauritius 1834 (south_asia_society
older), French abolition 1848 (western_europe_politics older). pending_moves: Muhammad's first revelation 610 and the
Hijra 622 added to west_asia_religion_500_1500, note removed.
Settled by user (2026-11-11): 11 legendary chronicle foundings removed from southeast_asia_politics_pre500bce
(now 9 dates; policy.md Scope); Darfur, the Olympic victors, the 1868 cricket tour and infrastructure-as-science stay.
Open user questions (answered 2026-11-11: entries stay):
- Darfur filed under subsaharan_africa (western Sudan); grid puts "Nubia / northern Sudan" in north_africa. Rule?
- 14 Olympic victors from Italy and Sicily in western_europe_society_pre500bce: the games are at Olympia (eastern_europe).
  Home city or venue?
- 1868 Aboriginal cricket tour of England kept in oceania_society_1800_1945 under the made-abroad rule; does it cover sport?
- Infrastructure as science: subsaharan_africa_science cells put railways, dams and telegraph under engineering
  (as north_africa_science). Economy cells may claim them later.
Fix-pass list (not done):
- Peg overload: lasso 22 in south_asia_arts_500_1500 (century midpoints), lasso 14 in western_europe_society_pre500bce.
- Conflicts with world_dates (kept as world_dates has them): Sea Peoples -1177 vs c. 1179; Hyksos -1550 with Avaris
  fall -1533 as a separate entry; Narmer -3100 vs c. 3150; silkworm smuggling 552 vs 553–554.
- Cross-cell date clashes: Dukki Gel statues -593 (arts) vs Napata sack -592 (politics); Sima de los Huesos 530 ka
  (society, Benjamina skull) vs 430 ka (religion, burials).
- Rule exceptions to review: Khaza'in ul-Futuh kept 1311 against a source 1296 (the book describes 1310–11);
  Kitab al-Adwar dated by al-Urmawi's death 1294 (no dated early copy).
- Weak scenes (agent flag): subsaharan_africa_society_1800_1945 1897 Zanzibar (PIG of silver), 1906 Barotseland and
  Nevinson (SUSHI).
- Unverified-heavy cells for a check pass: south_asia_arts_500_1500 (27 before the removals), latin_america_economy_1500_1800 (22).

## Wave 19 (2026-11-11)
User's aim: 10 cells from the least complete regions, themes and periods (not largest first). Score per unbuilt cell =
fraction built of its region + of its theme + of its period; lowest first, and after each pick the cell counts as
built (so one region or theme does not take every slot). Opus agents, rolling queue of 8, 45 searches each. Same
region-and-period economy/society cells ran in parallel, so each brief named its partner and gave a split rule
(trade, farming, herding, crafts → economy; settlement, population, burials, diet, violence → society). Items an
agent found for a sibling period were sent to the running sibling agent.
oceania economy 500bce_500ce, subsaharan_africa society 500bce_500ce, oceania economy pre500bce, central_asia society
500bce_500ce, subsaharan_africa economy pre500bce, oceania society 500bce_500ce, central_asia economy pre500bce,
subsaharan_africa economy 500bce_500ce, oceania society pre500bce, southeast_asia society 500bce_500ce.
Result (after main-session fixes): 328 dates over 10 cells (high 62, medium 188, low 39, disputed 30, unverified 9);
84% of the prediction (390). Sizes 19–44. Most dates are radiocarbon ranges, so few are high. Check exit 0 on all
298 cells. Grid now 298 of 432 cells, 65,550 dates. No real cross-cell duplicates (IDF scan). ~1.8M subagent tokens.
Main session: 2 Xiongnu items the central_asia_society agent had dropped are back as unverified (snow and disease
-89; 58 groups surrender 87). Pulu pottery (-500) added to oceania_economy_500bce_500ce; Naton Beach (-500) and
Watom burials (-500) added to oceania_society_500bce_500ce. pending_moves: Endubis coins used (note removed); new
notes for Kimberley points (oceania_economy_500_1500) and Chau Can boat coffins (southeast_asia_society_pre500bce).
Fix-pass list (not done):
- Jeitun first farming: -6000 disputed in central_asia_economy_pre500bce (Harris & Gosden) vs -7200 high in
  central_asia_arts_pre500bce. Settle one year.
- Scope: six Egyptian voyages to Punt sit in subsaharan_africa_economy_pre500bce (Horn); north_africa_economy_pre500bce
  has none. Keep (effect and destination in the Horn) or move?
- Weak scenes (agent flag): central_asia_society_500bce_500ce -323 GNOME, -271 CAT.
- Weipa shell mounds (-700) and Tonga–Samoa exchange break (-650) in oceania_economy_pre500bce are unverified.

## Wave 20 (2026-11-11)
User's aim: one more wave of 10, least complete first (same greedy score as wave 19). Opus agents, rolling queue of
8, 45 searches each; partner cells built at the same time got a split rule (central_asia society/religion pre500bce:
burial as rank or violence → society, burial as ritual → religion); finds for a sibling cell were sent to the
running agent.
central_asia society pre500bce, oceania science 500bce_500ce, subsaharan_africa society pre500bce, southeast_asia
economy 500bce_500ce, central_asia science 500bce_500ce, north_america economy pre500bce, oceania religion
500bce_500ce, southeast_asia economy pre500bce, subsaharan_africa science 500bce_500ce, central_asia religion pre500bce.
Result: 305 dates over 10 cells (high 69, medium 163, low 31, disputed 39, unverified 3); 68% of the prediction
(449). Sizes 8–44: oceania_religion_500bce_500ce 8 (no dated marae or platform in the period), subsaharan_africa_science
_500bce_500ce 21, central_asia_religion_pre500bce 27 (9 disputed: Sarianidi vs Shenkar on the Margiana temples).
Above the fit: north_america_economy_pre500bce 41 (×1.4). Check exit 0 on all 308 cells. Grid now 308 of 432 cells,
65,855 dates. No real cross-cell duplicates (IDF scan). ~1.8M subagent tokens. Session searches ≈ 1,800 of 2,000.
pending_moves: Saka furnaces + first Chorasmian canals → central_asia_science_pre500bce; Bulanovo plague →
eastern_europe_society_pre500bce (check that it lies west of the Ural River). Jirzankal braziers already in
central_asia_religion_500bce_500ce.
Fix-pass list (not done):
- Wazeba: subsaharan_africa_politics_500bce_500ce dates his reign 335 (after Ezana's accession 330); the Ge'ez source in
  subsaharan_africa_science_500bce_500ce calls him Ezana's predecessor and dates his coin c. 300. Settle the order.
- Scope: Terqa cloves (found in Syria, c. 1720 BCE) kept in southeast_asia_economy_pre500bce under the main-subject rule.
- Hominin health items in subsaharan_africa_society_pre500bce (sediba tumour, Swartkrans cancer, Homo naledi) sit near
  the science cell's fossil finds; first-come check passed (no IDF hits).
- Weak scenes (agent flag): central_asia_society_pre500bce Xiaohe ANT, Salkhit.

## Wave 21 (2026-11-11)
User's aim: 20 cells that COMPLETE groups close to completion. Score per unbuilt cell = sum of 1/(unbuilt cells in group)
over its six groups (region, theme, period, region×theme, region×period, theme×period); greedy, counts updated after
each pick. Opus agents, rolling queue of 8, 45 searches each (fresh session). {expected} = search-budget fit refit on
308 cells. Partner cells built at the same time got split rules (east_asia pre500bce religion/society/economy;
north_america 500_1500 politics/economy). west_asia arts 500bce_500ce ran only AFTER religion of the same region/period
finished (wave 18 lesson); arts left all temples to religion. Out-of-period finds were forwarded to running siblings.
Cells: subsaharan_africa economy 1800_1945 / 1945_present / 500_1500, western_europe economy pre500bce, north_america
politics + economy 500_1500, southeast_asia economy 1500_1800, subsaharan_africa politics pre500bce, west_asia society
pre500bce + 500_1500, west_asia religion + arts 500bce_500ce, eastern_europe arts pre500bce, eastern_europe society
500bce_500ce, south_asia arts pre500bce, east_asia religion + society + economy pre500bce, central_asia politics pre500bce
+ 500bce_500ce.
Groups now complete: periods 1800_1945 and 1945_present; region western_europe; politics 500_1500; economy 1800_1945 and
1945_present; region×period west_asia pre500bce, north_america 500_1500, subsaharan_africa 1800_1945 and 1945_present;
region×theme southeast_asia economy, subsaharan_africa politics + economy, west_asia society + religion + arts,
eastern_europe society + arts, south_asia arts, east_asia economy + religion + society, central_asia politics.
Result (after 9 dup removals): 2,025 dates over 20 cells (high 845, medium 797, low 104, disputed 102, unverified 197);
102% of the prediction (1,976), but spread wide: subsaharan_africa_economy_1945_present 214 and 1800_1945 198 (explorers
had no older cell), west_asia_religion_500bce_500ce 190 (×2.1); subsaharan_africa_politics_pre500bce 14 (older economy/
society/science cells hold Punt, Nataruk, Tichitt, Dʿmt), central_asia_politics_pre500bce 41, north_america 47/49.
Late cells with most siblings built come in thin (first-come). Check exit 0 on all 328 cells. Grid now 328 of 432,
67,879 dates (after the Tomyris drop). ~4.8M subagent tokens, no deaths, ~900 searches.
Dups removed by the main session (IDF scan, first-come — older cell keeps): Union Minière 1906 (western_europe_economy),
Luntai edict -89 (east_asia_politics), Fernão Gomes lease 1469 (western_europe_economy), Treaty of Kampala 1967
(subsaharan_africa_politics), Vesuvius ash 472 (western_europe_society), Cyrene grain -330 (north_africa_economy), Cabot
patent 1496 (western_europe_economy), Onomastus Olympic boxing -688 (eastern_europe_society), Sasol One 1954
(subsaharan_africa_science).
ctext.org refuses fetches → east_asia pre500bce Zuozhuan items mostly unverified (religion 33, society 29, economy 19).
Settled by user 2026-11-12: Chalcedon → eastern_europe (pending_moves note); Tomyris -530 dropped from
central_asia_politics_pre500bce (west_asia keeps Cyrus's death); Western Sahara / Mauritania → subsaharan_africa.
Questions as asked:
- Council of Chalcedon 451: Chalcedon is Kadıköy (Asian shore of modern Istanbul). Rule "Istanbul, both shores →
  eastern_europe" would put it in eastern_europe_religion_500bce_500ce (unbuilt). Left out of west_asia_religion.
- Cyrus's death -530: west_asia_politics_pre500bce has it; central_asia_politics_pre500bce adds Tomyris's victory (battle
  in Central Asia). Keep both?
- Western Sahara / Mauritania are in no region list; the ssa economy 500_1500 agent put Bojador, Rio de Oro, Arguin in
  subsaharan_africa.
Fix-pass list (not done):
- Peg overload: west_asia_arts_500bce_500ce lasso 20 (c. x50 dates), eastern_europe_arts_pre500bce lasso 14 + cheese 11,
  north_america_politics_500_1500 lasso 13.
- Near-dups kept as different aspects: Dias 1488 (ssa rounds the Cape / western_europe return), Hittite plague -1322
  (society outbreak / religion prayer), Khirokitia -7000 (society wall / religion floor burials), Synod of Dadisho 424.
- eastern_europe_arts_pre500bce agent saw its scratch build.py changed by another process; cell checked clean.
- western_europe_economy_pre500bce: 6 unverified (Bajo de la Campana, Huelva deposit, Tievebulliagh, Fengate, Parys
  Mountain, Spina).
- Odendaalsrus gold 1934 vs 1938 unresolved (ssa economy 1800_1945, disputed).

## Wave 22 (2026-11-12/13)
User's aim: 25 cells, largest predicted first again. Search-budget model rebuilt (fit.py was lost with the old scratchpad):
log entries ~ region + theme + period + pre-contact term + log(searches per agent) + built siblings, refit on 328 cells
(sd 0.41; log-search coefficient 0.11, lower than the 0.35 of earlier fits; sibling coefficient 0.066). Forecast 7,809
dates in the 104 unbuilt cells at 45 searches. Ranks 1–25 taken (predicted 97–155, total 2,959; {expected} = prediction).
Opus agents, rolling queue of 8, 45 searches each. Arts after religion of the same region and period (oceania and
subsaharan_africa 1500_1800: arts started only when religion finished; no temple clashes). The two central_asia arts
cells left every religious building to the unbuilt religion cells (lists in pending_moves). Partner cells running at the
same time got split rules; agents listed finds for other cells under "For siblings" and the main session sent them to
running agents with SendMessage (no agent-to-agent messages).
Cells: west_asia science + economy 500_1500, east_asia arts 500bce_500ce + pre500bce, east_asia science 500bce_500ce,
north_africa science + society 1500_1800, north_africa religion + science + society + economy 500_1500, south_asia
society + economy 500_1500, oceania religion + arts 1500_1800, subsaharan_africa religion + arts 1500_1800, southeast_asia
science + society 1500_1800, southeast_asia religion 500_1500, eastern_europe religion + science 500bce_500ce, central_asia
arts 500_1500 + 1500_1800, west_asia science 500bce_500ce.
Interruptions: a network drop (laptop closed) killed all 9 running agents; all resumed via SendMessage from their
transcripts, two with part-written files, the rest restarted their pipeline (some had to recount searches). Later the
user paused the wave: 8 agents stopped with TaskStop and resumed via SendMessage. No work lost.
Result (after 20 dup removals): 2,261 dates over 25 cells (high 906, medium 915, low 149, disputed 101, unverified 190
= 8.4%); 76% of the prediction. Sizes 55–230. Above the fit: north_africa_religion_500_1500 230 (every Coptic pope and
Melkite patriarch), subsaharan_africa_religion_1500_1800 127, eastern_europe_religion_500bce_500ce 120. Near the fit:
central_asia_arts_500_1500 103, southeast_asia_society_1500_1800 106. Far below (first-come; older cells hold the main
items, or only century dates exist): north_africa_society_500_1500 55, central_asia_arts_1500_1800 58,
north_africa_society_1500_1800 63, north_africa_economy_500_1500 64, south_asia society 70 / economy 73. Model note: the
largest-first ranks are now mostly late cells with many built siblings; the fit overpredicts them (×0.5–0.8).
Check exit 0 on all 353 cells. Grid now 353 of 432 cells, 70,140 dates. ~5.6M subagent tokens, ~1,125 searches.
Dups removed by the main session (IDF scan, first-come — older cell keeps): Jian'an plague 217, Spring and Autumn
Annals qilin -481, Cui Hao 450, Lushi Chunqiu -239, Xi Kang 262, Sima Qian castration -99, Li Si memorial -237 (all
east_asia_arts_500bce_500ce); Panhellenion 131, Herms -415 (eastern_europe_religion_500bce_500ce); Ibn Yasin 1059, Ibn
al-Farid 1235, al-Busiri 1294, al-Musta'li 1094 (north_africa_religion_500_1500); Thomas Shaw 1738, al-Akhdari 1575,
Dawud al-Antaki 1599, Forsskal 1775 (north_africa_science_1500_1800); Selim's craftsmen 1517, Maria and Dauphin 1785
(north_africa_society_1500_1800); Soranus 118 (west_asia_science_500bce_500ce; he wrote in Rome).
pending_moves: ~60 notes for other cells (wave 22 block); the bimaristan/House of Wisdom, Socrates/Stoa and Chalcedon
notes are done and removed.
Settled by user (2026-11-13): Stone Drums of Qin → east_asia_arts_500bce_500ce at the 5th century BCE (-450,
approximate, disputed against 374 BCE and Duke Jing 576–537 BCE). Cell now 100 entries; wave total 2,262; grid 70,141.
Fix-pass list (not done):
- Rule breaks: Fath al-Bari completion DROPPED from north_africa_religion_500_1500 (restore as disputed; pending note);
  Theophrastus On Stones kept at memory -314 against source c. -322 (eastern_europe_science_500bce_500ce: use -322,
  disputed); Maimonides as court physician left out (1185 vs 1190s; add as disputed).
- Morocco plague years in north_africa_society_1500_1800: agent report garbled (1597–98 vs 1797 vs 1603); check entries.
- Near-dups kept as different aspects: Pomare II maro 'ura 1791 (religion) / Pomare I abdicates (politics); Fasilides'
  castle 1636 (arts) / founds Gondar (politics); Nikitin 1469 at Hormuz (west_asia_economy) and at Chaul (south_asia_economy).
- Scope: Sagang Sechen 1662 and Bolor Erike 1774 (Inner Mongolian authors) stay in central_asia_arts_1500_1800 (Inner
  Mongolia rule, 2026-11-07).
- Unverified-heavy cells for a check pass: east_asia_arts_pre500bce 23 (Zuozhuan; ctext.org refuses fetch),
  subsaharan_africa_religion_1500_1800 23, west_asia_science_500_1500 22.
- Weak scenes (agent flags): north_africa_society_1500_1800 1646 Cason ROACH; oceania_arts_1500_1800 Webber at
  Adventure Bay CAKE, Waimea CAVE, Duche de Vancy FISH, Forrest COWBOY.
- Peg load: north_africa_science_1500_1800 pipe 11 before dup removal; eastern_europe_science_500bce_500ce horse 10.

## Wave 23 (2026-11-13)
User's aim: 25 cells, next wave (rule kept from wave 22: largest predicted first). fit.py refit on 353 cells (sd 0.41,
log-search coefficient 0.09, sibling coefficient 0.056; WAVES now has a8c1671 = wave 22). The fit is now flat:
predictions 22–98 per cell, 4,745 dates in the 79 unbuilt cells at 45 searches. Ranks 1–25 taken (74–98, total 2,121;
{expected} = prediction). Opus agents, rolling queue of 8, 45 searches each; no deaths, no network drops.
north_africa_arts_500bce_500ce started only after north_africa_religion_500bce_500ce finished (no temple clashes).
latin_america_arts_500_1500 and southeast_asia_arts_500bce_500ce left every religious building to their unbuilt religion
cells (lists in pending_moves). "For siblings" finds went by SendMessage to running agents, the rest to pending_moves.
Cells: central_asia religion 500_1500 + 1500_1800, central_asia science + society 1500_1800, central_asia society 500_1500,
eastern_europe religion + science pre500bce, eastern_europe economy 500bce_500ce, east_asia science pre500bce, southeast_asia
science + society 500_1500, southeast_asia arts 500bce_500ce, oceania science + society + economy 1500_1800, south_asia
religion + science 500bce_500ce, subsaharan_africa science + society 1500_1800 and 500_1500, west_asia economy 500bce_500ce,
north_africa religion + arts 500bce_500ce, latin_america arts 500_1500.
Result (after 8 removals): 1,879 dates over 25 cells (high 788, medium 759, low 121, disputed 120, unverified 91 = 4.8%);
89% of the prediction. Sizes 30–138. Above the fit: central_asia_religion_1500_1800 138, oceania_economy_1500_1800 133,
central_asia_religion_500_1500 125, north_africa_religion_500bce_500ce 121, subsaharan_africa_society_1500_1800 100,
south_asia_religion_500bce_500ce 100. Far below (first-come or few dated items): southeast_asia_arts_500bce_500ce 30,
central_asia_society_1500_1800 35, subsaharan_africa_science_500_1500 35, central_asia_science_1500_1800 41,
southeast_asia_science_500_1500 44. Religion cells came in high; science/society cells with five built siblings low.
Check exit 0 on all 378 cells. Grid now 378 of 432 cells, 72,016 dates. ~5.8M subagent tokens, ~1,125 searches.
Settled in the wave: Diocletian's Price Edict 301 → west_asia_economy_500bce_500ce (issued at Antioch, Corcoran 2000),
with his currency edict 301 (Aphrodisias).
Removed by the main session: out of period in south_asia_science_pre500bce (Panini -400, Kodumanal -300, Abhaya Wewa
-377, Wari-Bateshwar -450; the new 500bce_500ce cell holds them). Dups, first-come (older cell keeps): Timur's Damascus
craftsmen 1401 (central_asia_society_500_1500; west_asia_society keeps), Cyrene grain -330 (eastern_europe_economy;
north_africa_economy keeps), al-Kashnawi magic squares 1732 (subsaharan_africa_science; north_africa_science keeps),
Athanasius exiled to Trier 335 (north_africa_religion; western_europe_religion keeps).
Open user questions:
- Gamatai (Qinghai) in east_asia_science_pre500bce: Qinghai/Amdo is Tibetan — central_asia?
- Antrea Net (Finland then, Russia now) filed in eastern_europe_science_pre500bce against the Finland rule.
- Maikop (North Caucasus) items: Caucasus = west_asia by the grid.
- 1587 Galik letters (central_asia_society_1500_1800) may be Inner Mongolian → east_asia.
- Near-dups kept as different aspects: Barros 1552 (science: Great Zimbabwe / arts: Kilwa Chronicle); Sushruta Samhita
  -600 traditional (south_asia_science_pre500bce) vs c. 300 recension (500bce_500ce); Haenke and Nee at Port Jackson
  1793 / on Luzon 1792; Nadir Divan-begi khanqah / Lyab-i Hauz pool 1620.
Fix-pass list (not done):
- Out of period in older cells: eastern_europe_society_pre500bce Hippokles -498; oceania_science_pre500bce Lapita end
  -500; southeast_asia_politics_1800_1945 Siam puts Ang Eng on the throne 1794.
- Peg overload warnings (round c. dates): south_asia_religion_500bce_500ce lasso 26, south_asia_science_500bce_500ce
  lasso 14, latin_america_arts_500_1500 lasso 13, southeast_asia_arts_500bce_500ce lasso 11, oceania_economy_1500_1800
  fife 12 (1788); oceania_society_1500_1800 bees 10.
- Weak scenes (agent flags): north_africa_religion_500bce_500ce bishop installations (reef, fairy, tongue).
- Kanishka council 78 (south_asia_religion_500bce_500ce) vs Kanishka era 127 (politics) — old open item.
- Blue Beryl 1688 unverified (central_asia_science_1500_1800; religion agent said 1687).
- Finds for built cells: in pending_moves (wave 23 block, "cell exists").

## Wave 24 (2026-11-13)
User's aim: 10 cells, the SMALLEST predicted (not largest first). fit.py on 378 cells; ranks 45–54 of the unbuilt list
(22–30 each, total 280). Opus agents, 45 searches each, 8 at once; no deaths, no network drops.
oceania_arts_pre500bce started only after oceania_religion_pre500bce finished (rock art → arts, ritual → religion; the
religion agent handed 9 art items to the arts brief). Siblings built together with split rules in the prompt:
latin_america science + society + economy pre500bce (domestication/trade → economy, techniques → science, arrival/burials
→ society); north_america science + society pre500bce; oceania society + economy 500_1500 (settlement → society).
Cells: oceania religion + arts pre500bce, oceania arts 500bce_500ce, oceania economy + society 500_1500, latin_america
science + society + economy pre500bce, north_america science + society pre500bce.
Result: 361 dates over 10 cells (high 111, medium 172, low 29, disputed 40, unverified 9 = 2.5%); 129% of the prediction —
the fit undercounts thin pre-contact cells. Sizes: latin_america_economy_pre500bce 52, north_america_society_pre500bce 48,
latin_america_society_pre500bce 46, latin_america_science_pre500bce 39, oceania_society_500_1500 38,
north_america_science_pre500bce 38, oceania_economy_500_1500 33, oceania_arts_pre500bce 29, oceania_religion_pre500bce 24,
oceania_arts_500bce_500ce 14 (the only cell below the fit; most rock art in the period has no published date).
Agents removed their own overlaps with siblings (first-come). Main-session dups scan: no removals (all hits are other facts
at the same site, e.g. Teouma cone-shell rings: arts = how made, religion = put in graves in place of skulls).
Check exit 0 on all 388 cells. Grid now 388 of 432 cells, 72,377 dates. ~1.9M subagent tokens, ~450 searches.
Refit on 388 cells: sd 0.41, log-search coef 0.11, sibling coef 0.042; 44 unbuilt cells forecast 2,425 dates (33–82).
Fix-pass list (not done):
- Fell's Cave: latin_america_society_pre500bce gives -9000 from 11,000 14C BP (uncalibrated); science gives 12,800 cal BP
  (Waters 2015). Recalibrate the society entry.
- Finds for built cells: in pending_moves (wave 24 block, "cell exists").

## Wave 25 (2026-11-13) — grid complete
User's aim: all 44 cells left, in one wave. fit.py on 388 cells at 43 searches: 2,413 predicted (33–82 each); the four
pre-contact politics cells (north_america and oceania, pre500bce and 500bce_500ce) were set to 12–25 by hand (fit
artifacts). Opus agents, rolling queue of 8, 43 searches each (1,892 of the 2,000 cap). Arts started only after religion
of the same region and period (SEA pre, SSA pre and 500bce, NA pre and 500bce, LA 500bce). Sibling cells got split rules
in the brief; "For siblings" finds went by SendMessage to running agents or into the next brief, the rest to pending_moves.
No deaths, no network drops, no usage-limit hit (~9.0M subagent tokens, ~1,890 searches).
Result (after 5 removals): 1,935 dates over 44 cells (high 405, medium 1,051, low 241, disputed 151, unverified 87 =
4.5%); 80% of the prediction. Largest: latin_america_religion_500_1500 77, north_africa_science_500bce_500ce 76,
latin_america_society_500_1500 75, south_asia_society_pre500bce 67, south_asia_economy_500bce_500ce 66. Smallest:
oceania_politics_pre500bce 7, oceania_politics_500bce_500ce 9, north_america_politics_500bce_500ce 14,
north_america_politics_pre500bce 15. Thin religion/arts/science cells (22–34) lost their main items to older cells.
Check exit 0 on all 432 cells. GRID COMPLETE: 432 of 432 cells, 74,312 dates.
Removed by the main session (IDF scan, first-come): Amasis income decree -550 (north_africa_economy_pre500bce; society
keeps), Colaeus to Tartessos -640 (eastern_europe_economy_pre500bce; western_europe keeps), Santa Elina pendants -23000
(latin_america_arts_pre500bce; society keeps), Cerro Baul brewery 1000 (latin_america_society_500_1500; economy keeps),
Liang Bua tool-stone change -44000 (southeast_asia_science_pre500bce; society keeps the arrival).
pending_moves: 22 notes for the new cells taken in and removed; ~28 new notes for built cells (wave 25, "cell exists").
Open user questions:
Settled by user (2026-11-13): Jebel Moya (Gezira, south of Khartoum) stays in subsaharan_africa; Turner airburst removed from
north_america_society_500bce_500ce (Sci Rep 2022 paper retracted 2023).
- Near-dups kept as different aspects: Calio, Wolo Sege, Talepu (SEA science tools / society arrival); Taforalt, Heqanakht
  (NAf economy / society); Diepkloof flasks (SSA science / engraved in arts); Okvik, Lolomai, Marpole (NA economy / siblings).
Fix-pass list (not done):
- Mehrgarh re-dated to c. 5000 BCE (Mutin, Zazzo 2025): south_asia_science_pre500bce c. -7000 items → disputed (pending note).
- Sun Pyramid: latin_america_science_500bce_500ce c. 100 vs religion dedication caches c. 200.
- Weak low items an agent suggests dropping: Purusha Sukta -1000, Gargi -700, Riwat, Masol (south_asia_society_pre500bce).
- Weak scene: central_asia_economy_500_1500 726 Kucha horse seizure (NACHO carries a detail only).
- Peg overload warnings (round c. dates): north_africa_science_500bce_500ce lasso 18, south_asia_economy_500bce_500ce lasso 17,
  southeast_asia_religion_500bce_500ce lasso 16, north_america_religion_500bce_500ce dice 15, latin_america_religion_500bce_500ce
  lasso 14 + mouse 14, latin_america_economy_500bce_500ce lasso 14, latin_america_arts_500bce_500ce nose 13,
  latin_america_society_500_1500 lasso 13, latin_america_economy_500_1500 lasso 13, south_asia_economy_pre500bce nail 12.
- Finds for built cells: in pending_moves (wave 25 block, "cell exists").
