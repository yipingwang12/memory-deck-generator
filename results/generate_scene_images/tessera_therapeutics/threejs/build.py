import sys,glob,os
T='''<!doctype html>
<html><head><meta charset="utf-8"><title>Tessera %s anime</title>
<style>html,body{margin:0;height:100%%;overflow:hidden;background:#000}</style>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"}}</script>
</head><body>
<script type="module">
import { THREE, mat, add, blob, box, cyl, label, makePerson, crown, eggBowl, eggTop, page, run, rng, quill, worldHand, reachWorld } from './common.js';
%s
</script></body></html>
'''
for f in sorted(glob.glob('src/q*.js')):
    q=os.path.basename(f)[:-3]
    open(q+'_anime.html','w').write(T%(q,open(f).read()))
