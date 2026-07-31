# Design — Famous Artworks pipeline (`deck-artworks`)

*Status: **built + scaled (2026-07-24)**. Wikidata → famous artworks → downsized WebP assets +
a two-card artifact with baked multiple-choice distractors, over the `deck-export` seam. Quiz
side: [`memory-quiz-app/docs/design/artwork-mc-mode.md`](../../../memory-quiz-app/docs/design/artwork-mc-mode.md).
**`artworks_famous` grown 290 → 5,552 works (10,867 cards)** — broadened media (painting +
sculpture + drawing + print + photograph), fame floor sitelinks ≥5, a checkpoint of the deep
catalog (extendable to the 10k cap; download is Commons-rate-limited, see below).*

### Scaling additions (2026-07-24)
- **Multiple media types**: `instance_of` is a list; `fetch_artworks` runs one query per type and merges.
- **Sitelink-band fetching**: a whole-catalog `ORDER BY DESC(sitelinks)` overflows WDQS's 60 s
  limit (flaky 504s well before), so `fetch_artworks` sweeps narrow `_sitelink_bands` (no ORDER
  BY) and sorts/limits client-side. Bands that fail after retries are skipped, not fatal.
- **Retry with backoff** (`wikidata._sparql_session`): 5xx/429/timeout/**truncated-JSON** retried.
- **Robust date parse**: a P571 'unknown value' (genid URL) → `inception=None`, not a crash.
- **Parallel downloads** (`deck_export`, thread pool, `image_workers`): Commons still caps the
  *successful* rate ~15–40/min per IP via 429s (backoff-paced), so 10k images take hours —
  **resumable** (cache keyed by QID). **`cache_only: true`** exports a checkpoint deck from the
  already-downloaded images without fetching more (how the 5,552 shipped). Thumbnail hint width
  dropped 1024 → `2·image_px` (smaller/faster).

## Goal
Produce committed artwork decks for the quiz's image + multiple-choice mode: for each famous
artwork, its **title**, **creator**, a **downsized image file**, and **baked distractors** for
both attributes. The quiz never fetches or generates at study time — this pipeline bakes
everything into `data/decks/*.json` + `data/decks/assets/<deck>/*.webp`.

## Data volume (live Wikidata survey, 2026-07-17)
`instance of painting (Q3305213)` with **both** creator (P170) and image (P18): **381,330**.
Fame tail (fame = `wikibase:sitelinks`, i.e. # of language Wikipedias linking the work):

| sitelinks ≥ | count | character |
|---|---|---|
| 50 | 14 | the absolute icons (Mona Lisa 146, Starry Night 76, Guernica 70…) |
| 30 | 104 | unmistakable masterpieces |
| ~20 | ~350 (interp.) | very famous |
| 10 | 1,533 | famous → art-history known |
| 5 | 4,916 | broad, includes lesser-known |

A `min_sitelinks` (or top-N) config knob sets deck size directly. Image sizing (WebP ~400–500px
≈ 25 KB): 104 works ≈ 2.5 MB, 1,500 ≈ 37 MB, 5,000 ≈ 125 MB on disk. The PWA caches only
studied decks (see quiz doc), so the phone footprint is a fraction of this.

## Locked decisions (from scoping)
| Decision | Choice |
|---|---|
| Source | Wikidata SPARQL, ranked by `wikibase:sitelinks`; config knob for threshold / top-N |
| Image format | Download from Wikimedia Commons → downsize to ~480px **WebP** (~25 KB), store as files |
| Asset layout | `data/decks/assets/<deck>/<QID>.webp`, referenced by relative path from the JSON |
| Distractors | **Baked at export**, 4 choices, same-domain bias, **deterministic** (seeded by QID) |
| Card expansion | Artifact `items` expanded **2× per artwork** (`<QID>\|title`, `<QID>\|creator`) |
| Licensing | Restrict to **freely-licensed** images (see risks) |

## Config schema (`configs/artworks/famous.yaml`)
```yaml
deck_name: "Famous Paintings"
group: "Artworks"
source: wikidata            # wikidata | curated | collection
instance_of: [Q3305213]     # painting; extensible (sculpture Q860861, …)
min_sitelinks: 30           # fame threshold  (wikidata mode)
limit: 150                  # optional top-N cap
# curated mode:    works: [Q12418, Q45585, ...]
# collection mode: collection: Q19675      # P195, e.g. the Louvre → one deck per museum
image_px: 480
distractors:
  count: 4
  same_creator_bias: true   # title-card distractors prefer same movement/era; creator-card same period
```
All three source modes emit the identical artifact shape — only how the QID set is chosen differs.

## Pipeline modules (new, under `src/deck_generator/`)
| Module | Role |
|---|---|
| `artworks.py` | `fetch_artworks(config)` — SPARQL for QID set (fame / curated / collection); returns `Artwork(qid, title, creator, creator_qid, image_url, sitelinks, movement, inception, license)`. **Dedups by QID**; license filter. |
| `artwork_images.py` | `fetch_image(url)` → cache raw under `cache/artworks/`; `downsize(raw, px) -> webp_bytes`. Exponential-backoff Commons fetch. |
| `distractors.py` | `build_choices(artworks, attr, n, bias, seed=qid)` → per-artwork option list incl. the correct answer; **deterministic** (seeded by QID, no RNG state), so re-export is byte-stable and testable. Guards against duplicate options (shared titles / dominant creators). |
| `artworks_cli.py` | `deck-artworks` entry point. |

## Export seam (`deck_export.py` extension)
`deck-export` gains artwork handling: for each artwork deck it writes the expanded
two-card JSON **and** copies the downsized WebP assets into `data/decks/assets/<deck>/`.
- **`items` are `<QID>|<attr>` strings**, byte-identical across runs given the same QID set →
  the quiz's FSRS `item_key = sha256(item)[:16]` is preserved. Re-ranking that *adds* works
  leaves existing works' keys intact; only dropped/added QIDs retire/mint keys.
- **Answer-text and distractor changes do NOT strand history** — the key is `QID|attr`, not the
  answer. This is the key contrast with monarch digits (keyed on the digit string), and means
  the artwork mode needs **no `recovery.py` path** on the quiz side.
- **Clear/rebuild:** a bare `deck-export` run clears `data/decks` — the **assets dir must
  be cleared and rebuilt in lockstep** with the JSON (and the orchestrator's Dagster `decks`
  sync must carry `assets/` alongside the JSON). `--only <glob>` refreshes an artwork deck +
  its own asset subfolder, leaving others untouched. `config_hash` still covers config bytes
  only, so a generator-behaviour change is invisible — re-export after any change (same caveat
  as every other deck).

## Testing
- `fetch_artworks` against a recorded SPARQL fixture; dedup + license filter.
- `build_choices` determinism (same seed → same options) + no-duplicate-option guard.
- `downsize` output is WebP within target px / size.
- Artifact byte-stability: same config → identical `items`/`labels`/`choices` bytes.

## Creator corrections (2026-07-25)

A creator card is only as good as P170, and P170 fails two ways. Both are patched by a sourced
`corrections:` block in the config, sharing the provenance contract with the monarchs pipeline
(`corrections.py`: mandatory `reason`/`source`, raise-don't-skip, staleness reporting).

**1. Several creators, no way to choose.** 131 of 5,552 shipped works (2.4%) carry more than one
P170. These are not data errors — Laocoön has three Rhodian sculptors, the Ghent Altarpiece two
van Eyck brothers, the Siegessäule six sculptors plus its architect. No Wikidata field settles
which one carries the work: rank is already applied by `wdt:` (0 works had a single preferred
statement), P84 `architect` covers 11 and is *actively wrong* for sculpture (it would replace
Chillida with the site architect on *Peine del Viento XV*), and 85 have no signal at all. So all
111 with a creator card were adjudicated by hand against their Wikipedia lead: 64 have a
principal creator, 39 answer with the credited set, 8 have no answerable creator.

**2. A plainly wrong statement.** Q4429116 "The Magpie" credits Picasso on a Monet painting —
the item's own description and image file both say Monet. Same mechanism, `action: set`.

Two knock-on design points:

- **Joint answers need joint distractors.** A two-name answer among three one-name options is
  pickable on shape alone, which would test spotting an ampersand rather than recognising the
  artwork. `distractors._rank` matches shape before era on creator cards, falling back when the
  deck has too few of a kind.
- **The pick must be deterministic.** The old dedup kept whichever row SPARQL returned first,
  and WDQS guarantees no ordering without `ORDER BY` — so a re-export could silently flip a
  card's answer while its `item_key`, and so its FSRS history, stayed put. `_principal_creator`
  now picks the lowest QID: still arbitrary, but *fixed*, and `stale_corrections` reports every
  work answered that way so new ambiguity surfaces instead of passing silently.

Corrections rewrite only the answer text, never the item string (`<QID>|creator`), so applying
one preserves the card's review history in the quiz — the property this key scheme was chosen
for. `action: exclude` does drop the creator card (the title card is kept), which parks that
card's history; because the key derives from the QID, re-including the work later restores it.

## Metadata cache (2026-07-25)

`fetch_artworks_cached` persists the fetch to `cache/artworks_meta.json`, keyed by a hash of the
query-affecting config plus `_META_ENGINE_VERSION`. The banded sweep is ~60 SPARQL queries
(12 sitelink bands x 5 media types) and dominated an export at ~10 of its ~12 minutes — while
being entirely invariant to what actually changes between runs (a creator correction, a
distractor tweak). Same pattern as `deck_export`'s `cache/equation_pools.json`, and the same
central lesson: **a stale cache that silently serves old data is worse than a slow rebuild.**

Three deliberate choices follow from that:

- **The key is built by exclusion, not inclusion.** `_NON_FETCH_KEYS` names the config keys that
  provably cannot change the query (`corrections`, `distractors`, `image_*`, `deck_name`,
  `group`); everything else contributes to the hash. So a config knob added later busts the cache
  by default rather than being silently ignored. An include-list would fail the other way — the
  dangerous way — the first time someone adds a filter and forgets to register it.
- **Bump `_META_ENGINE_VERSION` when the fetch or its parsing changes** — the query shape,
  `_BAND_EDGES`, `_is_unresolved`, `_principal_creator`, `_year`, or the `Artwork` fields.
  Without it, a parser fix keeps serving results produced by the old parser.
- **Hits are logged, not silent.** Served-from-cache is exactly the state where a wrong answer
  looks like a fast one, so the export prints the entry key and engine version. `--refresh-metadata`
  (on both `deck-export` and `deck-artworks`) bypasses the read and rewrites the entry — the
  escape hatch for when upstream Wikidata itself has moved.

Cache failures are never fatal: an unreadable or unwritable cache degrades to a live fetch,
because a broken cache must not be able to break an export.

## Open questions / risks
- **Image licensing (must-resolve).** Commons images vary — most pre-20th-C paintings are
  public domain (author died >70y), but modern works (Guernica, Klimt's *The Kiss*) may be
  non-free. Filter by license metadata and/or `inception`/creator death date; a famous but
  non-free image should be **dropped from the deck**, not shipped. Decide the exact rule.
- **Fame proxy imperfections.** `wikibase:sitelinks` favours Western canon; a curated list or
  collection mode can rebalance. Duplicate QIDs / same title different attribution (Salvator
  Mundi) need dedup before card expansion.
- **Commons rate limits / dead image URLs.** Cache raw responses; exponential backoff; skip +
  warn on a missing image rather than aborting the deck.
- **Deep-catalog cost.** ≥5 sitelinks ≈ 5k works ≈ 125 MB of assets in-repo — fine on disk, but
  keep decks scoped (per-threshold or per-collection) so any single deck stays reasonable.
- **TODO — `instance_of` whitelist drops ~938 eligible works** (surveyed 2026-07-30, not yet
  acted on). `build_query` binds `?work wdt:P31 wd:{instance}` exactly, no `P279*`, so a work
  typed as anything outside the 5 listed classes never enters the candidate set — regardless of
  fame. 938 distinct works pass every *other* deck filter (P170 creator, P18 image, ≥5 sitelinks)
  and are absent. None are in the deck; the 5,552-work cache is unaffected by fame ranking here,
  the `limit: 10000` cap never bound (only 5,707 fetched).

  Wikidata's typing is inconsistent, so this cuts arbitrarily: three Sistine ceiling sibyls are
  typed `painting` and shipped, while *The Creation of Adam* on the same ceiling is typed
  `fresco` and did not. Same for the Trevi Fountain (`sculpture`, shipped) vs Christ the Redeemer
  (`monument`, dropped).

  Worst casualties by sitelinks: Statue of Liberty 156 (above *Mona Lisa*'s 146, the deck's
  current max), Christ the Redeemer 93, The Last Supper 88, Cave of Altamira 75, Washington
  Monument 70, School of Athens 61, Creation of Adam 61, The Motherland Calls 54, Lincoln
  Memorial 53, The Last Judgment 49, Elgin Marbles 47. 17 of the 938 have ≥40 sitelinks.

  Three tiers — separate scope calls, not one decision:

  | Tier | Classes (QID: works) | Total |
  |---|---|---|
  | Fine-art media | fresco Q22669139: 97, polyptych Q1278452: 21, triptych Q79218: 17, mural Q219423: 16, icon Q132137: 15, watercolour Q18761202: 14, wall painting Q99516640: 8, diptych Q475476: 6, fresco painting Q134194: 5, vase Q191851: 5, artist's book Q1062404: 4, engraving Q11835431: 3, drawing series Q19828370: 3, tapestry Q184296: 2, altarpiece Q46686: 2 | ~218 |
  | Sculpture-adjacent (consistent with `Q860861` already listed) | statue Q179700: 298, monument Q4989906: 207, memorial Q5003624: 101, fountain Q483453: 89, war memorial Q575759: 48, sculpture group Q2293362: 35, obelisk Q170980: 14, sculpture series Q19479037: 14, equestrian statue Q659396: 13, bust Q241045: 13, relief Q245117: 9, architectural sculpture Q3476515: 1 | ~700 |
  | Modern forms | installation art Q20437094: 21, poster Q429785: 8, land art Q326478: 1 | ~30 |

  Tier 1 is unambiguously in scope. Tier 2 is where the deck's character shifts — `memorial` /
  `war memorial` pull a long tail of civic monuments famous in one country only, so raise
  `min_sitelinks` for that tier rather than reusing the flat 5. Adding classes is
  history-safe (item strings are `<QID>|attr`) and additive; cost is the Commons download at
  ~36/min (~6 min for tier 1, ~30 min for all).

  **Survey is a floor, not a census** — only 48 curated media terms were checked. Exhaustive
  enumeration needs to run outside the sandbox: WDQS 504s on wide `P170` aggregates and
  `P279*` traversals (`Q4502142`'s closure is 172k classes, useless as a filter), and the
  sandbox proxy truncates HTTP responses at 32 KB. Do NOT fix this with `P31/P279*` — the
  closure is far too broad and the banded queries already strain WDQS.

## Non-goals (v1)
- Non-free images (dropped, not shipped).
- Media types outside `instance_of` — currently painting, sculpture, drawing, print, photograph
  (broadened from paintings-only 2026-07-24). See the coverage-gap TODO above for what this
  still excludes and why it is not just a config edit.
- Any quiz-time fetch — this pipeline is the only place the network is touched.
