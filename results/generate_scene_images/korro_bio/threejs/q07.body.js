  // The CROW's new version rides a GAL-NAC sugar hook to the liver: GalNAc.
  const stage = makeStage({ ground: '#8fbf6a' }); const S = stage.scene;
  // liver on a plinth
  const plinth = box(S, mat('#d9d2c4'), [1.8, 0.7, 1.2], [1.5, 0.35, -0.3]);
  const liver = new THREE.Group(); liver.position.set(1.5, 1.2, -0.3); S.add(liver);
  const lm = mat('#8f2f2f', { roughness: 0.35 });
  blob(liver, lm, [0, 0, 0], [0.95, 0.5, 0.55]); blob(liver, lm, [0.55, -0.12, 0.1], [0.5, 0.35, 0.4]); blob(liver, mat('#a03a3a', { roughness: 0.35 }), [-0.4, 0.15, 0.15], [0.45, 0.3, 0.35]);
  blob(liver, mat('#4aa05a'), [0.3, -0.35, 0.25], [0.14, 0.18, 0.12]);
  add(liver, new THREE.TorusGeometry(0.12, 0.03, 8, 20), mat('#e8c24a', { metalness: 0.6 }), [-0.25, 0.5, 0.2], [0, 0, 0]);
  // candy cane: straight stem + hook, striped
  const stripe = canvasTexture(128, (c, s) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#fff' : '#e62e3e'; c.fillRect(0, i * s / 8, s, s / 8); } }, { repeat: 1 });
  const cm = new THREE.MeshStandardMaterial({ map: stripe, roughness: 0.3 });
  const cane = new THREE.Group(); S.add(cane);
  tubeAlong(cane, [[0, 0, 0], [0.8, 0, 0], [1.6, 0, 0], [2.1, 0, 0]], 0.05, cm);
  const hook = new THREE.CatmullRomCurve3([...Array(13)].map((_, i) => { const a = -Math.PI / 2 + i * Math.PI / 12 * 1.0; return new THREE.Vector3(2.1 + 0.0, 0, 0).add(new THREE.Vector3(Math.cos(a) * 0.0, 0, 0)); }));
  const hk = [[2.1, 0, 0], [2.2, 0.0, 0], [2.4, 0.12, 0], [2.45, 0.3, 0], [2.35, 0.48, 0], [2.15, 0.52, 0], [2.0, 0.42, 0]];
  tubeAlong(cane, hk, 0.05, cm);
  // sugar cubes riding the cane
  const r = rng(5); for (let i = 0; i < 4; i++) { const c = box(cane, mat('#ffffff', { roughness: 0.9 }), [0.17, 0.17, 0.17], [0.55 + i * 0.4, 0.14 + 0.08 * (i % 2), 0.08], [r(), r(), r()]); }
  const gl = label('GalNAc', { w: 0.75, h: 0.28, size: 0.4, bg: '#fff6df' }); gl.position.set(1.2, -0.28, 0.1); cane.add(gl);
  cane.position.set(-0.1, 2.0, 0.6); cane.rotation.z = -0.08;
  // hook caught on liver ring: move cane so hook end at ring
  const crow = createCrow({ scale: 1.6 }); crow.position.set(-1.0, 1.15, 0.7); crow.rotation.y = 0.4; S.add(crow);
  crow.userData.pose({ lean: 0.1, beak: 0.12, headYaw: -0.2, headTilt: 0.08, wing: { l: [1.5, 0.0, 0.3], r: [1.5, 0.3, 0.3] } });
  for (const k of ['l', 'r']) crow.userData.parts.legs[k].rotation.x = -0.9;
  chestTag(crow, 'KRRO');
  // cane held in beak: position start at beak
  crow.updateMatrixWorld(true);
  const bw = crow.userData.parts.beak.getWorldPosition(new THREE.Vector3());
  cane.position.set(bw.x + 0.2, bw.y - 0.05, bw.z + 0.2); cane.rotation.set(0, -0.15, 0.0);
  const tg = cane.position.clone().add(new THREE.Vector3(2.2, 0.28, 0)); liver.position.set(tg.x + 0.25, tg.y - 0.5, tg.z - 0.2); plinth.scale.y = 1; plinth.position.set(liver.position.x, (liver.position.y - 0.45) / 2, liver.position.z); plinth.scale.set(1, (liver.position.y - 0.45) / 0.7, 1);
  finishScene(stage, crow, [0.5, 2.6, 6.6], [0.5, 1.5, 0]);
