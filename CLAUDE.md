# CLAUDE.md — memory-deck-generator

Generates Excel acronym-tables from Wikipedia/Wikidata sources (award laureates, poetry lines, monarch reigns, Shakespeare passages), and exports per-deck JSON artifacts (`deck-export` → `data/decks/`) consumed by the quiz app.

**The spaced-repetition quiz (FSRS-6 + PWA) lives in the separate `memory-quiz-app` repo** — split out via the `data/decks/*.json` artifact seam. This repo is generator-only; it never imports the quiz.

See [PRD.md](PRD.md) for pipeline configs, output format, and success criteria.

## Pipelines

| CLI | Source | Output |
|---|---|---|
| `deck-acronyms` | Wikidata SPARQL | Year-chunked laureate initials |
| `deck-poetry` | Project Gutenberg **or Wikisource** | Per-line acronyms |
| `deck-monarchs` | Wikidata SPARQL | Per-century transition-digit strings |
| `deck-monarch-tables` | Wikidata SPARQL | Reign reference table per monarch deck — one row per **digit** (xlsx + JSON sidecar for the quiz preview) |
| `deck-artworks` | Wikidata SPARQL + Wikimedia Commons | Artwork title/creator/image → quiz `image-mc` deck (JSON + WebP assets) |
| `deck-shakespeare` | Folger Digital Texts API | YAML catalogue of monologue passages |
| `deck-equations` | Hand-curated YAML | Equation + verified corruption pool → quiz `error-spot` deck (MathML baked) |
| `deck-vocab` | wordfreq × CC-CEDICT (+ audited LLM adjudication of hard words) | Curated Chinese `matching` vocab deck (`source: manual`; committed out-of-band, not a full-export deck) |
| `deck-themes` | MTD (Musical Theme Dataset) MusicXML | Musical theme + verified note corruptions → quiz `notation-spot` deck (MEI assets, engraved by Verovio) |
| `deck-papers` | A scientific paper, read by an LLM session | Results MCQs → quiz `text-mc` deck (`source: manual`; authored out-of-band per `configs/papers/policy.md`) |
| `deck-companies` | A dated research snapshot of one company | Company MCQs → quiz `text-mc` deck (`source: manual`; authored per `configs/companies/policy.md`) |
| `deck-grammar` | Wiktionary (kaikki.org) import, re-derived by rule | Latin paradigms → 20 quiz `grammar-table` decks: 12 verbs (one per conjugation class, finite + non-finite), 5 noun declensions, 3 pronoun decks (`source: manual`; one form = one card) |
| `deck-code-mcq` | One source file, read by an LLM session | Source-file MCQs → quiz `text-mc` deck (`source: manual`; **data lives outside this repo**, see below) |
| `deck-counties` | User's county-group acronyms + atlas facts/geometry | 3 decks per state: acronym pieces + seats (`text-mc`), map → typed acronym (`type-in`, WebP maps) (`source: manual`) |
| `deck-history-check` | Topic cells of dates, LLM-authored per `configs/history/policy.md` (`history-cell` skill) | Checks Major System peg, scene, event text; no artifact yet |

## Modules

| Module | Role |
|---|---|
| `wikidata.py` | SPARQL client: `fetch_entries(item_id, humans_only)` + `count_laureates(item_id, humans_only)`. Skips bare Q-number labels. Gap warning computed before manual entry merging. |
| `chunker.py` | `make_chunks(entries, chunk_years, chunk_start_year, first_letter_only_from)` → `list[Chunk]`. Empty year windows omitted. |
| `acronym.py` | `name_initials`: skips particles, expands hyphenated tokens. `line_initials`: all words including particles. |
| `xlsx_writer.py` | `write_xlsx()` (awards), `write_poetry_xlsx()` (poetry), `write_monarchs_xlsx()` (monarchs — **one row per digit**, not per ruler; the old per-ruler sheet could not reproduce the string). |
| `reign_tables.py` | The quiz-facing sidecar: `build_reign_table` (payload + `items_sha256`), `check_against_deck` (refuses to explain a deck today's Wikidata no longer reproduces), `write_reign_table`. |
| `reign_tables_cli.py` | `deck-monarch-tables` — all 37 configs; writes `results/<slug>.xlsx` + `../memory-quiz-app/data/reigns/<deck>.json`. `--only`, `--no-xlsx`, `--force`. |
| `gutenberg.py` | HTTP fetch + cache in `cache/gutenberg/`. |
| `wikisource.py` | Poems Gutenberg lacks. `fetch_wikitext` (cached in `cache/wikisource/<lang>/`) + `poem_text` (the `<poem>` block, transcription markup stripped) + `fetch_text`. **Wikimedia 403s the default `requests` UA** — same policy as the image CDN, needs a real identifying URL (`wiki_api.py`'s `example.com` UA is the kind that fails). Strips `{{Seite\|N}}`, `{{Zeile\|N}}` (glued to the FRONT of every fifth line — dropping the line loses the verse), `{{SperrSchrift\|x}}` (unwrap, keep the word), and **`{{idt}}`, which takes no argument** — a drop pattern requiring `\|` silently leaves it in the text. |
| `folger.py` | Folger Digital Texts API; caches HTML under `cache/folger/`. |
| `poetry_parser.py` | `extract_poem(text, start_marker, end_marker)` → `list[str \| None]`. `None` = blank line. |
| `monarchs.py` | `fetch_monarchs` (includes `wp_title` sitelink + `accession_precision`), `transition_events` → `TransitionEvent(year, kind, monarch, note)` with kind `accession`/`reign_end`/`correction`, `make_monarch_chunks` (joins the digit string FROM those events, so `chunk.events[i]` explains digit `i` by construction). **One Monarch per REIGN, not per person** (`_merge_reigns`): statements that touch or overlap are one reign (a title change — George III of Great Britain 1801 → of the UK), a GAP between them is a deposition and both its transitions are real (Abdallah of Morocco ruled six times). The old merge-everything rule erased every restoration. `exclude_people:` drops named holders the position admits but the deck should not contain — positions and houses filter by category, this by individual (Wikidata's `Byzantine emperor` includes 13 empress *consorts*); a stale entry warns rather than raising. `parse_extra_cards`/`ExtraCard` build cards that are NOT time windows, for a realm that split. `parse_corrections`/`correction_years` read the config's sourced `corrections:` block; `stale_corrections` reports ones upstream has made redundant; `report_imprecise_dates` flags sub-year-precision dates (documentation only — digits unaffected). |
| `artworks.py` | `fetch_artworks_cached(config, refresh=…)` wraps `fetch_artworks` with a persisted metadata cache (`cache/artworks_meta.json`, keyed by query-affecting config + `_META_ENGINE_VERSION`; **bump it when the fetch/parse changes**). The banded sweep was ~10 of an export's ~12 min and is invariant to corrections/distractors. Key is built by *exclusion* (`_NON_FETCH_KEYS`) so a new config knob busts the cache instead of being ignored; hits are logged; `--refresh-metadata` bypasses. `fetch_artworks(config)` — Wikidata paintings by fame (`min_sitelinks`) / curated QIDs / collection (P195); dedup by QID; `build_query`. `Artwork(qid, title, creator, image_url, sitelinks, inception, creator_candidates)`. Creator corrections: `parse_artwork_corrections`/`apply_corrections`/`stale_corrections` (`set`/`exclude`, sourced); `_principal_creator` picks deterministically (lowest QID) when Wikidata credits several — **was SPARQL row order**, which WDQS doesn't guarantee, so a re-export could silently flip a card's answer under a stable `item_key`. |
| `equations.py` | LaTeX → MathML with per-token `id`s. `Equation`, `load_equations`, `to_mathml`, `token_texts`, `eligible_indices` (excludes delimiters/accents/differentials), `annotate`. |
| `corruptions.py` | Generated + verified single-token corruptions. `build_pool` → pool + `bad_pairs`; `differs` proves non-equivalence via **numeric sampling on the residue `a-b`** (never `simplify`, which hangs on infinite integrals; finite ops are `.doit()`'d, infinite/heavy residues rejected — see `equations-pipeline.md` "equivalence predicate"; fails closed; guards sympy's silent mis-parse of `\mathbf`/`\hat`/`\operatorname`); `_variable_tokens` swaps ASCII + whitelisted Greek variables (excludes `\pi`/operators); `classify` splits equations into 2-error / 1-error / drop by supportable pair count; `pool_warnings` flags thin pools. |
| `normalise.py` | Verification-only LaTeX rewrites so sympy can parse real notation (`\operatorname{Var}(X)`, `E[X^2]`, `P(A\mid B)`, bold vectors). `opaque_spans` marks argument lists where corruption is barred (`Var(X+Y)`→`Var(Y+X)` is an equivalence). Never displayed. |
| `equations_cli.py` | `deck-equations` — preview pool health + 2/1 classification per config; `--sample` prints a text two-error display; `--export` writes the artifact(s). |
| `vocab.py` | Chinese vocab pipeline: CC-CEDICT parse/`fetch_cedict` (CC-BY-SA), numbered→diacritic `pinyin_marks`, `load_seed` (freeze existing 267), `rank_candidates` + clean/needs-LLM router, `load_curated`, `band_collisions` (band-scoped uniqueness), `assemble_artifact`. |
| `papers.py` | Paper MCQ core. `Card`/`AuditRow`/`Claim`; `normalise` (folds typography + whitespace so a quote survives a PDF line break, never changing WHICH sentence matches); `item_string` = `<doi>|<qid>`, never the stem; `validate` — nine checks, failures vs warnings; `uncovered_claims`/`composition` (density measured against the extracted findings, not a fixed range); `shuffled_choices` (deterministic by qid); `assemble_artifact`. **No oracle here** — nothing can re-derive a question, so the verbatim quote IS the verification. |
| `papers_cli.py` | `deck-papers` — **check** (default, no writes) / `--build`. Fails closed on a quote absent from the source text, a duplicate `qid`, an answer not among the choices, a banned option, or curated/audit disagreement; warns on shape tells, a disappeared shipped `qid`, uncovered findings, and a Methods-heavy mix. Prints the section/type histogram. `--no-verify-quotes` for a clone with no local source text. Writes `<slug>.source.sha256` beside the data. |
| `companies.py` | Company MCQ core. Imports the shared contract from `papers.py` (`Card`, `normalise`, `source_digest`, `shuffled_choices`, `BANNED_OPTIONS`, shape ratios) rather than copying it — same reasoning as `corrections.py`. Adds what makes companies different: `Fact`/`AuditRow` carry **`volatility`** (a `volatile` card is a build FAILURE — cash, revenue, headcount and runway are wrong within two quarters and the reader cannot tell) and **`checked`** (`stale_cards` reports cards past the config's `recheck_months`; a malformed date counts as stale). `uncovered_facts` counts **durable rows only** as the coverage denominator. `item_string` is `<namespace>|<qid>` — there is no DOI. |
| `code_mcq.py` | Source-file MCQ core. Imports the whole shared contract from `papers.py` (`Card`, `validate`, `normalise`, shape ratios, claims coverage) rather than copying it. Adds what makes code different: `source_id` = `<repo>:<path>` as the item namespace (a file has no DOI, a path alone collides across repos), the code section/type vocabularies, and **`defined_symbols`/`covered_symbols` — every function and method in the file must carry a card or `build` FAILS**, derived from the file's AST and from where each quote lands, never from a field the author fills in. |
| `code_mcq_cli.py` | `deck-code-mcq` — **check** (default) / `--build`. `--out` has no shipping default: a code deck's artifact belongs beside its gitignored config, not in `memory-quiz-app/data/decks`. |
| `counties.py` | County decks core: `align` (sheet row → `(piece, name)`; prefers known place names, then fewer pieces), `piece_fits`, `validate`, `piece_cards`/`seat_cards`/`map_cards`, `render_map` (Pillow, no GIS deps), `curate`, `assemble`. |
| `counties_cli.py` | `deck-counties curate STATE --rows TSV` (draft YAML) / `build STATE` (→ `memory-quiz-app/data/decks` + `assets/<stem>_map/`). |
| `history_dates.py` | Major System core: `major_digits` (CMUdict phones → digits, x cluster = 7), `peg_number` (last two digits; first two for `years_ago` and approximate round years), `entry_problems`/`file_problems`, `peg_load`. |
| `history_cli.py` | `deck-history-check FILES` — exit 1 on any rule break; `--peg-codes` checks `major_pegs.yaml` against CMUdict (`uv run --with cmudict`). |
| `scene_images.py` | Gemini image REST client for scene pictures: `scene_prompt` (mnemonic-aid wording + `STYLES`), `plan`/`record` (manifest, skip unchanged), `current_images` (image matches current scene text), `generate` (backoff on 429/5xx), `api_key` (Keychain). |
| `company_snapshot.py` | `python -m deck_generator.company_snapshot NAME OUT --revised DATE` — renders one `career_planning/boston_companies.yaml` entry to `<slug>.source.txt` (the quote oracle). Byte-identical to the earlier hand-rendered snapshots (test pins Tessera). Update the dossier, then re-render; never hand-edit a snapshot. |
| `companies_cli.py` | `deck-companies` — **check** (default, no writes) / `--build` / `--stale` (recheck sweep only). No `--no-verify-quotes`: the source snapshot is OUR prose and is committed, so the quote check can always run. |
| `grammar.py` | Grammar-table core. `derive` (every form of a verb by rule; irregular present systems from `_IRREGULAR`; `semi_deponent`, `exclude`), `PAGES`/`GRID_TABLES`/`page_tables`/`verb_pages` (a verb's pages; empty rows/cols dropped), `parse_pages`, `wrong_pool` (see *Grammar tables*), `validate` (rules vs config, pages and absence included), `item_string` = `<lang>:<lemma_key>|<tag>`, `assemble_artifact` (flat `tables` with `rows`/`cols`/`grid` + `pages`). |
| `grammar_nominal.py` | Noun + pronoun decks: `derive_noun` (declension rules), `derive_pronoun` (Wheelock tables + derived compounds), `lexeme_tables`, `stems`, `wrong_pool` (same word only), `validate`, `assemble_artifact` (via `grammar.envelope`). |
| `grammar_kaikki.py` | Wiktionary import: `tag_of` (kaikki tag list → our tag), `parse_variants`/`parse_forms` (first variant wins, or `prefer.prefix`), `verb_forms` (composes periphrastic perfects from *sum*, nominative infinitives, `active_only`/`exclude`), `verb_config`, `config_stem`; nominal: `nominal_tags` (one row → several genders), `resolve_anceps`, `lexeme_variants` (choose/respell/partitive/exclude), `nominal_config`. Never calls the rules. |
| `grammar_cli.py` | `deck-grammar` — `--import` (regenerate every verb config) / **check** (default) / `--build` → `grammar_<stem>.json`; `--config` takes many. Offline. |
| `vocab_cli.py` | `deck-vocab` — **preview** (clean/needs-LLM split) / **curate** (prepare needs-LLM chunk files for the audited adjudication pass) / **build** (assemble committed curated rows → `source: manual` artifact, deterministic; verifies no-dup-hanzi + band uniqueness). Committed data: `configs/vocab/chinese_common.{yaml,curated.jsonl,audit.jsonl,policy.md}`. See [docs/design/vocab-pipeline.md](docs/design/vocab-pipeline.md). |
| `distractors.py` | `build_choices(artworks, attr, n, same_creator_bias)` — deterministic (QID-seeded) MC options; same-creator/era bias; no duplicate values. Creator cards match **answer shape** first (joint `A & B` answers draw joint distractors) — a multi-name answer among single-name options is pickable without knowing the artwork. |
| `corrections.py` | Shared contract for sourced manual overrides (monarchs + artworks): mandatory `reason`/`source`, `validate` raises rather than skipping a malformed entry, and every pipeline owns a staleness predicate. The correction *types* differ (a monarch patches a scalar year in a multiset, an artwork a field on a keyed record), so only the contract is shared. |
| `artwork_images.py` | `fetch_raw` (Commons download, cached under `cache/artworks/`, UA-compliant — the CDN 403s placeholder UAs) + `to_webp` (Pillow downsize). |
| `themes.py` | MTD ingest: `musicxml_to_mei` (Verovio conversion + `canonical_ids`, which renumbers every note to `n1..nN` — Verovio mints RANDOM ids per load, so pool entries would otherwise address a different note on every render), `parse_notes` → `Note` (carries `accid` **and** `accid_ges`; `sounding_accid` prefers the printed sign), `apply_patch` (empty value REMOVES an attribute — how an accidental is taken away), `render_svg`, `load_theme` (lru-cached). Reads `data_SCORE_XML` + `data_META` only. |
| `theme_corruptions.py` | Generated + verified note corruptions. `build_theme_pool` → pool of `{id, type, positions, patch}`; `verify` fails closed on a no-op, a **respelling** (compares `sounding_accid`, so printing a courtesy sharp on an already-sharp note is refused), a bar that no longer adds up, or a patch whose real effect differs from its claimed positions. `pool_target` scales the pool to the note count; `_sample_by_type` trims round-robin across types so rhythm corruptions aren't sampled away. |
| `themes_cli.py` | `deck-themes` — `--survey` (period / work type / composer), preview (pool health), `--render DIR` (clean + corrupted SVGs to eyeball), `--export`. |
| `country_registry.py` | `fetch_country_registry` via Wikidata P1906 → `CountryEntry` list; `save_registry`/`load_registry` YAML I/O. |
| `coverage.py` | `check_coverage`: compares Wikidata monarch sitelinks against Wikipedia list article links; returns `CoverageReport`. |
| `derive_positions.py` | `load_ruler_titles` filters xlsx/csv by occupation keywords; `fetch_positions_for_titles` batch-queries Wikidata P39 to rank position Q-IDs by holder count. |
| `cli.py` | `deck-acronyms` entry point. Supports `manual_entries` and `exclude_entries` config keys. |
| `poetry_cli.py` | `deck-poetry` entry point. Single-poem and multi-poem collection configs. |
| `monarchs_cli.py` | `deck-monarchs` entry point. Reads `wikipedia_list` field from config for coverage checks. |
| `registry_cli.py` | `deck-registry-generate` — queries Wikidata P1906, writes `configs/monarchs/country_registry.yaml`. |
| `coverage_cli.py` | `deck-coverage-check` — takes `--config` or `--country`/`--registry`; reports rulers in Wikipedia list missing from Wikidata fetch. |
| `derive_positions_cli.py` | `deck-derive-positions` — takes `--input` xlsx/csv + optional `--nationality`; prints ranked position Q-IDs for adding to YAML configs. |
| `shakespeare_cli.py` | `deck-shakespeare` entry point. |
| `artworks_cli.py` | `deck-artworks` entry point — previews a config (fetch + print, no image download) by default; `--export` writes the deck artifact + WebP assets via the export seam. |
| `list_parser.py` | Wikipedia wikitext → `[(year, name)]`. Unused by CLI; kept for potential future use. |
| `wiki_api.py` | MediaWiki API client. `fetch_article_links(title)` used by coverage checker. |
| `deck_export.py` | `deck-export` entry point — the generator→quiz boundary. **The `if __name__ == "__main__"` guard must stay the LAST statement**: under `python -m deck_generator.deck_export` (how the orchestrator's Dagster asset invokes it) the file runs top-to-bottom as `__main__`, so a mid-file guard calls `main()` before later definitions exist — it sat above `_EQ_POOL_CACHE` and raised `NameError`, which the console script hid because an entry point imports the module fully first. Runs the generation pipeline and writes one self-contained JSON artifact per deck to `data/decks/` (`items`, `labels`, `config_hash`, …). Item strings are byte-identical to live generation, preserving deck ids and FSRS item keys (`sha256(item)[:16]`). Consumed by the `memory-quiz-app` repo. **A bare run CLEARS the output dir and rebuilds everything; use `--only <glob>` to refresh a subset** (leaves others untouched/unfetched and preserves their `order`/`config_path`). Artwork decks additionally emit WebP image files under `data/decks/assets/<deck>/` (cleared/rebuilt in lockstep) and a `sitelinks` array (fame count per card; the quiz's preview creator browser sorts on it). **`--cache-only`** assembles artwork decks from already-downloaded images only — use it when re-exporting for an unrelated change so the work set can't grow (config `cache_only` without the config edit). `source: manual` artifacts (e.g. the quiz's Chinese vocab deck — curated out-of-band by `deck-vocab`, not by `deck-export`) are **preserved through the clear** (`_is_manual`) — a full export has no config to rebuild them. **Every run warns about orphans** (`find_orphan_artifacts`): artifacts in `data/decks/` that no config would produce. Deleting a config removes the recipe but not the built artifact — the dir is gitignored build output and `--only` skips the clear — so the orphan survives every targeted re-export and the orchestrator's `decks` sync copies it onward. That is how the Shakespeare sonnet decks, deleted 2026-07-15, reappeared in the quiz on 2026-07-25. |

## Paper MCQ decks (`deck-papers`)

One paper = one deck, `source: manual`, the same curate-then-assemble contract as
`deck-vocab`. An LLM session reads the paper (**not** via doc2md — the Read tool takes PDFs
directly) and writes three committed files; `build` verifies and assembles.
Authoring rules: [configs/papers/policy.md](configs/papers/policy.md).

```
configs/papers/<slug>.yaml            config: doi, group, citation, file names
               <slug>.claims.jsonl    extraction pass — one row per finding, with its quote
               <slug>.curated.jsonl   the cards `build` consumes
               <slug>.audit.jsonl     per-card quote/section/type/reason/decision
               <slug>.source.txt      extracted paper text — GITIGNORED (third-party full text)
               <slug>.source.sha256   which extraction the quotes were verified against
```

What will bite you:

- **`qid` is an identity, never a number.** The item is `<doi>|<qid>`; the stem is reworded
  freely and must never key anything. Numbering is append-only — a deleted card leaves a hole,
  and an LLM re-run that renumbers from `q01` strands every card's history. Reconcile against
  the committed file BEFORE authoring.
- **The quote is the oracle.** `build` fails on any quote not found verbatim in the source
  text. Both sides are normalised (NFKC, curly quotes, dashes, whitespace) so a quote survives
  a PDF line break — nothing that changes which sentence matches.
- **A fresh clone cannot build**: `source.txt` is gitignored. Re-extract it
  (`pdftotext -layout`) or pass `--no-verify-quotes`, which turns off the only real check.
- **Density is not a range.** One card per distinct finding; `build` compares the deck against
  `claims.jsonl` and names findings with no card. An incomplete *extraction* produces a small
  deck that looks fully covered — that is where density is actually decided.
- **`group: Papers` on every paper deck** — it is `study.json`'s `priority_collection` entry
  and the `paper_intake` collection (3 papers / 7 days). Papers have no `group_new_per_day`
  budget since 2026-09-20. Varying the group per paper drops the deck out of both.
- The artifact is `source: manual`, so `deck-export`'s clear and the orchestrator's sync both
  preserve it and neither produces it. Copy it to the quiz repo by hand.

## Company decks (`deck-companies`)

One company = one deck, `source: manual`, curate-then-assemble like `deck-papers`.
Authoring rules: [configs/companies/policy.md](configs/companies/policy.md).

```
configs/companies/<slug>.yaml           config: namespace, group, recheck_months, file names
                  <slug>.facts.jsonl    extraction — one row per fact, with volatility
                  <slug>.curated.jsonl  the cards `build` consumes
                  <slug>.audit.jsonl    per-card quote/category/volatility/checked/reason
                  <slug>.source.txt     research snapshot — COMMITTED (it is ours)
                  <slug>.source.sha256  which snapshot the quotes were verified against
```

Why not `deck-papers` with a different config — three things change what `build` enforces:

- **The source decays.** A paper is frozen; a company is not. Within one research window Verve
  was acquired, Arena BioWorks closed and Inari cut a third of its staff. A verbatim quote
  proves the card matches the SNAPSHOT, not that it is still true — so every audit row carries
  `checked` and `--stale` reports cards past `recheck_months`. Staleness warns, never fails:
  Alnylam's founders will not change.
- **`volatility: volatile` on a shipped card FAILS the build.** Cash, revenue, headcount,
  runway, valuation — all wrong within two quarters, and the reader cannot tell. Extract them
  into `.facts.jsonl` anyway (marked volatile, excluded from the coverage denominator) so the
  research is complete and a later pass sees they were considered. A **round** is durable; a
  **total raised** is volatile because it goes up.
- **There is no DOI.** `namespace` is authored (`company:<slug>`) and must never change once a
  card has been studied. The source text is ours, so it is committed and there is no
  `--no-verify-quotes`.

What will bite you:

- **`group` must NOT be `Papers`.** That string is the quiz's `study.json` `priority_collection`
  AND its `paper_intake` collection — reusing it enrols the deck in the daily gate and paper
  intake, and hides it behind the blue launcher. Use `Companies`.
- **`text-mc` no longer implies a paper, and the quiz dispatches on TWO fields.** Routes switch
  on `mode` (so company decks ride the same `mc_routes` loop, ramp and 8/25s thresholds), but
  `build_deck` switches on **`deck_type`** and used to fall through to the monarchs loader —
  which loads any items/title/labels artifact without error and renders it as blindman's-bluff
  cards. Both seams needed fixing in the quiz repo. Also: the review-proof exporter renders only
  `papers_*.json`, so don't re-key its control on mode.
- **`qid` is an identity, append-only.** Company facts get *corrected* more often than paper
  findings do. Reword the stem; never renumber.
- Artifact is `source: manual` — copy to the quiz repo by hand; neither `deck-export`'s clear
  nor the orchestrator's sync produces or removes it.
- **Memory scenes** (41 companies, cards due 2026-10-21): config key `mnemonics: <slug>.mnemonics.yaml`, rules in
  `configs/companies/mnemonic_policy.md`, checked by `company_mnemonics.py` (anchor in capitals
  in every scene, ≤25 words; every year/count/money/area number in the answer → its peg from
  `configs/history/major_pegs.yaml`, in answer order; money/area also need a unit image).
  A bad scene FAILS the build. Optional `story:` (Dewpoint pilot) = scenes as one narrative:
  qids, link sentences (≤25 words, anchor optional) and `---` paragraph breaks; every scene
  exactly once (`story_problems`). `--build` writes the sidecar straight to
  `memory-quiz-app/data/mnemonics/` (`--mnemonics-out`). The scene file is `.yaml` beside the
  deck configs — a loop over `configs/companies/*.yaml` must skip `*.mnemonics.yaml`.
- **Dates are year-only** (2026-10-21): a day or month is not worth a card's reviews.
- **Scene images** (2026-10-23, Alnylam only): `scripts/generate_scene_images.py <slug>` → `results/generate_scene_images/<slug>/<model>/<style>/` (default `gemini-3.1-flash-image`, `realistic`; key from macOS Keychain `gemini-api-key`). Anchor drawn first, sent as reference with every scene; `manifest.json` records each prompt, so only new/edited scenes are redrawn (paid). `--build` copies images drawn from the scene's CURRENT text to `memory-quiz-app/data/mnemonics/images/<deck>/` and names them in the sidecar (`image`). Model sometimes writes text despite the prompt — eyeball before shipping.

## Source-file decks (`deck-code-mcq`)

One **file** is one deck: what each function is for, what a dense expression evaluates to,
which constant governs what, how the parts integrate. Same curate-then-assemble contract as
`deck-papers`. Authoring rules: [configs/code/policy.md](configs/code/policy.md); procedure:
the `code-mcq` skill.

**This repo holds the machinery and the policy — never the cards.** A code card quotes
work-repo source, so the config, the three JSONL files and the artifact live in a *gitignored*
directory under the consuming repo (`code-drill/decks/`), which that repo's pre-commit hook also
refuses. `memory-quiz-app/data/decks/` is committed and deploys to fly.io; `data/decks/code_*.json`
is gitignored there so a local copy cannot be committed by accident.

What will bite you:

- **`build` fails without current AI notes** (`code_ai_explanation_*.json` for the file in the
  deck dir, same version) **or when the file changed since `reviewed_sha256`** — review every
  card, drop obsolete, add new, then reset it. Also refuses STE sentences > 25 words.
- **`--prune`** (run by code-drill's `sync` once the notes follow a changed file): drops kept
  cards whose quote the file no longer holds (`drop` in audit, off curated, qid retired), sets
  `reviewed_sha256` to the file as now. Dropped rows' quotes are not re-verified for code
  (`verify_dropped=False`); papers still verify them. `source_file` points at code-drill's
  `targets/_latest/<repo>/<path>` snapshot — the latest version across branches.
- **`build` fails on a function with no card.** That check is what makes the deck a reading of
  the *file* rather than of its interesting parts. Coverage is computed by mapping each quote
  back to its enclosing function, so a card that quotes the wrong line reports the right
  function as uncovered — fix the quote.
- **A quote is matched line by line.** A quote spanning a `def` and the statement under it
  appears in no single line; whole-quote matching silently reported those functions uncovered.
- **Nested helpers count as functions.** The closure inside a parsing loop is exactly the thing
  that goes unread, and it is usually the deck's hardest card.
- **`source_id` must never change once a card has been studied** — not when the file moves.
  Moving the file is a new `path` and the same `source_id`.
- **`group: Code`**, never `Papers` — that string is the quiz's priority collection and its
  paper-intake key; reusing it enrols the deck in the daily gate and paper intake.
- **The quiz needed a branch.** `build_deck` dispatches on `deck_type` and raises on an unknown
  one; `code` rides the `paper`/`company` `text-mc` branch.

## Grammar tables (`deck-grammar`)

**20 decks, 1,892 cards**, all `group: Latin Grammar`, one page shown at a time:
- **Verbs** (12, order 600–611): one per conjugation class — Wheelock's portō, moneō, dūcō,
  capiō, audiō + irregulars sum, possum, volō, eō, ferō, fīō, edō. Pages (`grammar.PAGES`):
  indicative act/pass, subjunctive act/pass, imperative & non-finite; active-only verbs get 3.
- **Nouns** (5, 620–624, `kind: noun`): one per declension, Wheelock's models (porta … rēs, plus
  domus and vīs); one table per noun (cases × sg/pl), ≤ 4 a page. `sources/nouns.yaml`.
- **Pronouns** (3, 640–642, `kind: pronoun`): personal & reflexive; demonstratives; relative,
  interrogative & indefinite. Gendered ones = a singular and a plural table side by side
  (`flow: row`), 2 pronouns a page. `sources/pronouns.yaml`.

```sh
deck-grammar --import                     # sources/{verbs,nouns,pronouns}.yaml + cache/kaikki_la → 20 configs
deck-grammar --config configs/grammar/latin_*.yaml --out ../memory-quiz-app/data/decks --build
```

- **Two sources.** `configs/grammar/latin_*.yaml` are GENERATED from Wiktionary (kaikki.org
  JSONL, `cache/kaikki_la/`, gitignored) by `grammar_kaikki`; `grammar.derive` re-derives every
  form by rule (5 conjugations + `_OVERRIDES` for ferō) or, for irregular present systems, from
  `_IRREGULAR` tables written from Wheelock. Build refuses any disagreement **and any absence**
  (a cell rules give but the config lacks). Never edit a page config — fix `sources/verbs.yaml`
  (`exclude:` with a `reason`, e.g. volō's post-classical *volitūrus*) or the rules, re-import.
  `exclude` applies to BOTH sources — it is a choice of standard, not a disagreement.
- **The import never calls the rules**, or the check is circular. Its conventions: first
  Wiktionary variant wins (portāvistī, not portāstī) unless the verb's `prefer.prefix` says
  otherwise — edō takes its athematic ēs-forms (ēs, ēst, ēsse, ēssem; A&G §201), and it is a
  **prefix, not a substring**: `ederēs` contains ēs in its ending (the rules caught that).
  Periphrastic perfects composed from Wiktionary's own `X + … of sum` rows, masculine, voice
  from the row's tags (fīō's `factus sum` is active: `semi_deponent`). Periphrastic
  infinitives cited in the nominative (Wiktionary's `portātūrum esse` → `portātūrus esse`).
- Kaikki URL: `kaikki.org/dictionary/Latin/meaning/<p>/<po>/<porto>.jsonl` — page titles have
  **no macrons**. Not Wikimedia, so no `wiki-open` window. A file holds several entries
  (volō "wish" / "fly"): `load_entry` picks by infinitive.
- **Item is a tag identity, never the form**; `lemma_key`/tags must never change once studied.
  Config = `latin_<lemma_key>.yaml`; portō's is the pre-expansion `latin_porto.yaml`, the path
  its sessions are keyed on. Labels carry the page (`Indicative active · Present · 3rd sg.`) so
  they stay unique across pages.
- **Config**: `pages: [{key, label, tables}]`; a table is person shorthand (`tag` + six `forms`)
  or grid (`rows`, `cols`, `cells` row-major, null = no form). Rows/columns with no form are
  dropped (eō has no passive column). Artifact: one flat `tables` list (keys `<page>.<table>`)
  + `pages: [{key, label, tables: [indices]}]`.
- **Pools** (`wrong_pool`): rest of the table, same person in other tenses, same cell in the other
  voice and mood (portat → portātur, portet), rest of the page for non-finite, ending-vowel flips
  past the longest protected stem (`stems`; root length is lexical, not grammar), drawn within one
page (`wrong_pool` takes that page's tables). Periphrastic
  forms flip only the participle. Quiz drops a pool form another cell of the same table is
  showing — so keep pools broad.
- **Nouns and pronouns** (`grammar_nominal`; `kind` dispatches validate/assemble): nouns
  declined by rule from `[nominative, genitive]` + gender (`_NOUN_ENDINGS`; domus/vīs explicit);
  pronouns are Wheelock tables EXCEPT the compounds, derived from their bases — īdem from is
  (+dem, m → n: eundem), quīdam from quī, aliquis/quisque from quis, ille/iste/ipse from one
  ending set. Tags `<case>.<number>[.<gender>]`; `genpart` = nostrum/vestrum; `c` = Wheelock's
  one masc. & fem. column (`common_singular`: quis, aliquis, quisque). Item `la:<word>|<tag>` —
  one table per word, `lexeme` on the table. Pools: every other form of the same word on the
  page + ending flips (porta / portā), never another word's.
- **Registry knobs**, each with a reason: `choose` (Wheelock's variant first — domō, eī/eīs,
  aliquibus; must be one of Wiktionary's), `respell` (Wheelock's spelling Wiktionary lacks —
  illīus for illius; Wiktionary's stays valid), `partitive`, `exclude` (diēs' locative; quis's
  and quisque's plurals), `anceps` (Wiktionary's ō̆ = either length: short by default — ego,
  mihi, sibi — long for cornū), `common_singular`.
- **`also` = a cell's other valid forms** (Wiktionary variants: cīvīs, domū, portāstī). Never
  shown, never a wrong option — a correct form marked wrong teaches the wrong thing. Verbs
  carry it too.
- Pronoun tables abbreviate case names (nom., gen.): three gender columns at full names
  overflowed the window (quiz e2e GT.4).
- Only `--import` needs the kaikki cache; check/build run on a fresh clone. Importer tests use
  `tests/fixtures/kaikki_la/` (CC BY-SA).

## County decks (`deck-counties`)

One state = three `source: manual` decks from `configs/counties/<state>.yaml`: each atlas group's
acronym as `[piece, name]` pairs + per-county seat/largest/towns. `curate` drafts it from sheet
rows (`acronym<TAB>names`, one per atlas group in order) + the atlas's
`results/sheet_rows/<state>.facts.json` (`sheet_rows.py STATE`); **then hand-fix and commit** —
re-curating overwrites hand fixes.

What will bite you:

- **Items are positional** (`counties:MI|piece|g01|p03`, `|seat|Kent`, `|map|g01`) — fixing a
  name keeps history; inserting a piece mid-acronym shifts every later piece's identity.
- **`align` can pick the wrong split when both halves are counties** (Houghton Lake → Houghton +
  Lake). Review every row after `curate`.
- **The atlas town CSV has bad populations** (MI South Lyon 128,071). Eyeball `largest`.
- **Map highlight = atlas group members**, which can include counties the sheet acronym omits
  (MI Washtenaw, Branch).
- `build` writes straight into the quiz repo; the orchestrator's `decks` sync keeps asset dirs
  of manual decks.

## Musical themes (`deck-themes`)

MTD (Musical Theme Dataset) → canonical MEI + verified note corruptions → `notation-spot` deck.
Corpus is a 2.6 GB download under `cache/mtd/` (gitignored); only `data_SCORE_XML` + `data_META`
are read. Full design: [docs/design/themes-pipeline.md](docs/design/themes-pipeline.md).

What will bite you:

- **Read the score, not `data_SCORE_CSV`.** The CSV merges tied notes, so it disagrees with the
  notation on 566 of 2,067 themes (561 are exactly the tie cases). It is what is *heard*; the
  MusicXML is what is *read*, and reading is the skill.
- **Note ids must be renumbered `n1..nN`.** Verovio mints random ids per load, so a pool built
  against one conversion addresses a different note in the next render.
- **A rhythmic corruption edits an adjacent PAIR** and marks both positions. Lengthening one
  note must shorten another or the bar stops adding up — and an unbalanced bar re-spaces
  everything after it, leaking the answer as typography.
- **`accid` vs `accid.ges`.** Verovio records an unprinted alteration (key signature, or a
  MusicXML `<alter>` with no `<accidental>`) in `accid.ges`. Adding a sharp to a note already
  sounding sharp prints a courtesy accidental and changes nothing audible. Both the generator
  and `verify` compare on `sounding_accid`, so the class is unshippable.
- **MTD ids can carry a suffix** (`0739-2`) — part of the identity; dropping it collides two
  themes from one movement.
- **No pool cache and no engine version**, unlike equations: verification is structural, so the
  whole corpus rebuilds in ~90 s and there is nothing to invalidate.
- **`max_per_composer` is load-bearing.** Beethoven is 27% of MTD; uncapped, the deck teaches
  one catalogue.
- ⚠ **Licensing unresolved** — the archive LICENSE does not name `data_SCORE_XML`. See the PRD.

## Award configs (31)

**Science:** `nobel_physics`, `nobel_economics`, `fields_medal` (chunk_years: 4, ICM-aligned), `abel_prize`, `turing_award`, `knuth_prize`, `godel_prize`, `ieee_von_neumann_medal`, `clay_research_award`, `dirac_medal`, `breakthrough_physics`, `breakthrough_life_sciences`, `kavli_astrophysics`, `ramanujan_prize`, `priestley_medal`, `crafoord_prize`, `wolf_physics`, `wolf_chemistry`, `wolf_mathematics`, `lasker_basic_medical`, `gairdner_award`, `john_bates_clark_medal`

**Literature:** `nobel_literature`, `booker_prize`, `man_booker_international`, `pulitzer_fiction`, `national_book_award_fiction`, `prix_goncourt`, `franz_kafka_prize`

**Human rights:** `sakharov_prize`, `right_livelihood_award`

## Poetry sources

A poetry config names **either** `gutenberg_id` (one text per book — all 154 sonnets are cut
from Gutenberg 1041) **or** a Wikisource `page` per poem, with optional `wikisource_lang`
(default `de`). `_poem_source_text` picks; the text cache is keyed per book for Gutenberg
and per page for Wikisource, so a ten-elegy collection fetches ten pages once each. Markers
work identically on both — Wikisource text is flattened to plain lines first.

`configs/poetry/rilke_duino_elegies.yaml` is the first: Rilke's *Duineser Elegien* (1923
Insel), **not on Project Gutenberg** — its Rilke catalogue stops before it. German
Wikisource has it one page per elegy at `BEARBEITUNGSSTAND=fertig` (proofread). 10 decks,
860 lines.

An optional `language:` key reaches the artifact and tells `memory-quiz-app` which shared
lexicon glosses that deck in preview; absent for English decks. Regenerate the lexicon
(`interactive-reader/build_quiz_lexicon.py`) after adding a deck in an existing language.

⚠ `_discover_slots` globs `poetry/*.yaml` **sorted**, so a new config renumbers the `order`
of every poetry deck after it alphabetically. `order` is menu position only — item strings
and `config_hash` are untouched, so no FSRS history moves — but a full re-export will shift
the sonnets' stored `order` by the number of poems added before them.

## Key implementation notes

- **Monarch `items` are `<deck-stem>|<century>` identities, NOT the digit string** — the quiz keys
  FSRS on the item text alone, and bare digit strings collide across realms (26 cards were silently
  one card). Display lives in the parallel `digits` array; `monarch_item_keys` builds the identity
  and is shared with the quiz's migration so the two cannot disagree
- Monarch transition years: every accession year, plus any end year that is not itself an accession year (throne didn't pass directly to a successor) — covers Wikidata coronation-lag, interregnum starts, and dynasty terminal years
- Monarch config corrections (`corrections:`) require `reason` + `source`; add is idempotent so an upstream Wikidata fix can't double a digit — it declares the TARGET occurrence count and tops up to it, so an `add` may carry `count: N` when a year holds more than one transition (Hammadid 1105 = two accessions; `add_transition_years` is read as a multiset). `count` on a `drop` raises: drop removes every occurrence. `accession_precision` is recorded and warned on but never affects digits — see PRD
- **`exclude_people:` vs `corrections:`** — a correction patches a YEAR, an exclusion removes a PERSON. Reach for the exclusion when upstream membership is wrong about an individual: a year-level `drop` removes every event in its year, so a wrong holder sharing a year with a real transition can only go by deleting that transition too and re-adding it as an anonymous correction, which strips the real ruler's name from the reign table. Eight of Byzantium's twenty consort digits shared a year with an emperor's accession, Justinian I's among them. It also retired the Zirid Málaga workaround byte-for-byte.
- **`extra_cards:` — a card that is not a century.** Named card + its own sourced transition years; digits derived from those years, so `events[i]` explains digit `i` and no config can state a digit string directly. Appended after the whole timeline (not interleaved by date) so a reader's century sequence is uninterrupted and the order does not move when a card's years change; a label colliding with a timeline card raises, since the label IS the FSRS identity. Two shapes so far: a realm that SPLIT (Saadi `Marrakesh 1603–1627` / `Fes 1603–1627`, running simultaneously) and a stretch too dense for its century (Alaouite `Interregnum 1727–1757`, fifteen accessions in thirty years). For the second, the turmoil MOVES — `drop` the years off the timeline card rather than duplicating them.
- **A missing RULER is not always a missing DIGIT.** A successor who acceded in the year the predecessor's reign already ends is one transition, counted once. Three of Japan's six missing empresses, both of Hungary's missing kings and the Wattasid Nasir ad-Din al-Qasri fall in that case, so `add`ing them would double a transition that happened once. Check which you have before writing an `add`.
- Monarch coverage workflow: (1) `deck-registry-generate` → `country_registry.yaml`; (2) add `wikipedia_list` field to config; (3) `deck-coverage-check --config <yaml>` reports gaps; (4) `deck-derive-positions --input politicians_rulers.xlsx` suggests position Q-IDs for historical polities not covered by P1906
- `Monarch.wp_title` is fetched via SPARQL sitelinks (`schema:isPartOf <https://en.wikipedia.org/>`); used as join key by coverage checker
- Folger API responses cached under `cache/folger/`; segments under `cache/folger/segments/`
- Excel output: two sheets — Detail (one row per entry) + Summary (one row per chunk)
- Equation decks (`configs/equations/{statistics,physics,mathematics,computer_science}.yaml`, **1301 total since the 2026-07-23 expansion** — math 332, physics 310, stats 329, CS 330): the `item` is the canonical LaTeX, so retuning the corruption engine, retiring a type, or an equation moving between the 2-error/1-error decks never strands FSRS history (unlike the monarch end-year change). Corruptions are generated, equations are curated (the big set was LLM-drafted → sympy-verified → correctness-audited — see equations-pipeline.md "Expansion pipeline"). One config → two decks (2-error / 1-error, split by `classify`), disambiguated by `poem_title`. `normalise.py` unlocked real notation (`P(A\mid B)`, `\operatorname{Var}`); vector calculus (`\nabla \times`) still fails closed. `differs` now verifies by **numeric sampling on the residue** (not `simplify`, which hangs on infinite integrals). **Pool cache**: `deck_export` persists verified pools to `cache/equation_pools.json` keyed by `sha256(latex+types+pool_size+_POOL_ENGINE_VERSION)` — re-export is near-instant; **bump `_POOL_ENGINE_VERSION` when `corruptions.py`/`normalise.py` change** or it serves stale pools. Building a fresh full field's pools is sympy-heavy (~5–20 min) and can hang on a pathological equation — warm the cache fork-isolated (a per-equation hard timeout) rather than trusting a bare `deck-export`. **LLM-recovered pools**: equations sympy can't verify (boolean/set/info-theory/matrix notation) get corruptions from a committed sidecar `configs/equations/llm_pools.json` (LLM-generated + 2-skeptic adversarially-verified, provenance `llm`, 1-error only) that `_equation_rows` reads BEFORE `build_pool` and forces `kind='one'` — engine-version-independent. See [docs/design/equations-pipeline.md](docs/design/equations-pipeline.md)
- Only `results/*.xlsx` is gitignored (long-term xlsx storage is local in-repo); `results/<script>/` analysis output **is** tracked
- **Canon coverage analysis** (`scripts/compare_art_index.py`, `scripts/list_missing_works.py` → `results/<script_name>/`): the index of *Art: The Definitive Visual Guide* vs `artworks_famous`. Input is committed OCR text (`data/art_definitive_index/ocr/`), not the source photos — those are gitignored at ~58 MB, and the repo has no LFS rule to catch them. Regenerate OCR with **Pillow rotate + `tesseract --psm 3`**: the photos are shot sideways, and `--psm 6` assumes one uniform block, which is garbage on a 6-column index. `sips` cannot be used under the Bash sandbox — it writes scratch files to `/var/folders/`. **Never match these two sources literally**: the book cites works by surname alone (`(van Gogh)`), disagrees on particles (`da Correggio` vs `Correggio`) and epithets (`Holbein the Younger`), uses compound surnames (`Sorolla y Bastida`), and routinely OCRs two index entries onto one line — every one of those was a wrong-answer bug before it was a rule. See PRD "Coverage analysis"

## ⚠ Wikimedia is blocked — open a window before fetching pipelines

`productivity-guardian` blocks Wikimedia at the **pf layer, by IP**. Every language edition and
sister project (wikidata, wikisource, commons, mediawiki) CNAMEs to `dyna.wikimedia.org` → one
anycast text-lb IP, so `query.wikidata.org` and `de.wikisource.org` go down with `wikipedia.org`.

```sh
cd ~/Documents/Projects/productivity-guardian && ./Scripts/wiki_open.sh -m 120
```

Expires on its own; `--close` ends it early, `--status` shows it.

**Needs the window:** `deck-acronyms`, `deck-monarchs`, `deck-monarch-tables`, `deck-artworks`
metadata, `deck-registry-generate`, `deck-coverage-check`, `deck-derive-positions` (all Wikidata
SPARQL); `deck-poetry` on a Wikisource config (Rilke Duino Elegies); `wiki_api.py` article links.
A bare `deck-export` re-fetches **every** deck from live sources, so it needs one too.

**Does not:** `artwork_images.py` downloads (`upload.wikimedia.org`, separate IP), anything served
from `cache/` (`cache/wikisource/`, `cache/artworks/`, `cache/artworks_meta.json`), `deck-export
--cache-only`, and the curate-then-assemble pipelines (`deck-vocab`, `deck-papers`, `deck-equations`,
`deck-themes`) which are offline by design.

Do not "fix" a fetch failure by editing a config or a correction — a blocked window looks like
missing upstream data, and `stale_corrections` / `check_against_deck` will read it that way.
