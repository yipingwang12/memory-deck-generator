<!-- STATUS 2026-11-05: this brief (v1) with 300–800 scenes per agent did NOT work: agents fully met the
standard for only their first 200–300 entries, then made light edits; the ", and a PEG …" pattern fell only
2,773 → 2,534. Use METHOD v2 below for the next run, with ~150 scenes per agent, and have agents RETURN a
JSON list {index, key_fact, scene, deletion_test} that the main session applies (agents writing cell files
collided in shared scratch folders). Verify with scripts/verify_scene_pass.py <slug> (ref 158cdb8).

METHOD v2 (pilot 2026-11-05: 39 of 40 weak scenes fixed, 0 over 25 words), per entry, in order:
1. key_fact: the one thing to recall, at most 6 words.
2. scene: the PEG is the subject of the main verb, or the object it acts on, and that verb IS the key fact.
   Bad:  "French troops take the citadel and an ELBOW sticks out of the window."
   Good: "A giant ELBOW smashes through the Saigon citadel wall and plants the French tricolour on the rubble."
   Good: "A SUMO wrestler pins Aceh's last sultan, Muhammad Daud Syah, and carries him off to the Dutch."
   The picture may be absurd, but it must never state a false fact about the event.
3. deletion_test: remove the peg; the key fact must disappear. Else rewrite. -->

You are doing a SCENE PASS on {jobs} history topic cell(s) for a Major System date-memorization deck.
Rewrite weak scenes. Change NOTHING else.

CELLS (do them in this order; finish and verify one before you start the next):
{cells}

Cell files: /Users/yipingwa/Documents/Projects/memory-deck-generator/configs/history/cells/<slug>.yaml

## Read first
1. /Users/yipingwa/Documents/Projects/memory-deck-generator/configs/history/policy.md — the "Scene" section.
2. /Users/yipingwa/Documents/Projects/memory-deck-generator/configs/history/grid.md — the Regions list (for subregion names).

## The user has pre-authorised the whole pass
Run it end to end, then report. Never ask the user anything. NO web searches and NO fetches: this pass
needs none.

## What a good scene is (policy.md, restated)
- The peg CARRIES THE KEY FACT of the event and has an active role. The peg is the actor or the main object
  of the action that IS the event. It is never a bystander, a modifier ("FOB-chain"), or decoration.
- Test: "Does this scene still work for a different event with the same peg?" Yes → rewrite it.
  The scene must name or show what is specific to THIS event: the place, the person, the object, the act.
- Peg in CAPITALS, singular, noun form. One sentence, at most 25 words. Concrete and visual; strange or
  vivid beats bland. ASD-STE100 style (simple words, active voice).
- Pegs that carry many dates in one cell (the check prints `WARNING PEG OVERLOAD`): every scene of that peg
  needs a DIFFERENT role AND a different setting. Make each one distinct from its siblings, e.g. for 1918
  "DOVE": one dove pecks the armistice pen, another nests in an empty crown, another carries a Polish flag.
- Scenes that came from a template are always weak — rewrite every one. Typical template shapes:
  "A <PEG> hands X the hat", "A <PEG> watches …", "A <PEG> stands beside …", "A <PEG> does X" where X is only
  the event text repeated, "… and a <PEG> …" tacked on at the end.
- A scene that already passes all tests: keep it unchanged. Do not restyle good scenes.

## Stricter tests (added after the first job: it kept too many weak scenes)
Judge EVERY scene with all three tests. Fail any one → rewrite.
1. DELETION test: remove the peg from the sentence. If the event still reads complete, the peg is
   decoration → FAIL. ("Jackson's cane beats the assassin, and a MILL wheel turns behind him" → FAIL.)
2. ACTION test: the peg must DO or BE the central act of the event — it signs, fires, sinks, is crowned,
   is burned, votes, carries the treaty, becomes the new border. "Sniffs", "hums near", "watches", "nudges",
   "stands by", "marks" are NOT the central act → FAIL.
3. SWAP test: replace the event-specific nouns with another event of the same peg. If the sentence still
   works, FAIL.
Good: "Perry stands on a TOMB …" FAILS test 2. Better: "Perry's guns blow open a TOMB-shaped British
flagship on Lake Erie, and he writes 'We have met the enemy'."
Also: correct article before the peg ("an OVEN", not "a OVEN").
Expect to rewrite MOST scenes in cells built after wave 6; earlier cells may need fewer. Do not stop early:
go through every entry in batches until the whole file is done.

Bad:  "A RHINO watches the Japanese army land in Malaya."            (bystander; works for any 1942 event)
Good: "A RHINO charges down the Kota Bharu beach at the head of the Japanese landing craft."
Bad:  "A NOSE signs the treaty."
Good: "A giant NOSE sniffs the ink on the Treaty of Adrianople as Russia takes the Danube mouths."

## Hard limits (a verifier enforces these)
- Change ONLY the `scene` value of entries. Never change year, years_ago, peg, confidence, source, or event.
  Never add, delete, merge or split entries. If you think a date, peg or event is wrong, LIST it in your
  report; do not fix it.
- Keep the file header comments. Add one header comment line:
  `# Scene pass 2026-11-05: <n> of <m> scenes rewritten.`
- Layout: if the cell's `# ` group comments are NOT by subregion (e.g. "additions", "part 3", "(more)",
  by decade), regroup the entries by subregion with `# <subregion>` comments, chronological inside each
  group. Otherwise keep the order. Moving entries is allowed; changing them is not.
- Keep the file's flow style: `- {year: …, peg: …, …,` then `event:` and `scene:` on their own indented
  lines, as the file has them now.

## How to work (large files)
- Do NOT retype the whole file by hand. Write a small Python script under $TMPDIR/scene_pass/<slug>/ that
  reads the cell, applies a mapping {entry index or (year, event): new scene} that you write in batches of
  about 50 entries, and writes the file back with only the scene strings replaced (string replace on the
  exact old scene line is the safest way). Save after every batch, so a machine sleep loses little.
  Use /Users/yipingwa/Documents/Projects/memory-deck-generator/.venv/bin/python.
- Other agents work at the same time on other cells. Use only your own $TMPDIR/scene_pass/<slug>/ folder.
  Never touch another cell file.

## Check every cell (both must pass before you move on)
cd /Users/yipingwa/Documents/Projects/memory-deck-generator && .venv/bin/deck-history-check configs/history/cells/<slug>.yaml
  → exit 0 required (peg in capitals, singular, etc.). OVERLOAD warnings remain; that is expected.
cd /Users/yipingwa/Documents/Projects/memory-deck-generator && .venv/bin/python {verifier} <slug>
  → exit 0 required. A failure means you changed data: restore that entry from
    {baseline}/<slug>.yaml and re-run.

## Final report (your last message; under 200 words)
Per cell: scenes rewritten / total, regrouped yes/no, both checks' exit status.
Then: up to 8 entries whose date, peg or event looks wrong (do not fix them), and any cell you could not finish.
