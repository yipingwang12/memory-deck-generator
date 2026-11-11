# Polish vocab adjudication policy

You are curating rows for a **Polish word ↔ English matching flashcard deck**. Each input
word is a lemma ranked by the summed frequency of its inflected forms, with every part of
speech and sense Wiktionary lists for it.

## Output (one JSON object per input word, JSONL — `chunk_NN.out.jsonl` beside `chunk_NN.json`)
`{"word": "...", "hint": "...", "gloss": "...", "reason": "...", "decision": "keep|drop"}`

- **Every input word appears exactly once**, `word` copied byte-for-byte (capitals too —
  it is the FSRS identity). `deck-vocab --merge` refuses a missing or extra word.

## Input fields
- `parts`: one entry per part of speech, each with a proposed `hint` and its Wiktionary
  `glosses` (` › ` joins a sense to its sub-sense).
- `evidence` (only when present): the word ranks mostly through forms it **shares** with
  other lemmas — `{"form", "share", "also"}`. `share` is this word's part of that form.
- `case_twin` (only when present): another lemma differs from this one only by capitals.
- `participle_of` (only when present): this adjective is also a participle of these verbs.

## Sense + hint selection
- Pick the part of speech and sense of the word's **most frequent modern use**, and write
  one clean English gloss for it. Wiktionary lists senses in no frequency order.
- `hint`: copy the proposed hint of the part you chose. Change it only to fix it.
- **Prefer a content sense over a purely grammatical one when both are common.**

## Keep vs drop
- **Keep function words** with a short functional gloss, as in the Chinese deck
  (被 "by (passive marker)").
- **Drop** (`decision: "drop"`, empty `hint`/`gloss`) when:
  - the word ranks only because its forms coincide with a more common word's forms — check
    `evidence`: a low `share` of common forms whose `also` word is the real reading means the
    rank is borrowed;
  - it is a `case_twin` whose other spelling carries the common meaning and this spelling's
    own sense is rare or a duplicate;
  - it is a proper noun, an abbreviation, a letter name, a symbol, or a bound morpheme;
  - it is vulgar or a slur **and** its rank comes from a non-vulgar homograph.
  - it is a pronoun whose only use is a case form of another pronoun (nich, nim, czym, czego → oni, on, co).
    **Keep** possessives and pronouns with a meaning of their own (jego "his", ich "their", jej "her", czemu "why");
  - it has `participle_of` and only means "verb-ed" — a learner who knows the verb knows
    it (zrobiony (← zrobić), napisany, przeprowadzony). **Keep** a participle with a meaning of its own that the verb does not
    give (zmęczony "tired", zadowolony "pleased", znany "well-known", wykształcony "educated"); gloss that meaning.
- Otherwise keep. Do not drop a word because it is a cognate of English.

## Gloss style
- 1–3 short lowercase senses, **semicolon-separated**; no Wiktionary parentheticals, no
  "[with dative]" labels, no usage notes.
- Add a short **parenthetical tag only to disambiguate** near-synonyms.
- **Keep glosses distinct within your chunk.** Two words with the same gloss make a matching
  round ambiguous; `deck-vocab --build` refuses any same-gloss pair within 30 frequency ranks.
- `reason`: one clause — which part/sense you chose and why, or why you drop.

## Polish specifics
- **Aspect pairs are two cards.** Each verb of a pair is its own lemma (`robić` impf.,
  `zrobić` pf.), and the hint shows the partner: `impf. ↔ zrobić`. Both often share one
  English gloss, which makes a round ambiguous. So when a verb's hint names a partner,
  **tag the perfective's gloss** with the completed sense: `robić` "to do; to make",
  `zrobić` "to do; to make (pf., complete)". Keep the imperfective untagged.
- **Nouns**: hint = gender, `m.` / `f.` / `n.`. Plural-only nouns (`drzwi`, `lata`): hint
  `pl. only`.
- **Reflexive `się`** is one card: "oneself (reflexive)". Verbs that need `się` keep their
  bare lemma; gloss the reflexive meaning only if it is the frequent one.
- **Pronoun lemmas share forms** (`on`/`ono`/`one` share `go`, `mu`, `ich`, `nim`); keep the
  lemma, gloss its own person/gender: `ono` "it (neuter)", `one` "they (non-masc.-personal)".
- `jest`, `są` and other inflected forms are never cards; if one appears, drop it.

## Worked examples
- `w` → `prep.` / "in; at".
- `być` → `impf.` / "to be".
- `lata` (evidence: shares `lat` with `lato`) → `pl. only` / "years" — keep: "years" is a
  common reading in its own right.
- `psynek` (evidence: shares `syn`/`syna` with `syn`) → **drop**: the forms are `syn` (son).
