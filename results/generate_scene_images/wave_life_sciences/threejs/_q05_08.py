from _gen import mk
mk('q05','''  // q05 — The SURFER's PN backbone: neutral phosphoryl GUANIDINE links, no charge.
  beach(scene, { seaZ: 5 });
  const s = addSurfer(stage, P, { x: -1.9, z: 0.3, ry: 0.5, scale: 1.8 });
  s.userData.pose({ lean: 0.05, headTilt: 0.1, arms: { r: [0, 0.2, 0.1] } });
  const chain = new THREE.Group(); scene.add(chain);
  const orange = mat('#ff8a1f', { roughness: 0.3 }), blue = mat('#2a78e8', { roughness: 0.3 }), grey = mat('#59636e'), red = mat('#e8283a'), white = mat('#fff');
  const stick = (a, b, r = 0.03, c = '#d8d2c4') => {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b), d = vb.clone().sub(va), m = add(chain, new THREE.CylinderGeometry(r, r, d.length(), 8), mat(c), [0, 0, 0]);
    m.position.copy(va.clone().add(vb).multiplyScalar(0.5)); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return m;
  };
  const N = 5, x0 = -0.95, dx = 0.82, y0 = 1.25;
  const pt = (i) => [x0 + i * dx, y0 + 0.1 * Math.sin(i * 1.3), 0.5];
  for (let i = 0; i < N; i++) {
    const [x, y, z] = pt(i);
    blob(chain, orange, [x, y, z], [0.15, 0.15, 0.15]); blob(chain, red, [x, y + 0.2, z + 0.05], [0.07, 0.07, 0.07]); stick([x, y, z], [x, y + 0.2, z + 0.05], 0.02);
    if (i < N - 1) { const [x2, y2, z2] = pt(i + 1); stick([x, y, z], [x2, y2, z2]); }
    // guanidine hanging below: C centre + 3 N
    const gy = y - 0.55; stick([x, y, z], [x, gy, z]); blob(chain, grey, [x, gy, z], [0.1, 0.1, 0.1]);
    for (const [ox, oy] of [[-0.19, -0.2], [0.19, -0.2], [0, -0.0]]) {
      const nx = x + ox, ny = gy + oy; if (oy === 0) continue; stick([x, gy, z], [nx, ny, z]); blob(chain, blue, [nx, ny, z], [0.1, 0.1, 0.1]);
      blob(chain, white, [nx + ox * 0.5, ny - 0.1, z], [0.05, 0.05, 0.05]);
    }
  }
  chain.children.forEach((o) => { o.castShadow = true; });
  // neutral sign: crossed-out + and -
  const sign = labelTex(512, 512, (c) => {
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(256, 256, 250, 0, 7); c.fill();
    c.fillStyle = '#2a3a4a'; c.fillRect(80, 226, 130, 60); c.fillRect(110 - 0, 226, 70, 60);
    c.fillRect(300, 226, 130, 60); c.fillRect(335, 191, 60, 130);
    c.strokeStyle = '#e02020'; c.lineWidth = 46; c.beginPath(); c.arc(256, 256, 215, 0, 7); c.stroke(); c.beginPath(); c.moveTo(105, 105); c.lineTo(407, 407); c.stroke();
  });
  const sg = add(scene, new THREE.CircleGeometry(0.7, 40), new THREE.MeshBasicMaterial({ map: sign }), [2.4, 2.4, 0.3]);
  add(scene, new THREE.CylinderGeometry(0.04, 0.04, 1.8, 8), mat('#4a3320'), [2.4, 1.0, 0.25]);
  const b = s.userData.parts.board; b.position.set(-0.8, 0.65, -0.1); b.rotation.set(0, 0, 0.1);
  s.updateMatrixWorld(true);
  const w = s.worldToLocal(new THREE.Vector3(-1.1, 1.25, 0.5)); s.userData.reach('r', [w.x, w.y, w.z]);
  finish(stage, P, s, [0.6, 1.7, 6.6], [0.6, 1.35, 0]);''')

mk('q06','''  // q06 — WVE-006 makes the SURFER the first to edit RNA in a human.
  beach(scene, { seaZ: 5 });
  const pod = new THREE.Group(); scene.add(pod);
  const blk = (x, h, c, lab) => { add(pod, new THREE.BoxGeometry(1.0, h, 0.9), mat(c), [x, h / 2, 0]); const t = textPanel(lab, { w: 0.55, h: 0.55, bg: c, fg: '#ffffff' }); t.position.set(x, h * 0.55, 0.46); pod.add(t); };
  blk(-1.05, 0.5, '#7fa3c7', '2'); blk(1.05, 0.35, '#c98a4a', '3'); blk(0, 0.8, '#f0c030', '1');
  const s = addSurfer(stage, P, { x: 0.0, z: 0.0, ry: 0.0, scale: 1.55 }); s.position.y = 0.8;
  s.userData.pose({ lean: 0, headTilt: 0.05, arms: { r: [0, 0.35, 0.1] } });
  const b = s.userData.parts.board; labelBoard(b, 'WVE-006', { len: 1.0 }); b.scale.setScalar(1.15); b.position.set(0.62, 0.8, -0.05);
  s.userData.reach('r', [-0.27, 1.0, 0.1]); s.userData.pose({ arms: { r: [0, 1.1, 0.0] } });
  // RNA strand with one edited base
  const rna = new THREE.Group(); rna.position.set(2.55, 0.1, 0.5); scene.add(rna);
  const bc = ['#e8283a', '#2fc43c', '#f0b020', '#1f7be8'];
  for (let i = 0; i < 10; i++) {
    const y = 0.35 + i * 0.28, x = Math.sin(i * 0.9) * 0.22; const edited = i === 6;
    add(rna, new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8), mat('#d8d2c4'), [x * 0.5, y, 0], [0, 0, Math.PI / 2]);
    blob(rna, mat('#8e6cf0'), [x - 0.18, y, 0], [0.085, 0.085, 0.085]);
    blob(rna, mat(edited ? '#ffffff' : bc[i % 4], { emissive: edited ? '#fff2a0' : '#000', emissiveIntensity: edited ? 1 : 0 }), [x + 0.1, y, 0], edited ? [0.17, 0.17, 0.17] : [0.12, 0.12, 0.12]);
  }
  const spark = (x, y, z) => { for (const r of [0, Math.PI / 2, Math.PI / 4, -Math.PI / 4]) add(rna, new THREE.BoxGeometry(0.7, 0.05, 0.05), new THREE.MeshBasicMaterial({ color: '#fff3a0' }), [x, y, z], [0, 0, r]); };
  spark(0.15, 0.35 + 6 * 0.28 - 0.0, 0.1);
  // human pictogram sign
  const pic = labelTex(256, 256, (c) => { c.fillStyle = '#1d3b52'; c.fillRect(0, 0, 256, 256); c.fillStyle = '#fff'; c.beginPath(); c.arc(128, 62, 32, 0, 7); c.fill(); c.beginPath(); c.roundRect(82, 106, 92, 84, 24); c.fill(); c.fillRect(100, 170, 24, 66); c.fillRect(132, 170, 24, 66); });
  const sg = add(scene, new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ map: pic }), [-2.4, 1.9, 0.0]);
  add(scene, new THREE.CylinderGeometry(0.04, 0.04, 1.5, 8), mat('#4a3320'), [-2.4, 0.75, -0.05]);
  finish(stage, P, s, [0.1, 1.5, 6.2], [0.1, 1.2, 0], [b]);''')

mk('q07','''  // q07 — WVE-006 on the SURFER fixes alpha-1 antitrypsin deficiency (AAT): misfolded knot -> healthy fold, liver.
  beach(scene, { seaZ: 5 });
  const s = addSurfer(stage, P, { x: -1.7, z: 0.2, ry: 0.5, scale: 1.8 });
  s.userData.pose({ lean: 0.05, headTilt: 0.1, arms: { l: [0.1, 0.3, 0.1] } });
  const b = s.userData.parts.board; labelBoard(b, 'WVE-006', { len: 1.0 }); b.position.set(-0.85, 0.65, -0.1); b.rotation.set(0, 0, 0.1);
  const v = vial('WVE-006'); v.scale.setScalar(1.6); v.position.set(-1.0, 0.55, 1.0); scene.add(v);
  s.updateMatrixWorld(true); const w = s.worldToLocal(new THREE.Vector3(-1.2, 1.05, 0.9)); s.userData.reach('r', [w.x, w.y, w.z]);
  // liver
  const L = new THREE.Group(); L.position.set(0.9, 1.55, -0.6); scene.add(L);
  blob(L, mat('#b5412f', { roughness: 0.4 }), [0, 0, 0], [1.35, 0.62, 0.5], [0, 0, 0.12]);
  blob(L, mat('#b5412f', { roughness: 0.4 }), [0.85, -0.15, 0.0], [0.6, 0.4, 0.42], [0, 0, -0.3]);
  blob(L, mat('#d6c24a'), [-0.35, -0.5, 0.2], [0.14, 0.16, 0.12]);
  // misfolded vs healthy protein
  const knot = new THREE.Group(); knot.position.set(0.15, 0.3, 1.0); scene.add(knot);
  const kc = mat('#8a3fb5', { roughness: 0.4 });
  for (let i = 0; i < 22; i++) { const t = i / 22 * Math.PI * 6; blob(knot, kc, [Math.sin(t * 1.3) * 0.28, 0.35 + Math.cos(t * 0.8) * 0.25 + i * 0.01, Math.cos(t * 1.7) * 0.28], [0.1, 0.1, 0.1]); }
  const heal = new THREE.Group(); heal.position.set(1.95, 0.3, 1.0); scene.add(heal);
  blob(heal, mat('#2f8ef0', { roughness: 0.25, emissive: '#2f8ef0', emissiveIntensity: 0.35 }), [0, 0.4, 0], [0.42, 0.42, 0.42]);
  for (let i = 0; i < 5; i++) { const a = i * 1.256; add(heal, new THREE.TorusGeometry(0.3, 0.05, 8, 24, 3.6), mat('#9fd4ff'), [0, 0.4, 0], [a * 0.3, a, a * 0.5]); }
  add(heal, new THREE.TorusGeometry(0.62, 0.04, 8, 32), new THREE.MeshBasicMaterial({ color: '#7ff0a0' }), [0, 0.4, 0], [Math.PI / 2, 0, 0]);
  const arrow = new THREE.Group(); arrow.position.set(1.0, 0.65, 1.0); scene.add(arrow);
  add(arrow, new THREE.BoxGeometry(0.5, 0.12, 0.08), mat('#ffd23c'), [0, 0, 0]); add(arrow, new THREE.ConeGeometry(0.16, 0.3, 3), mat('#ffd23c'), [0.35, 0, 0], [0, 0, -Math.PI / 2]);
  const lab = textPanel('AAT', { w: 0.9, h: 0.38, bg: '#ffffff', fg: '#2a3a4a', border: '#2a3a4a' }); lab.position.set(0.9, 2.55, -0.3); scene.add(lab);
  finish(stage, P, s, [0.35, 1.7, 6.3], [0.35, 1.25, 0], [b]);''')

mk('q08','''  // q08 — The SURFER restores AAT in the RESTORAATION-2 trial.
  beach(scene, { seaZ: 5 });
  const ban = textPanel('RESTORAATION-2', { w: 4.6, h: 0.62, bg: '#14405a', fg: '#ffe14a', border: '#ffe14a' }); ban.position.set(0.3, 3.0, -0.4); scene.add(ban);
  for (const x of [-2.1, 2.7]) add(scene, new THREE.CylinderGeometry(0.07, 0.07, 3.3, 10), mat('#4a3320'), [x, 1.65, -0.45]);
  // bar chart
  const chart = new THREE.Group(); chart.position.set(1.2, 0, 0.0); scene.add(chart);
  add(chart, new THREE.BoxGeometry(2.7, 1.9, 0.1), mat('#f6f2e6'), [0.5, 1.15, -0.2]);
  [0.3, 0.55, 0.85, 1.25].forEach((h, i) => add(chart, new THREE.BoxGeometry(0.4, h, 0.1), mat(['#e86a5a', '#f0a53c', '#9ad040', '#2fc43c'][i]), [-0.45 + i * 0.58, 0.3 + h / 2, -0.12]));
  add(chart, new THREE.BoxGeometry(2.4, 0.06, 0.1), mat('#2a3a4a'), [0.5, 0.28, -0.12]);
  const heal = blob(chart, mat('#2f8ef0', { roughness: 0.25, emissive: '#2f8ef0', emissiveIntensity: 0.35 }), [1.35, 1.75, 0.1], [0.28, 0.28, 0.28]);
  add(chart, new THREE.TorusGeometry(0.42, 0.04, 8, 32), new THREE.MeshBasicMaterial({ color: '#7ff0a0' }), [1.35, 1.75, 0.1], [0, 0, 0]);
  const up = add(chart, new THREE.ConeGeometry(0.2, 0.4, 3), mat('#2fc43c'), [1.35, 0.9, 0.0]);
  // tent
  const s = addSurfer(stage, P, { x: -1.5, z: 0.4, ry: 0.5, scale: 1.8 });
  s.userData.pose({ lean: 0.05, headTilt: 0.1, arms: { l: [0.1, 0.3, 0.1] } });
  const b = s.userData.parts.board; b.position.set(-0.85, 0.65, -0.1); b.rotation.set(0, 0, 0.1);
  s.updateMatrixWorld(true); const w = s.worldToLocal(new THREE.Vector3(-0.2, 1.4, 0.3)); s.userData.reach('r', [w.x, w.y, w.z]);
  finish(stage, P, s, [0.3, 1.7, 6.4], [0.3, 1.45, 0]);''')
