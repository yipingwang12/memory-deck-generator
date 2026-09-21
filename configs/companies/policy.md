# Company MCQ authoring policy

You are writing **multiple-choice cards about a company**, for a spaced-repetition deck. One
company is one deck. The reader is job-hunting in a specific market and wants to walk into a
conversation knowing who founded the place, what its platform is called, what it actually
does, and who it is connected to.

This policy is the company counterpart to `configs/papers/policy.md`. The card mechanics,
distractor discipline and stem style below are the same. **Three things are different, and
they are the whole reason this is a separate pipeline.**

## 1. The source decays, so `checked` is load-bearing

A paper is frozen. A company is not. Within the research window for the first deck in this
directory, Verve Therapeutics was acquired, Arena BioWorks shut down entirely, and Inari cut a
third of its workforce. A verbatim quote proves the card matches **the snapshot**, not that it
is still true.

So every audit row carries `checked`, the ISO date the fact was last verified against a live
source, and `deck-companies` reports any card past the config's `recheck_months`. Run
`deck-companies --config <cfg> --stale` periodically; it is a maintenance sweep, not a build.

**A stale card is not automatically wrong** — Alnylam's founders will not change. Staleness is
a prompt to look, weighted by category: `funding` and `people` rot fastest, `history` and
`platform` barely at all.

## 2. Volatility is a property of the fact, and volatile facts are refused

A cash balance, a quarterly revenue figure, a headcount, a runway date, a share price: all
knowable, all wrong within two quarters. A card asserting one costs the reader reviews of a
false statement forever, and the reader has no way to notice.

`volatility: volatile` on a shipped card is a **build failure**, not a warning.

Extract volatile facts into `<slug>.facts.jsonl` anyway — marked `volatile`, so the research
is complete, so they are excluded from the coverage denominator, and so a later pass can see
they were considered and deliberately not carded. They live in the dossier, which is for
judgement. They do not live in the deck, which is for memory.

| Card it | Do not card it |
|---|---|
| Founding year, founders, the lab or firm it came out of | Cash, runway, burn |
| Platform and product names | Quarterly or annual revenue |
| Modality, target class, mechanism | Headcount |
| Headquarters town | Valuation, share price |
| Who acquired whom, and when | "Currently hiring for X" |
| Named partnerships and their counterparties | Anything with "as of Q2" in it |
| Who leads the relevant technical group | A guidance range |

Borderline: a **round** is durable (the Series A happened and will always have happened); a
**total raised** is volatile (it goes up). Card the round, not the total.

## 3. There is no DOI, and the source text is ours

The item namespace is an authored `namespace` string — `company:<slug>`. It must never change
once a card has been studied.

The source snapshot is our own research prose, not third-party full text, so unlike a paper's
`source.txt` it is **committed** and a fresh clone can always build. There is therefore no
`--no-verify-quotes` escape hatch.

## Output — four committed files

`<slug>.facts.jsonl` — the extraction pass, written **before** any question exists. One row
per distinct fact; the durable ones are the denominator `build` measures density against:

```json
{"id": "f03", "category": "history", "volatility": "durable",
 "fact": "Roche acquired Foundation Medicine in 2018 and runs it as a subsidiary",
 "quote": "Roche acquired Foundation Medicine in 2018 and has operated it as a subsidiary since."}
```

`<slug>.curated.jsonl` — what `build` consumes. Same shape as the paper pipeline's.

`<slug>.audit.jsonl` — provenance, same `qid`, checked by `build`:

```json
{"qid": "q03", "quote": "Roche acquired Foundation Medicine in 2018 and has operated it as a subsidiary since.",
 "category": "history", "type": "history", "volatility": "durable", "checked": "2026-09-21",
 "reason": "the acquisition and its date; distractors are the other three Boston acquirers in the dossier",
 "decision": "keep"}
```

`<slug>.source.txt` — the research snapshot every quote is verified against.

- **Every card appears in curated and audit exactly once, with matching `qid`.**
- `quote` must be **copied character-for-character** from the source snapshot.

## `qid` is an identity, not a number

Item string is `<namespace>|<qid>`, and `item_key = sha256(item)[:16]` is the card's primary
key across the whole app. So `qid` is assigned once and never changes — not when you reorder
cards, not when you reword a stem, not when you swap a distractor. Numbering is append-only; a
deleted card leaves a hole. Never renumber from scratch: reconcile against the committed file
first.

This matters more here than for papers. Company facts get **corrected** — a founding date you
had slightly wrong, a platform renamed. Rewording the stem is the right fix and costs nothing.
Regenerating the deck because a fact changed is what strands history.

## What to ask about

| `type` | Asks | Example |
|---|---|---|
| `history` | founding, acquisition, lineage | which three people founded it |
| `platform` | the named technology and what it does | what JAM stands for and what it designs |
| `product` | assay, asset, modality, indication | which tumour types the flagship assay covers |
| `funding` | a specific round, investor or partnership | which pharma partner the billion-dollar deal is with |
| `people` | who leads the relevant technical group | who runs Computational Discovery |
| `location` | where the work actually happens | which town, where that matters for a commute |

**Do not ask** about: anything volatile (above), marketing language the company uses about
itself, sector-level facts true of any company in the space, or anything whose answer is a
judgement rather than a fact.

A card must be answerable from the snapshot and **wrong-answerable by someone who half-knows
the market**. "Is Foundation Medicine a cancer diagnostics company?" is answerable from the
name. Drop it.

## Distractors — the actual work

The dossier's own breadth is the distractor pool, and it is a good one: 83 employers supply
natural same-category wrong answers. Draw from:

- **Swapped company** — the true fact about a *different* company in the dossier. The
  strongest distractor type available here, and the one that makes the deck teach the map
  rather than one entry.
- **Right lineage, wrong person** — another founder from the same institution.
- **Plausible unclaimed capability** — something the platform could reasonably do and does not.
- **Neighbouring true fact** — true of this company, but not the answer to *this* stem.
- **Wrong era** — the right event at the wrong date, where the date is the point.

Never use a distractor that is absurd, off-market, or from another industry.

### Structural rules — a card must not be answerable on shape

Same discipline as the paper policy, for the same reasons.

- **Options are homogeneous** — same grammatical form, same kind of thing, comparable
  specificity. Three person-names and one company name is a giveaway.
- **Options are comparable in length.** `build` flags a deck whose answers run materially
  longer than its distractors.
- **No "all of the above", "none of the above", "both A and B"**, and no option that merely
  negates another.
- **No absolutes** in distractors — `always`, `never`, `only` read as false on sight.
- **The stem is positive and self-contained.** The card is shown with no surrounding text, so
  name the company in the stem. Never "which of the following is NOT…".
- **No cueing** — do not repeat a distinctive word from the answer in the stem.
- **Options are unique and non-overlapping.**

A specific trap for this deck type: **do not let one company's cards all share a distractor
set**. If every Foundation Medicine card offers the same four founder names, the reader learns
the option list rather than the fact.

## Stem style

- One sentence, ending in a question mark. **Name the company** — the reader studies many
  company decks and a bare "who founded it?" is unanswerable out of context.
- No citation markers, no "according to the dossier", no references the reader cannot see.
- Dates and numbers as the source gives them, with any hedge preserved.

## Coverage — the company sets the card count

**One card per distinct durable fact.** A company with twenty durable facts earns twenty cards;
one with four earns four. Never truncate to a round number and never pad. `build` compares the
shipped cards against the durable rows in `<slug>.facts.jsonl` and warns below 75% coverage, so
**the extraction pass is where density is decided**.

Expect roughly 4 cards for a thin entry and 12–15 for a deeply researched one. That spread is
correct and should not be flattened.

## `decision`

`keep` ships the card. `drop` records one considered and rejected, with the `reason`, so the
same weak question is not re-proposed next pass. Dropped rows stay in the audit file and are
excluded from `build`.

## Worked examples

**Good — swapped company as the distractor set**

> **stem** Which three people founded Foundation Medicine in 2010?
> **answer** Todd Golub, Levi Garraway and Eric Lander
> **distractors** David Liu, Feng Zhang and Keith Joung · Phillip Sharp, David Bartel and
> Thomas Tuschl · Emmanuelle Charpentier, Rodger Novak and Shaun Foy
>
> Every distractor is a real founding trio of another company in the same dossier (Beam,
> Alnylam, CRISPR Therapeutics). A reader who half-knows the market must actually distinguish
> them, and getting it wrong teaches a second company.

**Bad — volatile, and refused by `build`**

> **stem** How much cash did Beam Therapeutics hold at 30 June 2026?
>
> True on the day it was written, false by the card's third review, and the reader cannot tell.

**Bad — answerable from the name**

> **stem** What does Foundation Medicine's FoundationOne CDx test analyse?
> **answer** Tumour genomics
>
> Guessable from the company name and the product name together. Ask which tumour types it is
> approved as a companion diagnostic for, which is a fact rather than a category.
