import sys
head='''<!doctype html>
<html><head><meta charset="utf-8"><title>Wave %s</title>
<style>html,body{margin:0;height:100%%;overflow:hidden;background:#000}</style>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"}}</script>
</head><body>
<script type="module">
import { THREE, guard, mat, add, blob, labelTex, textPanel, makeStage, beach, wave, addSurfer, finish, pill, vial, labelBoard, num } from './common.js';
guard(() => {
  const P = new URLSearchParams(location.search), stage = makeStage(P), scene = stage.scene;
%s
});
</script></body></html>
'''
def mk(q, body): open(f'{q}_anime.html','w').write(head%(q,body))
