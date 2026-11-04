import pathlib
D = pathlib.Path(__file__).parent / 'threejs'
HEAD = '''<!doctype html>
<html><head><meta charset="utf-8"><title>Reinhart %s</title>
<style>html,body{margin:0;height:100%%;overflow:hidden;background:#000}</style>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"}}</script>
</head><body>
<script type="module">
// %s
import { THREE, createRaincoat, mat, glow, add, blob, box, textPlane, makeStage, finishScene, createElder, createScientist, createBrain, waveTube, cable, hoodElectrodes, rings } from './props.js';
import { guard, rng } from './kit.js';
guard(() => {
  const { stage, scene, num } = makeStage(%s);
  const rc = createRaincoat({ scale: 1.5 }); scene.add(rc); const chars = [rc]; let cam = [0, 1.0, 4.2], look = [0, 0.8, 0];
'''
TAIL = '''
  finishScene(stage, scene, chars, cam, look);
});
</script></body></html>
'''
S = {}
S['q01'] = ('The RAINCOAT hangs at BOSTON UNIVERSITY.', '{}', '''
  rc.position.set(-0.9, 0, 0.6); rc.rotation.y = 0.35;
  rc.userData.pose({ headTilt: 0.06, arms: { l: [0, 0.3, 0], r: [0, 0.6, 0] } });
  rc.updateMatrixWorld(true); const t = rc.worldToLocal(new THREE.Vector3(-0.25, 1.8, 0.8)); rc.userData.reach('r', [t.x, t.y, t.z]);
  // brick hall with columns + big banner
  const brick = mat('#b5523a'), stone = mat('#efe6d4');
  const hall = box(scene, brick, [0.9, 1.6, -2.2], [6.4, 3.2, 1.4]);
  box(scene, stone, [0.9, 3.3, -1.5], [6.8, 0.25, 1.9]); box(scene, stone, [0.9, 0.08, -1.45], [6.6, 0.16, 1.9]);
  for (let i = 0; i < 6; i++) { const c = add(scene, new THREE.CylinderGeometry(0.14, 0.16, 3.1, 20), stone, [-1.4 + i * 1.04 + 0.3, 1.7, -1.45]); }
  const ban = textPlane('BOSTON UNIVERSITY', 5.4, 0.78, { bg: '#cc0000', fg: '#ffffff', frame: '#ffffff' }); ban.position.set(0.9, 2.85, -0.9); scene.add(ban);
  for (let i = 0; i < 4; i++) box(scene, mat('#7fb6e6'), [-0.9 + i * 1.5, 1.25, -1.48], [0.7, 1.0, 0.04]);
  // coat hook on a post beside
  box(scene, mat('#6b4a2a'), [-2.2, 1.0, -0.4], [0.12, 2.0, 0.12]); add(scene, new THREE.SphereGeometry(0.09, 16, 12), glow('#ffd34a', 0.3), [-2.2, 1.7, -0.3]);
  box(scene, mat('#d8c9a8'), [0.9, 0.01, 0.3], [8, 0.02, 3]);
  cam = [-0.2, 1.0, 4.8]; look = [0.1, 1.3, 0];
''')
S['q02'] = ('SCIENCE pins a PINS prize for neuromodulation on the RAINCOAT.', '{ ground: "#a9c27a" }', '''
  rc.position.set(0.5, 0, 0.3); rc.rotation.y = -0.35;
  rc.userData.pose({ headTilt: 0.05, arms: { l: [0, 0.5, 0], r: [0, 0.4, 0] } });
  // prize rosette pinned on chest
  const rose = new THREE.Group(); rose.position.set(0.075, 0.46, 0.255); rc.userData.parts.coat.parent.add(rose);
  for (const [x, c] of [[-0.03, '#c8302a'], [0.03, '#2a56c8']]) add(rose, new THREE.BoxGeometry(0.05, 0.16, 0.012), mat(c), [x, -0.1, 0], [0, 0, x * 8]);
  add(rose, new THREE.CylinderGeometry(0.07, 0.07, 0.02, 32), mat('#f2c230', { metalness: 0.5, roughness: 0.3 }), [0, 0, 0.008], [Math.PI / 2, 0, 0]);
  add(rose, new THREE.CylinderGeometry(0.045, 0.045, 0.026, 32), mat('#c8302a'), [0, 0, 0.012], [Math.PI / 2, 0, 0]);
  const star = add(rose, new THREE.OctahedronGeometry(0.03), mat('#fff6c0'), [0, 0, 0.03]);
  // scientist reaching to pin
  const sci = createScientist({ scale: 1.5 }); sci.position.set(-1.0, 0, 0.5); sci.rotation.y = 0.9; scene.add(sci); chars.push(sci);
  const hand = new THREE.Vector3(); rc.updateMatrixWorld(true); rose.getWorldPosition(hand);
  sci.updateMatrixWorld(true);
  const arm = add(sci, new THREE.CylinderGeometry(0.035, 0.035, 0.6, 10), mat('#f6f8ff'), [0, 0, 0]);
  const a = sci.worldToLocal(new THREE.Vector3(-1.5, 0.95, 0.6).clone()); const sh = new THREE.Vector3(0.2, 0.75, 0.04), tg = sci.worldToLocal(hand.clone());
  arm.position.copy(sh.clone().lerp(tg, 0.5)); arm.scale.y = sh.distanceTo(tg) / 0.6; arm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tg.clone().sub(sh).normalize());
  blob(sci, mat('#f2cba6'), tg.toArray(), [0.035, 0.035, 0.035]);
  // SCIENCE banner + PINS (bowling pins)
  const bn = textPlane('SCIENCE', 2.6, 0.6, { bg: '#1b3f7a', fg: '#ffffff', frame: '#ffd34a' }); bn.position.set(-1.2, 2.9, -1.2); scene.add(bn);
  box(scene, mat('#6b4a2a'), [-2.1, 1.3, -1.25], [0.08, 2.6, 0.08]); box(scene, mat('#6b4a2a'), [-0.3, 1.3, -1.25], [0.08, 2.6, 0.08]);
  for (let i = 0; i < 4; i++) { const p = new THREE.Group(); p.position.set(1.7 + (i % 2) * 0.35, 0, -0.6 - i * 0.0 + (i >> 1) * -0.4);
    const pts = [[0, 0], [0.09, 0], [0.11, 0.05], [0.07, 0.25], [0.05, 0.38], [0.075, 0.46], [0.07, 0.52], [0.04, 0.55], [0, 0.55]].map(([x, y]) => new THREE.Vector2(x, y));
    add(p, new THREE.LatheGeometry(pts, 20), mat('#fff'), [0, 0, 0]); add(p, new THREE.CylinderGeometry(0.058, 0.058, 0.03, 20), mat('#d02a2a'), [0, 0.35, 0]);
    p.scale.setScalar(1.6); scene.add(p); }
  cam = [0.2, 1.3, 5.2]; look = [0, 1.0, 0];
''')
S['q03'] = ('Through the RAINCOAT\'s hood, gentle high-definition currents tap the head: HD-tACS.', '{ ground: "#7bb8a8", el: 30 }', '''
  rc.position.set(-0.7, 0, 0); rc.userData.pose({ headTilt: 0.05, arms: { l: [0, 0.3, 0], r: [0, 0.3, 0] } });
  const els = hoodElectrodes(rc, '#2fd0ff'); rc.updateMatrixWorld(true);
  const dev = new THREE.Group(); dev.position.set(1.6, 0, -0.2); scene.add(dev);
  box(dev, mat('#e9eef7'), [0, 0.45, 0], [1.2, 0.9, 0.6]); box(dev, mat('#2a3550'), [0, 0.62, 0.31], [1.0, 0.45, 0.02]);
  const lab = textPlane('HD-tACS', 0.96, 0.36, { bg: '#0d2a40', fg: '#4af0ff' }); lab.position.set(0, 0.62, 0.325); dev.add(lab);
  for (let i = 0; i < 3; i++) add(dev, new THREE.CylinderGeometry(0.06, 0.06, 0.05, 16), mat(['#c8302a', '#f2c230', '#3ca860'][i]), [-0.3 + i * 0.3, 0.22, 0.31], [Math.PI / 2, 0, 0]);
  const wp = new THREE.Vector3(); els.forEach((e, i) => { e.getWorldPosition(wp); scene.add(cable(wp.toArray(), [1.2 + i * 0.07, 0.9, -0.2 + i * 0.05], { sag: 0.25 + 0.04 * i, color: '#1d2230', r: 0.01 })); });
  // current rings around head
  const hp = new THREE.Vector3(); rc.userData.parts.head.getWorldPosition(hp);
  rings(scene, hp.toArray(), { n: 3, r0: 0.4, dr: 0.13, rot: [Math.PI / 2 + 0.2, 0, 0.2] });
  rings(scene, hp.toArray(), { n: 2, r0: 0.5, dr: 0.15, color: '#9a7bff', rot: [0.3, 0, 0] });
  cam = [0.4, 1.3, 4.3]; look = [0.4, 1.1, 0];
''')
S['q04'] = ('The RAINCOAT\'s current links THETA and GAMMA waves: theta-gamma coupling.', '{ ground: "#5a78b0", el: 20 }', '''
  rc.position.set(-0.7, 0, 0.5); rc.rotation.y = 0.5; rc.userData.pose({ headTilt: 0.06, arms: { l: [0, 0.3, 0], r: [0, 0.3, 0] } });
  hoodElectrodes(rc, '#2fd0ff');
  const th = (x) => 0.35 * Math.sin(x * 2.0);
  const wz = -0.6, y0 = 1.9;
  scene.add(waveTube(th, -0.9, 4.2, { z: wz, r: 0.045, color: '#ff9a2a', y0, n: 500 }));
  // gamma bursts riding the theta crests
  for (let k = 0; k < 3; k++) { const c = Math.PI / 4 + k * Math.PI + 0 - 0; const xc = (Math.PI / 4 + k * Math.PI) / 2 * 1 - 0 + 0.0;
    const x0 = (Math.PI / 2 * (1 + 2 * k)) / 2 - 0.55, x1 = x0 + 1.1;
    scene.add(waveTube((x) => th(x) + 0.09 * Math.sin(x * 26), x0, x1, { z: wz + 0.05, r: 0.02, color: '#3ee6ff', y0, n: 400 })); }
  const tl = textPlane('\\u03b8', 0.7, 0.7, { bg: '#ff9a2a', fg: '#ffffff', frame: '#ffffff' }); tl.position.set(0.2, 3.1, wz); scene.add(tl);
  const gl = textPlane('\\u03b3', 0.7, 0.7, { bg: '#18b8e0', fg: '#ffffff', frame: '#ffffff' }); gl.position.set(1.6, 3.1, wz); scene.add(gl);
  const hp = new THREE.Vector3(); rc.updateMatrixWorld(true); rc.userData.parts.head.getWorldPosition(hp);
  scene.add(cable(hp.toArray(), [-0.7, y0 + 0.05, wz], { sag: -0.3, color: '#2fd0ff', r: 0.022 }));
  rings(scene, [-0.9, y0, wz], { n: 2, r0: 0.12, dr: 0.1, rot: [0, 0, 0] });
  cam = [0.8, 1.5, 5.2]; look = [0.8, 1.5, 0];
''')
S['q05'] = ('The RAINCOAT\'s memory study is in NATURE NEUROSCIENCE.', '{ ground: "#6fae45" }', '''
  rc.position.set(-1.3, 0, 0.5); rc.rotation.y = 0.5; rc.userData.pose({ headTilt: 0.05 });
  // big journal cover held up
  const j = new THREE.Group(); j.position.set(0.6, 1.35, 0.4); j.rotation.y = -0.25; scene.add(j);
  box(j, mat('#f6f3ea'), [0, 0, 0], [1.9, 2.5, 0.08]);
  const hd = textPlane('NATURE', 1.7, 0.4, { bg: '#0f6b3a', fg: '#ffffff' }); hd.position.set(0, 1.0, 0.045); j.add(hd);
  const sb = textPlane('NEUROSCIENCE', 1.7, 0.26, { bg: '#e8f2e8', fg: '#0f6b3a' }); sb.position.set(0, 0.7, 0.045); j.add(sb);
  const br = createBrain({ scale: 0.8 }); br.position.set(0, -0.2, 0.2); j.add(br);
  for (const [x, y, s] of [[-0.65, -0.95, 0.14], [0.6, -0.9, 0.18]]) { add(j, new THREE.CylinderGeometry(0.02, 0.03, 0.2, 8), mat('#6b4a2a'), [x, y - 0.12, 0.06]); blob(j, mat('#3ca860'), [x, y + 0.08, 0.06], [s, s * 1.2, 0.06]); }
  rc.updateMatrixWorld(true);
  const ht = rc.worldToLocal(new THREE.Vector3(-0.35, 1.1, 0.55)); rc.userData.reach('l', ht.toArray());
  const ht2 = rc.worldToLocal(new THREE.Vector3(-0.2, 0.7, 0.55)); rc.userData.reach('r', ht2.toArray());
  const r = rng(3); for (let i = 0; i < 6; i++) { const x = -3.5 + r() * 7, z = -3 - r() * 4; add(scene, new THREE.CylinderGeometry(0.1, 0.14, 1, 8), mat('#6b4a2a'), [x, 0.5, z]); blob(scene, mat('#2f8a48'), [x, 1.8, z], [0.8, 1.1, 0.8]); }
  cam = [-0.1, 1.45, 5.8]; look = [-0.1, 1.3, 0];
''')
S['q06'] = ('After the RAINCOAT\'s buzz, older adults remember better for at least a month.', '{ ground: "#8cc063" }', '''
  rc.position.set(-1.9, 0, 0.7); rc.rotation.y = 0.5; rc.userData.pose({ headTilt: 0.05, arms: { l: [0, 0.3, 0], r: [0, 0.3, 0] } });
  hoodElectrodes(rc, '#2fd0ff'); const hp = new THREE.Vector3(); rc.updateMatrixWorld(true); rc.userData.parts.head.getWorldPosition(hp);
  rings(scene, hp.toArray(), { n: 2, r0: 0.4, dr: 0.12, rot: [Math.PI / 2 + 0.2, 0, 0.2] });
  const el1 = createElder({ scale: 1.5, cardigan: '#7a4b9e' }); el1.position.set(0.0, 0, 0.5); el1.rotation.y = -0.25; scene.add(el1);
  const el2 = createElder({ scale: 1.5, cardigan: '#2f8a8a', hair: '#cfcfd8', cane: false }); el2.position.set(1.2, 0, 0.3); el2.rotation.y = -0.4; scene.add(el2); chars.push(el1, el2);
  // thought bubble with star + key = remembered
  for (const [x, y, r] of [[0.5, 1.95, 0.07], [0.75, 2.15, 0.1], [1.0, 2.4, 0.14]]) blob(scene, mat('#fff'), [x, y, 0.4], [r, r, r]);
  blob(scene, mat('#fff'), [1.3, 3.0, 0.4], [0.75, 0.55, 0.2]);
  add(scene, new THREE.OctahedronGeometry(0.28), glow('#ffd34a', 0.8), [1.1, 3.0, 0.62], [0.5, 0.4, 0.2], [1, 1, 0.5]);
  add(scene, new THREE.TorusGeometry(0.11, 0.035, 10, 20), mat('#c9a020', { metalness: 0.6 }), [1.55, 3.05, 0.6]); add(scene, new THREE.BoxGeometry(0.34, 0.05, 0.05), mat('#c9a020', { metalness: 0.6 }), [1.7, 2.93, 0.6], [0, 0, 0.5]);
  // month calendar: 5x6 grid, all ticked
  const cal = new THREE.Group(); cal.position.set(2.7, 1.9, -0.2); cal.rotation.y = -0.3; scene.add(cal);
  box(cal, mat('#f8f8f4'), [0, 0, 0], [1.9, 1.9, 0.06]); box(cal, mat('#d83a3a'), [0, 0.8, 0.04], [1.9, 0.3, 0.04]);
  for (let i = 0; i < 30; i++) { const cx = -0.7 + (i % 6) * 0.28, cy = 0.45 - Math.floor(i / 6) * 0.28;
    box(cal, mat('#3ca860'), [cx, cy, 0.04], [0.2, 0.2, 0.03]); }
  cam = [0.6, 1.55, 6.0]; look = [0.7, 1.45, 0];
''')
S['q07'] = ('The National Institute on AGING funds the RAINCOAT\'s adaptive tACS.', '{ ground: "#8fbf6a" }', '''
  rc.position.set(0.9, 0, 0.8); rc.rotation.y = -0.5; rc.userData.pose({ headTilt: 0.06 });
  hoodElectrodes(rc, '#2fd0ff');
  rc.updateMatrixWorld(true); const ht = rc.worldToLocal(new THREE.Vector3(0.1, 0.95, 1.2)); rc.userData.reach('l', ht.toArray());
  const elder = createElder({ scale: 1.7, cane: false, cardigan: '#a8452e' }); elder.position.set(-1.0, 0, 0.9); elder.rotation.y = 0.55; scene.add(elder); chars.push(elder);
  // money bag + coins
  const bag = new THREE.Group(); bag.position.set(0.05, 1.0, 1.25); scene.add(bag);
  blob(bag, mat('#b8955a'), [0, 0, 0], [0.22, 0.26, 0.2]); add(bag, new THREE.CylinderGeometry(0.05, 0.1, 0.12, 14), mat('#b8955a'), [0, 0.28, 0]);
  const dl = textPlane('$', 0.26, 0.26, { bg: null, fg: '#2a5a28' }); dl.position.set(0, 0, 0.205); bag.add(dl);
  for (let i = 0; i < 6; i++) add(scene, new THREE.CylinderGeometry(0.15, 0.15, 0.035, 24), mat('#f2c230', { metalness: 0.7, roughness: 0.3 }), [-1.4 + (i % 3) * 0.05, 0.02 + i * 0.037, 1.9], [0, 0, 0]);
  // institute building with pediment + AGING banner
  const st = mat('#efe6d4'); box(scene, st, [0, 1.5, -2.6], [7.5, 3.0, 1.6]); box(scene, mat('#d9cdb4'), [0, 3.15, -2.0], [7.9, 0.3, 2.4]);
  const tri = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 3), st); tri.visible = false;
  for (let i = 0; i < 7; i++) add(scene, new THREE.CylinderGeometry(0.15, 0.17, 2.9, 20), st, [-2.7 + i * 0.9, 1.45, -1.7]);
  const ban = textPlane('AGING', 3.2, 0.8, { bg: '#1b3f7a', fg: '#ffffff', frame: '#ffd34a' }); ban.position.set(0, 2.75, -0.75); scene.add(ban);
  box(scene, mat('#d8c9a8'), [0, 0.01, 0.0], [9, 0.02, 7]);
  cam = [-0.1, 1.5, 6.4]; look = [0, 1.4, 0];
''')
S['q08'] = ('The RAINCOAT syncs the front of the brain with its sides: prefrontal and temporal.', '{ ground: "#6a8ec0", el: 25 }', '''
  rc.position.set(-2.3, 0, 0.5); rc.rotation.y = 0.7; rc.userData.pose({ headTilt: 0.05, arms: { l: [0, 0.3, 0], r: [0, 0.3, 0] } });
  const els = hoodElectrodes(rc, '#2fd0ff');
  box(scene, mat('#e9eef7'), [0.6, 0.6, 0], [1.7, 1.2, 1.0]);
  const br = createBrain({ scale: 1.9 }); br.position.set(0.6, 1.95, 0); br.rotation.y = -0.25; scene.add(br);
  // glowing links: frontal tip and temporal lobe, plus a sync arc between them
  const hp = new THREE.Vector3(); rc.updateMatrixWorld(true); rc.userData.parts.head.getWorldPosition(hp);
  const fr = new THREE.Vector3(); br.updateMatrixWorld(true); fr.copy(br.localToWorld(new THREE.Vector3(0.38, 0.12, 0.15)));
  const tp = br.localToWorld(new THREE.Vector3(0.05, -0.22, 0.25));
  scene.add(cable(hp.toArray(), fr.toArray(), { color: '#2fd0ff', r: 0.025, sag: -0.35 }));
  scene.add(cable(hp.toArray(), tp.toArray(), { color: '#ffb02a', r: 0.025, sag: 0.1 }));
  const arc = new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(fr.clone(), fr.clone().lerp(tp, 0.5).add(new THREE.Vector3(0.7, 0, 0.45)), tp.clone()), 40, 0.03, 8), glow('#ffffff', 1.5)); scene.add(arc);
  for (const [p, c] of [[fr, '#4f8fe8'], [tp, '#f08a3c']]) blob(scene, glow(c, 1.2), p.toArray(), [0.07, 0.07, 0.07]);
  cam = [-0.3, 1.7, 6.2]; look = [-0.3, 1.5, 0];
''')
for q, (cap, opts, body) in S.items():
    (D / f'{q}_anime.html').write_text(HEAD % (q, f'{q} - {cap}', opts) + body + TAIL)
