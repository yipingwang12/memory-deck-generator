# Three.js company-deck brief

One agent = one company deck: build the anchor character, then every scene, sequentially. Realistic-anime (Shinkai-like) style. Work lean: read only what's needed, never re-read files you wrote, few fix rounds.

## Inputs
- Scenes: `configs/companies/<slug>.mnemonics.yaml` (repo `memory-deck-generator/`). `anchor:` = recurring character; `story:` gives context; `cards:` = one scene per qid. CAPITALISED words are the cues.
- Folder: `results/generate_scene_images/<slug>/threejs/` (exists; `kit.js`, `kit_anime.js` symlinks, `render.mjs`). Never edit kit files or other companies' folders.

## Read once (worked examples — Editas)
1. `results/generate_scene_images/editas_medicine/threejs/pencil.js` — anchor module pattern: `createX(opts)` → Group; `userData.parts`, `pose()`, `reach()` two-bone IK, header API doc.
2. `results/generate_scene_images/editas_medicine/threejs/q02_anime.html` — scene page pattern: import map, `guard`, `createAnimeStage`, `toonify(scene, characterPredicate)`, `addClouds`, `finish()`.
3. If needed: `grep -n "^export" kit.js kit_anime.js` (rng, fbm, canvasTexture, noiseFill, triplanar, sphereUV, cylUV, boxUV, displace, cumulus).

## Steps
1. Anchor: `<anchor_lower>.js` + `anchor_sheet.html` → `anchor.png` (3 views). Make it a character (face with big anime eyes + catchlights; limbs if it must act), recognisable from any angle, clean silhouette. ≤ 3 previews.
2. Each card qNN: `qNN_anime.html` (props inline). ≤ 3 previews per scene, then final. Reuse props across scenes by copying patterns, not by re-reading.
3. Finish: `python3` + PIL contact sheet `contact_sheet.png` (anchor + all finals, 3 columns at 640×360, qid label) and `.webp` (quality 88) beside each final PNG.

## Render
```
cd <folder> && NODE_PATH=/tmp/claude-502/tjs/node_modules node render.mjs qNN_anime.html out/qNN_v1.png --w 640 --h 360 --ss 1 [--q key=val ...]
```
Bash MUST use `dangerouslyDisableSandbox: true` and that exact NODE_PATH. ~2 s/render; prints `rendered in Xs` or a JS error. View previews with Read. Final: `--w 1280 --h 720 --ss 1` → `qNN_anime.png`.

## Rules
- Every cue reads at a glance; anchor framed large; its action visible, not hidden by props.
- No text/letters except where the cue IS text (ticker, number on a bib, named label) — then large, short, canvas text.
- Pegs (number words like SUSHI, JELLY) must be unmistakable objects.
- Clean bevelled primitives, warm saturated palette, simple background.
- No artifacts: black frames, z-fighting, floating/clipped objects.

## Report (≤ 100 words)
Scenes done (list any skipped), total renders, weakest 2–3 scenes and why. No code.
