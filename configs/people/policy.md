# Person MCQ authoring policy (CoevCon attendees)

Multiple-choice cards about one person's life and work. One person is one deck. The reader
attends CoevCon (Dec 4–6 2026) and wants to meet each person knowing where they studied, what
they built, what they wrote and what they think. Created 2026-11-17.

This policy is the person counterpart to `configs/companies/policy.md`. **Read that file
first.** The card mechanics, the stem style, the distractor rules, `qid` identity, coverage
and the four committed files are the same. This file lists only what is different. All rule
text is in ASD-STE100 style.

## 1. The data does not live in this repo

The cards compile facts about private people. This repo holds the machinery and the policy
only. The deck data lives in the private `career_planning` repo:

```
career_planning/coevcon_deck/<slug>.yaml            config
                             <slug>.facts.jsonl     extraction, one row per fact
                             <slug>.curated.jsonl   the cards
                             <slug>.audit.jsonl     per-card provenance
                             <slug>.mnemonics.yaml  memory scenes (configs/people/mnemonic_policy.md)
                             <slug>.sha256          written by --build
career_planning/research_notes/CoevCon attendees/<slug>.md   the dossier = the source text
```

The artifact goes to `memory-quiz-app/data/decks/people_<slug>.json`, which that repo
gitignores and keeps out of the Docker image. Never commit a person deck to a public repo.

## 2. The dossier is the source text

`source_text` points at the person's dossier, not at a copy. Each fact in a dossier is one
sentence with tags, for example:

> - Sumner Norman co-founded Forest Neurotech in 2023. — [category: company] [durable] [confirmed] (url)

Every card's `quote` is copied character for character from one fact sentence, without the
tags. If you must change a dossier sentence, change the dossier, then rebuild. The `.sha256`
stamp records the dossier version the quotes were checked against.

## 3. Which facts can become cards

| Card it | Do not card it |
|---|---|
| Tag `durable` and `confirmed` | Tag `volatile` (build fails) |
| Tag `durable` and `single-source`, when the source is the person's own site, CV or an official page | Tag `inferred` |
| | A fact named in the dossier's "Conflicts and open questions" section |
| | Any fact in a file about a *candidate* or with identity confidence `low` or `none` |
| | Family members, health, home address, anything private |
| | A legal name for a person known by a pseudonym |

Extract every fact into `facts.jsonl`. Mark a fact `volatile` only when it is volatile. For
a durable fact the table above refuses, set `"cardable": false` and a `"reason"`: it leaves
the coverage denominator, and the build fails if a kept card quotes it. So a coverage warning
now means a real gap.

The dossier's fact sentences may use pronouns ("his PhD"). A quote keeps the dossier's words;
your stems and scenes do not add pronouns.

Google Scholar, the person's own site/CV/GitHub/Substack and official employer or university
pages count as "own or official". A news article, podcast notes or a magazine quote do not.

Categories: `birth`, `education`, `career`, `company`, `research`, `writing`, `personal`,
`connection`. Use the same word for the audit row's `category` and `type`.

## 4. Stems

- Name the person in every stem (the build checks it against `deck_name`, or `stem_name` when
  the deck title is longer). Use the name the person uses in public (a handle for `janus`,
  `celeste`, `deepfates`, …).
- Dates are years only. Ask "In which year…" only when the year is a fact worth knowing.
- Do not use pronouns for a person unless the dossier records the pronouns the person states.
  Repeat the name.
- One sentence, 25 words or fewer, ends in a question mark.

## 5. Distractors — draw from the other attendees

The other dossiers are the distractor pool, the way the company dossier is for companies:

- **Swapped person** — the true fact about a different attendee (another person's PhD school,
  another person's company). This is the strongest kind: a wrong answer teaches a second person.
- **Same field, wrong item** — a real lab, company or paper in the same field.
- **Neighbouring true fact** — true of this person, but not the answer to this stem.

All options must be real, plausible and of the same type. Never invent a company or a paper
title that sounds real but does not exist.

## 6. Config

```yaml
# Person MCQ deck — rules in memory-deck-generator/configs/people/policy.md
deck_name: "Sumner Norman"
title: "Sumner Norman"
group: "CoevCon"
deck_type: person
artifact_prefix: people
mnemonic_rules: person
order: 700                       # organizers 700–709, speakers 710–749, attendees 750+
namespace: "person:sumner-norman"  # never change once studied
citation: "career_planning/research_notes/CoevCon attendees/sumner_norman.md, researched 2026-11-17"
facts: sumner_norman.facts.jsonl
curated: sumner_norman.curated.jsonl
audit: sumner_norman.audit.jsonl
source_text: "../research_notes/CoevCon attendees/sumner_norman.md"
mnemonics: sumner_norman.mnemonics.yaml
n_choices: 4
recheck_months: 12
```

Audit `checked` = the dossier's research date (2026-11-17).

## 7. Build

```sh
cd memory-deck-generator
.venv/bin/deck-companies --config ../career_planning/coevcon_deck/<slug>.yaml          # check
.venv/bin/deck-companies --config ../career_planning/coevcon_deck/<slug>.yaml --build \
    --out ../memory-quiz-app/data/decks
```

Fix every FAIL. Fix the shape warnings (answer longer than its distractors) the paired way:
shorten the answer and lengthen the distractors.
