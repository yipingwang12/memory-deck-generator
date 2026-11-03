  // q04 — The GLOBE's brain model thinks like DESCARTES: I think, so I am.
  const S = makeScene({ ground: '#7bb35a' }), scene = S.scene;
  const globe = createGlobe({ scale: 1.5 }); globe.position.set(0.7, 0, 0.1); globe.rotation.y = -0.4; scene.add(S.character(globe));
  globe.userData.pose({ arms: { l: [0, 0.9, 0], r: [0, 1.0, 0] } });
  const d = createDescartes({ scale: 1.35 }); d.position.set(-1.1, 0, 0.5); d.rotation.y = 0.45; scene.add(S.character(d));
  d.userData.arms.l.rotation.set(-1.0, 0, 0.1); d.userData.arms.l.children.forEach((c) => c);
  // thought bubble with a brain above the globe
  const bub = new THREE.Group(), white = mat('#ffffff', { roughness: 0.9 });
  for (const [x, y, r] of [[0, 0, 0.5], [-0.42, -0.05, 0.34], [0.42, -0.05, 0.34], [-0.2, 0.28, 0.32], [0.22, 0.28, 0.32]]) blob(bub, white, [x, y, 0], [r, r * 0.85, 0.2]);
  const pink = mat('#ff7fa6', { roughness: 0.5 }), R = rng(9);
  const brain = new THREE.Group(); brain.position.z = 0.25;
  for (const s of [-1, 1]) blob(brain, pink, [s * 0.15, 0.02, 0], [0.22, 0.2, 0.17]);
  for (let i = 0; i < 26; i++) { const a = R() * Math.PI * 2, b = (R() - 0.2) * Math.PI * 0.8; blob(brain, mat('#ff9bbb'), [Math.cos(a) * 0.3 * Math.cos(b), 0.02 + Math.sin(b) * 0.2, Math.sin(a) * 0.14 * Math.cos(b) + 0.03], [0.06, 0.05, 0.05]); }
  blob(brain, mat('#e86a92'), [0.1, -0.2, -0.02], [0.1, 0.06, 0.08]); bub.add(brain);
  bub.position.set(0.4, 1.9, 0.3); bub.scale.setScalar(0.8); scene.add(bub);
  for (const [x, y, z, r] of [[0.15, 1.2, 0.5, 0.09], [-0.1, 1.03, 0.7, 0.06]]) blob(scene, white, [x, y, z], [r, r, r]);
  const CAM = { cy: 1.2, ty: 1.15, cz: 4.2, tx: 0.0 };
