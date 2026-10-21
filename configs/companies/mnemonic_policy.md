# Company memory scenes — policy

Rules for `configs/companies/<slug>.mnemonics.yaml`. Checked by `deck-companies` when the
config names a `mnemonics:` file. All text in ASD-STE100 style.

## Why

Company cards hold many facts per company: dates, people, places, drug targets. Separate
scenes for each fact do not connect, and they mix with other companies' scenes. So each
company gets one **anchor** image. Every scene for that company contains the anchor.

## Anchor

- One concrete noun from the sound of the company name: Alnylam → LAMB.
- Write it in CAPITALS in every scene.
- Not a peg word from `configs/history/major_pegs.yaml`. Not another company's anchor.
- Record the reason in `anchor_reason`.

## Dates and counts

- Year → last two digits. Same rule as history.
- Money, area, percent → first two significant digits, cut not rounded
  (235,500 sq ft → 23; $6.84 → 68; $1M → 10). Same cut as history's years_ago.
- Count → two digits (`06`): the whole answer (`Six`, `46`), beside a unit (`30 days`,
  `9 mm`, `40Hz`), or in a range (`Six to eight`). A digit in a name (JAM-2) is not a count.
- **Several numbers → several pegs, in answer order** (`peg: [tongue, hanger]` for
  `2012 to 2024`). The order in the scene tells the pegs apart.
- **Unit image gives the scale; the peg gives the digits.** Money → coins (millions or
  less), gold bars (billions). Area → floor tiles. Required in the scene, lowercase is fine.
- The checker computes every peg. Never choose one by hand.
- Optional: a number in the stem (Sharp's 1999 paper, ALN-6400) may carry a peg when the
  answer needs none.
- Peg in CAPITALS, singular.

## People

- Keyword from the sound of the surname, concrete: Sharp → SHARP knife, Bartel →
  BARTENDER, Tuschl → TUSSLE, Zamore → *amore* → red heart.
- Role = a fixed prop. Use the same prop for the same role in all companies:

| Role | Prop |
|---|---|
| Founder | plants a flag |
| Nobel laureate | wears a gold medal |
| CEO | wears a crown |
| Scientific lead / CSO | holds a microscope |
| Investor | carries a bag of money |
| Acquirer | swallows the anchor |

## Places

Fixed image per town or district. Put the scene there. No image is a peg word.

| Place | Image |
|---|---|
| Cambridge | BRIDGE over the Charles |
| Kendall Square | the MIT DOME |
| Boston (downtown) | TEA chest (Tea Party) |
| Seaport | LIGHTHOUSE on the pier |
| Longwood | long wooden PLANK |
| Watertown | water TANK |
| Waltham | pocket WATCH |
| Lexington | MUSKET |

Institutions use a sound keyword: UMass → MOOSE, Whitehead → white HEAD.

## Drugs and diseases

- Learn the naming stems once. They tell the drug type:
  `-siran` siRNA · `-mab` antibody · `-tinib` kinase inhibitor · `-cel` cell therapy ·
  `-gene` / `-vec` gene therapy.
- Drug name → sound keyword (mivelsiran → MY VEIL). Disease → body image (bleeding,
  forgetting, an extra chromosome).

## Scene

- One sentence, ≤ 25 words, present tense, active.
- Holds the anchor and the answer's key image. The answer image has an active role.
- Test: "Does this scene still work for a different company's card?" Yes → rewrite.
- A keyword may carry its source in brackets: `a MOOSE (UMass)`.
- A scene describes one answer. If the answer changes, rewrite the scene; the quiz drops
  a scene whose recorded answer no longer matches.
- Cards with no image fact (strategy names, modality) still get a scene; use the anchor
  and one action that shows the meaning.
