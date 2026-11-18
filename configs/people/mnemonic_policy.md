# Person memory scenes — policy (etymology pilot)

Rules for `<slug>.mnemonics.yaml` in `career_planning/coevcon_deck/`. Checked by
`deck-companies` when the config sets `mnemonic_rules: person`. Created 2026-11-17 as a test:
the user wants to know if images from **etymology** work better than images from sound. Text
in ASD-STE100 style.

**First read `configs/companies/mnemonic_policy.md`.** All of its rules apply: one anchor in
CAPITALS in every scene, scenes of 25 words or fewer, Major System pegs for every year and
count (the checker computes them), role props, and a `story:` that holds every scene once.
This file adds the etymology layer.

## Anchor — from the etymology of the name

- Find the origin of the person's surname (or given name, or handle). Make one concrete image
  from its MEANING, not from its sound.
  - Norman: Old English *Norþmann*, "man from the north" → VIKING.
  - Levin: one stated origin is Hebrew, "descendant of little Levi (united)" → a ZIPPER
    (not CHAIN: that is peg 62).
  - Janus: the Roman god of doorways, with two faces → a two-faced DOORWAY.
- Record it in `anchor_etymology: {term, origin, source}`. `origin` is short (15 words or
  fewer). `source` is the URL you opened.
- When no etymology can be found (a rare surname, an invented handle), use a sound keyword as
  the company policy does, and say so: `origin: "no etymology found; sound keyword: <word>"`,
  `source: "none"`. Do not guess an etymology.
- The anchor is not a peg word and not another person's anchor. The build checks both against
  `career_planning/coevcon_deck/*.mnemonics.yaml`. Agents work in parallel, so choose a less
  obvious image when the obvious one is common (BRIDGE, CROWN, LION).

## Places and institutions — also from etymology

When a scene needs a place (a birthplace, a university town, a company city), use an image
from the place name's origin. List it in the scene's `etymology:` list.

| Place | Origin | Image |
|---|---|---|
| Oxford | Old English, "ford used by oxen" | OXEN crossing a ford |
| Stanford | Old English, "stony ford" | STONES in a ford |
| Cambridge | bridge over the river Granta / Cam | a BRIDGE |
| Seattle | named after Chief Si'ahl | a CHIEF |
| Pasadena | Ojibwe word given as "of the valley" | a VALLEY |
| Michigan | Ojibwe *mishigami*, "large water" | a great LAKE |

These are examples only. Find and cite the real source for every etymology you use. An
institution named after a person (Harvard, Tufts, Caltech's Pasadena) may use the place or the
eponym's name origin; choose the image that is most concrete.

## Scenes

```yaml
anchor: VIKING
anchor_etymology:
  term: Norman
  origin: "Old English Norþmann, 'man from the north'"
  source: https://www.etymonline.com/word/Norman
story: [...]
cards:
  - {qid: q03, scene: "The VIKING rows across a great LAKE to a STONE FORD.",
     etymology: [{term: Michigan, origin: "Ojibwe mishigami, 'large water'", source: "https://…"}]}
```

- `etymology` on a scene is optional. Every entry needs `term`, `origin` and `source`; the
  build fails without them.
- The quiz shows the scene and then "Etymology: …" after the answer. The anchor's etymology
  is added to the first scene of the story.
- The scene is still the memory image. The etymology is the explanation. Keep the scene within
  25 words; the etymology text does not count.

## Sources

Use name and word dictionaries you can open: behindthename.com, ahdictionary.com (American
Heritage), forebears.io, ancestry.com surname pages, official city or university history
pages. etymonline.com and merriam-webster.com refuse automated fetches here. When the meaning
of a name is disputed (Utah), cite only the part sources agree on (named after the Ute people). Wikipedia and Wiktionary are blocked on this machine; do not fail on them, use another
source. Do not use a folk etymology. If two sources disagree, use the scholarly one and do
not mention the folk one.

## Do not

- Do not invent an etymology to fit a good image. A wrong etymology teaches a false fact.
- Do not make an image that suggests a fact about the person that is not true (a VIKING
  anchor does not mean the person is Scandinavian; never write a scene that says so).
- Do not use a pronoun for a real person unless the dossier records the stated pronouns.
