  // The CROW's trial is called REWRITE.
  const stage = makeStage({ ground: '#80b45c' }); const S = stage.scene;
  for (const x of [-1.9, 1.9]) box(S, mat('#7a5230'), [0.16, 3.2, 0.16], [x, 1.6, -0.5]);
  box(S, mat('#fff8e8'), [4.2, 1.5, 0.12], [0, 2.4, -0.45]);
  box(S, mat('#2d4fa8'), [4.4, 0.16, 0.2], [0, 3.2, -0.45]); box(S, mat('#2d4fa8'), [4.4, 0.16, 0.2], [0, 1.6, -0.45]);
  const sign = label('REWRITE', { w: 3.8, h: 1.2, size: 0.24, bg: '#fff8e8', fg: '#c0392b', border: null }); sign.position.set(0, 2.4, -0.38); S.add(sign);
  const crow = createCrow({ scale: 1.7 }); crow.position.set(-0.2, 0, 0.6); crow.rotation.y = 0.25; S.add(crow);
  crow.userData.pose({ headTilt: 0.1, headYaw: 0.1, headPitch: -0.2, beak: 0.05, wing: { l: [0.3, 0.3, 0.1], r: [0.5, 0.5, 0.2] } });
  // giant pencil held up in the beak
  const pen = new THREE.Group(); S.add(pen);
  cyl(pen, mat('#f7c820'), 0.07, 0.07, 1.1, [0, 0.55, 0], [0, 0, 0], 6); add(pen, new THREE.ConeGeometry(0.07, 0.2, 6), mat('#efc58a'), [0, -0.1, 0], [Math.PI, 0, 0]); add(pen, new THREE.ConeGeometry(0.02, 0.07, 6), mat('#222'), [0, -0.2, 0], [Math.PI, 0, 0]);
  cyl(pen, mat('#f4909c'), 0.07, 0.07, 0.15, [0, 1.17, 0], [0, 0, 0], 12); cyl(pen, mat('#cfd6dc', { metalness: 0.7 }), 0.075, 0.075, 0.08, [0, 1.07, 0], [0, 0, 0], 12);
  pen.position.set(0.55, 1.55, 1.2); pen.rotation.set(0.0, 0, -0.55);
  // eraser shavings & sparkle
  const r = rng(2); for (let i = 0; i < 14; i++) blob(S, mat(i % 2 ? '#f4909c' : '#fff'), [-1.8 + r() * 3.6, 0.04 + r() * 0.05, 0.3 + r() * 1.8], [0.06, 0.03, 0.06]);
  const cl = box(S, mat('#8a6a3a'), [0.7, 0.9, 0.05], [-1.6, 0.6, 1.2], [-1.1, 0.4, 0]); const sh = label('', { w: 0.6, h: 0.8, bg: '#fff', border: '#999' }); sh.position.set(-1.6, 0.62, 1.23); sh.rotation.set(-1.1, 0.4, 0); S.add(sh);
  finishScene(stage, crow, [0.0, 2.0, 7.0], [0.0, 1.6, 0]);
