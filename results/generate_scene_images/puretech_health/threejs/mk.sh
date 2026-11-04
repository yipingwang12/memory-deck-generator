#!/bin/sh
# usage: mk.sh qNN  (reads body from stdin, wraps in page)
cat > $1_anime.html <<EOT
<!doctype html>
<html><head><meta charset="utf-8"><title>PureTech $1 anime</title>
<style>html,body{margin:0;height:100%;overflow:hidden;background:#000}</style>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"}}</script>
</head><body>
<script type="module">
import * as THREE from 'three';
import { guard, rng } from './kit.js';
import { createPuritan, addFace } from './puritan.js';
import * as K from './props.js';
const { mat, add, blob, num, makeStage, finishScene, reachWorld } = K;
guard(() => {
$(cat)
});
</script></body></html>
EOT
