import sys
HEAD='''<!doctype html>
<html><head><meta charset="utf-8"><title>Agios %s</title>
<style>html,body{margin:0;height:100%%;overflow:hidden;background:#000}</style>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"}}</script>
</head><body>
<script type="module">
// %s
import { THREE, guard, mat, add, blob, box, cyl, rbc, textPlane, makeScene } from './common.js';
import { createAegis } from './aegis.js';
import { createPirateKing, createCrab, createPivotDoor, sickle, platelet } from './props.js';
// shield helper: place + pose + optional reach {hand:'l', to:[x,y,z] world}
function place(scene, S, x, z, ry, sc, reach) {
  const a = createAegis({ scale: sc }); a.position.set(x, 0, z); a.rotation.y = ry; scene.add(a);
  a.userData.pose({ legs: { l: [0.2, 0], r: [-0.15, 0] } });
  if (reach) { a.updateMatrixWorld(true); const t = a.worldToLocal(new THREE.Vector3(...reach.to)); a.userData.reach(reach.hand, [t.x / sc, t.y / sc, t.z / sc]); }
  S.mark(a); return a;
}
guard(() => {
'''
TAIL='''
});
</script></body></html>
'''
qid,cue=sys.argv[1],sys.argv[2]
open(f'{qid}_anime.html','w').write(HEAD%(qid,cue)+sys.stdin.read()+TAIL)
