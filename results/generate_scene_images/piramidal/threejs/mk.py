import sys
HEAD='''<!doctype html>
<html><head><meta charset="utf-8"><title>%s</title>
<style>html,body{margin:0;height:100%%;overflow:hidden;background:#000}</style>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"}}</script>
</head><body>
<script type="module">
import * as C from './common.js';
const { THREE, mat, add, blob, box, cyl, rod, tube, boot, look, ground, room, textTex, flag, createPiranha, createDoctor, createBed, createMonitor, createBrain, chibiHead, eegTexture, rng } = C;
%s
</script></body></html>
'''
for q in sys.argv[1:]:
    body=open(f'scenes/{q}.js').read()
    open(f'{q}_anime.html','w').write(HEAD%(f'Piramidal {q}',body))
