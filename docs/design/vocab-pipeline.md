# Vocab pipeline (`deck-vocab`) — Chinese, German, Polish

Frequency-ranked expansion of the `memory-quiz-app` hanzi↔meaning **matching** deck
(`vocab_chinese_common`), 267 → 5257 words (2026-07-23).

## Why a curation tool, not a generated deck

The deck is **`source: manual`** — a load-bearing contract: it's protected from the
`deck-export` full-clear (`deck_export._is_manual`) *and* the orchestrator's `decks` sync,
and it carries live FSRS history (`item_key = sha256(hanzi)[:16]`). So it is **not** a
first-class generated deck (which a full re-export would rebuild non-deterministically).
Instead, like the equations deck: heavy lifting → **committed data** → deterministic
`build`. The seed 267 are frozen **byte-identical** (hanzi unchanged → FSRS keys survive).

## Data sources (both free)

- **wordfreq** — frequency ranking (`top_n_list('zh', …)`).
- **CC-CEDICT** — pinyin + glosses, **CC-BY-SA 4.0** (attribution + share-alike on the
  artifact; `cache/cedict_ts.u8`, fetched from mdbg.net).

## Stages

1. **Seed** — existing 267 rows, frozen verbatim (`vocab.load_seed`).
2. **Rank + route** (`vocab.rank_candidates`) — wordfreq-ranked hanzi in CC-CEDICT minus the
   seed. Each candidate is **clean** (single reading, ≤3 senses → CEDICT first-gloss is
   safe, ~63%) or **needs-LLM** (polyphone ∪ multi-sense ∪ function-word signal, ~37%).
   The router exists because CEDICT's *first* sense is often wrong for the frequent use
   (被→"quilt" not the passive marker; 更→gēng not gèng).
3. **Adjudicate** (needs-LLM only) — an **audited** per-word pass picks the frequency-correct
   reading + sense and writes one short gloss, logging the choice + reason to
   `*.audit.jsonl`. Policy: `configs/vocab/chinese_common.policy.md`. Keep grammatical words
   with functional glosses (被 "by (passive marker)"); drop only surname/variant-only
   non-words. The 5k run used a fan-out of 19 subagents over frequency-band chunks
   (in-session, no API key); a Batch-API path is equivalent.
4. **Assemble** (`deck-vocab build`, deterministic, offline) — merge seed + clean + curated,
   order by wordfreq rank (item_key is hanzi-hash → position-free), verify no duplicate
   hanzi + **band-scoped gloss uniqueness**, stamp the envelope (`source: manual`).

## Band-scoped gloss uniqueness

English has no 5000+ distinct short glosses, so global gloss uniqueness (the old 267-word
invariant) is impossible. But a matching **round** only ever co-displays words within one
frequency band — `matching.plan_rounds` stable-sorts the due set by `freq_band`
(`FREQ_BAND_SIZE = 30`) before chunking into rounds. So glosses only need to be unique
within any `FREQ_BAND_SIZE` window of the frequency-ordered deck (`vocab.band_collisions`;
quiz-side `test_no_ambiguous_round_band_scoped`). The 5k build had 4 residual near-synonym
collisions (每/各 "each", 力量/权力 "power", …), fixed with disambiguating tags → 0.

## CLI

```
deck-vocab                      # preview: clean/needs-LLM split (no writes)
deck-vocab --curate             # prepare needs-LLM chunk files for the adjudication pass
deck-vocab --build              # assemble committed curated rows → artifact (deterministic)
```

Committed data: `configs/vocab/chinese_common.{yaml,curated.jsonl,audit.jsonl,policy.md}`.
`build` reproduces the exact artifact shipped in `memory-quiz-app/data/decks/`.

## Extending to 10k

Raise `target_n`; re-run route → adjudicate the new needs-LLM words → rebuild. The seed +
existing curated rows stay frozen; only new words are adjudicated.

## Inflected languages — German and Polish (2026-11-08)

`configs/vocab/{german,polish}_common.yaml` (`lang: de` / `lang: pl`) run the same
curate-then-assemble contract from a different source: **wordfreq × Wiktionary**, read from
the kaikki.org extracts (`cache/kaikki_<code>/`, ~95 MB gzipped each, gitignored; kaikki.org
is not Wikimedia, so no `wiki-open` window). Code: `vocab_kaikki.py`.

### Stages

1. **Lexicon** (`load_lexicon`) — one streaming pass over the extract. Keeps every lemma
   entry of a kept part of speech (no proper names, affixes or phrases; no multi-word
   lemmas) as one record per POS (`glosses`, `gender`, `plural`, `plural_only`, `aspect`,
   `partner`), with obsolete/archaic/dialectal/Middle-Polish senses removed. Indexes the
   **wanted** surface forms (wordfreq's top `surface_n`) to their lemmas from two sources:
   single-token inflection-table forms (`source: declension|conjugation`) and form-of/alt-of
   entries. Head forms without a `source` are **other words** (aspect partner, diminutive)
   and are never indexed. A derived cache `lexicon_n<N>_v<V>.json` makes re-runs ~instant —
   bump `_LEXICON_VERSION` when the parse changes.
2. **Rank** (`rank_lemmas`) — a lemma's score is the sum of its surface forms' wordfreq
   frequencies. A form shared by several lemmas is split (`_split_frequencies`): evenly at
   first, then for three rounds **in proportion to what each lemma earns from its other
   forms**. A preposition/conjunction/particle/adverb/interjection/numeral whose citation
   form IS the surface claims the full frequency, because it has no other forms by nature.
3. **Route** — needs-LLM = function word ∪ multi-POS ∪ >3 senses ∪ **aspect pair** (Polish
   pair shares one English gloss) ∪ **shared evidence** (>50% of the score held as a
   minority share of shared forms) ∪ **case twin** (another lemma differs only by
   capitals). Clean rows take the first gloss, parentheticals removed, two synonyms at most.
4. **Adjudicate** — `deck-vocab --config … --curate` writes `chunk_NN.json` under
   `data/decks/vocab_chunks/<lang>/`; the audited pass writes `chunk_NN.out.jsonl` beside
   each, per `configs/vocab/<lang>_common.policy.md`. Each record carries `evidence` (top
   shared forms + who else claims them) so the pass can drop a word whose rank is borrowed.
5. **Merge** (`--merge`) — clean + adjudicated rows in rank order → committed
   `*.curated.jsonl` (`word`/`hint`/`gloss`/`source`) + `*.audit.jsonl`. Refuses a missing
   word. Drops come off `target_n`. Adjudicated rows = the committed audit first, then the
   chunk outputs oldest file first, so a newer adjudication of a word replaces an older one
   (by file time, not file name). A clean row no `--review-clean` pass has read gets
   `source: kaikki-unreviewed`.
6. **Build** — the shared `build`: unique words, band-scoped gloss uniqueness, artifact with
   `items`/`hints`/`labels`, `lang`, and `source: manual`.

### What the preview runs found (and the rule each produced)

| Symptom | Cause | Rule |
|---|---|---|
| `einen` "to unite" at rank 17 | even split of the article's forms | proportional split + shared-evidence routing |
| `der` credited to `anderer`, `sieben` to `durchsieben` | split table forms (`der andere`, `siebe durch`) read as separable stems | skip every multi-token form |
| `od` (from) lost to `oda` (ode) | an indeclinable word has no other forms to earn from | citation claim for indeclinable POS |
| `vier` lost to `Vier` | numeral not in the claim set | numerals claim too; case twins go to the LLM |
| `stary, ale jary` as a card | multi-word lemma's table lists `stary` | multi-word lemmas are not cards |

Preview split at `target_n: 5000`: **German 3299 clean / 1701 LLM**, **Polish 2627 clean /
2373 LLM**. Particle verbs (`anfangen`) rank from their joined forms only (`anfangen`,
`angefangen`, *dass er anfängt*), so they rank somewhat low; that is the price of not
inflating every rare particle verb.

### Hint line

The quiz shows the hint below the word (`hints` array; Chinese keeps `pinyin`):
German noun `der, pl. Tische` (article only with no plural; `die (pl.)` for plural-only);
Polish noun `m.`/`f.`/`n.` or `pl. only`; Polish verb `impf. ↔ zrobić`; else a POS
abbreviation (`conj.`, `v.`, …). **Aspect pairs are two cards** — the policy tags the
perfective's gloss so the pair stays apart in a round.

### Identity

`item_key = sha256(word)[:16]`, with capitals: `Essen` and `essen` are two cards. The
config pins `config_path` (the quiz's sessions key) and `license`, so a rebuild cannot
strand history — the Chinese config now pins its shipped values too (they had drifted
from what `build` wrote: `manual/chinese_common.yaml` vs the shipped
`manual/vocab_chinese_common.yaml`).

### German capitalisation — the noun-plural verb problem (2026-11-09)

wordfreq lowercases, which erases the capital that marks a German noun. After lowercasing,
nearly every form of a noun such as *Schule* is also a form of the verb *schulen*
(`schule` = *die Schule* / *ich schule*; `schulen` = *die Schulen* / *schulen*), and the
verb alone owns a few rare forms (`schulte`). The proportional split rewards forms of
its own, so it handed the verb almost everything: `schulen` rank 354 vs *Schule* 959,
*Ende* 1461 behind `enden` 162, *Arbeit* 1275. In the top 5000, 368 verbs earned >60% of
their score from forms shared with a noun, and 276 of those nouns ranked below their verb.
The shared-evidence flag pointed the wrong way (the verb held the majority share).

**Fix — case split from a case-preserving corpus.** `case_shares` reads the Leipzig
Corpora Collection word list (`deu_news_2024_1M-words.txt`, CC BY 4.0, gitignored under
`cache/leipzig_de/`; config `case_counts`) and gives, per lowercase form, the share of
uses written with a capital, minus the sentence-initial baseline measured on forms that
can be no noun (~5%): `Ende` 10288 vs `ende` 22. `rank_lemmas(case_shares=…)` splits a
mixed-case form before the proportional split: capitalised share → capitalised lemmas,
the rest → the others.

**Guard — only against words that seldom start sentences.** The split applies only when
every lowercase lemma is a verb, adjective or numeral (verb-second order keeps verbs off
sentence starts). Function words, adverbs and interjections start sentences far above the
baseline, so `Aber`, `Ja`, `Hallo`, `Jetzt` would otherwise borrow their capitals; those
forms keep the plain split. Cost: *Morgen* (morning) stays behind *morgen* (tomorrow).

**Safety net.** A lowercase verb that still earns >50% of its score from forms shared with
a capitalised noun *without* case data is flagged `noun_collision` and sent to the LLM
with the noun named.

Result (top 5000): *Ende* 1461→173, *Arbeit* 1275→186, *Frage* 929→138, *Folge*
3027→302; `schulen` 354→3774, `punkten`/`grenzen` out; `spielen`, `glauben`, `wissen`
unchanged. 79 words swapped in the top 1000 (nouns in, borrowed-rank verbs out).
`--merge` now sets aside adjudications for words a re-rank moved past `target_n` instead
of failing, so they wait for the deck to grow.

### Lemma counts in context — measured shares (2026-11-09)

The kaikki form index is a dictionary lookup: it lists every lemma a lowercase form *can*
be, never which one it *is*. wordfreq has no sentences, so a contextual lemmatiser cannot
run on it. The split rules above (proportional split, citation claim, case split, LLM
flags) all guess what context would show.

**Design — measure the split, keep wordfreq's frequencies.** `deck-vocab --tag-corpus`
(module `vocab_lemmas`) lemmatises a sample of a Leipzig news corpus and caches
`surface, lemma, POS, count` rows (config `lemma_corpus`, `lemma_counts`; gitignored
under `cache/lemma_counts/`). `vocab_kaikki.measured_shares` maps each tagger
(lemma, POS) to a kaikki headword and gives, per form, the share of its uses that is
each headword. `rank_lemmas(measured=…)` splits a measured form by those shares; the
case split and the proportional split apply only to forms without enough data
(< 20 mapped uses, or < 50% of uses mapped). wordfreq stays the frequency source: a
news corpus over-ranks *Regierung* and under-ranks *Mama*, but the *split* of a form
between its lemmas is much less genre-bound.

**Taggers.** German: spaCy `de_core_news_md` with the parser — a `svp` child joins a
separable particle to its verb (*fängt … an* → *anfangen*), which the one-token form
index cannot see. 1M sentences ≈ 11 min. Polish: Stanza (PDB models in `cache/stanza`):
spaCy's Polish lemmatiser left capitalised forms unlemmatised (*Robię*) and read every
*lata* as *rok*; Stanza tells *lata* (flies, → latać) from *lata* (years) by context.
300k sentences ≈ 40 min. Both are the optional `lemmas` extra. About 2% of the Polish
corpus lines are double-encoded (*te¿* for *też*); `skip_chars` drops them. Leipzig
files are sorted alphabetically, so the sample takes every k-th line.

**Mapping rules** (`_headword`), each from a preview failure:
- an adjective, adverb or pronoun form that is its own kaikki headword keeps its uses
  (the tagger reduces *später* → *spät*, *erste* → *erster*, and — the UD convention —
  *ona*/*oni*/*ono* → *on*). It brings in oblique pronoun forms too (*nich*, *nim*);
  the policy drops those. Not for verbs: *jestem* (I am) is also the interjection
  "present!", so a verb-form headword cannot be told from the verb;
- an exact headword is accepted even when the form index does not list it for the form
  (*anfangen* for `fängt`);
- a capitalised lemma may map to the form's lowercase headword, never the reverse — in
  German a capital marks a noun (*erster* ≠ *Erster*).

**German tagging rules** (`de_token_lemma`): skip a sentence's first token and any token
after punctuation other than a comma — a question starts with its verb and quoted speech
starts mid-sentence, and the tagger reads those capitals as nouns (*Muss*, *Ich*,
*Bitte*); a capitalised *sie*/*ihr* inside a sentence is formal (*Sie*, *Ihnen* → *Sie*).
Single capital letters (*S*, *D* from abbreviations) are never ranked.

**`unmeasured`** (config list): verb forms used mostly as formulas, which the tagger reads
as the verb — Polish *proszę* (please → prosić), *dziękuję*, *przepraszam*, *słucham*,
*znaczy*. They keep the heuristic split, where the interjection claims its own form.

Result vs. the heuristic ranking (top 1000 overlap): German 922, Polish 946. Shared-form
LLM flags: German 197 → 33, Polish 132 → 3. Polish gains *wszystko* 2741→85, *warto*
(not the river *Warta*), *temu*, *dane*; *lat* goes to *rok* (years), not *lato*.

**Participles.** An adjective that a verb lists as one of its forms is flagged
`participle_of` for the LLM: drop a plain "verb-ed" (*durchgeführt*), keep one with its
own meaning (*ausgezeichnet*, *zmęczony*). Verbal uses (*wurde durchgeführt*) already go
to the verb through the measured shares.
