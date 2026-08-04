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
| `deck-artworks` | Wikidata SPARQL + Wikimedia Commons | Artwork title/creator/image → quiz `image-mc` deck (JSON + WebP assets) |
| `deck-shakespeare` | Folger Digital Texts API | YAML catalogue of monologue passages |
| `deck-equations` | Hand-curated YAML | Equation + verified corruption pool → quiz `error-spot` deck (MathML baked) |
| `deck-vocab` | wordfreq × CC-CEDICT (+ audited LLM adjudication of hard words) | Curated Chinese `matching` vocab deck (`source: manual`; committed out-of-band, not a full-export deck) |

## Modules

| Module | Role |
|---|---|
| `wikidata.py` | SPARQL client: `fetch_entries(item_id, humans_only)` + `count_laureates(item_id, humans_only)`. Skips bare Q-number labels. Gap warning computed before manual entry merging. |
| `chunker.py` | `make_chunks(entries, chunk_years, chunk_start_year, first_letter_only_from)` → `list[Chunk]`. Empty year windows omitted. |
| `acronym.py` | `name_initials`: skips particles, expands hyphenated tokens. `line_initials`: all words including particles. |
| `xlsx_writer.py` | `write_xlsx()` (awards), `write_poetry_xlsx()` (poetry), `write_monarchs_xlsx()` (monarchs). |
| `gutenberg.py` | HTTP fetch + cache in `cache/gutenberg/`. |
| `wikisource.py` | Poems Gutenberg lacks. `fetch_wikitext` (cached in `cache/wikisource/<lang>/`) + `poem_text` (the `<poem>` block, transcription markup stripped) + `fetch_text`. **Wikimedia 403s the default `requests` UA** — same policy as the image CDN, needs a real identifying URL (`wiki_api.py`'s `example.com` UA is the kind that fails). Strips `{{Seite\|N}}`, `{{Zeile\|N}}` (glued to the FRONT of every fifth line — dropping the line loses the verse), `{{SperrSchrift\|x}}` (unwrap, keep the word), and **`{{idt}}`, which takes no argument** — a drop pattern requiring `\|` silently leaves it in the text. |
| `folger.py` | Folger Digital Texts API; caches HTML under `cache/folger/`. |
| `poetry_parser.py` | `extract_poem(text, start_marker, end_marker)` → `list[str \| None]`. `None` = blank line. |
| `monarchs.py` | `fetch_monarchs` (includes `wp_title` sitelink + `accession_precision`), `make_monarch_chunks`; deduplicates by person Q-number. `parse_corrections`/`correction_years` read the config's sourced `corrections:` block; `stale_corrections` reports ones upstream has made redundant; `report_imprecise_dates` flags sub-year-precision dates (documentation only — digits unaffected). |
| `artworks.py` | `fetch_artworks_cached(config, refresh=…)` wraps `fetch_artworks` with a persisted metadata cache (`cache/artworks_meta.json`, keyed by query-affecting config + `_META_ENGINE_VERSION`; **bump it when the fetch/parse changes**). The banded sweep was ~10 of an export's ~12 min and is invariant to corrections/distractors. Key is built by *exclusion* (`_NON_FETCH_KEYS`) so a new config knob busts the cache instead of being ignored; hits are logged; `--refresh-metadata` bypasses. `fetch_artworks(config)` — Wikidata paintings by fame (`min_sitelinks`) / curated QIDs / collection (P195); dedup by QID; `build_query`. `Artwork(qid, title, creator, image_url, sitelinks, inception, creator_candidates)`. Creator corrections: `parse_artwork_corrections`/`apply_corrections`/`stale_corrections` (`set`/`exclude`, sourced); `_principal_creator` picks deterministically (lowest QID) when Wikidata credits several — **was SPARQL row order**, which WDQS doesn't guarantee, so a re-export could silently flip a card's answer under a stable `item_key`. |
| `equations.py` | LaTeX → MathML with per-token `id`s. `Equation`, `load_equations`, `to_mathml`, `token_texts`, `eligible_indices` (excludes delimiters/accents/differentials), `annotate`. |
| `corruptions.py` | Generated + verified single-token corruptions. `build_pool` → pool + `bad_pairs`; `differs` proves non-equivalence via **numeric sampling on the residue `a-b`** (never `simplify`, which hangs on infinite integrals; finite ops are `.doit()`'d, infinite/heavy residues rejected — see `equations-pipeline.md` "equivalence predicate"; fails closed; guards sympy's silent mis-parse of `\mathbf`/`\hat`/`\operatorname`); `_variable_tokens` swaps ASCII + whitelisted Greek variables (excludes `\pi`/operators); `classify` splits equations into 2-error / 1-error / drop by supportable pair count; `pool_warnings` flags thin pools. |
| `normalise.py` | Verification-only LaTeX rewrites so sympy can parse real notation (`\operatorname{Var}(X)`, `E[X^2]`, `P(A\mid B)`, bold vectors). `opaque_spans` marks argument lists where corruption is barred (`Var(X+Y)`→`Var(Y+X)` is an equivalence). Never displayed. |
| `equations_cli.py` | `deck-equations` — preview pool health + 2/1 classification per config; `--sample` prints a text two-error display; `--export` writes the artifact(s). |
| `vocab.py` | Chinese vocab pipeline: CC-CEDICT parse/`fetch_cedict` (CC-BY-SA), numbered→diacritic `pinyin_marks`, `load_seed` (freeze existing 267), `rank_candidates` + clean/needs-LLM router, `load_curated`, `band_collisions` (band-scoped uniqueness), `assemble_artifact`. |
| `vocab_cli.py` | `deck-vocab` — **preview** (clean/needs-LLM split) / **curate** (prepare needs-LLM chunk files for the audited adjudication pass) / **build** (assemble committed curated rows → `source: manual` artifact, deterministic; verifies no-dup-hanzi + band uniqueness). Committed data: `configs/vocab/chinese_common.{yaml,curated.jsonl,audit.jsonl,policy.md}`. See [docs/design/vocab-pipeline.md](docs/design/vocab-pipeline.md). |
| `distractors.py` | `build_choices(artworks, attr, n, same_creator_bias)` — deterministic (QID-seeded) MC options; same-creator/era bias; no duplicate values. Creator cards match **answer shape** first (joint `A & B` answers draw joint distractors) — a multi-name answer among single-name options is pickable without knowing the artwork. |
| `corrections.py` | Shared contract for sourced manual overrides (monarchs + artworks): mandatory `reason`/`source`, `validate` raises rather than skipping a malformed entry, and every pipeline owns a staleness predicate. The correction *types* differ (a monarch patches a scalar year in a multiset, an artwork a field on a keyed record), so only the contract is shared. |
| `artwork_images.py` | `fetch_raw` (Commons download, cached under `cache/artworks/`, UA-compliant — the CDN 403s placeholder UAs) + `to_webp` (Pillow downsize). |
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

- Monarch transition years: every accession year, plus any end year that is not itself an accession year (throne didn't pass directly to a successor) — covers Wikidata coronation-lag, interregnum starts, and dynasty terminal years
- Monarch config corrections (`corrections:`) require `reason` + `source`; add is idempotent so an upstream Wikidata fix can't double a digit. `accession_precision` is recorded and warned on but never affects digits — see PRD
- Monarch coverage workflow: (1) `deck-registry-generate` → `country_registry.yaml`; (2) add `wikipedia_list` field to config; (3) `deck-coverage-check --config <yaml>` reports gaps; (4) `deck-derive-positions --input politicians_rulers.xlsx` suggests position Q-IDs for historical polities not covered by P1906
- `Monarch.wp_title` is fetched via SPARQL sitelinks (`schema:isPartOf <https://en.wikipedia.org/>`); used as join key by coverage checker
- Folger API responses cached under `cache/folger/`; segments under `cache/folger/segments/`
- Excel output: two sheets — Detail (one row per entry) + Summary (one row per chunk)
- Equation decks (`configs/equations/{statistics,physics,mathematics,computer_science}.yaml`, **1301 total since the 2026-07-23 expansion** — math 332, physics 310, stats 329, CS 330): the `item` is the canonical LaTeX, so retuning the corruption engine, retiring a type, or an equation moving between the 2-error/1-error decks never strands FSRS history (unlike the monarch end-year change). Corruptions are generated, equations are curated (the big set was LLM-drafted → sympy-verified → correctness-audited — see equations-pipeline.md "Expansion pipeline"). One config → two decks (2-error / 1-error, split by `classify`), disambiguated by `poem_title`. `normalise.py` unlocked real notation (`P(A\mid B)`, `\operatorname{Var}`); vector calculus (`\nabla \times`) still fails closed. `differs` now verifies by **numeric sampling on the residue** (not `simplify`, which hangs on infinite integrals). **Pool cache**: `deck_export` persists verified pools to `cache/equation_pools.json` keyed by `sha256(latex+types+pool_size+_POOL_ENGINE_VERSION)` — re-export is near-instant; **bump `_POOL_ENGINE_VERSION` when `corruptions.py`/`normalise.py` change** or it serves stale pools. Building a fresh full field's pools is sympy-heavy (~5–20 min) and can hang on a pathological equation — warm the cache fork-isolated (a per-equation hard timeout) rather than trusting a bare `deck-export`. **LLM-recovered pools**: equations sympy can't verify (boolean/set/info-theory/matrix notation) get corruptions from a committed sidecar `configs/equations/llm_pools.json` (LLM-generated + 2-skeptic adversarially-verified, provenance `llm`, 1-error only) that `_equation_rows` reads BEFORE `build_pool` and forces `kind='one'` — engine-version-independent. See [docs/design/equations-pipeline.md](docs/design/equations-pipeline.md)
- Only `results/*.xlsx` is gitignored (long-term xlsx storage is local in-repo); `results/<script>/` analysis output **is** tracked
- **Canon coverage analysis** (`scripts/compare_art_index.py`, `scripts/list_missing_works.py` → `results/<script_name>/`): the index of *Art: The Definitive Visual Guide* vs `artworks_famous`. Input is committed OCR text (`data/art_definitive_index/ocr/`), not the source photos — those are gitignored at ~58 MB, and the repo has no LFS rule to catch them. Regenerate OCR with **Pillow rotate + `tesseract --psm 3`**: the photos are shot sideways, and `--psm 6` assumes one uniform block, which is garbage on a 6-column index. `sips` cannot be used under the Bash sandbox — it writes scratch files to `/var/folders/`. **Never match these two sources literally**: the book cites works by surname alone (`(van Gogh)`), disagrees on particles (`da Correggio` vs `Correggio`) and epithets (`Holbein the Younger`), uses compound surnames (`Sorolla y Bastida`), and routinely OCRs two index entries onto one line — every one of those was a wrong-answer bug before it was a rule. See PRD "Coverage analysis"
