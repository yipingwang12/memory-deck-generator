#!/bin/sh
# usage: page.sh qNN "title" < body  -> writes qNN_anime.html
cat > "$1_anime.html" <<EOT
<!doctype html>
<html><head><meta charset="utf-8"><title>Brainco $1 anime</title>
<style>html,body{margin:0;height:100%;overflow:hidden;background:#000}</style>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"}}</script>
</head><body>
<script type="module">
// $2
import { THREE, guard, rng, canvasTexture, mat, glow, add, blob, box, cyl, plane, textPlane, makeStage, placeCoconut, reachWorld, finish, palmTree, skyline, junk } from './common.js';
guard(() => {
$(cat)
});
</script></body></html>
EOT
