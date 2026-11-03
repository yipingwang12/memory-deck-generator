  // The CROW steers the cell's own RADAR (ADAR) to edit RNA.
  const stage = makeStage({ ground: '#f2c9d2' }); const S = stage.scene;
  // radar dish (cap of a sphere) on a mast, aimed at the RNA strand
  const dish = new THREE.Group(); dish.position.set(-1.7, 2.3, -1.2); S.add(dish);
  cyl(S, mat('#8a929c', { metalness: 0.5 }), 0.1, 0.16, 2.3, [-1.7, 1.15, -1.2]);
  const bowl = add(dish, new THREE.SphereGeometry(1.25, 48, 24, 0, Math.PI * 2, 0, 0.9), new THREE.MeshStandardMaterial({ color: '#f4f4f4', roughness: 0.4, side: THREE.DoubleSide }), [0, 0, 0], [Math.PI / 2, 0, 0]);
  bowl.position.z = -1.25 * Math.cos(0.45) * 0.0 - 0.9;
  cyl(dish, mat('#8a929c'), 0.04, 0.04, 1.0, [0, 0, 0.15], [Math.PI / 2, 0, 0]);
  blob(dish, mat('#ff4a4a'), [0, 0, 0.7], [0.12, 0.12, 0.12]);
  dish.rotation.y = 0.95; dish.rotation.x = -0.12;
  // beam
  const beam = add(S, new THREE.CylinderGeometry(0.03, 0.5, 3.0, 24, 1, true), new THREE.MeshBasicMaterial({ color: '#7dffb0', transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide }), [0.15, 2.2, -0.2]);
  beam.rotation.set(0, 0, Math.PI / 2 + 0.05); beam.position.set(0.0, 2.35, -1.0);
  // RNA strand: beaded helix
  const cols = ['#ff6b6b', '#ffd23f', '#3fb8ff', '#4cd964'];
  for (let i = 0; i < 26; i++) { const t = i / 25, a = t * 9; const x = 1.0 + t * 1.6, y = 2.45 + Math.sin(a) * 0.25, z = -1.0 + Math.cos(a) * 0.25; blob(S, mat(cols[i % 4], { roughness: 0.3 }), [x, y, z], [0.09, 0.09, 0.09]); if (i % 2) cyl(S, mat('#e8e8f4'), 0.012, 0.012, 0.5, [x, 2.45 + 0, -1.0], [0, 0, 0]); }
  // console with radar screen + ship wheel
  box(S, mat('#41586e'), [2.2, 0.45, 0.7], [0, 0.23, 1.3]);
  const rtex = canvasTexture(256, (c, s) => { c.fillStyle = '#062a14'; c.fillRect(0, 0, s, s); c.strokeStyle = '#4cff8a'; c.lineWidth = 5; for (const r of [40, 80, 120]) { c.beginPath(); c.arc(128, 128, r, 0, 7); c.stroke(); } c.beginPath(); c.moveTo(128, 128); c.lineTo(230, 60); c.lineWidth = 9; c.stroke(); c.fillStyle = '#c8ffd8'; c.beginPath(); c.arc(190, 100, 12, 0, 7); c.fill(); });
  add(S, new THREE.CircleGeometry(0.19, 40), new THREE.MeshBasicMaterial({ map: rtex }), [-0.7, 0.24, 1.655]);
  add(S, new THREE.TorusGeometry(0.2, 0.025, 8, 30), mat('#c0c4cc', { metalness: 0.6 }), [-0.7, 0.24, 1.655]);
  const wheel = new THREE.Group(); wheel.position.set(0.3, 0.95, 1.2); S.add(wheel);
  const wood = mat('#8a5a2c'); add(wheel, new THREE.TorusGeometry(0.34, 0.04, 10, 40), wood);
  for (let i = 0; i < 8; i++) { const sp = add(wheel, new THREE.CylinderGeometry(0.02, 0.02, 0.88, 6), wood); sp.rotation.z = i * Math.PI / 8; add(wheel, new THREE.SphereGeometry(0.055, 10, 8), wood, [Math.cos(i * Math.PI / 4) * 0.4, Math.sin(i * Math.PI / 4) * 0.4, 0]); }
  blob(wheel, mat('#d4a84a', { metalness: 0.5 }), [0, 0, 0], [0.08, 0.08, 0.06]); wheel.rotation.z = 0.3;
  cyl(S, wood, 0.05, 0.05, 0.4, [0.3, 0.7, 1.25], [Math.PI / 2, 0, 0]);
  const crow = createCrow({ scale: 1.8 }); crow.position.set(0.0, 0.0, 0.6); crow.rotation.y = 0.1; S.add(crow);
  crow.userData.pose({ headTilt: 0.08, headYaw: 0.25, beak: 0.1, wing: { l: [1.2, 0.9, 0.5], r: [0.2, 0, 0.1] } });
  finishScene(stage, crow, [0.5, 1.7, 5.4], [0.1, 1.2, 0]);
