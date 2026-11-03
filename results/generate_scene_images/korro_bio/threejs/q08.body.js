  // KRRO-121 on the CROW clears too much AMMONIA from the blood: hyperammonemia.
  const stage = makeStage({ ground: '#e6e0d0' }); const S = stage.scene;
  // big spray bottle
  const bt = new THREE.Group(); bt.position.set(0.3, 0, 0.2); S.add(bt);
  cyl(bt, glass('#aef0e0', 0.55), 0.42, 0.45, 1.3, [0, 0.65, 0]);
  cyl(bt, mat('#4fd6c0', { transparent: true, opacity: 0.7 }), 0.4, 0.43, 1.0, [0, 0.55, 0]);
  cyl(bt, mat('#f0f0f0'), 0.2, 0.42, 0.3, [0, 1.4, 0]); cyl(bt, mat('#e8c23a'), 0.18, 0.18, 0.2, [0, 1.62, 0]);
  box(bt, mat('#e8c23a'), [0.5, 0.2, 0.2], [0.25, 1.78, 0]); box(bt, mat('#e8c23a'), [0.12, 0.35, 0.12], [-0.05, 1.5, 0.3], [0.3, 0, 0]);
  cyl(bt, mat('#c0392b'), 0.04, 0.04, 0.25, [0.55, 1.75, 0], [0, 0, Math.PI / 2]);
  const al = label('AMMONIA', { w: 0.84, h: 0.5, size: 0.2, bg: '#ffe9a8', fg: '#c0392b' }); al.position.set(0, 0.6, 0.462); bt.add(al);
  const tx = label('NH3', { w: 0.5, h: 0.3, size: 0.6, bg: '#ffe9a8', fg: '#222', border: null }); tx.position.set(0, 0.28, 0.462); bt.add(tx);
  // mist
  const r = rng(8); for (let i = 0; i < 14; i++) blob(S, new THREE.MeshStandardMaterial({ color: '#c5fff0', transparent: true, opacity: 0.4, depthWrite: false }), [1.2 + i * 0.12 + r() * 0.1, 1.7 + (r() - 0.5) * 0.4, 0.3 + r() * 0.3], [0.1 + i * 0.015, 0.1 + i * 0.015, 0.1 + i * 0.015]);
  // flask nearly emptied of blood
  const fk = new THREE.Group(); fk.position.set(3.0, 0, 0.2); S.add(fk);
  cyl(fk, glass('#e8f6ff', 0.3), 0.55, 0.55, 1.6, [0, 0.8, 0]); cyl(fk, mat('#c0182a', { roughness: 0.2 }), 0.52, 0.52, 0.12, [0, 0.07, 0]);
  for (let i = 0; i < 5; i++) box(fk, mat('#222'), [0.2, 0.03, 0.03], [-0.6, 0.4 + i * 0.3, 0.1]);
  blob(fk, mat('#c0182a'), [0.0, 0.2, 0.0], [0.25, 0.06, 0.25]);
  const dr = label('', { w: 0.01, h: 0.01 });
  for (let i = 0; i < 3; i++) blob(S, mat('#c0182a'), [3.0 + i * 0.05, 0.35 + i * 0.25, 0.2], [0.04, 0.06, 0.04]);
  const crow = createCrow({ scale: 1.8 }); crow.position.set(-1.1, 0, 0.9); crow.rotation.y = 0.55; S.add(crow);
  crow.userData.pose({ headTilt: 0.1, headYaw: 0.1, beak: 0.1, wing: { l: [1.6, 0.8, 0.3], r: [0.2, 0, 0.1] } });
  chestTag(crow, 'KRRO-121');
  finishScene(stage, crow, [num('cx', 0.8), num('cy', 2.2), num('cz', 7.2)], [0.8, 1.1, 0]);
