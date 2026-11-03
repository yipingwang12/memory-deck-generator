import sys,re
HEAD='''<!doctype html>
<html><head><meta charset="utf-8"><title>Foundation %s</title>
<style>html,body{margin:0;height:100%%;overflow:hidden;background:#000}</style>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"}}</script>
</head><body>
<script type="module">
// %s
import * as L from './lib.js';
const { THREE, guard, mat, add, blob, box, cyl, rng, tubeAlong } = L;
guard(() => {
const { scene, num, stone, toon, finish, stage } = L.setup(%s);
%s
});
</script></body></html>
'''
exec(open('scenes.py').read())
for q,(cmt,cfg,body) in SC.items():
    open(f'{q}_anime.html','w').write(HEAD%(q,cmt,cfg,body))
