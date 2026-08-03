# PRD — memory-deck-generator

## Problem
Memorizing ordered lists (award laureates, poem lines, historical rulers) is hard. Acronym mnemonics help, but generating them from authoritative sources is tedious.

## Goal
Generate Excel acronym-tables and per-deck JSON artifacts from Wikipedia/Wikidata sources automatically, grouped by configurable time windows. The spaced-repetition **quiz app now lives in a separate repo** (`memory-quiz-app`, see its PRD); this repo is generator-only and emits `data/decks/*.json` consumed by the quiz via the orchestrator's Dagster `decks` asset.

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

**Add is idempotent.** A correction is a bet that Wikidata stays wrong, and Wikidata improves; appending unconditionally would double a digit the day upstream fixed the statement. `stale_corrections` reports corrections that no longer change anything (an `add` Wikidata now supplies, a `drop` it no longer emits) — neither is an error, which is exactly why they need surfacing rather than rotting silently.

There is **no mechanism to correct a ruler's accession/end year directly**; corrections patch the *transition-year output*, not the underlying data. So a wrong accession year is expressed as a `drop` of the bad year plus an `add` of the right one (and sometimes only a drop — Tahmasp II's true 1722 accession is already a transition year via his predecessor's end year).

##### Date precision (documentation only)

`Monarch.accession_precision` carries Wikidata's `timePrecision` for P580 (9 = year, 8 = decade, 7 = century). Below year precision, the source does not actually claim that year — Assyria's Tudiya is stored as `-2450` at decade precision, meaning "the 2450s BC"; Denmark's Sigfred (770) and France's Mallobaudes (378) / Marcomer (380) are decade-precision within shipped decks. **Digit extraction deliberately ignores this**, so decks are byte-identical to before the field existed; `deck-monarchs` merely warns. This matters for any future expansion into ancient series: pharaoh has 527 recorded holders but only 88 with any start date, and Mesopotamian absolute chronology is convention-dependent (High/Middle/Low differ by decades), so precision is the difference between a fact and an artifact.

#### Monarch deck set (2026-07)
**20 decks.** *European (13):* Britain, English Commonwealth, Scotland, Denmark, Norway, Sweden, Holy Roman Empire, Byzantium, Hungary, Portugal, Bohemia, France, Japan. *Non-European (7, 2026-07):* Umayyad, Abbasid, Fatimid caliphs; Ottoman sultans; Safavid shahs; Ming, Qing emperors. Selection was data-driven from a full Wikidata survey:
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
- Automatic publishing / sharing
- Non-English **sources** (Chinese vocab is glossed from CC-CEDICT, not scraped)

## Success criteria
- All 31+ award configs produce correct `.xlsx` outputs
- Acronyms match independently verified initials
- CLI runs end-to-end without errors on clean install
- Shakespeare pipeline downloads and caches all passages from configured plays
- `deck-export` artifacts load in the quiz with item strings byte-identical to live generation (FSRS keys preserved)
