from _gen import mk
mk('q09','''  // q09 — WVE-N531 on the SURFER rebuilds Duchenne muscle: flexing surfer + half-built muscle on scaffold.
  beach(scene, { seaZ: 5 });
  const s = addSurfer(stage, P, { x: -1.4, z: 0.3, ry: 0.35, scale: 1.8 });
  const b = s.userData.parts.board; labelBoard(b, 'WVE-N531', { len: 1.05 }); b.position.set(-0.6, 0.65, -0.1); b.rotation.set(0, 0, 0.1);
  s.userData.pose({ lean: 0, headTilt: 0.05 });
  s.userData.reach('l', [0.3, 0.98, 0.05]); s.userData.reach('r', [-0.3, 0.98, 0.05]);
  // muscle
  const Mu = new THREE.Group(); Mu.position.set(1.3, 0.0, 0.0); scene.add(Mu);
  const prof = []; for (let i = 0; i <= 20; i++) { const t = i / 20; prof.push(new THREE.Vector2(0.06 + 0.5 * Math.sin(Math.PI * Math.pow(t, 0.85)), t * 2.6)); }
  const red = mat('#d6403a', { roughness: 0.35 });
  const top = add(Mu, new THREE.LatheGeometry(prof.filter((p, i) => i >= 11), 32), red, [0, 0.35, 0]); top.position.y = 0.35;
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, r = 0.32; add(Mu, new THREE.CylinderGeometry(0.1, 0.1, 1.5, 12), mat(i % 2 ? '#f0877a' : '#e86a5a', { roughness: 0.4 }), [Math.cos(a) * r, 0.9, Math.sin(a) * r]); }
  add(Mu, new THREE.CylinderGeometry(0.2, 0.2, 1.5, 12), mat('#f6b0a4'), [0, 0.9, 0]);
  for (let k = 0; k < 4; k++) add(Mu, new THREE.TorusGeometry(0.5 - Math.abs(k - 1.5) * 0.04, 0.025, 6, 30), mat('#a82a2a'), [0, 1.75 + k * 0.28, 0], [Math.PI / 2, 0, 0]);
  const ye = mat('#f4c020');
  for (const [x, z] of [[-0.8, 0.7], [0.8, 0.7], [-0.8, -0.6], [0.8, -0.6]]) add(Mu, new THREE.CylinderGeometry(0.035, 0.035, 2.2, 8), ye, [x, 1.1, z]);
  for (const y of [0.6, 1.3, 2.0]) { add(Mu, new THREE.BoxGeometry(1.7, 0.04, 0.04), ye, [0, y, 0.7]); add(Mu, new THREE.BoxGeometry(0.04, 0.04, 1.3), ye, [0.8, y, 0.05]); }
  add(Mu, new THREE.BoxGeometry(1.5, 0.06, 0.4), mat('#c9a56b'), [0, 1.3, 0.7]);
  // falling fibre bricks
  [[-0.1, 3.1, 0.2, 0.4], [0.4, 3.45, -0.1, -0.3]].forEach(([x, y, z, r]) => { const f = add(Mu, new THREE.CapsuleGeometry(0.1, 0.4, 6, 12), mat('#e86a5a'), [x, y, z], [0, 0, r + 1.5]); });
  finish(stage, P, s, [0.3, 1.7, 6.2], [0.3, 1.35, 0], [b]);''')

mk('q10','''  // q10 — WVE-003 on the SURFER targets the Huntington's gene (expanded repeat on a DNA helix, bullseye).
  beach(scene, { seaZ: 5 });
  const s = addSurfer(stage, P, { x: -1.9, z: 0.3, ry: 0.7, scale: 1.8 });
  const b = s.userData.parts.board; labelBoard(b, 'WVE-003', { len: 1.0 }); b.position.set(-0.6, 0.65, -0.1); b.rotation.set(0, 0, 0.1);
  // dartboard
  const tg = new THREE.Group(); tg.position.set(1.7, 1.65, -0.5); scene.add(tg);
  [[1.1, '#e8283a'], [0.9, '#ffffff'], [0.7, '#e8283a'], [0.5, '#ffffff'], [0.3, '#e8283a'], [0.14, '#ffd23c']].forEach(([r, c], i) => add(tg, new THREE.CylinderGeometry(r, r, 0.08 + i * 0.01, 40), mat(c, { roughness: 0.5 }), [0, 0, 0], [Math.PI / 2, 0, 0]));
  add(scene, new THREE.CylinderGeometry(0.05, 0.05, 1.6, 8), mat('#4a3320'), [1.7, 0.8, -0.6]);
  // helix with expanded repeat
  const hx = new THREE.Group(); hx.position.set(1.7, 0.2, 0.25); scene.add(hx);
  const n = 26;
  for (let i = 0; i < n; i++) {
    const y = i * 0.1, a = i * 0.55, rr = 0.55, bad = i >= 9 && i <= 17;
    const A = [Math.cos(a) * rr, y, Math.sin(a) * rr], B = [-Math.cos(a) * rr, y, -Math.sin(a) * rr];
    const sz = bad ? 0.1 : 0.065;
    blob(hx, mat(bad ? '#ff2a2a' : '#3b6fe0', { emissive: bad ? '#ff2a2a' : '#000', emissiveIntensity: bad ? 0.3 : 0 }), A, [sz, sz, sz]);
    blob(hx, mat(bad ? '#ff8a1f' : '#2fc43c'), B, [sz, sz, sz]);
    const m = add(hx, new THREE.CylinderGeometry(bad ? 0.04 : 0.02, bad ? 0.04 : 0.02, 2 * rr, 8), mat(bad ? '#ffd23c' : '#d8d2c4'), [0, y, 0], [0, 0, Math.PI / 2]); m.rotation.set(0, -a, Math.PI / 2);
  }
  hx.scale.set(1.4, 1.2, 1.4);
  // dart in the surfer's hand
  const dart = new THREE.Group(); scene.add(dart);
  add(dart, new THREE.CylinderGeometry(0.035, 0.035, 0.5, 10), mat('#2a3a4a'), [0, 0, 0], [0, 0, Math.PI / 2]);
  add(dart, new THREE.ConeGeometry(0.035, 0.22, 10), mat('#d8dde2', { metalness: 0.7 }), [0.36, 0, 0], [0, 0, -Math.PI / 2]);
  for (let k = 0; k < 4; k++) { const f = add(dart, new THREE.BoxGeometry(0.16, 0.012, 0.12), mat('#ffd23c'), [-0.28, 0, 0], [k * Math.PI / 4, 0, 0]); f.rotation.x = k * Math.PI / 4; f.position.x = -0.28; }
  s.updateMatrixWorld(true);
  const hand = s.userData.parts.hands.r; 
  const wp = new THREE.Vector3(-0.85, 1.25, 0.95); const w = s.worldToLocal(wp.clone()); s.userData.reach('r', [w.x, w.y, w.z]);
  dart.position.copy(wp).add(new THREE.Vector3(0.15, 0.05, 0)); dart.rotation.z = 0.12;
  s.userData.pose({ lean: 0.05, headTilt: 0.05 });
  finish(stage, P, s, [0.0, 1.7, 6.3], [0.0, 1.35, 0], [b]);''')

mk('q11','''  // q11 — A GSK glove hands the WVE-006 rights back to the SURFER.
  beach(scene, { seaZ: 5 });
  const s = addSurfer(stage, P, { x: -1.3, z: 0.2, ry: 0.55, scale: 1.8 });
  const b = s.userData.parts.board; labelBoard(b, 'WVE-006', { len: 1.0 }); b.position.set(-0.62, 0.65, -0.1); b.rotation.set(0, 0, 0.1);
  // giant glove from the right
  const G = new THREE.Group(); G.position.set(1.4, 2.1, 0.5); G.rotation.z = 0.0; scene.add(G);
  const og = mat('#ff7a1a', { roughness: 0.45 });
  blob(G, og, [0.5, 0, 0], [0.65, 0.55, 0.42]);
  [[-0.1, 0.35], [0.0, 0.17], [0.05, -0.03], [-0.02, -0.22]].forEach(([dx, y], i) => {
    const f = add(G, new THREE.CapsuleGeometry(0.1, 0.45, 8, 14), og, [-0.35 + dx, y, 0.1], [0, 0, Math.PI / 2 + (i - 1.5) * 0.12]);
  });
  add(G, new THREE.CapsuleGeometry(0.11, 0.3, 8, 14), og, [0.3, -0.5, 0.15], [0.3, 0, 0.5]);
  add(G, new THREE.CylinderGeometry(0.55, 0.62, 0.55, 28), mat('#f4f1ea'), [1.4, 0, 0], [0, 0, Math.PI / 2]);
  const cuff = textPanel('GSK', { w: 0.72, h: 0.42, bg: '#f4f1ea', fg: '#e8601a', border: '#e8601a' }); cuff.position.set(1.4, 0.0, 0.63); G.add(cuff);
  add(G, new THREE.CylinderGeometry(0.5, 0.5, 2.4, 24), og, [2.9, 0, 0], [0, 0, Math.PI / 2]);
  // scroll of rights
  const sc = new THREE.Group(); sc.position.set(-0.55, 1.62, 0.5); sc.rotation.z = 0.2; scene.add(sc); G.userData.sc = sc;
  add(sc, new THREE.CylinderGeometry(0.22, 0.22, 1.0, 24), mat('#f6ecd0'), [0, 0, 0], [0, 0, Math.PI / 2]);
  for (const x of [-0.5, 0.5]) add(sc, new THREE.CylinderGeometry(0.11, 0.11, 0.06, 16), mat('#b8702a'), [x * 1.07, 0, 0], [0, 0, Math.PI / 2]);
  add(sc, new THREE.CylinderGeometry(0.235, 0.235, 0.1, 24), mat('#d02a3a'), [-0.15, 0, 0], [0, 0, Math.PI / 2]);
  const tag = textPanel('WVE-006', { w: 0.62, h: 0.2, bg: '#ffffff', fg: '#b01020', border: '#b01020' }); tag.position.set(0.2, 0, 0.235); sc.add(tag);
  G.position.set(0.9, 2.0, 0.5);
  s.updateMatrixWorld(true);
  const w = s.worldToLocal(new THREE.Vector3(-0.8, 1.3, 0.8)); s.userData.reach('r', [w.x, w.y, w.z]);
  sc.position.set(-0.5, 1.6, 0.8);
  // arrow showing hand-back
  const ar = new THREE.Group(); ar.position.set(0.1, 1.45, 0.7); scene.add(ar);
  add(ar, new THREE.BoxGeometry(0.5, 0.1, 0.07), mat('#ffd23c'), [0, 0, 0]); add(ar, new THREE.ConeGeometry(0.14, 0.26, 3), mat('#ffd23c'), [-0.32, 0, 0], [0, 0, Math.PI / 2]);
  finish(stage, P, s, [0.3, 1.7, 6.3], [0.3, 1.5, 0], [b]);''')

mk('q12','''  // q12 — The SURFER's ticker reads WVE.
  beach(scene, { seaZ: 5 });
  const tk = labelTex(1024, 400, (c, w, h) => {
    c.fillStyle = '#071018'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#ffb21a'; c.font = 'bold 280px Arial Black, Helvetica, sans-serif'; c.textBaseline = 'middle'; c.fillText('WVE', 40, 215);
    c.fillStyle = '#2fe060'; c.beginPath(); c.moveTo(830, 290); c.lineTo(930, 90); c.lineTo(1000, 290); c.closePath(); c.fill();
    c.strokeStyle = '#2fe060'; c.lineWidth = 12; c.beginPath(); c.moveTo(560, 360); [[620, 335], [680, 350], [740, 300], [800, 320]].forEach(([x, y]) => c.lineTo(x, y)); c.stroke();
  });
  const T = new THREE.Group(); T.position.set(1.0, 0, -0.2); scene.add(T);
  add(T, new THREE.BoxGeometry(4.3, 1.9, 0.2), mat('#2a3340'), [0.5, 2.0, 0]);
  add(T, new THREE.PlaneGeometry(4.0, 1.56), new THREE.MeshBasicMaterial({ map: tk }), [0.5, 2.0, 0.105]);
  for (const x of [-1.2, 2.2]) add(T, new THREE.CylinderGeometry(0.08, 0.08, 1.3, 10), mat('#4a3320'), [x, 0.65, -0.05]);
  const strip = new THREE.Group(); strip.position.set(0.5, 0.95, 0.2); T.add(strip);
  for (let i = 0; i < 12; i++) add(strip, new THREE.BoxGeometry(0.3, 0.16, 0.04), mat(['#e8283a', '#2fc43c', '#ffb21a', '#1f7be8'][i % 4], { emissive: ['#e8283a', '#2fc43c', '#ffb21a', '#1f7be8'][i % 4], emissiveIntensity: 0.3 }), [-1.7 + i * 0.31, 0, 0]);
  const s = addSurfer(stage, P, { x: -1.75, z: 0.5, ry: 0.55, scale: 1.8 });
  const b = s.userData.parts.board; b.position.set(-0.62, 0.65, -0.1); b.rotation.set(0, 0, 0.1);
  s.userData.pose({ lean: 0.0, headTilt: 0.1, arms: { l: [0, 0.3, 0.1] } });
  s.updateMatrixWorld(true); const w = s.worldToLocal(new THREE.Vector3(-0.6, 1.8, 0.5)); s.userData.reach('r', [w.x, w.y, w.z]);
  finish(stage, P, s, [0.4, 1.8, 6.0], [0.4, 1.55, 0]);''')

mk('q13','''  // q13 — The SURFER rides the Charles under a BRIDGE in Cambridge.
  add(scene, new THREE.PlaneGeometry(400, 400), mat('#6fae45', { roughness: 1 }), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  add(scene, new THREE.PlaneGeometry(400, 60), mat('#2e9ec0', { roughness: 0.2 }), [0, 0.02, -2], [-Math.PI / 2, 0, 0]);
  add(scene, new THREE.PlaneGeometry(400, 3), mat('#c9a56b', { roughness: 1 }), [0, 0.01, 3.9], [-Math.PI / 2, 0, 0]);
  // bridge: deck with three arches
  const sh = new THREE.Shape(); sh.moveTo(-6, 0); sh.lineTo(6, 0); sh.lineTo(6, 3.4); sh.lineTo(-6, 3.4); sh.lineTo(-6, 0);
  for (const cx of [-3.6, 0, 3.6]) { const h = new THREE.Path(); h.moveTo(cx - 1.4, 0); h.lineTo(cx - 1.4, 0.9); h.absarc(cx, 0.9, 1.4, Math.PI, 0, true); h.lineTo(cx + 1.4, 0); h.lineTo(cx - 1.4, 0); sh.holes.push(h); }
  const BR = new THREE.Group(); BR.position.set(0, 0, -3.2); scene.add(BR);
  add(BR, new THREE.ExtrudeGeometry(sh, { depth: 1.2, bevelEnabled: false }), mat('#b8b0a2', { roughness: 0.9 }), [0, 0, -0.6]);
  add(BR, new THREE.BoxGeometry(12.2, 0.3, 1.35), mat('#d6cebf'), [0, 3.5, 0]);
  for (let i = 0; i < 25; i++) add(BR, new THREE.BoxGeometry(0.08, 0.5, 0.08), mat('#8a8478'), [-5.9 + i * 0.49, 3.85, 0.55]);
  // Cambridge: brick buildings + tower
  const brick = mat('#a8432e'), cream = mat('#eadfc4');
  [[-4.5, 0, -8, 3.0, 2.4], [-1.5, 0, -8.5, 2.4, 1.8], [2.0, 0, -8, 3.2, 2.2], [5.5, 0, -8.5, 3.0, 2.6]].forEach(([x, , z, w, h]) => {
    add(scene, new THREE.BoxGeometry(w, h, 1.8), brick, [x, h / 2, z]); add(scene, new THREE.BoxGeometry(w + 0.1, 0.12, 1.9), cream, [x, h, z]);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) add(scene, new THREE.BoxGeometry(0.3, 0.4, 0.05), cream, [x - w / 2 + 0.35 + i * (w - 0.7) / 3, 0.7 + j * 0.8, z + 0.92]);
  });
  add(scene, new THREE.BoxGeometry(1.1, 4.4, 1.1), brick, [0.2, 2.2, -9.2]); add(scene, new THREE.ConeGeometry(0.85, 1.2, 4), mat('#2a6f5a'), [0.2, 5.0, -9.2], [0, Math.PI / 4, 0]);
  add(scene, new THREE.SphereGeometry(0.2, 12, 8), mat('#f0c030'), [0.2, 5.75, -9.2]);
  // surfer riding
  const s = addSurfer(stage, P, { x: 0.0, z: 1.3, ry: 0.0, scale: 1.7, board: false });
  s.position.y = 0.09;
  const bd = s.userData.parts.board; bd.visible = true; s.remove(bd);
  const G = new THREE.Group(); G.position.set(0, 0.05, 1.3); G.rotation.y = Math.PI / 2; scene.add(G); bd.scale.setScalar(1.6); bd.position.set(0, 0, 0); bd.rotation.set(-Math.PI / 2, 0, 0); G.add(bd);
  s.userData.pose({ lean: 0.1, headTilt: 0.08, arms: { l: [0, 1.3, 0.2], r: [0, 1.3, 0.2] }, legs: { l: [0, 0.22], r: [0, -0.22] } });
  const foam = add(scene, new THREE.CircleGeometry(1.2, 30), mat('#ffffff', { transparent: true, opacity: 0.8 }), [-1.1, 0.03, 1.4], [-Math.PI / 2, 0, 0], [1.6, 0.7, 1]);
  finish(stage, P, s, [0.2, 1.6, 6.2], [0.2, 1.7, 0], [bd]);''')
