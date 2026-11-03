  // KRRO-110 on the CROW helps an AUNTIE who TRIPS on her ALPHA-1 badge.
  const stage = makeStage({ ground: '#7fb35a' }); const S = stage.scene;
  add(S, new THREE.PlaneGeometry(400, 2.4), mat('#d9c08a'), [0, 0.004, 0], [-Math.PI / 2, 0, 0]);
  const A = new THREE.Group(); S.add(A);
  const skin = mat('#f2c9a4'), dress = mat('#d9577a'), cardi = mat('#7a5bb5'), gray = mat('#cfcfd6');
  const body = new THREE.Group(); body.position.set(0, 0.85, 0); A.add(body);
  add(body, new THREE.ConeGeometry(0.55, 1.0, 28), dress, [0, -0.3, 0]).geometry.translate(0, 0, 0);
  blob(body, cardi, [0, 0.42, 0], [0.34, 0.4, 0.26]);
  const head = new THREE.Group(); head.position.set(0, 1.0, 0.04); body.add(head);
  blob(head, skin, [0, 0, 0], [0.25, 0.27, 0.24]); blob(head, gray, [0, 0.1, -0.05], [0.27, 0.22, 0.24]); blob(head, gray, [0, 0.34, -0.1], [0.13, 0.13, 0.13]);
  for (const s of [-1, 1]) {
    blob(head, mat('#fff', { roughness: 0.3 }), [s * 0.09, 0.0, 0.2], [0.05, 0.06, 0.03]); blob(head, mat('#2a1a10', { roughness: 0.3 }), [s * 0.09, -0.005, 0.225], [0.03, 0.04, 0.02]);
    blob(head, mat('#fff', { roughness: 0.3 }), [s * 0.1, 0.012, 0.243], [0.01, 0.01, 0.008]);
    add(head, new THREE.TorusGeometry(0.075, 0.008, 6, 20), mat('#5a3a2a'), [s * 0.09, 0.0, 0.23]);
    blob(head, mat('#ff8fa0'), [s * 0.15, -0.08, 0.17], [0.05, 0.03, 0.02]);
  }
  add(head, new THREE.TorusGeometry(0.04, 0.008, 6, 14, Math.PI), mat('#a02b3a'), [0, -0.1, 0.235], [0, 0, Math.PI]);
  // mouth open gasp
  blob(head, mat('#5a1a22'), [0, -0.12, 0.23], [0.03, 0.04, 0.015]);
  const badge = label('ALPHA-1', { w: 0.5, h: 0.2, size: 0.3, bg: '#ffe066' }); badge.position.set(0, 0.28, 0.3); body.add(badge);
  // arms flailing
  for (const s of [-1, 1]) { const arm = cyl(body, cardi, 0.07, 0.06, 0.6, [s * 0.38, 0.72, 0.15], [0.9, 0, s * 1.0]); blob(body, skin, [s * 0.62, 0.9, 0.4], [0.08, 0.08, 0.08]); }
  body.rotation.x = 0.5;
  // legs: one tripped
  cyl(A, skin, 0.07, 0.06, 0.6, [0.14, 0.3, 0.05], [0.05, 0, 0]); blob(A, mat('#c8483c'), [0.14, 0.04, 0.15], [0.09, 0.07, 0.16]);
  cyl(A, skin, 0.07, 0.06, 0.6, [-0.14, 0.38, -0.2], [-0.9, 0, 0]); blob(A, mat('#c8483c'), [-0.14, 0.7, -0.5], [0.09, 0.07, 0.16]);
  A.position.set(-0.4, 0, 0); A.rotation.y = 0.5;
  // handbag flying
  const bag = new THREE.Group(); bag.position.set(0.2, 1.7, 0.9); bag.rotation.z = 0.5; S.add(bag);
  box(bag, mat('#8a3a2a'), [0.35, 0.28, 0.14]); add(bag, new THREE.TorusGeometry(0.1, 0.014, 6, 16, Math.PI), mat('#4a2218'), [0, 0.14, 0]);
  // tripping hazard: root + stone
  const root = add(S, new THREE.TorusGeometry(0.4, 0.07, 8, 20, Math.PI), mat('#6b4a2a'), [0.25, 0.0, 1.0], [0.1, 0.3, 0]);
  blob(S, mat('#8d8a85'), [0.55, 0.1, 0.85], [0.25, 0.14, 0.2]);
  const crow = createCrow({ scale: 1.3 }); crow.position.set(1.0, 0.75, 0.8); crow.rotation.y = -0.9; S.add(crow);
  crow.userData.pose({ lean: -0.1, headTilt: 0.05, headYaw: 0.5, beak: 0.1, wing: { l: [1.4, 0.2, 0.2], r: [1.2, 0.0, 0.2] } });
  for (const k of ['l', 'r']) crow.userData.parts.legs[k].rotation.x = -0.9;
  chestTag(crow, 'KRRO-110');
  finishScene(stage, crow, [num('cx', 0.6), num('cy', 1.7), num('cz', 5.2)], [0.5, 1.0, 0]);
