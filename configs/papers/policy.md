# Paper MCQ authoring policy

You are writing **multiple-choice cards about what a scientific paper found**, for a
spaced-repetition deck. One paper is one deck. The reader has read the paper once and wants
its results to stay recallable a year later.

Unlike every other deck in this repo, there is **no oracle**: Wikidata, CC-CEDICT, sympy and
MTD can each be re-queried to check a card, and nothing can re-derive a question. The paper is
the only authority, so **every card carries the verbatim sentence that supports it** and
`build` refuses any card whose quote is not found in the source text. Write the quote first
and the question from the quote — never the other way round.

## Output — three committed files

`<slug>.claims.jsonl` — the extraction pass, written **before** any question exists. One row
per distinct finding; this is the denominator `build` measures density against:

```json
{"id": "c07", "section": "results",
 "claim": "Anchor filtering by shared-neighbour consistency removed anchors between non-overlapping populations",
 "quote": "we score each anchor based on the consistency of its shared neighbors, downweighting anchors between cells in non-overlapping populations"}
```

Then two files, one object per card, in the same order:

`<slug>.curated.jsonl` — what `build` consumes:

```json
{"qid": "q07",
 "stem": "In the Seurat v3 benchmark against mutual nearest neighbours, what did filtering anchors by shared-neighbour consistency change?",
 "choices": ["Removed incorrect anchors between non-overlapping populations",
             "Increased the number of anchors recovered per cell",
             "Reduced runtime on datasets above 100,000 cells",
             "Eliminated the need for canonical correlation analysis"],
 "answer": "Removed incorrect anchors between non-overlapping populations",
 "label": "Results · anchor filtering"}
```

`<slug>.audit.jsonl` — provenance, same `qid`, never read by `build`'s output path but checked
by it:

```json
{"qid": "q07",
 "quote": "we score each anchor based on the consistency of its shared neighbors, downweighting anchors between cells in non-overlapping populations",
 "section": "results",
 "type": "finding",
 "reason": "the scoring step's stated purpose; the three distractors are the plausible-but-unclaimed benefits (more anchors, speed, replacing CCA)",
 "decision": "keep"}
```

- **Every card appears in both files, exactly once, with matching `qid`.**
- `quote` must be **copied character-for-character** from the paper. Do not fix typography,
  expand abbreviations, or join sentences with an ellipsis.

## `qid` is an identity, not a number

The item string is `<doi>|<qid>` and `item_key = sha256(item)[:16]` is the card's primary key
across the whole app. So:

- **`qid` is assigned once and never changes.** Not when you reorder cards, not when you
  reword a stem, not when you swap a distractor. Rewording a stem is fine and expected;
  changing its `qid` strands that card's entire review history.
- **Numbering is append-only.** New cards take the next unused number. A deleted card leaves
  a hole — never reuse `q07` for a different question.
- **Never derive `qid` from position.** If you regenerate a deck from scratch you must
  reconcile against the committed file, not renumber from 1.

## What to ask about

Ask about **results**: what was measured, what it showed, how it compared, which direction and
roughly how much. Card types, in rough priority:

| `type` | Asks | Example |
|---|---|---|
| `finding` | what the analysis showed | which population the method recovered that the baseline missed |
| `comparison` | this method vs that, this condition vs that | which of two integration methods preserved rare cell types |
| `quantity` | an effect size, n, threshold, parameter | how many cells the benchmark spanned |
| `design` | a methodological choice **whose rationale the paper states** | why anchors are scored before weighting |
| `limitation` | a stated caveat or failure case | the condition under which the method degrades |

**Do not ask** about: background the paper cites from others, author or journal metadata,
protocol minutiae with no bearing on a result (catalogue numbers, software versions), or
anything whose answer is "it depends" in the paper's own words.

A card must be answerable from the paper and **wrong-answerable by someone who half-remembers
it**. If a well-prepared reader could get it right without having read this paper, it is
testing general knowledge, not this result — drop it.

## Distractors — the actual work

The correct option is easy; the deck is only worth studying if the wrong ones are live. Draw
distractors from the **claim's own space**:

- **Wrong direction** — the effect reversed (increased/decreased, improved/degraded).
- **Swapped arm** — the result that belongs to the *other* condition, method, or dataset.
- **Right number, wrong quantity** — a real figure from the paper attached to the wrong thing.
- **Plausible unclaimed benefit** — something the method could reasonably do and the paper
  never says it does. (The example above uses three of these.)
- **Neighbouring result** — a true statement from a different part of the paper that does not
  answer *this* stem.

Never use a distractor that is simply absurd, off-topic, or from another field. A reader who
can eliminate two options on sight is answering a 2-option question.

### Structural rules — a card must not be answerable on shape

This repo has been bitten by shape twice: artwork creator cards had to match **answer shape**
because a two-name answer among one-name options is pickable without knowing the artwork, and
vocab glosses need band-scoped distinctness because an ambiguous tile is unanswerable. Same
discipline here.

- **Options are homogeneous** — same grammatical form, same kind of thing, comparable
  specificity. Do not mix a mechanism with a number with a cell type.
- **Options are comparable in length.** The longest option must not be the answer as a habit;
  `build` flags a deck whose answers run materially longer than its distractors.
- **No "all of the above", "none of the above", "both A and B"**, and no option that merely
  negates another — a pair of opposites tells the reader the answer is one of the two.
- **No absolutes** (`always`, `never`, `all`, `only`) in distractors — they read as false on
  sight. If the paper genuinely claims an absolute, that belongs in the answer, not a
  distractor.
- **The stem is positive and self-contained.** No "which of the following is NOT…", no "which
  is true?" with unrelated options. State the specific question; a reader should be able to
  answer it before looking at the options.
- **No cueing from the stem** — do not repeat a distinctive word from the answer in the stem,
  and keep grammatical agreement identical across options.
- **Options are unique and non-overlapping.** Two options that could both be defended is a
  broken card, not a hard one.

## Stem style

- One sentence, ending in a question mark. Name the specific comparison or measurement.
- Enough context to stand alone: the card is shown with no surrounding text, so
  "what did filtering change?" is unanswerable — say what was filtered and in what benchmark.
- No citation markers, no figure references the reader cannot see (`as shown in Fig 3B`), no
  meta-discourse ("according to the authors").
- Numbers with units. Where a quantity is approximate in the paper, keep its hedge.

## Coverage — the paper sets the card count, not a target range

**One card per distinct finding.** A paper with forty findings earns forty cards; a paper with
six earns six. There is no range to hit and nothing to pad to, in either direction:

- **Never truncate to a round number.** A finding dropped to fit a quota is a finding the
  reader will not learn, and nothing downstream records that it existed.
- **Never pad.** A weak card costs the reader daily reviews forever.
- **A long deck is not a problem.** Daily intake is paced by `study.json`'s shared `Papers`
  collection budget, so a sixty-card paper is a longer introduction, not a flood.

This is measured, not trusted. `build` compares the shipped cards against `<slug>.claims.jsonl`
— the extraction pass's findings — and reports any finding with no card, warning outright below
75% coverage. So **the extraction pass is where density is decided**: an incomplete extraction
produces a small deck that looks fully covered. Be exhaustive there and the card count follows.

Combine near-duplicate questions rather than shipping both; the combined card covers both
claims, and one of them will then read as uncovered — say so in the survivor's `reason`.

**Weight to Results.** Methods and Discussion cards are legitimate where the paper states a
rationale or a limitation, but a deck more than about a third non-Results has drifted off the
findings and `build` says so. Report the section mix honestly in `section` — the check is only
as good as that field.

## `decision`

`keep` ships the card. `drop` records one you considered and rejected — with the `reason` — so
the same weak question is not re-proposed on the next pass. Dropped rows stay in the audit
file and are excluded from `build`.

## Worked examples

**Good — swapped arm and wrong direction as distractors**

> **stem** In the pancreatic islet benchmark, how did Seurat v3 integration affect clustering
> by donor versus by cell type?
> **answer** Cells clustered by cell type rather than by donor
> **distractors** Cells clustered by donor rather than by cell type · Cells clustered by both
> donor and cell type at similar strength · Donor effects were removed only after regressing
> out cell-cycle genes
> **quote** *"following integration, cells clustered by cell type rather than by donor"*

**Bad — answerable on shape and on general knowledge**

> **stem** Which of the following is true of the method?
> **answer** It uses canonical correlation analysis followed by L2-normalization to project
> datasets into a shared subspace defined by correlation structure
> **distractors** It is fast · It is written in R · None of the above

The stem is vague, the answer is three times the length of every distractor, one distractor is
"none of the above", and nothing tests a result.

**Bad — tests the field, not the paper**

> **stem** What does scRNA-seq measure?

Correct without reading anything. Drop.
