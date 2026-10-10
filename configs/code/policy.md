# Source-file MCQ authoring policy

You are writing **multiple-choice cards about one source file**, for a spaced-repetition
deck. One file is one deck. The reader has to maintain this file, did not write it, and
cannot afford to re-read it from scratch every time they touch it.

The sibling of `configs/papers/policy.md`, and everything structural there holds here:
**no oracle**, so every card carries a verbatim quote and `build` refuses a card whose quote
is not in the file; `qid` is append-only identity; options must be homogeneous, comparable in
length, and free of "all of the above". Read that file's *Distractors* and *Structural rules*
sections — they are not restated here. What follows is what differs for code.

## The data is governed

A code card quotes work-repo source. Its config, JSONL rows and built artifact live in a
**gitignored** directory under the consuming repo (`code-drill/decks/`), never in this repo,
never in `memory-quiz-app/data/decks/` (committed and deployed to fly.io). This repo holds the
machinery and this policy — no cards.

## Which files — executable code only

Only executable source (`.py`, `.R`, `.sh`) gets a deck. **Never** test code (`test_*`,
`*_test.*`, `tests/`, `testthat/`, `conftest.py`), docs (`.md`, `.txt`, `.rst`), data or config
(`.json`, `.tsv`, `.csv`, `.yaml`) or tooling dirs (`.github/`, `.claude/`). `deck-code-mcq`
refuses them (`code_mcq.scope_refusal`, mirror of code-drill's `scope.py`).

## When — MCQs follow AI notes

A file gets an MCQ deck **if and only if** its AI notes (code-drill `annotations/`) cover it
as it is now. Notes always cover a whole file, so this never leaves a deck over half a file.

- **Only if**: `build` refuses when code-drill's `code_ai_explanation_*.json` for the file is
  missing from the deck dir or covers another version.
- **If**: once notes are exported, the file owes a deck — `code-drill next` lists it under
  `MCQ  no MCQ deck`.
- MCQs earn no intake credit; the notes quota sets the pace.

## After the file changes — review every card

`reviewed_sha256` in the config is the file version (raw sha256) every card was last checked
against. A changed file refuses `build` until it matches again — and its notes come first.
`code-drill next` lists such a file as `MCQ  MCQ review owed` once its notes are current.

1. Diff the reviewed version to now (find it by hash, as the `code-notes` skill does).
2. Check **every** card against the new file, not only those on changed lines — a change
   elsewhere can falsify a stem, an answer or a distractor.
3. Per card: still true → keep (fix a quote that moved). Wording wrong → reword stem or
   choices, same `qid`. Asks about removed or rewritten behaviour → `decision: "drop"` with a
   `reason`, off curated; its review history ends, which is right.
4. Add cards for new or changed behaviour, continuing from the highest `qid` ever used.
5. Set `reviewed_sha256` to `shasum -a 256 <file>`, then build.

## Style — ASD-STE100

Stems and choices follow the same Simplified Technical English as the AI notes:

- **≤ 20 words per sentence for a procedure, ≤ 25 for a description.** `build` refuses > 25
  (a `backticked` code span counts as one word).
- One idea per sentence. Active voice, present tense, simple words.
- A stem is one question, plus at most one context sentence before it.
- Choices are short noun phrases or single sentences, parallel in grammar (the paper policy's
  homogeneity rule) — STE makes that easier, not harder.

## What to ask about

The file sets the card count; every function earns at least one card and `build` fails if one
does not. Five sections, all first-class — there is no home section to drift out of:

| `section` | Asks about | Example |
|---|---|---|
| `structure` | what the module is for, what it deliberately does not do, why it is shaped this way | why the ICA label is built from library ids rather than specimen ids |
| `function` | one function's purpose, inputs, return shape, failure mode | what `arm_of` raises on, and on what input |
| `expression` | what a specific dense line evaluates to | what `set(RATIO_BY_SUFFIX) - arms` computes |
| `variable` | what a constant or major local governs, and its units or shape | whether `Tumor%` holds `0.6` or `60` |
| `integration` | how this file is used by, or uses, the rest of the repo | why an apparently unused import is re-exported |

And five `type`s: `purpose`, `contract`, `semantics`, `integration`, `gotcha`.

**`gotcha` is the type that earns the deck.** A subtlety that reads as something else: a
`break` that means "the table ended" where a `continue` means "blank row"; a closure defined
inside a loop; a dict keyed by one field specifically so a join cannot slip; an import kept
only for re-export. If you find yourself writing "obviously" in a `reason`, that card is
probably a `gotcha` in disguise and worth keeping.

**Do not ask** about: anything answerable from Python in general rather than from this file
(*what does `defaultdict` do?*), formatting, import ordering, or a line's line number. The
test is the paper policy's test, transposed: **a strong Python programmer who has never seen
this file must not be able to answer it.**

## Quoting code

- The quote is the **line or lines the card is about**, copied character-for-character.
  Whitespace is normalised before matching, so indentation need not be preserved exactly —
  everything else must be.
- Quote the **smallest span that carries the point**: one line for an expression card, the
  `def` line plus the line that matters for a contract card, the docstring sentence for a
  purpose card.
- A quote lands the card on a function: `build` maps each quote back to the enclosing
  function and reports which functions carry no card. Quoting a constant for a card that is
  really about a function will show up as an uncovered function — fix the quote, not the check.

## Stems that stand alone

The card is shown with no file open. Name the function or the constant in the stem, and give
enough context to answer without scrolling:

> **Good** — In `read_spec_triplets`, what ends the parse loop when a row's Analysis Label
> does not match `LABEL_RE`?
>
> **Bad** — What does the loop do here?

Show a code fragment in the stem when the card is about that fragment. Keep it to one line;
if the reader needs three lines of context to answer, the card is really two cards.

## Distractors, for code specifically

Beyond the paper policy's five kinds, the ones that bite in code:

- **The other control-flow verb** — `break` where the answer is `continue`, `return` where it
  is `raise`.
- **The plausible refactor** — what the line would do if it were written the way you first
  expected. This is the strongest code distractor there is: it is exactly the reader's
  misreading, stated back to them.
- **Right mechanism, wrong object** — keyed by tumor library vs keyed by analysis label;
  raises on the arm vs raises on the library id.
- **Off-by-one or wrong unit** — a fraction where the answer is a percent, four fastqs where
  it is two lanes.

Never a distractor that is absurd in Python (`it deletes the file`), and never one that is
true of the file but answers a different stem — that is a broken card, not a hard one.
