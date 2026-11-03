<!doctype html>
<html><head><meta charset="utf-8"><title>Korro @Q@</title>
<style>html,body{margin:0;height:100%;overflow:hidden;background:#000}</style>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"}}</script>
</head><body>
<script type="module">
// @Q@ — @SCENE@
import { THREE, mat, add, blob, box, cyl, label, makeStage, finishScene, rng, canvasTexture, brickTex, chestTag, tree, glass, tubeAlong } from './common.js';
import { guard } from './kit.js';
import { createCrow } from './crow.js';
guard(() => {
  const P = new URLSearchParams(location.search); const num = (k, d) => Number(P.get(k) ?? d);
@BODY@
});
</script></body></html>
