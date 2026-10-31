# PRD — memory-deck-generator

## Problem
Memorizing ordered lists (award laureates, poem lines, historical rulers) is hard. Acronym mnemonics help, but generating them from authoritative sources is tedious.

## Goal
Generate Excel acronym-tables and per-deck JSON artifacts from Wikipedia/Wikidata sources automatically, grouped by configurable time windows. The spaced-repetition **quiz app now lives in a separate repo** (`memory-quiz-app`, see its PRD); this repo is generator-only and emits `data/decks/*.json` consumed by the quiz via the orchestrator's Dagster `decks` asset.

Six pipelines are **curated rather than fetched** — `deck-vocab`, `deck-papers`, `deck-companies`, `deck-code-mcq`, `deck-counties` and `deck-grammar` — where the heavy lifting is an audited LLM pass (or, for grammar, a Wiktionary import checked against rules) done once and committed as data, and `build` assembles the artifact deterministically offline. Their decks are `source: manual`: `deck-export` has no config to rebuild them from, so the clear and the sync both preserve them.

### Refreshing decks (`deck-export`)

A bare run **clears the output directory** and rebuilds every deck — authoritative, but it renumbers `order` and re-stamps `config_path` from the running checkout. Both are *identity*, not content: `config_path` keys the quiz's sessions table (`WHERE config_path=?`) and its artifact lookup; `order` sorts the deck list. Because the deck directory accumulates across runs, a fresh numbering agrees with neither — so re-deriving them during a partial refresh strands study history and shuffles the list. (Exporting from a git worktree stamps the *worktree* path in, which strands history once the worktree is removed.)

**`source: manual` artifacts are preserved through the clear.** Some decks the quiz consumes carry curated content (e.g. `memory-quiz-app`'s CC-CEDICT Chinese vocab deck for matching mode — produced out-of-band by `deck-vocab`, see Pipelines §8) and have **no config `deck-export` can rebuild from** — a full run would silently delete them. `export_decks` skips any artifact whose JSON carries `"source": "manual"` (`_is_manual`; unreadable/malformed → treated as generated, so a corrupt generated deck is still rebuilt). The orchestrator's Dagster `decks` sync applies the same guard when clearing the quiz repo's dir.

Use `--only <glob>` to refresh a subset: matching decks are rebuilt, everything else is left untouched and never fetched, and each rebuilt deck keeps the existing artifact's `order`/`config_path` while `items`/`labels`/`config_hash` update. `--reset-identity` opts out (e.g. after genuinely relocating the repo).

**Orphan warning.** Deleting a config removes the recipe but *not* the already-built artifact: `data/decks/` is gitignored build output, and `--only` deliberately skips the stale-clear above. The orphan then survives every targeted re-export, and the orchestrator's `decks` sync copies it into the quiz verbatim — so a deck removed on purpose can reappear weeks later. That happened: the Shakespeare sonnet decks were deleted 2026-07-15 (config *and* quiz artifact) and a `--only` artwork refresh on 2026-07-25 put them back in the quiz menu, byte-identical to their pre-deletion content. Every export now reports them (`find_orphan_artifacts`, comparing the output dir against `_discover_slots` — configs only, no network); fix by deleting the file **from the generator's output dir first**, so the next sync is a no-op rather than a re-copy. `source: manual` artifacts are never orphans, for the same reason the clear preserves them.

**Deck staleness is invisible.** `config_hash` covers the config bytes only, so a change to *generator behaviour* — e.g. the end-year transition rule — leaves every hash identical while the digits change. Decks do not self-report as stale; re-export after any generator change.

## Users
Personal / educational use. Single user driving batch runs via CLI.

## Pipelines

### 1. Award Laureates (`deck-acronyms`)
- Source: Wikidata SPARQL (award Q-number)
- Output: year-chunked acronyms from laureate name initials
- Gap warning: emitted to stderr when `count_laureates()` (all P166 statements) differs from fetched count (those with P585 date qualifier). Computed before manual entry merging so it reflects Wikidata quality only.

| Field | Required | Default | Notes |
|---|---|---|---|
| `award_name` | yes | — | Used in output filename and warning messages |
| `wikidata_item` | yes | — | Q-number, e.g. `Q37922` |
| `chunk_years` | no | 5 | Years per acronym chunk |
| `chunk_start_year` | no | earliest entry year | First year of first chunk |
| `humans_only` | no | false | Adds `wdt:P31 wd:Q5` SPARQL filter; also applies to `count_laureates` |
| `first_letter_only_from` | no | null | Entries from this year onward use only first letter of first name token |
| `manual_entries` | no | [] | `[{year, name}]` — merged after SPARQL fetch; deduped by (year, name); for Wikidata coverage gaps |
| `exclude_entries` | no | [] | List of names — subtracted from `count_laureates` total to suppress gap warnings for known Wikidata errors |

### 2. Poetry Lines (`deck-poetry`)
- Source: Project Gutenberg (plain text, cached locally)
- Output: per-line acronyms (first letter of every word, particles included)
- `line_initials` includes all words (unlike `name_initials` which skips particles)
- `start_marker`/`end_marker`: any substring of the first/last line; robust to minor Gutenberg edition differences

Single poem config:
```yaml
poem_title: "Shakespeare Sonnet 18"
gutenberg_id: 1041
start_marker: "Shall I compare thee to a summer's day?"
end_marker: "So long lives this, and this gives life to thee."
```
Collection config: top-level `collection_title` + `poems` list, each with `poem_title`/`start_marker`/`end_marker`. Single sheet output with bold yellow title row per poem and blank row separators.

### 3. Monarch Reigns (`deck-monarchs`)
- Source: Wikidata SPARQL (position Q-numbers)
- Output: per-century transition-digit strings (last digit of accession year per monarch)
- **End-year events**: any recorded end year that is not itself some ruler's accession year becomes a transition event — i.e. the throne did not pass directly to a successor that year. This covers Wikidata coronation-lag (Edward the Elder died 924, Æthelstan crowned 927 → 924 inserted), the start of a genuine interregnum (Commonwealth: Charles I ends 1649, Charles II accedes 1660 → 1649 inserted), and a dynasty's terminal year (last ruler, no successor). Continuous same-year successions add nothing. *(Superseded the original ≤5-year gap-fill threshold, which suppressed interregnum and terminal years.)*
- **Deduplication by person Q-number**: monarchs whose title changed mid-reign (e.g. George III: King of GB 1760 → King of UK 1801) or who were deposed and restored (e.g. Stephen, Henry VI) appear once with their earliest accession year and latest end year.
- **Fragmented Q-numbers**: Britain requires four position Q-numbers across eras (`Q18810062` England pre-1707, `Q110324075` GB 1707–1801, `Q111722535` UK 1801–1927, `Q9134365` UK 1927–present).

| Field | Required | Default | Notes |
|---|---|---|---|
| `subject` | yes | — | Used in sheet title and output filename |
| `positions` | yes | — | List of Wikidata position Q-numbers (P39 values) |
| `houses` | no | — | P53 noble-family Q-numbers; restricts holders to those houses. Needed when a position spans dynasties (`Q268218` "Emperor of China" covers every dynasty; House of Zhu / Aisin-Gioro isolate Ming / Qing) |
| `accession_min_year` / `accession_max_year` | no | — | Cap a dynasty at a historical boundary (Abbasids at the 1258 Baghdad fall, excluding the Cairo figureheads acceding to 1517) |
| `corrections` | no | — | Sourced manual overrides of transition years — see below |
| `chunk_years` | no | 100 | Years per chunk |
| `chunk_start_year` | no | earliest accession year | First year of first chunk |
| `wikipedia_list` | no | — | Article title used by `deck-coverage-check` and date cross-checks |
| `group` | no | `Monarchs` | Collapsible menu group in the quiz; all monarch decks share one "Monarchs" group by default (like poetry's `collection_title`), override to sub-group |

##### `corrections:` — sourced overrides

Wikidata models one P39 statement per ruler, which cannot express a reign interrupted and resumed, and it carries occasional plain date errors. Each correction records *why* and *against what*, so it can be re-verified and later retired:

```yaml
corrections:
  - year: 1446
    action: add          # 'add' | 'drop'
    reason: "Murad II restored 1446; Wikidata records 1421–1451 as one unbroken statement"
    source: "List of sultans of the Ottoman Empire"
    checked: "2026-07-16"
```

`reason` and `source` are **required** — `parse_corrections` raises rather than skip a malformed entry, since a correction that silently fails to apply looks identical to one never written. Drop removes every occurrence of a year and is applied before add.

**`count:` — a year can carry more than one transition** (2026-08-23). A digit is a transition *event*, not a year, so two accessions in one year are two digits — which `_raw_events` already produces from Wikidata. A bare `add` could only assert "this year appears **at least** once", so a year needing two events while upstream supplies one was inexpressible: the idempotence guard refused the second. An `add` may now carry `count: N`, meaning **the corrected output should contain this year N times**; the pipeline tops up to N. Default 1 is exactly the previous behaviour. Refused on a `drop`, which removes every occurrence and so cannot honour a count. First use: Hammadid **1105**, which carries al-Mansur → Badis in January and Badis → Abd al-Aziz on 27 July, while Wikidata dates Badis to 1104 and supplies only the second.

**Add is idempotent.** A correction is a bet that Wikidata stays wrong, and Wikidata improves; appending unconditionally would double a digit the day upstream fixed the statement. `stale_corrections` reports corrections that no longer change anything (an `add` whose year Wikidata now supplies **at least `count` times**, a `drop` it no longer emits) — neither is an error, which is exactly why they need surfacing rather than rotting silently.

Idempotence is about **declaring the intended output**, not about "at most once" — which is why `count` generalises it rather than weakening it: with `count: 2`, the day Wikidata records both 1105 events the correction becomes a no-op and is reported stale, exactly as a `count: 1` add is today.

There is **no mechanism to correct a ruler's accession/end year directly**; corrections patch the *transition-year output*, not the underlying data. So a wrong accession year is expressed as a `drop` of the bad year plus an `add` of the right one (and sometimes only a drop — Tahmasp II's true 1722 accession is already a transition year via his predecessor's end year).

##### Item identity — `<deck-stem>|<century>`, not the digit string (2026-08-13)

The quiz derives a card's FSRS key from the item string **alone** (`sha256(item)[:16]`, no deck),
so item strings must be globally unique. Bare transition-digit strings are not: `62` is Britain
1200–1299 *and* the Alaouites' 1600s, `9` spans four decks. Eleven strings collided over 26 cards,
each one card shared between realms — studying Britain marked three unopened decks as learned.

Monarch artifacts therefore emit `items` as `<deck-stem>|<century label>` (`monarch_item_keys`)
with the display string in a parallel **`digits`** array, matching how artworks (`<QID>|attr` +
`answers`) and equations (LaTeX + `mathml`) already separate identity from what is rendered. A
side effect worth having: the key no longer contains the digits, so live-Wikidata drift can no
longer strand monarch history — the failure that forced the 2026-07-17 and 07-25 recovery runs.

##### Reign reference tables (`deck-monarch-tables`) — one row per digit

A monarch deck ships digit strings and century labels and nothing else, because the digits *are*
the cards. Nothing on disk said the `4` in `47965958` was Edward the Elder's reign ending in 924.
`deck-monarch-tables` builds that explanation for **every** monarch config, in two forms from one
fetch: `results/<slug>.xlsx` to read, and a JSON sidecar the quiz's monarch preview renders.

- **The unit is the transition event, not the ruler.** `TransitionEvent` (`year`, `kind`,
  `monarch`) carries `accession` / `reign_end` / `correction`, and `make_monarch_chunks` now joins
  the digit string *from those events* — so `chunk.events[i]` is by construction what digit `i`
  stands for. The previous per-ruler xlsx could not reconstruct the string: a `reign_end` year has
  no acceding ruler to give it a row, and a `corrections:` add belongs to no Wikidata statement at
  all. Both are exactly the digits a reader cannot otherwise account for.
- **Ordering within a year is FSRS identity.** Accessions are emitted sorted and first, end-years
  after them, corrections last, and the final sort is stable — the order the strings have always
  been built in. Reordering two digits of a year rewrites the item and strands its history.
- **Decks are frozen; Wikidata is not.** Every deck is checked before it is explained
  (`check_against_deck`): if today's fetch no longer reproduces the shipped digit strings, that
  table is skipped and reported rather than written. A table describing a different deck than the
  one being studied is the whole failure this guards. All 37 decks rebuilt clean on 2026-08-13.
- **The sidecar is committed in the quiz repo**, not synced by the orchestrator's `decks` asset —
  the same out-of-band path as `data/translations/` and `data/lexicons/`. It carries
  `items_sha256` over the deck's digit strings, and the quiz drops a table failing it rather than
  showing a shifted one; `config_hash` cannot serve, since it covers config bytes only and a
  re-fetch that inserts one ruler leaves it unchanged while moving every later digit.

##### Date precision (documentation only)

`Monarch.accession_precision` carries Wikidata's `timePrecision` for P580 (9 = year, 8 = decade, 7 = century). Below year precision, the source does not actually claim that year — Assyria's Tudiya is stored as `-2450` at decade precision, meaning "the 2450s BC"; Denmark's Sigfred (770) and France's Mallobaudes (378) / Marcomer (380) are decade-precision within shipped decks. **Digit extraction deliberately ignores this**, so decks are byte-identical to before the field existed; `deck-monarchs` merely warns. This matters for any future expansion into ancient series: pharaoh has 527 recorded holders but only 88 with any start date, and Mesopotamian absolute chronology is convention-dependent (High/Middle/Low differ by decades), so precision is the difference between a fact and an artifact.

#### Monarch deck set (2026-07; 37 since 2026-08)
**37 decks** (`configs/monarchs/`). First 20 below; 17 Maghreb, al-Andalus and Sicily dynasties added 2026-08: Aghlabids, Alaouites, Almohads, Almoravids, Hafsids, Hammadids, Idrisids, Kalbids, Marinids, Midrarids, Regency of Algiers, Regency of Tunis, Rustamids, Saadis, Wattasids, Zayyanids, Zirids. *European (13):* Britain, English Commonwealth, Scotland, Denmark, Norway, Sweden, Holy Roman Empire, Byzantium, Hungary, Portugal, Bohemia, France, Japan. *Non-European (7, 2026-07):* Umayyad, Abbasid, Fatimid caliphs; Ottoman sultans; Safavid shahs; Ming, Qing emperors. Selection was data-driven from a full Wikidata survey:
- **Survey**: ~566 monarch positions (`wdt:P279* wd:Q116`) carry reign holders; 268 have ≥8 reigns. Median date coverage 92%. Full categorized list saved at `results/monarch_positions_wikidata.md`.
- **Rank by conditioning, not size** (2026-07 re-survey): 325 monarch positions have ≥6 holders but only **272 have ≥6 *dated* ones** — our pipeline needs `P580`. The largest counts are generic umbrella classes, not series (`Q12097` "king" 284, `Q116` "monarch" 158, `Q181888` "khan" 117); they mix every realm and need the same `houses` treatment as Emperor of China. Best unbuilt candidate is **Pope (`Q19546`)**: 268 holders, 99% dated, 229 at day precision, one clean position, irregular reigns. Ancient series are mirages — **pharaoh has 527 holders but only 88 dated (17%)**, and Mesopotamian absolute chronology is convention-dependent (High/Middle/Low differ by decades), so those digits would encode a convention, not a fact.
- **Quality gates** (what makes a good deck): **date coverage** ≥70% (sparse `P580` start-years → weak deck) and **per-century density** ≤~15 holders (each accession = one transition digit, so a dense century = an unlearnably long card).
- **Multi-QID chains** (France-style, like Britain's): France = king of the Franks → king of France → King of France and Navarre → King of the French → Emperor of the French (`Q22923081, Q24851389, Q3439798, Q3439814, Q5373953`), `chunk_start_year: 480`. `fetch_monarchs` dedups by person across the chain.
- **BCE handling**: setting `chunk_start_year` to a CE value cleanly excludes earlier (legendary/BCE) reigns — the chunk loop only buckets events ≥ start. Japan starts at 500 (drops 11 legendary BCE emperors); `e % 10` is safe for negative years but BCE labels are ugly.
- **China: solved by `houses`** *(was "deferred — Wikidata has no per-dynasty positions")*. "Emperor of China" (`Q268218`) does conflate every dynasty and all parallel claimants (Three/Sixteen Kingdoms, Five Dynasties) → century cards of 33–44 digits. The dynasty-membership model that was thought missing is **P53 "noble family"**: filtering holders by House of Zhu / Aisin-Gioro isolates the Ming (16 rulers) and Qing (11) cleanly. Other fragmentation-era dynasties remain unbuilt but are now tractable the same way.
- **Remaining opportunity**: ~111 more positions are clean/viable for batch generation now (≥70% dated, ≤15 density); ~22 marginal; 5 China-like dense; 46 too sparse; 72 excluded (consorts + ecclesiastical). Iberia (Aragon/Castile/León/Navarre) is fragmented and would need France-style chains or per-kingdom decks.
- **Known data-quality gaps** (2026-07 cross-check, 138 rulers over the 7 non-European decks vs Wikipedia with 3-of-3 adversarial verification — report at `results/verify_monarch_dates/report.md`):
  - **Consort contamination**: `Q18577504` "Byzantine emperor" is attached to consorts on Wikidata (Theodora *wife of Justinian I*, Zenonis, Gregoria, Anna of Moscow, Irene Gattilusio). The survey's consort exclusion filtered consort *positions*, not consorts holding the emperor position — byzantium's digits include women who never reigned.
  - **Scope bleed**: `english_commonwealth` uses `Q512196` "Lord Protector", which also matches Edward Seymour (1547–49), Edward VI's regent — a different institution. Harmless only because `chunk_start_year: 1600` puts him out of range; wants an `accession_min_year`.
  - **Data holes read as interregnums**: the end-year rule inserts a transition wherever no successor follows within the data, which cannot distinguish a real interregnum from missing rulers. 9 such cases exceed 50 years — france 511 (Clovis I, 118yr hole), france 869, japan 200, holy_roman_empire 814 (Charlemagne, 61yr) — all spurious.
  - **Position/house filing is not a taxonomy** (Aghlabids, fixed 2026-08-23). Three of eleven emirs were invisible to a query naming one position and one house: Ibrahim I (800–812) carries house `Q125373423` "Banu Al-Aghlab", a duplicate of `Q207600`; Ibrahim II (875–902) and Abdallah II (902–903) hold the generic `Q166382` "Amir" rather than `Q51680298` "Emir of Ifriqiya". The deck was missing 800 and 902 entirely. Naming the extra QIDs is safe *because* the house filter is doing the work — the widened query returns exactly those three. Assume every dynasty is filed at least twice; the density and coverage gates cannot see a ruler the query never asked for.
  - **A generic position defeats an explicit exclusion** (Zirids, fixed 2026-08-23). The config already excluded `Q33083118` "emir of Granada" to keep the al-Andalus taifas out of an Ifriqiyan succession — and the generic `Q1097498` "ruler" then admitted the Zirid emir of **Málaga** (1072–1090) anyway, two of the four digits on the 1000s card. An exclusion only holds if every *other* position in the config is realm-specific. Same pass: 1116 was missing (Yahya ibn Tamim is filed under `Q14698333` "viceroy of Ifriqiya"), and 996 was stamped 995.
  - **Dedup can discard the correct date** (Zirids, same pass). "Earliest accession, latest end year" is right for a title change or a restoration, but al-Hasan ibn Ali carried two `ruler` statements — 1121–1152 and 1121–1148 — and the rule kept 1152, the year of his detention in Algiers, over 1148, the Norman capture of Mahdia that actually ended the dynasty. Wikidata **had** the right year; the merge threw it away. A second statement disagreeing with the first is a signal, not noise, and nothing surfaces it.
  - **Aghlabid 863** (same pass): Wikidata stamps both Abu Ibrahim Ahmad's death and Ziyadat Allah II's accession `0864-01-01`; EI2 gives 28 December 863. The century carried two `4`s and no `3`. Muhammad II's December 864 accession is genuine, so the fix is `drop 864` + `add 863` + `add 864` — `drop` removes *every* occurrence of a year, and `stale_corrections` then permanently reports the re-added 864 as stale, since the predicate reads raw events and does not model drop-then-re-add.
  - **Unresolved**: Orhan's accession (we follow the traditional 1326; Wikipedia's table says "c. 1324") is a historiographic dispute, documented in-config. Fatimid al-Mustansir (1095 vs 1094) sits on a Hijri year boundary and awaits a second source.

### 4. Shakespeare Passages (`deck-shakespeare`)
- Source: Folger Digital Texts API (`folgerdigitaltexts.org`)
- Output: YAML catalogue + xlsx of monologue passages (character, play, line count, full text)
- Config: list of play codes (e.g. `Ham`, `Mac`) and `min_lines` threshold
- Caching: raw HTML responses cached locally under `cache/folger/`; segments under `cache/folger/segments/`
- Catalogue includes `meta` block with `total_passages` and `total_lines`
- Core 10-play config (`configs/shakespeare/core_plays.yaml`): Hamlet, Macbeth, King Lear, Othello, The Tempest, Romeo and Juliet, A Midsummer Night's Dream, The Merchant of Venice, Julius Caesar, Richard III — 163 passages, 4,673 lines

### 5. Monologue Archive Passages (`deck-monologue-archive`)
- Source: monologuearchive.com (static HTML, scraped with `requests`)
- Output: YAML catalogue + xlsx of monologue passages (playwright, play, character, type, lines)
- Config: list of `{slug, name}` entries — slug matches URL pattern `/{letter}/{slug}.html`
- Caching: author index pages under `cache/monologue_archive/`; individual passages under `cache/monologue_archive/passages/`
- Filters out external `list-group-item active` links that share the same CSS class as internal entries
- Core config (`configs/monologue_archive/core_playwrights.yaml`): Christopher Marlowe, Ben Jonson — 23 passages, 850 lines

### 6. Famous Artworks (`deck-artworks`) — *built* (5,552 works shipped)
- Source: Wikidata SPARQL — `instance of painting (Q3305213)` with creator (P170) + image (P18), ranked by `wikibase:sitelinks` (fame proxy); `min_sitelinks`/`limit` knob, plus curated-QID and collection (P195) source modes. Survey (2026-07-17): 381,330 paintings have creator+image; ~104 at ≥30 sitelinks, ~1,533 at ≥10.
- Output: unlike the xlsx pipelines, emits **directly to the quiz artifact seam** — an expanded two-card-per-artwork deck (`data/decks/*.json`, `items` = `<QID>|title` / `<QID>|creator`) plus downsized **WebP image files** under `data/decks/assets/<deck>/`, and **baked multiple-choice distractors**. Consumed by `memory-quiz-app`'s `image-mc` mode.
- **`sitelinks` (2026-07-26)**: the fame count the fetch already ranks by is now emitted as a parallel array, the deck's only measure of how well-known a work is. The quiz's preview creator browser sorts on it. Re-exported from cache — items byte-identical, so no FSRS key moved. Use **`--cache-only`** for a re-export that must not change the work set: it assembles from already-downloaded images alone (the config key of the same name, without editing the config, which would move `config_hash` for an unrelated reason).
- Key stability: item strings are `<QID>|attr`, so re-fetching an image or a corrected label never strands FSRS history (contrast monarch digits). Image licensing (drop non-free) is the main open risk.
- **Creator corrections (2026-07-25)** — a sourced `corrections:` block (same provenance contract as monarchs, shared via `corrections.py`) with `set` / `exclude` actions, applied between `fetch_artworks` and `build_choices` so distractors are built from the corrected creator. Fixes two failure modes P170 can't: a work with **several creators** (2.7% of the deck — Laocoön's three sculptors, the Ghent Altarpiece's two van Eycks, the Siegessäule's six-plus-architect; no Wikidata field picks one, so all 111 were adjudicated by hand — 64 principal, 39 credited-set, 8 unanswerable) and a **plainly wrong statement** (The Magpie credited to Picasso on a Monet painting). Joint answers draw joint distractors, since a two-name answer among one-name options is pickable on shape alone. The fallback pick is now **deterministic** (lowest QID): it used to be SPARQL row order, which WDQS doesn't guarantee, so a re-export could silently flip an answer under a stable `item_key`. `stale_corrections` reports entries upstream has caught up on **and** any new multi-creator work no correction covers.
- **Canon coverage (2026-08-03)**: measured against the index of *Art: The Definitive Visual Guide* — 1,083 indexed works absent from the deck, 665 deck creators absent from the book. See [Coverage analysis](#coverage-analysis--external-reference-comparison-2026-08-03).
- See [`docs/design/artworks-pipeline.md`](docs/design/artworks-pipeline.md) and the quiz's [`artwork-mc-mode.md`](../memory-quiz-app/docs/design/artwork-mc-mode.md).

### 7. Equations (`deck-equations`) — *built*
- Source: **hand-curated** LaTeX in `configs/equations/{statistics,physics,mathematics}.yaml` (an article's wikitext holds every `<math>` on the page with nothing marking *the* formula — that choice stays human). Corruptions, by contrast, are **generated**.
- Output: emits **directly to the quiz artifact seam** — a `deck_type: equations` / `mode: error-spot` deck with baked MathML and, per equation, a pool of **verified single-token corruptions** (`{id, i, to, type}`) plus `bad_pairs`. sympy *proves* each corruption non-equivalent (fails closed); `normalise.py` rewrites real notation (`P(A\mid B)`, `\operatorname{Var}`) into a sympy-parsable form **for verification only**. Consumed by `memory-quiz-app`'s `error-spot` mode.
- Split: one config → **two decks** (2-error / 1-error) by supportable error count (`classify`), disambiguated by `poem_title`. Key stability: item = canonical LaTeX, so retuning the engine, retiring a type, or an equation moving between decks never strands FSRS history.
- See [`docs/design/equations-pipeline.md`](docs/design/equations-pipeline.md).

### 8. Chinese Vocab (`deck-vocab`) — *built*
- Source: **wordfreq** frequency ranking ⋈ **CC-CEDICT** (CC-BY-SA 4.0) for pinyin + glosses. A curation tool for the quiz's `matching` deck, **not** a full-export deck: the deck stays `source: manual` (protected from the clear + orchestrator sync; carries live FSRS history), so — like equations' curated content — heavy lifting is done once and **committed as data**, then `build` assembles the artifact deterministically (offline, no API key).
- Pipeline: `rank_candidates` routes each candidate into *clean* (single reading/≤3 senses → CC-CEDICT first-gloss is safe, ~63%) or *needs-LLM* (polyphone ∪ multi-sense ∪ function-word, ~37%, where the first sense is unreliable — 被→"quilt" not the passive marker). Needs-LLM words get an **audited per-word LLM adjudication** (frequency-correct reading+sense + one short gloss + logged reason). The existing 267-word seed is frozen byte-identical (FSRS keys survive). Grown **267→5257** (2026-07-23).
- Gloss uniqueness is **band-scoped** (`band_collisions`, `FREQ_BAND_SIZE` window): English has no 5000+ distinct short glosses, and a matching round only co-displays same-band words. `deck-vocab build` reproduces the exact artifact shipped to `memory-quiz-app`.
- Committed data: `configs/vocab/chinese_common.{yaml,curated.jsonl,audit.jsonl,policy.md}`. See [`docs/design/vocab-pipeline.md`](docs/design/vocab-pipeline.md) and the quiz's [`matching-mode.md`](../memory-quiz-app/docs/design/matching-mode.md).

### 9. Musical Themes (`deck-themes`) — *built* (899 cards over 6 decks)
- Source: the **MTD** (Musical Theme Dataset, AudioLabs Erlangen) — 2,067 themes digitised from Barlow & Morgenstern's *Dictionary of Musical Themes* (1948). A theme here is an **editorially-chosen theme**, not a mechanical incipit, which is what makes it a study unit at all; no other open source segments themes at this scale. The 2.6 GB archive is unpacked under `cache/mtd/` (gitignored); only `data_SCORE_XML` + `data_META` are read — the CSV note list merges ties and disagrees with the notation on 566 of the 2,067 themes.
- Output: emits **directly to the quiz artifact seam** — a `deck_type: themes` / `mode: notation-spot` deck plus **MEI asset files**, which `memory-quiz-app` engraves with Verovio at display time (a wrong note cannot be produced by editing engraved markup, so it is rendered rather than baked).
- Corruptions are pitch moves, accidentals, and rhythmic re-splits of an adjacent **pair** (a bar that no longer adds up would leak the answer through note spacing). Verification is **structural, not algebraic** — no sympy, no pool cache, no engine version — and fails closed on a no-op, a respelling, a changed measure total, or a claim/effect mismatch.
- Key stability: `item` is `MTD|<id>`, never the notation. MTD ships corrected encodings, so keying on notes would strand history the first time a wrong pitch was fixed upstream; redrawing the period bands moves a theme between decks with no effect on its FSRS history.
- **Selection is the design decision.** Beethoven alone is 27% of MTD and ten composers are 73%; uncapped, every fourth card is Beethoven and the deck teaches one catalogue. `max_per_composer: 40` takes 2,067 → 899.
- ⚠ **Licensing is unresolved and blocks publishing the derived MEI**: the archive LICENSE grants CC-BY to six folders and does **not** name `data_SCORE_XML`, the one this reads. Probably an oversight, but an oversight is not a grant — confirm with the authors.
- See [`docs/design/themes-pipeline.md`](docs/design/themes-pipeline.md) and the quiz's [`notation-mode.md`](../memory-quiz-app/docs/design/notation-mode.md).

### 10. Paper MCQs (`deck-papers`) — *built*
- Source: **a scientific paper, read by an LLM session** — the PDF directly, not via `doc2md`. One paper is one deck.
- Output: emits **directly to the quiz artifact seam** — a `deck_type: paper` / `mode: text-mc` deck (`items` = `<doi>|<qid>`, plus `stems`/`answers`/`choices`). Consumed by `memory-quiz-app`'s `text-mc` mode and its preview.
- Like `deck-vocab`, a **curate-then-assemble** pipeline: the deck stays `source: manual` (protected from the full-export clear + the orchestrator's sync), the cards are committed as data, and `build` assembles deterministically offline. Authoring rules live in `configs/papers/policy.md` — one shared policy, not one per paper.

**There is no oracle, and that is the design problem.** Every other pipeline can re-derive its content to check it: Wikidata can be re-queried, sympy proves a corruption non-equivalent, `check_against_deck` refuses to explain a deck today's fetch no longer reproduces. Nothing can re-derive a question. So the paper itself is the authority: every card carries the **verbatim sentence** supporting it, and `build` fails on any quote not found in the extracted source text. Both sides are normalised (NFKC, typographic quotes/dashes, whitespace) so a quote survives a PDF line break — nothing that could change *which* sentence matches.

**Identity is authored, not derived.** `<doi>|<qid>`, never the stem — a stem is reworded freely and keying on it would strand history the first time it was, the monarch-digits trap. `qid` is assigned once, is append-only, and leaves a hole when a card is dropped; an LLM re-run that renumbers from `q01` would restrand the deck, so reconciliation against the committed file happens *before* authoring.

**Density is measured, not capped.** The rule is one card per distinct finding — a long paper earns a long deck and a thin one a short deck, and truncating to a round number loses real findings. The extraction pass's `claims.jsonl` is committed as the denominator: `build` reports which findings carry no card and warns below 75% coverage, so *an incomplete extraction* — the actual failure mode, since it produces a small deck that looks fully covered — is visible. No per-card budget: since 2026-09-20 paper decks carry no `group_new_per_day` entry, so a long deck is a longer sitting. Intake is paced per **paper** instead — `study.json` `paper_intake`: 3 papers per 7 days, collection `Papers`. A separate check warns when more than about a third of a deck comes from outside Results.

**Quality checks that fail closed**: duplicate `qid`, answer not among the choices, wrong option count, duplicate or banned option (`none of the above` and friends), curated/audit disagreement. **Warnings** cover what only a human can adjudicate: answers running longer than their distractors (the artwork answer-shape lesson in prose), every answer sitting at one index in the curated file, a previously shipped `qid` that has disappeared.

**Committed data**: `configs/papers/<slug>.{yaml,claims.jsonl,curated.jsonl,audit.jsonl,source.sha256}`. The extracted `source.txt` is **gitignored** — third-party full text — so a fresh clone cannot rebuild a paper deck until it is re-extracted; the committed digest records which extraction the quotes were verified against.

**Extraction is part of the contract, not a preliminary.** Since every card is verified against `source.txt` character-for-character, a bad extraction fails cards that are themselves correct. Plain `pdftotext` is enough for a published two-column article, but an **in-press proof** carries a line number in both margins and interleaves them with the prose — *"the use of at least two 44 sequencing reads per UMI"* — so no quote survives. `scripts/extract_proof_pdf.py` crops by x-coordinate one column at a time, **measuring the column edges per page** from `pdftotext -bbox` word boxes rather than assuming them: a proof's front page carries a correspondence sidebar the body pages do not, and fixed offsets splice it into the abstract. It also strips the soft hyphens the typesetter leaves at line breaks, which `deck-papers`' `normalise` does not fold and which break any quote spanning one.

**Six decks built** (2026-09-20): one arXiv neuroscience paper and five from the *Journal of Molecular Diagnostics*, 153 cards. Two were revised the same day against `build`'s structural warnings: `dascoli2026_tribe` had every answer at choice index 0 in the curated file — harmless at display time, since the artifact reshuffles per card, but it biases authoring — and `lee2026_batch_effects` ran 48% non-Results. The second is the instructive one: dropping cards to fix composition would have pushed claim coverage under 75% and traded one warning for a worse one, and deleting claims to fix *that* would falsify the denominator the coverage check exists to protect. What fixed it was finding that two cards labelled `methods` had quotes sitting inside the Results section — the label was simply wrong — plus dropping four cards that were weak on their own merits (two operational parameters, one generic single-centre limitation, one answer inferable from its stem). The quiz's daily plan treats them as a priority collection with that per-paper intake rate — see `memory-quiz-app/PRD.md`.

First deck: d'Ascoli et al. 2026 (TRIBE v2, arXiv:2605.04326) — 24 cards from 25 extracted findings, 17 Results / 5 Methods / 1 Discussion / 1 Abstract.

### 11. Company MCQs (`deck-companies`) — *built*
- Source: **a dated research snapshot of one company**, written by a research session. One company is one deck.
- Output: emits **directly to the quiz artifact seam** — a `deck_type: company` / `mode: text-mc` deck (`items` = `<namespace>|<qid>`, plus `stems`/`answers`/`choices`). Rides the quiz's existing `text-mc` loop, ramp and preview.
- Like `deck-papers` and `deck-vocab`, a **curate-then-assemble** pipeline: `source: manual`, cards committed as data, `build` assembles deterministically offline. Authoring rules in `configs/companies/policy.md`.

**The oracle decays, which is the whole design problem.** `deck-papers` verifies each card against a frozen paper; a company contradicts its own snapshot within months — during the first deck's research window Verve was acquired, Arena BioWorks closed and Inari cut a third of its staff. So the quote check proves only that a card matches what was researched, and every audit row carries a **`checked`** date; `--stale` reports cards past the config's `recheck_months`. Staleness is a warning, not a failure — a founding trio does not rot.

**Volatility is enforced, not advised.** A card asserting a cash balance, revenue figure, headcount or runway is false within two quarters and the reader has no way to notice, so `volatility: volatile` on a shipped card **fails the build**. Volatile facts are still extracted into `.facts.jsonl` — marked volatile, excluded from the coverage denominator — so the research is complete and a later pass can see they were considered and rejected. A funding *round* is durable; a *total raised* is volatile.

**Density is measured against durable facts**, exactly as papers measure against extracted findings: one card per distinct durable fact, warning below 75% coverage. Expect ~4 cards for a thin entry and 12–15 for a deeply researched one; that spread is correct.

**`group` is `Companies`, never `Papers`** — the latter is the quiz's `priority_collection` and its shared budget key, so reusing it would silently enrol the deck in the daily gate.

**One deck built** (2026-09-21): Foundation Medicine, 15 cards from 16 durable facts (one dropped as sector-level knowledge, two volatile facts extracted and refused). Distractors are drawn from other companies in the same dossier, so a wrong answer teaches a second entry.

**Memory scenes** (2026-10-21; all 108 companies / 1,106 cards + a story each, 2026-10-30): per company one anchor image (Alnylam → LAMB) in every scene; dates/counts carry Major System pegs. Rules `configs/companies/mnemonic_policy.md`; sidecar → quiz `data/mnemonics/`.

**Scene images** (2026-10-23): one generated picture per scene, so the scene is seen, not only read. Gemini API (`gemini-3.1-flash-image`, "Nano Banana 2") via `scripts/generate_scene_images.py`; key in macOS Keychain. Choices, each from a side-by-side pilot on Alnylam:
- **Full model over Lite** — Lite dropped the SUN peg (the date) and wrote words into 3 of 5 images; a missing peg is worse than no picture.
- **Realistic over storybook**; storybook kept as an option.
- **Prompt names the image a mnemonic aid** for the CAPITALISED objects and asks for something striking or strange — the objects became the subject, not props.
- **Anchor drawn once, sent as reference with every scene** — without it the lamb changed in every image (lamb, statue, adult sheep), which defeats one anchor per company. Tried as `--no-anchor`, rejected.
- **Hand-drawn SVG by Claude** tried for one scene: clear and text-free but flat clip-art, ~10k tokens/scene. Rejected.
- **Blender render by Claude** (Cycles, primitives only) tried for q01 (`alnylam_pharmaceuticals/blender/`): real light and shadow, objects clear, no text, no API cost; but clay-toy look (bubble wool, no face or hooves), ~150-line hand-built scene + look-and-fix round per scene. Too costly in tokens for 1,000 scenes. Not adopted. Needs unsandboxed run (sandbox blocks Metal GPU check). Untested next option: local open model (FLUX.1 via mflux; Kontext for anchor reference).
- `--batch submit` / `--batch wait`: half price, anchors drawn directly first; 257 scenes returned in ~8 min.

`manifest.json` per company records each prompt: only new or edited scenes are redrawn, and `deck-companies --build` ships only images drawn from the scene's current text. **Shipped: 270 images, 24 companies** (Alnylam + Mass General Brigham → Ginkgo Bioworks).
- ⚠ **Text still appears** in ~1 in 5 images despite the prompt (labels, signs); review by eye, no automatic check yet.
- ⚠ **Cost was underestimated**: third-party prices put the run at ~$6.50; Google's $10 monthly cap was reached the same day. Measure real per-image cost (Billing → Reports by SKU) on a few images before any larger run.

**ChatGPT scene images** (2026-10-29): free alternative to Gemini — user draws scenes in a ChatGPT subscription (Instant). `scripts/chatgpt_scene_prompts.py SLUG…` writes `<slug>/chatgpt-instant/realistic/prompts.md`: one setup message (anchor, style, rules) + scene table in story order, link sentences shown but not drawn, bracketed hints stripped. Downloads → `anchor.webp` + `<qid>.webp` by hand.
- **No background instruction in any prompt** (Gemini too): a detailed background may itself be a cue. Changes every Gemini prompt digest → plain rerun would redraw all; use `--only`.
- **Setup must hold no example lettering** — an example ("flag that reads SPTX") was painted into another company's scene. Test-guarded.
- ⚠ ChatGPT zips are pictures cut from one combined sheet: ~380 px, slivers of neighbours + white gutters → crop each; it may merge two scenes into one picture. Saving each image from the chat avoids this.
- ⚠ **Not shipped to quiz**: no `manifest.json`, so `current_images` skips them. Done: Kernal, Jnana, Remix, Asimov (q02 to redraw); sheets for 24 decks without images.

### 12. Source-file MCQs (`deck-code-mcq`) — *built*
- Source: **one source file of a work repo**, read by an LLM session. One file is one deck.
- Output: a `deck_type: code` / `mode: text-mc` deck (`items` = `<source_id>|<qid>`), riding the quiz's existing single-choice loop.
- Curate-then-assemble like `deck-papers`, whose validation core it imports rather than copies: the quote check, shape guards, `qid` identity and claim-coverage all come from `papers.py`.

**Why it exists.** It is the answer to `code-drill`'s own finding: spotting a corrupted line proves a file was *read*, not that it is *understood*, and reading unfamiliar code for comprehension is slow and open-ended with nothing to show for it afterwards. A card set makes comprehension finite and reviewable — every function's purpose and contract, dense expressions, what each constant governs, how the file integrates with its neighbours. The two are complements, not rivals: the drill keeps eyes on every line of the repo, a deck is bought deliberately for a file worth understanding.

**Every function in the file must carry a card, or `build` fails.** This is the check that makes a deck a reading of the *file* rather than of its interesting parts, and it is derived — `defined_symbols` parses the file's AST, `covered_symbols` maps each quote back to its enclosing function — never asserted by the author. Nested helpers count: the closure inside a parsing loop is exactly what goes unread, and it is usually the hardest card in the deck. A card that quotes the wrong line therefore reports the right function as uncovered, which is the intended pressure.

**A file has no home section.** A paper drifting out of Results is a smell, so `deck-papers` warns on the mix; a file's structure, functions, expressions, constants and integration points are all first-class, so that check is switched off (`primary_section=None`, parameterised in `papers.py` rather than forked) and function coverage takes its place.

**The data never enters this repo.** Cards quote work-repo source verbatim, so the config, the three JSONL files and the artifact live in a gitignored directory under the consuming repo (`code-drill/decks/`, refused by its pre-commit hook), and `data/decks/code_*.json` is gitignored in the quiz. This repo holds the machinery and `configs/code/policy.md`; `--out` has no default that would ship a deck by accident. Authoring an LLM-read deck over a governed repo is a decision for the repo's owner, not a default — the `code-mcq` skill asks before reading.

**MCQs follow AI notes; changes force a full review** (2026-10-10). A file gets a deck iff code-drill's AI notes cover it as it is now: `build` refuses when the file's `code_ai_explanation_*.json` is absent from the deck dir or covers another version. Config `reviewed_sha256` = file version every card was checked against; a changed file refuses until every card is reviewed (obsolete → `drop`, new behaviour → new `qid`s) and it is reset. Artifact records it as `notes_sha256`; `code-drill next` lists files owing a deck or a review. Stems and choices are ASD-STE100: `build` refuses a sentence > 25 words (code span = 1 word). **Changes prune automatically** (2026-10-12): `--prune` drops cards whose quotes the changed file no longer holds and marks the survivors reviewed — run by code-drill's `sync`; new functions still need cards before `--build` passes.

**One deck built** (2026-09-22): `snp-backbone-benchmark`'s `launch/exp3_common.py` — 39 cards from 41 extracted claims over 170 non-blank lines, 9/9 functions covered, 7 of them `gotcha` cards. Measured rate ~0.23 cards per line; the repo's 61 in-scope Python files would be ~1,650 cards, which is why the recommendation is the dozen highest-fan-in modules (~325 cards), not the repo. R is out of reach until the coverage check has an R parser.

### 13. County acronyms (`deck-counties`) — *built* (Michigan, 2026-10-11)
- Source: user's sheet acronym rows (one per atlas group) + global-geo-atlas `results/sheet_rows/<state>.facts.json` (seat, largest city, towns, group per county) + atlas county geometry.
- `curate STATE --rows TSV` → `configs/counties/<state>.yaml` (`align` DP splits each acronym into `[piece, name]` pairs); **hand-fix, commit** — re-curate overwrites. `build STATE` → 3 decks into the quiz repo:
  - `<stem>_pieces` (`county-acronym`, text-mc): one card per piece, `marks` = highlighted slice; distractors = names the piece fits → same initial → pool.
  - `<stem>_seats` (`county-seat`, text-mc): seat card per county + largest-city card when different.
  - `<stem>_map` (`county-map`, type-in): Pillow-rendered county map per group (red highlight, lossless WebP) → lowercase acronym.
- Items positional (`counties:MI|piece|g01|p03`) — inserting a piece shifts later identities.
- Michigan: 25 groups → 166 piece / 111 seat (83 seat + 28 largest) / 25 map cards. Hand fixes: Houghton Lake split, Oakland largest = Troy (atlas CSV has South Lyon 128,071), Mount Clemens / Greilickville spellings.
- Open: remaining 49 states (atlas draft rows exist for all).

### 14. Grammar tables (`deck-grammar`) — *built* (20 Latin decks, 1,892 cards, 2026-10-22)
- **Verbs** — one deck per conjugation class: Wheelock's models portō, moneō, dūcō, capiō, audiō; each irregular its own class — sum, possum, volō, eō, ferō, fīō, edō. Pages: indicative act/pass, subjunctive act/pass, imperative & non-finite (participles in dictionary form); active-only verbs 3 pages. 1,352 cards.
- **Nouns** — one deck per declension (Wheelock's models: porta, agricola; amīcus, fīlius, dōnum, puer, ager, vir; rēx, corpus, cīvis, urbs, mare, vīs; frūctus, cornū, domus; diēs, rēs). 229 cards.
- **Pronouns** — personal & reflexive (ego, tū, suī); demonstratives (hic, ille, iste, ipse, is, īdem); relative, interrogative & indefinite (quī, quis, aliquis, quīdam, quisque). 311 cards. Possessives wait with the adjectives.
- Source: Wiktionary via kaikki.org → `configs/grammar/latin_*.yaml`; second source = rules (conjugation and declension endings, Wheelock tables, compound pronouns derived from their bases). Build refuses any disagreement or absence. Each deviation from Wiktionary's first variant is a registry entry with a reason (choose / respell / exclude / anceps); Wiktionary's other variants stay valid and are never offered as wrong forms.
- Item = tag identity `<lang>:<word>|<tag>`, never the form. portō kept its config path and its first 36 items.
- See `CLAUDE.md` *Grammar tables*.

## Coverage analysis — external reference comparison (2026-08-03)

Decks are built from Wikidata fame proxies; whether that matches a **curated canon** is a separate
question. First check: the index of *Art: The Definitive Visual Guide* (DK) vs `artworks_famous`.

- **Input**: 11 photos of the printed index (pages 599–609, full A–Z). Rotated upright with Pillow,
  OCR'd `tesseract --psm 3` — `--psm 6` assumes one uniform block and produces garbage on a
  6-column index. Photos are gitignored (~58 MB); the OCR text is committed
  (`data/art_definitive_index/ocr/`), so the analysis is reproducible without them.
- **`scripts/compare_art_index.py`** — both directions, on works and artists.
- **`scripts/list_missing_works.py`** — every work of any medium absent from the deck: **1,083**
  (954 artist-attributed, 48 culture-attributed, 81 anonymous/heuristic).

**Finding**: 665 deck creators (≈17% of the deck's works) never appear in the book — concentrated in
19th-century Russian and Polish national schools (Matejko, Levitan, Aivazovsky, Kuindzhi) that
Wikidata sitelink fame surfaces and a Western-canon print survey omits. Conversely most book works
the deck lacks are **non-painting** (sculpture, manuscripts, artifacts), outside the current
`instance of painting` query.

Matching is normalised + fuzzy, never literal — the two sides disagree structurally, and each
mismatch below was a real defect found by spot-checking against the raw OCR:

- **The book cites works by surname alone** (`(van Gogh)`) while the deck stores full names, so
  artists match on surname candidates, not full strings.
- **Particles and epithets diverge**: `Antonio da Correggio` vs `(Correggio)`,
  `Hans Holbein the Younger` reducing to `younger`. Each name yields several candidate keys.
- **Compound surnames** need token fallback: `Joaquín Sorolla` vs `(Sorolla y Bastida)`.
- **Two index entries routinely OCR onto one line**, so all title/artist pairs per line are
  extracted; taking only the last fuses two works into one.

**Caveat**: the anonymous tier (81) is ~half noise and needs a human pass — nothing structurally
separates an unattributed title from a topic, and Chinese artists are indexed without a comma
(`Li Shan 592`). The attributed tiers are reliable. OCR damage still costs a handful of entries.

## Output
Excel `.xlsx` workbook, two sheets:
- Detail sheet — one row per entry with initials and chunk acronym highlighted on first row of each chunk
- Summary sheet — one row per chunk with acronym only

## Retention method — why acronym cueing

Design rationale for what this repo emits; the quiz that consumes it (display, scoring, FSRS, web/desktop/PWA surfaces) lives in [`memory-quiz-app`](../memory-quiz-app/PRD.md).

**Goal**: given an acronym line as cue, test recall of the full line, fast enough to scale to large texts (Bible ~31k verses, Homer ~15k lines).

| Method | Speed | Tests recall? | Notes |
|---|---|---|---|
| Full line typing | Slow | Yes, strongly | 50–80 keystrokes/line; impractical at scale |
| Self-rating (think → reveal → rate) | 1 keypress | Yes, if honest | Anki's default; relies on user not fooling themselves |
| First-word typing | Fast | Yes, adequately | First word strongly predicts line recall |
| Multiple choice | 1 keypress | Weakly (recognition) | Poor retention signal |
| **Blindman's bluff** (selected) | 1 keypress | Yes, objectively | Below |

**Blindman's bluff**: first letter of each word shown, rest underscored, one random non-pinned letter revealed — correct 80–90% of the time, wrong 10–20%; words of 5+ alpha chars also pin every 4th position as an anchor. Task: name the word carrying the wrong letter, if any. Single keypress, no self-rating honesty problem, forces letter-level recall, scales to any text size. Its weakness is that 80–90% of trials are clean, so "always answer none" scores well without recall — hence asymmetric health costs (miss 3, false alarm 1) and distractors that are plausible rather than visually obvious.

**Distractor letter sources**, by relevance: visual confusion matrices (Bouma 1971, Townsend 1971 — b/d, m/n, rn/m) > phonetic similarity (subvocalised poetry) > OCR error corpora (machine, not human, vision) > keyboard adjacency (distractors are generated, not typed).

**Prior work**: no known tool combines acronym cueing with adversarial partial-letter reveal. Nearest: vanishing cues (Glisky et al., 1986 — structurally the reverse); error-detection reading tasks (comprehension, not recall); signal detection theory (the 80/20 setup is formally yes/no detection — d′/criterion would give rigorous per-card scoring); retrieval-practice/testing-effect literature (supports forced recall).


## Non-goals
- Quiz UI, scoring, SRS (all in `memory-quiz-app`)
- Theme *segmentation* — MTD's 2,067 are taken as given; finding themes in a full score is a research problem, not this repo's
- Automatic publishing / sharing
- Non-English **sources**, except German Wikisource poetry (Rilke, *Duineser Elegien*). Chinese vocab is glossed from CC-CEDICT, not scraped
- Figure-bearing paper cards — `deck-papers` is text-only; `doc2md`'s paper pipeline already extracts figures with captions if that changes

## Success criteria
- All 31+ award configs produce correct `.xlsx` outputs
- Acronyms match independently verified initials
- CLI runs end-to-end without errors on clean install
- Shakespeare pipeline downloads and caches all passages from configured plays
- `deck-export` artifacts load in the quiz with item strings byte-identical to live generation (FSRS keys preserved)
- `deck-companies` refuses a volatile card outright and reports every card past its `recheck_months` — the deck never asserts a number that will go false unnoticed
