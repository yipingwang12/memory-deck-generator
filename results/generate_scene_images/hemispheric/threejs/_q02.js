  // q02 — A LULLABY singer (Lalazar) wears the GLOBE's CEO crown.
  const S = makeScene({ ground: '#7bb35a' }), scene = S.scene;
  const globe = createGlobe({ scale: 1.5 }); globe.position.set(0.9, 0, 0.1); globe.rotation.y = -0.45; scene.add(S.character(globe));
  globe.userData.pose({ arms: { l: [0, 0.6, 0], r: [0, 2.2, 0] } });
  // singer
  const singer = new THREE.Group(), dress = mat('#2fa6a0'), skin = mat('#f2c49c'), hair = mat('#1d1210');
  add(singer, new THREE.LatheGeometry([[0, 0], [0.3, 0], [0.24, 0.3], [0.12, 0.62], [0.0, 0.64]].map(([x, y]) => new THREE.Vector2(x, y)), 28), dress, [0, 0.1, 0]);
  cyl(singer, mat('#f2c49c'), 0.04, 0.04, 0.1, [-0.07, 0.05, 0]); cyl(singer, mat('#f2c49c'), 0.04, 0.04, 0.1, [0.07, 0.05, 0]);
  const head = new THREE.Group(); head.position.y = 0.98; singer.add(head);
  blob(head, skin, [0, 0, 0], [0.15, 0.17, 0.14]);
  blob(head, hair, [0, 0.03, -0.06], [0.18, 0.2, 0.13]); add(head, new THREE.CylinderGeometry(0.17, 0.2, 0.55, 20), hair, [0, -0.28, -0.1]);
  for (const s of [-1, 1]) {
    blob(head, mat('#fff'), [s * 0.06, 0.02, 0.125], [0.035, 0.045, 0.015]); blob(head, mat('#2a1810'), [s * 0.06, 0.015, 0.138], [0.022, 0.032, 0.012]);
    blob(head, mat('#fff'), [s * 0.054, 0.028, 0.15], [0.009, 0.009, 0.005]); blob(head, mat('#ff8fa0'), [s * 0.09, -0.04, 0.12], [0.03, 0.018, 0.01]);
  }
  blob(head, mat('#7a1f2b'), [0, -0.075, 0.13], [0.04, 0.032, 0.02]);
  const crown = new THREE.Group(); crown.position.y = 0.17; head.add(crown); const gold = mat('#f4b81f', { metalness: 0.7, roughness: 0.3 });
  cyl(crown, gold, 0.12, 0.14, 0.07, [0, 0.035, 0]);
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; add(crown, new THREE.ConeGeometry(0.035, 0.11, 8), gold, [Math.sin(a) * 0.12, 0.12, Math.cos(a) * 0.12]); blob(crown, mat('#e0245e'), [Math.sin(a) * 0.12, 0.185, Math.cos(a) * 0.12], [0.02, 0.02, 0.02]); }
  for (const [k, s] of [['l', 1], ['r', -1]]) { const a = cyl(singer, dress, 0.035, 0.03, 0.3, [s * 0.2, 0.6, 0.05], [0.4, 0, s * 0.9]); blob(singer, skin, [s * 0.32, 0.72, 0.1], [0.04, 0.04, 0.04]); }
  singer.position.set(-0.65, 0, 0.5); singer.scale.setScalar(1.15); singer.rotation.y = 0.25; scene.add(S.character(singer));
  // lullaby: floating notes + crescent moon + stars
  const note = (x, y, z, c) => { const n = new THREE.Group(); blob(n, mat(c), [0, 0, 0], [0.07, 0.055, 0.04], [0, 0, 0.4]); add(n, new THREE.BoxGeometry(0.018, 0.26, 0.018), mat(c), [0.06, 0.13, 0]); add(n, new THREE.BoxGeometry(0.1, 0.04, 0.018), mat(c), [0.1, 0.26, 0], [0, 0, -0.5]); n.position.set(x, y, z); scene.add(n); };
  note(-1.5, 1.5, 0.5, '#ff5fa2'); note(-1.1, 1.75, 0.3, '#ffb800'); note(0.1, 1.7, 0.2, '#7a5cff'); note(-0.2, 1.45, 0.8, '#2fa6a0');
  add(scene, new THREE.TorusGeometry(0.22, 0.07, 12, 32, Math.PI * 1.35), mat('#ffe27a', { emissive: '#ffd24a', emissiveIntensity: 0.5 }), [-1.7, 1.7, -0.3], [0, 0, 0.8]);
  // CEO briefcase beside the globe
  add(scene, new THREE.BoxGeometry(0.5, 0.36, 0.14), mat('#5a3a22'), [1.65, 0.2, 0.75], [0, -0.4, 0]); add(scene, new THREE.TorusGeometry(0.08, 0.015, 8, 16, Math.PI), mat('#c9a05a'), [1.65, 0.4, 0.75], [0, -0.4, 0]);
  const CAM = { ty: 0.75 };
