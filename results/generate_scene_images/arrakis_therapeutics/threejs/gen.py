import sys
HEAD='''<!doctype html>
<html><head><meta charset="utf-8"><title>Arrakis %s anime</title>
<style>html,body{margin:0;height:100%%;overflow:hidden;background:#000}</style>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"}}</script>
</head><body>
<script type="module">
// %s
import { THREE, guard, rng, mat, add, blob, limb, animeEye, base, coin, coinPile, crown, pill, heart, canoe, ladder, flag, pocketWatch, rna, eagle, termite, gillMan, bicep } from './props.js';
guard(() => {
  const P = new URLSearchParams(location.search);
'''
TAIL='''});
</script></body></html>
'''
S={}
S['q01']=('The SANDWORM bites RNA with ordinary small pills','''
  const c = base(P, { tilt: 1.3, wx: -0.1 });
  const M = c.worm.userData.mouthWorld();
  const strand = rna([[-3.2, 0.35, 0.9], [-2.2, 0.9, 0.7], [-1.2, 0.5, 0.75], [M.x - 0.25, M.y + 0.02, M.z + 0.12], [M.x + 0.3, M.y - 0.04, M.z + 0.12], [1.3, 1.5, 0.8], [2.2, 0.9, 0.7], [3.2, 1.6, 0.9]], { n: 34 });
  c.scene.add(strand);
  const cols = [['#ff5a78', '#fff'], ['#3a9af0', '#fff'], ['#ffc830', '#ff7a30'], ['#4acf7a', '#fff'], ['#b06af0', '#fff'], ['#ff7a30', '#fff']];
  cols.forEach(([a, b], i) => { const p = pill(0.5, 0.13, a, b); p.position.set(-1.6 + (i % 3) * 0.95, 0.13, 1.6 + Math.floor(i / 3) * 0.6); p.rotation.set(0, 0.4 + i * 0.9, 0); c.scene.add(p); });
  c.done([0, 1.6, 6.0], [0.2, 1.2, 0]);
''')
S['q02']=('A CANOE carries the coins of the Series A','''
  const c = base(P, { tilt: 1.2, wx: -1.5, wz: -0.6, wry: 0.45 });
  const cn = canoe(); cn.scale.setScalar(1.25); cn.position.set(1.2, 0, 0.9); cn.rotation.y = -0.25; c.scene.add(cn);
  const pile = coinPile(40, 0.2, 0.6, 5); pile.position.set(1.2, 0.5, 0.9); c.scene.add(pile);
  for (const [x, z, a] of [[2.5, 1.6, 0.3], [-0.2, 1.6, 1.2], [2.2, 0.2, 2]]) { const k = coin(0.17); k.position.set(x, 0.17, z); k.rotation.set(-1.4, a, 0); c.scene.add(k); }
  c.done([0, 1.6, 6.0], [0, 1.0, 0]);
''')
S['q03']=('A famous TERMITE plants a flag on the SANDWORM','''
  const c = base(P, { tilt: 1.3, wx: 0 });
  const box = new THREE.Box3().setFromObject(c.worm.userData.parts.head), top = box.max.y, cx = (box.min.x + box.max.x) / 2, cz = (box.min.z + box.max.z) / 2;
  const t = termite(); t.scale.setScalar(1.3); t.position.set(cx - 0.65, top + 0.02, cz + 0.4); t.rotation.y = 0.35; c.scene.add(t); c.char(t);
  const f = flag('#e8344a'); f.scale.setScalar(1.5); f.position.set(cx + 0.28, top - 0.02, cz + 0.3); c.scene.add(f); c.char(f);
  const sk = mat('#f4dcaa');
  limb(c.scene, [cx - 0.3, top + 0.7, cz + 0.55], [cx + 0.28, top + 0.9, cz + 0.3], 0.022, mat('#e8a860'));
  limb(c.scene, [cx - 0.3, top + 0.62, cz + 0.55], [cx + 0.28, top + 0.6, cz + 0.3], 0.022, mat('#e8a860'));
  c.done([0.1, 2.7, 5.6], [0.0, 2.3, 0]);
''')
S['q04']=('A GILL MAN, half fish, wears the SANDWORM first CEO crown','''
  const c = base(P, { tilt: 1.25, wx: -1.3, wry: 0.35 });
  const g = gillMan(); g.scale.setScalar(2.0); g.position.set(0.9, 0, 0.9); g.rotation.y = -0.25; c.scene.add(g); c.char(g);
  c.done([0.0, 1.8, 6.4], [-0.1, 1.4, 0]);
''')
S['q05']=('A LONG ladder carries the new CEO crown up','''
  const c = base(P, { tilt: 1.25, wx: -0.9, wry: 0.3 });
  const L = ladder(3.4); L.position.set(0.8, 0, 0.5); L.rotation.set(-0.05, 0.0, 0.36); c.scene.add(L);
  const k = crown(1.5); k.position.set(0, 3.45, 0); L.add(k);
  const k2 = crown(0.1); k2.visible = false; c.scene.add(k2);
  c.done([0.3, 2.2, 7.8], [0.3, 1.9, 0], [[150, 900, 90, 1.2], [187, 1000, 120, 1.6]]);
''')
S['q06']=('The SANDWORM sets up a secret TRYST between pill and RNA','''
  const c = base(P, { tilt: 1.2, wx: -1.8, wz: -0.2, wry: 0.8 });
  const table = new THREE.Group(); table.scale.setScalar(1.9); table.position.set(0.9, 0, 0.6); c.scene.add(table);
  add(table, new THREE.CylinderGeometry(0.7, 0.7, 0.07, 36), mat('#fff6f0'), [0, 0.75, 0]);
  add(table, new THREE.CylinderGeometry(0.72, 0.5, 0.2, 36, 1, true), new THREE.MeshStandardMaterial({ color: '#ff6a86', side: THREE.DoubleSide }), [0, 0.64, 0]);
  add(table, new THREE.CylinderGeometry(0.1, 0.18, 0.64, 16), mat('#8a4a2a'), [0, 0.35, 0]);
  add(table, new THREE.CylinderGeometry(0.035, 0.035, 0.2, 12), mat('#fff0c0'), [0, 0.89, 0]);
  add(table, new THREE.ConeGeometry(0.035, 0.1, 10), mat('#ff9a20', { emissive: '#ff7a10', emissiveIntensity: 0.8 }), [0, 1.04, 0]);
  const p = pill(0.5, 0.14, '#ff5a78', '#fff'); p.rotation.z = Math.PI / 2; p.position.set(-0.4, 1.07, 0.0); table.add(p);
  animeEye(table, -0.4 - 0.05, 1.12, 0.145, 1.1); animeEye(table, -0.4 + 0.05, 1.12, 0.145, 1.1);
  const R = rna([[0.42, 0.82, 0.0], [0.52, 1.0, 0.04], [0.34, 1.2, 0.0], [0.52, 1.4, 0.04], [0.42, 1.55, 0.0]], { n: 12 }); table.add(R);
  for (const [x, y, s] of [[0, 1.5, 0.3], [-0.3, 1.9, 0.2], [0.35, 1.95, 0.24]]) { const h = heart(s); h.position.set(x, y, 0.2); table.add(h); }
  for (const s of [-1, 0, 1]) add(c.scene, new THREE.BoxGeometry(1.5, 4, 0.1), mat(['#8a2a5a', '#a8386a', '#7a2050'][s + 1]), [0.9 + s * 1.5, 2.0, -1.6], [0, s * 0.35, 0]);
  c.done([0.0, 2.2, 7.4], [0.0, 1.9, 0])
''')
S['q07']=('A string of PEARLS shows where each pill bites the RNA transcript','''
  const c = base(P, { tilt: 1.3, wx: -1.9, wry: 0.45 });
  const M = c.worm.userData.mouthWorld(); const pts = [[M.x + 0.4, M.y - 0.1, 0.9], [0.4, 0.5, 0.9], [1.1, 1.0, 0.9], [1.8, 0.5, 0.9], [2.5, 1.0, 0.9], [3.2, 0.6, 0.8]];
  const R = rna(pts, { n: 30 }); c.scene.add(R);
  const cu = R.userData.curve, pw = mat('#fffaf0', { roughness: 0.15, metalness: 0.1 });
  for (let i = 0; i <= 18; i++) { const q = cu.getPointAt(i / 18); blob(c.scene, pw, [q.x, q.y + 0.32, q.z + 0.05], [0.1, 0.1, 0.1]); }
  for (const t of [0.2, 0.5, 0.8]) { const q = cu.getPointAt(t), pl = pill(0.3, 0.07, '#ff5a78', '#fff'); pl.position.set(q.x, q.y + 0.55, q.z + 0.05); pl.rotation.z = 0.6; c.scene.add(pl); }
  c.done([0.8, 1.6, 6.4], [0.8, 1.2, 0]);
''')
S['q08']=('The SANDWORM pill relaxes muscles that cannot let go','''
  const c = base(P, { tilt: 1.15, wx: -1.6, wry: 0.35 });
  const a = bicep(); a.scale.setScalar(2.2); a.position.set(1.4, 0, 0.8); c.scene.add(a);
  const M = c.worm.userData.mouthWorld(), pl = pill(0.55, 0.14, '#ff5a78', '#fff'); pl.position.set(M.x + 0.55, M.y + 0.55, M.z + 0.5); pl.rotation.z = 0.5; c.scene.add(pl);
  for (let i = 0; i < 6; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.2 + i * 0.07, 0.015, 6, 24, 2.2), mat('#6ae0b0')); t.position.set(pl.position.x, pl.position.y, pl.position.z - 0.1); t.rotation.z = 1 + i * 0.1; c.scene.add(t); }
  c.done([0.0, 2.1, 8.0], [0.0, 1.8, 0]);
''')
S['q09']=('An EAGLE drops 75 million coins into the SANDWORM Series B','''
  const c = base(P, { tilt: 0.95, wx: 0, ws: 1.2 });
  const M = c.worm.userData.mouthWorld();
  const e = eagle(); e.scale.setScalar(1.5); e.position.set(M.x, M.y + 2.3, M.z - 0.2); e.rotation.x = -0.15; c.scene.add(e); c.char(e);
  for (let i = 0; i < 9; i++) { const k = coin(0.15), t = i / 8; k.position.set(M.x + Math.sin(i * 2.1) * 0.14 * (1 - t), M.y + 0.4 + t * 1.5, M.z + 0.1 + (1 - t) * 0.0); k.rotation.set(-0.8 + i * 0.5, i * 0.9, i * 0.3); c.scene.add(k); }
  c.done([0, 2.6, 7.2], [0, 2.4, 0]);
''')
S['q10']=('The SANDWORM burrows under a pocket WATCH in Waltham','''
  const c = base(P, { tilt: 1.2, wx: -1.5, wry: 0.4 });
  const w = pocketWatch(); w.scale.setScalar(2.0); w.position.set(1.4, 0.7, 0.2); w.rotation.set(-0.2, -0.35, 0.1); c.scene.add(w);
  const sd = mat('#d9a057', { roughness: 1 });
  for (let i = 0; i < 6; i++) blob(c.scene, sd, [-0.6 + i * 0.35, 0.0, 0.1 + Math.sin(i) * 0.1], [0.35, 0.14 + 0.05 * (i % 2), 0.3]);
  blob(c.scene, sd, [1.4, 0.1, 0.6], [1.3, 0.3, 0.5]);
  c.done([0.0, 1.6, 6.2], [0.0, 1.2, 0]);
''')
for q,(d,b) in S.items():
    open(f'{q}_anime.html','w').write(HEAD%(q,'%s — %s'%(q,d))+b+TAIL)
