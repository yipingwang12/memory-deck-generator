# Editas scene brief

Procedural Three.js mnemonic image, realistic-anime (Shinkai-like) style. One scene per agent. Token-cost test: read only what's needed, few fix rounds.

## Folder
`results/generate_scene_images/editas_medicine/threejs/` (this file's folder). `kit.js`, `kit_anime.js` = symlinks to Alnylam kit — never edit them, `pencil.js`, or other scenes' files.

## Anchor
PENCIL character from `pencil.js` (read it; API in its header). Must be recognisable in every scene: yellow hex body, pink eraser, sharpened graphite tip, face.

## Read
1. `../../alnylam_pharmaceuticals/threejs/q01_anime.html` — page template: import map, `guard`, `createAnimeStage`, `toonify(scene, characterPredicate)`, `addClouds`, `finish()`. Copy its structure; import from `./kit.js`, `./kit_anime.js`, `./pencil.js`.
2. `pencil.js`.
3. Optional: `grep -n "^export" kit.js kit_anime.js` for helpers (rng, fbm, canvasTexture, noiseFill, triplanar, sphereUV, cylUV, boxUV, displace, cumulus). Read `createAnimeStage` options only if needed. Indoors: skip clouds.

## Files per scene `qNN`
`qNN_anime.html` (props inline, or `qNN_scene.js` if long). Previews → `out/qNN_vK.png`. Final → `qNN_anime.png`.

## Render
```
cd <folder> && NODE_PATH=/tmp/claude-502/tjs/node_modules node render.mjs qNN_anime.html out/qNN_v1.png --w 640 --h 360 --ss 1 [--q key=val ...]
```
Bash call MUST use `dangerouslyDisableSandbox: true` and that exact NODE_PATH. ~2 s/render; prints `rendered in Xs` or a JS error. `--q` sets URL params read by `num(k, default)`. View each preview with Read. Final: `--w 1280 --h 720 --ss 1` → `qNN_anime.png`.

## Rules
- The scene's CAPITALISED words are the cues; each must read at a glance. The pencil's action must be visible (not hidden behind props).
- No text/letters, except where the cue IS text (a number on a bib, a ticker, labels the scene names) — then large, short, canvas-texture text.
- Clean bevelled primitives, clean silhouettes, warm saturated palette, simple background.
- Budget ≤ 6 preview renders. Stop when cues readable and no artifacts (black frames, z-fighting, floating/clipped objects).

## Report (≤ 80 words)
Files, number of renders, what the image shows, remaining weakness. No code.
